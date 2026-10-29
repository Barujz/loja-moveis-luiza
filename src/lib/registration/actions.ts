"use server";

import { redirect } from "next/navigation";
import type { AuthFormState } from "@/lib/auth/actions";
import { registrationFromForm, type RegistrationDraft } from "@/lib/auth/validators";
import { isUuid } from "@/lib/quotes/access";
import { createClient } from "@/lib/supabase/server";
import type { RegistrationParty } from "@/lib/supabase/database.types";

function fail(prev: AuthFormState, error: string, values: RegistrationDraft): AuthFormState {
  return { error, message: null, values: { ...values }, attempt: (prev.attempt ?? 0) + 1 };
}

function valuesFromForm(formData: FormData): RegistrationDraft {
  return {
    legalName: String(formData.get("legalName") ?? ""),
    taxId: String(formData.get("taxId") ?? ""),
    address: String(formData.get("address") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    email: String(formData.get("email") ?? ""),
    responsibleName: String(formData.get("responsibleName") ?? ""),
    segment: String(formData.get("segment") ?? ""),
  };
}

function saveError(error: { code?: string; message?: string }) {
  const message = error.message ?? "";
  if (
    message.length > 0 &&
    message.length <= 180 &&
    !/row-level|permission denied|violates|duplicate key/i.test(message)
  ) {
    return message;
  }
  if (error.code === "42501") return "Sua conta não pode alterar esta ficha.";
  if (error.code === "23514") return "Confira o documento, o telefone, o e-mail e o tamanho dos campos.";
  return "Não foi possível salvar a ficha.";
}

async function writer() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, userId: null as string | null, party: null as RegistrationParty | null, canWrite: false };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, status")
    .eq("id", user.id)
    .maybeSingle();
  const party: RegistrationParty | null =
    profile?.role === "comprador" || profile?.role === "fornecedor" ? profile.role : null;
  const canWrite = Boolean(party && (profile?.status === "pendente" || profile?.status === "aprovado"));
  return { supabase, userId: user.id, party, canWrite };
}

export async function createRegistrationForm(prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const values = valuesFromForm(formData);
  const draft = registrationFromForm(formData);
  if (typeof draft === "string") return fail(prev, draft, values);

  const { supabase, userId, party, canWrite } = await writer();
  if (!userId) return fail(prev, "Entre para salvar a ficha.", draft);
  if (!canWrite || !party) return fail(prev, "Sua conta só pode consultar fichas.", draft);

  const { data, error } = await supabase
    .from("registration_forms")
    .insert({
      profile_id: userId,
      party,
      legal_name: draft.legalName,
      tax_id: draft.taxId,
      address: draft.address,
      phone: draft.phone,
      email: draft.email,
      responsible_name: draft.responsibleName,
      segment: draft.segment,
    })
    .select("id")
    .maybeSingle();
  if (error) return fail(prev, saveError(error), draft);
  if (!data) return fail(prev, "Não foi possível criar a ficha.", draft);

  redirect(`/conta/fichas/${data.id}?feito=criada`);
}

export async function updateRegistrationForm(prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const values = valuesFromForm(formData);
  const id = String(formData.get("id") ?? "");
  const draft = registrationFromForm(formData);
  if (!isUuid(id)) return fail(prev, "Ficha inválida.", values);
  if (typeof draft === "string") return fail(prev, draft, values);

  const { supabase, userId, canWrite } = await writer();
  if (!userId) return fail(prev, "Entre para salvar a ficha.", draft);
  if (!canWrite) return fail(prev, "Sua conta só pode consultar fichas.", draft);

  const { data, error } = await supabase
    .from("registration_forms")
    .update({
      legal_name: draft.legalName,
      tax_id: draft.taxId,
      address: draft.address,
      phone: draft.phone,
      email: draft.email,
      responsible_name: draft.responsibleName,
      segment: draft.segment,
    })
    .eq("id", id)
    .select("id");
  if (error) return fail(prev, saveError(error), draft);
  if (!data?.length) return fail(prev, "Esta ficha não pode ser alterada por esta conta.", draft);

  redirect(`/conta/fichas/${id}?feito=salva`);
}

export async function deleteRegistrationForm(prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  if (formData.get("confirm") !== "sim") {
    return { error: "Confirme a exclusão antes de continuar.", message: null, attempt: (prev.attempt ?? 0) + 1 };
  }
  const id = String(formData.get("id") ?? "");
  if (!isUuid(id)) return { error: "Ficha inválida.", message: null };

  const { supabase, userId, canWrite } = await writer();
  if (!userId) return { error: "Entre para excluir a ficha.", message: null };
  if (!canWrite) return { error: "Sua conta só pode consultar fichas.", message: null };

  const { data, error } = await supabase.from("registration_forms").delete().eq("id", id).select("id");
  if (error) return { error: saveError(error), message: null };
  if (!data?.length) return { error: "Esta ficha não pode ser excluída por esta conta.", message: null };

  redirect("/conta/fichas?feito=excluida");
}
