/**
 * Configuração central da marca e do site.
 * Troque estes valores para adaptar a loja — nome, contato, redes, menu.
 */
export const site = {
  name: "Luiza",
  legalName: "Luiza Mobiliário de Luxo",
  tagline: "Mobiliário de luxo para hotelaria",
  description:
    "Móveis de luxo sob medida para hotéis, resorts e projetos de hospitalidade. Peças autorais, acabamento impecável e curadoria para ambientes memoráveis.",
  url: "https://luiza.com.br", // ajuste ao publicar
  email: "contato@luiza.com.br",
  phone: "+55 (45) 90000-0000",
  whatsapp: "5545900000000", // só dígitos, formato internacional
  address: "Foz do Iguaçu · Paraná · Brasil",
  social: {
    instagram: "https://instagram.com/",
    linkedin: "https://linkedin.com/",
    pinterest: "https://pinterest.com/",
  },
} as const;

export const mainNav = [
  { label: "Início", href: "/" },
  { label: "Catálogo", href: "/catalogo" },
  { label: "Sobre", href: "/sobre" },
  { label: "Contato", href: "/contato" },
] as const;

/** Link direto para o WhatsApp com mensagem pré-preenchida. */
export function whatsappLink(message?: string) {
  const base = `https://wa.me/${site.whatsapp}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}
