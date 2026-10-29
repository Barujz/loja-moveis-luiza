import type { Metadata } from "next";
import { Mail, MessageCircle } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { site, whatsappLink } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contato",
  description: "Contato comercial da Luiza. O orçamento de um catálogo é feito na própria página, por um comprador aprovado.",
};

export default function ContactPage() {
  const whatsapp = whatsappLink("Olá, gostaria de falar com a Luiza.");

  return (
    <>
      <PageHeader
        eyebrow="Contato"
        title="Fale com a Luiza"
        description="E-mail e WhatsApp são o atendimento comercial geral. O orçamento de um catálogo específico continua na página do catálogo, para compradores aprovados."
        breadcrumbs={[{ label: "Início", href: "/" }, { label: "Contato" }]}
      />

      <Container className="grid gap-16 py-16 lg:grid-cols-2 lg:py-20">
        <div>
          <h2 className="font-display text-3xl text-ink">Atendimento comercial</h2>
          <p className="mt-4 max-w-md text-base leading-relaxed text-muted">
            Para uma conversa geral sobre a plataforma, use o e-mail ou o WhatsApp.
          </p>
          <ul className="mt-8 space-y-6">
            <li className="flex items-start gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brass/10 text-brass">
                <Mail size={20} />
              </span>
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-muted">E-mail</p>
                <a href={`mailto:${site.email}`} className="mt-0.5 block text-lg text-ink transition-colors hover:text-brass">
                  {site.email}
                </a>
              </div>
            </li>
            {whatsapp ? (
              <li className="flex items-start gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brass/10 text-brass">
                  <MessageCircle size={20} />
                </span>
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-muted">WhatsApp</p>
                  <a
                    href={whatsapp}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-0.5 block text-lg text-ink transition-colors hover:text-brass"
                  >
                    {site.whatsapp}
                  </a>
                </div>
              </li>
            ) : null}
          </ul>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href={`mailto:${site.email}`}
              className="inline-flex items-center rounded-full bg-ink px-6 py-3 text-sm font-medium text-cream transition-colors hover:bg-brass"
            >
              Enviar e-mail
            </a>
            {whatsapp ? (
              <a
                href={whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center rounded-full border border-ink/25 px-6 py-3 text-sm font-medium text-ink transition-colors hover:border-brass hover:text-brass"
              >
                Chamar no WhatsApp
              </a>
            ) : null}
          </div>
        </div>

        <div className="max-w-xl">
          <h2 className="font-display text-3xl text-ink">Orçamento de catálogo</h2>
          <p className="mt-4 text-base leading-relaxed text-muted">
            Abra um catálogo publicado, entre com a conta de comprador aprovada e envie a mensagem. Esse pedido fica registrado no catálogo e não substitui o contato comercial acima.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button href="/catalogo">Ver catálogos</Button>
            <Button href="/cadastro" variant="outline">
              Criar conta
            </Button>
          </div>
        </div>
      </Container>
    </>
  );
}
