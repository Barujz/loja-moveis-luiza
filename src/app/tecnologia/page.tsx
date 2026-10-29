import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { SolutionMedia } from "@/components/technology/SolutionMedia";
import { site, whatsappLink } from "@/lib/site";
import { loadTechnology } from "@/lib/technology/load";

export const metadata: Metadata = {
  title: "Inovação Tecnológica para a Hotelaria",
  description: "Espaço institucional da QeeL Tech na Luiza. O conteúdo publicado vem do cadastro administrativo.",
};

export default async function TechnologyPage() {
  const { profile, solutions } = await loadTechnology(false);
  const whatsapp = whatsappLink("Olá, gostaria de falar com a Luiza sobre inovação tecnológica para hotelaria.");
  const showProfile = Boolean(profile?.published && profile.summary);

  return (
    <>
      <section className="relative min-h-[70vh] overflow-hidden bg-ink text-cream">
        <img
          src="/img/brand/lobby-band.jpg"
          alt="Lounge de hotel. Imagem ilustrativa da Luiza, não é um produto da QeeL Tech."
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-linear-to-r from-ink/80 via-ink/45 to-ink/20" />
        <Container className="relative flex min-h-[70vh] items-end py-16 sm:items-center">
          <div className="max-w-3xl">
            <p className="text-xs uppercase tracking-[0.28em] text-brass">QeeL Tech</p>
            <h1 className="mt-4 font-display text-5xl leading-[1.05] sm:text-6xl lg:text-7xl">
              Inovação Tecnológica para a Hotelaria
            </h1>
          </div>
        </Container>
      </section>

      <Container className="grid gap-16 py-20 lg:grid-cols-[220px_1fr] lg:items-start">
        <div className="flex h-40 w-40 items-center justify-center rounded-sm border border-dashed border-line bg-paper">
          {showProfile && profile?.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.logoUrl} alt="Logotipo da QeeL Tech" className="max-h-32 max-w-32 object-contain" />
          ) : (
            <p className="px-4 text-center text-xs uppercase tracking-[0.16em] text-muted">Logotipo oficial</p>
          )}
        </div>
        <div>
          <p className="eyebrow mb-4">Parceira tecnológica</p>
          <h2 className="font-display text-4xl text-ink sm:text-5xl">QeeL Tech</h2>
          {showProfile ? (
            <p className="mt-5 max-w-2xl whitespace-pre-wrap text-base leading-relaxed text-muted">{profile?.summary}</p>
          ) : (
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted">
              A apresentação institucional será publicada aqui quando houver texto e logotipo oficiais. Nada é exibido no lugar deles.
            </p>
          )}
        </div>
      </Container>

      <section className="border-t border-line bg-paper">
        <Container className="py-20">
          <h2 className="font-display text-4xl text-ink">Soluções e serviços</h2>
          {solutions.length === 0 ? (
            <p className="mt-6 max-w-xl text-muted">Nenhuma solução publicada no momento.</p>
          ) : (
            <ul className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {solutions.map((solution) => (
                <li key={solution.id} className="overflow-hidden rounded-sm border border-line bg-cream">
                  <SolutionMedia title={solution.title} imageUrl={solution.imageUrl} icon={solution.icon} />
                  <div className="p-6">
                    <h3 className="font-display text-3xl text-ink">{solution.title}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-muted">{solution.description}</p>
                    {solution.linkUrl ? (
                      <Link
                        href={solution.linkUrl}
                        className="mt-6 inline-flex text-sm text-ink underline underline-offset-4 hover:text-brass"
                        {...(solution.linkUrl.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                      >
                        Saiba mais
                      </Link>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Container>
      </section>

      <section className="bg-ink text-cream">
        <Container className="py-20">
          <p className="eyebrow mb-4 text-brass">Contato comercial</p>
          <h2 className="max-w-2xl font-display text-4xl leading-[1.1] sm:text-5xl">Fale com a Luiza</h2>
          <p className="mt-5 max-w-xl text-cream/75">
            O atendimento usa o e-mail e o WhatsApp já publicados da Luiza.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href={`mailto:${site.email}?subject=${encodeURIComponent("Inovação tecnológica para hotelaria")}`}
              className="inline-flex rounded-full bg-cream px-6 py-3 text-sm font-medium text-ink transition-colors hover:bg-brass hover:text-cream"
            >
              Enviar e-mail
            </a>
            {whatsapp ? (
              <a
                href={whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex rounded-full border border-cream/40 px-6 py-3 text-sm font-medium text-cream transition-colors hover:border-brass hover:text-brass"
              >
                Chamar no WhatsApp
              </a>
            ) : null}
          </div>
        </Container>
      </section>
    </>
  );
}
