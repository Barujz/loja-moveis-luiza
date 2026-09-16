import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Container } from "./Container";

type Crumb = { label: string; href?: string };

export function PageHeader({
  eyebrow,
  title,
  description,
  breadcrumbs,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  breadcrumbs?: Crumb[];
}) {
  return (
    <section className="border-b border-line bg-paper">
      <Container className="py-14 lg:py-20">
        {breadcrumbs && (
          <nav className="mb-6 flex items-center gap-1.5 text-sm text-muted">
            {breadcrumbs.map((c, i) => (
              <span key={i} className="flex items-center gap-1.5">
                {c.href ? (
                  <Link href={c.href} className="transition-colors hover:text-brass">
                    {c.label}
                  </Link>
                ) : (
                  <span className="text-ink">{c.label}</span>
                )}
                {i < breadcrumbs.length - 1 && (
                  <ChevronRight size={14} className="text-muted/60" />
                )}
              </span>
            ))}
          </nav>
        )}
        {eyebrow && <p className="eyebrow mb-4">{eyebrow}</p>}
        <h1 className="max-w-3xl text-4xl leading-[1.08] sm:text-5xl lg:text-6xl">
          {title}
        </h1>
        {description && (
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">
            {description}
          </p>
        )}
      </Container>
    </section>
  );
}
