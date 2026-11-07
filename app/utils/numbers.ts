export const toLitteral = (num: number): string => {
	if (num < 1000) {
		return num.toString();
	} else if (num < 1_000_000) {
		return (num / 1000).toFixed(1).replace(/\.0$/, "") + "k";
	} else if (num < 1_000_000_000) {
		return (num / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
	} else {
		return (num / 1_000_000_000).toFixed(1).replace(/\.0$/, "") + "B";
	}
};

export const formatBytes = (bytes: number): string => {
	if (bytes < 1024) {
		return `${bytes} o`;
	} else if (bytes < 1024 * 1024) {
		return `${(bytes / 1024).toFixed(1).replace(/\.0$/, "")} Ko`;
	} else {
		return `${(bytes / (1024 * 1024)).toFixed(1).replace(/\.0$/, "")} Mo`;
	}
};
