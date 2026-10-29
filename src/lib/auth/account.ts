import { createClient } from "@/lib/supabase/server";
import { getSupabasePublicEnv } from "@/lib/supabase/env";
import type { ApprovalStatus, UserRole } from "@/lib/supabase/database.types";

export type AccountSnapshot = {
  email: string;
  role: UserRole;
  status: ApprovalStatus;
  fullName: string;
  hasProfile: boolean;
  hasDetail: boolean;
};

export async function getAccount(): Promise<AccountSnapshot | null> {
  if (!getSupabasePublicEnv()) return null;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, status, full_name")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile) {
      return {
        email: user.email ?? "",
        role: "comprador",
        status: "pendente",
        fullName: "",
        hasProfile: false,
        hasDetail: false,
      };
    }

    let hasDetail = profile.role === "administrador";
    if (profile.role === "comprador") {
      const { data } = await supabase
        .from("buyers")
        .select("id")
        .eq("profile_id", user.id)
        .maybeSingle();
      hasDetail = Boolean(data);
    }
    if (profile.role === "fornecedor") {
      const { data } = await supabase
        .from("suppliers")
        .select("id")
        .eq("profile_id", user.id)
        .maybeSingle();
      hasDetail = Boolean(data);
    }

    return {
      email: user.email ?? "",
      role: profile.role,
      status: profile.status,
      fullName: profile.full_name,
      hasProfile: true,
      hasDetail,
    };
  } catch (error) {
    console.error(error instanceof Error ? error.message : "Falha ao ler a sessão.");
    return null;
  }
}
