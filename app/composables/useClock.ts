/**
 * Horloge réactive, mise à jour toutes les `intervalMs` (1 s par défaut).
 *
 * `now` vaut `null` tant que le composant n'est pas monté : le rendu serveur
 * et la première passe côté client sont identiques (pas d'erreur d'hydratation
 * due aux secondes qui défilent). Les composants affichent un emplacement
 * neutre tant que `now` est null.
 */
export function useClock(intervalMs = 1000) {
	const now = ref<number | null>(null);
	let timer: ReturnType<typeof setInterval> | undefined;

	onMounted(() => {
		now.value = Date.now();
		timer = setInterval(() => {
			now.value = Date.now();
		}, intervalMs);
	});

	onBeforeUnmount(() => {
		if (timer !== undefined) clearInterval(timer);
	});

	return now;
}
