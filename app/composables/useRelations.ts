export const useRelations = () => {
	const { $api } = useNuxtApp();

	const error = useState<string | null>("relationsError", () => null);
	const loading = useState<boolean>("relationsLoading", () => false);

	const followUser = async (
		username: string,
		callback?: () => void | Promise<void>,
	) => {
		loading.value = true;
		error.value = null;

		try {
			await $api(`/users/${username}/follow`, {
				method: "POST",
			});

			if (callback) await callback();
		} catch (err) {
			error.value = err instanceof Error ? err.message : String(err);
		} finally {
			loading.value = false;
		}
	};

	const unfollowUser = async (
		username: string,
		callback?: () => void | Promise<void>,
	) => {
		loading.value = true;
		error.value = null;

		try {
			await $api(`/users/${username}/unfollow`, {
				method: "POST",
			});

			await unfriendUser(username, callback);
		} catch (err) {
			error.value = err instanceof Error ? err.message : String(err);
		} finally {
			loading.value = false;
		}
	};

	const friendUser = async (
		username: string,
		callback?: () => void | Promise<void>,
	) => {
		loading.value = true;
		error.value = null;

		try {
			await $api(`/users/${username}/friend`, {
				method: "POST",
			});

			if (callback) await callback();
		} catch (err) {
			error.value = err instanceof Error ? err.message : String(err);
		} finally {
			loading.value = false;
		}
	};

	const unfriendUser = async (
		username: string,
		callback?: () => void | Promise<void>,
	) => {
		loading.value = true;
		error.value = null;

		try {
			await $api(`/users/${username}/unfriend`, {
				method: "POST",
			});

			if (callback) await callback();
		} catch (err) {
			error.value = err instanceof Error ? err.message : String(err);
		} finally {
			loading.value = false;
		}
	};

	const blockUser = async (
		username: string,
		callback?: () => void | Promise<void>,
	) => {
		loading.value = true;
		error.value = null;

		try {
			await $api(`/users/${username}/block`, {
				method: "POST",
			});

			if (callback) await callback();
		} catch (err) {
			error.value = err instanceof Error ? err.message : String(err);
		} finally {
			loading.value = false;
		}
	};

	const unblockUser = async (
		username: string,
		callback?: () => void | Promise<void>,
	) => {
		loading.value = true;
		error.value = null;

		try {
			await $api(`/users/${username}/unblock`, {
				method: "POST",
			});

			await unfollowUser(username, callback);
		} catch (err) {
			error.value = err instanceof Error ? err.message : String(err);
		} finally {
			loading.value = false;
		}
	};

	return {
		error,
		loading,
		followUser,
		unfollowUser,
		friendUser,
		unfriendUser,
		blockUser,
		unblockUser
	};
};
