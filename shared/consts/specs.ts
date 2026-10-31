export const POST_CHAR_LIMITS: Record<number, number> = {
	0: 0,
	1: 1000,
	2: 1000,
	3: 1000,
	4: 2000,
	5: 5000,
	6: 5000,
	7: 5000,
	8: 5000,
	9: 5000,
} as const;

export const POST_IMAGE_LIMITS: Record<number, number> = {
	0: 0,
	1: 4,
	2: 4,
	3: 4,
	4: 4,
	5: 6,
	6: 6,
	7: 6,
	8: 6,
	9: 6,
} as const;

export const WHISPER_CHAR_LIMITS: Record<number, number> = {
	0: 0,
	1: 250,
	2: 250,
	3: 250,
	4: 250,
	5: 250,
	6: 250,
	7: 250,
	8: 250,
	9: 250,
} as const;
