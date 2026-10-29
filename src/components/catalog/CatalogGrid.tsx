import Link from "next/link";
import type { ShowcaseCatalog } from "@/lib/catalog/showcase";
import { visibilityLabel } from "@/lib/supplier/labels";
import { fieldClass } from "@/components/auth/AuthFields";
import { cn } from "@/lib/cn";

export function CatalogGrid({
  catalogs,
  categories,
  active,
  query,
}: {
  catalogs: ShowcaseCatalog[];
  categories: { slug: string; name: string }[];
  active: string;
  query: string;
}) {
  function href(category: string | null) {
    const params = new URLSearchParams();
    if (category) params.set("categoria", category);
    if (query) params.set("q", query);
    const qs = params.toString();
    return qs ? `/catalogo?${qs}` : "/catalogo";
  }

  const filters = [{ slug: "", name: "Todos" }, ...categories];

  return (
    <div>
      <div className="flex flex-wrap gap-2.5">
        {filters.map((filter) => {
          const selected = (filter.slug || "todos") === active;
          return (
            <Link
              key={filter.slug || "todos"}
              href={href(filter.slug || null)}
              className={cn(
                "rounded-full border px-5 py-2.5 text-sm transition-all duration-300",
                selected ? "border-ink bg-ink text-cream" : "border-line text-ink hover:border-brass hover:text-brass",
              )}
            >
              {filter.name}
            </Link>
          );
        })}
      </div>

      <form action="/catalogo" className="mt-6 max-w-xl">
        {active !== "todos" ? <input type="hidden" name="categoria" value={active} /> : null}
        <input className={fieldClass} type="search" name="q" defaultValue={query} placeholder="Buscar por título ou descrição" />
      </form>

      <p className="mt-8 text-sm text-muted">
        {catalogs.length} {catalogs.length === 1 ? "catálogo encontrado" : "catálogos encontrados"}
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {catalogs.map((catalog) => (
          <Link key={catalog.id} href={`/catalogo/${catalog.id}`} className="group block rounded-sm border border-line bg-paper p-6">
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted">{catalog.categoryName}</p>
            <h2 className="mt-2 font-display text-2xl text-ink transition-colors group-hover:text-brass">{catalog.title}</h2>
            <p className="mt-3 line-clamp-3 text-sm text-muted">{catalog.description?.trim() || "Catálogo publicado."}</p>
            <p className="mt-4 text-sm text-brass">
              {visibilityLabel[catalog.visibility]}
              {catalog.supplierName ? ` · ${catalog.supplierName}` : ""}
            </p>
          </Link>
        ))}
      </div>

      {catalogs.length === 0 ? <p className="py-20 text-center text-muted">Nenhum catálogo publicado nesta seleção.</p> : null}
    </div>
  );
}
