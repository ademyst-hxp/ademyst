export function useTheme() {
	const theme = useState<"light" | "dark" | "system" | "fox">("theme");
	const cookie = useCookie<"light" | "dark" | "system" | "fox">("theme");

	function setTheme(value: "light" | "dark" | "system" | "fox") {
		theme.value = value;
		cookie.value = value;

		if (document && document.documentElement) {
			document.documentElement.className = value;
		}

		// éventuellement appeler ton API pour sauvegarder en BDD
	}

	return {
		theme,
		setTheme,
	};
}
