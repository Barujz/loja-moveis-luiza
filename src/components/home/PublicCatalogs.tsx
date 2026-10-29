import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { catalogCategories, loadPublicCatalogs } from "@/lib/catalog/showcase";

export async function PublicCatalogs() {
  const catalogs = await loadPublicCatalogs();
  const categories = catalogCategories(catalogs);
  const highlighted = catalogs.slice(0, 6);

  return (
    <section className="py-24">
      <Container>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-xl">
            <p className="eyebrow mb-4">Catálogos públicos</p>
            <h2 className="text-4xl leading-[1.1] sm:text-5xl">
              {highlighted.length > 0 ? "Publicados para consulta" : "A vitrine pública"}
            </h2>
            <p className="mt-5 text-base leading-relaxed text-muted sm:text-lg">
              {highlighted.length > 0
                ? "Estes catálogos estão aprovados, com PDF publicado e visíveis sem login. Os restritos ficam fora desta página."
                : "Ainda não há catálogo público nesta vitrine. A lista completa, inclusive o que a sua conta pode ver, está em Catálogo."}
            </p>
          </div>
          <Link href="/catalogo" className="link-underline inline-flex items-center gap-2 text-sm font-medium text-ink hover:text-brass">
            Abrir catálogo
            <ArrowRight size={16} />
          </Link>
        </div>

        {categories.length > 0 ? (
          <div className="mt-10 flex flex-wrap gap-2.5">
            {categories.map((category) => (
              <Link
                key={category.slug}
                href={`/catalogo?categoria=${category.slug}`}
                className="rounded-full border border-line px-5 py-2.5 text-sm text-ink transition-colors hover:border-brass hover:text-brass"
              >
                {category.name}
              </Link>
            ))}
          </div>
        ) : null}

        {highlighted.length > 0 ? (
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {highlighted.map((catalog) => (
              <Link key={catalog.id} href={`/catalogo/${catalog.id}`} className="group block rounded-sm border border-line bg-paper p-6">
                <p className="text-[11px] uppercase tracking-[0.18em] text-muted">{catalog.categoryName}</p>
                <h3 className="mt-2 font-display text-2xl text-ink transition-colors group-hover:text-brass">{catalog.title}</h3>
                <p className="mt-3 line-clamp-3 text-sm text-muted">{catalog.description?.trim() || "Catálogo publicado."}</p>
              </Link>
            ))}
          </div>
        ) : (
          <div className="mt-12 max-w-xl rounded-sm border border-line bg-paper px-8 py-12">
            <p className="font-display text-3xl text-ink">Nenhum catálogo público no momento</p>
            <p className="mt-4 text-sm leading-relaxed text-muted">
              Explore a página de catálogos. Quem entra com uma conta aprovada vê também o que for restrito à sua sessão.
            </p>
            <div className="mt-8">
              <Button href="/catalogo">Explorar catálogo</Button>
            </div>
          </div>
        )}
      </Container>
    </section>
  );
}
