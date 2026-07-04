"use client";

import { useEffect, useRef, useState } from "react";
import { Download, FileText, Image as ImageIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type ExportOption = {
  id: string;
  label: string;
  description: string;
  icon: typeof FileText;
  iconClass: string;
  onSelect: () => void | Promise<void>;
};

export function OrganigramaExportMenu({
  options,
  disabled = false,
}: {
  options: ExportOption[];
  disabled?: boolean;
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

  const handleSelect = async (opt: ExportOption) => {
    if (busyId) return;
    setBusyId(opt.id);
    try {
      await opt.onSelect();
    } finally {
      setBusyId(null);
      setOpen(false);
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        disabled={disabled || busyId !== null}
        aria-haspopup="menu"
        aria-expanded={open}
        className={cn(
          "flex cursor-pointer items-center gap-1.5 rounded-xl border border-celeste-trifinio/40 bg-card px-2.5 py-2 text-[10px] font-bold uppercase tracking-wide text-celeste-trifinio transition-colors hover:bg-celeste-trifinio/10 md:px-3 md:text-xs",
          (disabled || busyId !== null) && "cursor-not-allowed opacity-60",
        )}
      >
        {busyId ? (
          <Loader2 className="size-4 shrink-0 animate-spin" />
        ) : (
          <Download className="size-4 shrink-0" />
        )}
        <span>{busyId ? "Generando..." : "Exportar"}</span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-[120] mt-2 w-56 overflow-hidden rounded-2xl border border-border/60 bg-zinc-100 shadow-xl dark:bg-zinc-800"
        >
          <div className="border-b border-border/50 px-3 py-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              Formato
            </p>
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
                    className="flex w-full cursor-pointer items-start gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-celeste-trifinio/10 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <span
                      className={cn(
                        "flex size-8 shrink-0 items-center justify-center rounded-lg bg-card",
                        opt.iconClass,
                      )}
                    >
                      {loading ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Icon className="size-4" />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-xs font-bold text-foreground">
                        {opt.label}
                      </span>
                      <span className="mt-0.5 block text-[11px] leading-snug text-muted-foreground">
                        {opt.description}
                      </span>
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

export const organigramaExportIcons = {
  pdf: FileText,
  image: ImageIcon,
};
