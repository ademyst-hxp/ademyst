export default defineNuxtPlugin(() => {
	const theme = useCookie<"light" | "dark" | "system" | "revolved">("theme", {
		default: () => "light",
	});

	const currentTheme = useState("theme", () => theme.value);

	currentTheme.value = theme.value;
});
