import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { DetailList } from "@/components/admin/DetailList";
import { requireApprovedSupplier } from "@/lib/supplier/access";
import { approvalLabel, visibilityLabel } from "@/lib/supplier/labels";
import type { ApprovalStatus } from "@/lib/supabase/database.types";

function pdfLine(statuses: ApprovalStatus[]) {
  if (statuses.length === 0) return "Sem PDF";
  const pending = statuses.filter((status) => status === "pendente").length;
  const approved = statuses.filter((status) => status === "aprovado").length;
  return `${statuses.length} PDF${statuses.length > 1 ? "s" : ""} · ${approved} aprovado${approved === 1 ? "" : "s"} · ${pending} pendente${pending === 1 ? "" : "s"}`;
}

export const metadata: Metadata = {
  title: "Fornecedor",
  description: "Catálogos da empresa aprovada.",
};

export default async function SupplierHomePage() {
  const { supplier, supabase } = await requireApprovedSupplier();
  const [{ data: catalogs }, { data: categories }, { data: files }] = await Promise.all([
    supabase
      .from("catalogs")
      .select("id, title, category_id, visibility, status")
      .eq("supplier_id", supplier.id)
      .order("updated_at", { ascending: false }),
    supabase.from("catalog_categories").select("id, name").eq("active", true),
    supabase.from("catalog_files").select("catalog_id, status").eq("supplier_id", supplier.id).eq("kind", "pdf"),
  ]);
  const categoryName = new Map((categories ?? []).map((category) => [category.id, category.name]));
  const pdfsByCatalog = new Map<string, ApprovalStatus[]>();
  for (const file of files ?? []) {
    const current = pdfsByCatalog.get(file.catalog_id) ?? [];
    current.push(file.status);
    pdfsByCatalog.set(file.catalog_id, current);
  }

  return (
    <>
      <PageHeader
        eyebrow="Fornecedor"
        title={supplier.trade_name}
        description="A empresa está aprovada. Os catálogos novos ficam pendentes até a análise da Luiza."
        breadcrumbs={[{ label: "Início", href: "/" }, { label: "Conta", href: "/conta" }, { label: "Fornecedor" }]}
      />
      <Container className="grid gap-14 py-16">
        <section className="space-y-6">
          <h2 className="font-display text-3xl text-ink">Empresa</h2>
          <DetailList
            rows={[
              { label: "Nome fantasia", value: supplier.trade_name },
              { label: "Razão social", value: supplier.legal_name },
              { label: "CNPJ", value: supplier.cnpj },
              { label: "Segmento", value: supplier.segment },
              { label: "Contato", value: supplier.commercial_contact },
              { label: "E-mail comercial", value: supplier.contact_email },
              { label: "WhatsApp", value: supplier.whatsapp },
              { label: "Logo", value: supplier.logo },
              { label: "Aprovação", value: approvalLabel[supplier.status] },
              { label: "Descrição", value: supplier.description },
            ]}
          />
        </section>
        <section className="space-y-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 className="font-display text-3xl text-ink">Catálogos</h2>
            <Button href="/fornecedor/catalogos/novo">Novo catálogo</Button>
          </div>
          <ul className="divide-y divide-line border-y border-line">
            {(catalogs ?? []).length === 0 ? (
              <li className="py-4 text-muted">Nenhum catálogo ainda.</li>
            ) : (
              catalogs?.map((catalog) => (
                <li key={catalog.id} className="flex flex-wrap items-baseline justify-between gap-3 py-4">
                  <div>
                    <p className="text-ink">{catalog.title}</p>
                    <p className="text-sm text-muted">
                      {categoryName.get(catalog.category_id) ?? "Categoria indisponível"} · {visibilityLabel[catalog.visibility]} ·{" "}
                      {approvalLabel[catalog.status]} · {pdfLine(pdfsByCatalog.get(catalog.id) ?? [])}
                    </p>
                  </div>
                  <Link
                    href={`/fornecedor/catalogos/${catalog.id}`}
                    className="text-sm text-ink underline underline-offset-4 hover:text-brass"
                  >
                    Editar
                  </Link>
                </li>
              ))
            )}
          </ul>
        </section>
      </Container>
    </>
  );
}
