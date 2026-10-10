# Optimisations de performance — journal des démarches

Date : 9 octobre 2026

Ce document retrace, dans l'ordre, tout ce qui a été fait pour corriger la lenteur du site : le diagnostic, la méthode, chaque modification, les tests, les pièges rencontrés et ce qu'il reste à faire.

## En bref

- **Cause principale** : chaque fonction serveur ouvrait sa propre connexion Postgres. Une page Discover en ouvrait plusieurs centaines.
- **Correction** : une seule connexion par requête, partagée par le handler et tous ses helpers.
- **Résultat mesuré en local** : 1 connexion par appel d'API, 4 pour le rendu complet de Discover.
- **Non fait** : rien n'a été testé sur la vraie base ni déployé. Les index sont dans le schéma mais pas encore appliqués à la base.

---

## 1. Diagnostic

Le diagnostic a été fait à la lecture du code, sans mesure en production (pas d'URL ni de `.env` disponibles).

### 1.1 Une connexion Postgres par helper

`createDb()` créait un nouveau client à chaque appel, et il était appelé 122 fois dans 98 fichiers. Chaque helper ouvrait donc une connexion (TCP + TLS + authentification), faisait une ou deux requêtes, puis la refermait.

Pour un seul appel à `/feed/posts/suggestions` :

| Étape | Connexions |
|---|---|
| `requireAuth` (`getIdentity` + `getUser`) | 2 |
| Handler + `retrieveSeveralCleanPosts` | 2 |
| `retrieveSeveralCleanProfiles` | 1 |
| Relations + confidentialité, calculées deux fois | 4 |
| Badges, dans une boucle `for` avec `await` | jusqu'à 2 par auteur |

Deux facteurs aggravaient la situation :

- `max: 1` sur le client : les `Promise.all` de requêtes s'exécutaient en série sur chaque connexion.
- Cloudflare limite un Worker à 6 connexions simultanées par requête, donc les connexions imbriquées faisaient la queue.

### 1.2 La page Discover multipliait le problème

- `await refreshSession()` et `await refresh()` étaient appelés directement dans le `setup`, sans `useAsyncData`. Tout s'exécutait une fois côté serveur, puis une seconde fois dans le navigateur à l'hydratation.
- `refresh()` chargeait 5 endpoints d'un coup, dont 3 flux de 100 posts, alors qu'un seul onglet est visible.
- La barre de navigation relançait encore `/auth/me`.

### 1.3 Causes secondaires

- Aucun index explicite dans le schéma de la base.
- Chaque `<img>` d'avatar déclenchait une requête en base, un appel S3 et une redirection vers une URL signée différente à chaque fois, donc impossible à mettre en cache.
- Toutes les lignes de `post_reactions` étaient chargées pour être comptées en JavaScript.
- Polices en `.ttf`, deux `@import` Google Fonts bloquants, image de fond de 978 Ko.

### 1.4 Bug repéré au passage

Un `.limit(1)` sur des requêtes portant sur plusieurs profils (`getSeveralPrivacySettings`, `getSeveralInteractionStatus`) : un seul profil récupérait ses vrais réglages, les autres retombaient sur la valeur par défaut `"me"` et apparaissaient masqués.

---

## 2. Préparation

Le dossier n'est pas un dépôt git, donc aucun filet de sécurité natif. Avant toute modification :

1. **Sauvegarde** de `server/`, `app/`, `shared/`, `public/`, `nuxt.config.ts` et `package.json` dans un dossier temporaire hors du projet.
2. **`npm install`** : `node_modules` n'existait pas, impossible de compiler sans.
3. **Typecheck de référence** avant modification, pour distinguer les erreurs existantes des nouvelles :
   - serveur : 6 erreurs, toutes dans `server/utils/converters/inbox.ts` ;
   - application : 15 erreurs.

TypeScript n'étant pas une dépendance du projet, il a été installé dans le dossier temporaire, sans toucher à `package.json`.

---

## 3. Modifications

### 3.1 Une connexion par requête

**Nouveau mécanisme**

- `server/db/index.ts` : `useDb(event)` crée la connexion au premier appel et la mémorise dans `event.context.db`. Tous les appels suivants de la même requête la réutilisent.
- `server/plugins/db.ts` (nouveau) : ferme la connexion à la fin de la requête, via les hooks Nitro `afterResponse` et `error`. Le second est nécessaire car un handler qui lève une erreur ne passe jamais par `afterResponse`.
- `idle_timeout: 20` sur le client, comme filet de sécurité si une requête ne se termine jamais.

**Réécriture des appels**

Le motif était identique partout :

```ts
const { db, client } = createDb();

try {
	// ...
} finally {
	await client.end();
}
```

Il devient :

```ts
const db = useDb(event);

// ...
```

Un script a fait cette transformation : 97 fichiers modifiés, 120 blocs `try/finally` retirés, 1 bloc `try/catch` conservé (dans `getIdentity`). Le script refusait de toucher un fichier dont l'indentation ne correspondait pas au motif attendu.

**Piège : les transactions**

Avec une seule connexion, un helper qui interroge la base *pendant* qu'une transaction est ouverte attend indéfiniment la connexion que la transaction occupe. Les 8 transactions du projet ont été relues une par une. Une seule posait problème : dans `server/api/v1/auth/signup.post.ts`, `giveReferralBadge` était appelée à l'intérieur de la transaction d'inscription.

Corrections dans `server/jobs/signup.ts` :

- `giveReferralBadge` reçoit maintenant la transaction en paramètre et travaille dessus.
- Priorité d'opérateurs corrigée à 4 endroits : `referralCount?.count ?? 0 < 5` était évalué comme `count ?? (0 < 5)`. Sans cette correction, la fonction — désormais débloquée — aurait attribué les 4 badges de parrainage à chaque inscrit parrainé.

### 3.2 Requêtes

Dans `server/utils/converters/profiles.ts` :

- Les badges de tous les profils sont résolus en une seule requête, au lieu de deux requêtes par profil dans une boucle.
- `retrieveSeveralCleanProfiles` accepte les relations et la confidentialité déjà calculées par l'appelant.

Dans `server/utils/converters/interactions.ts` :

- Relations et confidentialité ne sont plus calculées deux fois pour les posts et les whispers.
- Les likes sont comptés en SQL (`count ... group by`), avec une requête séparée pour savoir si l'utilisateur courant a liké.

### 3.3 Correction des `.limit(1)`

Retirés dans `server/utils/helpers/privacy.ts` et `server/utils/helpers/interaction.ts`.

### 3.4 Index

22 index ajoutés au schéma Drizzle, uniquement non uniques pour ne pas risquer d'échec sur des doublons existants :

| Table | Colonnes |
|---|---|
| `sessions` | `account_id` |
| `profiles` | `account_id` |
| `profile_links` | `profile_id` |
| `posts` | `created_at` ; `profile_id` ; `parent_id` |
| `post_reactions` | `(post_id, profile_id)` |
| `post_flags` | `post_id` |
| `whispers` | `created_at` ; `profile_id` |
| `whisper_reactions` | `(whisper_id, profile_id)` |
| `follows` | `(follower_id, following_id)` ; `following_id` |
| `friendships` | `(profile_a_id, profile_b_id)` ; `profile_b_id` |
| `blocks` | `(blocker_id, blocked_id)` ; `blocked_id` |
| `attachments` | `post_id` |
| `badges_entitlements` | `profile_id` |
| `levels_entitlements` | `profile_id` |
| `post_reports` | `reported_post_id` |
| `privacy_settings` | `account_id` |

### 3.5 Avatars et icônes de badge

Un en-tête `Cache-Control` est posé sur la redirection : 5 minutes pour les avatars, 1 heure pour les badges. Il n'est posé que sur les redirections réussies, jamais sur une réponse d'erreur.

### 3.6 Côté navigateur

- `app/composables/useAuthSession.ts` : les appels simultanés à `refresh()` partagent une seule requête `/auth/me`, et l'appel n'est pas rejoué à l'hydratation si le serveur l'a déjà fait.
- `app/composables/useFeed.ts` : `refresh(tab)` ne charge que les whispers, les profils suggérés et les posts de l'onglet demandé. `loadTab(tab)` charge un autre onglet à sa première ouverture.
- `app/pages/discover/index.vue` : chargement via `useAsyncData`, donc une seule fois côté serveur.

### 3.7 Assets

| Fichier | Avant | Après |
|---|---|---|
| `InstrumentSans-Variable` | 193 Ko (`.ttf`) | 88 Ko (`.woff2`) |
| `InstrumentSans-Italic-Variable` | 201 Ko | 94 Ko |
| `Outfit-VariableFont_wght` | 111 Ko | 45 Ko |
| `splash_1` | 978 Ko (`.png`) | 29 Ko (`.webp`) |

- Les axes variables des polices ont été vérifiés après conversion.
- Les `.ttf` sont conservés comme source de repli dans `fonts.css`. Le `.png` d'origine est conservé mais n'est plus référencé.
- Les deux `@import` Google Fonts sont remplacés par un `<link>` avec `preconnect` dans `nuxt.config.ts`.

---

## 4. Vérifications

### 4.1 Statique

- Typecheck serveur : 6 erreurs, les mêmes qu'au départ.
- Typecheck application : 15 erreurs, les mêmes qu'au départ.
- `nuxt build` : OK.

### 4.2 Base de test

Aucune base locale n'étant disponible, une base temporaire a été montée hors du projet, avec des données de test (3 comptes, posts, likes, badges, abonnements, un profil privé) et un jeton de test.

**Premier essai avec PGlite** (Postgres embarqué en WebAssembly). Les appels d'API un par un fonctionnaient, mais le rendu de Discover produisait une erreur `RangeError` sur `/feed/posts/following`.

Pour savoir si l'erreur venait du code ou de la base de test, un script isolé a été écrit, sans aucun code de l'application, ouvrant des connexions `postgres.js` vers cette base :

| Mode | PGlite | Vrai PostgreSQL |
|---|---|---|
| Connexions l'une après l'autre | 30 réussies, 0 échec | 30 réussies, 0 échec |
| Connexions simultanées | 19 réussies, 11 échecs | 30 réussies, 0 échec |

PGlite partage un seul backend entre toutes les connexions, ce qu'un vrai Postgres ne fait pas. L'erreur venait donc de l'outil de test. Tous les tests ont été refaits sur un vrai PostgreSQL temporaire.

Le schéma, avec ses 22 index, s'applique sans erreur sur les deux.

### 4.3 Mesures

Le nombre de connexions a été lu dans les statistiques de PostgreSQL, après calibrage sur un nombre connu (61 mesurées pour 60 connexions + la sonde).

**Appels d'API** — même résultat en mode dev et avec le build de production dans le runtime Cloudflare local (workerd) :

| Endpoint | Statut | Connexions | Restées ouvertes |
|---|---|---|---|
| `/auth/me` | 200 | 1 | 0 |
| `/feed/posts/suggestions`, `following`, `hits` | 200 | 1 | 0 |
| `/feed/whispers`, `/feed/users` | 200 | 1 | 0 |
| `/users/bob`, `/posts/AAAAA1`, `/inbox/count` | 200 | 1 | 0 |
| `/users/nobody` (erreur) | 404 | 1 | 0 |
| `POST like` (transaction), `POST unlike` | 200 | 1 | 0 |
| `/auth/me` sans jeton | 401 | 0 | 0 |

**Rendu des pages côté serveur** :

| Page | Connexions | Temps (dev) | Temps (workerd) |
|---|---|---|---|
| `/discover` | 4 | 0,3 à 0,4 s | 0,6 à 1 s |
| `/@bob` | 5 | 0,8 s | 1,2 s |
| `/posts/AAAAA1` | 5 | 0,3 s | 0,9 s |
| `/inbox` | 2 | 0,4 s | 0,5 s |
| `/` | 1 | 0,2 s | 0,2 s |

Ces temps sont locaux, base sur la même machine. Ils ne prédisent pas ceux de la production.

**Charge simultanée dans workerd** : 24 requêtes lancées en même temps (12 pages Discover + 12 flux) → 24 réponses 200, exactement 60 connexions (12 × 4 + 12 × 1), 0 restée ouverte, 12 pages sur 12 correctement rendues, aucune erreur.

### 4.4 Exactitude des données

Les réponses ont été comparées aux données de test : compteurs de likes, état « liké », nombre de réponses, niveaux, badges avec leur famille, abonnés, signalements. Le profil privé apparaît masqué, les deux profils publics apparaissent complets, ce qui confirme la correction du `.limit(1)`.

Les réponses sont identiques entre le mode dev et workerd, à une différence près, vérifiée en base : le compteur de likes d'un post, modifié par le test like/unlike lui-même.

### 4.5 Navigateur

- Après hydratation de Discover, l'API Performance du navigateur ne montre aucun appel à `/auth/me` ni `/feed/*`, seulement les images.
- Premier clic sur « Suggestions » : un appel. Premier clic sur « Hits » : un appel. Retours sur un onglet déjà ouvert : aucun appel de flux.

Lors du tout premier chargement en mode dev, des appels en double sont apparus côté navigateur. Ils ne se sont pas reproduits sur un chargement propre. Le journal de Vite signalait au même moment des rechargements de page dus à la découverte de dépendances, propre au mode dev ; c'est l'explication la plus probable, sans preuve directe.

### 4.6 Audit des fichiers

Comparaison de chaque fichier avec la sauvegarde :

- 112 fichiers modifiés, 5 ajoutés, `package.json` inchangé.
- 90 fichiers ne contiennent que la transformation mécanique (vérifié ligne par ligne, 6 d'entre eux relus à la main).
- 22 fichiers modifiés à la main, listés en section 7.

---

## 5. Limites des tests

- **Aucun test sur la vraie base ni en production.** Le gain réel dépend de la latence entre le Worker et la base.
- **Cache des avatars non testé** : sans identifiants S3 en local, ces endpoints répondent 500 avant d'atteindre la redirection.
- **Inscription avec parrainage non testée** : elle dépend de la vérification Beam, service externe.

---

## 6. Ce qu'il reste à faire

### Appliquer les index

Avec `DIRECT_URL` défini :

```bash
npx drizzle-kit push
```

`npm run db:push` ne fonctionnera pas : il appelle `server/db/scripts/fix-level-id.mjs`, absent du dossier.

### Mettre le projet sous git

La sauvegarde des fichiers d'origine est dans un dossier temporaire qui peut disparaître.

```bash
git init
```

### Changements de comportement à connaître

- **Confidentialité** : chaque profil suit maintenant ses vrais réglages. Plus de profils complets apparaîtront dans les flux.
- **Avatar** : un nouvel avatar peut mettre jusqu'à 5 minutes à apparaître.
- **Onglets de Discover** : « Suggestions » et « Hits » se chargent au premier clic, avec un court délai.
- **`package-lock.json`** a été réécrit par `npm install`, sans copie de l'original.

### Non traité

- **Hyperdrive** (pool de connexions Cloudflare) : nécessite le compte Cloudflare. Ce serait le gain suivant le plus important.
- **`highlight.js`** reste chargé sur toutes les pages.
- **Badge de parrainage** : il est attribué au nouvel inscrit et non au parrain. Cela ressemble à un bug, non modifié.
- **Titre et onglets de Discover** : ils n'apparaissent qu'après hydratation, à cause du `<Teleport to="#header">`, ce qui provoque un avertissement d'hydratation. Existait déjà.
- **`Post.vue`** recharge le post parent à chaque montage du composant.
- **`splash_1.png`** n'est plus utilisé et peut être supprimé.

---

## 7. Fichiers modifiés à la main

**Serveur**

- `server/db/index.ts`
- `server/plugins/db.ts` (nouveau)
- `server/jobs/signup.ts`
- `server/api/v1/auth/signup.post.ts`
- `server/api/v1/users/[name]/avatar.webp.get.ts`
- `server/api/v1/badges/[id]/icon.png.get.ts`
- `server/utils/converters/profiles.ts`
- `server/utils/converters/interactions.ts`
- `server/utils/helpers/privacy.ts`
- `server/utils/helpers/interaction.ts`
- `server/db/schema/` : `accounts.ts`, `profiles.ts`, `interactions.ts`, `relations.ts`, `drive.ts`, `entitlements.ts`, `reports.ts`, `settings.ts`

**Application**

- `app/composables/useAuthSession.ts`
- `app/composables/useFeed.ts`
- `app/pages/discover/index.vue`
- `app/layouts/auth.vue`
- `app/assets/css/fonts.css`
- `nuxt.config.ts`

**Fichiers ajoutés dans `public/`**

- `public/fonts/InstrumentSans-Variable.woff2`
- `public/fonts/InstrumentSans-Italic-Variable.woff2`
- `public/fonts/Outfit-VariableFont_wght.woff2`
- `public/images/splash_1.webp`

**Créés par l'installation et le build** (tous ignorés par `.gitignore`) : `node_modules/`, `.nuxt/`, `.output/`.

Tous les serveurs et bases de test ont été arrêtés, et aucun fichier de test n'a été laissé dans le projet.
