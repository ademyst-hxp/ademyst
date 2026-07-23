export type Account = {
	id: string;
	email: string;
	createdAt: Date;
	updatedAt: Date;
	confirmedAt: Date | null;
};

export type Session = {
	id: string;
	ipAddress: string | null;
	userAgent: string | null;
	createdAt: Date;
	updatedAt: Date;
};

export type AccountAction =
	| "password_change"
	| "email_change"
	| "email_confirmation"
	| "account_deletion";

export type AccountModificationHistory = {
	id: string;
	action: AccountAction;
	userAgent: string | null;
	ipAddress: string | null;
	createdAt: Date;
};
