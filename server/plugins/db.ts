import { closeDb } from "~~/server/db";

// Releases the request's database connection (see useDb). A handler that
// throws never reaches afterResponse, hence the error hook.
export default defineNitroPlugin((nitroApp) => {
	nitroApp.hooks.hook("afterResponse", (event) => {
		closeDb(event);
	});

	nitroApp.hooks.hook("error", (_error, context) => {
		if (context.event) {
			closeDb(context.event);
		}
	});
});
