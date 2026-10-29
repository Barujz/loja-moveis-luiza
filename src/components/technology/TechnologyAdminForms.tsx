"use client";

import { useActionState } from "react";
import { saveTechnologyProfile, saveTechnologySolution } from "@/lib/technology/actions";
import type { AuthFormState } from "@/lib/auth/actions";
import { Field, FormFeedback, SubmitButton, fieldClass, labelClass } from "@/components/auth/AuthFields";
import type { TechnologyProfile } from "@/lib/technology/load";

const initial: AuthFormState = { error: null, message: null };

export function TechnologyProfileForm({ profile }: { profile: TechnologyProfile | null }) {
  const [state, action, pending] = useActionState(saveTechnologyProfile, initial);
  return (
    <form action={action} className="grid max-w-xl gap-5">
      <FormFeedback error={state.error} message={state.message} />
      <label className="block">
        <span className={labelClass}>Apresentação oficial</span>
        <textarea
          className={`${fieldClass} mt-2 min-h-32 resize-y`}
          name="summary"
          minLength={10}
          maxLength={2000}
          defaultValue={profile?.summary ?? ""}
          placeholder="Somente texto confirmado pela QeeL Tech."
        />
      </label>
      <Field label="URL https do logotipo" name="logoUrl" required={false} defaultValue={profile?.logoUrl ?? ""} />
      <label className="flex items-center gap-3 text-sm text-ink">
        <input type="checkbox" name="published" value="sim" defaultChecked={profile?.published ?? false} />
        Publicar apresentação
      </label>
      <SubmitButton pending={pending}>Salvar apresentação</SubmitButton>
    </form>
  );
}

export function TechnologySolutionForm() {
  const [state, action, pending] = useActionState(saveTechnologySolution, initial);
  return (
    <form action={action} className="grid max-w-xl gap-5">
      <FormFeedback error={state.error} message={state.message} />
      <Field label="Título" name="title" />
      <label className="block">
        <span className={labelClass}>Descrição</span>
        <textarea className={`${fieldClass} mt-2 min-h-28 resize-y`} name="description" required minLength={10} maxLength={800} />
      </label>
      <Field label="Imagem https" name="imageUrl" required={false} />
      <label className="block">
        <span className={labelClass}>Ícone</span>
        <select className={`${fieldClass} mt-2`} name="icon" defaultValue="">
          <option value="">Nenhum</option>
          <option value="layers">Camadas</option>
          <option value="spark">Destaque</option>
          <option value="shield">Proteção</option>
          <option value="cpu">Processamento</option>
        </select>
      </label>
      <Field label="Link de Saiba mais" name="linkUrl" required={false} hint="URL https ou caminho interno, como /contato." />
      <Field label="Ordem" name="sortOrder" type="number" required={false} defaultValue="0" />
      <label className="flex items-center gap-3 text-sm text-ink">
        <input type="checkbox" name="published" value="sim" />
        Publicar solução
      </label>
      <SubmitButton pending={pending}>Adicionar solução</SubmitButton>
    </form>
  );
}
