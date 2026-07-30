import { closeDb } from "#server/db";

export default defineNitroPlugin((nitroApp) => {
	nitroApp.hooks.hook("afterResponse", (event) => {
		closeDb(event);
	});
});
