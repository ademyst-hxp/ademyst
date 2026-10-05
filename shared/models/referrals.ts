import type { Profile } from "./profiles";

export type ReferralCode = {
	id: string;
	author: Profile;
	code: string;

	uses: number;

	enabled: boolean;

	createdAt: Date;
	expiresAt: Date | null;
};

export type Referral = {
	id: string;

	referralCode: ReferralCode;
	referred: Profile;

	confirmed: boolean;

	createdAt: Date;
	confirmedAt: Date | null;
};
