import { defineMiddleware } from "astro:middleware";

export const onRequest = defineMiddleware((context, next) => {
	if (context.url.pathname === "/admin") {
		return context.redirect("/admin/");
	}

	return next();
});