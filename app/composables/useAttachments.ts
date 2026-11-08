import type { Attachment, AttachmentType } from "~~/shared/models/drive";

export const useAttachments = () => {
	const { $api } = useNuxtApp();

	const error = useState<string | null>("attachmentsError", () => null);
	const loading = useState<boolean>("attachmentsLoading", () => false);

	// Même philosophie que usePostInteractions : l'erreur est stockée, pas relancée.
	const run = async <T>(task: () => Promise<T>): Promise<T | null> => {
		loading.value = true;
		error.value = null;

		try {
			return await task();
		} catch (err: any) {
			error.value =
				err?.data?.statusMessage ||
				err?.statusMessage ||
				(err instanceof Error ? err.message : String(err));

			return null;
		} finally {
			loading.value = false;
		}
	};

	// Envoie un fichier hébergé : l'Attachment est orphelin jusqu'à son rattachement.
	const uploadAttachment = (file: File, altText?: string) =>
		run(async () => {
			const body = new FormData();

			body.append("file", file);
			if (altText) body.append("altText", altText);

			const response = await $api<{ data: Attachment }>(
				"/attachments/new",
				{ method: "POST", body },
			);

			return response.data;
		});

	// GIF ou lien : rien n'est hébergé, seule l'URL est enregistrée.
	const createExternalAttachment = (
		type: Extract<AttachmentType, "gif" | "link">,
		link: string,
		altText?: string,
	) =>
		run(async () => {
			const response = await $api<{ data: Attachment }>(
				"/attachments/new",
				{ method: "POST", body: { type, link, altText } },
			);

			return response.data;
		});

	const updateAltText = (id: string, altText: string) =>
		run(async () => {
			const response = await $api<{ data: Attachment }>(
				`/attachments/${id}/edit`,
				{ method: "PUT", body: { altText } },
			);

			return response.data;
		});

	const deleteAttachment = (id: string) =>
		run(async () => {
			await $api(`/attachments/${id}`, { method: "DELETE" });

			return true;
		});

	const attachToPost = (postId: string, ids: string[]) =>
		run(async () => {
			const response = await $api<{ data: Attachment[] }>(
				`/posts/${postId}/attachments`,
				{ method: "POST", body: { attachments: ids } },
			);

			return response.data;
		});

	return {
		error,
		loading,
		uploadAttachment,
		createExternalAttachment,
		updateAltText,
		deleteAttachment,
		attachToPost,
	};
};
