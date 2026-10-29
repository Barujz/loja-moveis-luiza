import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";
import { getSupabasePublicEnv } from "@/lib/supabase/env";
import { dbErrorMessage } from "@/lib/auth/errors";
import {
  buyerFromForm,
  isValidCnpj,
  isValidEmail,
  isValidLogoRef,
  isValidPhone,
  supplierFromForm,
  type BuyerDraft,
  type SupplierDraft,
} from "@/lib/auth/validators";

type Client = SupabaseClient<Database>;

export type EnsureResult = { ok: true } | { ok: false; error: string | null };

function record(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function field(source: Record<string, unknown>, key: string): string {
  const value = source[key];
  return typeof value === "string" ? value.trim() : "";
}

function buyerFromMetadata(value: unknown): BuyerDraft | null {
  const source = record(value);
  if (!source) return null;
  const draft: BuyerDraft = {
    companyName: field(source, "companyName"),
    cnpj: field(source, "cnpj"),
    jobTitle: field(source, "jobTitle"),
    segment: field(source, "segment"),
    whatsapp: field(source, "whatsapp"),
  };
  if (
    draft.companyName.length < 2 ||
    !isValidCnpj(draft.cnpj) ||
    draft.jobTitle.length < 2 ||
    draft.segment.length < 2 ||
    !isValidPhone(draft.whatsapp)
  ) {
    return null;
  }
  return draft;
}

function supplierFromMetadata(value: unknown): SupplierDraft | null {
  const source = record(value);
  if (!source) return null;
  const draft: SupplierDraft = {
    legalName: field(source, "legalName"),
    tradeName: field(source, "tradeName"),
    cnpj: field(source, "cnpj"),
    segment: field(source, "segment"),
    description: field(source, "description"),
    logo: field(source, "logo"),
    commercialContact: field(source, "commercialContact"),
    contactEmail: field(source, "contactEmail"),
    whatsapp: field(source, "whatsapp"),
  };
  if (
    draft.legalName.length < 2 ||
    draft.tradeName.length < 2 ||
    !isValidCnpj(draft.cnpj) ||
    draft.segment.length < 2 ||
    draft.description.length < 10 ||
    !isValidLogoRef(draft.logo) ||
    draft.commercialContact.length < 2 ||
    !isValidEmail(draft.contactEmail) ||
    !isValidPhone(draft.whatsapp)
  ) {
    return null;
  }
  return draft;
}

async function insertBuyer(supabase: Client, userId: string, draft: BuyerDraft): Promise<EnsureResult> {
  const { error } = await supabase.from("buyers").insert({
    profile_id: userId,
    company_name: draft.companyName,
    cnpj: draft.cnpj,
    job_title: draft.jobTitle,
    segment: draft.segment,
    whatsapp: draft.whatsapp,
    status: "pendente",
  });
  if (!error) return { ok: true };
  const message = dbErrorMessage(error);
  if (!message) return { ok: true };
  return { ok: false, error: message };
}

async function insertSupplier(
  supabase: Client,
  userId: string,
  draft: SupplierDraft,
): Promise<EnsureResult> {
  const { error } = await supabase.from("suppliers").insert({
    profile_id: userId,
    legal_name: draft.legalName,
    trade_name: draft.tradeName,
    cnpj: draft.cnpj,
    segment: draft.segment,
    description: draft.description,
    logo: draft.logo,
    commercial_contact: draft.commercialContact,
    contact_email: draft.contactEmail,
    whatsapp: draft.whatsapp,
    status: "pendente",
  });
  if (!error) return { ok: true };
  const message = dbErrorMessage(error);
  if (!message) return { ok: true };
  return { ok: false, error: message };
}

async function clearSignupMetadata(supabase: Client) {
  await supabase.auth.updateUser({ data: { signup: null } });
}

export async function ensureRegistration(): Promise<EnsureResult> {
  if (!getSupabasePublicEnv()) {
    return { ok: false, error: "Supabase não configurado neste ambiente." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: null };

  return completeForUser(supabase, user);
}

export async function finishRegistration(formData: FormData): Promise<EnsureResult> {
  if (!getSupabasePublicEnv()) {
    return { ok: false, error: "Supabase não configurado neste ambiente." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Entre na conta para concluir o cadastro." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, status")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) {
    return { ok: false, error: "O perfil ainda não está disponível. Tente de novo em instantes." };
  }
  if (profile.status === "rejeitado" || profile.status === "suspenso") {
    return { ok: false, error: "Esta conta não pode alterar o cadastro." };
  }
  if (profile.role === "administrador") return { ok: true };

  if (profile.role === "comprador") {
    const draft = buyerFromForm(formData);
    if (typeof draft === "string") return { ok: false, error: draft };
    const result = await insertBuyer(supabase, user.id, draft);
    if (result.ok) await clearSignupMetadata(supabase);
    return result;
  }

  const draft = supplierFromForm(formData);
  if (typeof draft === "string") return { ok: false, error: draft };
  const result = await insertSupplier(supabase, user.id, draft);
  if (result.ok) await clearSignupMetadata(supabase);
  return result;
}

async function completeForUser(supabase: Client, user: User): Promise<EnsureResult> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) {
    return { ok: false, error: "O perfil ainda não está disponível. Tente de novo em instantes." };
  }
  if (profile.role === "administrador") return { ok: true };

  if (profile.role === "comprador") {
    const { data: existing } = await supabase
      .from("buyers")
      .select("id")
      .eq("profile_id", user.id)
      .maybeSingle();
    if (existing) return { ok: true };

    const draft = buyerFromMetadata(user.user_metadata?.signup);
    if (!draft) return { ok: false, error: null };
    const result = await insertBuyer(supabase, user.id, draft);
    if (result.ok) await clearSignupMetadata(supabase);
    return result;
  }

  const { data: existing } = await supabase
    .from("suppliers")
    .select("id")
    .eq("profile_id", user.id)
    .maybeSingle();
  if (existing) return { ok: true };

  const draft = supplierFromMetadata(user.user_metadata?.signup);
  if (!draft) return { ok: false, error: null };
  const result = await insertSupplier(supabase, user.id, draft);
  if (result.ok) await clearSignupMetadata(supabase);
  return result;
}
