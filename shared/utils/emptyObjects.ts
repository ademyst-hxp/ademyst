import type { Account } from "~~/shared/models/accounts";

export const emptyAccount: () => Account = () => ({
	id: "",
	email: "",
	username: "",
	createdAt: new Date(),
	updatedAt: new Date(),
	confirmedAt: null,
});

/********************************
 *********** PROFILES ***********
 ********************************/

import type { Profile } from "~~/shared/models/profiles";

export const emptyProfile: () => Profile = () => ({
	id: "",
	name: "ghost",
	displayName: null,
	birthday: null,
	bio: null,
	pronouns: null,
	location: null,
	corporation: null,
	createdAt: new Date(),
	badge: null,
	badges: [],
	level: 0,
	links: [],
	relationships: {
		me: false,
		requesting: false,
		requested: false,
		following: false,
		followed: false,
		friend: false,
		blocking: false,
	},
	stats: {
		followers: 0,
		following: 0,
	},
});

/********************************
 ************ POSTS *************
 ********************************/

import type { Post } from "~~/shared/models/interactions";

export const emptyPost: () => Post = () => ({
	id: "",
	profile: emptyProfile(),
	parentId: null,
	content: "",
	visibility: "everyone",
	createdAt: new Date(),
	updatedAt: null,
	attachments: [],
	flags: {
		NFE: false,
		AI: false,
		joke: false,
		misinformation: false,
		spam: false,
		suspicious: false,
		suicide: false,
		reported: false,
	},
	interaction: {
		liked: false,
		visited: false,
		reported: false,
		saved: false,
	},
	stats: {
		reactions: {
			like: 0,
		},
		answers: 0,
		score: 0,
		visits: 0,
	},
});

/********************************
 ********** WHISPERS ************
 ********************************/

import type { Whisper } from "~~/shared/models/interactions";

export const emptyWhisper: () => Whisper = () => ({
	id: "",
	profile: emptyProfile(),
	content: "",
	image: null,
	color: null,
	textColor: null,
	visibility: "everyone",
	createdAt: new Date(),
	updatedAt: null,
	attachments: [],
	flags: {
		NFE: false,
		AI: false,
		joke: false,
		misinformation: false,
		spam: false,
		suspicious: false,
		suicide: false,
		reported: false,
	},
});

/********************************
 *********** REPORTS ************
 ********************************/

import type { PostReport } from "~~/shared/models/reports";

export const emptyPostReport: () => PostReport = () => ({
	id: "",
	reporter: emptyAccount(),
	reportedPost: emptyPost(),
	reason: "",
	details: "",
	status: "pending",
	createdAt: new Date(),
});

import type { ProfileReport } from "~~/shared/models/reports";

export const emptyProfileReport: () => ProfileReport = () => ({
	id: "",
	reporter: emptyAccount(),
	reportedProfile: emptyProfile(),
	reason: "",
	details: "",
	status: "pending",
	createdAt: new Date(),
});

import type { WhisperReport } from "~~/shared/models/reports";

export const emptyWhisperReport: () => WhisperReport = () => ({
	id: "",
	reporter: emptyAccount(),
	reportedWhisper: emptyWhisper(),
	reason: "",
	details: "",
	status: "pending",
	createdAt: new Date(),
});


/********************************
 ********** SANCTIONS ***********
 ********************************/

import type { Sanction } from "~~/shared/models/sanctions";

export const emptySanction: () => Sanction = () => ({
	id: "",
	account: emptyAccount(),
	issuer: null,
	type: "warning",
	reason: "",
	details: "",
	createdAt: new Date(),
	expiresAt: null,
	profileReport: null,
	postReport: null,
	whisperReport: null,
});
