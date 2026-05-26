"use client";

import { useState, useMemo } from "react";
import { AuthorizeButton } from "./AuthorizeButton";
import {
  Monitor,
  Smartphone,
  Calendar,
  Search,
  ShieldCheck,
  ShieldAlert,
  User,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface Device {
  id: string;
  user_id: string;
  device_name: string;
  friendly_name?: string | null;
  is_authorized: boolean;
  created_at: string;
}

interface UserGroup {
  user_id: string;
  name: string;
  devices: Device[];
}

export function DevicesAccordion({ groups }: { groups: UserGroup[] }) {
  const [search, setSearch] = useState("");
  const [openIds, setOpenIds] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return groups;
    return groups.filter((g) => g.name.toLowerCase().includes(q));
  }, [groups, search]);

  const toggle = (id: string) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const pendingCount = (devices: Device[]) =>
    devices.filter((d) => !d.is_authorized).length;

  return (
    <div className="w-full max-w-3xl lg:max-w-5xl mx-auto px-4 pt-4 md:pt-28 pb-10">
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre de usuario..."
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {filtered.length === 0 && (
        <div className="p-12 text-center text-muted-foreground italic text-sm">
          {search ? "Sin resultados para esa búsqueda." : "No hay registros de dispositivos."}
        </div>
      )}

      <div className="flex flex-col divide-y divide-border/25">
        {filtered.map((group) => {
          const isOpen = openIds.has(group.user_id);
          const pending = pendingCount(group.devices);

          return (
            <div
              key={group.user_id}
              className={cn(
                "overflow-hidden transition-colors duration-300 ease-out",
                isOpen && "bg-zinc-100 dark:bg-zinc-800/70",
              )}
            >
              <button
                type="button"
                onClick={() => toggle(group.user_id)}
                aria-expanded={isOpen}
                className={cn(
                  "relative flex w-full items-center gap-3 px-5 py-3.5 text-left transition-colors duration-300 cursor-pointer",
                  !isOpen && "hover:bg-muted/50 dark:hover:bg-white/5",
                )}
              >
                <span
                  className={cn(
                    "absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-celeste-trifinio transition-all duration-300 ease-out",
                    isOpen ? "opacity-100 scale-y-100" : "opacity-0 scale-y-50",
                  )}
                />
                <User className="size-6 shrink-0 text-celeste-trifinio" strokeWidth={2} aria-hidden />
                <div className="min-w-0 flex-1 pl-1">
                  <p
                    className={cn(
                      "text-xs font-black uppercase leading-tight bg-gradient-to-r from-celeste-trifinio to-celeste-trifinio bg-clip-text transition-[background-size,color] duration-500 ease-out",
                      isOpen
                        ? "bg-[length:100%_100%] text-transparent"
                        : "bg-[length:0%_100%] text-foreground",
                    )}
                  >
                    {group.name}
                  </p>
                  <p className="text-[10px] text-muted-foreground leading-snug mt-0.5">
                    {group.devices.length} dispositivo{group.devices.length !== 1 && "s"}
                    {pending > 0 && (
                      <span className="ml-2 inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-semibold">
                        · {pending} pendiente{pending !== 1 && "s"}
                      </span>
                    )}
                  </p>
                </div>
                {pending > 0 && (
                  <span className="flex shrink-0 items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-full bg-amber-500 text-[11px] font-bold text-white">
                    {pending}
                  </span>
                )}
              </button>

              <div
                className={cn(
                  "grid transition-[grid-template-rows] duration-300 ease-in-out",
                  isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
                )}
              >
                <div className="overflow-hidden">
                  <div className="flex flex-col">
                    {group.devices.map((dev) => (
                      <div
                        key={dev.id}
                        className={cn(
                          "border-t border-border/40",
                          dev.is_authorized
                            ? "bg-background/80 dark:bg-card/40"
                            : "bg-amber-500/5 dark:bg-amber-500/10",
                        )}
                      >
                        <div className="flex">
                          <div
                            className={cn(
                              "shrink-0 w-7 self-stretch relative overflow-hidden",
                              dev.is_authorized
                                ? "bg-emerald-500/10 dark:bg-emerald-500/15"
                                : "bg-amber-500/15 dark:bg-amber-500/20",
                            )}
                          >
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div
                                className="flex items-center gap-1"
                                style={{ transform: "rotate(-90deg)", whiteSpace: "nowrap" }}
                              >
                                {dev.is_authorized ? (
                                  <ShieldCheck className="size-3 text-emerald-600 dark:text-emerald-400" />
                                ) : (
                                  <ShieldAlert className="size-3 text-amber-600 dark:text-amber-400" />
                                )}
                                <span
                                  className={cn(
                                    "text-[8px] font-bold uppercase tracking-widest leading-none",
                                    dev.is_authorized
                                      ? "text-emerald-600 dark:text-emerald-400"
                                      : "text-amber-600 dark:text-amber-400",
                                  )}
                                >
                                  {dev.is_authorized ? "Autorizado" : "Pendiente"}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex-1 min-w-0 flex flex-col border-l border-border/30">
                            <div className="flex items-center justify-between px-3 py-2 border-b border-border/50">
                              <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-muted/50 dark:bg-muted/30 border border-border/50">
                                <Monitor className="size-3.5 text-muted-foreground" />
                                <Smartphone className="size-3 text-muted-foreground" />
                              </div>
                              <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                                <Calendar className="size-3 shrink-0" />
                                {format(new Date(dev.created_at), "dd/MM/yyyy HH:mm", {
                                  locale: es,
                                })}
                              </div>
                            </div>

                            <div className="px-3 py-3 border-b border-border/50">
                              <p className="text-xs font-semibold leading-snug break-words text-foreground">
                                {dev.friendly_name || dev.device_name}
                              </p>
                              {dev.friendly_name && (
                                <p className="text-[10px] text-muted-foreground break-words leading-snug mt-0.5">
                                  {dev.device_name}
                                </p>
                              )}
                            </div>

                            <AuthorizeButton id={dev.id} isAuthorized={dev.is_authorized} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
