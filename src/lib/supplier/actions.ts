"use server";

import { redirect } from "next/navigation";
import { dbErrorMessage } from "@/lib/auth/errors";
import type { AuthFormState } from "@/lib/auth/actions";
import { approvedSupplierClient } from "@/lib/supplier/access";
import type { CatalogVisibility } from "@/lib/supabase/database.types";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function catalogValues(formData: FormData) {
  return {
    id: String(formData.get("id") ?? ""),
    title: String(formData.get("title") ?? ""),
    description: String(formData.get("description") ?? ""),
    visibility: String(formData.get("visibility") ?? ""),
    categoryId: String(formData.get("categoryId") ?? ""),
    slug: String(formData.get("slug") ?? ""),
  };
}

function normalizeSlug(value: string): string | null | false {
  const slug = value.trim().toLowerCase();
  if (!slug) return null;
  if (slug.length > 120 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return false;
  return slug;
}

function catalogError(error: { code?: string; message?: string; details?: string | null }) {
  if (error.code === "23505") return "Já existe um catálogo seu com este endereço.";
  return dbErrorMessage(error);
}

export async function saveCatalog(prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const values = catalogValues(formData);
  const fail = (error: string): AuthFormState => ({
    error,
    message: null,
    values,
    attempt: (prev.attempt ?? 0) + 1,
  });

  const access = await approvedSupplierClient();
  if (!access) return fail("Somente um fornecedor aprovado gerencia os próprios catálogos.");

  const title = values.title.trim();
  if (title.length < 2 || title.length > 160) return fail("O título precisa ter entre 2 e 160 caracteres.");

  const description = values.description.trim();
  if (description.length > 4000) return fail("A descrição pode ter no máximo 4000 caracteres.");

  const visibility: CatalogVisibility | null =
    values.visibility === "publico" || values.visibility === "restrito" ? values.visibility : null;
  if (!visibility) return fail("Escolha se o catálogo é público ou restrito.");

  const slug = normalizeSlug(values.slug);
  if (slug === false) return fail("O endereço usa letras minúsculas, números e hífens.");

  if (!uuidPattern.test(values.categoryId)) return fail("Escolha uma categoria.");
  const { data: category } = await access.supabase
    .from("catalog_categories")
    .select("id")
    .eq("id", values.categoryId)
    .eq("active", true)
    .maybeSingle();
  if (!category) return fail("Escolha uma categoria ativa.");

  const payload = {
    category_id: category.id,
    title,
    slug,
    description: description || null,
    visibility,
  };

  if (values.id) {
    if (!uuidPattern.test(values.id)) return fail("Catálogo inválido.");
    const { data, error } = await access.supabase
      .from("catalogs")
      .update(payload)
      .eq("id", values.id)
      .eq("supplier_id", access.supplierId)
      .select("id")
      .maybeSingle();
    if (error) return fail(catalogError(error));
    if (!data) return fail("Catálogo não encontrado.");
    redirect(`/fornecedor/catalogos/${data.id}?salvo=1`);
  }

  const { data, error } = await access.supabase
    .from("catalogs")
    .insert({
      ...payload,
      supplier_id: access.supplierId,
      status: "pendente",
    })
    .select("id")
    .single();
  if (error || !data) return fail(error ? catalogError(error) : "Não foi possível criar o catálogo.");
  redirect(`/fornecedor/catalogos/${data.id}?salvo=1`);
}

const pdfLimit = 52_428_800;

export async function prepareCatalogPdf(
  catalogId: string,
  byteSize: number,
  fileName: string,
): Promise<{ error: string | null; fileId: string | null; path: string | null }> {
  const access = await approvedSupplierClient();
  if (!access) return { error: "Somente um fornecedor aprovado envia PDF dos próprios catálogos.", fileId: null, path: null };
  if (!uuidPattern.test(catalogId)) return { error: "Catálogo inválido.", fileId: null, path: null };
  if (!Number.isSafeInteger(byteSize) || byteSize < 1 || byteSize > pdfLimit) {
    return { error: "O PDF precisa ter entre 1 byte e 50 MB.", fileId: null, path: null };
  }
  if (!fileName.trim().toLowerCase().endsWith(".pdf") || fileName.length > 180) {
    return { error: "Envie um arquivo com extensão .pdf.", fileId: null, path: null };
  }

  const { data: catalog } = await access.supabase
    .from("catalogs")
    .select("id, supplier_id")
    .eq("id", catalogId)
    .eq("supplier_id", access.supplierId)
    .maybeSingle();
  if (!catalog || catalog.supplier_id !== access.supplierId) {
    return { error: "Catálogo não encontrado.", fileId: null, path: null };
  }

  const fileId = crypto.randomUUID();
  const path = `${catalog.id}/${fileId}.pdf`;
  const { error } = await access.supabase.from("catalog_files").insert({
    id: fileId,
    catalog_id: catalog.id,
    supplier_id: access.supplierId,
    kind: "pdf",
    bucket_id: "catalog-pdfs",
    storage_path: path,
    mime_type: "application/pdf",
    byte_size: byteSize,
    status: "pendente",
  });
  if (error) return { error: catalogError(error), fileId: null, path: null };
  return { error: null, fileId, path };
}

export async function discardCatalogPdf(fileId: string): Promise<boolean> {
  const access = await approvedSupplierClient();
  if (!access || !uuidPattern.test(fileId)) return false;

  const { data } = await access.supabase
    .from("catalog_files")
    .select("id, bucket_id, storage_path, status, supplier_id")
    .eq("id", fileId)
    .eq("supplier_id", access.supplierId)
    .maybeSingle();
  if (!data || data.status !== "pendente" || data.bucket_id !== "catalog-pdfs" || data.supplier_id !== access.supplierId) {
    return false;
  }

  const removed = await access.supabase.storage.from("catalog-pdfs").remove([data.storage_path]);
  const missing = /not found|does not exist/i.test(removed.error?.message ?? "");
  if (removed.error && !missing) return false;

  const { error } = await access.supabase
    .from("catalog_files")
    .delete()
    .eq("id", data.id)
    .eq("supplier_id", access.supplierId)
    .eq("status", "pendente");
  return !error;
}
