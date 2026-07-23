import type { Sanction as DbSanction } from "~~/server/db/schema/sanctions";
import type { Sanction } from "~~/shared/models/sanctions";
import type { Account } from "~~/shared/models/accounts";

export function convertSanction(
	sanction: DbSanction,
	account: Account,
	issuer: Account | null,
): Sanction {
	return {
		id: sanction.id,
		account,
		issuer,
		type: sanction.type,
		reason: sanction.reason,
		details: sanction.details,
		createdAt: sanction.createdAt,
		expiresAt: sanction.expiresAt ?? null,
	};
}
