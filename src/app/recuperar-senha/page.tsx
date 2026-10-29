import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { RecoveryRequestForm } from "@/components/auth/RecoveryForms";

export const metadata: Metadata = {
  title: "Recuperar senha",
};

export default function RecoveryPage() {
  return (
    <>
      <PageHeader
        eyebrow="Conta"
        title="Recuperar senha"
        description="Enviaremos um link para o e-mail da conta. Ele abre uma sessão só para definir a nova senha."
        breadcrumbs={[{ label: "Início", href: "/" }, { label: "Recuperar senha" }]}
      />
      <Container className="py-16">
        <RecoveryRequestForm />
      </Container>
    </>
  );
}
