import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Dithering } from "@paper-design/shaders-react";
import { useAuth } from "@/hooks/useAuth";
import { useIsDark } from "@/hooks/useIsDark";
import { usePrimaryHex } from "@/hooks/usePrimaryHex";

export function HeroSection() {
  const { user, loading } = useAuth();
  const isDark = useIsDark();
  const primaryHex = usePrimaryHex();
  const isLoggedIn = !!user;

  return (
    <section className="w-full">
      <div className="relative w-full">
        <div className="bg-card relative flex min-h-[90vh] w-full flex-col items-center justify-center overflow-hidden duration-500">
          <div className="absolute inset-0 z-0">
            <div className="pointer-events-none absolute inset-0 opacity-40 mix-blend-multiply">
              <Dithering
                colorBack={isDark ? "#000000" : "#ffffff"}
                colorFront={primaryHex}
                shape="warp"
                type="4x4"
                speed={0.8}
                className="h-full w-full"
                minPixelRatio={1}
              />
            </div>
            <div className="from-background pointer-events-none absolute inset-0 bg-gradient-to-t via-transparent to-transparent" />
          </div>

          <div className="relative z-10 mx-auto flex max-w-4xl flex-col items-center px-6 text-center">
            <h2 className="text-foreground mb-8 font-serif text-5xl leading-[1.05] font-medium tracking-tight md:text-7xl lg:text-8xl">
              Avaliações com <br />
              <span className="text-foreground/80">Inteligência</span>
            </h2>

            <p className="text-muted-foreground mb-12 max-w-2xl text-lg leading-relaxed md:text-xl">
              Crie, aplique e analise provas com o poder da IA. Cogniux transforma a avaliação pedagógica em dados que realmente importam.
            </p>

            {loading ? null : isLoggedIn ? (
              <Link to="/dashboard">
                <button className="group bg-primary text-primary-foreground hover:bg-primary/90 hover:ring-primary/20 relative inline-flex h-14 cursor-pointer items-center justify-center gap-3 overflow-hidden rounded-full px-12 text-base font-medium transition-all duration-300 hover:scale-105 hover:ring-4 active:scale-95">
                  <span className="relative z-10">Dashboard</span>
                  <ArrowRight className="relative z-10 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                </button>
              </Link>
            ) : (
              <Link to="/auth">
                <button className="group bg-primary text-primary-foreground hover:bg-primary/90 hover:ring-primary/20 relative inline-flex h-14 cursor-pointer items-center justify-center gap-3 overflow-hidden rounded-full px-12 text-base font-medium transition-all duration-300 hover:scale-105 hover:ring-4 active:scale-95">
                  <span className="relative z-10">Começar Agora</span>
                  <ArrowRight className="relative z-10 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                </button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
