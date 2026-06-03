import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { db } from "@/lib/firebase";
import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { queryClient } from "@/lib/queryClient";
import { queryKeys } from "@/lib/queryKeys";
import { stripUndefined } from "@/lib/firestorePayload";
import type { Exam } from "@/types";
import { toast } from "sonner";

const examEditSchema = z.object({
  subject: z.string().trim().min(1, "Matéria é obrigatória."),
  semester: z.string().trim().min(1, "Semestre é obrigatório."),
  course: z.string().trim().min(1, "Curso é obrigatório."),
  className: z.string().trim().min(1, "Turma é obrigatória."),
  unit: z.string().trim().min(1, "Unidade é obrigatória."),
  numQuestions: z
    .number({ invalid_type_error: "Informe a quantidade de questões.", required_error: "Informe a quantidade de questões." })
    .int("Use um número inteiro.")
    .min(1, "Mínimo de 1 questão.")
    .max(100, "Máximo de 100 questões."),
  alternativesPerQuestion: z.number().min(2).max(5),
});
type ExamEditFormValues = z.infer<typeof examEditSchema>;

interface ExamEditDialogProps {
  exam: Exam;
  examId: string;
  open: boolean;
  onClose: () => void;
}

export function ExamEditDialog({ exam, examId, open, onClose }: ExamEditDialogProps) {
  const [loading, setLoading] = useState(false);
  const form = useForm<ExamEditFormValues>({
    resolver: zodResolver(examEditSchema),
    defaultValues: {
      subject: exam.subject,
      semester: exam.semester,
      course: exam.course ?? "",
      className: exam.className ?? "",
      unit: exam.unit ?? "",
      numQuestions: exam.numQuestions,
      alternativesPerQuestion: exam.alternativesPerQuestion,
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        subject: exam.subject,
        semester: exam.semester,
        course: exam.course ?? "",
        className: exam.className ?? "",
        unit: exam.unit ?? "",
        numQuestions: exam.numQuestions,
        alternativesPerQuestion: exam.alternativesPerQuestion,
      });
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = form.handleSubmit(async (data) => {
    setLoading(true);
    try {
      await updateDoc(doc(db, "exams", examId), {
        ...stripUndefined(data),
        updatedAt: serverTimestamp(),
      });
      void queryClient.invalidateQueries({ queryKey: queryKeys.exam(examId), refetchType: "none" });
      void queryClient.invalidateQueries({ queryKey: queryKeys.exams(exam.professorId), refetchType: "none" });
      toast.success("Prova atualizada!");
      onClose();
    } catch {
      toast.error("Erro ao salvar prova.");
    } finally {
      setLoading(false);
    }
  });

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Prova</DialogTitle>
        </DialogHeader>
        <form id="exam-edit-form" onSubmit={(e) => { e.preventDefault(); void handleSave(); }} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-subject">Matéria / UC <span className="text-destructive">*</span></Label>
            <Input id="edit-subject" {...form.register("subject")} />
            {form.formState.errors.subject && <p className="text-sm text-destructive">{form.formState.errors.subject.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-semester">Semestre <span className="text-destructive">*</span></Label>
              <Input id="edit-semester" {...form.register("semester")} />
              {form.formState.errors.semester && <p className="text-sm text-destructive">{form.formState.errors.semester.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-course">Curso <span className="text-destructive">*</span></Label>
              <Input id="edit-course" {...form.register("course")} />
              {form.formState.errors.course && <p className="text-sm text-destructive">{form.formState.errors.course.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-className">Turma <span className="text-destructive">*</span></Label>
              <Input id="edit-className" {...form.register("className")} />
              {form.formState.errors.className && <p className="text-sm text-destructive">{form.formState.errors.className.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-unit">Unidade <span className="text-destructive">*</span></Label>
              <Input id="edit-unit" {...form.register("unit")} />
              {form.formState.errors.unit && <p className="text-sm text-destructive">{form.formState.errors.unit.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-numQuestions">Qtd. Questões <span className="text-destructive">*</span></Label>
              <Input id="edit-numQuestions" type="number" {...form.register("numQuestions", { valueAsNumber: true })} />
              {form.formState.errors.numQuestions && <p className="text-sm text-destructive">{form.formState.errors.numQuestions.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-alternatives">Alternativas</Label>
              <Controller
                name="alternativesPerQuestion"
                control={form.control}
                render={({ field }) => (
                  <Select value={String(field.value)} onValueChange={(v) => field.onChange(Number(v))}>
                    <SelectTrigger id="edit-alternatives" className="w-full">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {[2, 3, 4, 5].map((n) => (
                        <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>
          <button type="submit" className="hidden" />
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancelar</Button>
          <Button form="exam-edit-form" type="submit" disabled={loading} className="cursor-pointer">
            {loading && <Loader2 className="animate-spin mr-2" size={18} />}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
