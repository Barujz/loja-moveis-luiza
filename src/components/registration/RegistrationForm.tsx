"use client";

import { useActionState } from "react";
import type { AuthFormState } from "@/lib/auth/actions";
import type { RegistrationDraft } from "@/lib/auth/validators";
import { Field, FormFeedback, SubmitButton, fieldClass, labelClass } from "@/components/auth/AuthFields";

const initial: AuthFormState = { error: null, message: null };

export function RegistrationForm({
  action,
  defaults,
  submitLabel,
  id,
}: {
  action: (prev: AuthFormState, formData: FormData) => Promise<AuthFormState>;
  defaults: RegistrationDraft;
  submitLabel: string;
  id?: string;
}) {
  const [state, formAction, pending] = useActionState(action, initial);
  const saved = state.values ?? {};

  return (
    <form key={state.attempt ?? 0} action={formAction} className="grid max-w-xl gap-5">
      {id ? <input type="hidden" name="id" value={id} /> : null}
      <FormFeedback error={state.error} message={state.message} />
      <Field label="Nome ou razão social" name="legalName" autoComplete="organization" defaultValue={saved.legalName ?? defaults.legalName} />
      <Field
        label="CNPJ ou CPF"
        name="taxId"
        autoComplete="off"
        hint="Somente números, com os dígitos verificadores."
        defaultValue={saved.taxId ?? defaults.taxId}
      />
      <label className="block">
        <span className={labelClass}>Endereço</span>
        <textarea
          className={`${fieldClass} mt-2 min-h-24 resize-y`}
          name="address"
          required
          minLength={8}
          maxLength={300}
          autoComplete="street-address"
          defaultValue={saved.address ?? defaults.address}
        />
      </label>
      <Field label="Telefone" name="phone" type="tel" autoComplete="tel" hint="DDD e número." defaultValue={saved.phone ?? defaults.phone} />
      <Field label="E-mail" name="email" type="email" autoComplete="email" defaultValue={saved.email ?? defaults.email} />
      <Field label="Responsável" name="responsibleName" autoComplete="name" defaultValue={saved.responsibleName ?? defaults.responsibleName} />
      <Field label="Segmento" name="segment" defaultValue={saved.segment ?? defaults.segment} />
      <SubmitButton pending={pending}>{submitLabel}</SubmitButton>
    </form>
  );
}
