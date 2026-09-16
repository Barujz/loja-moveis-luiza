import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { categories } from "@/lib/products";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";

export function CategoryGrid() {
  return (
    <section className="py-24">
      <Container>
        <SectionHeading
          eyebrow="Coleções"
          title="Curadoria por ambiente"
          description="Do lobby ao quarto, peças pensadas para compor cada espaço do seu projeto de hospitalidade."
        />

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category, i) => (
            <Reveal key={category.slug} delay={i * 70}>
              <Link
                href={`/catalogo?categoria=${category.slug}`}
                className="group relative block aspect-4/5 overflow-hidden rounded-sm"
              >
                <Image
                  src={category.image}
                  alt={category.name}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-linear-to-t from-ink/80 via-ink/10 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-7">
                  <div className="flex items-end justify-between gap-4">
                    <div>
                      <h3 className="font-display text-2xl text-cream">
                        {category.name}
                      </h3>
                      <p className="mt-1 max-w-[80%] text-sm text-cream/75">
                        {category.description}
                      </p>
                    </div>
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-cream/95 text-ink transition-colors duration-300 group-hover:bg-brass group-hover:text-cream">
                      <ArrowUpRight size={20} />
                    </span>
                  </div>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
