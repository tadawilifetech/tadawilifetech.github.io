import { defineMiddleware } from "astro:middleware";

export const onRequest = defineMiddleware((context, next) => {
	if (context.url.pathname === "/admin") {
		return context.redirect("/admin/");
	}

	const localizedAdminMatch = context.url.pathname.match(/^\/(en|ar|fa)\/admin$/);
	if (localizedAdminMatch) {
		return context.redirect(`${context.url.pathname}/`);
	}

	return next();
});