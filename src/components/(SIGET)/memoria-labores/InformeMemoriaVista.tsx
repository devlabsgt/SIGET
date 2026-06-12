"use client";

import {
  CalendarDays,
  ChevronDown,
  Users,
  TrendingUp,
  ListChecks,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import {
  formatMemoriaPeriodo,
  formatPeriodo,
  sumBeneficiariosProyectos,
  type BeneficiariosGrupo,
  type ProyectoItem,
  type ProyectosMemoria,
} from "./lib/types";

function totalBeneficiariosCount(proyectos: ProyectoItem[]): number {
  const b = sumBeneficiariosProyectos(proyectos);
  const sum = (g: BeneficiariosGrupo) =>
    (g?.hombres || 0) + (g?.mujeres || 0) + (g?.jovenes || 0);
  return sum(b.directos) + sum(b.indirectos);
}

const informeCardClass =
  "rounded-3xl border border-slate-200/70 bg-white shadow-[0_2px_24px_-12px_rgba(15,23,42,0.25)] dark:border-zinc-800 dark:bg-card dark:shadow-none";

function DetalleLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-black uppercase tracking-wider text-zinc-600 dark:text-zinc-300">
      {children}
    </p>
  );
}

function DetalleValor({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-1 text-base font-bold text-foreground whitespace-pre-wrap break-words sm:text-lg">
      {children}
    </p>
  );
}

const GRUPO_COLORS = {
  hombres: "#2563eb",
  mujeres: "#ec4899",
  jovenes: "#22c55e",
} as const;

const TIPO_COLORS = {
  directos: "#0ea5e9",
  indirectos: "#a855f7",
} as const;

const donutTooltipStyle = {
  borderRadius: "0.75rem",
  border: "1px solid #e2e8f0",
  background: "#ffffff",
  fontSize: "12px",
  padding: "6px 10px",
  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
} as const;

type DonutDatum = { name: string; value: number; color: string };

function DonutChart({
  data,
  centerValue,
  centerLabel,
  size = 184,
}: {
  data: DonutDatum[];
  centerValue: number;
  centerLabel: string;
  size?: number;
}) {
  const slices = data.filter((d) => d.value > 0);
  if (slices.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-xs font-semibold text-muted-foreground"
        style={{ height: size, width: size }}
      >
        Sin datos
      </div>
    );
  }
  return (
    <div className="relative shrink-0" style={{ height: size, width: size }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={slices}
            cx="50%"
            cy="50%"
            innerRadius={size * 0.32}
            outerRadius={size * 0.48}
            paddingAngle={slices.length > 1 ? 2 : 0}
            cornerRadius={6}
            dataKey="value"
            stroke="none"
          >
            {slices.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value, name) => [String(value), String(name)]}
            contentStyle={donutTooltipStyle}
            itemStyle={{ color: "#0f172a" }}
            labelStyle={{ color: "#0f172a" }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-black leading-none text-foreground">
          {centerValue.toLocaleString("es-GT")}
        </span>
        <span className="mt-1 text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
          {centerLabel}
        </span>
      </div>
    </div>
  );
}

function DonutLeyenda({
  items,
  total,
  columns = 1,
}: {
  items: DonutDatum[];
  total: number;
  columns?: 1 | 2;
}) {
  const visibles = items.filter((i) => i.value > 0);
  if (visibles.length === 0) return null;
  return (
    <div
      className={cn(
        "flex w-full flex-col gap-2.5",
        columns === 2 && "sm:grid sm:grid-cols-2 sm:gap-x-4 sm:gap-y-2.5",
      )}
    >
      {visibles.map((item) => {
        const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
        return (
          <div
            key={item.name}
            className="flex items-center gap-3 rounded-full bg-slate-50 py-1.5 pl-1.5 pr-4 dark:bg-zinc-800/60"
          >
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-black text-white"
              style={{ backgroundColor: item.color }}
            >
              {item.value.toLocaleString("es-GT")}
            </span>
            <span className="flex-1 text-sm font-semibold text-foreground">
              {item.name}
            </span>
            <span
              className="text-sm font-black tabular-nums"
              style={{ color: item.color }}
            >
              {pct}%
            </span>
          </div>
        );
      })}
    </div>
  );
}

const beneficiarioSubPanel =
  "rounded-2xl bg-white p-3 shadow-sm ring-1 ring-sky-100 dark:bg-zinc-900/70 dark:ring-sky-900/40 sm:p-5";

function DonutPanel({
  title,
  data,
  total,
  legendColumns = 1,
  size = 184,
}: {
  title: string;
  data: DonutDatum[];
  total: number;
  legendColumns?: 1 | 2;
  size?: number;
}) {
  return (
    <div className={beneficiarioSubPanel}>
      <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
        <div className="flex flex-col items-center gap-2">
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
            {title}
          </p>
          <DonutChart
            data={data}
            centerValue={total}
            centerLabel="Total"
            size={size}
          />
        </div>
        <div className="w-full sm:flex-1">
          <DonutLeyenda items={data} total={total} columns={legendColumns} />
        </div>
      </div>
    </div>
  );
}

function DonutDesglosePanel({
  data,
  total,
}: {
  data: DonutDatum[];
  total: number;
}) {
  const directos = data.filter(
    (d) =>
      d.name.toLowerCase().includes("direct") &&
      !d.name.toLowerCase().includes("indirect"),
  );
  const indirectos = data.filter((d) =>
    d.name.toLowerCase().includes("indirect"),
  );

  return (
    <div className={beneficiarioSubPanel}>
      <p className="mb-6 text-center text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
        Desglose completo
      </p>
      <div className="grid grid-cols-1 items-center gap-6 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
        <div className="w-full rounded-xl bg-sky-50/80 p-4 dark:bg-sky-950/20">
          <p className="mb-3 text-center text-[10px] font-bold uppercase tracking-wider text-sky-700 dark:text-sky-300">
            Directos
          </p>
          <DonutLeyenda items={directos} total={total} />
        </div>
        <div className="flex justify-center">
          <DonutChart
            data={data}
            centerValue={total}
            centerLabel="Total"
            size={220}
          />
        </div>
        <div className="w-full rounded-xl bg-violet-50/80 p-4 dark:bg-violet-950/20">
          <p className="mb-3 text-center text-[10px] font-bold uppercase tracking-wider text-violet-600 dark:text-violet-300">
            Indirectos
          </p>
          <DonutLeyenda items={indirectos} total={total} />
        </div>
      </div>
    </div>
  );
}

function AvanceProgreso({
  descripcion,
  logrado,
  meta,
}: {
  descripcion: string;
  logrado: number;
  meta: number;
}) {
  const pct = meta > 0 ? Math.min(100, Math.round((logrado / meta) * 100)) : 0;
  return (
    <div className="flex h-full items-center gap-5 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-amber-100 dark:bg-zinc-900/60 dark:ring-amber-900/30">
      <div className="relative h-24 w-24 shrink-0 sm:h-28 sm:w-28">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={[
                { name: "Logrado", value: logrado, color: "#f59e0b" },
                {
                  name: "Restante",
                  value: Math.max(0, meta - logrado),
                  color: "#fde68a",
                },
              ]}
              cx="50%"
              cy="50%"
              innerRadius={32}
              outerRadius={46}
              startAngle={90}
              endAngle={-270}
              cornerRadius={8}
              dataKey="value"
              stroke="none"
            >
              <Cell fill="#f59e0b" />
              <Cell fill="#fde68a" className="dark:opacity-30" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-black text-amber-600 dark:text-amber-400">
            {pct}%
          </span>
        </div>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-base font-bold text-foreground break-words sm:text-lg">
          {descripcion.trim() || "Sin descripción"}
        </p>
        <p className="mt-1 text-sm font-bold text-amber-600 dark:text-amber-400">
          {logrado} de {meta} alcanzado
        </p>
      </div>
    </div>
  );
}

function informeTitulo(oficina?: string | null, nombre?: string | null) {
  return (
    oficina?.trim() ||
    nombre?.trim() ||
    "Informe sin oficina asignada"
  );
}

export function InformeMemoriaEncabezado({
  cargo,
  nombre,
  oficina,
  proyectos,
  periodo,
  open,
  onToggle,
}: {
  cargo?: string | null;
  nombre?: string | null;
  oficina?: string | null;
  proyectos: ProyectoItem[];
  periodo?: string;
  open?: boolean;
  onToggle?: () => void;
}) {
  const tituloCard = informeTitulo(oficina, nombre);
  const informe = { proyectos, periodo: periodo ?? "" } as ProyectosMemoria;
  const interactive = Boolean(onToggle);

  const content = (
    <>
      <div className="pointer-events-none absolute -right-10 -top-16 h-48 w-48 rounded-full bg-white/10" />
      <div className="pointer-events-none absolute -bottom-20 right-24 h-40 w-40 rounded-full bg-white/5" />
      <div className="relative flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1 space-y-1.5 text-left">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-white backdrop-blur">
            <CalendarDays className="h-3 w-3" />
            {formatMemoriaPeriodo(informe)}
          </span>
          <h3 className="text-xl font-black tracking-tight text-white leading-snug sm:text-2xl">
            {tituloCard}
          </h3>
          {(nombre || cargo) && (
            <p className="text-sm font-medium text-white/80">
              {[nombre, cargo].filter(Boolean).join(" · ")}
            </p>
          )}
        </div>
        <div className="flex items-start gap-3">
          <div className="flex flex-col items-end gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-xs font-bold text-azul-trifinio shadow-sm">
              <Users className="h-3.5 w-3.5" />
              {totalBeneficiariosCount(proyectos).toLocaleString("es-GT")}{" "}
              beneficiarios
            </span>
            <span className="text-xs font-semibold text-white/80">
              {proyectos.length} proyecto
              {proyectos.length !== 1 ? "s" : ""}
            </span>
          </div>
          {interactive && (
            <span
              className={cn(
                "mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/20 text-white transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]",
                open && "rotate-180",
              )}
            >
              <ChevronDown className="h-5 w-5" />
            </span>
          )}
        </div>
      </div>
    </>
  );

  if (interactive) {
    return (
      <button
        type="button"
        onClick={onToggle}
        className="relative w-full overflow-hidden bg-gradient-to-r from-azul-trifinio to-celeste-trifinio px-3 py-5 text-left transition-opacity hover:opacity-95 sm:px-8 sm:py-7 cursor-pointer"
      >
        {content}
      </button>
    );
  }

  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-azul-trifinio to-celeste-trifinio px-3 py-5 sm:px-8 sm:py-7">
      {content}
    </div>
  );
}

function InformeMemoriaCuerpo({
  cargo,
  nombre,
  oficina,
  proyectos,
  registrado,
  footer,
}: {
  cargo?: string | null;
  nombre?: string | null;
  oficina?: string | null;
  proyectos: ProyectoItem[];
  registrado?: string;
  footer?: React.ReactNode;
}) {
  return (
    <div className="p-3 sm:p-5 md:p-8">
      <div className="grid grid-cols-2 gap-2 sm:gap-3 sm:grid-cols-4">
        {[
          { label: "Oficina / unidad", value: oficina || "—" },
          { label: "Informante", value: nombre || "—" },
          { label: "Cargo", value: cargo || "—" },
          { label: "Registrado", value: registrado || "—" },
        ].map((d) => (
          <div
            key={d.label}
            className="rounded-2xl bg-slate-50 px-4 py-3 dark:bg-zinc-800/50"
          >
            <DetalleLabel>{d.label}</DetalleLabel>
            <DetalleValor>{d.value}</DetalleValor>
          </div>
        ))}
      </div>

      <div className="mt-6 space-y-6">
        {proyectos.map((proyecto, i) => (
          <ProyectoInformeDetalle
            key={`proyecto-${i}`}
            proyecto={proyecto}
            index={i}
          />
        ))}
      </div>

      {footer}
    </div>
  );
}

const accordionPanelTransition =
  "transition-[grid-template-rows] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] motion-reduce:transition-none";

export function InformeMemoriaVista({
  cargo,
  nombre,
  oficina,
  proyectos,
  registrado,
  footer,
  className,
  periodo,
  accordionOpen,
  onAccordionToggle,
}: {
  cargo?: string | null;
  nombre?: string | null;
  oficina?: string | null;
  proyectos: ProyectoItem[];
  registrado?: string;
  footer?: React.ReactNode;
  className?: string;
  periodo?: string;
  accordionOpen?: boolean;
  onAccordionToggle?: () => void;
}) {
  const isAccordion = onAccordionToggle !== undefined;
  const cuerpo = (
    <InformeMemoriaCuerpo
      cargo={cargo}
      nombre={nombre}
      oficina={oficina}
      proyectos={proyectos}
      registrado={registrado}
      footer={footer}
    />
  );

  return (
    <div className={cn(informeCardClass, "w-full overflow-hidden", className)}>
      <InformeMemoriaEncabezado
        cargo={cargo}
        nombre={nombre}
        oficina={oficina}
        proyectos={proyectos}
        periodo={periodo}
        open={accordionOpen}
        onToggle={onAccordionToggle}
      />

      {isAccordion ? (
        <div
          className={cn(
            "grid",
            accordionPanelTransition,
            accordionOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
          )}
        >
          <div className="min-h-0 overflow-hidden">{cuerpo}</div>
        </div>
      ) : (
        cuerpo
      )}
    </div>
  );
}

function ProyectoInformeDetalle({
  proyecto,
  index,
}: {
  proyecto: ProyectoItem;
  index: number;
}) {
  const avances = proyecto.avances.filter(
    (a) => a.descripcion.trim() || a.logrado > 0 || a.meta > 0,
  );
  const resultados = proyecto.resultados.filter((r) => r.trim());
  const efectos = proyecto.efectos.filter((e) => e.trim());

  const { directos, indirectos } = proyecto.beneficiarios;
  const totalDirectos = directos.hombres + directos.mujeres + directos.jovenes;
  const totalIndirectos =
    indirectos.hombres + indirectos.mujeres + indirectos.jovenes;
  const totalBeneficiarios = totalDirectos + totalIndirectos;

  const grupoData = [
    {
      name: "Hombres",
      value: directos.hombres + indirectos.hombres,
      color: GRUPO_COLORS.hombres,
    },
    {
      name: "Mujeres",
      value: directos.mujeres + indirectos.mujeres,
      color: GRUPO_COLORS.mujeres,
    },
    {
      name: "Jóvenes",
      value: directos.jovenes + indirectos.jovenes,
      color: GRUPO_COLORS.jovenes,
    },
  ];
  const tipoData = [
    { name: "Directos", value: totalDirectos, color: TIPO_COLORS.directos },
    {
      name: "Indirectos",
      value: totalIndirectos,
      color: TIPO_COLORS.indirectos,
    },
  ];
  const desgloseData = [
    { name: "Hombres directos", value: directos.hombres, color: "#1d4ed8" },
    { name: "Mujeres directas", value: directos.mujeres, color: "#db2777" },
    { name: "Jóvenes directos", value: directos.jovenes, color: "#15803d" },
    { name: "Hombres indirectos", value: indirectos.hombres, color: "#60a5fa" },
    { name: "Mujeres indirectas", value: indirectos.mujeres, color: "#f9a8d4" },
    { name: "Jóvenes indirectos", value: indirectos.jovenes, color: "#86efac" },
  ];

  return (
    <article className="rounded-2xl border border-slate-200/70 bg-slate-50/40 p-3 sm:rounded-3xl sm:p-6 dark:border-zinc-800 dark:bg-zinc-900/30">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-azul-trifinio text-lg font-black text-white">
            {index + 1}
          </span>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
              Proyecto
            </p>
            <h4 className="text-xl font-black tracking-tight text-foreground leading-tight sm:text-2xl">
              {proyecto.nombre.trim() || "Sin nombre"}
            </h4>
          </div>
        </div>
        <span className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-muted-foreground shadow-sm dark:bg-zinc-800">
          {formatPeriodo(proyecto.mes)}
        </span>
      </div>

      {proyecto.descripcion.trim() && (
        <p className="mb-6 max-w-3xl text-sm leading-relaxed text-muted-foreground">
          {proyecto.descripcion}
        </p>
      )}

      <div className="space-y-5">
        {avances.length > 0 && (
          <SeccionPanel
            title="Avances por proyecto"
            icon={<TrendingUp className="h-4 w-4" />}
            tone="amber"
          >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {avances.map((a, j) => {
                const isLastOdd =
                  j === avances.length - 1 && avances.length % 2 !== 0;
                return (
                  <div
                    key={j}
                    className={cn(
                      isLastOdd && "md:col-span-2 md:mx-auto md:w-full md:max-w-xl",
                    )}
                  >
                    <AvanceProgreso
                      descripcion={a.descripcion}
                      logrado={a.logrado}
                      meta={a.meta}
                    />
                  </div>
                );
              })}
            </div>
          </SeccionPanel>
        )}

        {totalBeneficiarios > 0 && (
          <SeccionPanel
            title="Beneficiarios alcanzados"
            icon={<Users className="h-4 w-4" />}
            tone="sky"
          >
            <div className="space-y-5">
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                <DonutPanel
                  title="Por grupo"
                  data={grupoData}
                  total={totalBeneficiarios}
                />
                <DonutPanel
                  title="Directos vs indirectos"
                  data={tipoData}
                  total={totalBeneficiarios}
                />
              </div>
              <DonutDesglosePanel data={desgloseData} total={totalBeneficiarios} />
            </div>
          </SeccionPanel>
        )}

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        {resultados.length > 0 && (
          <SeccionPanel
            title="Principales resultados"
            icon={<ListChecks className="h-4 w-4" />}
            tone="violet"
          >
            <ul className="space-y-3 text-base font-bold leading-relaxed text-foreground sm:text-lg">
              {resultados.map((r, j) => (
                <li key={j} className="flex gap-3">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-500 text-xs font-black text-white">
                    {j + 1}
                  </span>
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </SeccionPanel>
        )}

        {efectos.length > 0 && (
          <SeccionPanel
            title="Efectos alcanzados"
            icon={<Sparkles className="h-4 w-4" />}
            tone="emerald"
          >
            <ul className="space-y-3 text-base font-bold leading-relaxed text-foreground sm:text-lg">
              {efectos.map((e, j) => (
                <li key={j} className="flex gap-3">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-xs font-black text-white">
                    {j + 1}
                  </span>
                  <span>{e}</span>
                </li>
              ))}
            </ul>
          </SeccionPanel>
        )}
        </div>
      </div>
    </article>
  );
}

type SeccionTone = "amber" | "sky" | "violet" | "emerald";

const seccionToneStyles: Record<
  SeccionTone,
  { panel: string; iconWrap: string; title: string }
> = {
  amber: {
    panel: "bg-amber-50/70 ring-1 ring-amber-100 dark:bg-amber-950/20 dark:ring-amber-900/30",
    iconWrap: "bg-amber-500 text-white",
    title: "text-amber-700 dark:text-amber-300",
  },
  sky: {
    panel: "bg-sky-50/70 ring-1 ring-sky-100 dark:bg-sky-950/20 dark:ring-sky-900/30",
    iconWrap: "bg-sky-500 text-white",
    title: "text-sky-700 dark:text-sky-300",
  },
  violet: {
    panel: "bg-violet-50/70 ring-1 ring-violet-100 dark:bg-violet-950/20 dark:ring-violet-900/30",
    iconWrap: "bg-violet-500 text-white",
    title: "text-violet-700 dark:text-violet-300",
  },
  emerald: {
    panel: "bg-emerald-50/70 ring-1 ring-emerald-100 dark:bg-emerald-950/20 dark:ring-emerald-900/30",
    iconWrap: "bg-emerald-500 text-white",
    title: "text-emerald-700 dark:text-emerald-300",
  },
};

function SeccionPanel({
  title,
  icon,
  tone,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  tone: SeccionTone;
  children: React.ReactNode;
}) {
  const styles = seccionToneStyles[tone];
  return (
    <section className={cn("rounded-2xl p-3 sm:p-5", styles.panel)}>
      <div className="mb-4 flex items-center gap-2.5">
        <span
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
            styles.iconWrap,
          )}
        >
          {icon}
        </span>
        <h5 className={cn("text-base font-black tracking-tight sm:text-lg", styles.title)}>
          {title}
        </h5>
      </div>
      {children}
    </section>
  );
}