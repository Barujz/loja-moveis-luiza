"use server";

import { redirect } from "next/navigation";
import { adminClient } from "@/lib/admin/access";
import type { AuthFormState } from "@/lib/auth/actions";
import type { ApprovalStatus } from "@/lib/supabase/database.types";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function decisionError(error: { code?: string; message?: string }): string {
  const message = error.message ?? "";
  if (error.code === "23505") return "Já existe uma correção aberta para este catálogo.";
  if (message && message.length <= 220 && !/duplicate key|violates/i.test(message)) return message;
  return "Não foi possível registrar a decisão.";
}

function confirmed(formData: FormData) {
  return formData.get("confirm") === "sim";
}

export async function reviewCatalog(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const id = String(formData.get("id") ?? "");
  const decision = String(formData.get("decision") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();
  if (!confirmed(formData)) return { error: "Confirme a decisão antes de continuar.", message: null };
  if (!uuidPattern.test(id)) return { error: "Catálogo inválido.", message: null };

  const supabase = await adminClient();
  if (!supabase) return { error: "Somente um administrador aprovado analisa catálogos.", message: null };

  const { data: catalog, error: readError } = await supabase
    .from("catalogs")
    .select("id, status")
    .eq("id", id)
    .maybeSingle();
  if (readError) return { error: decisionError(readError), message: null };
  if (!catalog) return { error: "Catálogo não encontrado.", message: null };

  if (decision === "corrigir") {
    if (reason.length < 3 || reason.length > 2000) {
      return { error: "Descreva a correção entre 3 e 2000 caracteres.", message: null };
    }
    if (catalog.status !== "pendente" && catalog.status !== "aprovado") {
      return { error: "A correção vale para catálogo pendente ou aprovado.", message: null };
    }
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "Sessão expirada. Entre de novo.", message: null };
    const { error } = await supabase.from("correction_requests").insert({
      subject_type: "catalogo",
      subject_id: catalog.id,
      requested_by: user.id,
      reason,
      state: "aberta",
    });
    if (error) return { error: decisionError(error), message: null };
    redirect("/admin?feito=catalogo-corrigir");
  }

  const nextStatus: ApprovalStatus | null =
    decision === "aprovar" ? "aprovado" : decision === "rejeitar" ? "rejeitado" : decision === "suspender" ? "suspenso" : null;
  if (!nextStatus) return { error: "Escolha aprovar, rejeitar, suspender ou solicitar correção.", message: null };
  if ((nextStatus === "aprovado" || nextStatus === "rejeitado") && catalog.status !== "pendente") {
    return { error: "Este catálogo não está pendente.", message: null };
  }
  if (nextStatus === "suspenso" && catalog.status !== "aprovado") {
    return { error: "Só um catálogo aprovado pode ser suspenso.", message: null };
  }

  const { data, error } = await supabase
    .from("catalogs")
    .update({ status: nextStatus })
    .eq("id", catalog.id)
    .eq("status", catalog.status)
    .select("id");
  if (error) return { error: decisionError(error), message: null };
  if (!data?.length) return { error: "A decisão não foi aplicada.", message: null };

  const feito = nextStatus === "aprovado" ? "catalogo-aprovado" : nextStatus === "rejeitado" ? "catalogo-rejeitado" : "catalogo-suspenso";
  redirect(`/admin?feito=${feito}`);
}

export async function reviewCatalogFile(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const catalogId = String(formData.get("catalogId") ?? "");
  const fileId = String(formData.get("fileId") ?? "");
  const decision = String(formData.get("decision") ?? "");
  if (!confirmed(formData)) return { error: "Confirme a decisão antes de continuar.", message: null };
  if (!uuidPattern.test(catalogId) || !uuidPattern.test(fileId)) return { error: "Arquivo inválido.", message: null };

  const supabase = await adminClient();
  if (!supabase) return { error: "Somente um administrador aprovado analisa catálogos.", message: null };

  const { data: file, error: readError } = await supabase
    .from("catalog_files")
    .select("id, catalog_id, status, superseded_at, kind")
    .eq("id", fileId)
    .eq("catalog_id", catalogId)
    .eq("kind", "pdf")
    .maybeSingle();
  if (readError) return { error: decisionError(readError), message: null };
  if (!file) return { error: "PDF não encontrado.", message: null };

  const nextStatus: ApprovalStatus | null =
    decision === "aprovar" ? "aprovado" : decision === "rejeitar" ? "rejeitado" : decision === "suspender" ? "suspenso" : null;
  if (!nextStatus) return { error: "Escolha aprovar, rejeitar ou suspender o PDF.", message: null };
  if ((nextStatus === "aprovado" || nextStatus === "rejeitado") && file.status !== "pendente") {
    return { error: "Este PDF não está pendente.", message: null };
  }
  if (nextStatus === "suspenso" && (file.status !== "aprovado" || file.superseded_at)) {
    return { error: "Só a versão aprovada em uso pode ser suspensa.", message: null };
  }

  const { data: catalog } = await supabase.from("catalogs").select("status").eq("id", catalogId).maybeSingle();
  const { data, error } = await supabase
    .from("catalog_files")
    .update({ status: nextStatus })
    .eq("id", file.id)
    .eq("catalog_id", catalogId)
    .eq("status", file.status)
    .select("id");
  if (error) return { error: decisionError(error), message: null };
  if (!data?.length) return { error: "A decisão não foi aplicada.", message: null };

  const feito =
    nextStatus === "aprovado"
      ? catalog?.status === "aprovado"
        ? "arquivo-publicado"
        : "arquivo-aprovado"
      : nextStatus === "rejeitado"
        ? "arquivo-rejeitado"
        : "arquivo-suspenso";
  redirect(`/admin/catalogos/${catalogId}?feito=${feito}`);
}
