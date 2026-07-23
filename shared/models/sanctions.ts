import type { Account } from "./accounts";

export type SanctionType = "ban" | "mute" | "shadow_ban";

export type Sanction = {
	id: string;
	account: Account;
	issuer: Account | null;
	type: SanctionType;
	reason: string;
	details: string | null;
	createdAt: Date;
	expiresAt: Date | null;
};
