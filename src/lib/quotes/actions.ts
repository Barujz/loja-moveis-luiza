"use server";

import { redirect } from "next/navigation";
import { adminClient } from "@/lib/admin/access";
import type { AuthFormState } from "@/lib/auth/actions";
import { approvedBuyerContext, isUuid } from "@/lib/quotes/access";

function quoteError(error: { code?: string; message?: string }, fallback: string) {
  if (error.code === "23505") return "Você já tem um pedido aberto para este catálogo.";
  const message = error.message ?? "";
  if (message.length > 0 && message.length <= 220 && !/duplicate key|violates|permission denied/i.test(message)) {
    return message;
  }
  return fallback;
}

export async function requestCatalogQuote(prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const message = String(formData.get("message") ?? "").trim();
  const catalogId = String(formData.get("catalogId") ?? "");
  const fail = (error: string): AuthFormState => ({
    error,
    message: null,
    values: { message },
    attempt: (prev.attempt ?? 0) + 1,
  });

  if (!isUuid(catalogId)) return fail("Catálogo inválido.");
  if (message.length < 3 || message.length > 2000) {
    return fail("A mensagem precisa ter entre 3 e 2000 caracteres.");
  }

  const { supabase, userId, buyerId } = await approvedBuyerContext();
  if (!userId) return fail("Entre com uma conta de comprador aprovada.");
  if (!buyerId) return fail("Somente compradores com perfil e empresa aprovados podem pedir orçamento.");

  const { data: catalog, error: catalogError } = await supabase
    .from("catalogs")
    .select("id, supplier_id")
    .eq("id", catalogId)
    .eq("status", "aprovado")
    .not("published_at", "is", null)
    .not("published_pdf_id", "is", null)
    .maybeSingle();
  if (catalogError) return fail(quoteError(catalogError, "Não foi possível ler o catálogo."));
  if (!catalog) return fail("Este catálogo não está publicado para a sua conta.");

  const { data: openQuote, error: openError } = await supabase
    .from("quote_requests")
    .select("id")
    .eq("buyer_id", buyerId)
    .eq("catalog_id", catalog.id)
    .eq("state", "aberta")
    .maybeSingle();
  if (openError) return fail(quoteError(openError, "Não foi possível conferir seus pedidos."));
  if (openQuote) return fail("Você já tem um pedido aberto para este catálogo.");

  const { error } = await supabase.from("quote_requests").insert({
    buyer_id: buyerId,
    catalog_id: catalog.id,
    supplier_id: catalog.supplier_id,
    message,
    state: "aberta",
  });
  if (error) return fail(quoteError(error, "Não foi possível enviar o pedido."));

  redirect(`/catalogo/${catalog.id}?pedido=enviado`);
}

export async function closeQuoteRequest(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  if (formData.get("confirm") !== "sim") {
    return { error: "Confirme o encerramento antes de continuar.", message: null };
  }
  const id = String(formData.get("id") ?? "");
  if (!isUuid(id)) return { error: "Pedido inválido.", message: null };

  const supabase = await adminClient();
  if (!supabase) return { error: "Somente um administrador aprovado encerra pedidos.", message: null };

  const { data, error } = await supabase
    .from("quote_requests")
    .update({ state: "encerrada" })
    .eq("id", id)
    .eq("state", "aberta")
    .select("id");
  if (error) return { error: quoteError(error, "Não foi possível encerrar o pedido."), message: null };
  if (!data?.length) return { error: "Este pedido não está aberto.", message: null };

  redirect("/admin/orcamentos?feito=encerrado");
}
