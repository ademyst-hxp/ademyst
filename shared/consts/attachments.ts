import {
	DocumentIcon,
	GlobeAltIcon,
	LinkIcon,
	MusicalNoteIcon,
	PhotoIcon,
	SparklesIcon,
	VideoCameraIcon,
} from "@heroicons/vue/24/outline";

import type { AttachmentGroup, AttachmentType } from "~~/shared/models/drive";

// Libellés et icônes (les règles métier sont dans ATTACHMENT_RULES)
export const ATTACHMENT_TYPES = {
	image: { icon: PhotoIcon, label: "Image" },
	video: { icon: VideoCameraIcon, label: "Vidéo" },
	gif: { icon: SparklesIcon, label: "GIF" },
	link: { icon: LinkIcon, label: "Lien" },
	audio: { icon: MusicalNoteIcon, label: "Fichier audio" },
	other: { icon: DocumentIcon, label: "Fichier non pris en charge" },
} as const satisfies Record<AttachmentType, { icon: any; label: string }>;

// Groupes vus par l'utilisateur : médias, GIFs, liens et autres n'ont rien à voir.
export const ATTACHMENT_GROUPS = {
	media: {
		icon: PhotoIcon,
		label: "Médias",
		description: "Images et vidéos affichées avec votre publication.",
		types: ["image", "video"],
	},
	gifs: {
		icon: SparklesIcon,
		label: "GIFs",
		description: "GIFs animés issus d'un service externe.",
		types: ["gif"],
	},
	links: {
		icon: GlobeAltIcon,
		label: "Liens",
		description: "Liens affichés sous votre publication.",
		types: ["link"],
	},
	others: {
		icon: DocumentIcon,
		label: "Autres",
		description: "Fichiers audio et fichiers non pris en charge.",
		types: ["audio", "other"],
	},
} as const satisfies Record<
	AttachmentGroup,
	{
		icon: any;
		label: string;
		description: string;
		types: readonly AttachmentType[];
	}
>;
