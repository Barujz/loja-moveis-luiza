import Link from "next/link";
import { Mail, MessageCircle, Phone, MapPin } from "lucide-react";
import { catalogCategories, loadPublicCatalogs } from "@/lib/catalog/showcase";
import { mainNav, site, whatsappLink } from "@/lib/site";
import { Container } from "@/components/ui/Container";

function InstagramIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

function LinkedinIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect x="2" y="9" width="4" height="12" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}

export async function Footer() {
  const year = new Date().getFullYear();
  const categories = catalogCategories(await loadPublicCatalogs());
  const socials = [
    site.social.instagram ? { href: site.social.instagram, label: "Instagram", icon: InstagramIcon } : null,
    site.social.linkedin ? { href: site.social.linkedin, label: "LinkedIn", icon: LinkedinIcon } : null,
  ].filter((item) => item !== null);
  const whatsapp = whatsappLink("Olá, gostaria de falar com a Luiza.");
  const contacts = [
    site.address ? { icon: MapPin, text: site.address, href: null as string | null, external: false } : null,
    site.phone ? { icon: Phone, text: site.phone, href: `tel:${site.phone.replace(/[^\d+]/g, "")}`, external: false } : null,
    site.email ? { icon: Mail, text: site.email, href: `mailto:${site.email}`, external: false } : null,
    whatsapp ? { icon: MessageCircle, text: site.whatsapp, href: whatsapp, external: true } : null,
  ].filter((item) => item !== null);

  return (
    <footer className="mt-24 bg-ink text-cream/80">
      <Container className="py-16 lg:py-20">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
          {/* Marca */}
          <div className="lg:pr-8">
            <p className="font-display text-3xl font-semibold text-cream">
              {site.name}
            </p>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-cream/60">
              {site.description}
            </p>
            {socials.length > 0 ? (
              <div className="mt-6 flex gap-4">
                {socials.map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={item.label}
                    className="text-cream/60 transition-colors hover:text-brass"
                  >
                    <item.icon size={20} />
                  </a>
                ))}
              </div>
            ) : null}
          </div>

          {/* Navegação */}
          <div>
            <h3 className="text-xs uppercase tracking-[0.22em] text-brass">
              Navegação
            </h3>
            <ul className="mt-5 space-y-3 text-sm">
              {mainNav.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-cream/70 transition-colors hover:text-cream"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Coleções */}
          <div>
            <h3 className="text-xs uppercase tracking-[0.22em] text-brass">
              Categorias
            </h3>
            <ul className="mt-5 space-y-3 text-sm">
              {categories.length === 0 ? (
                <li>
                  <Link href="/catalogo" className="text-cream/70 transition-colors hover:text-cream">
                    Ver catálogos
                  </Link>
                </li>
              ) : (
                categories.map((category) => (
                  <li key={category.slug}>
                    <Link
                      href={`/catalogo?categoria=${category.slug}`}
                      className="text-cream/70 transition-colors hover:text-cream"
                    >
                      {category.name}
                    </Link>
                  </li>
                ))
              )}
            </ul>
          </div>

          <div>
            <h3 className="text-xs uppercase tracking-[0.22em] text-brass">
              Contato
            </h3>
            {contacts.length === 0 ? (
              <p className="mt-5 max-w-xs text-sm leading-relaxed text-cream/70">
                O orçamento é solicitado no catálogo, com uma conta de comprador aprovada.
              </p>
            ) : (
              <ul className="mt-5 space-y-4 text-sm">
                {contacts.map((item) => (
                  <li key={item.text} className="flex items-start gap-3">
                    <item.icon size={18} className="mt-0.5 shrink-0 text-brass" />
                    {item.href ? (
                      <a
                        href={item.href}
                        {...(item.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                        className="text-cream/70 transition-colors hover:text-cream"
                      >
                        {item.text}
                      </a>
                    ) : (
                      <span className="text-cream/70">{item.text}</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-cream/50">
              O orçamento de um catálogo é pedido na página do catálogo.
            </p>
          </div>
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-cream/10 pt-8 text-xs text-cream/50 sm:flex-row">
          <p>
            © {year} {site.legalName}. Todos os direitos reservados.
          </p>
          <p>Projetos de hotelaria e hospitalidade sob medida.</p>
        </div>
      </Container>
    </footer>
  );
}
