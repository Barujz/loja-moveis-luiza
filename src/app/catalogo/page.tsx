import { Suspense } from "react";
import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { CatalogGrid } from "@/components/catalog/CatalogGrid";
import { categories, type CategorySlug } from "@/lib/products";

export const metadata: Metadata = {
  title: "Catálogo",
  description:
    "Explore poltronas, sofás, mesas, iluminação e decoração de luxo para projetos de hotelaria.",
};

type Filter = CategorySlug | "todos";

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string }>;
}) {
  const { categoria } = await searchParams;
  const valid = categories.some((c) => c.slug === categoria);
  const initial: Filter = valid ? (categoria as CategorySlug) : "todos";

  return (
    <>
      <PageHeader
        eyebrow="Catálogo"
        title="Peças que definem ambientes"
        description="Curadoria de mobiliário e objetos para hotéis e projetos de hospitalidade. Preços de referência — condições especiais para grandes volumes."
        breadcrumbs={[{ label: "Início", href: "/" }, { label: "Catálogo" }]}
      />
      <Container className="py-16">
        <Suspense fallback={<div className="min-h-[40vh]" />}>
          <CatalogGrid initialCategory={initial} />
        </Suspense>
      </Container>
    </>
  );
}
