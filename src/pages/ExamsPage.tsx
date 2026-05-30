import { useMemo } from "react";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { AppSidebar } from "@/components/app-sidebar";
import { ExamsTable } from "@/components/dashboard/ExamsTable";
import { useAuth } from "@/hooks/useAuth";
import { useExams } from "@/hooks/useExams";
import { useSubmissionScores } from "@/hooks/useSubmissionScores";

export function ExamsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { exams, loading: examsLoading } = useExams(user?.uid);
  const examIds = useMemo(() => exams.map((e) => e.id), [exams]);
  const { statsByExamId, ready: scoresReady } = useSubmissionScores(examIds);

  const loading = examsLoading || !scoresReady;

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1 cursor-pointer" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>Provas</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="ml-auto">
            <Button size="sm" className="cursor-pointer" onClick={() => navigate("/exams/create")}>
              <Plus className="h-4 w-4" />
              Nova Prova
            </Button>
          </div>
        </header>

        <div className="flex flex-1 flex-col p-6">
          <ExamsTable
            exams={exams}
            statsByExamId={statsByExamId}
            professorId={user?.uid ?? ""}
            loading={loading}
          />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
