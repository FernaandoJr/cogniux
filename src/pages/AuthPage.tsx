import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Dithering } from "@paper-design/shaders-react";
import { toast } from "sonner";
import { LandingNavbar } from "@/components/landing/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { GoogleIcon, GithubIcon } from "@/components/icons/BrandIcons";
import { useAuth } from "@/hooks/useAuth";
import { normalizeAccessCode } from "@/lib/accessCode";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

function useIsDark() {
  const [isDark, setIsDark] = useState(
    () => typeof document !== "undefined" && document.documentElement.classList.contains("dark"),
  );
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains("dark"));
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);
  return isDark;
}

export function AuthPage() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user, login, loginWithGithub, loginAnonymously } = useAuth();
  const isDark = useIsDark();

  useEffect(() => {
    if (user) navigate("/dashboard", { replace: true });
  }, [user, navigate]);

  const handleEnterExam = async () => {
    if (!code.trim()) return;
    try {
      setLoading(true);
      const normalized = normalizeAccessCode(code);
      const tokenSnap = await getDoc(doc(db, "access_tokens", normalized));
      if (tokenSnap.exists()) {
        const tokenData = tokenSnap.data();
        if (tokenData.isUsed) {
          toast.error("Este código de acesso já foi utilizado.");
          return;
        }
        navigate(`/online/${tokenData.examId}?token=${normalized}`);
        return;
      }
      navigate(`/online/${code.trim()}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao verificar código.");
    } finally {
      setLoading(false);
    }
  };

  const handleProfessorLogin = async () => {
    try {
      await login();
      navigate("/dashboard");
    } catch {
      toast.error("Falha na autenticação com Google.");
    }
  };

  const handleGithubLogin = async () => {
    try {
      await loginWithGithub();
    } catch {
      toast.error("Falha na autenticação com GitHub.");
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
      <div className="flex h-[calc(100dvh-3.5rem)] w-full overflow-hidden">
        {/* Form panel */}
        <div className="flex flex-1 items-center justify-center overflow-y-auto p-8">
          <div className="w-full max-w-md space-y-8">
            {/* Student section */}
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold tracking-tight">Acessar Atividade</h1>
              <p className="text-muted-foreground text-sm">
                Cole o código fornecido pelo seu professor.
              </p>
            </div>

            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="exam-code">Código da Atividade</Label>
                <Input
                  id="exam-code"
                  placeholder="Ex: ABC123"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleEnterExam()}
                  autoComplete="off"
                />
              </div>
              <Button
                className="w-full"
                disabled={!code.trim() || loading}
                onClick={handleEnterExam}
              >
                Entrar na Atividade
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>

            <div className="relative">
              <Separator />
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-3 text-xs text-muted-foreground uppercase tracking-widest">
                Professor
              </span>
            </div>

            {/* Professor section */}
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Acesse sua conta para criar e gerenciar avaliações.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="w-full" onClick={handleProfessorLogin}>
                  <GoogleIcon className="mr-2 h-4 w-4" />
                  Google
                </Button>
                <Button variant="outline" className="w-full" onClick={handleGithubLogin}>
                  <GithubIcon className="mr-2 h-4 w-4 text-foreground" />
                  GitHub
                </Button>
              </div>
              <Button
                variant="ghost"
                className="w-full text-muted-foreground"
                onClick={handleAnonymousLogin}
              >
                Continuar sem conta
              </Button>
            </div>
          </div>
        </div>

        {/* Dithering panel — desktop only */}
        <div className="relative hidden flex-1 p-4 md:block lg:p-8">
          <Dithering
            colorBack={isDark ? "#000000" : "#ffffff"}
            colorFront="#aff33e"
            shape="warp"
            type="4x4"
            speed={0.8}
            className="h-full w-full rounded-xl opacity-60"
            minPixelRatio={1}
          />
          <div className="absolute inset-4 lg:inset-8 rounded-xl ring-1 ring-border/40 pointer-events-none" />
        </div>
      </div>
    </>
  );
}
