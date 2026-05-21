"use client";

import { useState, useEffect, useMemo, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  PieChart as PieChartIcon,
  BarChart3,
  Table2,
  Check,
  ChevronDown,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { ReportRow } from "./lib/reportes-actions";
import {
  ALL_INDICADORES_ID,
  filterReportRows,
  getAvailableCampos,
  getIndicadoresEnUso,
  getPoliticasEnDatos,
  computeGlobalCrossStats,
  aggregateReportSlices,
  buildNacPerfilProgressItems,
  buildCampoProgressItems,
  buildReportCampoDimensionCross,
  aggregateReportByNacPerfil,
  getCampoTotalsForIndicador,
  buildNacTotalsMap,
  nacPerfilMatrixFromRows,
  type ReportChartSlice,
  type ReportCampoOption,
} from "./lib/cross-report-lib";
import { HEATMAP_RGB, GUATEMALTECO_CELESTE, isGuatemalteco, nationalityColor, nacPerfilBarColor, softBarColor } from "./lib/chart-colors";

const LEGEND_ACCORDION_MIN_LEN = 42;

const tooltipStyle = {
  borderRadius: "12px",
  border: "1px solid #e2e8f0",
  fontWeight: "bold" as const,
  fontSize: "12px",
};

function formatChartNumber(value: number) {
  return new Intl.NumberFormat("es-GT").format(value);
}

function ProgressBarList({
  items,
  maxValue,
  getBarColor,
}: {
  items: { id: string; label: string; sublabel?: string; value: number }[];
  maxValue?: number;
  getBarColor?: (item: { id: string; label: string; sublabel?: string; value: number }, idx: number) => string;
}) {
  const max = maxValue ?? Math.max(...items.map((i) => i.value), 1);
  if (items.length === 0) {
    return <p className="text-xs text-slate-400 font-semibold py-4 text-center">Sin datos</p>;
  }
  return (
    <div className="space-y-4">
      {items.map((item, idx) => {
        const pct = (item.value / max) * 100;
        const barColor = getBarColor ? getBarColor(item, idx) : softBarColor(idx);
        return (
          <div key={item.id} className="space-y-1.5">
            <div className="flex justify-between items-start gap-2">
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase block leading-snug">
                  {item.label}
                </span>
                {item.sublabel && (
                  <span className="text-[9px] font-semibold text-blue-600 dark:text-blue-400 block mt-0.5">
                    {item.sublabel}
                  </span>
                )}
              </div>
              <span className="text-xs font-black text-slate-900 dark:text-white shrink-0">
                {formatChartNumber(item.value)}
              </span>
            </div>
            <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.7, ease: "easeOut", delay: idx * 0.05 }}
                className="h-full rounded-full"
                style={{ backgroundColor: barColor }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ProgressBarChartCard({
  title,
  icon: Icon,
  iconClass,
  children,
  contentAutoHeight = false,
}: {
  title: string;
  icon: typeof BarChart3;
  iconClass: string;
  children: ReactNode;
  contentAutoHeight?: boolean;
}) {
  return (
    <div
      className={`bg-white dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 ${
        contentAutoHeight ? "" : "h-full flex flex-col"
      }`}
    >
      <div className="flex items-center gap-2">
        <Icon className={`w-4 h-4 ${iconClass}`} />
        <h5 className="text-xs font-black text-slate-400 uppercase tracking-widest">{title}</h5>
      </div>
      <div className={contentAutoHeight ? "pr-1" : "flex-1 min-h-0 max-h-[280px] overflow-y-auto pr-1"}>
        {children}
      </div>
    </div>
  );
}

function ChartLegendRow({
  item,
  total,
  index,
  expanded,
  onToggle,
  useAccordion,
}: {
  item: { name: string; value: number; color: string };
  total: number;
  index: number;
  expanded: boolean;
  onToggle: (index: number) => void;
  useAccordion: boolean;
}) {
  const pct = total > 0 ? `${((item.value / total) * 100).toFixed(0)}%` : "0%";
  if (!useAccordion) {
    return (
      <div className="flex items-start justify-between gap-2 text-[10px]">
        <div className="flex items-start gap-1.5 min-w-0 flex-1">
          <div className="w-2.5 h-2.5 rounded-full shrink-0 mt-0.5" style={{ backgroundColor: item.color }} />
          <span className="font-semibold text-slate-600 dark:text-slate-400 leading-snug">{item.name}</span>
        </div>
        <span className="font-black text-slate-800 dark:text-slate-200 font-mono shrink-0">{pct}</span>
      </div>
    );
  }
  return (
    <div
      className={`rounded-lg border transition-colors ${
        expanded ? "border-blue-200 dark:border-blue-800 bg-blue-50/40 dark:bg-blue-900/20" : "border-transparent"
      }`}
    >
      <button
        type="button"
        onClick={() => onToggle(index)}
        className="w-full flex items-start gap-1.5 p-1.5 text-left cursor-pointer"
        aria-expanded={expanded}
      >
        <div className="w-2.5 h-2.5 rounded-full shrink-0 mt-0.5" style={{ backgroundColor: item.color }} />
        <div className="flex-1 min-w-0">
          <p className={`text-[10px] font-semibold text-slate-600 dark:text-slate-400 leading-snug ${expanded ? "" : "line-clamp-2"}`}>
            {item.name}
          </p>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 shrink-0 text-slate-400 transition-transform mt-0.5 ${expanded ? "rotate-180" : ""}`} />
        <span className="font-black text-slate-800 dark:text-slate-200 font-mono shrink-0 text-[10px]">{pct}</span>
      </button>
    </div>
  );
}

function DonutChartCard({
  title,
  icon: Icon,
  iconClass,
  data,
  chartKey,
  legendAccordion = false,
  compact = false,
}: {
  title: string;
  icon: typeof PieChartIcon;
  iconClass: string;
  data: ReportChartSlice[];
  chartKey: string;
  legendAccordion?: boolean;
  compact?: boolean;
}) {
  const [expandedLegendIndex, setExpandedLegendIndex] = useState<number | null>(null);
  const total = data.reduce((s, d) => s + d.value, 0);

  useEffect(() => {
    setExpandedLegendIndex(null);
  }, [chartKey]);

  if (data.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-center min-h-[180px]">
        <p className="text-xs text-slate-400 font-semibold">Sin datos para este filtro</p>
      </div>
    );
  }

  return (
    <div
      className={
        compact
          ? "rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 p-3 space-y-2 h-full flex flex-col"
          : "bg-white dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3"
      }
    >
      <div className="flex items-center gap-2">
        {compact ? (
          <p className={`text-[10px] font-black uppercase tracking-widest ${iconClass}`}>{title}</p>
        ) : (
          <>
            <Icon className={`w-4 h-4 ${iconClass}`} />
            <h5 className="text-xs font-black text-slate-400 uppercase tracking-widest">{title}</h5>
          </>
        )}
        <span className="text-xs font-black text-blue-600 dark:text-blue-400 ml-auto font-mono">{formatChartNumber(total)}</span>
      </div>
      <div className={`flex gap-2 items-center flex-1 min-h-0 ${compact ? "min-h-[150px]" : "min-h-[140px]"}`}>
        <div className={`shrink-0 ${compact ? "w-[88px] h-[88px]" : "w-[120px] h-[120px]"}`}>
          <AnimatePresence mode="wait">
            <motion.div
              key={chartKey}
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={{ duration: 0.3 }}
              className="h-full w-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={compact ? 28 : 38}
                    outerRadius={compact ? 42 : 56}
                    paddingAngle={data.length > 1 ? 3 : 0}
                    dataKey="value"
                    stroke="none"
                  >
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatChartNumber(Number(value))} contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            </motion.div>
          </AnimatePresence>
        </div>
        <div className="flex-1 min-w-0 space-y-1.5 max-h-[200px] overflow-y-auto pr-0.5">
          {data.map((item, idx) => (
            <ChartLegendRow
              key={`${item.name}-${idx}`}
              item={item}
              total={total}
              index={idx}
              expanded={expandedLegendIndex === idx}
              onToggle={(i) => setExpandedLegendIndex((prev) => (prev === i ? null : i))}
              useAccordion={legendAccordion || item.name.length > LEGEND_ACCORDION_MIN_LEN}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function CampoDimensionMatrix({
  title,
  cornerLabel,
  campos,
  colIds,
  grid,
  getColLabel,
  accentClass = "text-blue-600 dark:text-blue-400",
}: {
  title: string;
  cornerLabel: string;
  campos: { catalogId: string; nombre: string }[];
  colIds: string[];
  grid: Map<string, Map<string, number>>;
  getColLabel: (id: string) => string;
  accentClass?: string;
}) {
  const { maxCell, grandTotal } = useMemo(() => {
    let maxCell = 1;
    let grandTotal = 0;
    for (const row of grid.values()) {
      for (const val of row.values()) {
        maxCell = Math.max(maxCell, val);
        grandTotal += val;
      }
    }
    return { maxCell, grandTotal };
  }, [grid]);

  if (campos.length === 0 || colIds.length === 0) return null;

  return (
    <div className="bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-3 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-100 dark:border-blue-800/50">
        <Table2 className="w-4 h-4 text-blue-500" />
        <h5 className={`text-xs font-black uppercase tracking-widest ${accentClass}`}>{title}</h5>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-800">
              <th className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider sticky left-0 bg-white dark:bg-slate-900/50 min-w-28">
                {cornerLabel}
              </th>
              {colIds.map((colId) => (
                <th
                  key={colId}
                  title={getColLabel(colId)}
                  className="px-3 py-3 text-center text-[10px] font-black text-blue-500 uppercase tracking-wider min-w-20 max-w-32 truncate"
                >
                  {getColLabel(colId)}
                </th>
              ))}
              <th className="px-4 py-3 text-right text-[10px] font-black text-blue-500 uppercase tracking-wider">Σ</th>
            </tr>
          </thead>
          <tbody>
            {campos.map((campo, rIdx) => {
              const rowMap = grid.get(campo.catalogId) || new Map();
              let rowSum = 0;
              return (
                <tr
                  key={campo.catalogId}
                  className={`border-b border-slate-50 dark:border-slate-800/50 ${
                    rIdx % 2 === 0 ? "bg-white dark:bg-transparent" : "bg-slate-50/50 dark:bg-slate-900/30"
                  }`}
                >
                  <td className="px-4 py-2.5 font-semibold text-blue-600 dark:text-blue-400 sticky left-0 bg-inherit whitespace-nowrap">
                    {campo.nombre}
                  </td>
                  {colIds.map((colId) => {
                    const val = rowMap.get(colId) || 0;
                    rowSum += val;
                    const intensity = val > 0 ? Math.max(0.12, val / maxCell) : 0;
                    return (
                      <td
                        key={colId}
                        className="px-3 py-2.5 text-center font-mono font-bold text-slate-700 dark:text-slate-300"
                        style={val > 0 ? { backgroundColor: `rgba(${HEATMAP_RGB}, ${intensity * 0.24})` } : undefined}
                      >
                        {val > 0 ? val : "—"}
                      </td>
                    );
                  })}
                  <td className="px-4 py-2.5 text-right font-black text-blue-600">{rowSum}</td>
                </tr>
              );
            })}
            <tr className="bg-blue-50/50 dark:bg-blue-900/10 border-t-2 border-blue-200 dark:border-blue-800">
              <td className="px-4 py-3 font-black text-xs text-slate-500 uppercase tracking-wider sticky left-0 bg-inherit">Σ</td>
              {colIds.map((colId) => {
                const colSum = campos.reduce((s, c) => s + (grid.get(c.catalogId)?.get(colId) || 0), 0);
                return (
                  <td key={colId} className="px-3 py-3 text-center font-black text-slate-800 dark:text-slate-200">
                    {colSum}
                  </td>
                );
              })}
              <td className="px-4 py-3 text-right font-black text-blue-700 dark:text-blue-400">{grandTotal}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function NacPerfilMatrix({ rows }: { rows: ReportRow[] }) {
  const { nacIds, perfilIds, totals, maxCell, grandTotal, nacLabels, perfLabels, crossKey } = useMemo(
    () => nacPerfilMatrixFromRows(rows),
    [rows]
  );

  if (nacIds.length === 0 || perfilIds.length === 0) return null;

  return (
    <div className="bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-3 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-100 dark:border-blue-800/50">
        <Table2 className="w-4 h-4 text-blue-500" />
        <h5 className="text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">
          Matriz Nacionalidad × Perfil
        </h5>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-800">
              <th className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider sticky left-0 bg-white dark:bg-slate-900/50">
                Nacionalidad ↓ / Perfil →
              </th>
              {perfilIds.map((pid) => (
                <th key={pid} className="px-3 py-3 text-center text-[10px] font-black text-blue-500 uppercase tracking-wider min-w-20">
                  {perfLabels.get(pid)}
                </th>
              ))}
              <th className="px-4 py-3 text-right text-[10px] font-black text-blue-500 uppercase tracking-wider">Σ fila</th>
            </tr>
          </thead>
          <tbody>
            {nacIds.map((nid, nIdx) => {
              let rowSum = 0;
              return (
                <tr key={nid} className={`border-b border-slate-50 dark:border-slate-800/50 ${nIdx % 2 === 0 ? "bg-white dark:bg-transparent" : "bg-slate-50/50 dark:bg-slate-900/30"}`}>
                  <td className="px-4 py-2.5 font-semibold text-amber-600 dark:text-amber-400 sticky left-0 bg-inherit">
                    {nacLabels.get(nid)}
                  </td>
                  {perfilIds.map((pid) => {
                    const val = totals.get(crossKey(nid, pid)) || 0;
                    rowSum += val;
                    const intensity = val > 0 ? Math.max(0.12, val / maxCell) : 0;
                    return (
                      <td
                        key={pid}
                        className="px-3 py-2.5 text-center font-mono font-bold text-slate-700 dark:text-slate-300"
                        style={val > 0 ? { backgroundColor: `rgba(${HEATMAP_RGB}, ${intensity * 0.24})` } : undefined}
                      >
                        {val > 0 ? val : "—"}
                      </td>
                    );
                  })}
                  <td className="px-4 py-2.5 text-right font-black text-blue-600">{rowSum}</td>
                </tr>
              );
            })}
            <tr className="bg-blue-50/50 dark:bg-blue-900/10 border-t-2 border-blue-200 dark:border-blue-800">
              <td className="px-4 py-3 font-black text-xs text-slate-500 uppercase tracking-wider">Σ columna</td>
              {perfilIds.map((pid) => {
                const colSum = nacIds.reduce((s, nid) => s + (totals.get(crossKey(nid, pid)) || 0), 0);
                return (
                  <td key={pid} className="px-3 py-3 text-center font-black text-slate-800 dark:text-slate-200">
                    {colSum}
                  </td>
                );
              })}
              <td className="px-4 py-3 text-right font-black text-blue-700 dark:text-blue-400 text-base">{grandTotal}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─── Cruce global (misma UI que formularios paso 5) ─── */

export function ReportGlobalCrossSection({
  rows,
  embedded = false,
}: {
  rows: ReportRow[];
  embedded?: boolean;
}) {
  const [selectedIndicadorId, setSelectedIndicadorId] = useState(ALL_INDICADORES_ID);
  const [selectedCampoIds, setSelectedCampoIds] = useState<Set<string>>(new Set());

  const stats = useMemo(() => computeGlobalCrossStats(rows), [rows]);
  const indicadoresEnUso = useMemo(() => getIndicadoresEnUso(rows), [rows]);

  const rowsForIndicadorScope = useMemo(
    () =>
      selectedIndicadorId === ALL_INDICADORES_ID
        ? rows
        : rows.filter((r) => r.indicadorId === selectedIndicadorId),
    [rows, selectedIndicadorId]
  );

  const availableCampos = useMemo(() => getAvailableCampos(rowsForIndicadorScope), [rowsForIndicadorScope]);

  useEffect(() => {
    setSelectedCampoIds(new Set(availableCampos.map((c) => c.catalogId)));
  }, [availableCampos]);

  const filteredRows = useMemo(
    () => filterReportRows(rows, selectedIndicadorId, selectedCampoIds),
    [rows, selectedIndicadorId, selectedCampoIds]
  );

  const filterKey = `${selectedIndicadorId}:${[...selectedCampoIds].sort().join(",")}`;

  const nacData = useMemo(
    () => aggregateReportSlices(filteredRows, "nacionalidad"),
    [filteredRows]
  );
  const perfilData = useMemo(
    () => aggregateReportSlices(filteredRows, "perfil"),
    [filteredRows]
  );
  const indicadorData = useMemo(
    () => aggregateReportSlices(filteredRows, "indicador"),
    [filteredRows]
  );

  const comboProgressItems = useMemo(() => buildNacPerfilProgressItems(filteredRows), [filteredRows]);
  const campoProgressItems = useMemo(
    () => buildCampoProgressItems(filteredRows, selectedCampoIds, availableCampos),
    [filteredRows, selectedCampoIds, availableCampos]
  );

  const camposSeleccionados = useMemo(
    () => availableCampos.filter((c) => selectedCampoIds.has(c.catalogId)),
    [availableCampos, selectedCampoIds]
  );

  const crossCampoNac = useMemo(
    () => buildReportCampoDimensionCross(filteredRows, camposSeleccionados, "nacionalidad"),
    [filteredRows, camposSeleccionados]
  );
  const crossCampoPerfil = useMemo(
    () => buildReportCampoDimensionCross(filteredRows, camposSeleccionados, "perfil"),
    [filteredRows, camposSeleccionados]
  );
  const crossCampoInd = useMemo(
    () => buildReportCampoDimensionCross(filteredRows, camposSeleccionados, "indicador"),
    [filteredRows, camposSeleccionados]
  );

  const toggleCampo = (catalogId: string) => {
    setSelectedCampoIds((prev) => {
      const next = new Set(prev);
      if (next.has(catalogId)) next.delete(catalogId);
      else next.add(catalogId);
      return next;
    });
  };

  if (rows.length === 0) return null;

  const inner = (
    <>
      {!embedded && (
        <div className="flex items-center gap-3">
          <div className="w-2 h-7 bg-blue-600 rounded-full shrink-0" />
          <h3 className="text-base font-black text-slate-800 dark:text-slate-200 uppercase tracking-tight">
            Cruce global
          </h3>
          <span className="text-xs font-bold text-slate-400 ml-auto shrink-0">
            {stats.comboCount} combinaciones · {stats.registroCount} registros
          </span>
        </div>
      )}

      <div className="flex flex-col gap-3 p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-900/15 border border-blue-100 dark:border-blue-800/50">
        <div className="flex flex-col sm:flex-row sm:items-end gap-3">
          <div className="flex-1 min-w-0 space-y-1.5">
            <label className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">
              Indicador
            </label>
            <select
              value={selectedIndicadorId}
              onChange={(e) => setSelectedIndicadorId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-blue-200 dark:border-blue-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer truncate"
            >
              <option value={ALL_INDICADORES_ID}>Todos los indicadores</option>
              {indicadoresEnUso.map((ind) => (
                <option key={ind.id} value={ind.id} title={ind.nombre}>
                  {ind.nombre}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2 shrink-0 pb-0.5">
            <button
              type="button"
              onClick={() => setSelectedCampoIds(new Set(availableCampos.map((c) => c.catalogId)))}
              disabled={selectedCampoIds.size === availableCampos.length}
              className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
            >
              Todos
            </button>
            <span className="text-slate-300">|</span>
            <button
              type="button"
              onClick={() => setSelectedCampoIds(new Set())}
              disabled={selectedCampoIds.size === 0}
              className="text-[10px] font-bold uppercase tracking-wider text-slate-500 hover:underline disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
            >
              Ninguno
            </button>
            <span className="text-[10px] font-black text-slate-400">
              ({selectedCampoIds.size}/{availableCampos.length})
            </span>
          </div>
        </div>

        <div className="space-y-1.5">
          <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">Campos</span>
          <div className="flex flex-wrap gap-2">
            {availableCampos.map((opt) => {
              const checked = selectedCampoIds.has(opt.catalogId);
              return (
                <button
                  key={opt.catalogId}
                  type="button"
                  role="checkbox"
                  aria-checked={checked}
                  onClick={() => toggleCampo(opt.catalogId)}
                  className={`inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer ${
                    checked
                      ? "border-blue-500 bg-white dark:bg-blue-950/50 text-blue-800 dark:text-blue-200"
                      : "border-blue-100 dark:border-blue-900/60 bg-white/70 dark:bg-slate-900/50 text-slate-600 dark:text-slate-400 hover:border-blue-300"
                  }`}
                >
                  <span
                    className={`w-4 h-4 shrink-0 rounded-[4px] border-2 flex items-center justify-center ${
                      checked ? "bg-blue-600 border-blue-600" : "border-slate-300 dark:border-slate-600"
                    }`}
                  >
                    {checked && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
                  </span>
                  <span className="text-xs font-semibold whitespace-nowrap">{opt.nombre}</span>
                </button>
              );
            })}
          </div>
        </div>

        <p className="text-[11px] text-slate-500 dark:text-slate-400">
          {selectedCampoIds.size === 0
            ? "Marca al menos un campo para ver las gráficas."
            : selectedIndicadorId === ALL_INDICADORES_ID
              ? "Suma los campos marcados en todos los indicadores (p. ej. todas las «Mujeres»)."
              : "Suma solo los campos marcados del indicador seleccionado."}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <DonutChartCard title="Por Nacionalidad" icon={Users} iconClass="text-amber-500" data={nacData} chartKey={`nac-${filterKey}`} />
        <DonutChartCard title="Por Perfil" icon={Users} iconClass="text-blue-500" data={perfilData} chartKey={`perfil-${filterKey}`} />
        <DonutChartCard title="Por Indicador" icon={PieChartIcon} iconClass="text-blue-500" data={indicadorData} chartKey={`ind-${filterKey}`} legendAccordion />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-4">
          <ProgressBarChartCard title="Combinaciones Nac. × Perfil" icon={BarChart3} iconClass="text-blue-500">
            <AnimatePresence mode="wait">
              <motion.div key={`combo-${filterKey}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <ProgressBarList items={comboProgressItems} getBarColor={(item, idx) => nacPerfilBarColor(item.label, idx)} />
              </motion.div>
            </AnimatePresence>
          </ProgressBarChartCard>
        </div>
        <div className="lg:col-span-8">
          <ProgressBarChartCard title="Por Campo" icon={BarChart3} iconClass="text-blue-500" contentAutoHeight>
            <AnimatePresence mode="wait">
              <motion.div key={`campos-${filterKey}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {selectedCampoIds.size === 0 ? (
                  <p className="text-xs text-slate-400 font-semibold py-8 text-center">Marca al menos un campo para ver el resumen.</p>
                ) : (
                  <ProgressBarList items={campoProgressItems} />
                )}
              </motion.div>
            </AnimatePresence>
          </ProgressBarChartCard>
        </div>
      </div>

      {selectedCampoIds.size > 0 && (
        <div className="space-y-6">
          <CampoDimensionMatrix
            title="Campos × Nacionalidad"
            cornerLabel="Campo ↓ / Nacionalidad →"
            campos={crossCampoNac.campos}
            colIds={crossCampoNac.colIds}
            grid={crossCampoNac.grid}
            getColLabel={crossCampoNac.getColLabel}
            accentClass="text-amber-600 dark:text-amber-400"
          />
          <CampoDimensionMatrix
            title="Campos × Perfil"
            cornerLabel="Campo ↓ / Perfil →"
            campos={crossCampoPerfil.campos}
            colIds={crossCampoPerfil.colIds}
            grid={crossCampoPerfil.grid}
            getColLabel={crossCampoPerfil.getColLabel}
          />
          <CampoDimensionMatrix
            title="Campos × Indicador"
            cornerLabel="Campo ↓ / Indicador →"
            campos={crossCampoInd.campos}
            colIds={crossCampoInd.colIds}
            grid={crossCampoInd.grid}
            getColLabel={crossCampoInd.getColLabel}
          />
        </div>
      )}
    </>
  );

  if (embedded) {
    return <div className="space-y-6">{inner}</div>;
  }

  return (
    <div className="bg-card rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 md:p-5 xl:p-6 w-full min-w-0 space-y-6">
      {inner}
    </div>
  );
}

/* ─── Por política de migración ─── */

export function ReportPoliticaCrossSection({ rows }: { rows: ReportRow[] }) {
  const politicas = useMemo(() => getPoliticasEnDatos(rows), [rows]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (politicas.length === 0) return null;

  return (
    <div className="w-full space-y-3">
      <div className="flex items-center gap-3 px-1">
        <div className="w-2 h-7 bg-blue-600 rounded-full shrink-0" />
        <h3 className="text-base font-black text-slate-800 dark:text-slate-200 uppercase tracking-tight">
          Por política de migración
        </h3>
      </div>

      {politicas.map((pol) => {
        const polRows = rows.filter((r) => r.politicaId === pol.id);
        const isOpen = expandedId === pol.id;
        return (
          <div
            key={pol.id}
            className={`rounded-2xl border overflow-hidden transition-colors ${
              isOpen ? "border-blue-200 dark:border-blue-800 bg-white dark:bg-slate-900/50" : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30"
            }`}
          >
            <button
              type="button"
              onClick={() => setExpandedId(isOpen ? null : pol.id)}
              className="w-full flex items-start gap-3 p-4 text-left cursor-pointer hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
              aria-expanded={isOpen}
            >
              <div className="w-1.5 min-h-10 bg-blue-600 rounded-full shrink-0 self-stretch" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black text-blue-600 dark:text-blue-400">{pol.codigo}</p>
                <p className={`text-xs text-slate-600 dark:text-slate-400 mt-1 leading-snug ${isOpen ? "" : "line-clamp-2"}`}>
                  {pol.descripcion}
                </p>
              </div>
              <ChevronDown className={`w-5 h-5 shrink-0 text-slate-400 transition-transform mt-0.5 ${isOpen ? "rotate-180" : ""}`} />
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden border-t border-slate-100 dark:border-slate-800"
                >
                  <div className="p-4 pt-2">
                    <ReportGlobalCrossSection rows={polRows} embedded />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Detalle por indicador ─── */

export function ReportIndicadorDetailSection({ rows }: { rows: ReportRow[] }) {
  const indicadores = useMemo(() => getIndicadoresEnUso(rows), [rows]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (indicadores.length === 0) return null;

  return (
    <div className="w-full space-y-3">
      <div className="flex items-center gap-3 px-1">
        <div className="w-2 h-7 bg-blue-600 rounded-full shrink-0" />
        <h3 className="text-base font-black text-slate-800 dark:text-slate-200 uppercase tracking-tight">
          Detalle por indicador
        </h3>
      </div>

      {indicadores.map((ind) => {
        const indRows = rows.filter((r) => r.indicadorId === ind.id);
        const crossRows = aggregateReportByNacPerfil(indRows);
        const campos = getCampoTotalsForIndicador(indRows);
        const maxCampoTotal = Math.max(...campos.map((c) => c.total), 1);
        const nacTotals = buildNacTotalsMap(indRows);
        const nacSorted = Array.from(nacTotals.values())
          .filter((d) => d.value > 0)
          .sort((a, b) => b.value - a.value);
        let nacOtherIdx = 0;
        const nacDonut: ReportChartSlice[] = nacSorted.map((d) => ({
          ...d,
          color: isGuatemalteco(d.name)
            ? GUATEMALTECO_CELESTE
            : nationalityColor(d.name, nacOtherIdx++),
        }));
        const isOpen = expandedId === ind.id;

        return (
          <div
            key={ind.id}
            className={`rounded-2xl border overflow-hidden ${
              isOpen ? "border-blue-200 dark:border-blue-800 bg-white dark:bg-slate-900/50" : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30"
            }`}
          >
            <button
              type="button"
              onClick={() => setExpandedId(isOpen ? null : ind.id)}
              className="w-full flex items-start gap-3 p-4 text-left cursor-pointer hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
              aria-expanded={isOpen}
            >
              <div className="w-1.5 min-h-10 bg-blue-600 rounded-full shrink-0 self-stretch" />
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-black text-slate-800 dark:text-slate-200 leading-snug ${isOpen ? "" : "line-clamp-2"}`}>
                  {ind.nombre}
                </p>
                <p className="text-[10px] font-bold text-slate-400 mt-1">
                  {crossRows.length} {crossRows.length === 1 ? "combinación" : "combinaciones"}
                </p>
              </div>
              <ChevronDown className={`w-5 h-5 shrink-0 text-slate-400 transition-transform mt-0.5 ${isOpen ? "rotate-180" : ""}`} />
            </button>

            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-6 space-y-6 border-t border-slate-100 dark:border-slate-800 pt-4">
                    <NacPerfilMatrix rows={indRows} />

                    <div className="bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                      <div className="flex items-center gap-2 px-5 py-3 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                        <Table2 className="w-4 h-4 text-slate-400" />
                        <h5 className="text-xs font-black text-slate-400 uppercase tracking-widest">Resumen cruzado por campos</h5>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-slate-100 dark:border-slate-800">
                              <th className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider">Nacionalidad</th>
                              <th className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider">Perfil</th>
                              {campos.map((c) => (
                                <th key={c.id} className="px-4 py-3 text-right text-[10px] font-black text-slate-400 uppercase tracking-wider">
                                  {c.nombre}
                                </th>
                              ))}
                              <th className="px-4 py-3 text-right text-[10px] font-black text-blue-500 uppercase tracking-wider">Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {crossRows.map((row, rIdx) => {
                              const nacLabel = indRows.find((r) => (r.nacionalidadId || "__none__") === row.nacionalidadId)?.nacionalidadNombre || "Sin especificar";
                              const perfLabel = indRows.find((r) => (r.perfilId || "__none__") === row.perfilId)?.perfilNombre || "Sin especificar";
                              const rowTotal = Object.values(row.valores).reduce((s, v) => s + v, 0);
                              return (
                                <tr key={`${row.nacionalidadId}-${row.perfilId}`} className={`border-b border-slate-50 dark:border-slate-800/50 ${rIdx % 2 === 0 ? "bg-white dark:bg-transparent" : "bg-slate-50/50 dark:bg-slate-900/30"}`}>
                                  <td className="px-4 py-2.5 font-semibold text-amber-600 dark:text-amber-400">{nacLabel}</td>
                                  <td className="px-4 py-2.5 font-semibold text-blue-600 dark:text-blue-400">{perfLabel}</td>
                                  {campos.map((c) => (
                                    <td key={c.id} className="px-4 py-2.5 text-right font-mono font-bold text-slate-700 dark:text-slate-300">
                                      {row.valores[c.id] ?? 0}
                                    </td>
                                  ))}
                                  <td className="px-4 py-2.5 text-right font-black text-blue-600">{rowTotal}</td>
                                </tr>
                              );
                            })}
                            <tr className="bg-blue-50/50 dark:bg-blue-900/10 border-t-2 border-blue-200 dark:border-blue-800">
                              <td colSpan={2} className="px-4 py-3 font-black text-xs text-slate-500 uppercase tracking-wider">Totales</td>
                              {campos.map((c) => (
                                <td key={c.id} className="px-4 py-3 text-right font-black text-slate-800 dark:text-slate-200">{c.total}</td>
                              ))}
                              <td className="px-4 py-3 text-right font-black text-blue-700 dark:text-blue-400 text-base">
                                {campos.reduce((s, c) => s + c.total, 0)}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-white dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-5">
                        <div className="flex items-center gap-2">
                          <BarChart3 className="w-4 h-4 text-blue-500" />
                          <h5 className="text-xs font-black text-slate-400 uppercase tracking-widest">Por Campo</h5>
                        </div>
                        <div className="space-y-4">
                          {campos.map((c, cIdx) => {
                            const pct = (c.total / maxCampoTotal) * 100;
                            const barColor = softBarColor(cIdx);
                            return (
                              <div key={c.id} className="space-y-1.5">
                                <div className="flex justify-between items-center">
                                  <span className="text-[10px] font-bold text-slate-500 uppercase truncate max-w-[70%]">{c.nombre}</span>
                                  <span className="text-xs font-black text-slate-900 dark:text-white">{c.total}</span>
                                </div>
                                <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${pct}%` }}
                                    transition={{ duration: 0.8, ease: "easeOut", delay: cIdx * 0.1 }}
                                    className="h-full rounded-full"
                                    style={{ backgroundColor: barColor }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      <DonutChartCard
                        title="Por Nacionalidad"
                        icon={Users}
                        iconClass="text-amber-500"
                        data={nacDonut}
                        chartKey={`ind-nac-${ind.id}`}
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
