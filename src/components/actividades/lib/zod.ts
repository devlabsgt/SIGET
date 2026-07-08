import { z } from "zod";

export const GENEROS = ["masculino", "femenino"] as const;
export type Genero = (typeof GENEROS)[number];

const dpiSchema = z
  .string()
  .trim()
  .transform((v) => v.replace(/\D/g, ""))
  .pipe(z.string().length(13, "El DPI debe tener 13 dígitos"));

export const actividadFormSchema = z.object({
  nombre: z.string().trim().min(1, "El nombre es obligatorio"),
  descripcion: z.string().trim().max(500).optional().default(""),
  fecha_realizacion: z.string().min(1, "La fecha de la actividad es obligatoria"),
  activo: z.boolean().default(true),
});

export type ActividadFormValues = z.infer<typeof actividadFormSchema>;

export const participanteSchema = z.object({
  dpi: dpiSchema,
  nombre: z.string().trim().min(1, "El nombre es obligatorio"),
  fecha_nacimiento: z.string().min(1, "La fecha de nacimiento es obligatoria"),
  genero: z.enum(GENEROS, { message: "Seleccione un género" }),
  departamento: z.string().trim().min(1, "Seleccione un departamento"),
  municipio: z.string().trim().min(1, "Seleccione un municipio"),
  es_trifinio: z.boolean(),
  puesto: z.string().trim().optional().default(""),
  direccion_administrativa: z.string().trim().optional().default(""),
});

export type ParticipanteValues = z.infer<typeof participanteSchema>;

export const registroAsistenciaSchema = participanteSchema
  .extend({
    actividad_id: z.string().uuid("Actividad inválida"),
  })
  .superRefine((data, ctx) => {
    if (data.es_trifinio) return;
    if (data.puesto?.trim()) {
      ctx.addIssue({
        code: "custom",
        message: "No aplica puesto si no es parte de Trifinio",
        path: ["puesto"],
      });
    }
    if (data.direccion_administrativa?.trim()) {
      ctx.addIssue({
        code: "custom",
        message: "No aplica dirección si no es parte de Trifinio",
        path: ["direccion_administrativa"],
      });
    }
  });

export type RegistroAsistenciaValues = z.infer<typeof registroAsistenciaSchema>;

export type ActividadRecord = {
  id: string;
  nombre: string;
  descripcion: string | null;
  fecha_realizacion: string;
  activo: boolean;
  created_at: string;
  updated_at: string | null;
  total_registros?: number;
};

export type ParticipanteRecord = {
  dpi: string;
  nombre: string;
  fecha_nacimiento: string;
  genero: Genero;
  departamento: string;
  municipio: string;
  es_trifinio: boolean;
  puesto: string | null;
  direccion_administrativa: string | null;
  created_at: string;
  updated_at: string | null;
};

export type RegistroAsistenciaRecord = {
  id: string;
  actividad_id: string;
  dpi: string;
  nombre: string;
  puesto: string | null;
  direccion_administrativa: string | null;
  fecha_nacimiento: string;
  genero: Genero;
  departamento: string;
  municipio: string;
  es_trifinio: boolean;
  created_at: string;
};

export function normalizarDpiInput(value: string): string {
  return value.replace(/\D/g, "").slice(0, 13);
}

export function normalizarFechaInput(value: string): string {
  if (!value) return "";
  return value.split("T")[0];
}

export function formatFechaActividad(fecha: string): string {
  try {
    const [y, m, d] = normalizarFechaInput(fecha).split("-").map(Number);
    if (!y || !m || !d) return fecha;
    return new Date(y, m - 1, d).toLocaleDateString("es-GT", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return fecha;
  }
}
