import Link from "next/link";
import { Mail, Phone, MapPin } from "lucide-react";
import { categories } from "@/lib/products";
import { mainNav, site } from "@/lib/site";
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

export function Footer() {
  const year = new Date().getFullYear();

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
            <div className="mt-6 flex gap-4">
              <a
                href={site.social.instagram}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="text-cream/60 transition-colors hover:text-brass"
              >
                <InstagramIcon size={20} />
              </a>
              <a
                href={site.social.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                className="text-cream/60 transition-colors hover:text-brass"
              >
                <LinkedinIcon size={20} />
              </a>
            </div>
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
              Coleções
            </h3>
            <ul className="mt-5 space-y-3 text-sm">
              {categories.map((c) => (
                <li key={c.slug}>
                  <Link
                    href={`/catalogo?categoria=${c.slug}`}
                    className="text-cream/70 transition-colors hover:text-cream"
                  >
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contato */}
          <div>
            <h3 className="text-xs uppercase tracking-[0.22em] text-brass">
              Contato
            </h3>
            <ul className="mt-5 space-y-4 text-sm">
              <li className="flex items-start gap-3">
                <MapPin size={18} className="mt-0.5 shrink-0 text-brass" />
                <span className="text-cream/70">{site.address}</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone size={18} className="shrink-0 text-brass" />
                <a
                  href={`tel:${site.phone.replace(/[^\d+]/g, "")}`}
                  className="text-cream/70 transition-colors hover:text-cream"
                >
                  {site.phone}
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail size={18} className="shrink-0 text-brass" />
                <a
                  href={`mailto:${site.email}`}
                  className="text-cream/70 transition-colors hover:text-cream"
                >
                  {site.email}
                </a>
              </li>
            </ul>
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
