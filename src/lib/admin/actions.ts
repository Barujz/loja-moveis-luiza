"use server";

import { redirect } from "next/navigation";
import { adminClient } from "@/lib/admin/access";
import type { AuthFormState } from "@/lib/auth/actions";

type Kind = "comprador" | "fornecedor";

function adminError(error: { code?: string; message?: string }): string {
  const message = error.message ?? "";
  if (error.code === "23505") return "Já existe uma correção aberta para este cadastro.";
  if (message && message.length <= 220 && !/duplicate key|violates/i.test(message)) return message;
  return "Não foi possível registrar a decisão.";
}

function kindOf(value: FormDataEntryValue | null): Kind | null {
  return value === "comprador" || value === "fornecedor" ? value : null;
}

export async function reviewRegistration(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const kind = kindOf(formData.get("kind"));
  const id = String(formData.get("id") ?? "");
  const decision = String(formData.get("decision") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();

  if (!kind || !/^[0-9a-f-]{36}$/i.test(id)) {
    return { error: "Cadastro inválido.", message: null };
  }
  if (decision !== "aprovar" && decision !== "rejeitar" && decision !== "corrigir") {
    return { error: "Escolha aprovar, rejeitar ou solicitar correção.", message: null };
  }
  if (decision === "corrigir" && (reason.length < 3 || reason.length > 2000)) {
    return { error: "Descreva a correção entre 3 e 2000 caracteres.", message: null };
  }

  const supabase = await adminClient();
  if (!supabase) return { error: "Somente um administrador aprovado analisa cadastros.", message: null };

  const table = kind === "comprador" ? "buyers" : "suppliers";
  const { data: row, error: readError } = await supabase
    .from(table)
    .select("id, profile_id, status")
    .eq("id", id)
    .maybeSingle();

  if (readError) return { error: adminError(readError), message: null };
  if (!row) return { error: "Cadastro não encontrado.", message: null };
  if (row.status !== "pendente") {
    return { error: "Este cadastro não está pendente.", message: null };
  }

  if (decision === "corrigir") {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "Sessão expirada. Entre de novo.", message: null };

    const { error } = await supabase.from("correction_requests").insert({
      subject_type: kind,
      subject_id: row.id,
      requested_by: user.id,
      reason,
      state: "aberta",
    });
    if (error) return { error: adminError(error), message: null };
    redirect("/admin?feito=corrigir");
  }

  const nextStatus = decision === "aprovar" ? "aprovado" : "rejeitado";
  const profileFirst = nextStatus === "aprovado";
  const steps = profileFirst
    ? [
        () => supabase.from("profiles").update({ status: nextStatus }).eq("id", row.profile_id).select("id"),
        () => supabase.from(table).update({ status: nextStatus }).eq("id", row.id).select("id"),
      ]
    : [
        () => supabase.from(table).update({ status: nextStatus }).eq("id", row.id).select("id"),
        () => supabase.from("profiles").update({ status: nextStatus }).eq("id", row.profile_id).select("id"),
      ];

  for (const step of steps) {
    const { data, error } = await step();
    if (error) return { error: adminError(error), message: null };
    if (!data?.length) return { error: "A decisão não foi aplicada.", message: null };
  }

  redirect(nextStatus === "aprovado" ? "/admin?feito=aprovado" : "/admin?feito=rejeitado");
}
