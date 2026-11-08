<script setup lang="ts">
import {
	AdjustmentsHorizontalIcon,
	LinkIcon,
	PhotoIcon,
	XMarkIcon,
} from "@heroicons/vue/24/outline";

import type { Attachment } from "~~/shared/models/drive";
import type { Post } from "~~/shared/models/interactions";
import { VISIBILITY_OPTIONS } from "~~/shared/consts/labels";
import {
	ATTACHMENT_MAX_FILE_SIZE,
	ATTACHMENT_RULES,
} from "~~/shared/consts/specs";
import {
	getLinkDomain,
	getRemainingSlots,
	groupAttachments,
} from "~~/shared/utils/attachments";
import { getPostSpecs } from "~~/shared/utils/interactions";

import AttachmentBanner from "~/components/interactions/AttachmentBanner.vue";
import Media from "~/components/interactions/Media.vue";
import PostBox from "~/components/interactions/Post.vue";
import SocialIcon from "~/components/profile/SocialIcon.vue";

import InfoBox from "~/components/boxes/Info.vue";
import WarningBox from "~/components/boxes/Warning.vue";

/* -------------------------------------------------------------------------- */
/*  Constantes                                                                */
/* -------------------------------------------------------------------------- */

type Tab = "write" | "preview";
type Visibility = Post["visibility"];
type EditableFlag = "NFE" | "AI" | "joke" | "suicide";

const PAGE_TITLE = "Écrire un post | Ademyst";
const PAGE_DESCRIPTION =
	"Exprimez-vous et partagez vos idées avec la communauté Ademyst en écrivant un post.";

const TABS: { name: string; value: Tab }[] = [
	{ name: "Écrire", value: "write" },
	{ name: "Aperçu", value: "preview" },
];

const EDITABLE_FLAGS: { key: EditableFlag; label: string; hint: string }[] = [
	{
		key: "NFE",
		label: "Contenu sensible",
		hint: "Masqué par défaut derrière un avertissement.",
	},
	{
		key: "AI",
		label: "Généré par IA",
		hint: "Le texte ou les images ont été produits par une IA.",
	},
	{
		key: "joke",
		label: "Humoristique",
		hint: "Évite que le message soit pris au premier degré.",
	},
	{
		key: "suicide",
		label: "Suicide ou auto-mutilation",
		hint: "Affiche des ressources d'aide avec la publication.",
	},
];

const VISIBILITY_DESCRIPTIONS: Record<Visibility, string> = {
	outside:
		"Visible par tout le monde sauf vos abonnés. Idéal pour tester votre contenu hors de votre public habituel.",
	everyone:
		"Visible par tout le monde, même sans compte. Seuls les membres Ademyst peuvent réagir.",
	followers: "Visible uniquement par vos abonnés.",
	friends: "Visible uniquement par vos amis.",
	me: "Visible uniquement par vous.",
};

/* -------------------------------------------------------------------------- */
/*  Page, session et navigation                                               */
/* -------------------------------------------------------------------------- */

const { $api } = useNuxtApp();
const { session, refresh } = useAuthSession();
await refresh();

if (!session.value) {
	navigateTo("/auth/login");
}

definePageMeta({
	title: PAGE_TITLE,
	description: PAGE_DESCRIPTION,
	middleware: ["auth"],
});

useHead({
	title: PAGE_TITLE,
	meta: [
		{ name: "description", content: PAGE_DESCRIPTION },
		{ name: "keywords", content: "Beam, Ademyst, Discover" },
		{ name: "author", content: "Ejnalo" },
		{ name: "viewport", content: "width=device-width, initial-scale=1.0" },
	],
});

const route = useRoute();
const { parent: parentPostId, edit: editPostId } = route.query as {
	parent?: string;
	edit?: string;
};

const isEditing = !!editPostId;
const tab = ref<Tab>("write");
const error = ref<string | null>(null);

/* -------------------------------------------------------------------------- */
/*  Publication en cours de rédaction                                         */
/* -------------------------------------------------------------------------- */

const specs = computed(() => getPostSpecs(session.value!.profile.level));
const limit = computed(() => specs.value.max_length);

const preparingPost = ref<Post>({
	id: "0",
	profile: session.value!.profile,
	parentId: parentPostId || null,
	visibility: "everyone",
	content: "",
	createdAt: new Date(),
	updatedAt: null,
	attachments: [],
	flags: {
		NFE: false,
		AI: false,
		joke: false,
		misinformation: false,
		spam: false,
		suspicious: false,
		suicide: false,
		reported: false,
	},
	interaction: { liked: false, reported: false, saved: false },
	stats: { reactions: { like: 0 }, answers: 0, score: 0 },
});

const isInLimit = computed(
	() => preparingPost.value.content.length <= limit.value,
);

const visibilityIconOptions = VISIBILITY_OPTIONS.map(({ value, icon }) => ({
	value,
	icon,
}));
const visibilityFullOptions = VISIBILITY_OPTIONS.map(
	({ value, icon, label }) => ({ value, icon, label }),
);
const visibilityLabel = computed(
	() =>
		VISIBILITY_OPTIONS.find(
			(option) => option.value === preparingPost.value.visibility,
		)?.label || "Visibilité inconnue",
);

const activeFlagsCount = computed(
	() =>
		EDITABLE_FLAGS.filter(({ key }) => preparingPost.value.flags[key])
			.length,
);

/* -------------------------------------------------------------------------- */
/*  Mode édition : chargement de la publication existante                     */
/* -------------------------------------------------------------------------- */

const loadPostToEdit = async (id: string) => {
	try {
		const response: any = await $api(`/posts/${id}`);

		if (!response.data) {
			error.value = "Publication introuvable.";
			return;
		}

		if (response.data.profile?.id !== session.value?.profile?.id) {
			await navigateTo("/discover");
			return;
		}

		preparingPost.value = response.data;
	} catch (e: any) {
		error.value =
			e.message || "Erreur lors de la récupération de la publication.";
	}
};

if (editPostId) loadPostToEdit(editPostId);

/* -------------------------------------------------------------------------- */
/*  Pièces jointes                                                            */
/* -------------------------------------------------------------------------- */

const {
	error: attachmentsError,
	uploadAttachment,
	createExternalAttachment,
	updateAltText,
	deleteAttachment,
	attachToPost,
} = useAttachments();

const uploads = ref<Attachment[]>([]); // envois en cours (squelettes)
const removedAttachmentIds = ref<string[]>([]); // à supprimer à la publication (édition)

const groups = computed(() =>
	groupAttachments(preparingPost.value.attachments),
);

const remaining = computed(() =>
	getRemainingSlots(
		[...preparingPost.value.attachments, ...uploads.value],
		specs.value,
	),
);

const mediaCount = computed(
	() => groups.value.media.length + uploads.value.length,
);

const hasAttachments = computed(
	() => preparingPost.value.attachments.length + uploads.value.length > 0,
);

// État de l'interface
const showLinkForm = ref(false);
const showOptions = ref(false);
const editingAltId = ref<string | null>(null);
const linkPayload = ref("");
const mediaInput = ref<HTMLInputElement | null>(null);

const acceptedMimeTypes = ATTACHMENT_RULES.image.mimeTypes.join(",");

const createPlaceholder = (type: Attachment["type"]): Attachment => ({
	id: `pending-${Date.now()}-${uploads.value.length}`,
	authorId: session.value!.profile.id,
	postId: null,
	type,
	ratio: "1:1",
	altText: null,
	link: "",
	visibility: "me",
	createdAt: new Date(),
});

const pickMedia = () => mediaInput.value?.click();

const onMediaPicked = (event: Event) => {
	const input = event.target as HTMLInputElement;
	const file = input.files?.[0] ?? null;
	input.value = ""; // permet de rechoisir le même fichier
	addMedia(file);
};

const addMedia = async (file: File | null) => {
	if (!file) return;

	error.value = null;

	if (!ATTACHMENT_RULES.image.mimeTypes.includes(file.type)) {
		error.value =
			"Ce format d'image n'est pas pris en charge (PNG, JPEG, WEBP ou AVIF).";
		return;
	}

	if (file.size > ATTACHMENT_MAX_FILE_SIZE) {
		error.value = `Cette image dépasse la taille maximale de ${formatBytes(ATTACHMENT_MAX_FILE_SIZE)}.`;
		return;
	}

	const placeholder = createPlaceholder("image");
	uploads.value.push(placeholder);

	const attachment = await uploadAttachment(file);

	uploads.value = uploads.value.filter((item) => item.id !== placeholder.id);

	if (attachment) {
		preparingPost.value.attachments.push(attachment);
	} else {
		error.value = attachmentsError.value;
	}
};

const addLink = async () => {
	const link = linkPayload.value.trim();
	if (!link) return;

	error.value = null;

	const attachment = await createExternalAttachment("link", link);

	if (attachment) {
		preparingPost.value.attachments.push(attachment);
		linkPayload.value = "";
		showLinkForm.value = false;
	} else {
		error.value = attachmentsError.value;
	}
};

const removeAttachment = async (attachment: Attachment) => {
	preparingPost.value.attachments = preparingPost.value.attachments.filter(
		(item) => item.id !== attachment.id,
	);

	if (attachment.postId) {
		// Déjà publié : on ne supprime qu'à la validation de la modification
		removedAttachmentIds.value.push(attachment.id);
	} else {
		await deleteAttachment(attachment.id);
	}
};

const setAltText = (attachment: Attachment, value: unknown) => {
	attachment.altText = typeof value === "string" ? value : null;
};

const saveAltText = async (attachment: Attachment) => {
	editingAltId.value = null;

	const saved = await updateAltText(attachment.id, attachment.altText ?? "");
	if (!saved) error.value = attachmentsError.value;
};

// Supprime les pièces jointes retirées puis rattache les nouvelles (orphelines) à la publication.
const syncAttachments = async (postId: string) => {
	for (const id of removedAttachmentIds.value) {
		await deleteAttachment(id);
	}
	removedAttachmentIds.value = [];

	const pendingIds = preparingPost.value.attachments
		.filter((attachment) => !attachment.postId)
		.map((attachment) => attachment.id);

	if (pendingIds.length === 0) return;

	const attached = await attachToPost(postId, pendingIds);

	if (!attached) {
		throw new Error(
			attachmentsError.value ||
				"Erreur lors de l'ajout des pièces jointes.",
		);
	}
};

/* -------------------------------------------------------------------------- */
/*  Publication                                                               */
/* -------------------------------------------------------------------------- */

const isGood = computed(
	() =>
		preparingPost.value.content.length > 0 &&
		isInLimit.value &&
		uploads.value.length === 0,
);

const handlePublish = async () => {
	if (!isGood.value) return;

	error.value = null;

	try {
		let postId = editPostId;

		if (editPostId) {
			await $api(`/posts/${editPostId}/edit`, {
				method: "PUT",
				body: preparingPost.value,
			});
		} else {
			const response = await $api<{ data: Post }>("/posts/new", {
				method: "POST",
				body: preparingPost.value,
			});
			postId = response.data.id;
		}

		if (postId) await syncAttachments(postId);

		await navigateTo("/discover");
	} catch (e: any) {
		error.value =
			e.message ||
			(isEditing
				? "Erreur lors de la mise à jour de la publication."
				: "Erreur lors de la création de la publication.");
	}
};
</script>
<template>
	<!-- En-tête : titre + onglets -->
	<Teleport to="#header">
		<h1 class="text-2xl font-bold font-title text-center">
			{{ isEditing ? "Modifier la publication" : "Écrire une publication" }}
		</h1>
		<TabBar class="mx-auto mt-4" :tabs="TABS" v-model="tab" />
	</Teleport>

	<div class="flex flex-col gap-4 px-4">
		<!-- ================================================================ -->
		<!--  Écrire                                                          -->
		<!-- ================================================================ -->
		<template v-if="tab === 'write'">
			<!-- Visibilité -->
			<div class="flex flex-col items-center gap-1">
				<InlineSelect
					label="Visibilité"
					v-model="preparingPost.visibility"
					:options="visibilityFullOptions"
					class="max-md:hidden"
				/>
				<InlineSelect
					label="Visibilité"
					v-model="preparingPost.visibility"
					:options="visibilityIconOptions"
					class="md:hidden"
				/>
				<p class="text-sm text-muted text-center">
					{{ VISIBILITY_DESCRIPTIONS[preparingPost.visibility] }}
				</p>
			</div>

			<!-- Texte -->
			<Input
				v-model="preparingPost.content"
				type="textarea"
				placeholder="Exprimez-vous..."
				class="h-72 -mx-4"
				minlength="1"
				:maxlength="limit"
				rich
			/>

			<!-- Pièces jointes (uniquement s'il y en a) -->
			<section v-if="hasAttachments" class="flex flex-col gap-3">
				<!-- Images -->
				<div v-if="mediaCount" class="flex flex-col gap-2">
					<p class="text-sm text-muted">
						Images · {{ mediaCount }} / {{ specs.max_images }}
					</p>
					<div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
						<div
							v-for="media in groups.media"
							:key="media.id"
							class="flex flex-col gap-1"
						>
							<Media
								:data="media"
								preview
								@remove="removeAttachment(media)"
							/>

							<Input
								v-if="editingAltId === media.id"
								:model-value="media.altText ?? ''"
								size="small"
								placeholder="Décrivez l'image..."
								@update:model-value="setAltText(media, $event)"
								@enter="saveAltText(media)"
								@blur="saveAltText(media)"
							/>
							<button
								v-else
								type="button"
								class="text-xs text-left truncate text-muted hover:underline"
								@click="editingAltId = media.id"
							>
								{{ media.altText || "+ Ajouter une description" }}
							</button>
						</div>

						<Media
							v-for="upload in uploads"
							:key="upload.id"
							:data="upload"
							loading
							preview
						/>
					</div>
				</div>

				<!-- Liens -->
				<ul v-if="groups.links.length" class="flex flex-col gap-2">
					<li
						v-for="link in groups.links"
						:key="link.id"
						class="flex items-center gap-3 rounded-xl border border-surface-border px-3 py-2"
					>
						<SocialIcon
							:icon="getLinkDomain(link.link).domain?.name"
							class="w-5 h-5 shrink-0"
						/>
						<span class="grow font-medium truncate">
							{{
								getLinkDomain(link.link).domain?.title ||
								getLinkDomain(link.link).hostname
							}}
						</span>
						<button
							type="button"
							aria-label="Retirer le lien"
							class="text-surface-text-muted hover:text-danger"
							@click="removeAttachment(link)"
						>
							<XMarkIcon class="h-5 w-5" />
						</button>
					</li>
				</ul>

				<!-- Autres pièces jointes -->
				<AttachmentBanner
					v-for="other in groups.others"
					:key="other.id"
					:data="other"
					preview
					@remove="removeAttachment(other)"
				/>
			</section>

			<!-- Ajout d'un lien (déplié à la demande) -->
			<div
				v-if="showLinkForm && remaining.link > 0"
				class="flex gap-2 items-end max-sm:flex-col max-sm:items-stretch"
			>
				<Input
					v-model="linkPayload"
					label="URL du lien"
					placeholder="https://"
					class="sm:grow"
					@enter="addLink"
				/>
				<Button label="Ajouter" :handler="addLink" class="h-fit" />
			</div>

			<!-- Options de contenu (dépliées à la demande) -->
			<section
				v-if="showOptions"
				class="flex flex-col gap-3 rounded-xl border border-surface-border p-4"
			>
				<h2 class="font-semibold font-title">Options de contenu</h2>
				<label
					v-for="flag in EDITABLE_FLAGS"
					:key="flag.key"
					class="flex items-start gap-3 cursor-pointer"
				>
					<Input
						type="checkbox"
						v-model="preparingPost.flags[flag.key]"
					/>
					<span class="flex flex-col">
						<span class="font-medium">{{ flag.label }}</span>
						<span class="text-sm text-muted">{{ flag.hint }}</span>
					</span>
				</label>
			</section>

			<WarningBox v-if="error" title="Une erreur est survenue">
				{{ error }}
			</WarningBox>

			<!-- Barre d'actions -->
			<div class="flex items-center gap-1">
				<input
					ref="mediaInput"
					type="file"
					class="hidden"
					:accept="acceptedMimeTypes"
					@change="onMediaPicked"
				/>

				<button
					type="button"
					class="relative rounded-full p-2 text-muted transition-colors hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-40"
					:disabled="remaining.image <= 0"
					:title="
						remaining.image > 0
							? `Ajouter une image (max ${formatBytes(ATTACHMENT_MAX_FILE_SIZE)})`
							: 'Limite d\'images atteinte'
					"
					@click="pickMedia"
				>
					<PhotoIcon class="h-6 w-6" />
				</button>

				<button
					type="button"
					class="rounded-full p-2 text-muted transition-colors hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-40"
					:class="{ 'bg-surface-hover': showLinkForm }"
					:disabled="remaining.link <= 0"
					:title="
						remaining.link > 0
							? 'Ajouter un lien'
							: 'Limite de liens atteinte'
					"
					@click="showLinkForm = !showLinkForm"
				>
					<LinkIcon class="h-6 w-6" />
				</button>

				<button
					type="button"
					class="relative rounded-full p-2 text-muted transition-colors hover:bg-surface-hover"
					:class="{ 'bg-surface-hover': showOptions }"
					title="Options de contenu"
					@click="showOptions = !showOptions"
				>
					<AdjustmentsHorizontalIcon class="h-6 w-6" />
					<span
						v-if="activeFlagsCount"
						class="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white"
					>
						{{ activeFlagsCount }}
					</span>
				</button>

				<p
					class="ml-auto mr-3 text-sm tabular-nums"
					:class="isInLimit ? 'text-muted' : 'text-danger'"
				>
					{{ preparingPost.content.length }} / {{ limit }}
				</p>

				<Button
					:label="isEditing ? 'Enregistrer' : 'Publier'"
					variant="primary"
					:disabled="!isGood"
					:handler="handlePublish"
				/>
			</div>
		</template>

		<!-- ================================================================ -->
		<!--  Aperçu                                                          -->
		<!-- ================================================================ -->
		<template v-else>
			<PostBox :data="preparingPost" disabled class="-mx-4" />

			<InfoBox :title="`Visibilité : ${visibilityLabel}`">
				{{ VISIBILITY_DESCRIPTIONS[preparingPost.visibility] }}
				Vous pourrez la modifier après la publication.
			</InfoBox>

			<WarningBox v-if="error" title="Une erreur est survenue">
				{{ error }}
			</WarningBox>

			<div class="flex justify-center gap-2">
				<Button
					label="Retour"
					variant="white"
					:handler="() => (tab = 'write')"
				/>
				<Button
					:label="isEditing ? 'Enregistrer' : 'Publier'"
					variant="primary"
					:disabled="!isGood"
					:handler="handlePublish"
				/>
			</div>
		</template>
	</div>
</template>
