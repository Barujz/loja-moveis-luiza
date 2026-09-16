import { Suspense } from "react";
import type { Metadata } from "next";
import { Mail, Phone, MapPin, Clock } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { QuoteForm } from "@/components/contact/QuoteForm";
import { site, whatsappLink } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contato",
  description:
    "Solicite um orçamento de mobiliário de luxo para o seu projeto de hotelaria. Resposta em até um dia útil.",
};

export default function ContactPage() {
  const contactItems = [
    { icon: Phone, label: "Telefone", value: site.phone, href: `tel:${site.phone.replace(/[^\d+]/g, "")}` },
    { icon: Mail, label: "E-mail", value: site.email, href: `mailto:${site.email}` },
    { icon: MapPin, label: "Atendimento", value: site.address },
    { icon: Clock, label: "Horário", value: "Seg a Sex, 9h às 18h" },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Contato"
        title="Vamos conversar sobre o seu projeto"
        description="Preencha o formulário e receba uma proposta sob medida — com prazos, acabamentos e condições para o seu volume."
        breadcrumbs={[{ label: "Início", href: "/" }, { label: "Contato" }]}
      />

      <Container className="py-16 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.4fr] lg:gap-20">
          {/* Info */}
          <div>
            <h2 className="font-display text-2xl text-ink">
              Fale direto com o ateliê
            </h2>
            <p className="mt-3 text-muted">
              Prefere o contato direto? Estamos à disposição pelos canais abaixo.
            </p>

            <ul className="mt-8 space-y-6">
              {contactItems.map((item) => (
                <li key={item.label} className="flex items-start gap-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brass/10 text-brass">
                    <item.icon size={20} />
                  </span>
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-muted">
                      {item.label}
                    </p>
                    {item.href ? (
                      <a
                        href={item.href}
                        className="mt-0.5 block text-lg text-ink transition-colors hover:text-brass"
                      >
                        {item.value}
                      </a>
                    ) : (
                      <p className="mt-0.5 text-lg text-ink">{item.value}</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>

            <a
              href={whatsappLink(
                "Olá! Gostaria de conversar sobre um projeto de mobiliário.",
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-10 inline-flex items-center justify-center gap-2 rounded-full border border-ink/20 px-6 py-3 text-sm font-medium text-ink transition-colors hover:border-brass hover:text-brass"
            >
              Chamar no WhatsApp
            </a>
          </div>

          {/* Form */}
          <div className="rounded-sm border border-line bg-paper p-6 sm:p-10">
            <Suspense fallback={<div className="min-h-[30vh]" />}>
              <QuoteForm />
            </Suspense>
          </div>
        </div>
      </Container>
    </>
  );
}
