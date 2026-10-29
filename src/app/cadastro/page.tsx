import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { getAccount } from "@/lib/auth/account";

export const metadata: Metadata = {
  title: "Cadastro",
  description: "Abra uma conta de comprador ou fornecedor. A aprovação é feita pela Luiza.",
};

const options = [
  {
    href: "/cadastro/comprador",
    title: "Comprador",
    text: "Hotéis, compras e hospitalidade. O acesso a catálogos restritos depende da aprovação.",
  },
  {
    href: "/cadastro/fornecedor",
    title: "Fornecedor",
    text: "Empresas que enviam catálogos. O envio só fica disponível depois da aprovação.",
  },
];

export default async function SignupPage() {
  if (await getAccount()) redirect("/conta");

  return (
    <>
      <PageHeader
        eyebrow="Conta"
        title="Criar cadastro"
        description="Escolha o tipo de conta. O perfil nasce pendente e não pode ser aprovado por quem se cadastrou."
        breadcrumbs={[{ label: "Início", href: "/" }, { label: "Cadastro" }]}
      />
      <Container className="grid gap-6 py-16 md:grid-cols-2">
        {options.map((option) => (
          <Link
            key={option.href}
            href={option.href}
            className="rounded-sm border border-line bg-paper p-8 transition-colors hover:border-brass"
          >
            <h2 className="font-display text-3xl text-ink">{option.title}</h2>
            <p className="mt-3 text-muted">{option.text}</p>
          </Link>
        ))}
      </Container>
    </>
  );
}
