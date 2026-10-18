export const WHATSAPP_PHONE_RAW = "96891235160";
export const WHATSAPP_PHONE_DISPLAY = "+968 91235160";
export const CONTACT_EMAIL = "info@tadawilifetech.com";
export const INSTAGRAM_ACCOUNTS = ["tadawilifetech", "Ortino_arabic"] as const;
export const GOOGLE_MAPS_URL = "https://share.google/wAYaditA2xOJ7nRQ9";
export const GOOGLE_MAPS_EMBED =
	"https://www.google.com/maps?q=Tadawi+Life+Tech,+Al+Ghubrah,+Muscat,+Oman&output=embed";
export const PATIENT_DATA_PORTAL_URL = "https://eu.luvcloud.luvmap.net/";

/** Cloudflare Worker in /assistant-worker: AI chat (/chat) and form intake (/forms). */
export const ASSISTANT_API: string =
	import.meta.env.PUBLIC_ASSISTANT_API ||
	"https://tadawi-assistant-api.miladsoft.workers.dev";

export function buildWhatsAppUrl(message: string): string {
	return `https://api.whatsapp.com/send?phone=${WHATSAPP_PHONE_RAW}&text=${encodeURIComponent(message)}`;
}
