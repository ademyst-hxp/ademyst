// app/composables/useTextCounter.ts
import { computed, toValue, type MaybeRefOrGetter } from "vue";

export type CounterLevel = "short" | "ok" | "danger";

/** Au-delà de ce ratio de la limite, le compteur passe en rouge. */
export const COUNTER_DANGER_RATIO = 0.9;

const LEVEL_CLASSES: Record<CounterLevel, string> = {
	short: "text-warning", // sous le minimum
	ok: "text-muted", // dans les clous
	danger: "text-danger", // ≥ 90 % de la limite (dépassement compris)
};

export interface TextLimits {
	min?: number;
	max?: number;
}

export function useTextCounter(
	length: MaybeRefOrGetter<number>,
	limits: MaybeRefOrGetter<TextLimits>,
) {
	return computed(() => {
		const current = toValue(length);
		const { min, max } = toValue(limits);

		const isShort = min !== undefined && current < min;
		const isOver = max !== undefined && current > max;
		const isNearMax =
			max !== undefined && current >= max * COUNTER_DANGER_RATIO;

		const level: CounterLevel = isNearMax
			? "danger"
			: isShort
				? "short"
				: "ok";

		return {
			length: current,
			min,
			max,
			isShort,
			isOver,
			level,
			colorClass: LEVEL_CLASSES[level],
			/** Caractères manquants pour atteindre le minimum (0 si atteint) */
			toMin: isShort ? min! - current : 0,
			/** Caractères restants avant la limite (négatif si dépassée) */
			remaining: max !== undefined ? max - current : null,
		};
	});
}
