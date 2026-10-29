import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { CatalogForm } from "@/components/supplier/CatalogForm";
import { PdfUpload } from "@/components/supplier/PdfUpload";
import { loadActiveCategories, requireApprovedSupplier } from "@/lib/supplier/access";
import { approvalLabel, formatFileSize, visibilityLabel } from "@/lib/supplier/labels";

export const metadata: Metadata = { title: "Editar catálogo" };

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function EditCatalogPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ salvo?: string }>;
}) {
  const { id } = await params;
  if (!uuidPattern.test(id)) notFound();

  const { supplier, supabase } = await requireApprovedSupplier();
  const [{ data: catalog }, categories, { data: files }, saved] = await Promise.all([
    supabase
      .from("catalogs")
      .select("id, supplier_id, title, slug, description, visibility, status, category_id")
      .eq("id", id)
      .eq("supplier_id", supplier.id)
      .maybeSingle(),
    loadActiveCategories(supabase),
    supabase
      .from("catalog_files")
      .select("id, byte_size, status, created_at, superseded_at")
      .eq("catalog_id", id)
      .eq("supplier_id", supplier.id)
      .eq("kind", "pdf")
      .order("created_at", { ascending: true }),
    searchParams,
  ]);

  if (!catalog || catalog.supplier_id !== supplier.id) notFound();

  const versions = new Map((files ?? []).map((file, index) => [file.id, index + 1]));
  const newestFirst = [...(files ?? [])].reverse();

  return (
    <>
      <PageHeader
        eyebrow={approvalLabel[catalog.status]}
        title={catalog.title}
        description={`${visibilityLabel[catalog.visibility]}. A aprovação continua com a Luiza.`}
        breadcrumbs={[
          { label: "Início", href: "/" },
          { label: "Fornecedor", href: "/fornecedor" },
          { label: "Catálogo" },
        ]}
      />
      <Container className="grid gap-8 py-16">
        {saved.salvo === "1" ? (
          <p className="mx-auto max-w-xl rounded-sm border border-line bg-cream px-4 py-3 text-sm text-ink" role="status">
            Catálogo salvo. O status de aprovação é {approvalLabel[catalog.status].toLowerCase()}.
          </p>
        ) : null}
        <CatalogForm
          categories={categories}
          catalog={{
            id: catalog.id,
            title: catalog.title,
            description: catalog.description ?? "",
            visibility: catalog.visibility,
            categoryId: catalog.category_id,
            slug: catalog.slug ?? "",
            status: catalog.status,
          }}
        />
        <section className="mx-auto grid w-full max-w-xl gap-6">
          <h2 className="font-display text-3xl text-ink">PDFs</h2>
          <ul className="divide-y divide-line border-y border-line">
            {newestFirst.length === 0 ? (
              <li className="py-4 text-muted">Nenhum PDF enviado.</li>
            ) : (
              newestFirst.map((file) => (
                <li key={file.id} className="flex flex-wrap items-baseline justify-between gap-3 py-4">
                  <p className="text-ink">Versão {versions.get(file.id)}</p>
                  <p className="text-sm text-muted">
                    {approvalLabel[file.status]} · {formatFileSize(file.byte_size)} ·{" "}
                    {new Date(file.created_at).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
                    {file.superseded_at ? " · Fora de uso" : ""}
                  </p>
                </li>
              ))
            )}
          </ul>
          <PdfUpload catalogId={catalog.id} />
        </section>
      </Container>
    </>
  );
}
