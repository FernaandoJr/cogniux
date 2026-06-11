import { useNavigate } from "react-router-dom";
import { Dithering } from "@paper-design/shaders-react";
import { toast } from "sonner";
import { LandingNavbar } from "@/components/landing/Navbar";
import { Button } from "@/components/ui/button";
import { GoogleIcon } from "@/components/icons/BrandIcons";
import { useAuth } from "@/hooks/useAuth";
import { useIsDark } from "@/hooks/useIsDark";
import { usePrimaryHex } from "@/hooks/usePrimaryHex";
import { useEffect } from "react";

export function AuthPage() {
  const navigate = useNavigate();
  const { user, login, loginAnonymously } = useAuth();
  const isDark = useIsDark();
  const primaryHex = usePrimaryHex();

  useEffect(() => {
    if (user) navigate("/dashboard", { replace: true });
  }, [user, navigate]);

  const handleProfessorLogin = async () => {
    try {
      await login();
      navigate("/dashboard");
    } catch (e) {
      console.error("Google auth error:", e);
      toast.error("Falha na autenticação com Google.");
    }
  };

  const handleAnonymousLogin = async () => {
    try {
      await loginAnonymously();
      navigate("/dashboard");
    } catch {
      toast.error("Falha na autenticação anônima.");
    }
  };

  return (
    <>
      <LandingNavbar disableSticky forceBlur />
      <div className="flex h-[calc(100dvh-3.5rem)] w-full overflow-hidden bg-white dark:bg-black">
        <div className="flex flex-1 items-center justify-center overflow-y-auto p-8">
          <div className="w-full max-w-md space-y-8">
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold tracking-tight">Acesso do Professor</h1>
              <p className="text-muted-foreground text-sm">
                Entre com sua conta para criar e gerenciar avaliações.
              </p>
            </div>

            <div className="space-y-3">
              <Button variant="outline" className="w-full cursor-pointer" onClick={handleProfessorLogin}>
                <GoogleIcon className="mr-2 h-4 w-4" />
                Entrar com Google
              </Button>
              <Button
                variant="ghost"
                className="w-full text-muted-foreground cursor-pointer"
                onClick={handleAnonymousLogin}
              >
                Continuar sem conta
              </Button>
            </div>
          </div>
        </div>

        <div className="relative hidden flex-1 p-4 md:block lg:p-8">
          <div className="pointer-events-none absolute inset-4 lg:inset-8 opacity-40 mix-blend-multiply rounded-xl overflow-hidden">
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
          <div className="absolute inset-4 lg:inset-8 rounded-xl ring-1 ring-border/40 pointer-events-none" />
        </div>
      </div>
    </>
  );
}
