import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { CatalogGrid } from "@/components/catalog/CatalogGrid";
import { loadPublishedCatalogs } from "@/lib/catalog/showcase";
import { getAccount } from "@/lib/auth/account";
import { createClient } from "@/lib/supabase/server";
import { getSupabasePublicEnv } from "@/lib/supabase/env";

export const metadata: Metadata = {
  title: "Catálogo",
  description: "Catálogos publicados pelos fornecedores aprovados da Luiza.",
};

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string; q?: string }>;
}) {
  const params = await searchParams;
  const query = (params.q ?? "").trim().slice(0, 80);
  const published = await loadPublishedCatalogs();
  const categories = [...new Map(published.map((catalog) => [catalog.categorySlug, catalog.categoryName])).entries()]
    .filter(([slug]) => slug)
    .map(([slug, name]) => ({ slug, name }))
    .sort((a, b) => a.name.localeCompare(b.name, "pt"));
  const active = categories.some((category) => category.slug === params.categoria) ? params.categoria! : "todos";
  const needle = query.toLocaleLowerCase("pt");
  const catalogs = published.filter((catalog) => {
    const inCategory = active === "todos" || catalog.categorySlug === active;
    const haystack = `${catalog.title} ${catalog.description ?? ""} ${catalog.categoryName}`.toLocaleLowerCase("pt");
    return inCategory && (!needle || haystack.includes(needle));
  });
  const restrictedAccess = await canSeeRestricted();

  return (
    <>
      <PageHeader
        eyebrow="Catálogo"
        title="Catálogos publicados"
        description="Somente catálogos aprovados, com PDF publicado. Os restritos aparecem para compradores aprovados."
        breadcrumbs={[{ label: "Início", href: "/" }, { label: "Catálogo" }]}
      />
      <Container className="py-16">
        {restrictedAccess ? null : (
          <p className="mb-8 max-w-xl text-sm text-muted">
            Visitantes e contas ainda não aprovadas veem apenas os catálogos públicos.
          </p>
        )}
        <CatalogGrid catalogs={catalogs} categories={categories} active={active} query={query} />
      </Container>
    </>
  );
}

async function canSeeRestricted() {
  const account = await getAccount();
  if (!account || account.status !== "aprovado" || !getSupabasePublicEnv()) return false;
  if (account.role === "administrador") return true;
  if (account.role !== "comprador") return false;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;
  const { data } = await supabase.from("buyers").select("status").eq("profile_id", user.id).maybeSingle();
  return data?.status === "aprovado";
}
