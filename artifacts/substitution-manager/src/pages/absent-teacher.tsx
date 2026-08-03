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
import { Trash2, Loader2, UserX, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function AbsentTeacher() {
  const [dateStr, setDateStr] = useState(format(new Date(), "yyyy-MM-dd"));
  const [absentTeacher, setAbsentTeacher] = useState("");
  const { toast } = useToast();

  const selectedDate = parseISO(dateStr);
  const dayIndex = getDay(selectedDate);
  const dayName = DAYS[dayIndex];
  const isSunday = dayIndex === 0;
  const isSaturday = dayIndex === 6;

  const { data: teachers = [], isLoading: teachersLoading } = useTeachers();
  const { data: schedule = [], isLoading: scheduleLoading } = useTeacherSchedule(absentTeacher, dayName);
  const { data: substitutions = [], isLoading: subsLoading } = useSubstitutionsByDate(dateStr);

  // Only show periods 1–4 on Saturday
  const filteredSchedule = isSaturday ? schedule.filter(s => s.period <= 4) : schedule;

  return (
    <Layout>
      <div className="p-8 max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-card p-6 rounded-xl border shadow-sm space-y-4">
          <div>
            <h1 className="text-3xl font-serif font-bold text-foreground">Absent Teacher</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Select an absent teacher to see their schedule and assign substitutes
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            {/* Date picker */}
            <div className="flex items-center gap-2">
              <Label htmlFor="date-picker" className="text-muted-foreground shrink-0">Date:</Label>
              <Input
                id="date-picker"
                type="date"
                value={dateStr}
                onChange={(e) => setDateStr(e.target.value)}
                className="w-auto bg-background"
                data-testid="input-date-absent"
              />
            </div>

            {/* Teacher dropdown */}
            <div className="flex items-center gap-2 flex-1">
              <Label className="text-muted-foreground shrink-0">Absent Teacher:</Label>
              {teachersLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              ) : (
                <Select value={absentTeacher} onValueChange={setAbsentTeacher} data-testid="select-absent-teacher">
                  <SelectTrigger className="flex-1 bg-background" data-testid="trigger-absent-teacher">
                    <SelectValue placeholder="Select a teacher..." />
                  </SelectTrigger>
                  <SelectContent>
                    {teachers.map((name) => (
                      <SelectItem key={name} value={name} data-testid={`option-teacher-${name}`}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          {absentTeacher && (
            <p className="text-sm font-medium text-foreground">
              Showing schedule for <span className="text-primary">{absentTeacher}</span> on{" "}
              <span className="text-primary">{dayName}, {format(selectedDate, "dd MMM yyyy")}</span>
              {isSaturday && <span className="ml-2 text-amber-600 text-xs">(Half day — Periods 1–4 only)</span>}
            </p>
          )}
        </div>

        {/* Sunday warning */}
        {isSunday && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 p-5 rounded-xl text-sm">
            No school on Sunday. Please select a weekday.
          </div>
        )}

        {/* No teacher selected */}
        {!isSunday && !absentTeacher && (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
            <UserX className="w-10 h-10 opacity-30" />
            <p className="text-sm">Select an absent teacher above to view their schedule</p>
          </div>
        )}

        {/* Schedule loading */}
        {!isSunday && absentTeacher && (scheduleLoading || subsLoading) && (
          <div className="flex justify-center p-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}

        {/* No periods on that day */}
        {!isSunday && absentTeacher && !scheduleLoading && !subsLoading && filteredSchedule.length === 0 && (
          <div className="bg-muted/40 border rounded-xl p-8 text-center text-muted-foreground text-sm">
            <CheckCircle2 className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p>{absentTeacher} has no teaching periods on {dayName}.</p>
            <p className="mt-1 text-xs">No substitutions needed.</p>
          </div>
        )}

        {/* Schedule cards */}
        {!isSunday && absentTeacher && !scheduleLoading && !subsLoading && filteredSchedule.length > 0 && (
          <div className="space-y-4">
            {filteredSchedule.map((slot) => (
              <SlotCard
                key={slot.id}
                slot={slot}
                dayName={dayName}
                dateStr={dateStr}
                existingSubstitutions={substitutions}
                allSubstitutionsForDate={substitutions}
              />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}

interface SlotCardProps {
  slot: TimetableSlot;
  dayName: string;
  dateStr: string;
  existingSubstitutions: Substitution[];
  allSubstitutionsForDate: Substitution[];
}

function SlotCard({ slot, dayName, dateStr, existingSubstitutions, allSubstitutionsForDate }: SlotCardProps) {
  const [selectedTeacher, setSelectedTeacher] = useState("");
  const { toast } = useToast();

  const addMutation = useAddSubstitution();
  const deleteMutation = useDeleteSubstitution();

  const { data: freeTeachers = [], isLoading: freeLoading } = useFreeTeachers(dayName, slot.period);

  // Already assigned substitutions for this date+period
  const assignedHere = existingSubstitutions.filter(
    s => s.period === slot.period && s.class === slot.slotValue
  );

  // Teachers already used in this period (any class) — cannot double-book
  const usedTeacherNames = allSubstitutionsForDate
    .filter(s => s.period === slot.period)
    .map(s => s.teacherName);

  // Available = free teachers minus those already used this period
  const availableTeachers = freeTeachers.filter(t => !usedTeacherNames.includes(t.teacherName));

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
      toast({ title: "Substitution assigned", description: `${selectedTeacher} assigned for Period ${slot.period}` });
    } catch {
      toast({ title: "Error", description: "Failed to assign substitution", variant: "destructive" });
    }
  };

  const handleDelete = async (sub: Substitution) => {
    try {
      await deleteMutation.mutateAsync({ id: sub.id, date: sub.date });
      toast({ title: "Removed", description: "Substitution removed" });
    } catch {
      toast({ title: "Error", description: "Failed to remove substitution", variant: "destructive" });
    }
  };

  return (
    <Card className="border shadow-sm" data-testid={`card-period-${slot.period}`}>
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
        {/* Assigned substitutions */}
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

        {/* Assign row */}
        <div className="flex gap-2 items-center">
          {freeLoading ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="w-3 h-3 animate-spin" /> Loading free teachers…
            </div>
          ) : (
            <>
              <Select value={selectedTeacher} onValueChange={setSelectedTeacher} data-testid={`select-sub-p${slot.period}`}>
                <SelectTrigger className="flex-1 bg-background text-sm" data-testid={`trigger-sub-p${slot.period}`}>
                  <SelectValue placeholder={availableTeachers.length === 0 ? "No free teachers" : "Select substitute…"} />
                </SelectTrigger>
                <SelectContent>
                  {availableTeachers.map((t) => (
                    <SelectItem key={t.id} value={t.teacherName} data-testid={`option-sub-${t.teacherName}-p${slot.period}`}>
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
