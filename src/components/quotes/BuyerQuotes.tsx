import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatQuoteDate, quoteStateLabel } from "@/lib/quotes/labels";

export async function BuyerQuotes() {
  const supabase = await createClient();
  const { data: quotes } = await supabase
    .from("quote_requests")
    .select("id, catalog_id, message, state, created_at")
    .order("created_at", { ascending: false });

  const rows = quotes ?? [];
  const catalogIds = [...new Set(rows.map((row) => row.catalog_id))];
  const { data: catalogs } = catalogIds.length
    ? await supabase.from("catalogs").select("id, title").in("id", catalogIds)
    : { data: [] as { id: string; title: string }[] };
  const titles = new Map((catalogs ?? []).map((catalog) => [catalog.id, catalog.title]));

  return (
    <section className="grid gap-4">
      <h2 className="font-display text-3xl text-ink">Pedidos de orçamento</h2>
      {rows.length === 0 ? (
        <p className="text-sm text-muted">Nenhum pedido ainda. Abra um catálogo publicado para solicitar.</p>
      ) : (
        <ul className="divide-y divide-line border-y border-line">
          {rows.map((quote) => (
            <li key={quote.id} className="grid gap-2 py-4">
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <Link href={`/catalogo/${quote.catalog_id}`} className="text-ink underline underline-offset-4 hover:text-brass">
                  {titles.get(quote.catalog_id) ?? "Catálogo indisponível"}
                </Link>
                <p className="text-sm text-muted">
                  {quoteStateLabel[quote.state]} · {formatQuoteDate(quote.created_at)}
                </p>
              </div>
              <p className="max-w-2xl whitespace-pre-wrap text-sm leading-relaxed text-muted">{quote.message}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
