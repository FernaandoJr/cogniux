import { useNavigate } from "react-router-dom";
import { Edit2, Eye, Trash2, MoreHorizontal, Globe, FileText } from "lucide-react";
import { deleteDoc, doc } from "firebase/firestore";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { formatExamCreatedAt } from "@/lib/examStats";
import { db } from "@/lib/firebase";
import { queryClient } from "@/lib/queryClient";
import { queryKeys } from "@/lib/queryKeys";
import { useState } from "react";
import type { Exam } from "@/types";

interface ExamsTableProps {
  exams: Exam[];
  statsByExamId: Record<string, { count: number; average: number }>;
  professorId: string;
  loading?: boolean;
}

export function ExamsTable({ exams, statsByExamId, professorId, loading }: ExamsTableProps) {
  const navigate = useNavigate();
  const [deleteTarget, setDeleteTarget] = useState<Exam | null>(null);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteDoc(doc(db, "exams", deleteTarget.id));
      queryClient.invalidateQueries({ queryKey: queryKeys.exams(professorId) });
      toast.success("Prova excluída.");
    } catch {
      toast.error("Erro ao excluir prova.");
    } finally {
      setDeleteTarget(null);
    }
  };

  if (loading) {
    return (
      <div className="w-full">
        <div className="flex items-center gap-4 px-4 py-3 border-b">
          <Skeleton className="h-4 w-6" />
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-28 ml-auto hidden sm:block" />
          <Skeleton className="h-5 w-20 hidden md:block" />
          <Skeleton className="h-4 w-10 hidden lg:block" />
          <Skeleton className="h-4 w-10 hidden lg:block" />
        </div>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3 border-b last:border-0">
            <Skeleton className="h-7 w-7 rounded-md shrink-0" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-24 ml-auto hidden sm:block" />
            <Skeleton className="h-5 w-16 rounded-full hidden md:block" />
            <Skeleton className="h-4 w-8 hidden lg:block" />
            <Skeleton className="h-4 w-8 hidden lg:block" />
          </div>
        ))}
      </div>
    );
  }

  if (!exams.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground gap-3">
        <FileText className="h-10 w-10 opacity-40" />
        <p className="text-sm">Nenhuma prova criada ainda.</p>
        <Button size="sm" onClick={() => navigate("/exams/create")}>
          Criar primeira prova
        </Button>
      </div>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10" />
            <TableHead>Disciplina</TableHead>
            <TableHead className="hidden sm:table-cell">Turma / Curso</TableHead>
            <TableHead className="hidden md:table-cell">Modo</TableHead>
            <TableHead className="hidden lg:table-cell">Respostas</TableHead>
            <TableHead className="hidden lg:table-cell">Média</TableHead>
            <TableHead className="hidden xl:table-cell">Criada</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {exams.map((exam) => {
            const stats = statsByExamId[exam.id];
            return (
              <TableRow key={exam.id} className="cursor-pointer hover:bg-muted/50">
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={<Button variant="ghost" size="icon" className="h-8 w-8" />}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => navigate(`/exams/${exam.id}/overview`)}>
                        <Eye className="h-4 w-4" />
                        Ver detalhes
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate(`/exams/${exam.id}/edit`)}>
                        <Edit2 className="h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => setDeleteTarget(exam)}
                      >
                        <Trash2 className="h-4 w-4" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
                <TableCell
                  className="font-medium"
                  onClick={() => navigate(`/exams/${exam.id}/overview`)}
                >
                  {exam.subject}
                  {exam.unit && (
                    <span className="ml-2 text-xs text-muted-foreground">{exam.unit}</span>
                  )}
                </TableCell>
                <TableCell
                  className="hidden sm:table-cell text-muted-foreground text-sm"
                  onClick={() => navigate(`/exams/${exam.id}/overview`)}
                >
                  {[exam.className, exam.course].filter(Boolean).join(" · ") || "—"}
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <Badge variant={exam.isOnline ? "default" : "secondary"}>
                    {exam.isOnline ? (
                      <><Globe className="h-3 w-3 mr-1" />Online</>
                    ) : (
                      "Presencial"
                    )}
                  </Badge>
                </TableCell>
                <TableCell className="hidden lg:table-cell text-sm">
                  {stats?.count ?? 0}
                </TableCell>
                <TableCell className="hidden lg:table-cell text-sm">
                  {stats?.count ? stats.average.toFixed(1) : "—"}
                </TableCell>
                <TableCell className="hidden xl:table-cell text-xs text-muted-foreground">
                  {formatExamCreatedAt(exam.createdAt) ?? "—"}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir prova?</AlertDialogTitle>
            <AlertDialogDescription>
              "{deleteTarget?.subject}" será excluída permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
