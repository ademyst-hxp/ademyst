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
		name: "Membre Banni",
		description:
			"Niveau correspondant aux membres bannis de manière définitive.",
		createdAt: new Date(),
	},
	{
		id: 1,
		name: "Membre en Sourdine",
		description:
			"Niveau correspondant aux membres en sourdine, ne pouvant pas publier de contenu.",
		createdAt: new Date(),
	},
	{
		id: 2,
		name: "Membre Restreint",
		description:
			"Niveau correspondant aux membres restreints, ayant des restrictions sur leur visibilité.",
		createdAt: new Date(),
	},
	{
		id: 3,
		name: "Membre",
		description: "Niveau correspondant aux membres normaux.",
		createdAt: new Date(),
	},
	{
		id: 4,
		name: "Membre Premium",
		description:
			"Niveau correspondant aux membres ayant payé un abonnement ou obtenu une distinction.",
		createdAt: new Date(),
	},
	{
		id: 5,
		name: "Membre Vérifié",
		description:
			"Niveau correspondant aux membres ayant une forte influence sur les autres plateformes.",
		createdAt: new Date(),
	},
	{
		id: 6,
		name: "Aide à la Modération",
		description:
			"Niveau correspondant aux membres aidant à la modération des contenus.",
		createdAt: new Date(),
	},
	{
		id: 7,
		name: "Modérateur",
		description: "Niveau correspondant aux modérateurs de la communauté.",
		createdAt: new Date(),
	},
	{
		id: 8,
		name: "Équipe",
		description: "Niveau correspondant aux membres de l'équipe d'Ademyst.",
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
		id: "certifications",
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
		description: "Membres faisant partie des 100 premiers.",
		family: "title",
		rarity: "legendary",
		color: "#9F000B",
		createdAt: new Date(),
	},
	{
		id: "early_bird",
		name: "Early Bird",
		description:
			"Membres ayant rejoint la communauté dès les deux premiers mois.",
		family: "title",
		rarity: "collector",
		color: "#3CC900",
		createdAt: new Date(),
	},
	{
		id: "first_hour",
		name: "Première Heure",
		description: "Anciens de Beam",
		family: "title",
		rarity: "legendary",
		color: "#D013FF",
		createdAt: new Date(),
	},
	{
		id: "prestige",
		name: "Prestige",
		description:
			"Distinction accordée aux membres ayant une importance aux yeux d'Ademyst.",
		family: "title",
		rarity: "legendary",
		color: "#C19342",
		createdAt: new Date(),
	},
	{
		id: "certification",
		name: "Certifié(e)",
		description:
			"Distinction accordée aux comptes représentant réellement la personne ou l'entité qu'ils prétendent représenter.",
		family: "certifications",
		rarity: "unclassified",
		color: "#0081FA",
		createdAt: new Date(),
	},
	{
		id: "celebrity",
		name: "Célébrité",
		description:
			"Distinction accordée aux membres ayant une grande influence sur l'opinion publique.",
		family: "certifications",
		rarity: "unclassified",
		color: "#AC910E",
		createdAt: new Date(),
	},
	{
		id: "official",
		name: "Personnalité Politique",
		description: "Distinction accordée aux personnalités politiques.",
		family: "certifications",
		rarity: "unclassified",
		color: "#AABBCB",
		createdAt: new Date(),
	},
	{
		id: "official_fr",
		name: "Élu de la République Française",
		description:
			"Distinction accordée aux élus de la République Française.",
		family: "certifications",
		rarity: "unclassified",
		color: "#061242",
		createdAt: new Date(),
	},
	{
		id: "moderator",
		name: "Modérateur",
		description: "Distinction accordée aux modérateurs de la communauté.",
		family: "level",
		rarity: "unclassified",
		color: "#1DA9E9",
		createdAt: new Date(),
	},
	{
		id: "team",
		name: "Membre de l'Équipe",
		description:
			"Distinction accordée aux membres de l'équipe de gestion d'Ademyst.",
		family: "level",
		rarity: "unclassified",
		color: "#00B6AC",
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
