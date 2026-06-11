import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { LandingNavbar } from "@/components/landing/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { normalizeAccessCode } from "@/lib/accessCode";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export function StudentPage() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

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

  return (
    <>
      <LandingNavbar disableSticky forceBlur />
      <div className="flex h-[calc(100dvh-3.5rem)] w-full items-center justify-center overflow-y-auto p-8">
        <div className="w-full max-w-md space-y-8">
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
                autoFocus
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
        </div>
      </div>
    </>
  );
}
