import { createClient } from "@/lib/supabase/server";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: string) {
  return uuidPattern.test(value);
}

export async function approvedBuyerContext() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, userId: null as string | null, buyerId: null as string | null };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, status")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile || profile.role !== "comprador" || profile.status !== "aprovado") {
    return { supabase, userId: user.id, buyerId: null };
  }

  const { data: buyer } = await supabase
    .from("buyers")
    .select("id")
    .eq("profile_id", user.id)
    .eq("status", "aprovado")
    .maybeSingle();

  return { supabase, userId: user.id, buyerId: buyer?.id ?? null };
}
