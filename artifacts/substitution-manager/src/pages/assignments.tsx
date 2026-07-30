import { useState, useMemo } from "react";
import { Layout } from "@/components/Layout";
import { format, parseISO, getDay } from "date-fns";
import { useSubstitutionsByDate, useAddSubstitution, useDeleteSubstitution } from "@/hooks/use-substitutions";
import { useFreeTeachers, TimetableSlot } from "@/hooks/use-timetable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Plus, Printer, AlertTriangle, Loader2 } from "lucide-react";
import { useLocation } from "wouter";

export default function Assignments() {
  const [dateStr, setDateStr] = useState(format(new Date(), "yyyy-MM-dd"));
  const [, setLocation] = useLocation();

  const selectedDate = parseISO(dateStr);
  const dayIndex = getDay(selectedDate); // 0 = Sunday, 1 = Monday
  const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const dayName = DAYS[dayIndex];
  const isSunday = dayIndex === 0;

  const { data: substitutions = [], isLoading: subsLoading } = useSubstitutionsByDate(dateStr);

  const handlePrint = () => {
    setLocation(`/print?date=${dateStr}`);
  };

  return (
    <Layout>
      <div className="p-8 max-w-5xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-6 rounded-xl border shadow-sm">
          <div>
            <h1 className="text-3xl font-serif font-bold text-foreground">Daily Assignments</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Manage substitutions for {format(selectedDate, "MMMM do, yyyy")} ({dayName})
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Label htmlFor="date-picker" className="text-muted-foreground">Date:</Label>
              <Input
                id="date-picker"
                type="date"
                value={dateStr}
                onChange={(e) => setDateStr(e.target.value)}
                className="w-auto bg-background"
                data-testid="input-date"
              />
            </div>
            <Button onClick={handlePrint} variant="outline" data-testid="button-print-nav" disabled={isSunday}>
              <Printer className="w-4 h-4 mr-2" />
              Print View
            </Button>
          </div>
        </div>

        {isSunday ? (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 p-6 rounded-xl flex items-start gap-4">
            <AlertTriangle className="w-6 h-6 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-lg">It's Sunday</h3>
              <p>No school on Sunday. Please select a weekday to manage assignments.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {subsLoading ? (
              <div className="flex justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              (dayName === "Saturday" ? [1, 2, 3, 4] : [1, 2, 3, 4, 5, 6, 7, 8]).map((period) => (
                <PeriodCard 
                  key={period}
                  period={period} 
                  dayName={dayName} 
                  dateStr={dateStr}
                  substitutions={substitutions.filter(s => s.period === period)}
                />
              ))
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}

function PeriodCard({ 
  period, 
  dayName, 
  dateStr,
  substitutions
}: { 
  period: number; 
  dayName: string;
  dateStr: string;
  substitutions: any[];
}) {
  const { data: freeTeachers = [], isLoading } = useFreeTeachers(dayName, period);
  const addSub = useAddSubstitution();
  const deleteSub = useDeleteSubstitution();

  const [classInput, setClassInput] = useState("");
  const [selectedTeacher, setSelectedTeacher] = useState("");

  const assignedTeacherNames = new Set(substitutions.map(s => s.teacherName));
  const availableTeachers = freeTeachers.filter(t => !assignedTeacherNames.has(t.teacherName));

  const handleAdd = () => {
    if (!classInput.trim() || !selectedTeacher) return;
    addSub.mutate({
      date: dateStr,
      day: dayName,
      period,
      class: classInput.trim(),
      teacherName: selectedTeacher
    }, {
      onSuccess: () => {
        setClassInput("");
        setSelectedTeacher("");
      }
    });
  };

  return (
    <Card className="overflow-hidden border-sidebar-border/50">
      <div className="flex flex-col md:flex-row">
        {/* Left side: Period Number */}
        <div className="bg-sidebar text-sidebar-foreground w-full md:w-24 p-4 flex md:flex-col items-center justify-center gap-2 border-r border-sidebar-border shrink-0">
          <span className="text-xs uppercase tracking-widest font-semibold opacity-70">Period</span>
          <span className="text-4xl font-serif font-bold">{period}</span>
        </div>
        
        {/* Right side: Content */}
        <div className="flex-1 p-4 md:p-6 flex flex-col gap-6">
          {substitutions.length > 0 && (
            <div className="space-y-2">
              {substitutions.map((sub) => (
                <div key={sub.id} className="flex items-center justify-between bg-accent/30 border p-3 rounded-lg group">
                  <div className="flex items-center gap-4">
                    <div className="bg-background border rounded px-3 py-1 font-mono font-semibold text-sm">
                      {sub.class}
                    </div>
                    <div className="font-medium text-foreground">
                      {sub.teacherName}
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => deleteSub.mutate({ id: sub.id, date: dateStr })}
                    disabled={deleteSub.isPending}
                    data-testid={`button-delete-sub-${sub.id}`}
                  >
                    {deleteSub.isPending && deleteSub.variables?.id === sub.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}

          {substitutions.length === 0 && (
            <div className="text-sm text-muted-foreground italic py-2">
              No substitutions assigned.
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3 bg-muted/50 p-3 rounded-lg border border-border/50">
            <div className="flex-1 w-full space-y-1.5">
              <Label className="text-xs text-muted-foreground">Class</Label>
              <Input 
                placeholder="e.g. VIII A" 
                value={classInput}
                onChange={(e) => setClassInput(e.target.value)}
                className="h-9 bg-background"
                data-testid={`input-class-p${period}`}
              />
            </div>
            <div className="flex-[2] w-full space-y-1.5">
              <Label className="text-xs text-muted-foreground">Free Teacher</Label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={selectedTeacher}
                onChange={(e) => setSelectedTeacher(e.target.value)}
                disabled={isLoading}
                data-testid={`select-teacher-p${period}`}
              >
                <option value="">-- Select Teacher --</option>
                {availableTeachers.map(t => (
                  <option key={t.id} value={t.teacherName}>{t.teacherName}</option>
                ))}
              </select>
            </div>
            <Button 
              size="sm" 
              className="w-full sm:w-auto h-9"
              onClick={handleAdd}
              disabled={!classInput.trim() || !selectedTeacher || addSub.isPending}
              data-testid={`button-add-p${period}`}
            >
              {addSub.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4 mr-1" />}
              Add
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
