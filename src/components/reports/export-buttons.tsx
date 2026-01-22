"use client";

import { FileText, Table, Presentation } from "lucide-react";
import { toast } from "sonner";

export function ExportButtons() {
  const handleExport = (format: string) => {
    toast.info(`${format} export coming soon`);
  };

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => handleExport("PDF")}
        className="inline-flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-slate-400 hover:text-slate-100 hover:bg-slate-700 transition"
      >
        <FileText className="h-4 w-4" />
        <span>PDF Export</span>
      </button>

      <button
        onClick={() => handleExport("Excel")}
        className="inline-flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-slate-400 hover:text-slate-100 hover:bg-slate-700 transition"
      >
        <Table className="h-4 w-4" />
        <span>Excel Export</span>
      </button>

      <button
        onClick={() => handleExport("PowerPoint")}
        className="inline-flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-slate-400 hover:text-slate-100 hover:bg-slate-700 transition"
      >
        <Presentation className="h-4 w-4" />
        <span>PowerPoint Export</span>
      </button>
    </div>
  );
}
