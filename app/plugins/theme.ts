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

	const dyslexiaFriendly = useCookie<boolean>("dyslexia-friendly", {
		default: () => false,
	});

	const currentTheme = useState("theme", () => theme.value);
	const currentAlter = useState("alter", () => alter.value);

	const currentDensity = useState("density", () => density.value);
	const currentSpacing = useState("spacing", () =>
		density.value === "compact" ? 3 : 4,
	);

	const currentFontSize = useState("font-size", () => fontSize.value);
	const currentHighContrast = useState(
		"high-contrast",
		() => highContrast.value,
	);
	const currentDyslexiaFriendly = useState(
		"dyslexia-friendly",
		() => dyslexiaFriendly.value,
	);

	// Watch for changes in the cookies and update the state accordingly
	watchEffect(() => {
		currentTheme.value = theme.value;
		currentAlter.value = alter.value;
		currentDensity.value = density.value;
		currentSpacing.value = density.value === "compact" ? 3 : 4;
		currentFontSize.value = fontSize.value;
		currentHighContrast.value = highContrast.value;
		currentDyslexiaFriendly.value = dyslexiaFriendly.value;
	});
});
