"use client";

import { useEffect, useRef, useState } from "react";
import { Download, FileSpreadsheet, FileText, Image as ImageIcon, Loader2 } from "lucide-react";

export type DownloadMenuOption = {
  id: string;
  label: string;
  description?: string;
  icon: typeof FileSpreadsheet;
  iconClass?: string;
  onSelect: () => void | Promise<void>;
};

export function DownloadMenu({
  options,
  label = "Descargar",
  align = "right",
  size = "md",
}: {
  options: DownloadMenuOption[];
  label?: string;
  align?: "left" | "right";
  size?: "md" | "sm";
}) {
  const [open, setOpen] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("mousedown", onClick);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onClick);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const handleSelect = async (opt: DownloadMenuOption) => {
    if (busyId) return;
    setBusyId(opt.id);
    try {
      await opt.onSelect();
    } catch (err) {
      console.error(err);
      const msg = err instanceof Error ? err.message : "No se pudo completar la descarga";
      window.alert(msg);
    } finally {
      setBusyId(null);
      setOpen(false);
    }
  };

  const triggerClasses =
    size === "sm"
      ? "px-3 py-2 text-[11px] gap-1.5"
      : "px-4 py-2.5 text-xs gap-2";

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={busyId !== null}
        className={`inline-flex items-center ${triggerClasses} rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-sm transition-colors cursor-pointer shrink-0 disabled:opacity-60 disabled:cursor-wait`}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {busyId ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Download className="w-4 h-4" />
        )}
        {busyId ? "Generando..." : label}
      </button>

      {open && (
        <div
          role="menu"
          className={`absolute z-50 mt-2 w-64 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl overflow-hidden ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Formato</p>
          </div>
          <ul className="py-1">
            {options.map((opt) => {
              const Icon = opt.icon;
              const loading = busyId === opt.id;
              return (
                <li key={opt.id}>
                  <button
                    type="button"
                    role="menuitem"
                    disabled={busyId !== null}
                    onClick={() => handleSelect(opt)}
                    className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-wait"
                  >
                    <span
                      className={`shrink-0 w-9 h-9 rounded-lg flex items-center justify-center bg-slate-100 dark:bg-slate-800 ${
                        opt.iconClass ?? "text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      {loading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Icon className="w-4 h-4" />
                      )}
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                        {opt.label}
                      </span>
                      {opt.description && (
                        <span className="block text-[11px] text-slate-500 mt-0.5 leading-snug">
                          {opt.description}
                        </span>
                      )}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

export const downloadIcons = {
  excel: FileSpreadsheet,
  pdf: FileText,
  image: ImageIcon,
};
