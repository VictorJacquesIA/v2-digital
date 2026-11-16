export const WHATSAPP_NUMBER = "5554999507960";
export const WHATSAPP_DISPLAY = "(54) 99950-7960";

export function whatsappLink(message: string): string {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}
