import type { Post, Status } from "~~/shared/models/interactions";
import type { Profile } from "~~/shared/models/profiles";

export const useFeed = () => {
	const { $api } = useNuxtApp();

	const statuses = useState<Status[]>("statuses", () => []);
	const posts = useState<Post[]>("posts", () => []);
	const users = useState<Profile[]>("users", () => []);

	const error = useState<string | null>("feedError", () => null);
	const loading = useState<boolean>("feedLoading", () => false);

	const refresh = async () => {
		loading.value = true;
		error.value = null;

		try {
			const [statusesResponse, postsResponse, usersResponse] =
				await Promise.all([
					$api<{ statuses: Status[] }>("/api/v1/feed/statuses"),
					$api<{ posts: Post[] }>("/api/v1/feed/posts"),
					$api<{ users: Profile[] }>("/api/v1/feed/users"),
				]);

			statuses.value = statusesResponse.statuses;
			posts.value = postsResponse.posts;
			users.value = usersResponse.users;
		} catch (err) {
			error.value = err instanceof Error ? err.message : String(err);
		} finally {
			loading.value = false;
		}
	};

	return {
		statuses,
		posts,
		users,
		error,
		loading,
		refresh,
	};
};
