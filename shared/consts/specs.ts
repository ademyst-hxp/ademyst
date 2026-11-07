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

export const POST_MEDIA_LIMITS: Record<number, {
	images: number;
	gifs: number;
	audios: number;
	links: number;
}> = {
	0: { images: 0, gifs: 0, audios: 0, links: 0 },
	1: { images: 0, gifs: 0, audios: 0, links: 0 },
	2: { images: 2, gifs: 1, audios: 1, links: 3 },
	3: { images: 2, gifs: 1, audios: 1, links: 3 },
	4: { images: 4, gifs: 1, audios: 2, links: 5 },
	5: { images: 6, gifs: 1, audios: 2, links: 10 },
	6: { images: 6, gifs: 1, audios: 2, links: 10 },
	7: { images: 6, gifs: 1, audios: 2, links: 10 },
	8: { images: 6, gifs: 1, audios: 2, links: 10 },
	9: { images: 6, gifs: 1, audios: 2, links: 10 },
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
