import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/ui/Container";

export function CtaContact() {
  return (
    <section className="relative overflow-hidden">
      <Image
        src="/img/brand/lobby-band.jpg"
        alt="Lounge de hotel com luz baixa. Fotografia ilustrativa, não é um produto à venda."
        width={1920}
        height={1080}
        className="h-[60vh] min-h-[420px] w-full object-cover"
      />
      <div className="absolute inset-0 bg-ink/70" />
      <Container className="absolute inset-0 flex items-center">
        <div className="max-w-2xl text-cream">
          <p className="eyebrow mb-4 text-brass">Próximo passo</p>
          <h2 className="text-4xl leading-[1.1] text-cream sm:text-5xl lg:text-6xl">Consulte um catálogo publicado</h2>
          <p className="mt-5 max-w-lg text-base leading-relaxed text-cream/80 sm:text-lg">
            O orçamento é pedido dentro do catálogo, por um comprador com perfil e empresa aprovados.
          </p>
          <div className="mt-9 flex flex-wrap gap-4">
            <Link
              href="/catalogo"
              className="inline-flex items-center rounded-full bg-cream px-8 py-4 text-sm font-medium text-ink transition-colors hover:bg-brass hover:text-cream"
            >
              Ver catálogos
            </Link>
            <Link
              href="/cadastro"
              className="inline-flex items-center rounded-full border border-cream/40 px-8 py-4 text-sm font-medium text-cream transition-colors hover:border-brass hover:text-brass"
            >
              Criar conta
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}
