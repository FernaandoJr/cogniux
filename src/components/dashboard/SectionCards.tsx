import { BookOpen, TrendingUp, Users, CalendarDays } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface SectionCardsProps {
  totalExams: number;
  totalSubmissions: number;
  averageScore: number;
  examsThisMonth: number;
  loading?: boolean;
}

export function SectionCards({
  totalExams,
  totalSubmissions,
  averageScore,
  examsThisMonth,
  loading,
}: SectionCardsProps) {
  const cards = [
    { title: "Total de Provas",      value: totalExams,                                        icon: BookOpen     },
    { title: "Respostas Recebidas",  value: totalSubmissions,                                  icon: Users        },
    { title: "Média Geral",          value: averageScore > 0 ? averageScore.toFixed(1) : "—",  icon: TrendingUp   },
    { title: "Provas este Mês",      value: examsThisMonth,                                    icon: CalendarDays },
  ];

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map(({ title, value, icon: Icon }) => (
        <Card key={title}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
              {title}
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight">{value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
