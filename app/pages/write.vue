<script setup lang="ts">
import type { Post } from "~~/shared/models/interactions";

import {
	EyeSlashIcon,
	GlobeAltIcon,
	HeartIcon,
	RocketLaunchIcon,
	UserGroupIcon,
} from "@heroicons/vue/24/outline";

import PostBox from "~/components/interactions/Post.vue";

import Box from "~/components/base/Box.vue";
import Table from "~/components/base/Table.vue";
import InfoBox from "~/components/boxes/Info.vue";

const { $api } = useNuxtApp();
const { session, refresh } = useAuthSession();
await refresh();

const error = ref<string | null>(null);

const route = useRoute();
const { parent: parentPostId, edit: editPostId } = route.query as {
	parent?: string;
	quote?: string;
	edit?: string;
};

if (!session.value) {
	navigateTo("/auth/login");
}

definePageMeta({
	title: "Écrire un post | Ademyst",
	description:
		"Exprimez-vous et partagez vos idées avec la communauté Ademyst en écrivant un post.",
	middleware: ["auth"],
});

useHead({
	title: "Écrire un post | Ademyst",
	meta: [
		{
			name: "description",
			content:
				"Exprimez-vous et partagez vos idées avec la communauté Ademyst en écrivant un post.",
		},
		{
			name: "keywords",
			content: "Beam, Ademyst, Discover",
		},
		{
			name: "author",
			content: "Ejnalo",
		},
		{
			name: "viewport",
			content: "width=device-width, initial-scale=1.0",
		},
	],
});

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
	interaction: {
		liked: false,
		reported: false,
		saved: false,
	},
	stats: {
		reactions: {
			like: 0,
		},
		answers: 0,
		score: 0,
	},
});

if (editPostId) {
	// Fetch the post to edit
	$api(`/posts/${editPostId}`)
		.then((response: any) => {
			if (!response.data) {
				error.value = "Publication introuvable.";
				return;
			}

			if (response.data.profile?.id !== session.value?.profile?.id) {
				navigateTo("/discover");
				return;
			}

			preparingPost.value = response.data;
		})
		.catch((e: any) => {
			error.value =
				e.message ||
				"Erreur lors de la récupération de la publication.";
		});
}

const isInLimit = computed(() => {
	return preparingPost.value.content.length <= 5000;
});

const isGood = computed(() => {
	return preparingPost.value.content.length > 0 && isInLimit.value;
});

const handlePublish = async () => {
	if (!isGood.value) return;

	try {
		if (editPostId) {
			// Update the existing post
			try {
				await $api(`/posts/${editPostId}/edit`, {
					method: "PUT",
					body: preparingPost.value,
				});
			} catch (e: any) {
				error.value =
					e.message ||
					"Erreur lors de la mise à jour de la publication.";
			}
		} else {
			// Create a new post
			try {
				await $api("/posts/new", {
					method: "POST",
					body: preparingPost.value,
				});
			} catch (e: any) {
				error.value =
					e.message ||
					"Erreur lors de la création de la publication.";
			}
		}

		await navigateTo("/discover");
	} catch (e: any) {
		error.value = e.message || "Erreur lors de la publication du post.";
	}
};
</script>
<template>
	<Teleport to="#header">
		<h1 class="text-2xl font-bold font-title text-center">
			Écrire une publication
		</h1>
	</Teleport>

	<section class="flex flex-col gap-2 px-4">
		<Input
			v-model="preparingPost.content"
			type="textarea"
			placeholder="Exprimez-vous..."
			class="h-48 -mx-4"
		/>
		<p v-if="!isInLimit" class="text-sm text-danger">
			Vous avez dépassé la limite de 5000 caractères.
		</p>
		<Button
			label="Publier"
			variant="primary"
			:disabled="!isGood"
			:handler="handlePublish"
			class="mx-auto"
		/>
	</section>

	<hr class="rounded-full border border-surface-border mx-8 my-4" />

	<section class="flex flex-col gap-2 px-4">
		<h2 class="text-xl font-semibold font-title text-center">Visibilité</h2>
		<InlineSelect
			label="Visibilité"
			v-model="preparingPost.visibility"
			:options="[
				{ label: 'Essai', value: 'outside', icon: RocketLaunchIcon },
				{
					label: 'Tout le monde',
					value: 'everyone',
					icon: GlobeAltIcon,
				},
				{ label: 'Abonnés', value: 'followers', icon: UserGroupIcon },
				{ label: 'Amis', value: 'friends', icon: HeartIcon },
				{ label: 'Privé', value: 'me', icon: EyeSlashIcon },
			]"
			class="mx-auto max-md:hidden"
		/>
		<InlineSelect
			label="Visibilité"
			v-model="preparingPost.visibility"
			:options="[
				{ value: 'outside', icon: RocketLaunchIcon },
				{
					value: 'everyone',
					icon: GlobeAltIcon,
				},
				{ value: 'followers', icon: UserGroupIcon },
				{ value: 'friends', icon: HeartIcon },
				{ value: 'me', icon: EyeSlashIcon },
			]"
			class="mx-auto md:hidden"
		/>
		<Box scale="sm" class="-mx-4">
			<template v-if="preparingPost.visibility === 'outside'">
				<h3 class="text-lg font-semibold">Essai</h3>
				<p class="text-muted">
					Les publications de type "Essai" sont visibles par tout le
					monde sauf vos abonnés. Elles sont destinées à tester la
					visibilité de vos publications en dehors de votre public
					habituel.
				</p>
			</template>
			<template v-if="preparingPost.visibility === 'everyone'">
				<h3 class="text-lg font-semibold">Tout le monde</h3>
				<p class="text-muted">
					Votre publication sera visible par tout le monde, y compris
					sans être connecté. Seuls les utilisateurs ayant un compte
					Ademyst pourront interagir ou réagir à votre publication.
				</p>
			</template>
			<template v-if="preparingPost.visibility === 'followers'">
				<h3 class="text-lg font-semibold">Abonnés</h3>
				<p class="text-muted">
					Votre publication sera visible uniquement par vos abonnés.
				</p>
			</template>
			<template v-if="preparingPost.visibility === 'friends'">
				<h3 class="text-lg font-semibold">Amis</h3>
				<p class="text-muted">
					Votre publication sera visible par vos amis.
				</p>
			</template>
			<template v-if="preparingPost.visibility === 'me'">
				<h3 class="text-lg font-semibold">Privé</h3>
				<p class="text-muted">
					Votre publication sera visible uniquement par vous.
				</p>
			</template>
			<InfoBox title="Vous pouvez changer d'avis" class="-mx-2">
				Vous pourrez toujours changer la visibilité de votre publication
				après l'avoir publiée.
			</InfoBox>
		</Box>
	</section>

	<hr class="rounded-full border border-surface-border mx-8 my-4" />

	<section class="flex flex-col gap-2">
		<h2 class="text-xl font-semibold font-title text-center">Flags</h2>

		<Table
			class="table-auto w-full border-collapse border border-surface-border"
		>
			<template #head>
				<th>Flag</th>
				<th>Activé</th>
			</template>
			<template #body>
				<tr>
					<th>NFE (contenu sensible)</th>
					<td>
						<Input
							type="checkbox"
							v-model="preparingPost.flags.NFE"
						/>
					</td>
				</tr>
				<tr>
					<th>Contenu généré par IA</th>
					<td>
						<Input
							type="checkbox"
							v-model="preparingPost.flags.AI"
						/>
					</td>
				</tr>
				<tr>
					<th>Contenu humoristique</th>
					<td>
						<Input
							type="checkbox"
							v-model="preparingPost.flags.joke"
						/>
					</td>
				</tr>
				<tr>
					<th>Suicide ou auto-mutilation</th>
					<td>
						<Input
							type="checkbox"
							v-model="preparingPost.flags.suicide"
						/>
					</td>
				</tr>
			</template>
		</Table>
	</section>

	<hr class="rounded-full border border-surface-border mx-8 my-4" />

	<section class="flex flex-col gap-2">
		<h2 class="text-xl font-semibold font-title text-center">
			Prévisualisation
		</h2>
		<PostBox :data="preparingPost" disabled />
		<Button
			label="Publier"
			variant="primary"
			:disabled="!isGood"
			:handler="handlePublish"
			class="mx-auto"
		/>
	</section>
</template>
