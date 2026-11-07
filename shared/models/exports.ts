export type DataExportStatus = "processing" | "ready" | "failed";

export type DataExport = {
	id: string;
	status: DataExportStatus;

	// Taille du fichier en octets (null tant que l'export n'est pas prêt)
	size: number | null;

	// Chemin relatif de téléchargement (null tant que l'export n'est pas prêt)
	downloadUrl: string | null;

	createdAt: Date;
	completedAt: Date | null;
	expiresAt: Date;
};
