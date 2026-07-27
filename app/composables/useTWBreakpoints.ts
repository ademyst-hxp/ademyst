import { breakpointsTailwind, useBreakpoints } from "@vueuse/core";

export const useTWBreakpoints = () => {
	const breakpoints = useBreakpoints(breakpointsTailwind);

	const isSm = computed(() => breakpoints.smaller("md"));
	const isMd = computed(() => breakpoints.between("md", "lg"));
	const isLg = computed(() => breakpoints.greaterOrEqual("lg"));

	const current = computed(() => {
		if (breakpoints.greaterOrEqual("2xl").value) return "2xl";
		if (breakpoints.greaterOrEqual("xl").value) return "xl";
		if (breakpoints.greaterOrEqual("lg").value) return "lg";
		if (breakpoints.greaterOrEqual("md").value) return "md";
		if (breakpoints.greaterOrEqual("sm").value) return "sm";
		return "base";
	});

	return {
		isSm,
		isMd,
		isLg,
		current,
	};
};
