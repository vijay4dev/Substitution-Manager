import { useQuery } from "@tanstack/react-query";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

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
