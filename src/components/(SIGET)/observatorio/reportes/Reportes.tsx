"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  Calendar,
  PieChart as PieChartIcon,
  Users,
  Building2,
  BarChart3,
  Loader2,
  TrendingUp,
  Filter,
  Check,
  Search,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  getReportData,
  getReportSectores,
  getReportOrganizaciones,
  getReportPoliticas,
  type ReportRow,
} from "./lib/reportes-actions";
import {
  ReportGlobalCrossSection,
  ReportPoliticaCrossSection,
  ReportIndicadorDetailSection,
} from "./ReportCrossSections";

/* ──────────────────────────────────────────────────────────────
   Constants & Helpers
   ────────────────────────────────────────────────────────────── */

import {
  GUATEMALTECO_CELESTE,
  chartColor,
  indicadorColor,
  isGuatemalteco,
  nationalityColor,
  perfilColor,
  softBarColor,
} from "./lib/chart-colors";

const MONTH_NAMES = [
  "", "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
];

const MONTH_FULL = [
  "", "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const tooltipStyle = {
  borderRadius: "12px",
  border: "1px solid #e2e8f0",
  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
  color: "#0f172a",
  fontSize: "12px",
  fontWeight: 600,
};

function fmt(n: number) {
  return new Intl.NumberFormat("es-GT").format(n);
}

/** Ancho del eje Y según la etiqueta más larga (evita hueco a la izquierda en barras horizontales) */
function calcCategoryAxisWidth(labels: string[], min = 64, max = 220): number {
  const longest = labels.reduce((m, s) => Math.max(m, s.length), 0);
  return Math.min(max, Math.max(min, longest * 6 + 8));
}

function truncateLabel(label: string, maxLen = 32): string {
  return label.length > maxLen ? `${label.slice(0, maxLen)}…` : label;
}

type FilterModalKind = "politica" | "sector" | "org";

interface FilterPickerItem {
  id: string;
  label: string;
  sublabel?: string;
}

interface FilterPickerGroup {
  groupId: string;
  groupLabel: string;
  items: FilterPickerItem[];
}

function policyDescriptionStart(text: string, maxLen = 90): string {
  const trimmed = text.trim();
  if (trimmed.length <= maxLen) return trimmed;
  return `${trimmed.slice(0, maxLen).trim()}…`;
}

function filterButtonSubtitle(
  selectedIds: string[],
  items: { id: string; label: string }[],
  allLabel: string
): string {
  if (selectedIds.length === 0) return allLabel;
  if (selectedIds.length === 1) {
    const item = items.find((i) => i.id === selectedIds[0]);
    return item ? truncateLabel(item.label, 28) : "1 seleccionado";
  }
  return `${selectedIds.length} seleccionados`;
}

function currentMonthInputValue(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

/* ──────────────────────────────────────────────────────────────
   Interfaces
   ────────────────────────────────────────────────────────────── */

interface ReportesProps {
  onBack: () => void;
}

interface CatalogItem {
  id: string;
  nombre: string;
}

interface PoliticaItem {
  id: string;
  codigo: string;
  descripcion: string;
  sector_id: string;
}

/* ──────────────────────────────────────────────────────────────
   Main Component
   ────────────────────────────────────────────────────────────── */

export default function Reportes({ onBack }: ReportesProps) {
  // ── Data state ──
  const [allRows, setAllRows] = useState<ReportRow[]>([]);
  const [sectores, setSectores] = useState<CatalogItem[]>([]);
  const [organizaciones, setOrganizaciones] = useState<CatalogItem[]>([]);
  const [politicas, setPoliticas] = useState<PoliticaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Filter state ──
  const [selectedSectorIds, setSelectedSectorIds] = useState<string[]>([]);
  const [selectedOrgIds, setSelectedOrgIds] = useState<string[]>([]);
  const [selectedPoliticaIds, setSelectedPoliticaIds] = useState<string[]>([]);
  const [openFilterModal, setOpenFilterModal] = useState<FilterModalKind | null>(null);
  const [dateMode, setDateMode] = useState<"Todo" | "Mes" | "Rango">("Mes");
  const [singleMonth, setSingleMonth] = useState(currentMonthInputValue);
  const [startMonth, setStartMonth] = useState("");
  const [endMonth, setEndMonth] = useState("");

  // ── Chart tab state ──
  const [activeChartTab, setActiveChartTab] = useState<"campos" | "nacionalidad" | "perfil" | "indicador">("campos");

  // ── Load data ──
  useEffect(() => {
    async function load() {
      try {
        const [rows, secs, orgs, pols] = await Promise.all([
          getReportData(),
          getReportSectores(),
          getReportOrganizaciones(),
          getReportPoliticas(),
        ]);
        setAllRows(rows);
        setSectores(secs);
        setOrganizaciones(orgs);
        setPoliticas(pols);
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Error al cargar datos");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // ── Filtered organizations & politicas based on sector ──
  const filteredOrgs = useMemo(() => {
    if (selectedSectorIds.length === 0) return organizaciones;
    const orgIds = new Set(
      allRows.filter((r) => selectedSectorIds.includes(r.sectorId)).map((r) => r.organizacionId)
    );
    return organizaciones.filter((o) => orgIds.has(o.id));
  }, [organizaciones, allRows, selectedSectorIds]);


  const politicaPickerGroups = useMemo<FilterPickerGroup[]>(() => {
    if (selectedSectorIds.length === 0) return [];

    return selectedSectorIds
      .map((sectorId) => {
        const sector = sectores.find((s) => s.id === sectorId);
        const items = politicas
          .filter((p) => p.sector_id === sectorId)
          .sort((a, b) => a.codigo.localeCompare(b.codigo, "es"))
          .map((p) => ({
            id: p.id,
            label: p.codigo,
            sublabel: policyDescriptionStart(p.descripcion),
          }));

        return {
          groupId: sectorId,
          groupLabel: sector?.nombre ?? "Sector",
          items,
        };
      })
      .filter((g) => g.items.length > 0);
  }, [selectedSectorIds, sectores, politicas]);

  const politicaPickerItems = useMemo<FilterPickerItem[]>(
    () => politicaPickerGroups.flatMap((g) => g.items),
    [politicaPickerGroups]
  );

  const sectorPickerItems = useMemo<FilterPickerItem[]>(
    () => sectores.map((s) => ({ id: s.id, label: s.nombre })),
    [sectores]
  );

  const orgPickerItems = useMemo<FilterPickerItem[]>(
    () => filteredOrgs.map((o) => ({ id: o.id, label: o.nombre })),
    [filteredOrgs]
  );

  // ── Apply all filters ──
  const filteredRows = useMemo(() => {
    let rows = allRows;

    if (selectedSectorIds.length > 0) {
      rows = rows.filter((r) => selectedSectorIds.includes(r.sectorId));
    }
    if (selectedOrgIds.length > 0) {
      rows = rows.filter((r) => selectedOrgIds.includes(r.organizacionId));
    }
    if (selectedPoliticaIds.length > 0) {
      rows = rows.filter((r) => selectedPoliticaIds.includes(r.politicaId));
    }

    if (dateMode === "Mes" && singleMonth) {
      const [y, m] = singleMonth.split("-").map(Number);
      rows = rows.filter(r => r.anio === y && r.mes === m);
    } else if (dateMode === "Rango" && startMonth && endMonth) {
      const [sy, sm] = startMonth.split("-").map(Number);
      const [ey, em] = endMonth.split("-").map(Number);
      const startVal = sy * 12 + sm;
      const endVal = ey * 12 + em;
      rows = rows.filter(r => {
        const val = r.anio * 12 + r.mes;
        return val >= startVal && val <= endVal;
      });
    }

    return rows;
  }, [allRows, selectedSectorIds, selectedOrgIds, selectedPoliticaIds, dateMode, singleMonth, startMonth, endMonth]);

  // ── KPIs ──
  const kpis = useMemo(() => {
    const totalAtenciones = filteredRows.reduce((s, r) => s + r.cantidad, 0);
    const totalRegistros = new Set(filteredRows.map(r => r.registroId)).size;
    const totalOrgs = new Set(filteredRows.map(r => r.organizacionId)).size;
    return { totalAtenciones, totalRegistros, totalOrgs };
  }, [filteredRows]);

  // ── Donut chart data by different dimensions ──
  const campoDonutData = useMemo(() => {
    const map = new Map<string, { nombre: string; total: number; orden: number }>();
    for (const r of filteredRows) {
      const key = r.campoId;
      const existing = map.get(key);
      if (existing) {
        existing.total += r.cantidad;
      } else {
        map.set(key, { nombre: r.campoNombre, total: r.cantidad, orden: r.campoOrden });
      }
    }
    return Array.from(map.values())
      .sort((a, b) => a.orden - b.orden)
      .map((d, i) => ({ name: d.nombre, value: d.total, color: softBarColor(i) }));
  }, [filteredRows]);

  const nacDonutData = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of filteredRows) {
      const key = r.nacionalidadNombre || "Sin especificar";
      map.set(key, (map.get(key) || 0) + r.cantidad);
    }
    const sorted = Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
    let otherIdx = 0;
    return sorted.map(([name, value]) => ({
      name,
      value,
      color: isGuatemalteco(name) ? GUATEMALTECO_CELESTE : nationalityColor(name, otherIdx++),
    }));
  }, [filteredRows]);

  const perfilDonutData = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of filteredRows) {
      const key = r.perfilNombre || "Sin especificar";
      map.set(key, (map.get(key) || 0) + r.cantidad);
    }
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name, value], i) => ({ name, value, color: perfilColor(i) }));
  }, [filteredRows]);

  const indicadorDonutData = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of filteredRows) {
      map.set(r.indicadorNombre, (map.get(r.indicadorNombre) || 0) + r.cantidad);
    }
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name, value], i) => ({ name, value, color: indicadorColor(i) }));
  }, [filteredRows]);

  const activeDonutData = activeChartTab === "campos" ? campoDonutData
    : activeChartTab === "nacionalidad" ? nacDonutData
    : activeChartTab === "perfil" ? perfilDonutData
    : indicadorDonutData;

  const activeDonutTotal = activeDonutData.reduce((s, d) => s + d.value, 0);

  // ── Bar chart: by organization ──
  const orgBarData = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of filteredRows) {
      map.set(r.organizacionNombre, (map.get(r.organizacionNombre) || 0) + r.cantidad);
    }
    return Array.from(map.entries())
      .map(([org, total]) => ({ org, total }))
      .sort((a, b) => b.total - a.total);
  }, [filteredRows]);

  const orgYAxisWidth = useMemo(
    () => calcCategoryAxisWidth(orgBarData.map((d) => d.org)),
    [orgBarData]
  );

  // ── Bar chart: monthly trend ──
  const monthlyData = useMemo(() => {
    const map = new Map<string, { key: string; label: string; total: number; sortVal: number }>();
    for (const r of filteredRows) {
      const key = `${r.anio}-${String(r.mes).padStart(2, "0")}`;
      const label = `${MONTH_NAMES[r.mes]} ${r.anio}`;
      const existing = map.get(key);
      if (existing) {
        existing.total += r.cantidad;
      } else {
        map.set(key, { key, label, total: r.cantidad, sortVal: r.anio * 100 + r.mes });
      }
    }
    return Array.from(map.values()).sort((a, b) => a.sortVal - b.sortVal);
  }, [filteredRows]);

  // ── Cross table: Campo × Nacionalidad ──
  // (reemplazado por ReportGlobalCrossSection — matrices Campo×Dimensión)

  // ── Resumen table: by org ──
  const orgSummaryData = useMemo(() => {
    const map = new Map<string, {
      sectorNombre: string;
      orgNombre: string;
      total: number;
      campos: Map<string, number>;
    }>();

    // Collect unique campo names in order
    const campoNamesOrdered: string[] = [];
    const campoNameSet = new Set<string>();

    for (const r of filteredRows) {
      const key = r.organizacionId;
      const existing = map.get(key);
      if (existing) {
        existing.total += r.cantidad;
        existing.campos.set(r.campoNombre, (existing.campos.get(r.campoNombre) || 0) + r.cantidad);
      } else {
        const campos = new Map<string, number>();
        campos.set(r.campoNombre, r.cantidad);
        map.set(key, {
          sectorNombre: r.sectorNombre,
          orgNombre: r.organizacionNombre,
          total: r.cantidad,
          campos,
        });
      }
      if (!campoNameSet.has(r.campoNombre)) {
        campoNameSet.add(r.campoNombre);
        campoNamesOrdered.push(r.campoNombre);
      }
    }

    const rows = Array.from(map.values()).sort((a, b) => b.total - a.total);
    return { rows, campoNames: campoNamesOrdered };
  }, [filteredRows]);

  const applySectorFilter = useCallback(
    (ids: string[]) => {
      setSelectedSectorIds(ids);
      if (ids.length === 0) {
        setSelectedPoliticaIds([]);
        return;
      }
      const validOrgIds = new Set(
        allRows.filter((r) => ids.includes(r.sectorId)).map((r) => r.organizacionId)
      );
      setSelectedOrgIds((prev) => prev.filter((id) => validOrgIds.has(id)));
      const validPolIds = new Set(
        politicas.filter((p) => ids.includes(p.sector_id)).map((p) => p.id)
      );
      setSelectedPoliticaIds((prev) => prev.filter((id) => validPolIds.has(id)));
    },
    [allRows, politicas]
  );

  const dateFilterLabel = useMemo(() => {
    if (dateMode === "Mes" && singleMonth) {
      const [y, m] = singleMonth.split("-").map(Number);
      return `${MONTH_FULL[m]} ${y}`;
    }
    if (dateMode === "Rango" && startMonth && endMonth) {
      const [sy, sm] = startMonth.split("-").map(Number);
      const [ey, em] = endMonth.split("-").map(Number);
      return `${MONTH_NAMES[sm]} ${sy} – ${MONTH_NAMES[em]} ${ey}`;
    }
    return null;
  }, [dateMode, singleMonth, startMonth, endMonth]);

  const modalConfig = useMemo(() => {
    if (openFilterModal === "politica") {
      return {
        title: "Filtrar por política de migración",
        description:
          selectedSectorIds.length === 0
            ? "Primero seleccione uno o más sectores."
            : "Políticas de migración disponibles según los sectores elegidos.",
        groups: politicaPickerGroups,
        items: [] as FilterPickerItem[],
        selectedIds: selectedPoliticaIds,
        onApply: setSelectedPoliticaIds,
        wide: true,
        emptyMessage:
          selectedSectorIds.length === 0
            ? "Seleccione al menos un sector para ver las políticas de migración."
            : "No hay políticas de migración activas en los sectores seleccionados.",
      };
    }
    if (openFilterModal === "sector") {
      return {
        title: "Filtrar por sector",
        description: "Seleccione uno o varios sectores. Las políticas de migración dependen de esta selección.",
        groups: [] as FilterPickerGroup[],
        items: sectorPickerItems,
        selectedIds: selectedSectorIds,
        onApply: applySectorFilter,
        wide: false,
        emptyMessage: "No hay sectores disponibles.",
      };
    }
    if (openFilterModal === "org") {
      return {
        title: "Filtrar por organización",
        description: "Seleccione una o varias organizaciones.",
        groups: [] as FilterPickerGroup[],
        items: orgPickerItems,
        selectedIds: selectedOrgIds,
        onApply: setSelectedOrgIds,
        wide: false,
        emptyMessage: "No hay organizaciones para los sectores seleccionados.",
      };
    }
    return null;
  }, [
    openFilterModal,
    politicaPickerGroups,
    sectorPickerItems,
    orgPickerItems,
    selectedPoliticaIds,
    selectedSectorIds,
    selectedOrgIds,
    applySectorFilter,
  ]);

  /* ──────────────────────────────────────────────────────────────
     RENDER
     ────────────────────────────────────────────────────────────── */

  if (loading) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-32 gap-4">
        <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
        <p className="text-sm font-bold text-slate-500">Cargando reportes...</p>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-32 gap-4">
        <p className="text-sm font-bold text-red-500">Error: {error}</p>
        <button onClick={onBack} className="px-6 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold text-sm cursor-pointer">Volver</button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full min-w-0 max-w-none pb-10 space-y-6"
    >
      {/* Header */}
      <div className="flex items-center gap-4 mb-2">
        <button
          onClick={onBack}
          className="p-2.5 rounded-xl bg-card border border-border hover:bg-muted transition-colors shadow-sm cursor-pointer shrink-0"
        >
          <ChevronLeft className="w-5 h-5 text-muted-foreground" />
        </button>
        <div className="min-w-0">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">Análisis de Datos</h2>
          <p className="text-xs sm:text-sm text-slate-500">Reportes y cruce de variables del observatorio</p>
        </div>
      </div>

      {/* ═══ FILTERS ═══ */}
      <div className="bg-card rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 md:p-6">
        <div className="flex items-center gap-2 mb-5">
          <Filter className="w-4 h-4 text-slate-500 dark:text-slate-400" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Filtros</h3>
        </div>

        {/* Filtro por fecha */}
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              Filtro por fecha
            </p>
            {dateFilterLabel && (
              <span className="text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 text-right shrink-0">
                {dateFilterLabel}
              </span>
            )}
          </div>

          <div className="flex flex-col gap-2 w-full">
            <div className="flex w-full bg-muted/70 dark:bg-muted/30 p-1 rounded-xl border border-border/40">
              {(["Todo", "Mes", "Rango"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setDateMode(mode)}
                  className={`flex-1 px-2 sm:px-4 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    dateMode === mode
                      ? "bg-background text-foreground shadow-sm ring-1 ring-border/60"
                      : "bg-transparent text-muted-foreground hover:text-foreground hover:bg-muted/60 dark:hover:bg-muted/50"
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {dateMode === "Mes" && (
                <motion.div key="mes" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="w-full">
                  <div className="relative flex items-center">
                    <Calendar className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none z-10" />
                    {!singleMonth && (
                      <span className="absolute left-10 text-slate-400 text-xs font-bold pointer-events-none z-10">Seleccionar mes</span>
                    )}
                    <input
                      type="month"
                      value={singleMonth}
                      onChange={(e) => setSingleMonth(e.target.value)}
                      className={`w-full pl-10 pr-3 py-2.5 rounded-xl border border-border bg-muted/40 dark:bg-background text-xs font-bold focus:outline-none focus:ring-2 focus:ring-muted-foreground/30 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer ${singleMonth ? "text-foreground" : "text-transparent"}`}
                    />
                  </div>
                </motion.div>
              )}
              {dateMode === "Rango" && (
                <motion.div
                  key="rango"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex flex-col sm:flex-row sm:items-center gap-2 w-full"
                >
                  <div className="relative flex-1 flex items-center min-w-0">
                    <Calendar className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none z-10" />
                    {!startMonth && <span className="absolute left-10 text-slate-400 text-[10px] font-bold pointer-events-none z-10">Inicio</span>}
                    <input
                      type="month"
                      value={startMonth}
                      onChange={(e) => setStartMonth(e.target.value)}
                      className={`w-full pl-10 pr-2 py-2.5 rounded-xl border border-border bg-muted/40 dark:bg-background text-xs font-bold focus:outline-none focus:ring-2 focus:ring-muted-foreground/30 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer ${startMonth ? "text-foreground" : "text-transparent"}`}
                    />
                  </div>
                  <span className="text-xs font-bold text-slate-400 shrink-0 text-center sm:px-1">al</span>
                  <div className="relative flex-1 flex items-center min-w-0">
                    <Calendar className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none z-10" />
                    {!endMonth && <span className="absolute left-10 text-slate-400 text-[10px] font-bold pointer-events-none z-10">Final</span>}
                    <input
                      type="month"
                      value={endMonth}
                      onChange={(e) => setEndMonth(e.target.value)}
                      className={`w-full pl-10 pr-2 py-2.5 rounded-xl border border-border bg-muted/40 dark:bg-background text-xs font-bold focus:outline-none focus:ring-2 focus:ring-muted-foreground/30 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer ${endMonth ? "text-foreground" : "text-transparent"}`}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="my-5 border-t border-border/60" />

        {/* Sector, política y organización */}
        <div className="space-y-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            Sector, política y organización
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <FilterPickerButton
            label="Sector"
            subtitle={filterButtonSubtitle(selectedSectorIds, sectorPickerItems, "Todos los sectores")}
            active={selectedSectorIds.length > 0}
            onClick={() => setOpenFilterModal("sector")}
          />
          <FilterPickerButton
            label="Política de Migración"
            subtitle={
              selectedSectorIds.length === 0
                ? "Seleccione sector primero"
                : filterButtonSubtitle(selectedPoliticaIds, politicaPickerItems, "Todas las políticas de migración")
            }
            active={selectedPoliticaIds.length > 0}
            dimmed={selectedSectorIds.length === 0}
            onClick={() => {
              if (selectedSectorIds.length === 0) {
                setOpenFilterModal("sector");
                return;
              }
              setOpenFilterModal("politica");
            }}
          />
          <FilterPickerButton
            label="Organización"
            subtitle={filterButtonSubtitle(selectedOrgIds, orgPickerItems, "Todas las organizaciones")}
            active={selectedOrgIds.length > 0}
            onClick={() => setOpenFilterModal("org")}
          />
          </div>
        </div>

        {modalConfig && (
          <FilterPickerModal
            isOpen={openFilterModal !== null}
            onClose={() => setOpenFilterModal(null)}
            title={modalConfig.title}
            description={modalConfig.description}
            items={modalConfig.items}
            groups={modalConfig.groups}
            emptyMessage={modalConfig.emptyMessage}
            selectedIds={modalConfig.selectedIds}
            wide={modalConfig.wide}
            onApply={(ids) => {
              modalConfig.onApply(ids);
              setOpenFilterModal(null);
            }}
          />
        )}
      </div>

      {/* ═══ DONUT CHART WITH TABS + KPIs ═══ */}
      {filteredRows.length > 0 ? (
        <>
          <div className="bg-card rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 md:p-5 xl:p-6 w-full min-w-0">
            <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <PieChartIcon className="w-5 h-5 text-slate-500 dark:text-slate-400" /> Desglose por Dimensión
                </h3>
                <p className="text-xs text-slate-500 mt-1">Seleccione una dimensión para visualizar el desglose de atenciones.</p>
              </div>
              <div className="grid grid-cols-2 gap-1 sm:flex sm:flex-wrap bg-muted/70 dark:bg-muted/30 border border-border/40 p-1 rounded-xl w-full xl:w-auto">
                {(["campos", "nacionalidad", "perfil", "indicador"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveChartTab(tab)}
                    className={`px-3 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer capitalize sm:flex-none ${
                      activeChartTab === tab
                        ? "bg-background text-foreground shadow-sm ring-1 ring-border/60"
                        : "bg-transparent text-muted-foreground hover:text-foreground hover:bg-muted/60 dark:hover:bg-muted/50"
                    }`}
                  >
                    {tab === "campos" ? "Campos" : tab === "nacionalidad" ? "Nacionalidad" : tab === "perfil" ? "Perfil" : "Indicador"}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[10.5rem_minmax(0,1fr)_minmax(0,1.15fr)] gap-4 xl:gap-6 items-stretch xl:items-center">
              <div className="grid grid-cols-3 xl:grid-cols-1 gap-2 xl:gap-3">
                <KpiCard compact icon={Users} label="Total Atenciones" value={fmt(kpis.totalAtenciones)} color="blue" />
                <KpiCard compact icon={BarChart3} label="Registros" value={fmt(kpis.totalRegistros)} color="sky" />
                <KpiCard compact icon={Building2} label="Organizaciones" value={fmt(kpis.totalOrgs)} color="cyan" />
              </div>

              <div className="h-[260px] xl:h-[300px] w-full min-w-0">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeChartTab}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.3 }}
                    className="h-full w-full"
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={activeDonutData}
                          cx="50%"
                          cy="50%"
                          innerRadius={70}
                          outerRadius={110}
                          paddingAngle={activeDonutData.length > 1 ? 4 : 0}
                          dataKey="value"
                          stroke="none"
                        >
                          {activeDonutData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value: any) => fmt(Number(value))}
                          contentStyle={tooltipStyle}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </motion.div>
                </AnimatePresence>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {activeDonutData.map((item, index) => {
                  const pct = activeDonutTotal > 0 ? ((item.value / activeDonutTotal) * 100).toFixed(1) : "0";
                  return (
                    <div key={index} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-3 h-3 rounded-full shadow-sm shrink-0" style={{ backgroundColor: item.color }} />
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        <span className="text-xs font-bold text-slate-400">{pct}%</span>
                        <span className="text-sm font-black text-slate-900 dark:text-white font-mono">{fmt(item.value)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ═══ CHARTS: org + tendencia mensual ═══ */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 w-full min-w-0">
            {/* By Org */}
            <div className="bg-card rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 md:p-5 xl:p-6 w-full min-w-0">
              <h3 className="text-lg font-bold mb-4 text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-500" /> Atenciones por Organización
              </h3>
              {orgBarData.length > 0 ? (
                <div className="w-full min-w-0" style={{ height: Math.max(250, orgBarData.length * 50) }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={orgBarData}
                      layout="vertical"
                      margin={{ left: 0, right: 8, top: 4, bottom: 4 }}
                      barCategoryGap="18%"
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#64748b" opacity={0.15} />
                      <XAxis
                        type="number"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#64748b", fontSize: 11 }}
                        tickFormatter={(v) => fmt(Number(v))}
                      />
                      <YAxis
                        dataKey="org"
                        type="category"
                        axisLine={false}
                        tickLine={false}
                        width={orgYAxisWidth}
                        tick={{ fill: "#64748b", fontSize: 11 }}
                        tickFormatter={(v) => truncateLabel(String(v))}
                      />
                      <Tooltip
                        cursor={{ fill: "rgba(100,116,139,0.05)" }}
                        contentStyle={tooltipStyle}
                        formatter={(v) => fmt(Number(v))}
                        labelFormatter={(label) => String(label)}
                      />
                      <Bar dataKey="total" name="Total" radius={[0, 6, 6, 0]} barSize={22}>
                        {orgBarData.map((_, index) => (
                          <Cell key={`org-bar-${index}`} fill={chartColor(index)} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyState />
              )}
            </div>

            {/* Monthly trend — gráfica de puntos */}
            <div className="bg-card rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 md:p-5 xl:p-6 w-full min-w-0">
              <h3 className="text-lg font-bold mb-4 text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-500" /> Tendencia Mensual
              </h3>
              {monthlyData.length > 0 ? (
                <div className="h-[300px] w-full min-w-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyData} margin={{ left: 4, right: 12, top: 12, bottom: 4 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#64748b" opacity={0.15} />
                      <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 11 }} dy={5} />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#64748b", fontSize: 11 }}
                        width={48}
                        tickFormatter={(v) => fmt(Number(v))}
                      />
                      <Tooltip
                        cursor={{ stroke: "#94a3b8", strokeWidth: 1, strokeDasharray: "4 4" }}
                        contentStyle={tooltipStyle}
                        formatter={(v) => [fmt(Number(v)), "Total Atenciones"]}
                      />
                      <Line
                        type="monotone"
                        dataKey="total"
                        name="Total Atenciones"
                        stroke="transparent"
                        strokeWidth={0}
                        dot={({ cx, cy, index }) => {
                          if (cx == null || cy == null) return null;
                          const fill = chartColor(index ?? 0);
                          return (
                            <circle cx={cx} cy={cy} r={6} fill={fill} stroke="#fff" strokeWidth={2} />
                          );
                        }}
                        activeDot={({ cx, cy, index }) => {
                          if (cx == null || cy == null) return null;
                          const fill = chartColor(index ?? 0);
                          return (
                            <circle cx={cx} cy={cy} r={8} fill={fill} stroke="#fff" strokeWidth={2} />
                          );
                        }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyState />
              )}
            </div>
          </div>

          <ReportGlobalCrossSection rows={filteredRows} />

          <ReportPoliticaCrossSection rows={filteredRows} />

          <ReportIndicadorDetailSection rows={filteredRows} />

          {/* ═══ SUMMARY TABLE ═══ */}
          <div className="bg-card rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-4 md:p-6 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">Resumen General por Organización</h3>
              <p className="text-xs text-slate-500 mt-1">Desglose de atenciones en todos los sectores participantes.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-4 xl:px-6 py-4 sticky left-0 bg-slate-50 dark:bg-slate-900 z-10">Sector</th>
                    <th className="px-4 xl:px-6 py-4">Organización</th>
                    {orgSummaryData.campoNames.map((cn) => (
                      <th key={cn} className="px-3 py-4 text-right whitespace-nowrap">{cn}</th>
                    ))}
                    <th className="px-4 xl:px-6 py-4 text-right font-black text-blue-600">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {orgSummaryData.rows.map((row, i) => (
                    <tr key={i} className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors last:border-0">
                      <td className="px-4 xl:px-6 py-4 font-semibold text-slate-700 dark:text-slate-300 sticky left-0 bg-inherit z-10 whitespace-nowrap">{row.sectorNombre}</td>
                      <td className="px-4 xl:px-6 py-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">{row.orgNombre}</td>
                      {orgSummaryData.campoNames.map((cn) => (
                        <td key={cn} className="px-3 py-4 text-right font-mono font-medium text-slate-700 dark:text-slate-300">{fmt(row.campos.get(cn) || 0)}</td>
                      ))}
                      <td className="px-4 xl:px-6 py-4 text-right font-mono font-black text-blue-600 dark:text-blue-400">{fmt(row.total)}</td>
                    </tr>
                  ))}
                  {/* Totals */}
                  <tr className="bg-blue-50/50 dark:bg-blue-900/10 border-t-2 border-blue-200 dark:border-blue-800">
                    <td className="px-4 xl:px-6 py-4 font-black text-xs text-slate-500 uppercase tracking-wider sticky left-0 bg-inherit z-10" colSpan={2}>Total General</td>
                    {orgSummaryData.campoNames.map((cn) => {
                      const colSum = orgSummaryData.rows.reduce((s, r) => s + (r.campos.get(cn) || 0), 0);
                      return <td key={cn} className="px-3 py-4 text-right font-mono font-black text-slate-800 dark:text-slate-200">{fmt(colSum)}</td>;
                    })}
                    <td className="px-4 xl:px-6 py-4 text-right font-mono font-black text-blue-700 dark:text-blue-400">
                      {fmt(orgSummaryData.rows.reduce((s, r) => s + r.total, 0))}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-card rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-12 flex flex-col items-center justify-center text-center">
          <BarChart3 className="w-16 h-16 text-slate-200 dark:text-slate-800 mb-4" />
          <h3 className="text-lg font-bold text-slate-600 dark:text-slate-400">Sin datos para mostrar</h3>
          <p className="text-sm text-slate-400 mt-2">No se encontraron registros con los filtros seleccionados. Ingrese datos a través de los formularios o ajuste los filtros.</p>
        </div>
      )}
    </motion.div>
  );
}

/* ──────────────────────────────────────────────────────────────
   Sub-components
   ────────────────────────────────────────────────────────────── */

function KpiCard({ icon: Icon, label, value, color, compact }: {
  icon: typeof Users;
  label: string;
  value: string;
  color: "blue" | "sky" | "cyan" | "amber";
  compact?: boolean;
}) {
  const colorMap = {
    blue: { bg: "bg-blue-50 dark:bg-blue-900/20", icon: "text-blue-600", border: "border-blue-100 dark:border-blue-800/50" },
    sky: { bg: "bg-sky-50 dark:bg-sky-900/20", icon: "text-sky-600", border: "border-sky-100 dark:border-sky-800/50" },
    cyan: { bg: "bg-cyan-50 dark:bg-cyan-900/20", icon: "text-cyan-600", border: "border-cyan-100 dark:border-cyan-800/50" },
    amber: { bg: "bg-amber-50 dark:bg-amber-900/20", icon: "text-amber-500", border: "border-amber-100 dark:border-amber-800/50" },
  };
  const c = colorMap[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${c.bg} rounded-2xl border ${c.border} ${compact ? "p-3 space-y-1" : "p-4 md:p-5 space-y-2"}`}
    >
      <div className="flex items-center gap-1.5">
        <Icon className={`${compact ? "w-3.5 h-3.5" : "w-4 h-4"} ${c.icon}`} />
        <span className={`font-black text-slate-400 uppercase tracking-widest leading-tight ${compact ? "text-[9px]" : "text-[10px]"}`}>
          {label}
        </span>
      </div>
      <p className={`font-black text-slate-900 dark:text-white font-mono ${compact ? "text-xl xl:text-2xl" : "text-2xl md:text-3xl"}`}>
        {value}
      </p>
    </motion.div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <BarChart3 className="w-10 h-10 text-slate-200 dark:text-slate-800 mb-3" />
      <p className="text-sm text-slate-400 font-semibold">Sin datos para esta vista</p>
    </div>
  );
}

function FilterPickerButton({
  label,
  subtitle,
  active,
  dimmed,
  onClick,
}: {
  label: string;
  subtitle: string;
  active: boolean;
  dimmed?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-start gap-0.5 px-3 py-2.5 rounded-xl border text-left transition-all cursor-pointer min-w-0 w-full ${
        dimmed
          ? "bg-muted/20 dark:bg-muted/10 border-border opacity-70"
          : active
            ? "bg-background border-border ring-1 ring-border/60"
            : "bg-muted/30 dark:bg-muted/20 border-border hover:bg-muted/50 dark:hover:bg-muted/40"
      }`}
    >
      <span
        className={`text-[10px] font-black uppercase tracking-widest ${
          dimmed ? "text-muted-foreground" : "text-muted-foreground"
        }`}
      >
        {label}
      </span>
      <span
        className={`text-xs font-bold truncate w-full ${
          dimmed ? "text-muted-foreground italic" : "text-foreground"
        }`}
      >
        {subtitle}
      </span>
    </button>
  );
}

function FilterPickerModal({
  isOpen,
  onClose,
  title,
  description,
  items,
  groups = [],
  emptyMessage,
  selectedIds,
  wide,
  onApply,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  items: FilterPickerItem[];
  groups?: FilterPickerGroup[];
  emptyMessage?: string;
  selectedIds: string[];
  wide?: boolean;
  onApply: (ids: string[]) => void;
}) {
  const [draft, setDraft] = useState<string[]>(selectedIds);
  const [search, setSearch] = useState("");

  const isGrouped = groups.length > 0;

  useEffect(() => {
    if (isOpen) {
      setDraft(selectedIds);
      setSearch("");
    }
  }, [isOpen, selectedIds]);

  const allItems = useMemo(
    () => (isGrouped ? groups.flatMap((g) => g.items) : items),
    [isGrouped, groups, items]
  );

  const filteredGroups = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!isGrouped) return groups;

    return groups
      .map((group) => ({
        ...group,
        items: group.items.filter(
          (item) =>
            !q ||
            item.label.toLowerCase().includes(q) ||
            (item.sublabel?.toLowerCase().includes(q) ?? false) ||
            group.groupLabel.toLowerCase().includes(q)
        ),
      }))
      .filter((g) => g.items.length > 0);
  }, [groups, isGrouped, search]);

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (isGrouped) return [];
    if (!q) return items;
    return items.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        (item.sublabel?.toLowerCase().includes(q) ?? false)
    );
  }, [items, isGrouped, search]);

  const toggle = (id: string) => {
    setDraft((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const renderItem = (item: FilterPickerItem) => {
    const checked = draft.includes(item.id);
    return (
      <button
        key={item.id}
        type="button"
        onClick={() => toggle(item.id)}
        className={`w-full flex items-start gap-3 px-3 py-2.5 text-left transition-colors cursor-pointer ${
          checked
            ? "bg-slate-100 dark:bg-slate-800/50"
            : "hover:bg-slate-50 dark:hover:bg-slate-900/50"
        }`}
      >
        <span
          className={`mt-0.5 shrink-0 w-4 h-4 rounded border flex items-center justify-center ${
            checked
              ? "bg-slate-600 dark:bg-slate-500 border-slate-600 dark:border-slate-500 text-white"
              : "border-slate-300 dark:border-slate-600"
          }`}
        >
          {checked && <Check className="w-3 h-3" />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-xs font-bold text-slate-800 dark:text-slate-200">
            {item.label}
          </span>
          {item.sublabel && (
            <span className="block text-[11px] text-slate-500 mt-0.5 leading-snug">
              {item.sublabel}
            </span>
          )}
        </span>
      </button>
    );
  };

  const hasResults = isGrouped ? filteredGroups.length > 0 : filteredItems.length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className={wide ? "sm:max-w-2xl" : "sm:max-w-lg"}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar..."
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-slate-400 dark:focus:ring-slate-500"
          />
        </div>

        <div className="flex items-center justify-between gap-2 text-[11px] font-bold">
          <span className="text-slate-500">
            {draft.length === 0 ? "Ninguno — muestra todos" : `${draft.length} seleccionado(s)`}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setDraft(allItems.map((i) => i.id))}
              disabled={allItems.length === 0}
              className="text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Todos
            </button>
            <span className="text-slate-300">|</span>
            <button
              type="button"
              onClick={() => setDraft([])}
              className="text-slate-500 hover:text-slate-700 cursor-pointer"
            >
              Limpiar
            </button>
          </div>
        </div>

        <div className="max-h-72 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800">
          {!hasResults ? (
            <p className="px-4 py-6 text-center text-xs text-slate-400 font-semibold">
              {search.trim() ? "Sin resultados" : emptyMessage ?? "Sin opciones disponibles"}
            </p>
          ) : isGrouped ? (
            filteredGroups.map((group, idx) => (
              <div
                key={group.groupId}
                className={idx > 0 ? "border-t border-slate-200 dark:border-slate-800" : ""}
              >
                <div className="sticky top-0 z-10 px-3 py-2 bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400">
                    {group.groupLabel}
                  </span>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {group.items.map((item) => renderItem(item))}
                </div>
              </div>
            ))
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredItems.map((item) => renderItem(item))}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => onApply(draft)}
            className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 dark:bg-slate-600 dark:hover:bg-slate-500 text-white text-xs font-bold cursor-pointer"
          >
            Aplicar
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
