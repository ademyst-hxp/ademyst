import type { Post, Status } from "~~/shared/models/interactions";
import type { Profile } from "~~/shared/models/profiles";

export const useFeed = () => {
	const { $api } = useNuxtApp();

	const statuses = useState<Status[]>("statuses", () => []);
	const users = useState<Profile[]>("users", () => []);

	const suggestions = useState<Post[]>("suggestions", () => []);
	const hits = useState<Post[]>("hits", () => []);
	const following = useState<Post[]>("following", () => []);

	const error = useState<string | null>("feedError", () => null);
	const loading = useState<boolean>("feedLoading", () => false);

	const refresh = async () => {
		loading.value = true;
		error.value = null;

		try {
			const [statusesResponse, suggestionsResponse, hitsResponse, followingResponse, usersResponse] =
				await Promise.all([
					$api<{ statuses: Status[] }>("/api/v1/feed/statuses"),
					$api<{ posts: Post[] }>("/api/v1/feed/posts/suggestions"),
					$api<{ posts: Post[] }>("/api/v1/feed/posts/hits"),
					$api<{ posts: Post[] }>("/api/v1/feed/posts/following"),
					$api<{ users: Profile[] }>("/api/v1/feed/users"),
				]);

			statuses.value = statusesResponse.statuses;
			suggestions.value = suggestionsResponse.posts;
			hits.value = hitsResponse.posts;
			following.value = followingResponse.posts;
			users.value = usersResponse.users;
		} catch (err) {
			error.value = err instanceof Error ? err.message : String(err);
		} finally {
			loading.value = false;
		}
	};

	return {
		statuses,
		suggestions,
		hits,
		following,
		users,
		error,
		loading,
		refresh,
	};
};
