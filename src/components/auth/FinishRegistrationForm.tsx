"use client";

import { useActionState } from "react";
import { completeRegistration, type AuthFormState } from "@/lib/auth/actions";
import { Field, FormFeedback, SubmitButton, fieldClass, labelClass } from "@/components/auth/AuthFields";

const initial: AuthFormState = { error: null, message: null };

export function FinishRegistrationForm({ role }: { role: "comprador" | "fornecedor" }) {
  const [state, action, pending] = useActionState(completeRegistration, initial);

  return (
    <form action={action} className="mx-auto grid max-w-xl gap-5">
      <FormFeedback error={state.error} message={state.message} />
      {role === "comprador" ? (
        <>
          <Field label="Empresa ou hotel" name="companyName" autoComplete="organization" />
          <Field label="CNPJ" name="cnpj" autoComplete="off" />
          <Field label="Cargo" name="jobTitle" autoComplete="organization-title" />
          <Field label="Segmento" name="segment" />
          <Field label="WhatsApp" name="whatsapp" type="tel" autoComplete="tel" />
        </>
      ) : (
        <>
          <Field label="Razão social" name="legalName" autoComplete="organization" />
          <Field label="Nome fantasia" name="tradeName" />
          <Field label="CNPJ" name="cnpj" autoComplete="off" />
          <Field label="Segmento" name="segment" />
          <label className="block">
            <span className={labelClass}>Descrição</span>
            <textarea className={`${fieldClass} mt-2 min-h-32 resize-y`} name="description" required minLength={10} />
          </label>
          <Field label="Logo" name="logo" hint="URL https ou caminho logos/arquivo.png." />
          <Field label="Contato comercial" name="commercialContact" />
          <Field label="E-mail comercial" name="contactEmail" type="email" autoComplete="email" />
          <Field label="WhatsApp" name="whatsapp" type="tel" autoComplete="tel" />
        </>
      )}
      <SubmitButton pending={pending}>Concluir cadastro pendente</SubmitButton>
    </form>
  );
}
