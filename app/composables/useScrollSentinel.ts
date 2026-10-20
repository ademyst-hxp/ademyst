export const useScrollSentinel = (
	load: () => Promise<boolean>,
	hasMore: () => boolean,
) => {
	const sentinel = ref<HTMLElement | null>(null);
	let observer: IntersectionObserver | null = null;

	const recheck = () => {
		if (!observer || !sentinel.value) return;

		observer.unobserve(sentinel.value);
		observer.observe(sentinel.value);
	};

	const loadNext = async () => {
		const loaded = await load();

		if (loaded && hasMore()) recheck();
	};

	onMounted(() => {
		if (!sentinel.value) return;

		observer = new IntersectionObserver(
			(entries) => {
				if (entries.some((entry) => entry.isIntersecting)) {
					loadNext();
				}
			},
			{ rootMargin: "400px 0px" },
		);
		observer.observe(sentinel.value);
	});

	onBeforeUnmount(() => observer?.disconnect());

	return { sentinel, recheck };
};
