import { redirect } from "next/navigation";
import { getAccount } from "@/lib/auth/account";
import { createClient } from "@/lib/supabase/server";

export async function requireApprovedAdmin() {
  const account = await getAccount();
  if (!account) redirect("/entrar?next=/admin");
  if (account.role !== "administrador" || account.status !== "aprovado") redirect("/conta");
  return account;
}

export async function adminClient() {
  const account = await getAccount();
  if (!account || account.role !== "administrador" || account.status !== "aprovado") return null;
  return createClient();
}
