import { badges_families, badges, levels } from "../../server/db/schema/shop";
import type { Badge as DbBadge } from "../../server/db/schema/shop";
import type { BadgeFamily as DbBadgeFamily } from "../../server/db/schema/shop";
import type { Level as DbLevel } from "../../server/db/schema/shop";
import { drizzle } from "drizzle-orm/postgres-js";

import { LEVELS } from "../../shared/consts/labels";

import postgres from "postgres";

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
	...Object.entries(LEVELS).map(([level, { label, description }]) => ({
		id: parseInt(level, 10),
		name: label,
		description: description || null,
		createdAt: new Date(),
	})),
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
		family: "certifications",
		rarity: "unclassified",
		color: "#0081FA",
		createdAt: new Date(),
	},
	{
		id: "celebrity",
		name: "Célébrité",
		description:
			"Ce badge est accordé aux membres ayant une grande influence sur l'opinion publique.",
		family: "certifications",
		rarity: "unclassified",
		color: "#AC910E",
		createdAt: new Date(),
	},
	{
		id: "official",
		name: "Personnalité Politique",
		description: "Ce badge est accordé aux personnalités politiques.",
		family: "certifications",
		rarity: "unclassified",
		color: "#AABBCB",
		createdAt: new Date(),
	},
	{
		id: "official_fr",
		name: "Élu de la République Française",
		description:
			"Ce badge est accordée aux élus de la République Française.",
		family: "certifications",
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
		description: "Ce badge est accordé aux membres de l'équipe d'Ademyst.",
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
	{
		id: "parrain",
		name: "Parrain",
		description:
			"Ce badge est accordé aux membres ayant parrainé au moins une personne.",
		family: "reward",
		rarity: "rare",
		color: "#E22E6D",
		createdAt: new Date(),
	},
	{
		id: "me_and_my_friends",
		name: "Mes Amis et Moi",
		description:
			"Ce badge est accordé aux membres ayant parrainé au moins 5 personnes.",
		family: "reward",
		rarity: "epic",
		color: "#133F87",
		createdAt: new Date(),
	},
	{
		id: "the_ambassador",
		name: "Ambassadeur",
		description:
			"Ce badge est accordé aux membres ayant parrainé au moins 20 personnes.",
		family: "reward",
		rarity: "collector",
		color: "#FF7050",
		createdAt: new Date(),
	},
	{
		id: "the_user_trader",
		name: "Le Trafficant d'Utilisateurs",
		description:
			"Ce badge est accordé aux membres ayant parrainé au moins 50 personnes.",
		family: "reward",
		rarity: "legendary",
		color: "#B3A557",
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
