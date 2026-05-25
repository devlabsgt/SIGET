"use client";

import Link from "next/link";
import {
  motion,
  useScroll,
  useTransform,
  AnimatePresence,
  useInView,
} from "framer-motion";
import { useRef, useState, useEffect, useCallback, useMemo } from "react";
import { Plus, Users, BarChart3, Building2, ExternalLink, Facebook, Youtube } from "lucide-react";
import AnimatedIcon from "@/components/ui/AnimatedIcon";
import { Skeleton } from "@/components/ui/skeleton";
import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button";
import { cn } from "@/lib/utils";
import { AuroraText } from "@/components/ui/aurora-text";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import {
  getPublicObsStats,
  type ObsPublicStats,
} from "@/app/obs-public-actions";
import { softBarColor } from "@/components/(SIGET)/observatorio/reportes/lib/chart-colors";
import { TrifinioDottedMapSection } from "@/components/(base)/(home)/TrifinioDottedMapSection";

function fmt(n: number) {
  return new Intl.NumberFormat("es-GT").format(n);
}

/* ─── count-up 0 → n (reinicia al entrar en pantalla) ─── */

function useCountUp(target: number, active: boolean, duration = 2000, runId = 0) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!active) {
      setValue(0);
      return;
    }
    if (target === 0) {
      setValue(0);
      return;
    }

    setValue(0);
    const start = performance.now();
    let frame = 0;

    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      setValue(Math.round(eased * target));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, active, duration, runId]);

  return value;
}

function playLordIcons(container: HTMLElement | null) {
  if (!container) return;
  container.querySelectorAll("lord-icon").forEach((icon) => {
    const el = icon as HTMLElement & {
      playFromBeginning?: () => void;
      play?: () => void;
    };
    el.playFromBeginning?.();
    el.play?.();
  });
}

const WHY_CARD_HOVER_TARGET = ".why-card-hover-zone";

function AnimatedNumber({
  value,
  active,
  loading,
  className,
  runId = 0,
}: {
  value: number;
  active: boolean;
  loading?: boolean;
  className?: string;
  runId?: number;
}) {
  const displayed = useCountUp(value, active && !loading, 2000, runId);
  return (
    <span className={cn("tabular-nums", className)}>
      {loading ? "—" : fmt(displayed)}
    </span>
  );
}

const MONTH_NAMES = [
  "",
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

/* ─── helpers ─── */

function SectionLabel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.p
      initial={{ opacity: 0, letterSpacing: "0.5em" }}
      whileInView={{ opacity: 1, letterSpacing: "0.25em" }}
      viewport={{ once: false, amount: 0.5 }}
      transition={{ duration: 0.8 }}
      className={cn(
        "text-[11px] font-bold uppercase tracking-[0.25em] text-celeste-trifinio",
        className,
      )}
    >
      — {children} —
    </motion.p>
  );
}

function SectionDivider() {
  return (
    <motion.div
      initial={{ scaleX: 0 }}
      whileInView={{ scaleX: 1 }}
      viewport={{ once: false, amount: 0.5 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="mx-auto mt-4 h-0.5 w-12 origin-left rounded-full bg-celeste-trifinio"
    />
  );
}

function LightSectionBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 bg-[radial-gradient(#d1d5db_1px,transparent_1px)] bg-size-[24px_24px] dark:bg-[radial-gradient(oklch(36%_0_0)_1px,transparent_1px)] opacity-60"
    />
  );
}

function DarkSectionBackground() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      <motion.div
        animate={{ scale: [1, 1.15, 1], opacity: [0.08, 0.14, 0.08] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -left-32 top-1/4 size-96 rounded-full bg-celeste-trifinio"
        style={{ filter: "blur(80px)" }}
      />
      <motion.div
        animate={{ scale: [1, 1.2, 1], opacity: [0.06, 0.12, 0.06] }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 3,
        }}
        className="absolute -right-24 bottom-1/4 size-80 rounded-full bg-azul-trifinio"
        style={{ filter: "blur(80px)" }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(oklch(36%_0_0)_1px,transparent_1px)] bg-size-[24px_24px] opacity-20" />
    </div>
  );
}

function AccederObservatorioButton({
  href = "/observatorio-web",
  className,
  fullWidth = false,
}: {
  href?: string;
  className?: string;
  fullWidth?: boolean;
}) {
  return (
    <div className={cn("flex justify-center", fullWidth && "w-full", className)}>
      <InteractiveHoverButton
        href={href}
        hoverClassName="text-azul-trifinio"
        className={cn(
          "bg-azul-trifinio border-azul-trifinio text-white shadow-sm",
          fullWidth ? "w-full" : "w-full max-w-sm sm:w-auto",
        )}
      >
        Acceder al observatorio web
      </InteractiveHoverButton>
    </div>
  );
}

/* ─── parallax banner ─── */

function FullWidthImageBanner({
  src,
  alt,
  overlay = "from-[#0a1628]/80 via-[#0a1628]/40 to-transparent",
  label,
  title,
  imageClassName,
  fixedBackground = false,
}: {
  src: string;
  alt: string;
  overlay?: string;
  label?: string;
  title?: string;
  imageClassName?: string;
  fixedBackground?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const imgY = useTransform(scrollYProgress, [0, 1], ["-12%", "12%"]);
  const textY = useTransform(scrollYProgress, [0, 1], ["20px", "-20px"]);
  const textOpacity = useTransform(
    scrollYProgress,
    [0.2, 0.45, 0.55, 0.8],
    [0, 1, 1, 0],
  );
  const fixedBgOpacity = useTransform(scrollYProgress, [0.5, 0.88], [1, 0]);

  return (
    <>
      {/* móvil — imagen completa sin recorte ni parallax */}
      <div className="relative w-full md:hidden">
        <img
          src={src}
          alt={alt}
          className={cn("w-full h-auto block object-contain", imageClassName)}
        />
        <div
          className={cn(
            "absolute inset-0 bg-linear-to-b from-[#0a1628]/60 via-transparent to-[#0a1628]/60",
          )}
        />
        {(label || title) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
            {label && (
              <p className="mb-3 text-[10px] font-black uppercase tracking-[0.3em] text-white/90 drop-shadow-lg">
                — {label} —
              </p>
            )}
            {title && (
              <h3 className="text-xl font-black text-white leading-tight drop-shadow-xl">
                {title}
              </h3>
            )}
          </div>
        )}
      </div>

      {/* desktop — parallax o imagen fija con scroll encima */}
      <div
        ref={ref}
        className={cn(
          "relative hidden w-full md:block",
          fixedBackground ? "h-screen bg-[#0a1628]" : "",
        )}
        style={fixedBackground ? undefined : { height: "110vh" }}
      >
        {fixedBackground ? (
          <>
            <motion.div
              style={{ opacity: fixedBgOpacity }}
              className="sticky top-0 z-0 h-screen w-full overflow-hidden"
            >
              <img
                src={src}
                alt={alt}
                className={cn(
                  "absolute inset-0 h-full w-full object-cover",
                  imageClassName,
                )}
              />
              <div className={cn("absolute inset-0 bg-linear-to-r", overlay)} />
            </motion.div>
            {(label || title) && (
              <motion.div
                style={{ y: textY, opacity: textOpacity }}
                className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center px-6 text-center"
              >
                {label && (
                  <p className="mb-5 text-sm font-black uppercase tracking-[0.35em] text-white/90 drop-shadow-lg">
                    — {label} —
                  </p>
                )}
                {title && (
                  <h3 className="whitespace-nowrap text-5xl lg:text-6xl font-black text-white leading-tight drop-shadow-xl">
                    {title}
                  </h3>
                )}
              </motion.div>
            )}
          </>
        ) : (
          <>
            <motion.img
              src={src}
              alt={alt}
              style={{ y: imgY }}
              className={cn(
                "absolute inset-0 h-[120%] w-full -top-[10%] object-cover",
                imageClassName,
              )}
            />
            <div className={cn("absolute inset-0 bg-linear-to-r", overlay)} />
            {(label || title) && (
              <motion.div
                style={{ y: textY, opacity: textOpacity }}
                className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center"
              >
                {label && (
                  <p className="mb-5 text-sm font-black uppercase tracking-[0.35em] text-white/90 drop-shadow-lg">
                    — {label} —
                  </p>
                )}
                {title && (
                  <h3 className="whitespace-nowrap text-5xl lg:text-6xl font-black text-white leading-tight drop-shadow-xl">
                    {title}
                  </h3>
                )}
              </motion.div>
            )}
          </>
        )}
      </div>
    </>
  );
}

/* ─── stat card con count-up ─── */

function StatCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-2xl border border-border bg-card p-5 shadow-sm",
        className,
      )}
    >
      <div className="flex items-center gap-2">
        <Skeleton className="size-4 shrink-0 rounded-md" />
        <Skeleton className="h-3 w-24 rounded-md" />
      </div>
      <Skeleton className="h-9 w-20 rounded-lg" />
    </div>
  );
}

function DonutChartContentSkeleton() {
  return (
    <div className="flex flex-row items-center gap-5">
      <Skeleton className="size-32 sm:size-36 shrink-0 rounded-full" />
      <div className="flex flex-1 flex-col gap-3 min-w-0">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <Skeleton className="size-2.5 shrink-0 rounded-full" />
            <Skeleton className="h-3 flex-1 rounded-md" />
            <Skeleton className="h-3 w-10 shrink-0 rounded-md" />
          </div>
        ))}
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  loading,
  accent,
  bg,
  inView,
  className,
  variant = "light",
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  value: number;
  loading: boolean;
  accent: string;
  bg: string;
  inView: boolean;
  className?: string;
  variant?: "light" | "dark";
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={cn(
        "flex flex-col gap-2 rounded-2xl border p-5 shadow-sm",
        variant === "dark" ? "border-white/10" : "border-border",
        bg,
        className,
      )}
    >
      <div className="flex items-center gap-2">
        <Icon className={cn("size-4 shrink-0", accent)} strokeWidth={2} />
        <p
          className={cn(
            "text-[10px] font-black uppercase tracking-widest",
            accent,
          )}
        >
          {label}
        </p>
      </div>
      {loading ? (
        <Skeleton className="h-9 w-24 rounded-lg" />
      ) : (
        <AnimatedNumber
          value={value}
          active={inView}
          loading={false}
          className={cn(
            "text-3xl font-black leading-none",
            variant === "dark" ? "text-white" : "text-foreground",
          )}
        />
      )}
    </motion.div>
  );
}

/* ─── paleta donut ─── */

const DONUT_COLORS = [
  "#2c5f9b",
  "#1a95d3",
  "#3b82f6",
  "#06b6d4",
  "#0ea5e9",
  "#7dd3fc",
  "#93c5fd",
  "#bae6fd",
];

const CAMPO_TOOLTIP_STYLE = {
  borderRadius: "12px",
  border: "1px solid #e2e8f0",
  background: "#ffffff",
  color: "#0f172a",
  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
  fontSize: 11,
  fontWeight: 600,
};

function DonutLegendItem({
  nombre,
  total,
  color,
  inView,
  loading,
  isDark,
}: {
  nombre: string;
  total: number;
  color: string;
  inView: boolean;
  loading: boolean;
  isDark: boolean;
}) {
  return (
    <li className="flex items-center gap-2 text-xs">
      <span
        className="size-2.5 rounded-full shrink-0"
        style={{ background: color }}
      />
      <span
        className={cn(
          "truncate flex-1 text-left",
          isDark ? "text-white/70" : "text-muted-foreground",
        )}
      >
        {nombre}
      </span>
      <AnimatedNumber
        value={total}
        active={inView}
        loading={loading}
        className={cn(
          "shrink-0 font-bold text-xs",
          isDark ? "text-white" : "text-foreground",
        )}
      />
    </li>
  );
}

function DonutCenterTotal({
  value,
  inView,
  loading,
  isDark,
}: {
  value: number;
  inView: boolean;
  loading: boolean;
  isDark: boolean;
}) {
  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
      <AnimatedNumber
        value={value}
        active={inView}
        loading={loading}
        className={cn(
          "text-lg font-black leading-none",
          isDark ? "text-white" : "text-foreground",
        )}
      />
      <span
        className={cn(
          "text-[9px] font-bold uppercase tracking-wider",
          isDark ? "text-white/60" : "text-muted-foreground",
        )}
      >
        total
      </span>
    </div>
  );
}

function CampoStatCell({
  name,
  value,
  color,
  pct,
  inView,
  loading,
}: {
  name: string;
  value: number;
  color: string;
  pct: string;
  inView: boolean;
  loading: boolean;
}) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
      <div
        className="w-3 h-3 rounded-full shadow-sm shrink-0 mt-0.5"
        style={{ backgroundColor: color }}
      />
      <div className="min-w-0 flex-1">
        <span className="text-xs font-semibold text-white/80 leading-snug block">
          {name}
        </span>
      </div>
      <div className="flex flex-col items-end shrink-0 gap-0.5">
        <span className="text-xs font-bold text-white/45">{pct}%</span>
        <AnimatedNumber
          value={value}
          active={inView}
          loading={loading}
          className="text-sm font-black text-white font-mono"
        />
      </div>
    </div>
  );
}

function DonutChart({
  data,
  title,
  loading,
  variant = "light",
  legendLimit = 5,
  className,
  embedded = false,
}: {
  data: { nombre: string; total: number }[];
  title: string;
  loading: boolean;
  variant?: "light" | "dark";
  legendLimit?: number;
  className?: string;
  embedded?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const total = data.reduce((s, d) => s + d.total, 0);
  const isDark = variant === "dark";

  return (
    <div
      ref={ref}
      className={cn(
        embedded
          ? "flex flex-col"
          : "flex flex-col rounded-2xl border p-6 shadow-sm",
        !embedded &&
          (isDark ? "border-white/10 bg-white/5" : "border-border bg-card"),
        className,
      )}
    >
      <p
        className={cn(
          "text-xs font-black uppercase tracking-widest mb-4",
          isDark ? "text-white/70" : "text-muted-foreground",
        )}
      >
        {title}
      </p>
      {loading ? (
        <DonutChartContentSkeleton />
      ) : data.length === 0 ? (
        <p
          className={cn(
            "text-sm text-center py-10",
            isDark ? "text-white/60" : "text-muted-foreground",
          )}
        >
          Sin datos
        </p>
      ) : (
        <div className="flex flex-row items-center gap-5">
          <div className="relative size-32 sm:size-36 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="total"
                  nameKey="nombre"
                  cx="50%"
                  cy="50%"
                  innerRadius="62%"
                  outerRadius="90%"
                  strokeWidth={1}
                  stroke="transparent"
                >
                  {data.map((_, i) => (
                    <Cell
                      key={i}
                      fill={DONUT_COLORS[i % DONUT_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={
                    isDark
                      ? CAMPO_TOOLTIP_STYLE
                      : {
                          borderRadius: 10,
                          fontSize: 11,
                          fontWeight: 600,
                        }
                  }
                  itemStyle={isDark ? { color: "#0f172a" } : undefined}
                  labelStyle={
                    isDark ? { color: "#0f172a", fontWeight: 700 } : undefined
                  }
                  formatter={(v) => [fmt(Number(v)), ""]}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* total en el centro */}
            <DonutCenterTotal
              value={total}
              inView={inView}
              loading={loading}
              isDark={isDark}
            />
          </div>
          <ul className="flex flex-1 flex-col justify-center gap-2 min-w-0">
            {data.slice(0, legendLimit).map((d, i) => (
              <DonutLegendItem
                key={d.nombre}
                nombre={d.nombre}
                total={d.total}
                color={DONUT_COLORS[i % DONUT_COLORS.length]}
                inView={inView}
                loading={loading}
                isDark={isDark}
              />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function CampoBreakdownPanel({
  data,
  loading,
}: {
  data: { nombre: string; total: number }[];
  loading: boolean;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const panelInView = useInView(panelRef, { once: true, margin: "-40px" });

  const donutData = useMemo(
    () =>
      data.map((d, i) => ({
        name: d.nombre,
        value: d.total,
        color: softBarColor(i),
      })),
    [data],
  );
  const total = donutData.reduce((s, d) => s + d.value, 0);

  return (
    <div ref={panelRef}>
      <p className="text-xs font-black uppercase tracking-widest text-white/70 mb-4">
        Por Campo
      </p>
      {loading ? (
        <DonutChartContentSkeleton />
      ) : donutData.length === 0 ? (
        <p className="text-sm text-center py-10 text-white/60">Sin datos</p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.35fr)] gap-4 lg:gap-6 items-center">
          <div className="relative h-[260px] w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={donutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={110}
                  paddingAngle={donutData.length > 1 ? 4 : 0}
                  dataKey="value"
                  stroke="none"
                >
                  {donutData.map((entry, index) => (
                    <Cell key={`campo-cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => fmt(Number(value))}
                  contentStyle={CAMPO_TOOLTIP_STYLE}
                  itemStyle={{ color: "#0f172a" }}
                  labelStyle={{ color: "#0f172a", fontWeight: 700 }}
                />
              </PieChart>
            </ResponsiveContainer>
            <DonutCenterTotal
              value={total}
              inView={panelInView}
              loading={loading}
              isDark
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {donutData.map((item) => {
              const pct =
                total > 0 ? ((item.value / total) * 100).toFixed(1) : "0";
              return (
                <CampoStatCell
                  key={item.name}
                  name={item.name}
                  value={item.value}
                  color={item.color}
                  pct={pct}
                  inView={panelInView}
                  loading={loading}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function MonitoreoDesglosePanel({
  stats,
  loading,
}: {
  stats: ObsPublicStats | null;
  loading: boolean;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-sm">
      <div className="grid gap-6 md:grid-cols-2">
        <DonutChart
          data={stats?.byNacionalidad ?? []}
          title="Por Nacionalidad"
          loading={loading}
          variant="dark"
          embedded
        />
        <DonutChart
          data={stats?.byPerfil ?? []}
          title="Por Perfil"
          loading={loading}
          variant="dark"
          embedded
        />
      </div>

      <div className="mt-6 border-t border-white/10 pt-6">
        <CampoBreakdownPanel data={stats?.byCampo ?? []} loading={loading} />
      </div>

      <div className="mt-6 flex justify-end">
        <AccederObservatorioButton className="justify-end" />
      </div>
    </div>
  );
}

/* ─── sección 1 ─── */

const FEATURE_CARDS = [
  {
    iconKey: "jahhljqt",
    title: "Monitoreo de Atenciones",
    desc: "Visualice en tiempo real las atenciones a personas en contexto de movilidad humana en la región Trifinio.",
    primaryColor: "#b4b4b4",
  },
  {
    iconKey: "irujbhaa",
    title: "Datos Integrados",
    desc: "Consolide registros por nacionalidad, perfil migratorio y organización en una sola plataforma.",
  },
  {
    iconKey: "dbusuvao",
    title: "Decisiones Informadas",
    desc: "Transforme datos de movilidad humana en perspectivas accionables para políticas y cooperación regional.",
  },
];

function WhyObservatorioSection() {
  const [stats, setStats] = useState<ObsPublicStats | null>(null);
  const [selectedYear, setSelectedYear] = useState<number>(0);
  const [selectedMonth, setSelectedMonth] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  // ref para detectar cuando las tarjetas entran en pantalla
  const statsRef = useRef<HTMLDivElement>(null);
  const whyCardsRef = useRef<HTMLDivElement>(null);
  const statsInView = useInView(statsRef, { once: true, margin: "-40px" });
  const donutsRef = useRef<HTMLDivElement>(null);

  const loadStats = useCallback(async (year: number, month: number) => {
    setLoading(true);
    try {
      const data = await getPublicObsStats(year, month);
      setStats(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats(0, 0);
  }, [loadStats]);

  const handleYear = (year: number) => {
    setSelectedYear(year);
    setSelectedMonth(0);
    loadStats(year, 0);
  };

  const handleMonth = (month: number) => {
    setSelectedMonth(month);
    loadStats(selectedYear, month);
  };

  return (
    <section className="relative z-10 flex w-full flex-col justify-start overflow-hidden bg-[#0a1628] px-6 md:px-12 lg:px-16 pt-6 md:pt-36 pb-20 md:min-h-[130vh]">
      <DarkSectionBackground />
      <div className="relative z-10 mx-auto max-w-6xl w-full">
        {/* cabecera */}
        <div className="text-center">
          <SectionLabel>Movilidad Humana</SectionLabel>
          <motion.h2
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.4 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="mt-4 text-4xl md:text-5xl lg:text-6xl font-black text-white leading-tight"
          >
            Monitoreo integral de las atenciones
          </motion.h2>
          <SectionDivider />
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.4 }}
            transition={{ duration: 0.7, delay: 0.25 }}
            className="mx-auto mt-6 max-w-2xl text-white/70 text-lg leading-relaxed"
          >
            Registro y consolidación en movilidad humana, con datos actualizados
            por indicadores, políticas migratorias, organizaciones, sectores,
            perfil migratorio y nacionalidad.
          </motion.p>
        </div>

        {/* feature cards — arriba de filtros y stats */}
        <div ref={whyCardsRef} className="mt-12 grid gap-5 md:grid-cols-3">
          {FEATURE_CARDS.map((card, idx) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: false, amount: 0.2 }}
              transition={{ duration: 0.7, delay: idx * 0.15 }}
              onMouseEnter={() => playLordIcons(whyCardsRef.current)}
              className={cn(
                "why-card-hover-zone flex flex-row items-center gap-4 rounded-3xl border border-white/10 bg-white/5 p-7 shadow-sm",
              )}
            >
              <motion.div
                initial={{ scale: 0, rotate: -15 }}
                whileInView={{ scale: 1, rotate: 0 }}
                viewport={{ once: false, amount: 0.3 }}
                transition={{
                  duration: 0.5,
                  delay: 0.2 + idx * 0.15,
                  type: "spring",
                }}
                className="shrink-0 flex size-16 md:size-[4.5rem] items-center justify-center rounded-2xl bg-[#e8ecf0] dark:bg-[#e8ecf0] pointer-events-none"
              >
                <AnimatedIcon
                  iconKey={card.iconKey}
                  target={WHY_CARD_HOVER_TARGET}
                  size={52}
                  primaryColor={card.primaryColor}
                />
              </motion.div>
              <div className="flex flex-col text-left">
                <h3 className="text-base font-bold text-white leading-tight">
                  {card.title}
                </h3>
                <p className="mt-1.5 text-sm text-white/70 leading-relaxed">
                  {card.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* filtros + stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.2 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-10 flex flex-col gap-4"
        >
          {/* mobile: año|mes 50/50 → atenciones full → registros|org 50/50
              desktop: año/mes apilados + 3 stats en fila */}
          <div
            ref={statsRef}
            className="flex flex-col lg:flex-row items-stretch gap-4 w-full"
          >
            <div className="grid grid-cols-2 lg:grid-cols-1 gap-3 shrink-0">
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-black uppercase tracking-widest text-celeste-trifinio">
                  Año
                </span>
                <div className="relative">
                  <select
                    value={selectedYear}
                    onChange={(e) => handleYear(Number(e.target.value))}
                    className="w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-bold text-white shadow-sm appearance-none pr-8 cursor-pointer focus:outline-none focus:ring-2 focus:ring-celeste-trifinio/30 lg:min-w-[140px]"
                  >
                    <option value={0}>Todos</option>
                    {(stats?.availableYears ?? []).map((yr) => (
                      <option key={yr} value={yr}>
                        {yr}
                      </option>
                    ))}
                  </select>
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/60 text-xs">
                    ▾
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-black uppercase tracking-widest text-celeste-trifinio">
                  Mes
                </span>
                <div className="relative">
                  <select
                    value={selectedMonth}
                    onChange={(e) => handleMonth(Number(e.target.value))}
                    className="w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-bold text-white shadow-sm appearance-none pr-8 cursor-pointer focus:outline-none focus:ring-2 focus:ring-celeste-trifinio/30 lg:min-w-[140px]"
                  >
                    <option value={0}>Todos</option>
                    {(stats?.availableMonths ?? []).map((m) => (
                      <option key={m} value={m}>
                        {MONTH_NAMES[m]}
                      </option>
                    ))}
                  </select>
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/60 text-xs">
                    ▾
                  </span>
                </div>
              </div>
            </div>

            <motion.div
              key={`stats-${selectedYear}-${selectedMonth}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="flex-1 grid grid-cols-2 lg:grid-cols-3 gap-4 min-w-0"
            >
              {loading && !stats ? (
                <>
                  <StatCardSkeleton className="col-span-2 lg:col-span-1 h-full justify-center" />
                  <StatCardSkeleton className="h-full justify-center" />
                  <StatCardSkeleton className="h-full justify-center" />
                </>
              ) : (
                <>
                  <StatCard
                    icon={Users}
                    label="Total Atenciones"
                    value={stats?.totalAtenciones ?? 0}
                    loading={loading}
                    accent="text-violet-400"
                    bg="bg-violet-500/15"
                    inView={statsInView}
                    variant="dark"
                    className="col-span-2 lg:col-span-1 h-full justify-center"
                  />
                  <StatCard
                    icon={BarChart3}
                    label="Registros"
                    value={stats?.totalRegistros ?? 0}
                    loading={loading}
                    accent="text-celeste-trifinio"
                    bg="bg-azul-trifinio/15"
                    inView={statsInView}
                    variant="dark"
                    className="h-full justify-center"
                  />
                  <StatCard
                    icon={Building2}
                    label="Organizaciones"
                    value={stats?.totalOrganizaciones ?? 0}
                    loading={loading}
                    accent="text-celeste-trifinio"
                    bg="bg-celeste-trifinio/15"
                    inView={statsInView}
                    variant="dark"
                    className="h-full justify-center"
                  />
                </>
              )}
            </motion.div>
          </div>
        </motion.div>

        {/* desglose */}
        <motion.div
          ref={donutsRef}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.15 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="mt-10"
        >
          <MonitoreoDesglosePanel stats={stats} loading={loading} />
        </motion.div>
      </div>
    </section>
  );
}

/* ─── órbita de iconos — gira con scroll ─── */

const ORBIT_RADIUS = 40;
const ORBIT_SIDE_SPREAD = 42;

type OrbitHintAlign = "top" | "center" | "bottom";
type OrbitHintSide = "left" | "right";
type OrbitSlot =
  | "left-top"
  | "left-mid"
  | "left-bot"
  | "right-top"
  | "right-mid"
  | "right-bot";

function orbitAngle(slot: OrbitSlot, spread: number) {
  const angles: Record<OrbitSlot, number> = {
    "left-top": 270 + spread,
    "left-mid": 270,
    "left-bot": 270 - spread,
    "right-top": 90 - spread,
    "right-mid": 90,
    "right-bot": 90 + spread,
  };
  return angles[slot];
}

const ORBIT_ICONS = [
  {
    id: "obs-icon-lt",
    iconKey: "btfhpqdm",
    slot: "left-top" as OrbitSlot,
    sizeClass: "size-16 md:size-32",
    side: "left" as OrbitHintSide,
    align: "top" as OrbitHintAlign,
    description:
      "Atención y cuidado integral brindado a personas migrantes en la región Trifinio.",
    speed: 1.6,
    float: { y: [0, -6, 0], delay: 0.3, duration: 4.5 },
  },
  {
    id: "obs-icon-lm",
    iconKey: "sagolbcs",
    slot: "left-mid" as OrbitSlot,
    sizeClass: "size-16 md:size-32",
    side: "left" as OrbitHintSide,
    align: "center" as OrbitHintAlign,
    description:
      "Caracterización de perfiles y población en movimiento transfronterizo.",
    speed: 1.5,
    float: { y: [0, 7, 0], delay: 0.8, duration: 4.2 },
  },
  {
    id: "obs-icon-lb",
    iconKey: "vnqckbbs",
    slot: "left-bot" as OrbitSlot,
    sizeClass: "size-16 md:size-28",
    side: "left" as OrbitHintSide,
    align: "bottom" as OrbitHintAlign,
    description:
      "Coordinación institucional entre El Salvador, Guatemala y Honduras.",
    speed: 1.3,
    float: {
      y: [0, -8, 0],
      rotate: [-2, 2, -2],
      delay: 1.1,
      duration: 5,
    },
  },
  {
    id: "obs-icon-rt",
    iconKey: "joegeleh",
    slot: "right-top" as OrbitSlot,
    sizeClass: "size-16 md:size-28",
    side: "right" as OrbitHintSide,
    align: "top" as OrbitHintAlign,
    description:
      "Visualización territorial de rutas, flujos y corredores migratorios.",
    speed: 1.4,
    float: { y: [0, -7, 0], x: [0, 3, 0], delay: 0.5, duration: 4.6 },
  },
  {
    id: "obs-icon-rm",
    iconKey: "byxbxspd",
    slot: "right-mid" as OrbitSlot,
    sizeClass: "size-16 md:size-28",
    side: "right" as OrbitHintSide,
    align: "center" as OrbitHintAlign,
    description:
      "Análisis estadístico de indicadores de movilidad humana en la región.",
    speed: 1.4,
    float: { y: [0, 6, 0], delay: 0.9, duration: 5 },
  },
  {
    id: "obs-icon-rb",
    iconKey: "wvhscmei",
    slot: "right-bot" as OrbitSlot,
    sizeClass: "size-16 md:size-28",
    side: "right" as OrbitHintSide,
    align: "bottom" as OrbitHintAlign,
    description:
      "Reportes consolidados para la toma de decisiones públicas e institucionales.",
    speed: 1.5,
    float: { y: [0, -6, 0], x: [0, -3, 0], delay: 1.2, duration: 4.8 },
  },
] as const;

function OrbitIconHint({
  side,
  align,
  description,
}: {
  side: OrbitHintSide;
  align: OrbitHintAlign;
  description: string;
}) {
  const isLeft = side === "left";
  const textClass = cn(
    "w-[10.5rem] font-bold text-azul-trifinio dark:text-white text-[10px] leading-relaxed sm:w-[12rem] sm:text-xs md:w-[14rem] md:text-sm md:leading-snug",
    isLeft ? "text-right" : "text-left",
  );

  return (
    <div
      className={cn(
        "pointer-events-none absolute z-30 hidden md:block",
        isLeft ? "right-full mr-2" : "left-full ml-2",
        align === "top" && "bottom-1/2",
        align === "center" && "top-1/2 -translate-y-1/2",
        align === "bottom" && "top-1/2",
      )}
    >
      <p className={cn(textClass, isLeft ? "pr-1" : "pl-1")}>{description}</p>
    </div>
  );
}

function orbitFloatAnimation(float: (typeof ORBIT_ICONS)[number]["float"]) {
  const anim: { y?: number[]; x?: number[]; rotate?: number[] } = {};
  if (float.y) anim.y = [...float.y];
  if ("x" in float && float.x) anim.x = [...float.x];
  if ("rotate" in float && float.rotate) anim.rotate = [...float.rotate];
  return anim;
}

function ObservatorioIconOrbit() {
  const orbitRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: orbitRef,
    offset: ["start 0.85", "end 0.15"],
  });
  const orbitRotate = useTransform(scrollYProgress, [0, 0.5, 1], [-40, 0, 40]);
  const iconCounterRotate = useTransform(orbitRotate, (r) => -r);

  return (
    <div className="w-full">
      <div
        ref={orbitRef}
        className="relative mx-auto my-6 md:my-16 w-full max-w-[min(92vw,22rem)] md:max-w-2xl aspect-square overflow-hidden md:overflow-visible px-1 md:px-10"
      >
        <div className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: false, amount: 0.2 }}
            transition={{ duration: 1.2, delay: 0.3 }}
            className="absolute size-36 md:size-72 rounded-full border border-azul-trifinio/40"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.6 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: false, amount: 0.2 }}
            transition={{ duration: 1.4, delay: 0.5 }}
            className="absolute size-44 md:size-96 rounded-full border border-azul-trifinio/25"
          />
        </div>

        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
          <motion.div
            id="obs-icon-center"
            initial={{ opacity: 0, scale: 0.4 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: false, amount: 0.3 }}
            transition={{
              duration: 0.7,
              delay: 0.25,
              type: "spring",
              stiffness: 120,
            }}
            className="pointer-events-auto relative flex size-24 md:size-44 items-center justify-center"
          >
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="size-full"
            >
              <AnimatedIcon
                iconKey="okgvdvjm"
                target="#obs-icon-center"
                size="100%"
                speed={1.5}
              />
            </motion.div>
          </motion.div>
        </div>

        <motion.div
          className="pointer-events-none absolute inset-0 z-10"
          style={{ rotate: orbitRotate }}
        >
          {ORBIT_ICONS.map((icon, idx) => {
            const rad = (orbitAngle(icon.slot, ORBIT_SIDE_SPREAD) * Math.PI) / 180;
            const left = 50 + ORBIT_RADIUS * Math.sin(rad);
            const top = 50 - ORBIT_RADIUS * Math.cos(rad);
            const float = icon.float;

            return (
              <motion.div
                key={icon.id}
                id={icon.id}
                initial={{ opacity: 0, scale: 0.6 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: false, amount: 0.3 }}
                transition={{
                  duration: 0.75,
                  delay: 0.45 + idx * 0.05,
                  type: "spring",
                  stiffness: 180,
                }}
                className={cn(
                  "group/orbit-icon pointer-events-auto absolute flex cursor-pointer items-center justify-center",
                  icon.sizeClass,
                )}
                style={{
                  left: `${left}%`,
                  top: `${top}%`,
                  x: "-50%",
                  y: "-50%",
                  rotate: iconCounterRotate,
                }}
                onMouseEnter={(e) => playLordIcons(e.currentTarget)}
              >
                <OrbitIconHint
                  side={icon.side}
                  align={icon.align}
                  description={icon.description}
                />
                <motion.div
                  animate={orbitFloatAnimation(float)}
                  transition={{
                    duration: float.duration,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: float.delay,
                  }}
                  className="size-full"
                >
                  <AnimatedIcon
                    iconKey={icon.iconKey}
                    target={`#${icon.id}`}
                    size="100%"
                    speed={icon.speed}
                  />
                </motion.div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>

      <ul className="mt-8 mb-12 space-y-4 px-3 md:hidden">
        {ORBIT_ICONS.map((icon) => (
          <li key={`${icon.id}-mobile`} className="flex items-start gap-4">
            <div
              id={`${icon.id}-mobile`}
              className="flex size-14 shrink-0 items-center justify-center"
            >
              <AnimatedIcon
                iconKey={icon.iconKey}
                target={`#${icon.id}-mobile`}
                size="100%"
                speed={icon.speed}
              />
            </div>
            <p className="pt-1 text-left text-sm font-bold leading-snug text-azul-trifinio dark:text-white">
              {icon.description}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ─── sección 2 ─── */

function ModulosObservatorioSection() {
  const observatorioPillars = [
    "Ingesta y centralización de datos",
    "Procesamiento analítico",
    "Repositorio de conocimiento",
  ];

  const reportFeatures = [
    "Filtros por año, mes, sector y organización",
    "Gráficos por nacionalidad y perfil migratorio",
    "Cruce de variables y visualización por territorio",
    "Datos consolidados de la región Trifinio",
  ];

  return (
    <section className="relative flex w-full flex-col justify-start md:justify-center overflow-x-hidden bg-background px-6 md:px-12 lg:px-16 pt-6 pb-20 md:py-36 md:min-h-[130vh]">
      <LightSectionBackground />

      <div className="relative z-10 mx-auto max-w-6xl w-full text-center">
        <SectionLabel>Observatorio Web</SectionLabel>

        <motion.h2
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.4 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="mt-4 text-4xl md:text-5xl lg:text-6xl font-black text-foreground leading-tight"
        >
          Observatorio Web de Plan Trifinio
        </motion.h2>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: false, amount: 0.2 }}
        transition={{ duration: 0.7, delay: 0.15 }}
        className="relative z-10 mx-auto mt-10 md:mt-14 flex w-[65%] max-w-[65%] flex-col items-center text-center"
      >
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.3 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="text-2xl md:text-4xl lg:text-[2.75rem] font-black text-foreground leading-tight tracking-tight"
        >
          Es una plataforma tecnológica e interactiva
        </motion.p>

        <ObservatorioIconOrbit />

        <div className="w-full text-left">
          <p className="text-lg md:text-xl leading-relaxed text-muted-foreground">
            Diseñada para la{" "}
            <span className="font-bold text-foreground">
              recolección, centralización, análisis y visualización continua de
              datos
            </span>{" "}
            sobre movilidad humana en la región Trifinio. Su propósito central
            es{" "}
            <span className="font-bold text-foreground">
              generar conocimiento técnico y estadístico
            </span>{" "}
            que fundamente la toma de decisiones institucionales y públicas.
          </p>

          <ul className="mt-10 space-y-5">
            {observatorioPillars.map((item, idx) => (
              <motion.li
                key={item}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: false }}
                transition={{ duration: 0.45, delay: 0.35 + idx * 0.1 }}
                className="flex items-center gap-3.5"
              >
                <span className="size-2 shrink-0 rounded-full bg-celeste-trifinio" />
                <span className="text-xs md:text-sm font-black uppercase tracking-widest text-foreground">
                  {item}
                </span>
              </motion.li>
            ))}
          </ul>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 60 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: false, amount: 0.15 }}
        transition={{ duration: 0.75 }}
        className="relative z-10 mx-auto mt-16 md:mt-20 w-[65%] max-w-[65%] border-t border-border pt-14 md:pt-20 pb-4 md:pb-6"
      >
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.4 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="mb-10 md:mb-12 mx-auto w-full text-center"
        >
          <p className="text-xs md:text-sm font-bold uppercase tracking-[0.25em] text-celeste-trifinio">
            — Reportes —
          </p>
          <h3 className="mt-4 text-3xl md:text-4xl lg:text-[2.75rem] font-black text-foreground leading-tight">
            Consulte los indicadores regionales
          </h3>
          <p className="mt-4 md:mt-5 text-lg md:text-xl text-muted-foreground leading-relaxed">
            Acceda a reportes dinámicos con filtros avanzados, gráficos
            interactivos y descarga de resultados en PDF y Excel.
          </p>
        </motion.div>
        <div className="mx-auto grid w-full grid-cols-1 items-start gap-10 md:grid-cols-[minmax(0,40%)_minmax(0,1fr)] md:gap-12 lg:gap-14">
          {/* izquierda: cuadro */}
          <div className="flex w-full mx-auto md:mx-0">
            <motion.div
              id="rep-card-hover"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: false, amount: 0.2 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="relative flex w-full min-h-72 md:min-h-80 flex-col overflow-hidden rounded-2xl border border-azul-trifinio bg-azul-trifinio pt-7 shadow-sm dark:border-azul-trifinio/30 dark:bg-transparent dark:bg-linear-to-br dark:from-azul-trifinio/45 dark:via-azul-trifinio/35 dark:to-celeste-trifinio/50"
            >
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_28%,rgba(26,149,211,0.22),transparent_62%)] opacity-0 dark:opacity-100" />

              <div className="relative flex flex-1 flex-col items-center justify-end px-6 pb-5">
                {/* abanico de iconos */}
                <div className="relative h-36 w-full max-w-[320px] md:h-40">
                  <svg
                    className="pointer-events-none absolute inset-0 size-full text-white/40 dark:text-white/35"
                    viewBox="0 0 100 100"
                    preserveAspectRatio="xMidYMid meet"
                    fill="none"
                    aria-hidden
                  >
                    <path
                      d="M 14 72 Q 50 20 86 72"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeDasharray="0 9"
                      strokeLinecap="round"
                      shapeRendering="geometricPrecision"
                    />
                  </svg>

                  <motion.div
                    initial={{ opacity: 0, y: 16, rotate: -24 }}
                    whileInView={{ opacity: 1, y: 0, rotate: -18 }}
                    viewport={{ once: false, amount: 0.3 }}
                    transition={{ duration: 0.55, delay: 0.2, type: "spring", stiffness: 200 }}
                    className="absolute bottom-0 left-[6%] flex size-14 md:size-16 items-center justify-center pointer-events-none"
                  >
                    <motion.div
                      animate={{ y: [0, -4, 0] }}
                      transition={{ duration: 3.8, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
                      className="size-full drop-shadow-none dark:drop-shadow-sm"
                    >
                      <AnimatedIcon
                        iconKey="qkcczdgu"
                        target="#rep-card-hover"
                        size="100%"
                        speed={1.5}
                      />
                    </motion.div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.7 }}
                    whileInView={{ opacity: 1, y: 0, scale: 1 }}
                    viewport={{ once: false, amount: 0.3 }}
                    transition={{ duration: 0.6, delay: 0.12, type: "spring", stiffness: 180 }}
                    className="absolute left-1/2 top-0 flex size-16 md:size-20 -translate-x-1/2 items-center justify-center pointer-events-none"
                  >
                    <motion.div
                      animate={{ y: [0, -5, 0] }}
                      transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut" }}
                      className="size-full drop-shadow-none dark:drop-shadow-md"
                    >
                      <AnimatedIcon
                        iconKey="ucosgsod"
                        target="#rep-card-hover"
                        size="100%"
                        speed={1.4}
                      />
                    </motion.div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 16, rotate: 24 }}
                    whileInView={{ opacity: 1, y: 0, rotate: 18 }}
                    viewport={{ once: false, amount: 0.3 }}
                    transition={{ duration: 0.55, delay: 0.28, type: "spring", stiffness: 200 }}
                    className="absolute bottom-0 right-[6%] flex size-14 md:size-16 items-center justify-center pointer-events-none"
                  >
                    <motion.div
                      animate={{ y: [0, -4, 0] }}
                      transition={{ duration: 4.1, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                      className="size-full drop-shadow-none dark:drop-shadow-sm"
                    >
                      <AnimatedIcon
                        iconKey="wvhscmei"
                        target="#rep-card-hover"
                        size="100%"
                        speed={1.5}
                      />
                    </motion.div>
                  </motion.div>
                </div>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: false, amount: 0.3 }}
                transition={{ duration: 0.5, delay: 0.35 }}
                className="relative z-10 w-full border-t border-azul-trifinio/25 bg-[#1a2332] px-5 py-5 text-center dark:bg-card/95"
              >
                <p className="text-xs md:text-sm font-black uppercase tracking-widest text-white/70 dark:text-muted-foreground">
                  Análisis de Datos
                </p>
                <p className="text-xl md:text-2xl font-black text-white leading-tight dark:text-foreground">
                  Reportes
                </p>
              </motion.div>
            </motion.div>
          </div>

          {/* derecha: lista + botón */}
          <div className="flex flex-col gap-8 md:gap-10 md:pt-2">
            <ul className="space-y-5 md:space-y-6">
            {reportFeatures.map((feature, fi) => (
              <motion.li
                key={feature}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: false }}
                transition={{ duration: 0.45, delay: 0.3 + fi * 0.07 }}
                className="flex items-start gap-3.5"
              >
                <span className="mt-2 size-2.5 shrink-0 rounded-full bg-celeste-trifinio" />
                <span className="text-base md:text-lg font-black uppercase tracking-wide text-foreground leading-snug">
                  {feature}
                </span>
              </motion.li>
            ))}
            </ul>

            <AccederObservatorioButton className="md:justify-start" />
          </div>
        </div>
      </motion.div>
    </section>
  );
}

/* ─── sección 3 — FAQ ─── */

const faqs = [
  {
    q: "¿Qué es el Observatorio Web de Plan Trifinio?",
    a: "Es una plataforma tecnológica e interactiva diseñada para la recolección, centralización, análisis y visualización continua de datos sobre movilidad humana en la región Trifinio. Su propósito central es generar conocimiento técnico y estadístico que fundamente la toma de decisiones institucionales y públicas.",
  },
  {
    q: "¿Quiénes pueden acceder al observatorio?",
    a: "El Observatorio Web es público para consulta: cualquier persona puede visualizar y descargar los datos de forma libre. Solo el Plan Trifinio e instituciones autorizadas ingresan la información.",
  },
  {
    q: "¿Qué tipo de datos se recopilan?",
    a: "Datos de movilidad humana vinculados a políticas de migración, indicadores y sectores, así como perfiles y nacionalidades. Se irán añadiendo diferentes áreas de interés y fenómenos a estudiar, como el sector agrícola, pecuario, clima, turismo, entre otros.",
  },
  {
    q: "¿Cómo se generan los reportes?",
    a: "Desde el módulo de Reportes puedes filtrar por organización, sector, período y territorio, cruzar variables y descargar los resultados en PDF o Excel con gráficos interactivos.",
  },
  {
    q: "¿Los datos están seguros?",
    a: "Sí. Los datos son ingresados por diferentes instituciones y resguardados por el Plan Trifinio para su utilización.",
  },
];

function FaqSection() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section className="flex w-full flex-col justify-start md:justify-center px-5 md:px-8 lg:px-10 xl:px-12 pt-12 pb-20 md:pt-24 md:pb-32 lg:pt-28 lg:pb-36 md:min-h-0">
      <div className="mx-auto grid max-w-7xl w-full gap-12 lg:grid-cols-[1fr_1.12fr] lg:items-start lg:gap-16 xl:gap-20">
        {/* columna izquierda — texto + acordeón */}
        <div>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.3 }}
            transition={{ duration: 0.7 }}
          >
            <SectionLabel className="text-sm md:text-base">FAQ</SectionLabel>
            <h2 className="mt-4 text-4xl md:text-5xl lg:text-6xl font-black text-foreground leading-tight">
              Preguntas frecuentes
            </h2>
            <SectionDivider />
            <p className="mt-6 text-lg md:text-xl text-muted-foreground leading-relaxed">
              Aquí encontrarás las respuestas a las dudas más comunes sobre el
              Observatorio Web de Plan Trifinio.
            </p>
          </motion.div>

          <div className="mt-12 md:mt-14 divide-y divide-border">
            {faqs.map((faq, idx) => {
              const isOpen = open === idx;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: false, amount: 0.1 }}
                  transition={{ duration: 0.5, delay: idx * 0.08 }}
                >
                  <button
                    onClick={() => setOpen(isOpen ? null : idx)}
                    className="flex w-full items-center justify-between gap-5 py-6 md:py-7 text-left"
                  >
                    <span
                      className={cn(
                        "text-lg md:text-xl font-bold transition-colors duration-300",
                        isOpen ? "text-azul-trifinio" : "text-foreground",
                      )}
                    >
                      {faq.q}
                    </span>
                    <motion.div
                      animate={{ rotate: isOpen ? 45 : 0 }}
                      transition={{ duration: 0.25 }}
                      className={cn(
                        "flex size-8 md:size-9 shrink-0 items-center justify-center rounded-full border transition-colors duration-300",
                        isOpen
                          ? "border-azul-trifinio bg-azul-trifinio text-white"
                          : "border-border bg-card text-foreground",
                      )}
                    >
                      <Plus className="size-4 md:size-5" strokeWidth={2.5} />
                    </motion.div>
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        key="answer"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.35, ease: [0.25, 1, 0.5, 1] }}
                        className="overflow-hidden"
                      >
                        <p className="pb-6 md:pb-7 text-base md:text-lg text-muted-foreground leading-relaxed">
                          {faq.a}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>

          <AccederObservatorioButton className="mt-10 md:mt-12 lg:hidden [&_a]:px-8 [&_a]:py-3 [&_a]:text-base" />
        </div>

        {/* columna derecha — imagen decorativa + CTA */}
        <motion.div
          initial={{ opacity: 0, x: 60 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: false, amount: 0.2 }}
          transition={{ duration: 0.8, delay: 0.15 }}
          className="relative hidden lg:flex lg:flex-col lg:pt-2"
        >
          <div className="relative w-full">
            {/* marco decorativo */}
            <div className="absolute -top-4 -right-4 h-full w-full rounded-3xl border-2 border-celeste-trifinio/40" />
            <div className="absolute -bottom-4 -left-4 h-full w-full rounded-3xl border-2 border-azul-trifinio/20" />
            <div className="relative overflow-hidden rounded-3xl shadow-2xl">
              <img
                src="/trifinio/hero-background2.jpg"
                alt="Región Trifinio"
                className="aspect-[4/5] xl:aspect-[5/6] w-full min-h-[520px] xl:min-h-[580px] object-cover object-center"
              />
              {/* badge sobre la imagen */}
              <div className="absolute bottom-8 left-8 right-8 rounded-2xl bg-white/10 px-6 py-5 backdrop-blur-md border border-white/20">
                <p className="text-sm font-black uppercase tracking-widest text-white">
                  Observatorio Web
                </p>
                <div className="my-3 h-px w-full bg-white/50" />
                <p
                  className="font-black text-white leading-none"
                  style={{
                    fontFamily: "'Arial Black', sans-serif",
                    fontSize: "clamp(1.25rem, 2.2vw, 1.75rem)",
                  }}
                >
                  Plan Trifinio
                </p>
              </div>
            </div>
          </div>

          <AccederObservatorioButton className="mt-8 w-full justify-center [&_a]:px-8 [&_a]:py-3 [&_a]:text-base" />
        </motion.div>
      </div>
    </section>
  );
}

/* ─── footer cortina (espejo del hero) ─── */

const FOOTER_SIGET_LINKS = [
  { label: "Observatorio Web", href: "/observatorio-web", external: false },
  { label: "Acceder SIGET", href: "/login", external: false },
] as const;

const FOOTER_PLAN_TRIFINIO_LINKS = [
  {
    label: "Sitio oficial",
    href: "https://www.plantrifinio.int/",
    external: true,
  },
  {
    label: "Noticias",
    href: "https://www.plantrifinio.int/noticias/",
    external: true,
  },
  {
    label: "Quiénes somos",
    href: "https://www.plantrifinio.int/quienes-somos/",
    external: true,
  },
  {
    label: "Programas y proyectos",
    href: "https://www.plantrifinio.int/programas-y-proyectos/",
    external: true,
  },
  {
    label: "Reserva de Biosfera Trifinio",
    href: "https://www.plantrifinio.int/reserva-de-biosfera-transfronteriza-trifinio-fraternidad/",
    external: true,
  },
] as const;

const FOOTER_SOCIAL = [
  {
    label: "Facebook",
    href: "https://www.facebook.com/plantrifiniooficial",
    icon: Facebook,
  },
  {
    label: "YouTube",
    href: "https://www.youtube.com/@plantrifinio5622",
    icon: Youtube,
  },
] as const;

const FOOTER_COUNTRIES_LINE = (
  <>
    El Salvador&ensp;•&ensp;Guatemala&ensp;•&ensp;Honduras
  </>
);

function FooterPlanTrifinioBrand() {
  return (
    <div className="flex w-full flex-row items-center gap-5 md:w-auto md:gap-6 lg:gap-8">
      <img
        src="/trifinio/logo.png"
        alt="Plan Trifinio"
        className="size-[110px] shrink-0 object-contain md:size-[120px] lg:size-[132px]"
      />
      <div className="flex min-w-0 flex-1 flex-col items-center justify-center text-center md:flex-none">
        {/* fantasma para anclar el ancho al texto de países (solo desktop) */}
        <p
          className="pointer-events-none invisible hidden h-0 overflow-hidden whitespace-nowrap font-semibold text-white md:block"
          style={{
            fontFamily: "Arial, sans-serif",
            fontSize: "clamp(0.5rem, 1.1vw, 0.9rem)",
            letterSpacing: "0.22em",
          }}
          aria-hidden
        >
          {FOOTER_COUNTRIES_LINE}
        </p>
        <p
          className="whitespace-nowrap text-center font-black leading-[0.95] text-white"
          style={{
            fontFamily: "'Arial Black', sans-serif",
            fontSize: "clamp(1.9rem, 8vw, 2.8rem)",
          }}
        >
          Plan Trifinio
        </p>
        <p
          className="mt-1 text-center font-bold italic leading-tight text-white"
          style={{
            fontFamily: "Arial, sans-serif",
            fontSize: "clamp(1.15rem, 4.5vw, 1.8rem)",
          }}
        >
          &ldquo;Agua sin fronteras&rdquo;
        </p>
        <div className="mt-2 h-[2px] w-full origin-center bg-white" />
        <p
          className="mt-2 whitespace-nowrap text-center font-semibold text-white/85"
          style={{
            fontFamily: "Arial, sans-serif",
            fontSize: "clamp(0.65rem, 2.5vw, 0.9rem)",
            letterSpacing: "0.18em",
          }}
        >
          {FOOTER_COUNTRIES_LINE}
        </p>
      </div>
    </div>
  );
}

function FooterAnimatedLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="relative inline-block pb-0.5">
      {children}
      <span
        aria-hidden
        className="absolute bottom-0 left-0 h-px w-full origin-left scale-x-0 bg-celeste-trifinio transition-transform duration-300 ease-out group-hover:scale-x-100"
      />
    </span>
  );
}

function FooterLinkItem({
  label,
  href,
  external,
  animatedUnderline = false,
}: {
  label: string;
  href: string;
  external: boolean;
  animatedUnderline?: boolean;
}) {
  const className =
    "group inline-flex items-center gap-2 text-base font-semibold text-white/85 transition-colors hover:text-white md:text-lg";

  const labelContent = animatedUnderline ? (
    <FooterAnimatedLabel>{label}</FooterAnimatedLabel>
  ) : (
    label
  );

  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
      >
        {labelContent}
        <ExternalLink className="size-4 opacity-60 transition-opacity group-hover:opacity-100" />
      </a>
    );
  }

  return (
    <Link href={href} className={className}>
      {labelContent}
    </Link>
  );
}

function ObservatorioFooterContent({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative z-10 flex h-full w-full flex-col justify-end gap-8 px-6 pb-8 sm:px-10 md:gap-10 md:px-14 md:pb-10 lg:px-20 xl:px-24",
        className,
      )}
    >
      <div className="grid w-full grid-cols-1 gap-10 md:grid-cols-12 md:items-start md:gap-x-10 lg:gap-x-14">
        {/* Columna 1 — Marca + descripción */}
        <div className="w-full min-w-0 md:col-span-5">
          <FooterPlanTrifinioBrand />
          <p className="mt-6 max-w-md text-base leading-relaxed text-white/75 md:text-[15px] md:leading-relaxed lg:text-base">
            Plataforma tecnológica para la recolección, centralización, análisis
            y visualización de datos sobre movilidad humana en la región Trifinio.
          </p>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-white/60">
            Sistema Integral de Gestión Trifinio (SIGET).

          </p>
        </div>

        {/* Columna 2 — Observatorio Web + Redes */}
        <div className="min-w-0 md:col-span-3">
          <p className="text-xs font-black uppercase tracking-[0.25em] text-celeste-trifinio">
            Observatorio Web
          </p>
          <ul className="mt-5 space-y-3.5">
            {FOOTER_SIGET_LINKS.map((link) => (
              <li key={link.label}>
                <FooterLinkItem {...link} animatedUnderline />
              </li>
            ))}
          </ul>

          <p className="mt-8 text-xs font-black uppercase tracking-[0.25em] text-celeste-trifinio">
            Redes
          </p>
          <ul className="mt-5 space-y-3.5">
            {FOOTER_SOCIAL.map(({ label, href, icon: Icon }) => (
              <li key={label}>
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-3 text-base font-semibold text-white/85 transition-colors hover:text-white md:text-lg"
                >
                  <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/5 text-celeste-trifinio transition-colors group-hover:border-celeste-trifinio/50 group-hover:bg-white/10">
                    <Icon className="size-4" />
                  </span>
                  <FooterAnimatedLabel>{label}</FooterAnimatedLabel>
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Columna 3 — Plan Trifinio (a la derecha) */}
        <div className="min-w-0 md:col-span-4 md:text-right">
          <p className="text-xs font-black uppercase tracking-[0.25em] text-celeste-trifinio">
            Plan Trifinio
          </p>
          <ul className="mt-5 space-y-3.5 md:flex md:flex-col md:items-end">
            {FOOTER_PLAN_TRIFINIO_LINKS.map((link) => (
              <li key={link.label}>
                <FooterLinkItem {...link} animatedUnderline />
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="flex w-full flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 sm:flex-row">
        <p className="text-xs font-black uppercase tracking-[0.3em] text-white/55">
          © 2026 SIGET — Plan Trifinio
        </p>
        <p className="text-xs font-bold uppercase tracking-widest text-white/55">
          Powered by{" "}
          <a
            href="https://www.oscar27jimenez.com"
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center"
          >
            <FooterAnimatedLabel>
              <AuroraText className="text-xs whitespace-nowrap">
                Kore | Ing. de Software
              </AuroraText>
            </FooterAnimatedLabel>
          </a>
        </p>
      </div>
    </div>
  );
}

/** Altura del footer fijo en desktop. */
export const FOOTER_HEIGHT_VH = 50;
/** El spacer controla cuánto sube el bloque blanco.
 *  Menor que FOOTER_HEIGHT_VH → el blanco se detiene antes (muestra más contenido blanco). */
export const FOOTER_SCROLL_SPACER_VH = 38;

export function ObservatorioFooterCurtain() {
  return (
    <>
      {/* móvil — footer normal al final */}
      <footer
        className="relative z-10 w-full shrink-0 overflow-hidden bg-[#0a1628] md:hidden"
        aria-label="Pie de página Plan Trifinio"
      >
        <DarkSectionBackground />
        <div className="relative z-10">
          <ObservatorioFooterContent className="pt-14" />
        </div>
      </footer>

      {/* desktop — fijo abajo, detrás del contenido blanco; se revela al llegar al final */}
      <footer
        className="fixed bottom-0 left-0 z-0 hidden w-full overflow-hidden bg-[#0a1628] md:flex md:flex-col"
        style={{ height: `${FOOTER_HEIGHT_VH}vh`, zoom: 1 / 0.9 }}
        aria-label="Pie de página Plan Trifinio"
      >
        <DarkSectionBackground />
        <div className="relative z-10 flex h-full w-full">
          <ObservatorioFooterContent />
        </div>
      </footer>
    </>
  );
}

/* ─── export ─── */

export function ObservatorioHomeSections() {
  return (
    <>
      <ModulosObservatorioSection />

      <FullWidthImageBanner
        src="/trifinio/hero-background2.jpg"
        alt="Panorama regional Trifinio"
        overlay="from-[#0a1628]/90 via-[#2c5f9b]/50 to-[#1a95d3]/30"
        label="Región Trifinio"
        title="El Salvador · Guatemala · Honduras"
        fixedBackground
      />

      <WhyObservatorioSection />

      <TrifinioDottedMapSection />

      <FaqSection />
    </>
  );
}
