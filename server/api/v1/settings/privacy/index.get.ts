import type { H3Event } from "h3";

import { createDb } from "#server/db";
import { eq } from "drizzle-orm";

import { privacySettings } from "#server/db/schema/settings";
import type { PrivacySettings, Visibility } from "#shared/models/settings";

import { requireAuth } from "~~/server/utils/middleware/auth";

function generateDefaultPrivacySettings(): PrivacySettings {
	return {
		profileVisibility: "everyone",
		birthdayVisibility: "friends",
		termsOfServiceConsent: false,
		privacyPolicyConsent: false,
		createdAt: new Date(),
		updatedAt: new Date(),
	};
}

export default defineEventHandler(async (event: H3Event) => {
	const { db, client } = createDb();

	try {
		const identity = await requireAuth(event);

		const [settings] = await db
			.select()
			.from(privacySettings)
			.where(eq(privacySettings.accountId, identity.accountId))
			.limit(1);

		if (!settings) {
			const defaultSettings =
				generateDefaultPrivacySettings() as PrivacySettings & {
					profileVisibility: Visibility;
					birthdayVisibility: Visibility;
				};

			await db.insert(privacySettings).values({
				...defaultSettings,
				accountId: identity.accountId,
			});

			return {
				status: "ok",
				settings: defaultSettings,
			};
		}

		return {
			status: "ok",
			settings,
		};
	} finally {
		await client.end();
	}
});
