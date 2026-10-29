import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { BuyerForm } from "@/components/auth/BuyerForm";
import { getAccount } from "@/lib/auth/account";

export const metadata: Metadata = {
  title: "Cadastro de comprador",
};

export default async function BuyerSignupPage() {
  if (await getAccount()) redirect("/conta");

  return (
    <>
      <PageHeader
        eyebrow="Comprador"
        title="Cadastro de comprador"
        description="Nome, e-mail, empresa, CNPJ, cargo, segmento e WhatsApp. A conta fica pendente até a análise."
        breadcrumbs={[
          { label: "Início", href: "/" },
          { label: "Cadastro", href: "/cadastro" },
          { label: "Comprador" },
        ]}
      />
      <Container className="py-16">
        <BuyerForm />
      </Container>
    </>
  );
}
