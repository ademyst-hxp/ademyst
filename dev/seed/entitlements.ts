import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";

import type {
	Badge as DbBadge,
	BadgeFamily as DbBadgeFamily,
	Level as DbLevel,
} from "../server/db/schema/shop";

import { levels, badges, badges_families } from "../server/db/schema/shop";

const databaseUrl = process.env.DATABASE_URL;
console.log("Seeding database with URL:", databaseUrl);

if (!databaseUrl) {
	throw new Error("No database connection found (DATABASE_URL)");
}

const client = postgres(databaseUrl, {
	prepare: false,
	max: 5,
	fetch_types: false,
});

const db = drizzle(client);

const levelsToPut: Omit<DbLevel, "updatedAt">[] = [
	{
		id: 0,
		name: "Banni",
		description:
			"Ce compte ne peut plus interagir avec la communauté. Il peut uniquement lire les publications visible par tout le monde, et changer ses paramètres de compte.",
		createdAt: new Date(),
	},
	{
		id: 1,
		name: "Restreint",
		description:
			"Ce compte est en mode lecture seule. Il peut encore lire des publications et interagir avec, mais ne peut pas publier de contenu ni suivre de nouveaux comptes.",
		createdAt: new Date(),
	},
	{
		id: 2,
		name: "Invisible",
		description:
			"Ce compte est invisible du grand public. Aucune de ses publications n'apparaîtra dans les fils de recommandation. Il peut toujours publier du contenu et interagir avec la communauté, et suivre de nouveaux comptes.",
		createdAt: new Date(),
	},
	{
		id: 3,
		name: "Membre",
		description: "Ce compte est sain et sans grade particulier.",
		createdAt: new Date(),
	},
	{
		id: 4,
		name: "Membre Premium",
		description:
			"Ce compte a accès à des fonctionnalités supplémentaires, à d'autres de manière prioritaire et peut publier du contenu plus long.",
		createdAt: new Date(),
	},
	{
		id: 5,
		name: "Membre Vérifié",
		description:
			"L'entité possédant ce compte a été vérifiée par l'équipe d'Ademyst. Celui-ci possède les avantages d'un compte Premium, publier du contenu plus long et avoir une visibilité accrue et traçable dans les fils de recommandation.",
		createdAt: new Date(),
	},
	{
		id: 6,
		name: "Aide à la Modération",
		description:
			"Ce compte aide la modération des contenus. Il a un accès aux signalements effectués par la communauté et peut modérer certains contenus. Il ne peut pas prononcer de sanctions concernant directement un compte.",
		createdAt: new Date(),
	},
	{
		id: 7,
		name: "Modérateur",
		description:
			"Ce compte a des responsabilités de modération dans la communauté. Il peut accéder aux signalements et prononcer des sanctions lorsque nécessaire.",
		createdAt: new Date(),
	},
	{
		id: 8,
		name: "Équipe",
		description: "Niveau correspondant aux membres de l'équipe d'Ademyst.",
		createdAt: new Date(),
	},
	{
		id: 9,
		name: "Fondateur",
		description: "Niveau correspondant au fondateur d'Ademyst.",
		createdAt: new Date(),
	},
];

const familiesToPut: Omit<DbBadgeFamily, "updatedAt">[] = [
	{
		id: "level",
		name: "Grades",
		description:
			"Famille de badges correspondant aux différents grades des membres.",
		createdAt: new Date(),
	},
	{
		id: "certification",
		name: "Certifications",
		description:
			"Famille de badges correspondant aux différentes certifications des membres.",
		createdAt: new Date(),
	},
	{
		id: "title",
		name: "Titres",
		description:
			"Famille de badges correspondant aux différents titres des membres.",
		createdAt: new Date(),
	},
	{
		id: "reward",
		name: "Récompenses",
		description:
			"Famille de badges correspondant aux différentes récompenses des membres.",
		createdAt: new Date(),
	},
];

const badgesToPut: Omit<DbBadge, "updatedAt">[] = [
	{
		id: "the_hundred",
		name: "Les 100",
		description:
			"Ce badge est accordé aux 100 premiers membres de la communauté.",
		family: "title",
		rarity: "legendary",
		color: "#BB1A34",
		createdAt: new Date(),
	},
	{
		id: "early_bird",
		name: "Early Bird",
		description:
			"Ce badge est accordé aux membres ayant rejoint la communauté dès les deux premiers mois.",
		family: "title",
		rarity: "collector",
		color: "#3CC900",
		createdAt: new Date(),
	},
	{
		id: "first_hour",
		name: "Première Heure",
		description:
			"Ce badge est accordé aux membres de Beam, première version d'Ademyst.",
		family: "title",
		rarity: "legendary",
		color: "#D013FF",
		createdAt: new Date(),
	},
	{
		id: "prestige",
		name: "Prestige",
		description:
			"Ce badge est accordé aux membres ayant une importance aux yeux d'Ademyst.",
		family: "title",
		rarity: "legendary",
		color: "#C19342",
		createdAt: new Date(),
	},
	{
		id: "certification",
		name: "Certifié(e)",
		description:
			"Ce badge est accordé aux comptes dont l'identité a été vérifiée.",
		family: "certification",
		rarity: "unclassified",
		color: "#0081FA",
		createdAt: new Date(),
	},
	{
		id: "celebrity",
		name: "Célébrité",
		description:
			"Ce badge est accordé aux membres ayant une grande influence sur l'opinion publique.",
		family: "certification",
		rarity: "unclassified",
		color: "#AC910E",
		createdAt: new Date(),
	},
	{
		id: "official",
		name: "Personnalité Politique",
		description: "Ce badge est accordé aux personnalités politiques.",
		family: "certification",
		rarity: "unclassified",
		color: "#AABBCB",
		createdAt: new Date(),
	},
	{
		id: "official_fr",
		name: "Élu de la République Française",
		description:
			"Ce badge est accordée aux élus de la République Française.",
		family: "certification",
		rarity: "unclassified",
		color: "#061242",
		createdAt: new Date(),
	},
	{
		id: "moderator",
		name: "Modérateur",
		description: "Ce badge est accordé aux modérateurs de la communauté.",
		family: "level",
		rarity: "unclassified",
		color: "#1DA9E9",
		createdAt: new Date(),
	},
	{
		id: "team",
		name: "Membre de l'Équipe",
		description:
			"Ce badge est accordé aux membres de l'équipe d'Ademyst.",
		family: "level",
		rarity: "unclassified",
		color: "#00A045",
		createdAt: new Date(),
	},
	{
		id: "fondateur",
		name: "Fondateur",
		description: "Ce badge est accordé au fondateur d'Ademyst.",
		family: "level",
		rarity: "unclassified",
		color: "#C00200",
		createdAt: new Date(),
	},
];

async function seed() {
	try {
		await db
			.insert(levels)
			.values(levelsToPut)
			.onConflictDoUpdate({
				target: levels.id,
				set: {
					name: levels.name,
					description: levels.description,
					createdAt: levels.createdAt,
				},
			});

		await db
			.insert(badges_families)
			.values(familiesToPut)
			.onConflictDoUpdate({
				target: badges_families.id,
				set: {
					name: badges_families.name,
					description: badges_families.description,
					createdAt: badges_families.createdAt,
				},
			});

		await db
			.insert(badges)
			.values(badgesToPut)
			.onConflictDoUpdate({
				target: badges.id,
				set: {
					name: badges.name,
					description: badges.description,
					family: badges.family,
					rarity: badges.rarity,
					color: badges.color,
					createdAt: badges.createdAt,
				},
			});

		console.log("Database seeded successfully.");
	} finally {
		await client.end();
	}
}

await seed();
