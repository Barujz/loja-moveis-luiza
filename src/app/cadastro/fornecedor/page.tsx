import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { SupplierForm } from "@/components/auth/SupplierForm";
import { getAccount } from "@/lib/auth/account";

export const metadata: Metadata = {
  title: "Cadastro de fornecedor",
};

export default async function SupplierSignupPage() {
  if (await getAccount()) redirect("/conta");

  return (
    <>
      <PageHeader
        eyebrow="Fornecedor"
        title="Cadastro de fornecedor"
        description="Dados da empresa e do contato comercial. A conta fica pendente até a análise."
        breadcrumbs={[
          { label: "Início", href: "/" },
          { label: "Cadastro", href: "/cadastro" },
          { label: "Fornecedor" },
        ]}
      />
      <Container className="py-16">
        <SupplierForm />
      </Container>
    </>
  );
}
