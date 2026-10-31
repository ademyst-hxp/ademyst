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

// Niveaux de modération
export const LEVELS = {
	0: {
		label: "Banni.e",
		description:
			"Ce compte ne peut plus interagir avec la communauté. Il peut uniquement lire les publications visible par tout le monde.",
		badge: null,
	},
	1: {
		label: "Restreint.e",
		description:
			"Ce compte est en mode lecture seule. Il peut encore lire des publications et interagir avec, mais ne peut pas publier de contenu ni suivre de nouveaux comptes.",
		badge: null,
	},
	2: {
		label: "Shadowban",
		description:
			"Ce compte est invisible du grand public. Aucune de ses publications n'apparaîtra dans les fils de recommandation. Il peut toujours publier du contenu et interagir avec la communauté, et suivre de nouveaux comptes.",
		badge: null,
	},
	3: {
		label: "Membre",
		description: "Ce compte est sain et sans grade particulier.",
		badge: null,
	},
	4: {
		label: "Membre Premium",
		description:
			"Ce compte a accès à des fonctionnalités supplémentaires, à d'autres de manière prioritaire et peut publier du contenu plus long.",
		badge: null,
	},
	5: {
		label: "Membre Vérifié.e",
		description:
			"L'entité possédant ce compte a été vérifiée par l'équipe d'Ademyst. Celui-ci possède les avantages d'un compte Premium, publier du contenu plus long et avoir une visibilité accrue et traçable dans les fils de recommandation.",
		badge: null,
	},
	6: {
		label: "Aide Modération",
		description:
			"Ce compte aide la modération des contenus. Il a un accès aux signalements effectués par la communauté et peut modérer certains contenus. Il ne peut pas prononcer de sanctions concernant directement un compte.",
		badge: null,
	},
	7: {
		label: "Modérateur.trice",
		description:
			"Ce compte a des responsabilités de modération dans la communauté. Il peut accéder aux signalements et prononcer des sanctions lorsque nécessaire.",
		badge: "moderator",
	},
	8: {
		label: "Membre de l'équipe",
		description: "Niveau correspondant aux membres de l'équipe d'Ademyst.",
		badge: "team",
	},
	9: {
		label: "Fondateur",
		description: "Niveau correspondant au fondateur d'Ademyst.",
		badge: "fondateur",
	},
} as const satisfies Record<
	number,
	{ label: string; description: string; badge: string | null }
>;

export const getLevelInfo = (level: number) => {
	return (
		LEVELS[level as keyof typeof LEVELS] ?? {
			label: "Inconnu",
			description: "Niveau inconnu.",
			badge: null,
		}
	);
};
