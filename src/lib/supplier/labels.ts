import type { ApprovalStatus, CatalogVisibility } from "@/lib/supabase/database.types";

export const approvalLabel: Record<ApprovalStatus, string> = {
  pendente: "Pendente",
  aprovado: "Aprovado",
  rejeitado: "Rejeitado",
  suspenso: "Suspenso",
};

export const visibilityLabel: Record<CatalogVisibility, string> = {
  publico: "Público",
  restrito: "Restrito",
};

export function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function categoryOptions(
  rows: { id: string; parent_id: string | null; name: string; sort_order: number }[],
) {
  const names = new Map(rows.map((row) => [row.id, row.name]));
  return [...rows]
    .sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name, "pt"))
    .map((row) => ({
      id: row.id,
      label: row.parent_id && names.get(row.parent_id) ? `${names.get(row.parent_id)} · ${row.name}` : row.name,
    }));
}
