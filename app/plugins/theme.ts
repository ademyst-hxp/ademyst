export default defineNuxtPlugin(() => {
	const theme = useCookie<"light" | "dark" | "system">("theme", {
		default: () => "system",
	});

	const alter = useCookie<boolean>("alter", {
		default: () => false,
	});

	const density = useCookie<"compact" | "comfortable">("density", {
		default: () => "comfortable",
	});

	const fontSize = useCookie<number>("font-size", {
		default: () => 16,
	});

	const highContrast = useCookie<boolean>("high-contrast", {
		default: () => false,
	});

	useState("theme", () => theme.value);
	useState("alter", () => alter.value);
	useState("density", () => density.value);
	useState("spacing", () => (density.value === "compact" ? 3 : 4));
	useState("font-size", () => fontSize.value);
	useState("high-contrast", () => highContrast.value);
});
