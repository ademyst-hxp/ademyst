export const usePostInteractions = () => {
	const { $api } = useNuxtApp();

	const error = useState<string | null>("postItxError", () => null);
	const loading = useState<boolean>("postItxLoading", () => false);

	const likePost = async (
		id: string,
		prepare?: () => void | Promise<void>,
		rollback?: () => void | Promise<void>,
		callback?: () => void | Promise<void>,
	) => {
		loading.value = true;
		error.value = null;

		if (prepare) await prepare();

		try {
			try {
				await $api(`/posts/${id}/like`, {
					method: "POST",
				});
			} catch (err) {
				if (rollback) await rollback();
				throw err;
			}

			if (callback) await callback();
		} catch (err) {
			error.value = err instanceof Error ? err.message : String(err);
		} finally {
			loading.value = false;
		}
	};

	const unlikePost = async (
		id: string,
		prepare?: () => void | Promise<void>,
		rollback?: () => void | Promise<void>,
		callback?: () => void | Promise<void>,
	) => {
		loading.value = true;
		error.value = null;

		try {
			if (prepare) await prepare();

			try {
				await $api(`/posts/${id}/unlike`, {
					method: "POST",
				});
			} catch (err) {
				if (rollback) await rollback();
				throw err;
			}

			if (callback) await callback();
		} catch (err) {
			error.value = err instanceof Error ? err.message : String(err);
		} finally {
			loading.value = false;
		}
	};

	return {
		error,
		loading,
		likePost,
		unlikePost,
	};
};
