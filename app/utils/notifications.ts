import type { Notification } from "~~/shared/models/inbox";

export const getNotificationType = (notification: Notification) =>
	notification.type;

export const makeNotificationGroups = (
	notifications: Notification[],
): Notification[][] => {
	const groups: Notification[][] = [];
	for (const notification of notifications) {
		const previous = groups[groups.length - 1];
		if (!previous || previous[0]?.type !== notification.type) {
			groups.push([notification]);
		} else {
			previous.push(notification);
		}
	}
	return groups;
};

export const getNotificationAction = (..._args: unknown[]) => null;
