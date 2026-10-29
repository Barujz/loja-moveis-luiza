import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { RegistrationForm } from "@/components/registration/RegistrationForm";
import { getAccount } from "@/lib/auth/account";
import { createRegistrationForm } from "@/lib/registration/actions";
import { registrationDefaults } from "@/lib/registration/data";

export const metadata: Metadata = { title: "Nova ficha cadastral" };

export default async function NewRegistrationFormPage() {
  const account = await getAccount();
  if (!account) redirect("/entrar?next=/conta/fichas/nova");
  if (!account.hasProfile || (account.role !== "comprador" && account.role !== "fornecedor")) redirect("/conta");
  if (account.status !== "pendente" && account.status !== "aprovado") redirect("/conta/fichas");

  const defaults = await registrationDefaults();

  return (
    <>
      <PageHeader
        eyebrow="Ficha cadastral"
        title="Nova ficha"
        description="Os dados da conta já vêm preenchidos quando existem. Revise antes de salvar."
        breadcrumbs={[
          { label: "Início", href: "/" },
          { label: "Conta", href: "/conta" },
          { label: "Fichas", href: "/conta/fichas" },
          { label: "Nova" },
        ]}
      />
      <Container className="py-16">
        <RegistrationForm action={createRegistrationForm} defaults={defaults} submitLabel="Salvar ficha" />
      </Container>
    </>
  );
}
