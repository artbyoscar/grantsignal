"use client";

import { FileText, Table, Presentation } from "lucide-react";
import { toast } from "sonner";

export function ExportButtons() {
  const handleExport = (format: string) => {
    toast.info(`${format} export coming soon`);
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => handleExport("PDF")}
        className="inline-flex items-center justify-center w-8 h-8 bg-slate-700 border border-slate-600 rounded-md text-slate-400 hover:text-slate-100 hover:bg-slate-600 transition"
        title="Export as PDF"
      >
        <FileText className="h-4 w-4" />
      </button>

      <button
        onClick={() => handleExport("Excel")}
        className="inline-flex items-center justify-center w-8 h-8 bg-slate-700 border border-slate-600 rounded-md text-slate-400 hover:text-slate-100 hover:bg-slate-600 transition"
        title="Export as Excel"
      >
        <Table className="h-4 w-4" />
      </button>

      <button
        onClick={() => handleExport("PowerPoint")}
        className="inline-flex items-center justify-center w-8 h-8 bg-slate-700 border border-slate-600 rounded-md text-slate-400 hover:text-slate-100 hover:bg-slate-600 transition"
        title="Export as PowerPoint"
      >
        <Presentation className="h-4 w-4" />
      </button>
    </div>
  );
}
