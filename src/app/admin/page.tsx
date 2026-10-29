import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { requireApprovedAdmin } from "@/lib/admin/access";
import { createClient } from "@/lib/supabase/server";
import { approvalLabel, visibilityLabel } from "@/lib/supplier/labels";

export const metadata: Metadata = {
  title: "Painel",
  description: "Análise de compradores, fornecedores e catálogos pendentes.",
};

const notices: Record<string, string> = {
  aprovado: "Cadastro aprovado. A decisão ficou no histórico.",
  rejeitado: "Cadastro rejeitado. A decisão ficou no histórico.",
  corrigir: "Correção solicitada. O cadastro continua pendente até a nova análise.",
  "catalogo-aprovado": "Catálogo aprovado e publicado com o PDF vigente. A decisão ficou no histórico.",
  "catalogo-rejeitado": "Catálogo rejeitado. A decisão ficou no histórico.",
  "catalogo-suspenso": "Catálogo suspenso. Os arquivos também foram suspensos e a publicação foi retirada.",
  "catalogo-corrigir": "Correção solicitada. Se o catálogo estava aprovado, voltou para análise.",
};

type ProfileBits = { id: string; full_name: string; email: string | null };

async function namesByProfile(ids: string[]) {
  const map = new Map<string, ProfileBits>();
  if (ids.length === 0) return map;
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("id, full_name, email").in("id", ids);
  for (const profile of data ?? []) map.set(profile.id, profile);
  return map;
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ feito?: string }>;
}) {
  await requireApprovedAdmin();
  const params = await searchParams;
  const notice = params.feito ? notices[params.feito] : null;
  const supabase = await createClient();

  const [{ data: buyers }, { data: suppliers }, { data: pendingCatalogs }, { data: pendingPdfs }] = await Promise.all([
    supabase
      .from("buyers")
      .select("id, profile_id, company_name, created_at")
      .eq("status", "pendente")
      .order("created_at"),
    supabase
      .from("suppliers")
      .select("id, profile_id, trade_name, legal_name, created_at")
      .eq("status", "pendente")
      .order("created_at"),
    supabase
      .from("catalogs")
      .select("id, supplier_id, category_id, title, visibility, status, created_at")
      .eq("status", "pendente")
      .order("created_at"),
    supabase.from("catalog_files").select("catalog_id").eq("kind", "pdf").eq("status", "pendente"),
  ]);

  const queuedIds = new Set((pendingCatalogs ?? []).map((catalog) => catalog.id));
  const extraIds = [...new Set((pendingPdfs ?? []).map((file) => file.catalog_id))].filter((id) => !queuedIds.has(id));
  const { data: extraCatalogs } = extraIds.length
    ? await supabase
        .from("catalogs")
        .select("id, supplier_id, category_id, title, visibility, status, created_at")
        .in("id", extraIds)
    : { data: [] };
  const catalogs = [...(pendingCatalogs ?? []), ...(extraCatalogs ?? [])];
  const pdfWaiting = new Set((pendingPdfs ?? []).map((file) => file.catalog_id));
  const supplierIds = [...new Set(catalogs.map((catalog) => catalog.supplier_id))];
  const categoryIds = [...new Set(catalogs.map((catalog) => catalog.category_id))];
  const [{ data: catalogSuppliers }, { data: categories }] = await Promise.all([
    supplierIds.length
      ? supabase.from("suppliers").select("id, trade_name").in("id", supplierIds)
      : Promise.resolve({ data: [] as { id: string; trade_name: string }[] }),
    categoryIds.length
      ? supabase.from("catalog_categories").select("id, name").in("id", categoryIds)
      : Promise.resolve({ data: [] as { id: string; name: string }[] }),
  ]);
  const supplierName = new Map((catalogSuppliers ?? []).map((row) => [row.id, row.trade_name]));
  const categoryName = new Map((categories ?? []).map((row) => [row.id, row.name]));

  const profiles = await namesByProfile([
    ...(buyers ?? []).map((row) => row.profile_id),
    ...(suppliers ?? []).map((row) => row.profile_id),
  ]);

  return (
    <>
      <PageHeader
        eyebrow="Administração"
        title="Cadastros pendentes"
        description="Aprovar, rejeitar, suspender ou pedir correção. O histórico nasce no banco, junto com a mudança de status."
        breadcrumbs={[{ label: "Início", href: "/" }, { label: "Painel" }]}
      />
      <Container className="grid gap-14 py-16">
        {notice ? (
          <p className="max-w-xl rounded-sm border border-line bg-paper px-4 py-3 text-sm text-ink" role="status">
            {notice}
          </p>
        ) : null}
        <p className="flex flex-wrap gap-x-6 gap-y-2">
          <Link href="/admin/orcamentos" className="text-sm text-ink underline underline-offset-4 hover:text-brass">
            Pedidos de orçamento
          </Link>
          <Link href="/admin/fichas" className="text-sm text-ink underline underline-offset-4 hover:text-brass">
            Fichas cadastrais
          </Link>
          <Link href="/admin/tecnologia" className="text-sm text-ink underline underline-offset-4 hover:text-brass">
            Tecnologia
          </Link>
        </p>
        <section>
          <h2 className="font-display text-3xl text-ink">Compradores</h2>
          <ul className="mt-6 divide-y divide-line border-y border-line">
            {(buyers ?? []).length === 0 ? (
              <li className="py-4 text-muted">Nenhum comprador pendente.</li>
            ) : (
              buyers?.map((buyer) => (
                <li key={buyer.id} className="flex flex-wrap items-baseline justify-between gap-3 py-4">
                  <div>
                    <p className="text-ink">{buyer.company_name}</p>
                    <p className="text-sm text-muted">{profiles.get(buyer.profile_id)?.email}</p>
                  </div>
                  <Link href={`/admin/compradores/${buyer.id}`} className="text-sm text-ink underline underline-offset-4 hover:text-brass">
                    Ver cadastro
                  </Link>
                </li>
              ))
            )}
          </ul>
        </section>
        <section>
          <h2 className="font-display text-3xl text-ink">Fornecedores</h2>
          <ul className="mt-6 divide-y divide-line border-y border-line">
            {(suppliers ?? []).length === 0 ? (
              <li className="py-4 text-muted">Nenhum fornecedor pendente.</li>
            ) : (
              suppliers?.map((supplier) => (
                <li key={supplier.id} className="flex flex-wrap items-baseline justify-between gap-3 py-4">
                  <div>
                    <p className="text-ink">{supplier.trade_name}</p>
                    <p className="text-sm text-muted">
                      {supplier.legal_name} · {profiles.get(supplier.profile_id)?.email}
                    </p>
                  </div>
                  <Link href={`/admin/fornecedores/${supplier.id}`} className="text-sm text-ink underline underline-offset-4 hover:text-brass">
                    Ver cadastro
                  </Link>
                </li>
              ))
            )}
          </ul>
        </section>
        <section>
          <h2 className="font-display text-3xl text-ink">Catálogos</h2>
          <ul className="mt-6 divide-y divide-line border-y border-line">
            {catalogs.length === 0 ? (
              <li className="py-4 text-muted">Nenhum catálogo aguardando análise.</li>
            ) : (
              catalogs.map((catalog) => (
                <li key={catalog.id} className="flex flex-wrap items-baseline justify-between gap-3 py-4">
                  <div>
                    <p className="text-ink">{catalog.title}</p>
                    <p className="text-sm text-muted">
                      {supplierName.get(catalog.supplier_id) ?? "Fornecedor"} · {categoryName.get(catalog.category_id) ?? "Categoria"} ·{" "}
                      {visibilityLabel[catalog.visibility]} · {approvalLabel[catalog.status]}
                      {pdfWaiting.has(catalog.id) ? " · PDF pendente" : ""}
                    </p>
                  </div>
                  <Link href={`/admin/catalogos/${catalog.id}`} className="text-sm text-ink underline underline-offset-4 hover:text-brass">
                    Analisar
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
