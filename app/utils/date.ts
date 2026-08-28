export const convertToLitteralDuration = (start: Date, end: Date): string => {
	const duration = Math.abs(end.getTime() - start.getTime());

	const seconds = Math.floor(duration / 1000);
	const minutes = Math.floor(seconds / 60);
	const hours = Math.floor(minutes / 60);
	const days = Math.floor(hours / 24);
	const weeks = Math.floor(days / 7);
	const months = Math.floor(days / 30);
	const years = Math.floor(days / 365);

	if (years > 0) {
		return `${years} an${years > 1 ? "s" : ""}`;
	} else if (months > 0) {
		return `${months} mois`;
	} else if (weeks > 0) {
		return `${weeks} semaine${weeks > 1 ? "s" : ""}`;
	} else if (days > 0) {
		return `${days} jour${days > 1 ? "s" : ""}`;
	} else if (hours > 0) {
		return `${hours} heure${hours > 1 ? "s" : ""}`;
	} else if (minutes > 0) {
		return `${minutes} minute${minutes > 1 ? "s" : ""}`;
	} else {
		return "À l'instant";
	}
}
