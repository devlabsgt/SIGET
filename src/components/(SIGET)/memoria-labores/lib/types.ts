import type {
  Beneficiarios,
  ProyectoAvance,
  ProyectoItem,
  ProyectosMemoriaInput,
} from "./schemas";

export type {
  Beneficiarios,
  BeneficiariosGrupo,
  ProyectoAvance,
  ProyectoItem,
  ProyectosMemoriaInput,
} from "./schemas";

export { TITULO_INFORME_MEMORIA, TITULO_MEMORIA } from "./schemas";

const MESES = [
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

export interface ProyectosMemoria {
  id: string;
  periodo: string;
  cargo: string | null;
  nombre: string | null;
  oficina: string | null;
  proyectos: ProyectoItem[];
  beneficiarios: Beneficiarios;
  created_at: string;
}

export function emptyBeneficiarios(): Beneficiarios {
  return {
    directos: { hombres: 0, mujeres: 0, jovenes: 0 },
    indirectos: { hombres: 0, mujeres: 0, jovenes: 0 },
  };
}

export function emptyProyectoAvance(): ProyectoAvance {
  return {
    descripcion: "",
    logrado: 0,
    meta: 0,
  };
}

export function emptyProyectoItem(): ProyectoItem {
  return {
    nombre: "",
    mes: currentMonth(),
    descripcion: "",
    beneficiarios: emptyBeneficiarios(),
    avances: [emptyProyectoAvance()],
    resultados: [""],
    efectos: [""],
  };
}

function normalizeBeneficiariosFromDb(raw: unknown): Beneficiarios {
  if (!raw || typeof raw !== "object") return emptyBeneficiarios();
  const b = raw as Partial<Beneficiarios>;
  const grupo = (g: Partial<Beneficiarios["directos"]> | undefined) => ({
    hombres:
      typeof g?.hombres === "number" && Number.isFinite(g.hombres)
        ? Math.max(0, g.hombres)
        : 0,
    mujeres:
      typeof g?.mujeres === "number" && Number.isFinite(g.mujeres)
        ? Math.max(0, g.mujeres)
        : 0,
    jovenes:
      typeof g?.jovenes === "number" && Number.isFinite(g.jovenes)
        ? Math.max(0, g.jovenes)
        : 0,
  });
  return {
    directos: grupo(b.directos),
    indirectos: grupo(b.indirectos),
  };
}

export function sumBeneficiariosProyectos(
  proyectos: ProyectoItem[],
): Beneficiarios {
  const total = emptyBeneficiarios();
  for (const p of proyectos) {
    for (const grupo of ["directos", "indirectos"] as const) {
      for (const campo of ["hombres", "mujeres", "jovenes"] as const) {
        total[grupo][campo] += p.beneficiarios[grupo][campo];
      }
    }
  }
  return total;
}

function normalizeAvancesFromDb(avances: unknown): ProyectoAvance[] {
  if (typeof avances === "string" && avances.trim()) {
    return [{ descripcion: avances.trim(), logrado: 0, meta: 0 }];
  }
  if (!Array.isArray(avances) || avances.length === 0) {
    return [emptyProyectoAvance()];
  }
  return avances.map((raw) => {
    const a = raw as Partial<ProyectoAvance>;
    const logrado =
      typeof a.logrado === "number" && Number.isFinite(a.logrado)
        ? Math.max(0, a.logrado)
        : 0;
    const meta =
      typeof a.meta === "number" && Number.isFinite(a.meta) && a.meta >= 0
        ? Math.max(0, a.meta)
        : 0;
    return {
      descripcion: a.descripcion ?? "",
      logrado,
      meta,
    };
  });
}

export function normalizeProyectosFromDb(
  proyectos: unknown,
  legacyBeneficiarios?: Beneficiarios,
): ProyectoItem[] {
  if (!Array.isArray(proyectos) || proyectos.length === 0) {
    const item = emptyProyectoItem();
    if (legacyBeneficiarios) {
      item.beneficiarios = normalizeBeneficiariosFromDb(legacyBeneficiarios);
    }
    return [item];
  }

  return proyectos.map((raw, index) => {
    const p = raw as Partial<ProyectoItem> & { avances?: unknown };
    const beneficiarios =
      p.beneficiarios !== undefined
        ? normalizeBeneficiariosFromDb(p.beneficiarios)
        : index === 0 && legacyBeneficiarios
          ? normalizeBeneficiariosFromDb(legacyBeneficiarios)
          : emptyBeneficiarios();
    return {
      nombre: p.nombre ?? "",
      mes: p.mes || currentMonth(),
      descripcion: p.descripcion ?? "",
      beneficiarios,
      avances: normalizeAvancesFromDb(p.avances),
      resultados: p.resultados?.length ? p.resultados : [""],
      efectos: p.efectos?.length ? p.efectos : [""],
    };
  });
}

export function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function periodoToInput(iso: string | null | undefined): string {
  return iso ? iso.slice(0, 7) : currentMonth();
}

export function periodoToISO(mes: string): string {
  return new Date(`${mes}-01T00:00:00Z`).toISOString();
}

export function formatPeriodo(value: string | null | undefined): string {
  if (!value) return "—";
  const [anio, mes] = value.slice(0, 7).split("-");
  return `${MESES[Number(mes) - 1] ?? ""} ${anio}`.trim();
}

export function formatCreatedAt(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("es-GT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function mesesInforme(memoria: ProyectosMemoria): string[] {
  const meses = memoria.proyectos.map((p) => p.mes).filter(Boolean).sort();
  if (meses.length > 0) return meses;
  if (memoria.periodo) return [memoria.periodo.slice(0, 7)];
  return [];
}

export function mesOrdenInforme(memoria: ProyectosMemoria): string {
  const meses = mesesInforme(memoria);
  return meses[meses.length - 1] ?? currentMonth();
}

export function sortMemoriasPorMes(
  memorias: ProyectosMemoria[],
): ProyectosMemoria[] {
  return [...memorias].sort(
    (a, b) => mesOrdenInforme(b).localeCompare(mesOrdenInforme(a)),
  );
}

export function formatMemoriaPeriodo(memoria: ProyectosMemoria): string {
  const meses = mesesInforme(memoria);
  if (meses.length === 0) return formatPeriodo(memoria.periodo);
  if (meses.length === 1) return formatPeriodo(meses[0]);
  return `${formatPeriodo(meses[0])} – ${formatPeriodo(meses[meses.length - 1])}`;
}

export function periodoFromProyectos(proyectos: ProyectoItem[]): string {
  const meses = proyectos.map((p) => p.mes).filter(Boolean).sort();
  return periodoToISO(meses[0] ?? currentMonth());
}

export function emptyProyectoMemoria(): ProyectosMemoriaInput {
  return {
    cargo: "",
    nombre: "",
    oficina: "",
    proyectos: [emptyProyectoItem()],
  };
}
