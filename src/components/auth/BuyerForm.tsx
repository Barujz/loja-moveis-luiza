"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signUpBuyer, type AuthFormState } from "@/lib/auth/actions";
import { Field, FormFeedback, SubmitButton, fieldClass, labelClass } from "@/components/auth/AuthFields";

const initial: AuthFormState = { error: null, message: null };

export function BuyerForm() {
  const [state, action, pending] = useActionState(signUpBuyer, initial);
  const saved = state.values ?? {};

  return (
    <form key={state.attempt ?? 0} action={action} className="mx-auto grid max-w-xl gap-5">
      <FormFeedback error={state.error} message={state.message} />
      <Field label="Nome completo" name="fullName" autoComplete="name" defaultValue={saved.fullName} />
      <Field label="E-mail de acesso" name="email" type="email" autoComplete="email" defaultValue={saved.email} />
      <Field label="Senha" name="password" type="password" autoComplete="new-password" defaultValue={saved.password} />
      <Field
        label="Confirmar senha"
        name="passwordConfirm"
        type="password"
        autoComplete="new-password"
        defaultValue={saved.passwordConfirm}
      />
      <Field label="Empresa ou hotel" name="companyName" autoComplete="organization" defaultValue={saved.companyName} />
      <Field
        label="CNPJ"
        name="cnpj"
        autoComplete="off"
        hint="Somente números, com os dígitos verificadores."
        defaultValue={saved.cnpj}
      />
      <Field label="Cargo" name="jobTitle" autoComplete="organization-title" defaultValue={saved.jobTitle} />
      <label className="block">
        <span className={labelClass}>Segmento</span>
        <input
          className={`${fieldClass} mt-2`}
          name="segment"
          required
          placeholder="Hotelaria, A&B, compras"
          defaultValue={saved.segment}
        />
      </label>
      <Field label="WhatsApp" name="whatsapp" type="tel" autoComplete="tel" hint="DDD e número." defaultValue={saved.whatsapp} />
      <SubmitButton pending={pending}>Criar cadastro de comprador</SubmitButton>
      <p className="text-sm text-muted">
        A conta entra como pendente. A aprovação é feita pela Luiza.{" "}
        <Link href="/entrar" className="text-ink underline underline-offset-4 hover:text-brass">
          Já tenho conta
        </Link>
      </p>
    </form>
  );
}
