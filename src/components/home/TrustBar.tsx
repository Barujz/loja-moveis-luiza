import { Ruler, Truck, Sparkles, ShieldCheck } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";

const items = [
  { icon: Ruler, title: "Sob medida", text: "Projetos adaptados a cada ambiente." },
  { icon: Sparkles, title: "Acabamento premium", text: "Materiais nobres e feitos à mão." },
  { icon: Truck, title: "Escala hoteleira", text: "Produção e logística para grandes volumes." },
  { icon: ShieldCheck, title: "Garantia estendida", text: "Durabilidade para uso intenso." },
];

export function TrustBar() {
  return (
    <section className="border-y border-line bg-paper">
      <Container>
        <div className="grid grid-cols-2 divide-line lg:grid-cols-4 lg:divide-x">
          {items.map((item, i) => (
            <Reveal
              key={item.title}
              delay={i * 80}
              className="flex items-start gap-4 py-8 lg:px-8 lg:first:pl-0"
            >
              <item.icon size={26} className="mt-1 shrink-0 text-brass" strokeWidth={1.5} />
              <div>
                <p className="font-display text-lg text-ink">{item.title}</p>
                <p className="mt-1 text-sm text-muted">{item.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
