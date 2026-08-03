import { useState } from "react";
import { Layout } from "@/components/Layout";
import { format, parseISO, getDay } from "date-fns";
import { useTeachers, useTeacherSchedule, useFreeTeachers, TimetableSlot } from "@/hooks/use-timetable";
import { useSubstitutionsByDate, useAddSubstitution, useDeleteSubstitution, Substitution } from "@/hooks/use-substitutions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Loader2, UserX, CheckCircle2, Plus, AlertTriangle, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function AbsentTeacher() {
  const [dateStr, setDateStr] = useState(format(new Date(), "yyyy-MM-dd"));
  const [absentTeachers, setAbsentTeachers] = useState<string[]>([]);
  const [selectingTeacher, setSelectingTeacher] = useState("");
  const [warning, setWarning] = useState<string | null>(null);

  const selectedDate = parseISO(dateStr);
  const dayIndex = getDay(selectedDate);
  const dayName = DAYS[dayIndex];
  const isSunday = dayIndex === 0;
  const isSaturday = dayIndex === 6;

  const { data: teachers = [], isLoading: teachersLoading } = useTeachers();
  const { data: substitutions = [], isLoading: subsLoading } = useSubstitutionsByDate(dateStr);

  // Teachers already in the absent list or with no teaching on this day are excluded from the add dropdown
  const availableToAdd = teachers.filter(t => !absentTeachers.includes(t));

  const handleAddTeacher = () => {
    if (!selectingTeacher) return;

    // Check if this teacher is already assigned as a substitute today
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

  // When date changes, reset the list
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
          <div>
            <h1 className="text-3xl font-serif font-bold text-foreground">Absent Teacher</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Add all absent teachers for the day and assign substitutes for their periods
            </p>
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

          {/* Absent teachers chips */}
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
              <p className="mt-1 text-xs text-amber-600">You can still proceed, but review the substitution assignments carefully.</p>
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
}

function TeacherSection({ teacherName, dayName, dateStr, isSaturday, substitutions, index, total }: TeacherSectionProps) {
  const { data: schedule = [], isLoading: scheduleLoading } = useTeacherSchedule(teacherName, dayName);
  const filteredSchedule = isSaturday ? schedule.filter(s => s.period <= 4) : schedule;

  return (
    <div className="space-y-3" data-testid={`section-teacher-${teacherName}`}>
      {/* Section header */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-7 h-7 rounded-full bg-primary text-primary-foreground text-xs font-bold shrink-0">
          {index}
        </div>
        <h2 className="text-lg font-serif font-semibold text-foreground">{teacherName}</h2>
        <span className="text-xs text-muted-foreground">{dayName}{isSaturday ? " · Periods 1–4 only" : ""}</span>
        {total > 1 && <div className="flex-1 border-t border-dashed border-border" />}
      </div>

      {scheduleLoading ? (
        <div className="flex items-center gap-2 p-6 text-muted-foreground text-sm">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading schedule…
        </div>
      ) : filteredSchedule.length === 0 ? (
        <div className="bg-muted/30 border rounded-xl p-6 text-center text-muted-foreground text-sm">
          <CheckCircle2 className="w-7 h-7 mx-auto mb-2 opacity-30" />
          <p>{teacherName} has no teaching periods on {dayName}.</p>
          <p className="mt-1 text-xs">No substitutions needed.</p>
        </div>
      ) : (
        <div className="space-y-3 pl-10">
          {filteredSchedule.map((slot) => (
            <SlotCard
              key={slot.id}
              slot={slot}
              dayName={dayName}
              dateStr={dateStr}
              substitutions={substitutions}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Per-slot card ────────────────────────────────────────────────────────────

interface SlotCardProps {
  slot: TimetableSlot;
  dayName: string;
  dateStr: string;
  substitutions: Substitution[];
}

function SlotCard({ slot, dayName, dateStr, substitutions }: SlotCardProps) {
  const [selectedTeacher, setSelectedTeacher] = useState("");
  const { toast } = useToast();

  const addMutation = useAddSubstitution();
  const deleteMutation = useDeleteSubstitution();

  const { data: freeTeachers = [], isLoading: freeLoading } = useFreeTeachers(dayName, slot.period);

  // Substitutions already saved for this period + class
  const assignedHere = substitutions.filter(
    s => s.period === slot.period && s.class === slot.slotValue
  );

  // All teachers already used this period (any class) — prevent double-booking
  const usedThisPeriod = substitutions
    .filter(s => s.period === slot.period)
    .map(s => s.teacherName);

  const availableTeachers = freeTeachers.filter(t => !usedThisPeriod.includes(t.teacherName));

  const handleAssign = async () => {
    if (!selectedTeacher) return;
    try {
      await addMutation.mutateAsync({
        date: dateStr,
        day: dayName,
        period: slot.period,
        class: slot.slotValue,
        teacherName: selectedTeacher,
      });
      setSelectedTeacher("");
      toast({ title: "Assigned", description: `${selectedTeacher} → Period ${slot.period} (${slot.slotValue})` });
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
    <Card className="border shadow-sm" data-testid={`card-slot-${slot.period}-${slot.slotValue}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-4xl font-serif font-bold text-primary">{slot.period}</span>
            <div>
              <p className="text-xs text-muted-foreground font-normal uppercase tracking-wide">Period</p>
              <p className="text-lg font-semibold text-foreground">{slot.slotValue}</p>
              <p className="text-xs text-muted-foreground font-normal">Class to be covered</p>
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
                <SelectTrigger className="flex-1 bg-background text-sm" data-testid={`trigger-sub-p${slot.period}`}>
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
                data-testid={`button-assign-p${slot.period}`}
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
