import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { FinishRegistrationForm } from "@/components/auth/FinishRegistrationForm";
import { logout } from "@/lib/auth/actions";
import { Button } from "@/components/ui/Button";
import { getAccount } from "@/lib/auth/account";
import { ensureRegistration } from "@/lib/auth/registration";
import { BuyerQuotes } from "@/components/quotes/BuyerQuotes";
import { ownSupplierStatus } from "@/lib/supplier/access";
import type { ApprovalStatus, UserRole } from "@/lib/supabase/database.types";

export const metadata: Metadata = {
  title: "Conta",
};

const statusCopy: Record<ApprovalStatus, string> = {
  pendente: "Seu cadastro está pendente de aprovação. Você não pode aprovar a própria conta.",
  aprovado: "Sua conta está aprovada.",
  rejeitado: "Este cadastro não foi aprovado. As áreas restritas continuam fechadas.",
  suspenso: "Esta conta está suspensa. As áreas restritas continuam fechadas.",
};

const roleCopy: Record<UserRole, string> = {
  comprador: "Comprador",
  fornecedor: "Fornecedor",
  administrador: "Administrador",
};

export default async function AccountPage() {
  let account = await getAccount();
  if (!account) redirect("/entrar?next=/conta");

  let notice: string | null = null;
  if (account.hasProfile && !account.hasDetail && account.role !== "administrador") {
    const completed = await ensureRegistration();
    if (completed.ok) account = (await getAccount()) ?? account;
    else notice = completed.error;
  }

  const approved = account.status === "aprovado" && account.hasDetail;
  const supplierApproved =
    approved && account.role === "fornecedor" ? (await ownSupplierStatus()) === "aprovado" : false;
  const companyRole =
    account.hasProfile &&
    !account.hasDetail &&
    (account.role === "comprador" || account.role === "fornecedor")
      ? account.role
      : null;

  return (
    <>
      <PageHeader
        eyebrow={roleCopy[account.role]}
        title={account.fullName || "Sua conta"}
        description={account.hasProfile ? statusCopy[account.status] : "O perfil ainda está sendo preparado."}
        breadcrumbs={[{ label: "Início", href: "/" }, { label: "Conta" }]}
      />
      <Container className="space-y-8 py-16">
        <p className="text-sm text-muted">{account.email}</p>
        {notice ? (
          <p className="max-w-xl rounded-sm border border-brass/40 bg-brass/10 px-4 py-3 text-sm text-ink" role="alert">
            {notice}
          </p>
        ) : null}
        {companyRole ? (
          <div className="space-y-6">
            <p className="max-w-xl text-muted">
              Falta registrar a empresa. O cadastro continua pendente e só a Luiza pode aprová-lo.
            </p>
            <FinishRegistrationForm role={companyRole} />
          </div>
        ) : null}
        {account.hasProfile && (account.role === "comprador" || account.role === "fornecedor") ? (
          <div className="space-y-4">
            <p className="max-w-xl text-muted">
              A ficha cadastral guarda os dados comerciais da empresa. Você pode revisar o que a conta já tiver antes de salvar.
            </p>
            <Button href="/conta/fichas" variant="outline">
              Fichas cadastrais
            </Button>
          </div>
        ) : null}
        {approved && account.role === "comprador" ? <BuyerQuotes /> : null}
        {supplierApproved ? (
          <div className="space-y-4">
            <p className="max-w-xl text-muted">A conta de fornecedor está aprovada e pode cadastrar catálogos.</p>
            <Button href="/fornecedor">Abrir painel</Button>
          </div>
        ) : null}
        {approved && account.role === "administrador" ? (
          <div className="space-y-4">
            <p className="max-w-xl text-muted">A conta de administrador está ativa.</p>
            <Button href="/admin">Abrir painel</Button>
          </div>
        ) : null}
        <div className="flex flex-wrap items-center gap-6">
          <Link href="/conta/senha" className="text-sm text-ink underline underline-offset-4 hover:text-brass">
            Alterar senha
          </Link>
          <form action={logout}>
            <button type="submit" className="text-sm text-ink underline underline-offset-4 hover:text-brass">
              Sair
            </button>
          </form>
        </div>
      </Container>
    </>
  );
}
