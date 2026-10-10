import type { Post, Whisper } from "~~/shared/models/interactions";
import type { Profile } from "~~/shared/models/profiles";

export type FeedTab = "following" | "suggest" | "hits";

const FEED_ENDPOINTS: Record<FeedTab, string> = {
	following: "/api/v1/feed/posts/following",
	suggest: "/api/v1/feed/posts/suggestions",
	hits: "/api/v1/feed/posts/hits",
};

export const useFeed = () => {
	const { $api } = useNuxtApp();

	const whispers = useState<Whisper[]>("whispers", () => []);
	const users = useState<Profile[]>("users", () => []);

	const suggestions = useState<Post[]>("suggestions", () => []);
	const hits = useState<Post[]>("hits", () => []);
	const following = useState<Post[]>("following", () => []);

	const error = useState<string | null>("feedError", () => null);
	const loading = useState<boolean>("feedLoading", () => false);

	// Tabs whose posts are up to date since the last refresh.
	const loadedTabs = useState<FeedTab[]>("feedLoadedTabs", () => []);

	const feeds = {
		following,
		suggest: suggestions,
		hits,
	};

	// Only the visible tab is fetched: each feed is up to 100 posts, the
	// other tabs are loaded by loadTab the first time they are opened.
	const refresh = async (tab: FeedTab = "following") => {
		loading.value = true;
		error.value = null;

		try {
			const [whispersResponse, postsResponse, usersResponse] =
				await Promise.all([
					$api<{ whispers: Whisper[] }>("/api/v1/feed/whispers"),
					$api<{ posts: Post[] }>(FEED_ENDPOINTS[tab]),
					$api<{ users: Profile[] }>("/api/v1/feed/users"),
				]);

			whispers.value = whispersResponse.whispers;
			feeds[tab].value = postsResponse.posts;
			users.value = usersResponse.users;
			loadedTabs.value = [tab];
		} catch (err) {
			error.value = err instanceof Error ? err.message : String(err);
		} finally {
			loading.value = false;
		}
	};

	const loadTab = async (tab: FeedTab) => {
		if (loadedTabs.value.includes(tab)) {
			return;
		}

		loading.value = true;
		error.value = null;

		try {
			const response = await $api<{ posts: Post[] }>(FEED_ENDPOINTS[tab]);

			feeds[tab].value = response.posts;
			loadedTabs.value = [...loadedTabs.value, tab];
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
		loadTab,
	};
};
