import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { format, parseISO, getDay } from "date-fns";
import { useTeachers, useTeacherSchedule, useFreeTeachers } from "@/hooks/use-timetable";
import { useSubstitutionsByDate, useAddSubstitution, useDeleteSubstitution, Substitution } from "@/hooks/use-substitutions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Loader2, UserX, CheckCircle2, Plus, AlertTriangle, X, Printer, BookOpen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DIARY_PERIOD = 9;

export default function AbsentTeacher() {
  const [dateStr, setDateStr] = useState(format(new Date(), "yyyy-MM-dd"));
  const [absentTeachers, setAbsentTeachers] = useState<string[]>([]);
  const [selectingTeacher, setSelectingTeacher] = useState("");
  const [warning, setWarning] = useState<string | null>(null);
  const [, setLocation] = useLocation();

  const selectedDate = parseISO(dateStr);
  const dayIndex = getDay(selectedDate);
  const dayName = DAYS[dayIndex];
  const isSunday = dayIndex === 0;
  const isSaturday = dayIndex === 6;

  const { data: teachers = [], isLoading: teachersLoading } = useTeachers();
  const { data: substitutions = [], isLoading: subsLoading } = useSubstitutionsByDate(dateStr);

  const availableToAdd = teachers.filter(t => !absentTeachers.includes(t));

  const handleAddTeacher = () => {
    if (!selectingTeacher) return;
    const alreadySubstituting = substitutions.some(s => s.teacherName === selectingTeacher);
    if (alreadySubstituting) {
      const periods = substitutions
        .filter(s => s.teacherName === selectingTeacher)
        .map(s => `Period ${s.period}`)
        .join(", ");
      setWarning(
        `${selectingTeacher} is already assigned as a substitute today (${periods}). Adding them as absent may cause a conflict.`
      );
    } else {
      setWarning(null);
    }
    setAbsentTeachers(prev => [...prev, selectingTeacher]);
    setSelectingTeacher("");
  };

  const handleRemoveTeacher = (name: string) => {
    setAbsentTeachers(prev => prev.filter(t => t !== name));
    if (absentTeachers.length === 1) setWarning(null);
  };

  const handleDateChange = (newDate: string) => {
    setDateStr(newDate);
    setAbsentTeachers([]);
    setSelectingTeacher("");
    setWarning(null);
  };

  return (
    <Layout>
      <div className="p-8 max-w-4xl mx-auto space-y-6">

        {/* Header card */}
        <div className="bg-card p-6 rounded-xl border shadow-sm space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-serif font-bold text-foreground">Absent Teacher</h1>
              <p className="text-muted-foreground mt-1 text-sm">
                Add absent teachers, select which periods they are unavailable, then assign substitutes
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => setLocation(`/print?date=${dateStr}`)}
              disabled={substitutions.length === 0}
              data-testid="button-print-absent"
            >
              <Printer className="w-4 h-4 mr-2" />
              Print
            </Button>
          </div>

          {/* Date + Add teacher row */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex items-center gap-2 shrink-0">
              <Label htmlFor="date-picker" className="text-muted-foreground shrink-0">Date:</Label>
              <Input
                id="date-picker"
                type="date"
                value={dateStr}
                onChange={(e) => handleDateChange(e.target.value)}
                className="w-auto bg-background"
                data-testid="input-date-absent"
              />
            </div>

            <div className="flex items-center gap-2 flex-1">
              <Label className="text-muted-foreground shrink-0">Add Absent:</Label>
              {teachersLoading || subsLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              ) : (
                <>
                  <Select
                    value={selectingTeacher}
                    onValueChange={setSelectingTeacher}
                    disabled={isSunday}
                  >
                    <SelectTrigger className="flex-1 bg-background" data-testid="trigger-add-absent">
                      <SelectValue placeholder="Select a teacher…" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableToAdd.map((name) => (
                        <SelectItem key={name} value={name} data-testid={`option-absent-${name}`}>
                          {name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={handleAddTeacher}
                    disabled={!selectingTeacher || isSunday}
                    data-testid="button-add-absent"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Absent teacher chips */}
          {absentTeachers.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {absentTeachers.map(name => (
                <span
                  key={name}
                  className="inline-flex items-center gap-1.5 bg-red-50 border border-red-200 text-red-800 text-sm font-medium px-3 py-1 rounded-full"
                  data-testid={`chip-absent-${name}`}
                >
                  <UserX className="w-3.5 h-3.5" />
                  {name}
                  <button
                    onClick={() => handleRemoveTeacher(name)}
                    className="ml-1 hover:text-red-900"
                    data-testid={`button-remove-absent-${name}`}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
              <span className="text-xs text-muted-foreground self-center">
                {absentTeachers.length} absent · {dayName}{isSaturday ? " (Half day)" : ""}
              </span>
            </div>
          )}
        </div>

        {/* Conflict warning */}
        {warning && (
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl text-sm" data-testid="warning-conflict">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Conflict Warning</p>
              <p className="mt-0.5">{warning}</p>
              <p className="mt-1 text-xs text-amber-600">You can still proceed, but review the assignments carefully.</p>
            </div>
            <button onClick={() => setWarning(null)} className="ml-auto shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Sunday warning */}
        {isSunday && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 p-5 rounded-xl text-sm">
            No school on Sunday. Please select a weekday.
          </div>
        )}

        {/* Empty state */}
        {!isSunday && absentTeachers.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
            <UserX className="w-10 h-10 opacity-30" />
            <p className="text-sm">Add one or more absent teachers above to begin</p>
          </div>
        )}

        {/* One section per absent teacher */}
        {!isSunday && absentTeachers.map((teacherName, idx) => (
          <TeacherSection
            key={teacherName}
            teacherName={teacherName}
            dayName={dayName}
            dateStr={dateStr}
            isSaturday={isSaturday}
            substitutions={substitutions}
            index={idx + 1}
            total={absentTeachers.length}
            allTeachers={teachers}
          />
        ))}
      </div>
    </Layout>
  );
}

// ─── Per-teacher section ──────────────────────────────────────────────────────

interface TeacherSectionProps {
  teacherName: string;
  dayName: string;
  dateStr: string;
  isSaturday: boolean;
  substitutions: Substitution[];
  index: number;
  total: number;
  allTeachers: string[];
}

function TeacherSection({ teacherName, dayName, dateStr, isSaturday, substitutions, index, total, allTeachers }: TeacherSectionProps) {
  const maxPeriods = isSaturday ? 4 : 8;
  const periodOptions = Array.from({ length: maxPeriods }, (_, i) => i + 1);

  const { data: schedule = [], isLoading: scheduleLoading } = useTeacherSchedule(teacherName, dayName);

  const [fromPeriod, setFromPeriod] = useState<number>(1);
  const [toPeriod, setToPeriod] = useState<number>(maxPeriods);
  const [initialised, setInitialised] = useState(false);

  // Auto-set range from the teacher's timetable once loaded
  useEffect(() => {
    if (!scheduleLoading && !initialised) {
      const periods = schedule
        .filter(s => s.period <= maxPeriods)
        .map(s => s.period);
      if (periods.length > 0) {
        setFromPeriod(Math.min(...periods));
        setToPeriod(Math.max(...periods));
      }
      setInitialised(true);
    }
  }, [scheduleLoading, schedule, maxPeriods, initialised]);

  // Clamp: "to" can't be less than "from"
  const handleFromChange = (val: number) => {
    setFromPeriod(val);
    if (val > toPeriod) setToPeriod(val);
  };
  const handleToChange = (val: number) => {
    setToPeriod(val);
    if (val < fromPeriod) setFromPeriod(val);
  };

  const selectedPeriods = Array.from(
    { length: toPeriod - fromPeriod + 1 },
    (_, i) => fromPeriod + i
  );

  return (
    <div className="space-y-4" data-testid={`section-teacher-${teacherName}`}>
      {/* Section header */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-7 h-7 rounded-full bg-primary text-primary-foreground text-xs font-bold shrink-0">
          {index}
        </div>
        <h2 className="text-lg font-serif font-semibold text-foreground">{teacherName}</h2>
        <span className="text-xs text-muted-foreground">{dayName}{isSaturday ? " · Periods 1–4 only" : ""}</span>
        {total > 1 && <div className="flex-1 border-t border-dashed border-border" />}
      </div>

      {/* Range selector */}
      <div className="bg-muted/30 border rounded-xl p-4">
        <p className="text-sm font-medium text-foreground mb-3">
          Absent for periods:
        </p>
        {scheduleLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading timetable…
          </div>
        ) : (
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Label className="text-muted-foreground text-sm shrink-0">From</Label>
              <Select value={String(fromPeriod)} onValueChange={v => handleFromChange(Number(v))}>
                <SelectTrigger className="w-24 bg-background" data-testid={`select-from-${teacherName}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {periodOptions.map(p => (
                    <SelectItem key={p} value={String(p)}>Period {p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Label className="text-muted-foreground text-sm shrink-0">To</Label>
              <Select value={String(toPeriod)} onValueChange={v => handleToChange(Number(v))}>
                <SelectTrigger className="w-24 bg-background" data-testid={`select-to-${teacherName}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {periodOptions.map(p => (
                    <SelectItem key={p} value={String(p)}>Period {p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <span className="text-sm text-muted-foreground">
              → Periods {fromPeriod}{fromPeriod === toPeriod ? "" : `–${toPeriod}`}
              <span className="ml-1 text-xs">({selectedPeriods.length} period{selectedPeriods.length !== 1 ? "s" : ""})</span>
            </span>
          </div>
        )}
      </div>

      {/* Slot cards for selected range + diary */}
      {initialised && (
        <div className="space-y-3 pl-10">
          {selectedPeriods.map((p) => {
            const slot = schedule.find(s => s.period === p);
            return (
              <SlotCard
                key={p}
                period={p}
                classInfo={slot?.slotValue ?? ""}
                dayName={dayName}
                dateStr={dateStr}
                substitutions={substitutions}
              />
            );
          })}

          {/* Diary period — always appended */}
          <DiaryCard
            dateStr={dateStr}
            dayName={dayName}
            substitutions={substitutions}
            allTeachers={allTeachers}
          />
        </div>
      )}
    </div>
  );
}

// ─── Slot card (regular period) ───────────────────────────────────────────────

interface SlotCardProps {
  period: number;
  classInfo: string;
  dayName: string;
  dateStr: string;
  substitutions: Substitution[];
}

function SlotCard({ period, classInfo, dayName, dateStr, substitutions }: SlotCardProps) {
  const [selectedTeacher, setSelectedTeacher] = useState("");
  const { toast } = useToast();

  const addMutation = useAddSubstitution();
  const deleteMutation = useDeleteSubstitution();

  const { data: freeTeachers = [], isLoading: freeLoading } = useFreeTeachers(dayName, period);

  // Saved substitutions for this exact period + class
  const assignedHere = substitutions.filter(
    s => s.period === period && s.class === (classInfo || `Period ${period}`)
  );

  // Prevent double-booking any teacher in this period
  const usedThisPeriod = substitutions
    .filter(s => s.period === period)
    .map(s => s.teacherName);

  const availableTeachers = freeTeachers.filter(t => !usedThisPeriod.includes(t.teacherName));

  const handleAssign = async () => {
    if (!selectedTeacher) return;
    try {
      await addMutation.mutateAsync({
        date: dateStr,
        day: dayName,
        period,
        class: classInfo || `Period ${period}`,
        teacherName: selectedTeacher,
      });
      setSelectedTeacher("");
      toast({ title: "Assigned", description: `${selectedTeacher} → Period ${period}${classInfo ? ` (${classInfo})` : ""}` });
    } catch {
      toast({ title: "Error", description: "Failed to assign substitution", variant: "destructive" });
    }
  };

  const handleDelete = async (sub: Substitution) => {
    try {
      await deleteMutation.mutateAsync({ id: sub.id, date: sub.date });
      toast({ title: "Removed", description: "Substitution removed" });
    } catch {
      toast({ title: "Error", description: "Failed to remove", variant: "destructive" });
    }
  };

  return (
    <Card className="border shadow-sm" data-testid={`card-slot-${period}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-4xl font-serif font-bold text-primary">{period}</span>
            <div>
              <p className="text-xs text-muted-foreground font-normal uppercase tracking-wide">Period</p>
              {classInfo ? (
                <>
                  <p className="text-lg font-semibold text-foreground">{classInfo}</p>
                  <p className="text-xs text-muted-foreground font-normal">Class to be covered</p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground font-normal italic">No class in timetable</p>
              )}
            </div>
          </div>
          {assignedHere.length > 0 && (
            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
              {assignedHere.length} assigned
            </span>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-3">
        {assignedHere.map((sub) => (
          <div
            key={sub.id}
            className="flex items-center justify-between bg-green-50 border border-green-200 rounded-md px-3 py-2 text-sm"
            data-testid={`row-sub-${sub.id}`}
          >
            <span className="font-medium text-green-800">{sub.teacherName}</span>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50"
              onClick={() => handleDelete(sub)}
              disabled={deleteMutation.isPending}
              data-testid={`button-delete-${sub.id}`}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ))}

        <div className="flex gap-2 items-center">
          {freeLoading ? (
            <span className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="w-3 h-3 animate-spin" /> Loading free teachers…
            </span>
          ) : (
            <>
              <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
                <SelectTrigger className="flex-1 bg-background text-sm" data-testid={`trigger-sub-p${period}`}>
                  <SelectValue placeholder={availableTeachers.length === 0 ? "No free teachers" : "Select substitute…"} />
                </SelectTrigger>
                <SelectContent>
                  {availableTeachers.map((t) => (
                    <SelectItem key={t.id} value={t.teacherName}>
                      {t.teacherName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                size="sm"
                onClick={handleAssign}
                disabled={!selectedTeacher || addMutation.isPending}
                data-testid={`button-assign-p${period}`}
              >
                {addMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Assign"}
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Diary period card ────────────────────────────────────────────────────────

interface DiaryCardProps {
  dateStr: string;
  dayName: string;
  substitutions: Substitution[];
  allTeachers: string[];
}

function DiaryCard({ dateStr, dayName, substitutions, allTeachers }: DiaryCardProps) {
  const [selectedTeacher, setSelectedTeacher] = useState("");
  const { toast } = useToast();

  const addMutation = useAddSubstitution();
  const deleteMutation = useDeleteSubstitution();

  // Diary uses period = 9 in Firestore
  const assignedHere = substitutions.filter(s => s.period === DIARY_PERIOD && s.class === "Diary");
  const usedDiary = assignedHere.map(s => s.teacherName);
  const availableTeachers = allTeachers.filter(t => !usedDiary.includes(t));

  const handleAssign = async () => {
    if (!selectedTeacher) return;
    try {
      await addMutation.mutateAsync({
        date: dateStr,
        day: dayName,
        period: DIARY_PERIOD,
        class: "Diary",
        teacherName: selectedTeacher,
      });
      setSelectedTeacher("");
      toast({ title: "Assigned", description: `${selectedTeacher} → Diary Period` });
    } catch {
      toast({ title: "Error", description: "Failed to assign", variant: "destructive" });
    }
  };

  const handleDelete = async (sub: Substitution) => {
    try {
      await deleteMutation.mutateAsync({ id: sub.id, date: sub.date });
      toast({ title: "Removed", description: "Diary assignment removed" });
    } catch {
      toast({ title: "Error", description: "Failed to remove", variant: "destructive" });
    }
  };

  return (
    <Card className="border border-dashed border-primary/40 shadow-sm bg-primary/[0.02]" data-testid="card-diary">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <BookOpen className="w-8 h-8 text-primary/60" />
            <div>
              <p className="text-lg font-semibold text-foreground">Diary Period</p>
              <p className="text-xs text-muted-foreground font-normal">10 minutes · Auto-added</p>
            </div>
          </div>
          {assignedHere.length > 0 && (
            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
              {assignedHere.length} assigned
            </span>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-3">
        {assignedHere.map((sub) => (
          <div
            key={sub.id}
            className="flex items-center justify-between bg-green-50 border border-green-200 rounded-md px-3 py-2 text-sm"
            data-testid={`row-diary-sub-${sub.id}`}
          >
            <span className="font-medium text-green-800">{sub.teacherName}</span>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50"
              onClick={() => handleDelete(sub)}
              disabled={deleteMutation.isPending}
              data-testid={`button-delete-diary-${sub.id}`}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ))}

        <div className="flex gap-2 items-center">
          <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
            <SelectTrigger className="flex-1 bg-background text-sm" data-testid="trigger-diary">
              <SelectValue placeholder="Select diary supervisor…" />
            </SelectTrigger>
            <SelectContent>
              {availableTeachers.map((name) => (
                <SelectItem key={name} value={name}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            size="sm"
            onClick={handleAssign}
            disabled={!selectedTeacher || addMutation.isPending}
            data-testid="button-assign-diary"
          >
            {addMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Assign"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
