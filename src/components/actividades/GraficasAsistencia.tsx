"use client";

import { useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import type { StatSegment } from "./lib/stats";

function DonutPanel({
  titulo,
  data,
}: {
  titulo: string;
  data: StatSegment[];
}) {
  const total = useMemo(
    () => data.reduce((acc, d) => acc + d.value, 0),
    [data],
  );

  if (data.length === 0) {
    return (
      <div className="rounded-2xl bg-white p-5 dark:bg-zinc-900/70">
        <p className="mb-4 text-center text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
          {titulo}
        </p>
        <p className="text-center text-sm text-muted-foreground">Sin datos</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white p-3 sm:p-5 dark:bg-zinc-900/70">
      <p className="mb-3 text-center text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
        {titulo}
      </p>
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
        <div className="relative h-[184px] w-[184px] shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius="32%"
                outerRadius="48%"
                cornerRadius={6}
                stroke="none"
                paddingAngle={data.length > 1 ? 2 : 0}
              >
                {data.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-black tabular-nums">
              {total.toLocaleString("es-GT")}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
              Total
            </span>
          </div>
        </div>
        <div className="grid w-full flex-1 gap-2">
          {data.map((item) => (
            <div
              key={item.name}
              className="flex items-center gap-2.5 rounded-full bg-slate-50 px-3 py-2 dark:bg-zinc-800/60"
            >
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[10px] font-black text-white"
                style={{ backgroundColor: item.color }}
              >
                {item.value}
              </div>
              <span className="flex-1 truncate text-sm font-semibold">
                {item.name}
              </span>
              <span
                className="text-sm font-black tabular-nums"
                style={{ color: item.color }}
              >
                {total > 0 ? Math.round((item.value / total) * 100) : 0}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function GraficasAsistencia({
  porGenero,
  porDepartamento,
  porRangoEdad,
  porTrifinio,
}: {
  porGenero: StatSegment[];
  porDepartamento: StatSegment[];
  porRangoEdad: StatSegment[];
  porTrifinio: StatSegment[];
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <DonutPanel titulo="Por género" data={porGenero} />
      <DonutPanel titulo="Trifinio" data={porTrifinio} />
      <DonutPanel titulo="Por departamento" data={porDepartamento} />
      <DonutPanel titulo="Por rango de edad" data={porRangoEdad} />
    </div>
  );
}
