import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { TechnologyProfileForm, TechnologySolutionForm } from "@/components/technology/TechnologyAdminForms";
import { requireApprovedAdmin } from "@/lib/admin/access";
import { deleteTechnologySolution, setTechnologyPublished } from "@/lib/technology/actions";
import { loadTechnology } from "@/lib/technology/load";

export const metadata: Metadata = { title: "Tecnologia" };

const notices: Record<string, string> = {
  apresentacao: "Apresentação salva.",
  solucao: "Solução salva.",
  visivel: "A visibilidade da solução foi atualizada.",
  excluida: "Solução excluída.",
};

export default async function AdminTechnologyPage({
  searchParams,
}: {
  searchParams: Promise<{ feito?: string }>;
}) {
  await requireApprovedAdmin();
  const query = await searchParams;
  const notice = query.feito ? notices[query.feito] : null;
  const { profile, solutions, unavailable } = await loadTechnology(true);

  return (
    <>
      <PageHeader
        eyebrow="Administração"
        title="Tecnologia"
        description="Publique somente texto, logotipo e soluções confirmados. A página pública não completa o que estiver em branco."
        breadcrumbs={[
          { label: "Início", href: "/" },
          { label: "Painel", href: "/admin" },
          { label: "Tecnologia" },
        ]}
      />
      <Container className="space-y-16 py-16">
        {notice ? (
          <p className="max-w-xl rounded-sm border border-line bg-cream px-4 py-3 text-sm text-ink" role="status">
            {notice}
          </p>
        ) : null}
        {unavailable ? (
          <p className="max-w-xl text-muted">
            A migração da área de tecnologia ainda não está disponível neste banco. A página pública permanece sem conteúdo inventado.
          </p>
        ) : (
          <>
            <section>
              <h2 className="mb-6 font-display text-3xl text-ink">Apresentação</h2>
              <TechnologyProfileForm profile={profile} />
            </section>
            <section>
              <h2 className="font-display text-3xl text-ink">Soluções</h2>
              {solutions.length === 0 ? (
                <p className="mt-4 text-muted">Nenhuma solução cadastrada.</p>
              ) : (
                <ul className="mt-6 divide-y divide-line border-y border-line">
                  {solutions.map((solution) => (
                    <li key={solution.id} className="flex flex-wrap items-center justify-between gap-4 py-4">
                      <div>
                        <p className="text-ink">{solution.title}</p>
                        <p className="text-sm text-muted">{solution.published ? "Publicada" : "Oculta"}</p>
                      </div>
                      <div className="flex flex-wrap gap-3">
                        <form action={setTechnologyPublished}>
                          <input type="hidden" name="id" value={solution.id} />
                          <input type="hidden" name="published" value={solution.published ? "nao" : "sim"} />
                          <Button type="submit" variant="outline">
                            {solution.published ? "Ocultar" : "Publicar"}
                          </Button>
                        </form>
                        <form action={deleteTechnologySolution}>
                          <input type="hidden" name="id" value={solution.id} />
                          <input type="hidden" name="confirm" value="sim" />
                          <Button type="submit" variant="ghost">
                            Excluir
                          </Button>
                        </form>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-10">
                <TechnologySolutionForm />
              </div>
            </section>
          </>
        )}
      </Container>
    </>
  );
}
