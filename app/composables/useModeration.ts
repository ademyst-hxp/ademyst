import type { Ref } from "vue";
import type {
	PostReport,
	ProfileReport,
	ReportStatus,
	WhisperReport,
} from "~~/shared/models/reports";

export type ReportsTab = "users" | "posts" | "whispers";

// Number of reports per type, as returned by the count route.
export type ReportsCounts = {
	total: number;
	posts: number;
	profiles: number;
	whispers: number;
};

type ReportsCountResponse = {
	status: "ok";
	count: ReportsCounts;
};

type ReportsByTab = {
	users: ProfileReport[];
	posts: PostReport[];
	whispers: WhisperReport[];
};

type ReportsResponse<T extends ReportsTab> = {
	status: "ok";
	reports: ReportsByTab[T];
	next: number;
	hasNext: boolean;
};

type PageState = {
	// Offset to send for the next page (returned by the API as `next`).
	next: number;
	hasNext: boolean;
};

// The "users" tab lists profile reports, hence the /profiles endpoint.
const REPORTS_ENDPOINTS: Record<ReportsTab, string> = {
	users: "/api/v1/moderation/reports/profiles",
	posts: "/api/v1/moderation/reports/posts",
	whispers: "/api/v1/moderation/reports/whispers",
};

const COUNT_ENDPOINT = "/api/v1/moderation/reports/count";

const emptyCounts = (): ReportsCounts => ({
	total: 0,
	posts: 0,
	profiles: 0,
	whispers: 0,
});

// Number of reports requested per page (the API caps it at 100).
const PAGE_SIZE = 20;

const emptyPage = (): PageState => ({ next: 0, hasNext: true });

export const useReports = () => {
	const { $api } = useNuxtApp();

	const users = useState<ProfileReport[]>("reportsUsers", () => []);
	const posts = useState<PostReport[]>("reportsPosts", () => []);
	const whispers = useState<WhisperReport[]>("reportsWhispers", () => []);

	const error = useState<string | null>("reportsError", () => null);
	const loading = useState<boolean>("reportsLoading", () => false);
	const loadingMore = useState<boolean>("reportsLoadingMore", () => false);

	// Tabs whose reports are up to date since the last refresh.
	const loadedTabs = useState<ReportsTab[]>("reportsLoadedTabs", () => []);

	// Pagination cursor of each tab.
	const pages = useState<Record<ReportsTab, PageState>>(
		"reportsPages",
		() => ({
			users: emptyPage(),
			posts: emptyPage(),
			whispers: emptyPage(),
		}),
	);

	// Number of reports per type (for tab badges), see loadCounts.
	const counts = useState<ReportsCounts>("reportsCounts", emptyCounts);

	// Incremented on every refresh/first load so that a "load more" request
	// started before it cannot append stale reports afterwards.
	const generation = useState<number>("reportsGeneration", () => 0);

	const feeds: { [T in ReportsTab]: Ref<ReportsByTab[T]> } = {
		users,
		posts,
		whispers,
	};

	const setReports = <T extends ReportsTab>(
		tab: T,
		value: ReportsByTab[T],
	) => {
		(feeds[tab] as Ref<ReportsByTab[T]>).value = value;
	};

	const getReports = <T extends ReportsTab>(tab: T) =>
		feeds[tab].value as ReportsByTab[T];

	const fetchPage = <T extends ReportsTab>(tab: T, offset: number) =>
		$api<ReportsResponse<T>>(REPORTS_ENDPOINTS[tab], {
			query: { limit: PAGE_SIZE, offset },
		});

	// Replaces the reports of a tab with its first page.
	const loadFirstPage = async (tab: ReportsTab) => {
		const response = await fetchPage(tab, 0);

		setReports(tab, response.reports);
		pages.value[tab] = { next: response.next, hasNext: response.hasNext };
	};

	// Only the visible tab is fetched: the other tabs are loaded by loadTab
	// the first time they are opened.
	const refresh = async (tab: ReportsTab = "users") => {
		loading.value = true;
		error.value = null;
		generation.value++;

		try {
			await loadFirstPage(tab);
			loadedTabs.value = [tab];
		} catch (err) {
			error.value = err instanceof Error ? err.message : String(err);
		} finally {
			loading.value = false;
		}
	};

	const loadTab = async (tab: ReportsTab) => {
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
	// running or when the last page has already been reached. Resolves to
	// true only when a page was appended.
	const loadMore = async (tab: ReportsTab): Promise<boolean> => {
		if (loading.value || loadingMore.value) return false;
		if (!loadedTabs.value.includes(tab)) return false;
		if (!pages.value[tab].hasNext) return false;

		loadingMore.value = true;
		error.value = null;

		const startedAt = generation.value;

		try {
			const response = await fetchPage(tab, pages.value[tab].next);

			// The list was refreshed meanwhile: drop this page.
			if (startedAt !== generation.value) return false;

			// Never show the same report twice (new reports shift the offsets).
			const known = new Set<string>(
				getReports(tab).map((report) => report.id),
			);
			const fresh = response.reports.filter(
				(report: { id: string }) => !known.has(report.id),
			);

			setReports(tab, [
				...getReports(tab),
				...fresh,
			] as ReportsByTab[typeof tab]);
			pages.value[tab] = {
				next: response.next,
				hasNext: response.hasNext,
			};

			return true;
		} catch (err) {
			error.value = err instanceof Error ? err.message : String(err);

			return false;
		} finally {
			loadingMore.value = false;
		}
	};

	// Whether another page can be requested for the given tab.
	const hasMore = (tab: ReportsTab) => pages.value[tab].hasNext;

	// Fetches the number of reports per type, independently of the loaded
	// pages. Defaults to the pending reports (the moderation queue); pass
	// `null` to count every status.
	const loadCounts = async (
		status: ReportStatus | null = "pending",
	): Promise<void> => {
		try {
			const response = await $api<ReportsCountResponse>(COUNT_ENDPOINT, {
				query: status ? { status } : undefined,
			});

			counts.value = response.count;
		} catch (err) {
			error.value = err instanceof Error ? err.message : String(err);
		}
	};

	return {
		users,
		posts,
		whispers,
		counts,
		error,
		loading,
		loadingMore,
		refresh,
		loadTab,
		loadMore,
		hasMore,
		loadCounts,
	};
};
