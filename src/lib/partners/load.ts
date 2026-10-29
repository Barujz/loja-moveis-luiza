import { createClient } from "@/lib/supabase/server";
import { getSupabasePublicEnv } from "@/lib/supabase/env";
import { loadPublishedCatalogs, type ShowcaseCatalog } from "@/lib/catalog/showcase";

export type PartnerCompany = {
  id: string;
  tradeName: string;
  description: string;
  logo: string | null;
  segment: string;
  categories: { slug: string; name: string }[];
};

function publicLogo(value: string) {
  return value.startsWith("https://") ? value : null;
}

async function partnerDirectory() {
  if (!getSupabasePublicEnv()) return { companies: [] as PartnerCompany[], catalogs: [] as ShowcaseCatalog[] };
  const supabase = await createClient();
  const [{ data, error }, catalogs] = await Promise.all([
    supabase.rpc("partner_companies"),
    loadPublishedCatalogs(),
  ]);
  if (error || !data) {
    console.error("Falha ao listar empresas parceiras.");
    return { companies: [] as PartnerCompany[], catalogs };
  }

  const companies = data.map((company) => {
    const own = catalogs.filter((catalog) => catalog.supplierId === company.id);
    const categories = [...new Map(own.map((catalog) => [catalog.categorySlug, catalog.categoryName])).entries()]
      .filter(([slug]) => slug)
      .map(([slug, name]) => ({ slug, name }))
      .sort((a, b) => a.name.localeCompare(b.name, "pt"));
    return {
      id: company.id,
      tradeName: company.trade_name,
      description: company.description,
      logo: publicLogo(company.logo),
      segment: company.segment,
      categories,
    };
  });
  return { companies, catalogs };
}

export async function loadPartnerCompanies(): Promise<PartnerCompany[]> {
  return (await partnerDirectory()).companies;
}

export async function loadPartner(id: string) {
  const { companies, catalogs } = await partnerDirectory();
  const company = companies.find((item) => item.id === id) ?? null;
  if (!company) return null;
  return { company, catalogs: catalogs.filter((catalog) => catalog.supplierId === id) };
}

export type { ShowcaseCatalog };
