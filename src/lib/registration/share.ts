import { headers } from "next/headers";
import { site } from "@/lib/site";

export async function registrationPageUrl(id: string) {
  const headerStore = await headers();
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host");
  const proto = headerStore.get("x-forwarded-proto") ?? "http";
  const origin = host ? `${proto}://${host}` : site.url;
  return `${origin}/conta/fichas/${id}`;
}

export function registrationShareLinks(pageUrl: string) {
  const text = `Ficha cadastral da Luiza Mobiliário de Luxo. A página exige login. Anexe manualmente o PDF baixado, porque esta mensagem não traz os dados da ficha. ${pageUrl}`;
  return {
    whatsapp: `https://wa.me/?text=${encodeURIComponent(text)}`,
    email: `mailto:?subject=${encodeURIComponent("Ficha cadastral da Luiza")}&body=${encodeURIComponent(text)}`,
  };
}
