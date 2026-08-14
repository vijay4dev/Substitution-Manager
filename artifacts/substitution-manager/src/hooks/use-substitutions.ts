import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, serverTimestamp, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface Substitution {
  id: string;
  date: string; // YYYY-MM-DD
  day: string;
  period: number;
  class: string;
  teacherName: string;
  absentTeacherName?: string;
  createdAt: any;
}

export function useSubstitutionsByDate(date: string) {
  return useQuery({
    queryKey: ["substitutions", "date", date],
    queryFn: async () => {
      const q = query(
        collection(db, "substitutions"),
        where("date", "==", date)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Substitution[];
    },
    enabled: !!date,
  });
}

export function useSubstitutionsByDateRange(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ["substitutions", "range", startDate, endDate],
    queryFn: async () => {
      // Since we only have equality on date, or range, we can use where date >= start and date <= end
      const q = query(
        collection(db, "substitutions"),
        where("date", ">=", startDate),
        where("date", "<=", endDate)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Substitution[];
    },
    enabled: !!startDate && !!endDate,
  });
}

export function useAddSubstitution() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<Substitution, "id" | "createdAt">) => {
      const docRef = await addDoc(collection(db, "substitutions"), {
        ...data,
        createdAt: serverTimestamp(),
      });
      return { id: docRef.id, ...data };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["substitutions", "date", data.date] });
    },
  });
}

export function useDeleteSubstitution() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, date }: { id: string; date: string }) => {
      await deleteDoc(doc(db, "substitutions", id));
      return { id, date };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["substitutions", "date", data.date] });
    },
  });
}
