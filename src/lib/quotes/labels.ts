import type { QuoteState } from "@/lib/supabase/database.types";

export const quoteStateLabel: Record<QuoteState, string> = {
  aberta: "Aberta",
  encerrada: "Encerrada",
};

export function formatQuoteDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(date);
}
