import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { approvedBuyerContext } from "@/lib/quotes/access";
import { QuoteRequestForm } from "@/components/quotes/QuoteRequestForm";

export async function CatalogQuote({ catalogId, sent }: { catalogId: string; sent: boolean }) {
  const { supabase, userId, buyerId } = await approvedBuyerContext();

  let open = false;
  if (buyerId) {
    const { data } = await supabase
      .from("quote_requests")
      .select("id")
      .eq("buyer_id", buyerId)
      .eq("catalog_id", catalogId)
      .eq("state", "aberta")
      .maybeSingle();
    open = Boolean(data);
  }

  return (
    <section className="grid max-w-xl gap-4">
      <h2 className="font-display text-3xl text-ink">Solicitar orçamento</h2>
      {!userId ? (
        <>
          <p className="text-sm leading-relaxed text-muted">
            Entre com uma conta de comprador aprovada para pedir orçamento deste catálogo.
          </p>
          <div>
            <Button href={`/entrar?next=/catalogo/${catalogId}`}>Entrar</Button>
          </div>
        </>
      ) : !buyerId ? (
        <p className="text-sm leading-relaxed text-muted">
          Somente compradores com perfil e empresa aprovados podem pedir orçamento.
        </p>
      ) : open ? (
        <>
          {sent ? (
            <p className="rounded-sm border border-line bg-paper px-4 py-3 text-sm text-ink" role="status">
              Pedido enviado. Acompanhe a solicitação na sua conta.
            </p>
          ) : (
            <p className="text-sm leading-relaxed text-muted">Você já tem um pedido aberto para este catálogo.</p>
          )}
          <Link href="/conta" className="text-sm text-ink underline underline-offset-4 hover:text-brass">
            Ver meus pedidos
          </Link>
        </>
      ) : (
        <>
          <p className="text-sm leading-relaxed text-muted">
            O pedido fica ligado à sua empresa, a este catálogo e ao fornecedor dele.
          </p>
          <QuoteRequestForm catalogId={catalogId} />
        </>
      )}
    </section>
  );
}
