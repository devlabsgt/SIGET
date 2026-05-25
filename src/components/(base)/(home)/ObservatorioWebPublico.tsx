"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { getPublicObsStats, type ObsPublicStats } from "@/app/obs-public-actions";
import { cn } from "@/lib/utils";
import Image from "next/image";

const DONUT_COLORS = [
  "#2c5f9b", "#1a95d3", "#3b82f6", "#06b6d4",
  "#0ea5e9", "#7dd3fc", "#93c5fd", "#bae6fd",
];

function fmt(n: number) {
  return new Intl.NumberFormat("es-GT").format(n);
}

function DonutCard({
  data,
  title,
  loading,
}: {
  data: { nombre: string; total: number }[];
  title: string;
  loading: boolean;
}) {
  const total = data.reduce((s, d) => s + d.total, 0);

  return (
    <div className="flex flex-col rounded-2xl border border-border bg-card p-6 shadow-sm">
      <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-4">
        {title}
      </p>
      {loading ? (
        <div className="flex flex-1 items-center justify-center py-12">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : data.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-12">Sin datos</p>
      ) : (
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="relative w-40 h-40 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie dataKey="total" nameKey="nombre" data={data} cx="50%" cy="50%" innerRadius="60%" outerRadius="88%" strokeWidth={1} stroke="transparent">
                  {data.map((_, i) => (
                    <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 10, fontSize: 11, fontWeight: 600 }} formatter={(v) => [fmt(Number(v)), ""]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xl font-black text-foreground leading-none">{fmt(total)}</span>
              <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">total</span>
            </div>
          </div>
          <ul className="flex flex-col gap-2 w-full">
            {data.map((d, i) => (
              <li key={d.nombre} className="flex items-center gap-2 text-sm">
                <span className="size-3 rounded-full shrink-0" style={{ background: DONUT_COLORS[i % DONUT_COLORS.length] }} />
                <span className="truncate text-muted-foreground flex-1">{d.nombre}</span>
                <span className="font-bold text-foreground tabular-nums">{fmt(d.total)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function ObservatorioWebPublico({ initialStats }: { initialStats: ObsPublicStats }) {
  const [stats, setStats] = useState<ObsPublicStats>(initialStats);
  const [selectedYear, setSelectedYear] = useState<number>(initialStats.availableYears[0] ?? new Date().getFullYear());
  const [loading, setLoading] = useState(false);

  const handleYear = useCallback(async (year: number) => {
    setSelectedYear(year);
    setLoading(true);
    try {
      const data = await getPublicObsStats(year);
      setStats(data);
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <div className="min-h-screen w-full bg-muted dark:bg-background">
      {/* hero */}
      <div className="relative w-full overflow-hidden bg-[#0a1628]" style={{ minHeight: "40vh" }}>
        <img src="/trifinio/hero-background2.jpg" alt="" className="absolute inset-0 w-full h-full object-cover opacity-30" />
        <div className="relative flex flex-col items-center justify-center px-6 py-24 text-center" style={{ minHeight: "40vh" }}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-4">
              <Image src="/trifinio/logo.png" alt="Plan Trifinio" width={64} height={64} className="h-14 w-auto object-contain" />
              <div className="text-left">
                <p className="font-black text-white leading-none" style={{ fontFamily: "'Arial Black', sans-serif", fontSize: "clamp(1.4rem, 3vw, 2.2rem)" }}>
                  Plan Trifinio
                </p>
                <div className="mt-1 h-px w-full bg-white/40" />
                <p className="mt-1 font-semibold text-white/70" style={{ fontFamily: "Arial, sans-serif", fontSize: "0.65rem", letterSpacing: "0.22em" }}>
                  El Salvador&ensp;•&ensp;Guatemala&ensp;•&ensp;Honduras
                </p>
              </div>
            </div>
            <p className="text-[11px] font-black uppercase tracking-[0.3em] text-celeste-trifinio">
              — Observatorio Web —
            </p>
            <h1 className="text-3xl md:text-5xl font-black text-white leading-tight max-w-3xl">
              Datos públicos de la región Trifinio
            </h1>
          </motion.div>
        </div>
      </div>

      {/* contenido */}
      <div className="mx-auto max-w-6xl px-6 md:px-12 py-16 space-y-10">

        {/* selector año */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="flex flex-col items-center gap-6">
          <div className="flex items-center gap-2 rounded-2xl border border-border bg-card p-1.5 shadow-sm">
            {stats.availableYears.map((yr) => (
              <button
                key={yr}
                onClick={() => handleYear(yr)}
                className={cn(
                  "rounded-xl px-6 py-2.5 text-sm font-bold transition-all duration-200",
                  selectedYear === yr
                    ? "bg-azul-trifinio text-white shadow"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {yr}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={selectedYear}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
              className="text-center"
            >
              <span className="text-6xl md:text-8xl font-black text-azul-trifinio leading-none">
                {loading ? "—" : fmt(stats.totalRegistros)}
              </span>
              <p className="mt-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                registros ingresados en {selectedYear}
              </p>
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* donuts */}
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.15 }} className="grid gap-6 md:grid-cols-2">
          <DonutCard data={stats.byNacionalidad} title="Por Nacionalidad" loading={loading} />
          <DonutCard data={stats.byPerfil} title="Por Perfil" loading={loading} />
        </motion.div>

        {/* CTA */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }} className="flex flex-col items-center gap-3 pt-4">
          <p className="text-muted-foreground text-sm">¿Quieres acceder a reportes completos y cruce de variables?</p>
          <Link href="/login" className="rounded-xl bg-azul-trifinio px-8 py-4 text-sm font-bold text-white transition-colors hover:bg-azul-trifinio/90">
            Acceder al Sistema SIGET
          </Link>
        </motion.div>

      </div>
    </div>
  );
}
