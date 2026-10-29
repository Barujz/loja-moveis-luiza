import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { NewPasswordForm } from "@/components/auth/RecoveryForms";
import { getAccount } from "@/lib/auth/account";

export const metadata: Metadata = {
  title: "Nova senha",
};

export default async function PasswordPage() {
  if (!(await getAccount())) redirect("/entrar?next=/conta/senha");

  return (
    <>
      <PageHeader
        eyebrow="Conta"
        title="Nova senha"
        description="Defina uma senha nova para esta sessão. Se chegou pelo e-mail, use o link mais recente."
        breadcrumbs={[
          { label: "Início", href: "/" },
          { label: "Conta", href: "/conta" },
          { label: "Senha" },
        ]}
      />
      <Container className="py-16">
        <NewPasswordForm />
      </Container>
    </>
  );
}
