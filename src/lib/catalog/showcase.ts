import { createClient } from "@/lib/supabase/server";
import { getSupabasePublicEnv } from "@/lib/supabase/env";
import type { CatalogVisibility } from "@/lib/supabase/database.types";

export type ShowcaseCatalog = {
  id: string;
  title: string;
  description: string | null;
  visibility: CatalogVisibility;
  categoryName: string;
  categorySlug: string;
  supplierId: string;
  supplierName: string | null;
};

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function loadPublishedCatalogs(): Promise<ShowcaseCatalog[]> {
  if (!getSupabasePublicEnv()) return [];

  const supabase = await createClient();
  const { data: catalogs } = await supabase
    .from("catalogs")
    .select("id, title, description, visibility, category_id, supplier_id")
    .eq("status", "aprovado")
    .not("published_at", "is", null)
    .not("published_pdf_id", "is", null)
    .order("published_at", { ascending: false });

  const rows = catalogs ?? [];
  if (rows.length === 0) return [];

  const categoryIds = [...new Set(rows.map((row) => row.category_id))];
  const supplierIds = [...new Set(rows.map((row) => row.supplier_id))];
  const [{ data: categories }, { data: suppliers }] = await Promise.all([
    supabase.from("catalog_categories").select("id, name, slug").in("id", categoryIds),
    supabase.from("suppliers").select("id, trade_name").in("id", supplierIds),
  ]);
  const categoryById = new Map((categories ?? []).map((category) => [category.id, category]));
  const supplierName = new Map((suppliers ?? []).map((supplier) => [supplier.id, supplier.trade_name]));

  return rows.map((row) => {
    const category = categoryById.get(row.category_id);
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      visibility: row.visibility,
      categoryName: category?.name ?? "Categoria",
      categorySlug: category?.slug ?? "",
      supplierId: row.supplier_id,
      supplierName: supplierName.get(row.supplier_id) ?? null,
    };
  });
}

export async function loadPublicCatalogs(): Promise<ShowcaseCatalog[]> {
  const catalogs = await loadPublishedCatalogs();
  return catalogs.filter((catalog) => catalog.visibility === "publico");
}

export function catalogCategories(catalogs: ShowcaseCatalog[]) {
  return [...new Map(catalogs.map((catalog) => [catalog.categorySlug, catalog.categoryName])).entries()]
    .filter(([slug]) => slug)
    .map(([slug, name]) => ({ slug, name }))
    .sort((a, b) => a.name.localeCompare(b.name, "pt"));
}

export async function loadPublishedCatalog(id: string): Promise<ShowcaseCatalog | null> {
  if (!uuidPattern.test(id) || !getSupabasePublicEnv()) return null;
  const catalogs = await loadPublishedCatalogs();
  return catalogs.find((catalog) => catalog.id === id) ?? null;
}
