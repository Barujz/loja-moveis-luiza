import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <Container className="flex min-h-[60vh] flex-col items-center justify-center py-24 text-center">
      <p className="eyebrow mb-4">Erro 404</p>
      <h1 className="font-display text-5xl text-ink sm:text-6xl">
        Página não encontrada
      </h1>
      <p className="mt-4 max-w-md text-muted">
        O endereço que você buscou não existe ou foi movido. Que tal voltar e
        explorar nossas coleções?
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button href="/">Voltar ao início</Button>
        <Button href="/catalogo" variant="outline">
          Ver catálogo
        </Button>
      </div>
    </Container>
  );
}
