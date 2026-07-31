import type { Post, Whisper } from "~~/shared/models/interactions";
import type { Profile } from "~~/shared/models/profiles";

export const useFeed = () => {
	const { $api } = useNuxtApp();

	const whispers = useState<Whisper[]>("whispers", () => []);
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
			const [whispersResponse, suggestionsResponse, hitsResponse, followingResponse, usersResponse] =
				await Promise.all([
					$api<{ whispers: Whisper[] }>("/api/v1/feed/whispers"),
					$api<{ posts: Post[] }>("/api/v1/feed/posts/suggestions"),
					$api<{ posts: Post[] }>("/api/v1/feed/posts/hits"),
					$api<{ posts: Post[] }>("/api/v1/feed/posts/following"),
					$api<{ users: Profile[] }>("/api/v1/feed/users"),
				]);

			whispers.value = whispersResponse.whispers;
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
		whispers,
		suggestions,
		hits,
		following,
		users,
		error,
		loading,
		refresh,
	};
};
