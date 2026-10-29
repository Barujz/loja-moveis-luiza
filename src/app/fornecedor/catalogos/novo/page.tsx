import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { CatalogForm } from "@/components/supplier/CatalogForm";
import { loadActiveCategories, requireApprovedSupplier } from "@/lib/supplier/access";

export const metadata: Metadata = { title: "Novo catálogo" };

export default async function NewCatalogPage() {
  const { supabase } = await requireApprovedSupplier();
  const categories = await loadActiveCategories(supabase);

  return (
    <>
      <PageHeader
        eyebrow="Catálogo"
        title="Novo catálogo"
        description="O registro nasce pendente. O PDF será enviado depois."
        breadcrumbs={[
          { label: "Início", href: "/" },
          { label: "Fornecedor", href: "/fornecedor" },
          { label: "Novo catálogo" },
        ]}
      />
      <Container className="py-16">
        {categories.length === 0 ? (
          <p className="text-muted">Não há categoria ativa para vincular um catálogo.</p>
        ) : (
          <CatalogForm categories={categories} />
        )}
      </Container>
    </>
  );
}
