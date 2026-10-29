import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { ConfirmLinkForm, NewLinkOptions } from "@/components/auth/ConfirmLinkForm";
import { confirmButtonLabel, confirmDestination, parseOtpType } from "@/lib/auth/confirm";
import { safeNextPath } from "@/lib/auth/validators";

export const metadata: Metadata = {
  title: "Confirmar acesso",
  description: "Confirme o link enviado por e-mail para a Luiza Mobiliário de Luxo.",
};

export default async function ConfirmLinkPage({
  searchParams,
}: {
  searchParams: Promise<{
    token_hash?: string;
    type?: string;
    code?: string;
    next?: string;
    erro?: string;
  }>;
}) {
  const params = await searchParams;
  const explicitType = parseOtpType(params.type);
  const next = safeNextPath(params.next, confirmDestination(explicitType));
  const type = explicitType ?? (next === "/conta/senha" ? "recovery" : explicitType);
  const tokenHash = (params.token_hash ?? "").trim().slice(0, 2048);
  const code = (params.code ?? "").trim().slice(0, 2048);
  const hasLink = Boolean(tokenHash || code);
  const failed = params.erro === "otp_expired" || params.erro === "link";

  return (
    <section className="border-b border-line bg-paper">
      <Container className="py-8 md:py-12">
        <p className="eyebrow mb-4">Conta</p>
        <h1 className="max-w-xl text-4xl leading-[1.08] sm:text-5xl">Confirmar acesso</h1>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-muted">
          {type === "recovery"
            ? "Confirme para escolher uma nova senha."
            : type === "invite"
              ? "Confirme para aceitar o convite e definir a senha."
              : "Confirme o e-mail para continuar o cadastro."}
        </p>
        <div className="mt-8">
          {hasLink ? (
            <ConfirmLinkForm
              tokenHash={tokenHash}
              code={code}
              type={type}
              next={next}
              label={confirmButtonLabel(type)}
            />
          ) : (
            <div className="mx-auto flex max-w-xl flex-col gap-5">
              <p className="rounded-sm border border-brass/40 bg-brass/10 px-4 py-3 text-sm text-ink" role="alert">
                {failed
                  ? "Este link não vale mais. Ele pode ter sido aberto por um verificador de e-mail, já ter sido usado ou ter passado do prazo. Peça um novo link uma única vez e aguarde o e-mail."
                  : "O link está incompleto. Abra o endereço mais recente enviado pela Luiza."}
              </p>
              <NewLinkOptions type={type} />
              <Link href="/" className="text-sm text-ink underline underline-offset-4 hover:text-brass">
                Voltar ao início
              </Link>
            </div>
          )}
        </div>
      </Container>
    </section>
  );
}
