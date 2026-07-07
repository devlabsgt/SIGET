"use client";

import { useEffect, useState, type MouseEvent } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import AnimatedIcon from "@/components/ui/AnimatedIcon";
import { MagicCard } from "@/components/ui/magic-card";
import { getVisibleAdminOptions } from "@/components/(base)/dashboard/modules";

const ADMIN_ICON_PLATE_CLASS = "dark:rounded-2xl dark:bg-white";

const adminOptions = [
  {
    id: "organizacion-administrativa",
    href: "/siget/admin/organizacion-administrativa",
    title: "Organización Administrativa",
    desc: "Estructura jerárquica institucional.",
    tag: "Estructura administrativa",
    iconKey: "giblkgwf",
    gradientFrom: "#059669",
    gradientTo: "#34d399",
    accent: "text-emerald-600 dark:text-emerald-400",
    accentHover:
      "group-hover:text-emerald-600 dark:group-hover:text-emerald-400",
    activeBorder: "ring-emerald-500/40",
    tagDot: "bg-emerald-500",
    bento: "md:col-span-2 xl:col-span-2 xl:row-span-2",
    size: "hero" as const,
  },
  {
    id: "dispositivos",
    href: "/siget/admin/dispositivos",
    title: "Dispositivos",
    desc: "Autorizar o rechazar solicitudes de acceso por dispositivo.",
    iconKey: "gzqipvbr",
    gradientFrom: "#0d7ab8",
    gradientTo: "#1a95d3",
    accent: "text-celeste-trifinio",
    accentHover: "group-hover:text-celeste-trifinio",
    activeBorder: "ring-celeste-trifinio/40",
    bento: "md:col-span-1 xl:col-span-1",
    size: "compact" as const,
  },
  {
    id: "usuarios",
    href: "/siget/admin/usuarios",
    title: "Usuarios",
    desc: "Gestionar cuentas, roles y permisos del sistema.",
    iconKey: "vxfekxur",
    gradientFrom: "#7e22ce",
    gradientTo: "#a855f7",
    accent: "text-purple-600 dark:text-purple-400",
    accentHover: "group-hover:text-purple-600 dark:group-hover:text-purple-400",
    activeBorder: "ring-purple-500/40",
    bento: "md:col-span-1 xl:col-span-1 xl:row-span-2",
    size: "tall" as const,
  },
  {
    id: "configuraciones",
    href: "/siget/admin/configuraciones",
    title: "Configuraciones",
    desc: "Ajustes generales del sistema y variables de seguridad.",
    iconKey: "plusmrxr",
    gradientFrom: "#b45309",
    gradientTo: "#f59e0b",
    accent: "text-amber-600 dark:text-amber-400",
    accentHover: "group-hover:text-amber-600 dark:group-hover:text-amber-400",
    activeBorder: "ring-amber-500/40",
    bento: "md:col-span-2 xl:col-span-2",
    size: "wide" as const,
  },
] as const;

const SIZE_STYLES = {
  hero: {
    icon: "size-28 md:size-32 xl:size-36",
    title: "text-lg md:text-2xl xl:text-3xl",
    desc: "text-sm md:text-base xl:text-lg",
    body: "p-5 md:p-6 xl:p-8",
    gap: "gap-5 md:gap-6 xl:gap-8",
  },
  tall: {
    icon: "size-24 md:size-28",
    title: "text-base md:text-xl",
    desc: "text-sm md:text-base",
    body: "p-5 md:p-6",
    gap: "gap-4 md:gap-5",
  },
  wide: {
    icon: "size-24 md:size-28",
    title: "text-base md:text-xl",
    desc: "text-sm md:text-base",
    body: "p-5 md:p-6",
    gap: "gap-5 md:gap-6",
  },
  compact: {
    icon: "size-20 md:size-24",
    title: "text-base md:text-lg",
    desc: "text-sm md:text-base",
    body: "p-4 md:p-5",
    gap: "gap-4 md:gap-5",
  },
} as const;

export function AdminCards({
  pendingDevices,
  role,
}: {
  pendingDevices: number;
  role: string;
}) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const visibleOptions = getVisibleAdminOptions(adminOptions, role);
  const isSoloUsuarios = visibleOptions.length === 1;

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const handleCardClick = (
    event: MouseEvent<HTMLAnchorElement>,
    id: string,
  ) => {
    if (!isMobile) return;
    if (activeId === id) return;
    event.preventDefault();
    setActiveId(id);
  };

  return (
    <div
      className={cn(
        "grid w-full grid-cols-1 gap-4 md:grid-cols-2 md:gap-5 md:auto-rows-[minmax(9.5rem,auto)] xl:grid-cols-3",
        isSoloUsuarios && "md:grid-cols-1",
      )}
    >
      {visibleOptions.map((opt, index) => {
        const showBadge = opt.id === "dispositivos" && pendingDevices > 0;
        const isActive = isMobile && activeId === opt.id;
        const tag = "tag" in opt ? opt.tag : undefined;
        const tagDot = "tagDot" in opt ? opt.tagDot : undefined;
        const styles = SIZE_STYLES[opt.size];

        return (
          <motion.div
            key={opt.href}
            id={`card-${opt.id}`}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.4,
              delay: index * 0.06,
              ease: [0.33, 1, 0.68, 1],
            }}
            className={cn(
              "group h-full w-full min-h-0",
              isSoloUsuarios ? "col-span-1" : opt.bento,
            )}
          >
            <MagicCard
              className={cn(
                "h-full w-full rounded-2xl xl:rounded-3xl border-0 shadow-sm shadow-black/5 overflow-hidden flex flex-col [--magic-inner:#f4f4f5] dark:shadow-none dark:[--magic-inner:#18181b]",
                isActive &&
                  cn(
                    "ring-2 ring-offset-2 ring-offset-background",
                    opt.activeBorder,
                  ),
              )}
              innerClassName="bg-[var(--magic-inner)]"
              gradientFrom={opt.gradientFrom}
              gradientTo={opt.gradientTo}
              gradientEndColor="var(--magic-inner)"
              borderWidth={2}
              gradientSize={280}
            >
              <Link
                href={opt.href}
                onClick={(event) => handleCardClick(event, opt.id)}
                className="relative z-10 flex h-full w-full min-h-0 flex-col outline-none"
              >
                <div
                  className={cn(
                    "flex w-full flex-1 items-center",
                    styles.body,
                    styles.gap,
                  )}
                >
                  <div
                    className={cn(
                      "flex shrink-0 items-center justify-center rounded-2xl border border-border/40 bg-background/70 p-3 shadow-sm dark:bg-zinc-800/80 dark:border-zinc-700/60",
                      ADMIN_ICON_PLATE_CLASS,
                      styles.icon,
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

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <h3
                        className={cn(
                          "font-black uppercase leading-tight tracking-tight text-foreground",
                          styles.title,
                        )}
                      >
                        {opt.title}
                      </h3>
                      {showBadge && (
                        <span className="inline-flex min-w-8 shrink-0 items-center justify-center rounded-full bg-amber-500 px-2.5 py-0.5 text-xs font-black text-white shadow-md shadow-amber-500/30">
                          {pendingDevices}
                        </span>
                      )}
                    </div>
                    <p
                      className={cn(
                        "mt-1.5 leading-snug text-muted-foreground",
                        styles.desc,
                      )}
                    >
                      {opt.desc}
                    </p>
                    {tag && tagDot && (
                      <div className="mt-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/70 md:text-xs">
                        <span
                          className={cn(
                            "size-1.5 shrink-0 rounded-full",
                            tagDot,
                          )}
                        />
                        {tag}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-auto flex w-full items-center justify-between gap-3 border-t border-border/40 px-4 py-3 dark:border-zinc-700/60 md:px-5">
                  <span
                    className={cn(
                      "text-[11px] font-black uppercase tracking-[0.18em] transition-opacity duration-300 md:text-xs",
                      opt.accent,
                      isMobile && !isActive && "opacity-0",
                      (!isMobile || isActive) && "opacity-100",
                    )}
                  >
                    {isMobile
                      ? isActive
                        ? "Toca de nuevo para entrar"
                        : "\u00A0"
                      : "Entrar al módulo"}
                  </span>
                  <span
                    className={cn(
                      "flex size-9 shrink-0 items-center justify-center rounded-xl text-muted-foreground transition-all duration-300",
                      "group-hover:scale-110",
                      isActive && cn("scale-110", opt.accent),
                      opt.accentHover,
                    )}
                  >
                    <ArrowUpRight className="size-4" />
                  </span>
                </div>
              </Link>
            </MagicCard>
          </motion.div>
        );
      })}
    </div>
  );
}
