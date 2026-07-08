import type { RegistroAsistenciaRecord } from "./zod";

export type StatSegment = {
  name: string;
  value: number;
  color: string;
};

const GENERO_COLORS: Record<string, string> = {
  masculino: "#2563eb",
  femenino: "#ec4899",
};

const DEPTO_COLORS = [
  "#0ea5e9",
  "#a855f7",
  "#22c55e",
  "#f59e0b",
  "#ef4444",
  "#6366f1",
  "#14b8a6",
  "#f97316",
];

function contarPorCampo(
  registros: RegistroAsistenciaRecord[],
  campo: keyof RegistroAsistenciaRecord,
): StatSegment[] {
  const map = new Map<string, number>();
  for (const r of registros) {
    const val = String(r[campo]);
    map.set(val, (map.get(val) ?? 0) + 1);
  }
  return Array.from(map.entries())
    .map(([name, value], i) => ({
      name,
      value,
      color:
        campo === "genero"
          ? (GENERO_COLORS[name.toLowerCase()] ?? DEPTO_COLORS[i % DEPTO_COLORS.length])
          : DEPTO_COLORS[i % DEPTO_COLORS.length],
    }))
    .sort((a, b) => b.value - a.value);
}

export function statsPorTrifinio(
  registros: RegistroAsistenciaRecord[],
): StatSegment[] {
  const si = registros.filter((r) => r.es_trifinio).length;
  const no = registros.length - si;
  return [
    { name: "Parte de Trifinio", value: si, color: "#0ea5e9" },
    { name: "Externo", value: no, color: "#a855f7" },
  ].filter((s) => s.value > 0);
}

export function statsPorGenero(
  registros: RegistroAsistenciaRecord[],
): StatSegment[] {
  return contarPorCampo(registros, "genero").map((s) => ({
    ...s,
    name: s.name === "masculino" ? "Masculino" : "Femenino",
  }));
}

export function statsPorDepartamento(
  registros: RegistroAsistenciaRecord[],
): StatSegment[] {
  return contarPorCampo(registros, "departamento").slice(0, 10);
}

export function statsPorMunicipio(
  registros: RegistroAsistenciaRecord[],
): StatSegment[] {
  return contarPorCampo(registros, "municipio").slice(0, 10);
}

export function calcularEdad(fechaNacimiento: string): number {
  const hoy = new Date();
  const nac = new Date(fechaNacimiento);
  let edad = hoy.getFullYear() - nac.getFullYear();
  const m = hoy.getMonth() - nac.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--;
  return edad;
}

export function statsPorRangoEdad(
  registros: RegistroAsistenciaRecord[],
): StatSegment[] {
  const rangos = [
    { name: "18-25", min: 18, max: 25 },
    { name: "26-35", min: 26, max: 35 },
    { name: "36-45", min: 36, max: 45 },
    { name: "46-55", min: 46, max: 55 },
    { name: "56+", min: 56, max: 200 },
  ];
  const counts = rangos.map((r) => ({ ...r, value: 0 }));
  for (const reg of registros) {
    const edad = calcularEdad(reg.fecha_nacimiento);
    const rango = counts.find((r) => edad >= r.min && edad <= r.max);
    if (rango) rango.value++;
  }
  return counts
    .filter((r) => r.value > 0)
    .map((r, i) => ({
      name: r.name,
      value: r.value,
      color: DEPTO_COLORS[i % DEPTO_COLORS.length],
    }));
}
