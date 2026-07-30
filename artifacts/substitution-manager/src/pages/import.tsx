import { useState, useRef } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileSpreadsheet, UploadCloud, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import * as XLSX from "xlsx";
import { db } from "@/lib/firebase";
import { collection, writeBatch, doc, getDocs, query, limit } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function ImportTimetable() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState("");
  const [summary, setSummary] = useState<{ teachers: number; slots: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setSummary(null);
    }
  };

  const deleteCollection = async (collectionPath: string) => {
    let hasMore = true;
    while (hasMore) {
      const q = query(collection(db, collectionPath), limit(500));
      const snapshot = await getDocs(q);
      if (snapshot.size === 0) {
        hasMore = false;
        break;
      }
      const batch = writeBatch(db);
      snapshot.docs.forEach((d) => {
        batch.delete(d.ref);
      });
      await batch.commit();
    }
  };

  const processImport = async () => {
    if (!file) return;
    setLoading(true);
    setProgress("Reading Excel file...");

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" }) as any[][];

      setProgress("Deleting old timetable data...");
      await deleteCollection("timetable");
      await deleteCollection("teachers");

      setProgress("Parsing new timetable...");
      const teachersSet = new Set<string>();
      const slots: any[] = [];

      for (let r = 3; r < rows.length; r++) {
        const row = rows[r];
        const teacherName = String(row[0]).trim();
        if (!teacherName) continue;

        teachersSet.add(teacherName);

        for (let d = 0; d < 6; d++) {
          const dayName = DAYS[d];
          for (let p = 0; p < 8; p++) {
            const periodNum = p + 1;
            const colIndex = 1 + d * 8 + p;
            const slotValue = String(row[colIndex] || "").trim();
            const isFree = slotValue === "";

            slots.push({
              teacherName,
              day: dayName,
              period: periodNum,
              slotValue,
              isFree
            });
          }
        }
      }

      setProgress(`Writing ${teachersSet.size} teachers and ${slots.length} slots to database...`);
      
      // Batch write teachers
      const teachers = Array.from(teachersSet);
      let currentBatch = writeBatch(db);
      let opCount = 0;

      for (const t of teachers) {
        const docRef = doc(collection(db, "teachers"));
        currentBatch.set(docRef, { name: t });
        opCount++;
        if (opCount === 500) {
          await currentBatch.commit();
          currentBatch = writeBatch(db);
          opCount = 0;
        }
      }

      // Batch write slots
      for (const slot of slots) {
        const docRef = doc(collection(db, "timetable"));
        currentBatch.set(docRef, slot);
        opCount++;
        if (opCount === 500) {
          await currentBatch.commit();
          currentBatch = writeBatch(db);
          opCount = 0;
        }
      }

      if (opCount > 0) {
        await currentBatch.commit();
      }

      setSummary({ teachers: teachersSet.size, slots: slots.length });
      toast({ title: "Import successful", description: "Timetable updated." });
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";

    } catch (error: any) {
      console.error(error);
      toast({ variant: "destructive", title: "Import failed", description: error.message });
    } finally {
      setLoading(false);
      setProgress("");
    }
  };

  return (
    <Layout>
      <div className="p-8 max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground">Import Timetable</h1>
          <p className="text-muted-foreground mt-2">Upload the master timetable to update teacher availability.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-primary" />
              Upload Excel File
            </CardTitle>
            <CardDescription>
              Expects an .xlsx file with specific formatting. Row 1: Days, Row 2: Periods (1-8), Col A: Teacher Name.
              Empty cells indicate a free period.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="border-2 border-dashed border-border rounded-lg p-10 flex flex-col items-center justify-center text-center bg-accent/30 hover:bg-accent/50 transition-colors">
              <UploadCloud className="w-10 h-10 text-muted-foreground mb-4" />
              <input
                type="file"
                accept=".xlsx"
                onChange={handleFileChange}
                ref={fileInputRef}
                className="hidden"
                id="file-upload"
                data-testid="input-file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <Button variant="outline" asChild>
                  <span>Select .xlsx File</span>
                </Button>
              </label>
              {file && (
                <p className="mt-4 text-sm font-medium text-foreground">
                  Selected: {file.name}
                </p>
              )}
            </div>

            {loading && (
              <div className="flex items-center gap-3 text-primary bg-primary/10 p-4 rounded-md">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="font-medium">{progress}</span>
              </div>
            )}

            {summary && !loading && (
              <div className="flex items-center gap-3 text-emerald-700 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400 p-4 rounded-md border border-emerald-200 dark:border-emerald-900">
                <CheckCircle2 className="w-5 h-5" />
                <span className="font-medium">
                  Successfully imported {summary.teachers} teachers and {summary.slots} slots.
                </span>
              </div>
            )}

            <div className="bg-muted p-4 rounded-md flex gap-3 text-sm text-muted-foreground">
              <AlertCircle className="w-5 h-5 text-muted-foreground shrink-0" />
              <p>
                <strong>Important:</strong> Importing a new timetable will erase all existing timetable data.
                Make sure the file format is exactly as specified. "Free" periods are strictly determined by empty cells.
              </p>
            </div>
          </CardContent>
          <div className="p-6 pt-0 border-t flex justify-end">
            <Button
              onClick={processImport}
              disabled={!file || loading}
              className="min-w-32"
              data-testid="button-import"
            >
              {loading ? "Importing..." : "Start Import"}
            </Button>
          </div>
        </Card>
      </div>
    </Layout>
  );
}
