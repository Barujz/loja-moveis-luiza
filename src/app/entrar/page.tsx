import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { LoginForm } from "@/components/auth/LoginForm";
import { getAccount } from "@/lib/auth/account";
import { safeNextPath } from "@/lib/auth/validators";

export const metadata: Metadata = {
  title: "Entrar",
  description: "Acesse sua conta de comprador, fornecedor ou administrador.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; erro?: string }>;
}) {
  const account = await getAccount();
  const params = await searchParams;
  const next = safeNextPath(params.next);
  if (account) redirect(next);

  return (
    <section className="border-b border-line bg-paper">
      <Container className="grid items-start gap-8 py-8 md:grid-cols-2 md:py-12">
        <div className="order-2 md:order-1">
          <nav className="mb-6 flex items-center gap-1.5 text-sm text-muted">
            <Link href="/" className="transition-colors hover:text-brass">
              Início
            </Link>
            <ChevronRight size={14} className="text-muted/60" />
            <span className="text-ink">Entrar</span>
          </nav>
          <p className="eyebrow mb-4">Conta</p>
          <h1 className="max-w-xl text-4xl leading-[1.08] sm:text-5xl">Entrar</h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-muted">
            Use o e-mail e a senha do cadastro. Contas pendentes, rejeitadas ou suspensas entram, mas não liberam acesso de aprovado.
          </p>
        </div>
        <div className="order-1 md:order-2">
          {params.erro === "link" ? (
            <p className="mb-6 rounded-sm border border-brass/40 bg-brass/10 px-4 py-3 text-sm text-ink">
              O link é inválido ou expirou. Peça um novo.
            </p>
          ) : null}
          <LoginForm next={next} />
        </div>
      </Container>
    </section>
  );
}
