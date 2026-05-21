import type { ReportRow } from "./reportes-actions";
import { GUATEMALTECO_CELESTE, indicadorColor, isGuatemalteco, nationalityColor, perfilColor } from "./chart-colors";

export const ALL_INDICADORES_ID = "__all_ind__";

export type ReportChartSlice = { id: string; name: string; value: number; color: string };

export type ReportCampoOption = { catalogId: string; nombre: string; orden: number };

export type ReportProgressItem = {
  id: string;
  label: string;
  sublabel?: string;
  value: number;
};

export type ReportNacPerfilRow = {
  nacionalidadId: string;
  perfilId: string;
  valores: Record<string, number>;
  registroIds: Set<string>;
};

function crossKey(nacionalidadId: string, perfilId: string) {
  return `${nacionalidadId}::${perfilId}`;
}

export function filterReportRows(
  rows: ReportRow[],
  selectedIndicadorId: string,
  selectedCampoIds: Set<string>
): ReportRow[] {
  let filtered = rows;
  if (selectedIndicadorId !== ALL_INDICADORES_ID) {
    filtered = filtered.filter((r) => r.indicadorId === selectedIndicadorId);
  }
  if (selectedCampoIds.size > 0) {
    filtered = filtered.filter((r) => selectedCampoIds.has(r.campoId));
  }
  return filtered;
}

export function getAvailableCampos(rows: ReportRow[]): ReportCampoOption[] {
  const map = new Map<string, ReportCampoOption>();
  for (const r of rows) {
    if (!map.has(r.campoId)) {
      map.set(r.campoId, { catalogId: r.campoId, nombre: r.campoNombre, orden: r.campoOrden });
    }
  }
  return Array.from(map.values()).sort((a, b) => a.orden - b.orden || a.nombre.localeCompare(b.nombre, "es"));
}

export function getIndicadoresEnUso(rows: ReportRow[]) {
  const map = new Map<string, { id: string; nombre: string }>();
  for (const r of rows) {
    if (!map.has(r.indicadorId)) map.set(r.indicadorId, { id: r.indicadorId, nombre: r.indicadorNombre });
  }
  return Array.from(map.values()).sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
}

export function getPoliticasEnDatos(rows: ReportRow[]) {
  const map = new Map<string, { id: string; codigo: string; descripcion: string }>();
  for (const r of rows) {
    if (!map.has(r.politicaId)) {
      map.set(r.politicaId, {
        id: r.politicaId,
        codigo: r.politicaCodigo,
        descripcion: r.politicaDescripcion,
      });
    }
  }
  return Array.from(map.values()).sort((a, b) => a.codigo.localeCompare(b.codigo, "es"));
}

export function computeGlobalCrossStats(rows: ReportRow[]) {
  const combos = new Set<string>();
  for (const r of rows) {
    combos.add(crossKey(r.nacionalidadId || "__none__", r.perfilId || "__none__"));
  }
  return { comboCount: combos.size, registroCount: new Set(rows.map((r) => r.registroId)).size };
}

export function aggregateReportSlices(
  rows: ReportRow[],
  dimension: "nacionalidad" | "perfil" | "indicador"
): ReportChartSlice[] {
  const totals = new Map<string, { id: string; name: string; value: number }>();
  for (const r of rows) {
    const id =
      dimension === "indicador"
        ? r.indicadorId
        : dimension === "nacionalidad"
          ? r.nacionalidadId || "__none__"
          : r.perfilId || "__none__";
    const name =
      dimension === "indicador"
        ? r.indicadorNombre
        : dimension === "nacionalidad"
          ? r.nacionalidadNombre || "Sin especificar"
          : r.perfilNombre || "Sin especificar";
    const existing = totals.get(id);
    if (existing) existing.value += r.cantidad;
    else totals.set(id, { id, name, value: r.cantidad });
  }
  const sorted = Array.from(totals.values())
    .filter((d) => d.value > 0)
    .sort((a, b) => b.value - a.value);

  let nacOtherIdx = 0;
  return sorted.map((d, i) => ({
    ...d,
    color:
      dimension === "nacionalidad"
        ? isGuatemalteco(d.name)
          ? GUATEMALTECO_CELESTE
          : nationalityColor(d.name, nacOtherIdx++)
        : dimension === "perfil"
          ? perfilColor(i)
          : indicadorColor(i),
  }));
}

export function buildNacPerfilProgressItems(rows: ReportRow[]): ReportProgressItem[] {
  const totals = new Map<string, ReportProgressItem & { value: number }>();
  for (const r of rows) {
    const nacId = r.nacionalidadId || "__none__";
    const perfId = r.perfilId || "__none__";
    const key = crossKey(nacId, perfId);
    const existing = totals.get(key);
    if (existing) {
      existing.value += r.cantidad;
    } else {
      totals.set(key, {
        id: key,
        label: r.nacionalidadNombre || "Sin especificar",
        sublabel: r.perfilNombre || "Sin especificar",
        value: r.cantidad,
      });
    }
  }
  return Array.from(totals.values())
    .filter((d) => d.value > 0)
    .sort((a, b) => b.value - a.value);
}

export function buildCampoProgressItems(
  rows: ReportRow[],
  selectedCampoIds: Set<string>,
  availableCampos: ReportCampoOption[]
): ReportProgressItem[] {
  const totals = new Map<string, ReportProgressItem & { orden: number; value: number }>();
  for (const opt of availableCampos) {
    if (!selectedCampoIds.has(opt.catalogId)) continue;
    totals.set(opt.catalogId, { id: opt.catalogId, label: opt.nombre, value: 0, orden: opt.orden });
  }
  for (const r of rows) {
    const entry = totals.get(r.campoId);
    if (!entry) continue;
    entry.value += r.cantidad;
  }
  return Array.from(totals.values())
    .sort((a, b) => a.orden - b.orden || a.label.localeCompare(b.label, "es"))
    .map(({ id, label, value }) => ({ id, label, value }));
}

export function buildReportCampoDimensionCross(
  rows: ReportRow[],
  campos: ReportCampoOption[],
  dimension: "nacionalidad" | "perfil" | "indicador"
) {
  const grid = new Map<string, Map<string, number>>();
  const colLabels = new Map<string, string>();
  for (const c of campos) grid.set(c.catalogId, new Map());

  for (const r of rows) {
    if (!grid.has(r.campoId)) continue;
    const dimId =
      dimension === "nacionalidad"
        ? r.nacionalidadId || "__none__"
        : dimension === "perfil"
          ? r.perfilId || "__none__"
          : r.indicadorId;
    const dimLabel =
      dimension === "nacionalidad"
        ? r.nacionalidadNombre || "Sin especificar"
        : dimension === "perfil"
          ? r.perfilNombre || "Sin especificar"
          : r.indicadorNombre;
    colLabels.set(dimId, dimLabel);
    const row = grid.get(r.campoId)!;
    row.set(dimId, (row.get(dimId) || 0) + r.cantidad);
  }

  const colIds = [
    ...new Set(Array.from(grid.values()).flatMap((row) => [...row.keys()])),
  ];

  return {
    campos: campos.map((c) => ({ catalogId: c.catalogId, nombre: c.nombre })),
    colIds,
    grid,
    getColLabel: (id: string) => colLabels.get(id) || id,
  };
}

export function aggregateReportByNacPerfil(rows: ReportRow[]): ReportNacPerfilRow[] {
  const map = new Map<string, ReportNacPerfilRow>();
  for (const r of rows) {
    const nacId = r.nacionalidadId || "__none__";
    const perfId = r.perfilId || "__none__";
    const key = crossKey(nacId, perfId);
    let row = map.get(key);
    if (!row) {
      row = { nacionalidadId: nacId, perfilId: perfId, valores: {}, registroIds: new Set() };
      map.set(key, row);
    }
    row.valores[r.campoId] = (row.valores[r.campoId] || 0) + r.cantidad;
    row.registroIds.add(r.registroId);
  }
  return Array.from(map.values());
}

export function getCampoTotalsForIndicador(rows: ReportRow[]) {
  const camposMap = new Map<string, { id: string; nombre: string; orden: number; total: number }>();
  for (const r of rows) {
    const existing = camposMap.get(r.campoId);
    if (existing) existing.total += r.cantidad;
    else camposMap.set(r.campoId, { id: r.campoId, nombre: r.campoNombre, orden: r.campoOrden, total: r.cantidad });
  }
  return Array.from(camposMap.values()).sort((a, b) => a.orden - b.orden || a.nombre.localeCompare(b.nombre, "es"));
}

export function buildNacTotalsMap(rows: ReportRow[]) {
  const totals = new Map<string, { id: string; name: string; value: number }>();
  for (const r of rows) {
    const id = r.nacionalidadId || "__none__";
    const existing = totals.get(id);
    if (existing) existing.value += r.cantidad;
    else totals.set(id, { id, name: r.nacionalidadNombre || "Sin especificar", value: r.cantidad });
  }
  return totals;
}

export function nacPerfilMatrixFromRows(rows: ReportRow[]) {
  const nacIds = [...new Set(rows.map((r) => r.nacionalidadId || "__none__"))];
  const perfilIds = [...new Set(rows.map((r) => r.perfilId || "__none__"))];
  const totals = new Map<string, number>();
  const nacLabels = new Map<string, string>();
  const perfLabels = new Map<string, string>();

  for (const r of rows) {
    const nacId = r.nacionalidadId || "__none__";
    const perfId = r.perfilId || "__none__";
    nacLabels.set(nacId, r.nacionalidadNombre || "Sin especificar");
    perfLabels.set(perfId, r.perfilNombre || "Sin especificar");
    const key = crossKey(nacId, perfId);
    totals.set(key, (totals.get(key) || 0) + r.cantidad);
  }

  const values = Array.from(totals.values());
  const maxCell = Math.max(...values, 1);
  const grandTotal = values.reduce((a, b) => a + b, 0);

  return { nacIds, perfilIds, totals, maxCell, grandTotal, nacLabels, perfLabels, crossKey };
}
