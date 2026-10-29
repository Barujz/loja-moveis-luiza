"use server";

import { redirect } from "next/navigation";
import type { AuthFormState } from "@/lib/auth/actions";
import { adminClient } from "@/lib/admin/access";
import { isUuid } from "@/lib/quotes/access";

const icons = new Set(["layers", "spark", "shield", "cpu"]);
const httpsPattern = /^https:\/\/[A-Za-z0-9._~:/?#\[\]@!$&'()*+,;=%-]+$/;

function safeLink(value: string) {
  if (!value) return null;
  if (httpsPattern.test(value)) return value;
  if (value.startsWith("/") && !value.startsWith("//") && !value.includes("\\")) return value.slice(0, 300);
  return undefined;
}

function fail(error: string): AuthFormState {
  return { error, message: null };
}

export async function saveTechnologyProfile(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const supabase = await adminClient();
  if (!supabase) return fail("Somente um administrador aprovado publica esta área.");

  const summary = String(formData.get("summary") ?? "").trim();
  const logo = String(formData.get("logoUrl") ?? "").trim();
  const published = formData.get("published") === "sim";
  if (summary && (summary.length < 10 || summary.length > 2000)) {
    return fail("A apresentação precisa ter entre 10 e 2000 caracteres.");
  }
  if (logo && !httpsPattern.test(logo)) return fail("O logotipo precisa ser uma URL https.");

  const row = {
    summary: summary || null,
    logo_url: logo || null,
    published: published && Boolean(summary),
  };
  const { data: existing } = await supabase.from("technology_profile").select("id").maybeSingle();
  const { error } = existing
    ? await supabase.from("technology_profile").update(row).eq("id", true)
    : await supabase.from("technology_profile").insert(row);
  if (error) return fail("Não foi possível salvar a apresentação.");
  redirect("/admin/tecnologia?feito=apresentacao");
}

export async function saveTechnologySolution(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const supabase = await adminClient();
  if (!supabase) return fail("Somente um administrador aprovado publica esta área.");

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const image = String(formData.get("imageUrl") ?? "").trim();
  const icon = String(formData.get("icon") ?? "").trim();
  const link = safeLink(String(formData.get("linkUrl") ?? "").trim());
  const sortOrder = Number(formData.get("sortOrder") ?? 0);
  if (title.length < 2 || title.length > 120) return fail("O título precisa ter entre 2 e 120 caracteres.");
  if (description.length < 10 || description.length > 800) {
    return fail("A descrição precisa ter entre 10 e 800 caracteres.");
  }
  if (image && !httpsPattern.test(image)) return fail("A imagem precisa ser uma URL https.");
  if (link === undefined) return fail("O link de Saiba mais precisa ser https ou um caminho interno.");
  if (icon && !icons.has(icon)) return fail("Escolha um ícone da lista.");

  const { error } = await supabase.from("technology_solutions").insert({
    title,
    description,
    image_url: image || null,
    icon: icon || null,
    link_url: link,
    sort_order: Number.isFinite(sortOrder) ? sortOrder : 0,
    published: formData.get("published") === "sim",
  });
  if (error) return fail("Não foi possível salvar a solução.");
  redirect("/admin/tecnologia?feito=solucao");
}

export async function setTechnologyPublished(formData: FormData) {
  const supabase = await adminClient();
  if (!supabase) redirect("/admin/tecnologia");
  const id = String(formData.get("id") ?? "");
  if (!isUuid(id)) redirect("/admin/tecnologia");
  await supabase
    .from("technology_solutions")
    .update({ published: formData.get("published") === "sim" })
    .eq("id", id);
  redirect("/admin/tecnologia?feito=visivel");
}

export async function deleteTechnologySolution(formData: FormData) {
  const supabase = await adminClient();
  if (!supabase) redirect("/admin/tecnologia");
  const id = String(formData.get("id") ?? "");
  if (!isUuid(id) || formData.get("confirm") !== "sim") redirect("/admin/tecnologia");
  await supabase.from("technology_solutions").delete().eq("id", id);
  redirect("/admin/tecnologia?feito=excluida");
}
