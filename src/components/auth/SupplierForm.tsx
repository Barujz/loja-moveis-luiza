"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signUpSupplier, type AuthFormState } from "@/lib/auth/actions";
import { Field, FormFeedback, SubmitButton, fieldClass, labelClass } from "@/components/auth/AuthFields";

const initial: AuthFormState = { error: null, message: null };

export function SupplierForm() {
  const [state, action, pending] = useActionState(signUpSupplier, initial);
  const saved = state.values ?? {};

  return (
    <form key={state.attempt ?? 0} action={action} className="mx-auto grid max-w-xl gap-5">
      <FormFeedback error={state.error} message={state.message} />
      <Field label="Nome de quem cadastra" name="fullName" autoComplete="name" defaultValue={saved.fullName} />
      <Field label="E-mail de acesso" name="email" type="email" autoComplete="email" defaultValue={saved.email} />
      <Field label="Senha" name="password" type="password" autoComplete="new-password" defaultValue={saved.password} />
      <Field
        label="Confirmar senha"
        name="passwordConfirm"
        type="password"
        autoComplete="new-password"
        defaultValue={saved.passwordConfirm}
      />
      <Field label="Razão social" name="legalName" autoComplete="organization" defaultValue={saved.legalName} />
      <Field label="Nome fantasia" name="tradeName" defaultValue={saved.tradeName} />
      <Field label="CNPJ" name="cnpj" autoComplete="off" defaultValue={saved.cnpj} />
      <Field label="Segmento" name="segment" defaultValue={saved.segment} />
      <label className="block">
        <span className={labelClass}>Descrição</span>
        <textarea
          className={`${fieldClass} mt-2 min-h-32 resize-y`}
          name="description"
          required
          minLength={10}
          maxLength={4000}
          defaultValue={saved.description}
        />
      </label>
      <Field
        label="Logo"
        name="logo"
        hint="URL https da marca, ou um caminho logos/arquivo.png."
        defaultValue={saved.logo}
      />
      <Field label="Contato comercial" name="commercialContact" autoComplete="name" defaultValue={saved.commercialContact} />
      <Field label="E-mail comercial" name="contactEmail" type="email" autoComplete="email" defaultValue={saved.contactEmail} />
      <Field label="WhatsApp" name="whatsapp" type="tel" autoComplete="tel" defaultValue={saved.whatsapp} />
      <SubmitButton pending={pending}>Criar cadastro de fornecedor</SubmitButton>
      <p className="text-sm text-muted">
        A conta entra como pendente. A aprovação é feita pela Luiza.{" "}
        <Link href="/entrar" className="text-ink underline underline-offset-4 hover:text-brass">
          Já tenho conta
        </Link>
      </p>
    </form>
  );
}
