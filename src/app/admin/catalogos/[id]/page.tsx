import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { DetailList } from "@/components/admin/DetailList";
import { CatalogDecisionForm, FileDecisionForm } from "@/components/admin/CatalogReview";
import { requireApprovedAdmin } from "@/lib/admin/access";
import { createClient } from "@/lib/supabase/server";
import { approvalLabel, formatFileSize, visibilityLabel } from "@/lib/supplier/labels";

export const metadata: Metadata = { title: "Catálogo" };

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const notices: Record<string, string> = {
  "arquivo-aprovado": "PDF aprovado. O catálogo continua pendente até a aprovação dele.",
  "arquivo-publicado": "PDF aprovado. Esta versão passou a ser a publicada e a anterior ficou no histórico.",
  "arquivo-rejeitado": "PDF rejeitado. A decisão ficou no histórico.",
  "arquivo-suspenso": "PDF suspenso. A decisão ficou no histórico.",
};

export default async function AdminCatalogPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ feito?: string }>;
}) {
  await requireApprovedAdmin();
  const { id } = await params;
  if (!uuidPattern.test(id)) notFound();

  const [{ feito }, supabase] = await Promise.all([searchParams, createClient()]);
  const { data: catalog } = await supabase
    .from("catalogs")
    .select("id, supplier_id, category_id, title, description, visibility, status")
    .eq("id", id)
    .maybeSingle();
  if (!catalog) notFound();

  const [{ data: supplier }, { data: category }, { data: files }] = await Promise.all([
    supabase.from("suppliers").select("trade_name, legal_name, status").eq("id", catalog.supplier_id).maybeSingle(),
    supabase.from("catalog_categories").select("name").eq("id", catalog.category_id).maybeSingle(),
    supabase
      .from("catalog_files")
      .select("id, status, byte_size, created_at, superseded_at")
      .eq("catalog_id", catalog.id)
      .eq("kind", "pdf")
      .order("created_at", { ascending: true }),
  ]);

  const versions = new Map((files ?? []).map((file, index) => [file.id, index + 1]));
  const newestFirst = [...(files ?? [])].reverse();
  const approvedPdf = (files ?? []).some((file) => file.status === "aprovado" && !file.superseded_at);
  const notice = feito ? notices[feito] : null;

  return (
    <>
      <PageHeader
        eyebrow={approvalLabel[catalog.status]}
        title={catalog.title}
        description="Aprove o PDF antes do catálogo. Uma versão nova aprovada substitui a publicada e conserva a anterior no histórico."
        breadcrumbs={[
          { label: "Início", href: "/" },
          { label: "Painel", href: "/admin" },
          { label: "Catálogo" },
        ]}
      />
      <Container className="grid gap-12 py-16">
        {notice ? (
          <p className="max-w-xl rounded-sm border border-line bg-paper px-4 py-3 text-sm text-ink" role="status">
            {notice}
          </p>
        ) : null}
        <DetailList
          rows={[
            { label: "Fornecedor", value: supplier ? `${supplier.trade_name} (${approvalLabel[supplier.status]})` : null },
            { label: "Razão social", value: supplier?.legal_name ?? null },
            { label: "Categoria", value: category?.name ?? null },
            { label: "Visibilidade", value: visibilityLabel[catalog.visibility] },
            { label: "Catálogo", value: approvalLabel[catalog.status] },
            { label: "PDF aprovado", value: approvedPdf ? "Sim" : "Ainda não" },
            { label: "Descrição", value: catalog.description },
          ]}
        />
        {!approvedPdf || (catalog.description ?? "").trim().length < 10 || supplier?.status !== "aprovado" ? (
          <p className="max-w-xl text-sm text-muted">
            A aprovação do catálogo exige fornecedor aprovado, descrição com ao menos 10 caracteres e um PDF já aprovado.
          </p>
        ) : null}
        <section className="grid gap-6">
          <h2 className="font-display text-3xl text-ink">PDFs</h2>
          <ul className="divide-y divide-line border-y border-line">
            {newestFirst.length === 0 ? (
              <li className="py-4 text-muted">Nenhum PDF enviado.</li>
            ) : (
              newestFirst.map((file) => (
                <li key={file.id} className="py-4">
                  <div className="flex flex-wrap items-baseline justify-between gap-3">
                    <p className="text-ink">
                      Versão {versions.get(file.id)}
                      {file.superseded_at ? " · Histórico" : ""}
                    </p>
                    <p className="text-sm text-muted">
                      {approvalLabel[file.status]} · {formatFileSize(file.byte_size)} ·{" "}
                      {new Date(file.created_at).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
                    </p>
                  </div>
                  <Link
                    href={`/admin/catalogos/${catalog.id}/pdf/${file.id}`}
                    className="mt-2 inline-block text-sm text-ink underline underline-offset-4 hover:text-brass"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Abrir PDF
                  </Link>
                  <FileDecisionForm
                    catalogId={catalog.id}
                    fileId={file.id}
                    status={file.status}
                    current={!file.superseded_at}
                  />
                </li>
              ))
            )}
          </ul>
        </section>
        <CatalogDecisionForm id={catalog.id} status={catalog.status} />
      </Container>
    </>
  );
}
