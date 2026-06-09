"use server";

import { unstable_cache } from "next/cache";
import { createPublicClient } from "@/utils/supabase/public";

/**
 * Indicadores/campos que no aplican a nacionalidad ni perfil (Reuniones,
 * Empresas, Actores). Se excluyen de las gráficas por nacionalidad/perfil pero
 * siguen contando en el desglose por campo y en los totales.
 */
const OMITE_NAC_PERFIL_REGEX = /reuniones|empresas|actores/i;

export interface ObsPublicStats {
  totalRegistros: number;
  totalAtenciones: number;
  totalOrganizaciones: number;
  byNacionalidad: { nombre: string; total: number }[];
  byPerfil: { nombre: string; total: number }[];
  byCampo: { nombre: string; total: number }[];
  /** Campos de Reuniones/Empresas/Actores (sin nac/perfil). */
  byCampoOmite: { nombre: string; total: number }[];
  /** Indicadores Reuniones/Empresas/Actores (sin nac/perfil). */
  byIndicadorOmite: { nombre: string; total: number }[];
  availableYears: number[];
  availableMonths: number[];
}

async function fetchPublicObsStats(
  year: number,
  month: number,
): Promise<ObsPublicStats> {
  const supabase = createPublicClient();

  let monthsQuery = supabase.from("obs_registros").select("mes");
  if (year > 0) monthsQuery = monthsQuery.eq("anio", year);

  let registrosQuery = supabase
    .from("obs_registros")
    .select("id, organizacion_id");
  if (year > 0) registrosQuery = registrosQuery.eq("anio", year);
  if (month > 0) registrosQuery = registrosQuery.eq("mes", month);

  const [yearsRes, monthsRes, registrosRes, nacRes, perfRes] =
    await Promise.all([
      supabase.from("obs_registros").select("anio").order("anio", {
        ascending: false,
      }),
      monthsQuery,
      registrosQuery,
      supabase.from("obs_nacionalidades").select("id, nombre"),
      supabase.from("obs_perfiles").select("id, nombre"),
    ]);

  const yearsSet = new Set<number>(
    (yearsRes.data || []).map((r) => r.anio as number),
  );
  const availableYears = [...yearsSet].sort((a, b) => b - a);

  const availableMonths = [
    ...new Set((monthsRes.data || []).map((r) => r.mes as number)),
  ]
    .filter((m) => m >= 1 && m <= 12)
    .sort((a, b) => a - b);

  const registros = registrosRes.data || [];
  const totalRegistros = registros.length;
  const registroIds = registros.map((r) => r.id as string);
  const totalOrganizaciones = new Set(registros.map((r) => r.organizacion_id))
    .size;

  if (registroIds.length === 0) {
    return {
      totalRegistros: 0,
      totalAtenciones: 0,
      totalOrganizaciones: 0,
      byNacionalidad: [],
      byPerfil: [],
      byCampo: [],
      byCampoOmite: [],
      byIndicadorOmite: [],
      availableYears,
      availableMonths,
    };
  }

  const { data: valores } = await supabase
    .from("obs_registros_valores")
    .select("cantidad, nacionalidad_id, perfil_id, indicador_campo_id")
    .in("registro_id", registroIds);

  const indicadorCampoIds = [
    ...new Set(
      (valores || [])
        .map((v) => v.indicador_campo_id as string | null)
        .filter(Boolean),
    ),
  ] as string[];

  const campoByIndicadorCampo = new Map<
    string,
    { nombre: string; orden: number; omiteNacPerfil: boolean; indicadorNombre: string }
  >();

  if (indicadorCampoIds.length > 0) {
    const { data: indicadorCampos } = await supabase
      .from("obs_indicador_campos")
      .select("id, orden, campo_id, indicador_id")
      .in("id", indicadorCampoIds);

    const campoIds = [
      ...new Set(
        (indicadorCampos || [])
          .map((ic) => ic.campo_id as string)
          .filter(Boolean),
      ),
    ];

    const indicadorIds = [
      ...new Set(
        (indicadorCampos || [])
          .map((ic) => ic.indicador_id as string)
          .filter(Boolean),
      ),
    ];

    const [camposRowsRes, indicadoresRowsRes] = await Promise.all([
      campoIds.length > 0
        ? supabase.from("obs_campos").select("id, nombre").in("id", campoIds)
        : Promise.resolve({ data: [] as { id: string; nombre: string }[] }),
      indicadorIds.length > 0
        ? supabase
            .from("obs_indicadores")
            .select("id, nombre")
            .in("id", indicadorIds)
        : Promise.resolve({ data: [] as { id: string; nombre: string }[] }),
    ]);

    const camposMap = new Map<string, string>(
      (camposRowsRes.data || []).map((c) => [c.id, c.nombre]),
    );
    const indicadoresMap = new Map<string, string>(
      (indicadoresRowsRes.data || []).map((i) => [i.id, i.nombre]),
    );

    for (const ic of indicadorCampos || []) {
      const campoNombre = camposMap.get(ic.campo_id) ?? "Sin especificar";
      const indicadorNombre = indicadoresMap.get(ic.indicador_id) ?? "";
      campoByIndicadorCampo.set(ic.id, {
        nombre: campoNombre,
        orden: parseInt(String(ic.orden ?? "0"), 10),
        indicadorNombre,
        omiteNacPerfil:
          OMITE_NAC_PERFIL_REGEX.test(campoNombre) ||
          OMITE_NAC_PERFIL_REGEX.test(indicadorNombre),
      });
    }
  }

  const nacMap = new Map<string, string>(
    (nacRes.data || []).map((n) => [n.id, n.nombre]),
  );
  const perfMap = new Map<string, string>(
    (perfRes.data || []).map((p) => [p.id, p.nombre]),
  );

  const nacTotals = new Map<string, number>();
  const perfTotals = new Map<string, number>();
  const campoTotals = new Map<string, { total: number; orden: number }>();
  const campoOmiteTotals = new Map<string, { total: number; orden: number }>();
  const indicadorOmiteTotals = new Map<string, number>();
  let totalAtenciones = 0;

  for (const v of valores || []) {
    const qty = (v.cantidad as number) || 0;
    totalAtenciones += qty;

    const icId = v.indicador_campo_id as string | null;
    const campoMeta = icId ? campoByIndicadorCampo.get(icId) : undefined;

    // Reuniones/Empresas/Actores no se contabilizan por nacionalidad/perfil.
    if (!campoMeta?.omiteNacPerfil) {
      const nacNombre = v.nacionalidad_id
        ? (nacMap.get(v.nacionalidad_id) ?? "Sin especificar")
        : "Sin especificar";
      nacTotals.set(nacNombre, (nacTotals.get(nacNombre) ?? 0) + qty);

      if (v.perfil_id) {
        const nombre = perfMap.get(v.perfil_id) ?? "Sin especificar";
        perfTotals.set(nombre, (perfTotals.get(nombre) ?? 0) + qty);
      } else {
        perfTotals.set(
          "Sin especificar",
          (perfTotals.get("Sin especificar") ?? 0) + qty,
        );
      }
    }

    const campoNombre = campoMeta?.nombre ?? "Sin especificar";
    const campoOrden = campoMeta?.orden ?? 9999;

    if (campoMeta?.omiteNacPerfil) {
      const indNombre = campoMeta.indicadorNombre || "Sin especificar";
      indicadorOmiteTotals.set(
        indNombre,
        (indicadorOmiteTotals.get(indNombre) ?? 0) + qty,
      );
      const existingOmite = campoOmiteTotals.get(campoNombre);
      if (existingOmite) {
        existingOmite.total += qty;
      } else {
        campoOmiteTotals.set(campoNombre, { total: qty, orden: campoOrden });
      }
    } else {
      const existingCampo = campoTotals.get(campoNombre);
      if (existingCampo) {
        existingCampo.total += qty;
      } else {
        campoTotals.set(campoNombre, { total: qty, orden: campoOrden });
      }
    }
  }

  const byNacionalidad = [...nacTotals.entries()]
    .map(([nombre, total]) => ({ nombre, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 8);

  const byPerfil = [...perfTotals.entries()]
    .map(([nombre, total]) => ({ nombre, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 8);

  const byCampo = [...campoTotals.entries()]
    .map(([nombre, { total, orden }]) => ({ nombre, total, orden }))
    .sort((a, b) => a.orden - b.orden || b.total - a.total)
    .map(({ nombre, total }) => ({ nombre, total }));

  const byCampoOmite = [...campoOmiteTotals.entries()]
    .map(([nombre, { total, orden }]) => ({ nombre, total, orden }))
    .sort((a, b) => a.orden - b.orden || b.total - a.total)
    .map(({ nombre, total }) => ({ nombre, total }));

  const byIndicadorOmite = [...indicadorOmiteTotals.entries()]
    .map(([nombre, total]) => ({ nombre, total }))
    .sort((a, b) => b.total - a.total);

  return {
    totalRegistros,
    totalAtenciones,
    totalOrganizaciones,
    byNacionalidad,
    byPerfil,
    byCampo,
    byCampoOmite,
    byIndicadorOmite,
    availableYears,
    availableMonths,
  };
}

export async function getPublicObsStats(
  year?: number,
  month?: number,
): Promise<ObsPublicStats> {
  const y = year ?? 0;
  const m = month ?? 0;

  return unstable_cache(
    () => fetchPublicObsStats(y, m),
    ["obs-public-stats-v3", String(y), String(m)],
    { revalidate: 120 },
  )();
}
