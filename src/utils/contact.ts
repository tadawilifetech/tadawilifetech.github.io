export const WHATSAPP_PHONE_RAW = "96891235160";
export const WHATSAPP_PHONE_DISPLAY = "+968 91235160";

export function buildWhatsAppUrl(message: string): string {
	return `https://api.whatsapp.com/send?phone=${WHATSAPP_PHONE_RAW}&text=${encodeURIComponent(message)}`;
}
