import { redirect } from "next/navigation";
import { getAccount } from "@/lib/auth/account";
import { createClient } from "@/lib/supabase/server";
import { categoryOptions } from "@/lib/supplier/labels";

const supplierColumns =
  "id, profile_id, legal_name, trade_name, cnpj, segment, description, logo, commercial_contact, contact_email, whatsapp, status";

export async function requireApprovedSupplier() {
  const account = await getAccount();
  if (!account) redirect("/entrar?next=/fornecedor");
  if (account.role !== "fornecedor" || account.status !== "aprovado") redirect("/conta");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar?next=/fornecedor");

  const { data: supplier } = await supabase
    .from("suppliers")
    .select(supplierColumns)
    .eq("profile_id", user.id)
    .maybeSingle();

  if (!supplier || supplier.status !== "aprovado" || supplier.profile_id !== user.id) redirect("/conta");
  return { account, supplier, supabase };
}

export async function approvedSupplierClient() {
  const account = await getAccount();
  if (!account || account.role !== "fornecedor" || account.status !== "aprovado") return null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: supplier } = await supabase
    .from("suppliers")
    .select("id, profile_id, status")
    .eq("profile_id", user.id)
    .maybeSingle();

  if (!supplier || supplier.status !== "aprovado" || supplier.profile_id !== user.id) return null;
  return { supabase, supplierId: supplier.id };
}

export async function ownSupplierStatus() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase.from("suppliers").select("status").eq("profile_id", user.id).maybeSingle();
  return data?.status ?? null;
}

export async function loadActiveCategories(
  supabase: Awaited<ReturnType<typeof createClient>>,
) {
  const { data } = await supabase
    .from("catalog_categories")
    .select("id, parent_id, name, sort_order")
    .eq("active", true)
    .order("sort_order");
  return categoryOptions(data ?? []);
}
