"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import AnimatedIcon from "@/components/ui/AnimatedIcon";

const ADMIN_ICON_PLATE_CLASS = "dark:rounded-2xl dark:bg-white p-2.5 md:p-3";

const adminOptions = [
  {
    id: "dispositivos",
    href: "/siget/admin/dispositivos",
    title: "Dispositivos",
    desc: "Autorizar o rechazar solicitudes de acceso por dispositivo.",
    iconKey: "gzqipvbr",
    accent: "text-celeste-trifinio",
    accentHover: "group-hover:text-celeste-trifinio",
    activeBorder: "border-celeste-trifinio/40",
    hoverBorder: "hover:border-celeste-trifinio/40",
    glow: "from-celeste-trifinio/10",
  },
  {
    id: "usuarios",
    href: "/siget/admin/usuarios",
    title: "Usuarios",
    desc: "Gestionar cuentas, roles y permisos del sistema.",
    iconKey: "vxfekxur",
    accent: "text-purple-600 dark:text-purple-400",
    accentHover: "group-hover:text-purple-600 dark:group-hover:text-purple-400",
    activeBorder: "border-purple-500/40",
    hoverBorder: "hover:border-purple-500/40",
    glow: "from-purple-500/10",
  },
  {
    id: "configuraciones",
    href: "/siget/admin/configuraciones",
    title: "Configuraciones",
    desc: "Ajustes generales del sistema y variables de seguridad.",
    iconKey: "plusmrxr",
    accent: "text-amber-600 dark:text-amber-400",
    accentHover: "group-hover:text-amber-600 dark:group-hover:text-amber-400",
    activeBorder: "border-amber-500/40",
    hoverBorder: "hover:border-amber-500/40",
    glow: "from-amber-500/10",
  },
] as const;

export function AdminCards({ pendingDevices }: { pendingDevices: number }) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    if (!isMobile || !activeId) return;
    const card = document.getElementById(`card-${activeId}`);
    card?.dispatchEvent(new MouseEvent("mouseenter", { bubbles: true }));
  }, [activeId, isMobile]);

  const handleCardClick = (
    event: React.MouseEvent<HTMLAnchorElement>,
    id: string,
  ) => {
    if (!isMobile) return;
    if (activeId === id) return;
    event.preventDefault();
    setActiveId(id);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 lg:gap-6">
      {adminOptions.map((opt) => {
        const showBadge = opt.id === "dispositivos" && pendingDevices > 0;
        const isActive = isMobile && activeId === opt.id;

        return (
          <div
            key={opt.href}
            id={`card-${opt.id}`}
            className={cn(
              "group relative flex flex-col overflow-hidden rounded-2xl xl:rounded-3xl border border-border/80 bg-card shadow-xl shadow-slate-200/15 dark:shadow-none transition-colors duration-300",
              opt.hoverBorder,
              isActive && opt.activeBorder,
            )}
          >
            <div
              className={cn(
                "pointer-events-none absolute inset-0 bg-linear-to-br to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100",
                isActive && "opacity-100",
                opt.glow,
              )}
            />

            <Link
              href={opt.href}
              onClick={(event) => handleCardClick(event, opt.id)}
              className="relative z-10 flex flex-1 flex-col p-4 md:p-5 gap-3 outline-none cursor-pointer"
            >
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    "flex size-20 md:size-24 shrink-0 items-center justify-center",
                    ADMIN_ICON_PLATE_CLASS,
                  )}
                >
                  <AnimatedIcon
                    iconKey={opt.iconKey}
                    target={`#card-${opt.id}`}
                    trigger="hover"
                    size="100%"
                    speed={1.5}
                    className="size-full"
                  />
                </div>

                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-base md:text-lg font-black tracking-tight text-foreground uppercase leading-tight">
                      {opt.title}
                    </h3>
                    {showBadge && (
                      <span className="inline-flex min-w-7 shrink-0 items-center justify-center rounded-full bg-amber-500 px-2 py-0.5 text-xs font-black text-white shadow-sm shadow-amber-500/30">
                        {pendingDevices}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground leading-snug">{opt.desc}</p>
                </div>
              </div>

              <div className="mt-auto flex min-h-8 items-center justify-between gap-2 border-t border-border/50 pt-3">
                <span
                  className={cn(
                    "text-xs font-black uppercase tracking-wider transition-opacity duration-300",
                    opt.accent,
                    isMobile && !isActive && "opacity-0",
                    (!isMobile || isActive) && "opacity-100",
                  )}
                >
                  {isMobile
                    ? isActive
                      ? "Click de nuevo para entrar"
                      : "\u00A0"
                    : "Click para entrar"}
                </span>
                <span
                  className={cn(
                    "flex size-8 items-center justify-center rounded-lg border border-border/60 bg-muted/50 text-muted-foreground transition-colors duration-300",
                    "group-hover:border-border/30 group-hover:bg-transparent",
                    isActive && cn("border-border/30 bg-transparent", opt.accent),
                    opt.accentHover,
                  )}
                >
                  <ArrowRight className="size-4" />
                </span>
              </div>
            </Link>
          </div>
        );
      })}
    </div>
  );
}
