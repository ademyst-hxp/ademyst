import type { PostVisibility } from "~~/shared/models/interactions";

import {
	RocketLaunchIcon,
	GlobeAltIcon,
	UserGroupIcon,
	HeartIcon,
	EyeSlashIcon,
} from "@heroicons/vue/24/outline";

export const VISIBILITIES = {
	outside: {
		icon: RocketLaunchIcon,
		label: "Essai",
		description: "Visible pour tout le monde sauf vos abonnés.",
	},
	everyone: {
		icon: GlobeAltIcon,
		label: "Tout le monde",
		description: "Visible pour tout le monde.",
	},
	followers: {
		icon: UserGroupIcon,
		label: "Abonnés",
		description: "Visible uniquement pour vos abonnés.",
	},
	friends: {
		icon: HeartIcon,
		label: "Amis",
		description: "Visible uniquement pour vos amis.",
	},
	me: {
		icon: EyeSlashIcon,
		label: "Privé",
		description: "Visible uniquement pour vous.",
	},
} as const satisfies Record<
	PostVisibility,
	{ icon: any; label: string; description?: string }
>;

export const VISIBILITY_OPTIONS = Object.entries(VISIBILITIES).map(
	([value, { icon, label, description }]) => ({
		value,
		icon,
		label,
		description,
	}),
);
