import { createClient } from "@/lib/supabase/server";
import { getSupabasePublicEnv } from "@/lib/supabase/env";

export type TechnologyProfile = {
  summary: string | null;
  logoUrl: string | null;
  published: boolean;
};

export type TechnologySolution = {
  id: string;
  title: string;
  description: string;
  imageUrl: string | null;
  icon: string | null;
  linkUrl: string | null;
  sortOrder: number;
  published: boolean;
};

const icons = new Set(["layers", "spark", "shield", "cpu"]);

function httpsUrl(value: string | null) {
  return value && value.startsWith("https://") ? value : null;
}

export async function loadTechnology(includeDrafts: boolean) {
  const empty = { profile: null as TechnologyProfile | null, solutions: [] as TechnologySolution[], unavailable: false };
  if (!getSupabasePublicEnv()) return { ...empty, unavailable: true };

  const supabase = await createClient();
  let profileQuery = supabase.from("technology_profile").select("summary, logo_url, published");
  let solutionQuery = supabase
    .from("technology_solutions")
    .select("id, title, description, image_url, icon, link_url, sort_order, published")
    .order("sort_order")
    .order("title");
  if (!includeDrafts) {
    profileQuery = profileQuery.eq("published", true);
    solutionQuery = solutionQuery.eq("published", true);
  }

  const [{ data: profile, error: profileError }, { data: solutions, error: solutionError }] = await Promise.all([
    profileQuery.maybeSingle(),
    solutionQuery,
  ]);
  if (profileError || solutionError) {
    console.error("Falha ao ler a área de tecnologia.");
    return { ...empty, unavailable: true };
  }

  return {
    unavailable: false,
    profile: profile
      ? { summary: profile.summary, logoUrl: httpsUrl(profile.logo_url), published: profile.published }
      : null,
    solutions: (solutions ?? []).map((solution) => ({
      id: solution.id,
      title: solution.title,
      description: solution.description,
      imageUrl: httpsUrl(solution.image_url),
      icon: solution.icon && icons.has(solution.icon) ? solution.icon : null,
      linkUrl: solution.link_url,
      sortOrder: solution.sort_order,
      published: solution.published,
    })),
  };
}
