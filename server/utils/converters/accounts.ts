import type {
	Account as DbAccount,
	Session as DbSession,
	AccountModificationHistory as DbAccountModificationHistory,
} from "~~/server/db/schema/accounts";
import type {
	Account,
	Session,
	AccountModificationHistory,
} from "~~/shared/models/accounts";

export function convertAccount(account: DbAccount): Account {
	return {
		id: account.id,
		email: account.email,
		createdAt: account.createdAt,
		updatedAt: account.updatedAt,
		confirmedAt: account.confirmedAt ?? null,
	};
}

export function convertSession(session: DbSession): Session {
	return {
		id: session.id,
		ipAddress: session.ipAddress ?? null,
		userAgent: session.userAgent ?? null,
		createdAt: session.createdAt,
		updatedAt: session.updatedAt,
	};
}

export function convertAccountModificationHistory(
	history: DbAccountModificationHistory,
): AccountModificationHistory {
	return {
		id: history.id,
		action: history.action,
		userAgent: history.userAgent ?? null,
		ipAddress: history.ipAddress ?? null,
		createdAt: history.createdAt,
	};
}
