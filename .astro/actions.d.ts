declare module "astro:actions" {
	type Actions = typeof import("/home/milad/Documents/GitHub/tadawilifetech/tadawilifetech.github.io/src/actions/index.ts")["server"];

	export const actions: Actions;
}