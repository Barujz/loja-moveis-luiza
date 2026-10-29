import { BookOpen, Lock, MessageSquare, Building2 } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";

const items = [
  { icon: BookOpen, title: "Catálogos aprovados", text: "Entram na vitrine depois da aprovação e da publicação do PDF." },
  { icon: Lock, title: "Acervo restrito", text: "Compradores aprovados também veem os catálogos fechados." },
  { icon: MessageSquare, title: "Orçamento no catálogo", text: "O pedido fica ligado ao comprador, ao catálogo e ao fornecedor." },
  { icon: Building2, title: "Hotelaria", text: "Pensado para hotéis, resorts e projetos de hospitalidade." },
];

export function TrustBar() {
  return (
    <section className="border-y border-line bg-paper">
      <Container>
        <div className="grid grid-cols-2 divide-line lg:grid-cols-4 lg:divide-x">
          {items.map((item, i) => (
            <Reveal key={item.title} delay={i * 80} className="flex items-start gap-4 py-8 lg:px-8 lg:first:pl-0">
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
