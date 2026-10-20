import type { Ref } from "vue";

export type ListPage<T> = {
	items: T[];
	// Offset to request for the next page.
	next: number;
	hasNext: boolean;
};

export const usePaginatedList = <T extends { id: string }>(
	fetchPage: (offset: number) => Promise<ListPage<T>>,
) => {
	const items = ref<T[]>([]) as Ref<T[]>;
	const next = ref(0);
	const hasNext = ref(false);
	const loadingMore = ref(false);

	let generation = 0;

	const reset = (page?: ListPage<T> | null) => {
		generation++;

		items.value = page?.items ?? [];
		next.value = page?.next ?? 0;
		hasNext.value = page?.hasNext ?? false;
	};

	const loadMore = async (): Promise<boolean> => {
		if (loadingMore.value || !hasNext.value) return false;

		const startedAt = generation;
		loadingMore.value = true;

		try {
			const page = await fetchPage(next.value);

			if (startedAt !== generation) return false;

			// Offsets can shift while the user scrolls (new items): never show
			// the same item twice.
			const known = new Set(items.value.map((item) => item.id));

			items.value = [
				...items.value,
				...page.items.filter((item) => !known.has(item.id)),
			];
			next.value = page.next;
			hasNext.value = page.hasNext;

			return true;
		} catch (err) {
			console.error(
				"Erreur lors du chargement de la page suivante:",
				err,
			);

			return false;
		} finally {
			loadingMore.value = false;
		}
	};

	return { items, hasNext, loadingMore, reset, loadMore };
};
