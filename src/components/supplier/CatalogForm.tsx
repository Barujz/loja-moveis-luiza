"use client";

import { useActionState } from "react";
import { saveCatalog } from "@/lib/supplier/actions";
import type { AuthFormState } from "@/lib/auth/actions";
import type { ApprovalStatus, CatalogVisibility } from "@/lib/supabase/database.types";
import { fieldClass, labelClass, FormFeedback, SubmitButton } from "@/components/auth/AuthFields";

const initial: AuthFormState = { error: null, message: null };

export function CatalogForm({
  categories,
  catalog,
}: {
  categories: { id: string; label: string }[];
  catalog?: {
    id: string;
    title: string;
    description: string;
    visibility: CatalogVisibility;
    categoryId: string;
    slug: string;
    status: ApprovalStatus;
  };
}) {
  const [state, action, pending] = useActionState(saveCatalog, initial);
  const saved = state.values ?? {};
  const title = saved.title ?? catalog?.title ?? "";
  const description = saved.description ?? catalog?.description ?? "";
  const visibility = saved.visibility ?? catalog?.visibility ?? "restrito";
  const categoryId = saved.categoryId ?? catalog?.categoryId ?? "";
  const slug = saved.slug ?? catalog?.slug ?? "";

  return (
    <form key={state.attempt ?? 0} action={action} className="mx-auto flex max-w-xl flex-col gap-5">
      <FormFeedback error={state.error} message={state.message} />
      {catalog ? <input type="hidden" name="id" value={catalog.id} /> : null}
      {catalog?.status === "aprovado" ? (
        <p className="text-sm leading-relaxed text-muted">
          Este catálogo está aprovado. Salvar uma alteração devolve o item para análise da Luiza.
        </p>
      ) : (
        <p className="text-sm leading-relaxed text-muted">
          {catalog
            ? "A Luiza define a aprovação. Um PDF novo fica pendente e não substitui a versão já aprovada."
            : "O catálogo entra pendente. Depois de salvar, envie o PDF nesta página."}
        </p>
      )}
      <label className="block">
        <span className={labelClass}>Título</span>
        <input className={`${fieldClass} mt-2`} name="title" required minLength={2} maxLength={160} defaultValue={title} />
      </label>
      <label className="block">
        <span className={labelClass}>Categoria</span>
        <select className={`${fieldClass} mt-2`} name="categoryId" required defaultValue={categoryId}>
          <option value="">Selecione</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.label}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className={labelClass}>Visibilidade</span>
        <select className={`${fieldClass} mt-2`} name="visibility" required defaultValue={visibility}>
          <option value="restrito">Restrito a compradores aprovados</option>
          <option value="publico">Público depois da aprovação</option>
        </select>
      </label>
      <label className="block">
        <span className={labelClass}>Descrição</span>
        <textarea
          className={`${fieldClass} mt-2 min-h-36`}
          name="description"
          maxLength={4000}
          defaultValue={description}
        />
        <span className="mt-1.5 block text-xs text-muted">A aprovação pede ao menos 10 caracteres.</span>
      </label>
      <label className="block">
        <span className={labelClass}>Endereço</span>
        <input
          className={`${fieldClass} mt-2`}
          name="slug"
          maxLength={120}
          defaultValue={slug}
          placeholder="linha-hospedagem"
          required={false}
        />
        <span className="mt-1.5 block text-xs text-muted">Opcional. Letras minúsculas, números e hífens.</span>
      </label>
      <SubmitButton pending={pending}>{catalog ? "Salvar catálogo" : "Criar catálogo"}</SubmitButton>
    </form>
  );
}
