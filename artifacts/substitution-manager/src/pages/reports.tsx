import { useState, useMemo } from "react";
import { Layout } from "@/components/Layout";
import { format, startOfWeek, endOfWeek, addDays, subDays, parseISO } from "date-fns";
import { useSubstitutionsByDateRange, type Substitution } from "@/hooks/use-substitutions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Loader2, BarChart3 } from "lucide-react";

export default function Reports() {
  const [currentDate, setCurrentDate] = useState(new Date());

  // Week starts on Monday (1)
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  // Week ends on Saturday (add 5 days to Monday)
  const weekEnd = addDays(weekStart, 5);

  const startDateStr = format(weekStart, "yyyy-MM-dd");
  const endDateStr = format(weekEnd, "yyyy-MM-dd");

  const { data: substitutions = [], isLoading } = useSubstitutionsByDateRange(startDateStr, endDateStr);

  const prevWeek = () => setCurrentDate(subDays(currentDate, 7));
  const nextWeek = () => setCurrentDate(addDays(currentDate, 7));

  const teacherStats = useMemo(() => {
    const stats: Record<string, any[]> = {};
    substitutions.forEach(sub => {
      if (!stats[sub.teacherName]) {
        stats[sub.teacherName] = [];
      }
      stats[sub.teacherName].push(sub);
    });

    return Object.entries(stats)
      .map(([teacherName, subs]) => ({
        teacherName,
        count: subs.length,
        subs: subs.sort((a, b) => a.date.localeCompare(b.date) || a.period - b.period)
      }))
      .sort((a, b) => b.count - a.count);
  }, [substitutions]);

  const totalSubs = substitutions.length;

  return (
    <Layout>
      <div className="p-8 max-w-5xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-6 rounded-xl border shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <BarChart3 className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-serif font-bold text-foreground">Weekly Reports</h1>
              <p className="text-muted-foreground mt-1 text-sm">
                Overview of substitutions across the school
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-muted p-1.5 rounded-lg border">
            <Button variant="ghost" size="icon" onClick={prevWeek} className="h-8 w-8">
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div className="text-sm font-medium px-2 min-w-[200px] text-center">
              {format(weekStart, "MMM d")} – {format(weekEnd, "MMM d, yyyy")}
            </div>
            <Button variant="ghost" size="icon" onClick={nextWeek} className="h-8 w-8">
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-1 border-primary/20 bg-primary/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Total Substitutions</CardTitle>
              <CardDescription>For the selected week</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-5xl font-serif font-bold text-primary">
                {isLoading ? <Loader2 className="w-8 h-8 animate-spin" /> : totalSubs}
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Teacher Breakdown</CardTitle>
              <CardDescription>Most utilized teachers this week</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex justify-center p-8">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : teacherStats.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground italic">
                  No substitutions recorded for this week.
                </div>
              ) : (
                <div className="divide-y">
                  {teacherStats.map(stat => (
                    <TeacherRow key={stat.teacherName} stat={stat} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}

function TeacherRow({ stat }: { stat: any }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="flex flex-col">
      <button 
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors w-full text-left"
      >
        <div className="font-medium text-foreground">{stat.teacherName}</div>
        <div className="flex items-center gap-4">
          <div className="bg-primary text-primary-foreground text-xs font-bold px-2.5 py-0.5 rounded-full">
            {stat.count} {stat.count === 1 ? 'sub' : 'subs'}
          </div>
          {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </button>
      {expanded && (
        <div className="bg-muted/30 p-4 border-t border-b text-sm">
          <table className="w-full text-left">
            <thead>
              <tr className="text-muted-foreground border-b border-border/50">
                <th className="pb-2 font-medium">Date</th>
                <th className="pb-2 font-medium">Absent Teacher</th>
                <th className="pb-2 font-medium">Coverage</th>
                <th className="pb-2 font-medium">Assigned To</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {stat.subs.map((sub: Substitution) => (
                <tr key={sub.id}>
                  <td className="py-2">{format(parseISO(sub.date), "EEE, MMM d")}</td>
                  <td className="py-2">{sub.absentTeacherName || "—"}</td>
                  <td className="py-2">
                    <div className="font-medium">Period {sub.period}</div>
                    <div className="text-xs text-muted-foreground">{sub.class}</div>
                  </td>
                  <td className="py-2 font-medium">{sub.teacherName}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
