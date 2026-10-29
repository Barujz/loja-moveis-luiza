import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { PartnerMark } from "@/components/partners/PartnerMark";
import { isUuid } from "@/lib/quotes/access";
import { loadPartner } from "@/lib/partners/load";
import { visibilityLabel } from "@/lib/supplier/labels";

type Params = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  if (!isUuid(id)) return { title: "Empresa" };
  const partner = await loadPartner(id);
  if (!partner) return { title: "Empresa indisponível" };
  return { title: partner.company.tradeName, description: partner.company.description };
}

export default async function PartnerPage({ params }: Params) {
  const { id } = await params;
  if (!isUuid(id)) notFound();
  const partner = await loadPartner(id);
  if (!partner) notFound();
  const { company, catalogs } = partner;

  return (
    <>
      <PageHeader
        eyebrow={company.segment}
        title={company.tradeName}
        description={company.description}
        breadcrumbs={[
          { label: "Início", href: "/" },
          { label: "Empresas", href: "/empresas" },
          { label: company.tradeName },
        ]}
      />
      <Container className="grid gap-16 py-16 lg:grid-cols-[280px_1fr]">
        <div>
          <PartnerMark name={company.tradeName} logo={company.logo} />
          <div className="mt-8">
            <Button href={catalogs.length > 0 ? "#catalogos" : "/catalogo"}>Ver catálogos</Button>
          </div>
        </div>
        <section id="catalogos">
          <h2 className="font-display text-4xl text-ink">Catálogos</h2>
          {catalogs.length === 0 ? (
            <p className="mt-5 max-w-xl text-muted">
              Nenhum catálogo visível para esta sessão. Os restritos aparecem só para compradores e administradores aprovados.
            </p>
          ) : (
            <ul className="mt-6 grid gap-4 sm:grid-cols-2">
              {catalogs.map((catalog) => (
                <li key={catalog.id}>
                  <Link href={`/catalogo/${catalog.id}`} className="group block rounded-sm border border-line bg-paper p-6">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-muted">{catalog.categoryName}</p>
                    <h3 className="mt-2 font-display text-2xl text-ink transition-colors group-hover:text-brass">{catalog.title}</h3>
                    <p className="mt-3 line-clamp-3 text-sm text-muted">{catalog.description?.trim() || "Catálogo publicado."}</p>
                    <p className="mt-4 text-sm text-brass">{visibilityLabel[catalog.visibility]}</p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </Container>
    </>
  );
}
