import type { Account } from "./accounts";
import type { Post, Whisper } from "./interactions";
import type { Profile } from "./profiles";

export type ReportStatus = "pending" | "reviewed" | "rejected";

export type ProfileReport = {
	id: string;
	reporter: Account;
	reportedProfile: Profile;
	reason: string;
	details: string | null;
	status: ReportStatus;
	createdAt: Date;
};

export type PostReport = {
	id: string;
	reporter: Account;
	reportedPost: Post;
	reason: string;
	details: string | null;
	status: ReportStatus;
	createdAt: Date;
};

export type WhisperReport = {
	id: string;
	reporter: Account;
	reportedWhisper: Whisper;
	reason: string;
	details: string | null;
	status: ReportStatus;
	createdAt: Date;
};
