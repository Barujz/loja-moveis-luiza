import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { PartnerMark } from "@/components/partners/PartnerMark";
import { fieldClass } from "@/components/auth/AuthFields";
import { cn } from "@/lib/cn";
import { loadPartnerCompanies } from "@/lib/partners/load";

export const metadata: Metadata = {
  title: "Empresas parceiras",
  description: "Fornecedores aprovados da Luiza, com os catálogos visíveis para a sua sessão.",
};

export default async function PartnersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; categoria?: string }>;
}) {
  const params = await searchParams;
  const query = (params.q ?? "").trim().slice(0, 80);
  const companies = await loadPartnerCompanies();
  const categories = [...new Map(companies.flatMap((company) => company.categories).map((category) => [category.slug, category.name])).entries()]
    .map(([slug, name]) => ({ slug, name }))
    .sort((a, b) => a.name.localeCompare(b.name, "pt"));
  const active = categories.some((category) => category.slug === params.categoria) ? params.categoria! : "todos";
  const needle = query.toLocaleLowerCase("pt");
  const visible = companies.filter((company) => {
    const inCategory = active === "todos" || company.categories.some((category) => category.slug === active);
    return inCategory && (!needle || company.tradeName.toLocaleLowerCase("pt").includes(needle));
  });

  function href(category: string | null) {
    const search = new URLSearchParams();
    if (category) search.set("categoria", category);
    if (query) search.set("q", query);
    const qs = search.toString();
    return qs ? `/empresas?${qs}` : "/empresas";
  }

  return (
    <>
      <PageHeader
        eyebrow="Parceiras"
        title="Empresas parceiras"
        description="Fornecedores aprovados com catálogo publicado. Você vê somente os catálogos liberados para a sua sessão."
        breadcrumbs={[{ label: "Início", href: "/" }, { label: "Empresas" }]}
      />
      <Container className="py-16">
        <div className="flex flex-wrap gap-2.5">
          {[{ slug: "", name: "Todas" }, ...categories].map((filter) => {
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

        <form action="/empresas" className="mt-6 max-w-xl">
          {active !== "todos" ? <input type="hidden" name="categoria" value={active} /> : null}
          <input className={fieldClass} type="search" name="q" defaultValue={query} placeholder="Buscar pelo nome comercial" />
        </form>

        {visible.length === 0 ? (
          <p className="py-20 text-center text-muted">Nenhuma empresa parceira nesta seleção.</p>
        ) : (
          <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((company) => (
              <li key={company.id}>
                <Link href={`/empresas/${company.id}`} className="group block h-full rounded-sm border border-line bg-paper p-6">
                  <PartnerMark name={company.tradeName} logo={company.logo} />
                  <p className="mt-5 text-[11px] uppercase tracking-[0.18em] text-muted">{company.segment}</p>
                  <h2 className="mt-2 font-display text-3xl text-ink transition-colors group-hover:text-brass">{company.tradeName}</h2>
                  <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted">{company.description}</p>
                  {company.categories.length > 0 ? (
                    <p className="mt-4 text-sm text-brass">{company.categories.map((category) => category.name).join(" · ")}</p>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Container>
    </>
  );
}
