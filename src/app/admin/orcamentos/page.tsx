import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { CloseQuoteForm } from "@/components/quotes/CloseQuoteForm";
import { requireApprovedAdmin } from "@/lib/admin/access";
import { formatQuoteDate, quoteStateLabel } from "@/lib/quotes/labels";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Orçamentos",
  description: "Pedidos de orçamento enviados por compradores aprovados.",
};

export default async function AdminQuotesPage({
  searchParams,
}: {
  searchParams: Promise<{ feito?: string }>;
}) {
  await requireApprovedAdmin();
  const params = await searchParams;
  const supabase = await createClient();
  const { data: quotes } = await supabase
    .from("quote_requests")
    .select("id, buyer_id, catalog_id, supplier_id, message, state, created_at")
    .order("state")
    .order("created_at", { ascending: false });

  const rows = quotes ?? [];
  const buyerIds = [...new Set(rows.map((row) => row.buyer_id))];
  const catalogIds = [...new Set(rows.map((row) => row.catalog_id))];
  const supplierIds = [...new Set(rows.map((row) => row.supplier_id))];
  const [{ data: buyers }, { data: catalogs }, { data: suppliers }] = await Promise.all([
    buyerIds.length
      ? supabase.from("buyers").select("id, company_name, profile_id").in("id", buyerIds)
      : Promise.resolve({ data: [] as { id: string; company_name: string; profile_id: string }[] }),
    catalogIds.length
      ? supabase.from("catalogs").select("id, title").in("id", catalogIds)
      : Promise.resolve({ data: [] as { id: string; title: string }[] }),
    supplierIds.length
      ? supabase.from("suppliers").select("id, trade_name").in("id", supplierIds)
      : Promise.resolve({ data: [] as { id: string; trade_name: string }[] }),
  ]);
  const profileIds = [...new Set((buyers ?? []).map((buyer) => buyer.profile_id))];
  const { data: profiles } = profileIds.length
    ? await supabase.from("profiles").select("id, full_name, email").in("id", profileIds)
    : { data: [] as { id: string; full_name: string; email: string | null }[] };

  const buyerById = new Map((buyers ?? []).map((buyer) => [buyer.id, buyer]));
  const profileById = new Map((profiles ?? []).map((profile) => [profile.id, profile]));
  const catalogTitle = new Map((catalogs ?? []).map((catalog) => [catalog.id, catalog.title]));
  const supplierName = new Map((suppliers ?? []).map((supplier) => [supplier.id, supplier.trade_name]));

  return (
    <>
      <PageHeader
        eyebrow="Administração"
        title="Pedidos de orçamento"
        description="Solicitações de compradores aprovados. Encerrar não apaga a mensagem nem troca o comprador, o catálogo ou o fornecedor."
        breadcrumbs={[
          { label: "Início", href: "/" },
          { label: "Painel", href: "/admin" },
          { label: "Orçamentos" },
        ]}
      />
      <Container className="grid gap-8 py-16">
        {params.feito === "encerrado" ? (
          <p className="max-w-xl rounded-sm border border-line bg-paper px-4 py-3 text-sm text-ink" role="status">
            Pedido encerrado.
          </p>
        ) : null}
        <ul className="divide-y divide-line border-y border-line">
          {rows.length === 0 ? (
            <li className="py-4 text-muted">Nenhum pedido de orçamento.</li>
          ) : (
            rows.map((quote) => {
              const buyer = buyerById.get(quote.buyer_id);
              const profile = buyer ? profileById.get(buyer.profile_id) : undefined;
              return (
                <li key={quote.id} className="grid gap-2 py-5">
                  <div className="flex flex-wrap items-baseline justify-between gap-3">
                    <p className="text-ink">{buyer?.company_name ?? "Comprador"}</p>
                    <p className="text-sm text-muted">
                      {quoteStateLabel[quote.state]} · {formatQuoteDate(quote.created_at)}
                    </p>
                  </div>
                  <p className="text-sm text-muted">
                    {profile?.full_name || "Comprador"}
                    {profile?.email ? ` · ${profile.email}` : ""}
                  </p>
                  <p className="text-sm text-ink">
                    {catalogTitle.get(quote.catalog_id) ?? "Catálogo"} · {supplierName.get(quote.supplier_id) ?? "Fornecedor"}
                  </p>
                  <p className="max-w-2xl whitespace-pre-wrap text-sm leading-relaxed text-muted">{quote.message}</p>
                  {quote.state === "aberta" ? <CloseQuoteForm id={quote.id} /> : null}
                </li>
              );
            })
          )}
        </ul>
        <Link href="/admin" className="text-sm text-ink underline underline-offset-4 hover:text-brass">
          Voltar ao painel
        </Link>
      </Container>
    </>
  );
}
