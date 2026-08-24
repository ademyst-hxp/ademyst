export function useTheme() {
	const theme_value = useState<"light" | "dark" | "system">("theme");
	const theme_cookie = useCookie<"light" | "dark" | "system">("theme");

	const alter_value = useState<boolean>("alter");
	const alter_cookie = useCookie<boolean>("alter");

	const density_value = useState<"compact" | "comfortable">("density");
	const density_cookie = useCookie<"compact" | "comfortable">("density");

	const fontSize_value = useState<number>("font-size");
	const fontSize_cookie = useCookie<number>("font-size");

	const highContrast_value = useState<boolean>("high-contrast");
	const highContrast_cookie = useCookie<boolean>("high-contrast");

	function initTheme() {
		if (window && window.matchMedia) {
			window
				.matchMedia("(prefers-color-scheme: dark)")
				.addEventListener("change", (e) => {
					if (theme_value.value === "system") {
						const newTheme = e.matches ? "dark" : "light";
						if (document && document.documentElement) {
							document.documentElement.className = "scheme-" + newTheme;
						}
					}
				});
		}

		const _theme =
			theme_value.value === "system"
				? window?.matchMedia("(prefers-color-scheme: dark)")?.matches
					? "dark"
					: "light"
				: theme_value.value;

		if (document && document.documentElement) {
			document.documentElement.className = "scheme-" + _theme;

			if (alter_value.value) {
				document.documentElement.classList.add("alter");
			}

			if (density_value.value) {
				document.documentElement.classList.add("density-" + density_value.value);
			}

			if (highContrast_value.value) {
				document.documentElement.classList.add("high-contrast");
			}

			document.documentElement.style.setProperty(
				"--txt-base",
				fontSize_value.value + "px",
			);
		}
	}

	function setTheme(props: {
		scheme?: "light" | "dark" | "system";
		alter?: boolean;
		density?: "compact" | "comfortable";
		fontSize?: number;
		highContrast?: boolean;
	}) {
		const {
			scheme,
			alter,
			density,
			fontSize,
			highContrast,
		} = props;

		if (scheme !== undefined) {
			theme_value.value = scheme;
			theme_cookie.value = scheme;
		}

		if (alter !== undefined) {
			alter_value.value = alter;
			alter_cookie.value = alter;
		}

		if (density !== undefined) {
			density_value.value = density;
			density_cookie.value = density;
		}

		if (fontSize !== undefined) {
			fontSize_value.value = fontSize;
			fontSize_cookie.value = fontSize;
		}

		if (highContrast !== undefined) {
			highContrast_value.value = highContrast;
			highContrast_cookie.value = highContrast;
		}

		initTheme();


		// éventuellement appeler ton API pour sauvegarder en BDD
	}

	return {
		theme: theme_value,
		initTheme,
		setTheme,
	};
}
