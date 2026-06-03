import { BrainCircuit, BarChart3, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const cards = [
  {
    title: "Criação Inteligente",
    description:
      "Monte provas com questões geradas por IA ou manualmente, com suporte a múltipla escolha, dissertativas e muito mais.",
    Icon: BrainCircuit,
    gradient: "from-primary/10 to-primary/5",
  },
  {
    title: "Análise de Resultados",
    description:
      "Visualize o desempenho individual e coletivo dos alunos com gráficos detalhados e relatórios automáticos.",
    Icon: BarChart3,
    gradient: "from-secondary/10 to-secondary/5",
  },
  {
    title: "IA Pedagógica",
    description:
      "Corrija dissertativas automaticamente, gere planos de aula e identifique lacunas de aprendizado com inteligência artificial.",
    Icon: Sparkles,
    gradient: "from-accent/20 to-accent/10",
  },
] as const;

export function AboutSection() {
  return (
    <section id="about" className="py-8 sm:py-16 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 max-w-6xl space-y-4 text-center mx-auto md:mb-16 lg:mb-24">
          <p className="text-primary text-sm font-medium uppercase tracking-widest">
            Sobre o Cogniux
          </p>
          <h2 className="text-foreground text-2xl font-semibold md:text-3xl lg:text-4xl">
            Tudo que você precisa para avaliar melhor
          </h2>
          <p className="text-muted-foreground text-xl">
            Uma plataforma completa para professores criarem, aplicarem e analisarem avaliações com o suporte da inteligência artificial.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 md:items-stretch lg:grid-cols-3">
          {cards.map(({ title, description, Icon, gradient }) => (
            <div key={title} className="h-full max-lg:last:col-span-full">
              <Card className="flex h-full flex-col gap-6 rounded-lg border py-6 shadow-none">
                <div className="flex flex-1 flex-col space-y-4 px-6">
                  <div
                    className={cn(
                      "relative h-40 w-full shrink-0 overflow-hidden rounded-md bg-gradient-to-br flex items-center justify-center",
                      gradient,
                    )}
                  >
                    <div className="p-4 rounded-xl bg-background/60 backdrop-blur-sm">
                      <Icon className="h-10 w-10 text-primary" />
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-3 text-xl font-semibold">
                    <Icon className="h-6 w-6 text-foreground" />
                    <span className="text-foreground">{title}</span>
                  </div>
                  <p className="text-muted-foreground mt-auto">{description}</p>
                </div>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
