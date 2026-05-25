"use client";

import { FileSpreadsheet } from "lucide-react";

export function ReportExcelButton({
  onClick,
  label = "Excel",
  className = "",
}: {
  onClick: () => void;
  label?: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`report-export-hide inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-wider hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors cursor-pointer shrink-0 ${className}`}
    >
      <FileSpreadsheet className="w-3.5 h-3.5" />
      {label}
    </button>
  );
}
