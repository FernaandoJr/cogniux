import { useMemo, useState } from "react";
import { Plus, BarChart2, Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Button } from "@/components/ui/button";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Skeleton } from "@/components/ui/skeleton";
import { AppSidebar } from "@/components/app-sidebar";
import { useAuth } from "@/hooks/useAuth";
import { useExams } from "@/hooks/useExams";
import { useSubmissionScores } from "@/hooks/useSubmissionScores";
import { useSubmissionDates } from "@/hooks/useSubmissionDates";
import type { Exam } from "@/types";

// ── Chart configs ────────────────────────────────────────────────────────────

const SCORE_BUCKETS = [
  { label: "0–1",  min: 0,  max: 1,     color: "hsl(0 72% 40%)"    },
  { label: "1–2",  min: 1,  max: 2,     color: "hsl(0 72% 48%)"    },
  { label: "2–3",  min: 2,  max: 3,     color: "hsl(10 80% 52%)"   },
  { label: "3–4",  min: 3,  max: 4,     color: "hsl(20 85% 52%)"   },
  { label: "4–5",  min: 4,  max: 5,     color: "hsl(30 90% 52%)"   },
  { label: "5–6",  min: 5,  max: 6,     color: "hsl(42 92% 50%)"   },
  { label: "6–7",  min: 6,  max: 7,     color: "hsl(55 96% 48%)"   },
  { label: "7–8",  min: 7,  max: 8,     color: "hsl(80 70% 45%)"   },
  { label: "8–9",  min: 8,  max: 9,     color: "hsl(110 65% 42%)"  },
  { label: "9–10", min: 9,  max: 10.01, color: "hsl(142 71% 40%)"  },
];

const distChartConfig = Object.fromEntries(
  SCORE_BUCKETS.map((b, i) => [`bucket${i}`, { label: b.label, color: b.color }])
) as ChartConfig;

const passFailConfig = {
  aprovados:  { label: "Aprovados",  color: "hsl(142 71% 45%)" },
  reprovados: { label: "Reprovados", color: "hsl(0 72% 51%)" },
} satisfies ChartConfig;

const participationConfig = {
  entregaram: { label: "Entregaram", color: "var(--chart-1)" },
  pendentes:  { label: "Pendentes",  color: "var(--chart-2)" },
} satisfies ChartConfig;

const courseConfig = {
  media: { label: "Média", color: "var(--chart-3)" },
} satisfies ChartConfig;

const monthlyConfig = {
  media: { label: "Média", color: "var(--chart-4)" },
} satisfies ChartConfig;

const classConfig = {
  aprovacao: { label: "Aprovação %", color: "var(--chart-1)" },
} satisfies ChartConfig;

const hardestConfig = {
  media: { label: "Média", color: "hsl(0 72% 51%)" },
} satisfies ChartConfig;

const modeConfig = {
  online:     { label: "Online",     color: "var(--chart-1)" },
  presencial: { label: "Presencial", color: "var(--chart-2)" },
} satisfies ChartConfig;

const topStudentsConfig = {
  media: { label: "Média", color: "var(--chart-3)" },
} satisfies ChartConfig;

// ── Data builders ────────────────────────────────────────────────────────────

function buildDistribution(scores: { score: number }[]) {
  return SCORE_BUCKETS.map((b) => ({
    label: b.label,
    count: scores.filter((s) => s.score >= b.min && s.score < b.max).length,
    color: b.color,
  }));
}

function buildPassFail(scores: { score: number }[]) {
  const aprovados = scores.filter((s) => s.score >= 6).length;
  return [
    { name: "Aprovados",  value: aprovados,                 fill: "hsl(142 71% 45%)" },
    { name: "Reprovados", value: scores.length - aprovados, fill: "hsl(0 72% 51%)"   },
  ];
}

function buildParticipation(exams: Exam[], statsByExamId: Record<string, { count: number }>) {
  const entregaram = exams.filter((e) => (statsByExamId[e.id]?.count ?? 0) > 0).length;
  return [
    { name: "Entregaram", value: entregaram,                fill: "var(--chart-1)" },
    { name: "Pendentes",  value: exams.length - entregaram, fill: "var(--chart-2)" },
  ];
}

function buildByCourse(
  exams: Exam[],
  statsByExamId: Record<string, { average: number; count: number }>
) {
  const map: Record<string, { sum: number; count: number }> = {};
  for (const e of exams) {
    const stats = statsByExamId[e.id];
    if (!stats || stats.count === 0) continue;
    const course = e.course ?? "Sem curso";
    if (!map[course]) map[course] = { sum: 0, count: 0 };
    map[course].sum   += stats.average * stats.count;
    map[course].count += stats.count;
  }
  return Object.entries(map)
    .map(([course, { sum, count }]) => ({
      course: course.length > 20 ? course.slice(0, 18) + "…" : course,
      media: parseFloat((sum / count).toFixed(2)),
    }))
    .sort((a, b) => b.media - a.media);
}

const MONTH_LABELS = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

function buildMonthlyAvg(
  exams: Exam[],
  statsByExamId: Record<string, { average: number; count: number }>
) {
  const map: Record<string, { sum: number; count: number }> = {};
  for (const e of exams) {
    const stats = statsByExamId[e.id];
    if (!stats || stats.count === 0) continue;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const date = (e as any).createdAt?.toDate?.() as Date | undefined;
    if (!date) continue;
    const key = `${date.getFullYear()}-${String(date.getMonth()).padStart(2, "0")}`;
    if (!map[key]) map[key] = { sum: 0, count: 0 };
    map[key].sum   += stats.average * stats.count;
    map[key].count += stats.count;
  }
  return Object.entries(map)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, { sum, count }]) => {
      const [, month] = key.split("-");
      return { mes: MONTH_LABELS[parseInt(month)], media: parseFloat((sum / count).toFixed(2)) };
    });
}

function buildPassRateByClass(
  exams: Exam[],
  scoresByExamId: Record<string, { score: number }[]>
) {
  const map: Record<string, { approved: number; total: number }> = {};
  for (const e of exams) {
    const scores = scoresByExamId[e.id] ?? [];
    if (!scores.length) continue;
    const cls = e.className ?? "Sem turma";
    if (!map[cls]) map[cls] = { approved: 0, total: 0 };
    map[cls].approved += scores.filter((s) => s.score >= 6).length;
    map[cls].total    += scores.length;
  }
  return Object.entries(map)
    .map(([turma, { approved, total }]) => ({
      turma: turma.length > 18 ? turma.slice(0, 16) + "…" : turma,
      aprovacao: parseFloat(((approved / total) * 100).toFixed(1)),
    }))
    .sort((a, b) => b.aprovacao - a.aprovacao);
}

function buildOnlineVsPresencial(exams: Exam[]) {
  const online = exams.filter((e) => e.isOnline).length;
  return [
    { name: "Online",     value: online,                fill: "var(--chart-1)" },
    { name: "Presencial", value: exams.length - online, fill: "var(--chart-2)" },
  ];
}

function buildTopStudents(scores: { score: number; studentName: string }[], top = 15) {
  const map: Record<string, { sum: number; count: number }> = {};
  for (const s of scores) {
    const name = s.studentName || "Desconhecido";
    if (!map[name]) map[name] = { sum: 0, count: 0 };
    map[name].sum   += s.score;
    map[name].count += 1;
  }
  return Object.entries(map)
    .filter(([, { count }]) => count >= 3)
    .map(([name, { sum, count }]) => ({
      name: name.length > 20 ? name.slice(0, 18) + "…" : name,
      media: parseFloat((sum / count).toFixed(2)),
      provas: count,
    }))
    .sort((a, b) => b.media - a.media)
    .slice(0, top);
}

function buildHardestExams(
  exams: Exam[],
  statsByExamId: Record<string, { average: number; count: number }>
) {
  return exams
    .map((e) => ({ ...statsByExamId[e.id], subject: e.subject }))
    .filter((e) => e.count > 0)
    .sort((a, b) => a.average - b.average)
    .slice(0, 8)
    .map((e) => ({
      subject: e.subject.length > 22 ? e.subject.slice(0, 20) + "…" : e.subject,
      media: parseFloat(e.average.toFixed(2)),
    }));
}

function buildActivityHeatmap(dates: Date[]) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const WEEKS = 36;
  const totalDays = WEEKS * 7;
  const start = new Date(today);
  start.setDate(start.getDate() - totalDays + 1);

  const countMap: Record<string, number> = {};
  for (const d of dates) {
    const key = d.toISOString().slice(0, 10);
    countMap[key] = (countMap[key] ?? 0) + 1;
  }

  const cells: { date: Date; count: number; key: string }[] = [];
  for (let i = 0; i < totalDays; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    cells.push({ date: d, count: countMap[key] ?? 0, key });
  }
  return cells;
}

// ── Heatmap helpers ──────────────────────────────────────────────────────────

const HEATMAP_LEVELS = [
  "bg-muted",
  "bg-primary/20",
  "bg-primary/45",
  "bg-primary/70",
  "bg-primary",
];

const DAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MONTH_NAMES = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

function heatLevel(count: number, max: number) {
  if (count === 0 || max === 0) return 0;
  return Math.min(4, Math.ceil((count / max) * 4));
}

type HeatCell = { date: Date; count: number; key: string };
type TooltipState = { cell: HeatCell; x: number; y: number } | null;

// ── Component ────────────────────────────────────────────────────────────────

export function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { exams, loading: examsLoading } = useExams(user?.uid);
  const examIds = useMemo(() => exams.map((e) => e.id), [exams]);
  const { statsByExamId, scoresByExamId, scores, ready: scoresReady } = useSubmissionScores(examIds);
  const { dates, ready: datesReady } = useSubmissionDates(examIds);
  const [statsVisible, setStatsVisible] = useState(() => {
    try { return localStorage.getItem("dashboard:statsVisible") !== "false"; }
    catch { return true; }
  });
  const [heatTooltip, setHeatTooltip] = useState<TooltipState>(null);

  const distribution    = useMemo(() => buildDistribution(scores),                       [scores]);
  const passFailData    = useMemo(() => buildPassFail(scores),                           [scores]);
  const participation   = useMemo(() => buildParticipation(exams, statsByExamId),        [exams, statsByExamId]);
  const byCourse        = useMemo(() => buildByCourse(exams, statsByExamId),             [exams, statsByExamId]);
  const monthlyData     = useMemo(() => buildMonthlyAvg(exams, statsByExamId),           [exams, statsByExamId]);
  const passByClass     = useMemo(() => buildPassRateByClass(exams, scoresByExamId),     [exams, scoresByExamId]);
  const hardestExams    = useMemo(() => buildHardestExams(exams, statsByExamId),         [exams, statsByExamId]);
  const onlineVsPresencial = useMemo(() => buildOnlineVsPresencial(exams),               [exams]);
  const topStudents     = useMemo(() => buildTopStudents(scores),                        [scores]);
  const heatmapCells    = useMemo(() => buildActivityHeatmap(dates),                     [dates]);
  const heatmapMax      = useMemo(() => Math.max(...heatmapCells.map((c) => c.count), 1), [heatmapCells]);
  const heatmapWeeks    = useMemo(() => {
    const weeks: HeatCell[][] = [];
    for (let i = 0; i < heatmapCells.length; i += 7)
      weeks.push(heatmapCells.slice(i, i + 7));
    return weeks;
  }, [heatmapCells]);

  const loading  = examsLoading || !scoresReady || !datesReady;
  const hasStats = scoresReady && scores.length > 0;

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1 cursor-pointer" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb className="select-none">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>Dashboard</BreadcrumbPage>
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

        <div className="flex flex-1 flex-col gap-6 p-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-semibold">
                Olá, {user?.displayName?.split(" ")[0] ?? "Professor"} 👋
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Bem-vindo de volta ao seu painel.
              </p>
            </div>
            {hasStats && (
              <button
                onClick={() => setStatsVisible((v) => {
                  const next = !v;
                  try { localStorage.setItem("dashboard:statsVisible", String(next)); } catch {}
                  return next;
                })}
                className="cursor-pointer select-none flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mt-1"
              >
                {statsVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {statsVisible ? "Ocultar" : "Mostrar"} estatísticas
              </button>
            )}
          </div>

          {hasStats && (
            <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-6 select-none">

              {/* Heatmap de atividade */}
              {dates.length > 0 && (
                <div className="sm:col-span-2">
                  <p className="text-sm font-medium mb-1">Atividade de entregas</p>
                  <p className="text-xs text-muted-foreground mb-3">Últimas 36 semanas</p>
                  <div
                    className={`relative transition-all duration-300 ${!statsVisible ? "blur-md pointer-events-none" : ""}`}
                    onMouseLeave={() => setHeatTooltip(null)}
                  >
                    <div className="flex gap-[3px] overflow-x-auto pb-1">
                      {Array.from({ length: 36 }).map((_, week) => (
                        <div key={week} className="flex flex-col gap-[3px]">
                          {heatmapCells.slice(week * 7, week * 7 + 7).map((cell) => (
                            <div
                              key={cell.key}
                              className={`w-3 h-3 rounded-[2px] cursor-default transition-opacity hover:opacity-80 ${HEATMAP_LEVELS[heatLevel(cell.count, heatmapMax)]}`}
                              onMouseEnter={(e) => {
                                const rect = (e.currentTarget as HTMLElement)
                                  .closest(".relative")!
                                  .getBoundingClientRect();
                                const el = (e.currentTarget as HTMLElement).getBoundingClientRect();
                                setHeatTooltip({
                                  cell,
                                  x: el.left - rect.left + el.width / 2,
                                  y: el.top - rect.top - 8,
                                });
                              }}
                            />
                          ))}
                        </div>
                      ))}
                    </div>

                    {heatTooltip && (
                      <div
                        className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-md border bg-popover px-2.5 py-1.5 text-xs shadow-md"
                        style={{ left: heatTooltip.x, top: heatTooltip.y }}
                      >
                        <p className="font-medium">
                          {heatTooltip.cell.count} entrega{heatTooltip.cell.count !== 1 ? "s" : ""}
                        </p>
                        <p className="text-muted-foreground">
                          {DAY_LABELS[heatTooltip.cell.date.getDay()]},{" "}
                          {heatTooltip.cell.date.getDate()} de{" "}
                          {MONTH_NAMES[heatTooltip.cell.date.getMonth()]}{" "}
                          {heatTooltip.cell.date.getFullYear()}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                    <span>Menos</span>
                    {HEATMAP_LEVELS.map((cls, i) => (
                      <div key={i} className={`w-3 h-3 rounded-[2px] ${cls}`} />
                    ))}
                    <span>Mais</span>
                  </div>
                </div>
              )}

              {/* Evolução mensal */}
              {monthlyData.length >= 2 && (
                <div className="sm:col-span-2">
                  <p className="text-sm font-medium mb-1">Evolução mensal</p>
                  <p className="text-xs text-muted-foreground mb-3">Média geral de notas por mês</p>
                  <div className={`transition-all duration-300 ${!statsVisible ? "blur-md pointer-events-none select-none" : ""}`}><ChartContainer config={monthlyConfig} className="h-44 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={monthlyData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis dataKey="mes" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={24} />
                        <ChartTooltip content={<ChartTooltipContent formatter={(v) => <span className="font-medium">{(v as number).toFixed(1)} <span className="text-muted-foreground font-normal">Média</span></span>} />} />
                        <Line type="monotone" dataKey="media" stroke="var(--color-media)" strokeWidth={2} dot={{ r: 4, fill: "var(--color-media)" }} name="Média" />
                      </LineChart>
                    </ResponsiveContainer>
                  </ChartContainer></div>
                </div>
              )}

              {/* Distribuição de notas */}
              <div className="sm:col-span-2">
                <p className="text-sm font-medium mb-1">Distribuição de notas</p>
                <p className="text-xs text-muted-foreground mb-3">{scores.length} entregas</p>
                <div className={`transition-all duration-300 ${!statsVisible ? "blur-md pointer-events-none select-none" : ""}`}><ChartContainer config={distChartConfig} className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={distribution} barCategoryGap="30%">
                      <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="label" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={24} />
                      <ChartTooltip content={<ChartTooltipContent />} cursor={false} />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]} name="Alunos">
                        {distribution.map((entry) => (
                          <Cell key={entry.label} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer></div>
              </div>

              {/* Ranking de alunos */}
              {topStudents.length > 0 && (
                <div className="sm:col-span-2 row-span-2">
                  <p className="text-sm font-medium mb-1">Top alunos</p>
                  <p className="text-xs text-muted-foreground mb-3">Maior média entre todas as provas</p>
                  <div className={`transition-all duration-300 ${!statsVisible ? "blur-md pointer-events-none select-none" : ""}`}><ChartContainer config={topStudentsConfig} className="h-[420px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={topStudents} layout="vertical" barCategoryGap="20%">
                        <CartesianGrid horizontal={false} strokeDasharray="3 3" className="stroke-border" />
                        <XAxis type="number" domain={[0, 10]} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                        <ChartTooltip content={<ChartTooltipContent formatter={(v, _n, props) => <span className="font-medium">{(v as number).toFixed(1)} <span className="text-muted-foreground font-normal">({props.payload?.provas} prova{props.payload?.provas !== 1 ? "s" : ""})</span></span>} />} cursor={false} />
                        <Bar dataKey="media" fill="var(--chart-2)" radius={[0, 4, 4, 0]} name="Média" />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer></div>
                </div>
              )}

              {/* Média por curso */}
              <div>
                <p className="text-sm font-medium mb-1">Média por curso</p>
                <p className="text-xs text-muted-foreground mb-3">Média ponderada das entregas</p>
                <div className={`transition-all duration-300 ${!statsVisible ? "blur-md pointer-events-none select-none" : ""}`}><ChartContainer config={courseConfig} className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={byCourse} layout="vertical" barCategoryGap="25%">
                      <CartesianGrid horizontal={false} strokeDasharray="3 3" className="stroke-border" />
                      <XAxis type="number" domain={[0, 10]} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis type="category" dataKey="course" width={80} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                      <ChartTooltip content={<ChartTooltipContent formatter={(v) => <span className="font-medium">{(v as number).toFixed(1)} <span className="text-muted-foreground font-normal">Média</span></span>} />} cursor={false} />
                      <Bar dataKey="media" radius={[0, 4, 4, 0]} name="Média">
                        {byCourse.map((_, i) => (
                          <Cell key={i} fill={`var(--chart-${(i % 10) + 1})`} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer></div>
              </div>


              {/* Taxa de aprovação por turma */}
              {passByClass.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-1">Aprovação por turma</p>
                  <p className="text-xs text-muted-foreground mb-3">% de alunos com nota ≥ 6,0</p>
                  <div className={`transition-all duration-300 ${!statsVisible ? "blur-md pointer-events-none select-none" : ""}`}><ChartContainer config={classConfig} className="h-44 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={passByClass} layout="vertical" barCategoryGap="25%">
                        <CartesianGrid horizontal={false} strokeDasharray="3 3" className="stroke-border" />
                        <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis type="category" dataKey="turma" width={90} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                        <ChartTooltip content={<ChartTooltipContent formatter={(v) => <span className="font-medium">{v}% <span className="text-muted-foreground font-normal">Aprovação</span></span>} />} cursor={false} />
                        <Bar dataKey="aprovacao" fill="var(--color-aprovacao)" radius={[0, 4, 4, 0]} name="Aprovação" />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer></div>
                </div>
              )}

              {/* Aprovados vs Reprovados */}
              <div>
                <p className="text-sm font-medium mb-1">Aprovados vs Reprovados</p>
                <p className="text-xs text-muted-foreground mb-3">Nota mínima 6,0</p>
                <div className={`transition-all duration-300 ${!statsVisible ? "blur-md pointer-events-none select-none" : ""}`}><ChartContainer config={passFailConfig} className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={passFailData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={48} outerRadius={72} paddingAngle={3}>
                        {passFailData.map((entry, i) => (<Cell key={i} fill={entry.fill} />))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer></div>
              </div>

              {/* Participação geral */}
              <div>
                <p className="text-sm font-medium mb-1">Participação geral</p>
                <p className="text-xs text-muted-foreground mb-3">Provas com ao menos 1 entrega</p>
                <div className={`transition-all duration-300 ${!statsVisible ? "blur-md pointer-events-none select-none" : ""}`}><ChartContainer config={participationConfig} className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={participation} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={48} outerRadius={72} paddingAngle={3}>
                        {participation.map((entry, i) => (<Cell key={i} fill={entry.fill} />))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer></div>
              </div>

              {/* Provas mais difíceis */}
              {hardestExams.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-1">Provas mais difíceis</p>
                  <p className="text-xs text-muted-foreground mb-3">Ordenadas pela menor média</p>
                  <div className={`transition-all duration-300 ${!statsVisible ? "blur-md pointer-events-none select-none" : ""}`}><ChartContainer config={hardestConfig} className="h-44 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={hardestExams} layout="vertical" barCategoryGap="25%">
                        <CartesianGrid horizontal={false} strokeDasharray="3 3" className="stroke-border" />
                        <XAxis type="number" domain={[0, 10]} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis type="category" dataKey="subject" width={110} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                        <ChartTooltip content={<ChartTooltipContent formatter={(v) => <span className="font-medium">{(v as number).toFixed(1)} <span className="text-muted-foreground font-normal">Média</span></span>} />} cursor={false} />
                        <Bar dataKey="media" fill="var(--color-media)" radius={[0, 4, 4, 0]} name="Média" />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer></div>
                </div>
              )}

              {/* Online vs Presencial */}
              <div>
                <p className="text-sm font-medium mb-1">Modo das provas</p>
                <p className="text-xs text-muted-foreground mb-3">Online vs presencial</p>
                <div className={`transition-all duration-300 ${!statsVisible ? "blur-md pointer-events-none select-none" : ""}`}><ChartContainer config={modeConfig} className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={onlineVsPresencial} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={48} outerRadius={72} paddingAngle={3}>
                        {onlineVsPresencial.map((entry, i) => (<Cell key={i} fill={entry.fill} />))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer></div>
              </div>


            </div>
          )}

          {loading && (
            <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-44 w-full rounded-lg" />
                </div>
              ))}
            </div>
          )}

          {!hasStats && !loading && (
            <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground gap-3">
              <BarChart2 className="h-10 w-10 opacity-40" />
              <p className="text-sm">Nenhum dado de desempenho ainda.</p>
              <p className="text-xs">Crie provas e receba respostas para ver as estatísticas aqui.</p>
              <Button size="sm" className="cursor-pointer mt-1" onClick={() => navigate("/exams/create")}>
                <Plus className="h-4 w-4" />
                Criar primeira prova
              </Button>
            </div>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
