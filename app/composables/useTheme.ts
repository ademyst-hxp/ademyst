export function useTheme() {
	const { $api } = useNuxtApp();

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
		if (typeof window === "undefined" || typeof document === "undefined") {
			return;
		}

		const html = document.documentElement;

		const _theme =
			theme_value.value === "system"
				? window.matchMedia("(prefers-color-scheme: dark)").matches
					? "dark"
					: "light"
				: theme_value.value;

		html.classList.toggle("scheme-light", _theme === "light");
		html.classList.toggle("scheme-dark", _theme === "dark");

		html.classList.toggle("alter", alter_value.value === true);

		html.classList.toggle(
			"density-compact",
			density_value.value === "compact",
		);

		html.classList.toggle(
			"density-comfortable",
			density_value.value === "comfortable",
		);

		html.classList.toggle(
			"high-contrast",
			highContrast_value.value === true,
		);

		html.style.setProperty("--txt-base", `${fontSize_value.value}px`);
	}

	async function setTheme(props: {
		scheme?: "light" | "dark" | "system";
		alter?: boolean;
		density?: "compact" | "comfortable";
		fontSize?: number;
		highContrast?: boolean;
	}) {
		const { scheme, alter, density, fontSize, highContrast } = props;

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

		try {
			await $api(`/api/v1/settings/appearance`, {
				method: "PUT",
				body: {
					theme: scheme,
					alter: alter,
					uiDensity: density,
					fontSize: fontSize,
					highContrast: highContrast,
				},
			});
		} catch (error) {
			console.error(
				"Erreur lors de l'enregistrement des paramètres :",
				error,
			);
			alert(
				"Une erreur est survenue lors de l'enregistrement des paramètres.",
			);
		}

		initTheme();
	}

	return {
		theme: theme_value,
		alter: alter_value,
		density: density_value,
		fontSize: fontSize_value,
		highContrast: highContrast_value,
		initTheme,
		setTheme,
	};
}
