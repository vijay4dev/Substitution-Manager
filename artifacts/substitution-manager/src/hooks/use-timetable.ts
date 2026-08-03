import { useQuery } from "@tanstack/react-query";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

export function useTeachers() {
  return useQuery({
    queryKey: ["teachers"],
    queryFn: async () => {
      const snapshot = await getDocs(collection(db, "teachers"));
      return snapshot.docs
        .map(doc => (doc.data() as { name: string }).name)
        .sort((a, b) => a.localeCompare(b));
    },
  });
}

export function useTeacherSchedule(teacherName: string, day: string) {
  return useQuery({
    queryKey: ["timetable", "teacher", teacherName, day],
    queryFn: async () => {
      const q = query(
        collection(db, "timetable"),
        where("teacherName", "==", teacherName),
        where("day", "==", day),
        where("isFree", "==", false)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }) as TimetableSlot)
        .sort((a, b) => a.period - b.period);
    },
    enabled: !!teacherName && !!day,
  });
}

export interface TimetableSlot {
  id: string;
  teacherName: string;
  day: string;
  period: number;
  slotValue: string;
  isFree: boolean;
}

export function useFreeTeachers(day: string, period: number) {
  return useQuery({
    queryKey: ["timetable", "free", day, period],
    queryFn: async () => {
      const q = query(
        collection(db, "timetable"),
        where("day", "==", day),
        where("period", "==", period),
        where("isFree", "==", true)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as TimetableSlot[];
    },
    enabled: !!day && !!period,
  });
}
