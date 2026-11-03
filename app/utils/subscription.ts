import type {
	BadgeEntitlement,
	LevelEntitlement,
} from "~~/shared/models/entitlements";

export const PREMIUM_LEVEL = 4;
export const VERIFIED_LEVEL = 5;
export const MODERATION_MIN_LEVEL = 6;

// Badges of the "Vérifié" tier. The ids must match the `badges.id` column:
// adjust them here if they differ in the database.
export const VERIFIED_BADGES = [
	{
		id: "certification",
		name: "Certifié(e)",
		description:
			"Ce badge est accordé aux comptes dont l'identité a été vérifiée.",
	},
	{
		id: "celebrity",
		name: "Célébrité",
		description:
			"Ce badge est accordé aux membres ayant une grande influence sur l'opinion publique.",
	},
	{
		id: "official",
		name: "Personnalité politique",
		description: "Ce badge est accordé aux personnalités politiques.",
	},
	{
		id: "official_fr",
		name: "Élu de la République",
		description:
			"Ce badge est accordé aux élus Français.",
	},
] as const;

export type EntitlementStatus = "active" | "disabled" | "expired" | "revoked";

export const getEntitlementStatus = (
	entitlement: LevelEntitlement | BadgeEntitlement,
): EntitlementStatus => {
	if (entitlement.revoked) return "revoked";

	if (
		entitlement.expiresAt &&
		new Date(entitlement.expiresAt).getTime() <= Date.now()
	) {
		return "expired";
	}

	return entitlement.enabled ? "active" : "disabled";
};

export const ENTITLEMENT_STATUS_LABELS: Record<
	EntitlementStatus,
	{ label: string; class: string }
> = {
	active: { label: "Actif", class: "text-success" },
	disabled: { label: "Désactivé", class: "text-warning" },
	expired: { label: "Expiré", class: "text-muted" },
	revoked: { label: "Révoqué", class: "text-danger" },
};

export const formatEntitlementDate = (value: string | Date | null) =>
	value
		? new Date(value).toLocaleString("fr-FR", {
				day: "2-digit",
				month: "long",
				year: "numeric",
				hour: "2-digit",
				minute: "2-digit",
			})
		: null;
