export function useTheme() {
	const theme = useState<"light" | "dark" | "system" | "revolved">("theme");
	const cookie = useCookie<"light" | "dark" | "system" | "revolved">("theme");

	function setTheme(value: "light" | "dark" | "system" | "revolved") {
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
