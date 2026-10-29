/**
 * Marca e canais reais. Deixe vazio o que ainda não tiver dado confirmado:
 * a interface omite o campo em vez de publicar um contato de exemplo.
 * A URL canônica permanece até a publicação do domínio.
 */
export const site = {
  name: "Luiza",
  legalName: "Luiza Mobiliário de Luxo",
  tagline: "Mobiliário de luxo para hotelaria",
  description:
    "Plataforma B2B de catálogos de mobiliário de luxo para hotéis, resorts e projetos de hospitalidade.",
  url: "https://luiza.com.br",
  email: "luiza@vivazcataratas.com.br",
  phone: "" as string,
  whatsapp: "+55 (45) 99935-2010",
  address: "" as string,
  social: {
    instagram: "" as string,
    linkedin: "" as string,
    pinterest: "" as string,
  },
};

export const mainNav = [
  { label: "Início", href: "/" },
  { label: "Catálogo", href: "/catalogo" },
  { label: "Empresas", href: "/empresas" },
  { label: "Tecnologia", href: "/tecnologia" },
  { label: "Sobre", href: "/sobre" },
  { label: "Contato", href: "/contato" },
] as const;

export function whatsappLink(message?: string) {
  const digits = site.whatsapp.replace(/\D/g, "");
  if (!digits) return null;
  const base = `https://wa.me/${digits}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}
