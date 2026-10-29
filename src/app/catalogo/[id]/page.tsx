import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { DetailList } from "@/components/admin/DetailList";
import { Button } from "@/components/ui/Button";
import { CatalogQuote } from "@/components/quotes/CatalogQuote";
import { loadPublishedCatalog } from "@/lib/catalog/showcase";
import { visibilityLabel } from "@/lib/supplier/labels";

type Params = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const catalog = await loadPublishedCatalog(id);
  if (!catalog) return { title: "Catálogo indisponível" };
  return { title: catalog.title, description: catalog.description ?? "Catálogo publicado." };
}

export default async function PublishedCatalogPage({
  params,
  searchParams,
}: Params & { searchParams: Promise<{ pedido?: string }> }) {
  const { id } = await params;
  const query = await searchParams;
  const catalog = await loadPublishedCatalog(id);

  if (!catalog) {
    return (
      <>
        <PageHeader
          eyebrow="Catálogo"
          title="Catálogo indisponível"
          description="Este catálogo não está publicado ou esta sessão não pode vê-lo."
          breadcrumbs={[{ label: "Início", href: "/" }, { label: "Catálogo", href: "/catalogo" }, { label: "Indisponível" }]}
        />
        <Container className="py-16">
          <Link href="/catalogo" className="text-sm text-ink underline underline-offset-4 hover:text-brass">
            Voltar aos catálogos
          </Link>
        </Container>
      </>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow={catalog.categoryName}
        title={catalog.title}
        description={visibilityLabel[catalog.visibility]}
        breadcrumbs={[
          { label: "Início", href: "/" },
          { label: "Catálogo", href: "/catalogo" },
          { label: catalog.title },
        ]}
      />
      <Container className="grid gap-10 py-16">
        <DetailList
          rows={[
            { label: "Fornecedor", value: catalog.supplierName ?? "Fornecedor aprovado" },
            { label: "Categoria", value: catalog.categoryName },
            { label: "Visibilidade", value: visibilityLabel[catalog.visibility] },
            { label: "PDF", value: "Publicado e disponível para esta sessão" },
            { label: "Descrição", value: catalog.description },
          ]}
        />
        <Button href={`/catalogo/${catalog.id}/pdf`}>Abrir PDF</Button>
        <CatalogQuote catalogId={catalog.id} sent={query.pedido === "enviado"} />
      </Container>
    </>
  );
}
