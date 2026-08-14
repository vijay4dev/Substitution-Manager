import { useSubstitutionsByDate } from "@/hooks/use-substitutions";
import { format, parseISO } from "date-fns";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Printer, ArrowLeft, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

export default function PrintView() {
  const [, setLocation] = useLocation();
  const [dateStr, setDateStr] = useState<string>("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const dateParam = params.get("date");
    if (dateParam) {
      setDateStr(dateParam);
    } else {
      setDateStr(format(new Date(), "yyyy-MM-dd"));
    }
  }, []);

  const { data: substitutions = [], isLoading } = useSubstitutionsByDate(dateStr);

  if (!dateStr || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const selectedDate = parseISO(dateStr);
  const formattedDate = format(selectedDate, "EEEE, dd MMMM yyyy");

  // Sort substitutions by period
  const sortedSubs = [...substitutions].sort((a, b) => a.period - b.period);

  return (
    <div className="min-h-screen bg-white text-black font-serif">
      {/* Non-printable controls */}
      <div className="print:hidden bg-muted p-4 border-b flex justify-between items-center shadow-sm">
        <Button variant="outline" onClick={() => setLocation("/absent-teacher")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Assignments
        </Button>
        <Button onClick={() => window.print()}>
          <Printer className="w-4 h-4 mr-2" />
          Print Page
        </Button>
      </div>

      {/* Printable Area */}
      <div className="max-w-4xl mx-auto p-8 print:p-0">
        <div className="text-center mb-8">
          <h1 className="text-2xl md:text-4xl font-bold uppercase tracking-wide mb-2">
            Kawar International School, Pali
          </h1>
          <h2 className="text-xl md:text-2xl text-gray-800">
            {formattedDate}
          </h2>
        </div>

        {sortedSubs.length === 0 ? (
          <div className="text-center py-12 text-gray-500 italic">
            No substitutions recorded for this date.
          </div>
        ) : (
          <table className="w-full border-collapse border border-black text-left font-sans">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-black p-3 w-16 text-center">Pr.</th>
                <th className="border border-black p-3 w-32">Class</th>
                <th className="border border-black p-3">Substitution</th>
                <th className="border border-black p-3 w-32 text-center">Sign.</th>
              </tr>
            </thead>
            <tbody>
              {sortedSubs.map((sub, idx) => (
                <tr key={sub.id} className="print:break-inside-avoid">
                  <td className="border border-black p-3 text-center font-bold text-lg">
                    {sub.period}
                  </td>
                  <td className="border border-black p-3 font-medium">
                    {sub.class}
                  </td>
                  <td className="border border-black p-3">
                    {sub.teacherName}
                  </td>
                  <td className="border border-black p-3">
                    {/* Empty cell for signature */}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 20mm; }
          body { background: white; }
        }
      `}</style>
    </div>
  );
}
