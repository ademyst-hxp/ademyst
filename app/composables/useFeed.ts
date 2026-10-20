import type { Post, Whisper } from "~~/shared/models/interactions";
import type { Profile } from "~~/shared/models/profiles";

export type FeedTab = "following" | "suggest" | "hits";

type PostsResponse = {
	posts: Post[];
	next: number;
	hasNext: boolean;
};

type PageState = {
	// Offset to send for the next page (returned by the API as `next`).
	next: number;
	hasNext: boolean;
};

const FEED_ENDPOINTS: Record<FeedTab, string> = {
	following: "/api/v1/feed/posts/following",
	suggest: "/api/v1/feed/posts/suggestions",
	hits: "/api/v1/feed/posts/hits",
};

// Number of posts requested per page (the API caps it at 100).
const PAGE_SIZE = 20;

const emptyPage = (): PageState => ({ next: 0, hasNext: true });

export const useFeed = () => {
	const { $api } = useNuxtApp();

	const whispers = useState<Whisper[]>("whispers", () => []);
	const users = useState<Profile[]>("users", () => []);

	const suggestions = useState<Post[]>("suggestions", () => []);
	const hits = useState<Post[]>("hits", () => []);
	const following = useState<Post[]>("following", () => []);

	const error = useState<string | null>("feedError", () => null);
	const loading = useState<boolean>("feedLoading", () => false);
	const loadingMore = useState<boolean>("feedLoadingMore", () => false);

	// Tabs whose posts are up to date since the last refresh.
	const loadedTabs = useState<FeedTab[]>("feedLoadedTabs", () => []);

	// Pagination cursor of each tab.
	const pages = useState<Record<FeedTab, PageState>>("feedPages", () => ({
		following: emptyPage(),
		suggest: emptyPage(),
		hits: emptyPage(),
	}));

	// Incremented on every refresh/first load so that a "load more" request
	// started before it cannot append stale posts afterwards.
	const generation = useState<number>("feedGeneration", () => 0);

	const feeds = {
		following,
		suggest: suggestions,
		hits,
	};

	const fetchPage = (tab: FeedTab, offset: number) =>
		$api<PostsResponse>(FEED_ENDPOINTS[tab], {
			query: { limit: PAGE_SIZE, offset },
		});

	// Replaces the posts of a tab with its first page.
	const loadFirstPage = async (tab: FeedTab) => {
		const response = await fetchPage(tab, 0);

		feeds[tab].value = response.posts;
		pages.value[tab] = { next: response.next, hasNext: response.hasNext };
	};

	// Only the visible tab is fetched: the other tabs are loaded by loadTab
	// the first time they are opened.
	const refresh = async (tab: FeedTab = "following") => {
		loading.value = true;
		error.value = null;
		generation.value++;

		try {
			const [whispersResponse, , usersResponse] = await Promise.all([
				$api<{ whispers: Whisper[] }>("/api/v1/feed/whispers"),
				loadFirstPage(tab),
				$api<{ users: Profile[] }>("/api/v1/feed/users"),
			]);

			whispers.value = whispersResponse.whispers;
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
		generation.value++;

		try {
			await loadFirstPage(tab);
			loadedTabs.value = [...loadedTabs.value, tab];
		} catch (err) {
			error.value = err instanceof Error ? err.message : String(err);
		} finally {
			loading.value = false;
		}
	};

	// Appends the next page of a tab. Does nothing while another request is
	// running or when the last page has already been reached.
	const loadMore = async (tab: FeedTab) => {
		if (loading.value || loadingMore.value) return;
		if (!loadedTabs.value.includes(tab)) return;
		if (!pages.value[tab].hasNext) return;

		loadingMore.value = true;
		error.value = null;

		const startedAt = generation.value;

		try {
			const response = await fetchPage(tab, pages.value[tab].next);

			// The feed was refreshed meanwhile: drop this page.
			if (startedAt !== generation.value) return;

			// Filtering/sorting is done per page by the API, so the same post
			// must never be shown twice.
			const known = new Set(feeds[tab].value.map((post) => post.id));
			const fresh = response.posts.filter((post) => !known.has(post.id));

			feeds[tab].value = [...feeds[tab].value, ...fresh];
			pages.value[tab] = {
				next: response.next,
				hasNext: response.hasNext,
			};
		} catch (err) {
			error.value = err instanceof Error ? err.message : String(err);
		} finally {
			loadingMore.value = false;
		}
	};

	// Whether another page can be requested for the given tab.
	const hasMore = (tab: FeedTab) => pages.value[tab].hasNext;

	return {
		whispers,
		suggestions,
		hits,
		following,
		users,
		error,
		loading,
		loadingMore,
		refresh,
		loadTab,
		loadMore,
		hasMore,
	};
};
