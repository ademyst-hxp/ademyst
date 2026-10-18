import type { Account } from "./accounts";
import type { PostReport } from "./reports";
import type { ProfileReport } from "./reports";
import type { WhisperReport } from "./reports";


export type SanctionType = "ban" | "mute" | "shadow_ban" | "warning";

export type Sanction = {
	id: string;
	account: Account;
	issuer: Account | null;
	type: SanctionType;
	reason: string;
	details: string | null;
	createdAt: Date;
	expiresAt: Date | null;
	profileReport: ProfileReport | null;
	postReport: PostReport | null;
	whisperReport: WhisperReport | null;
};
