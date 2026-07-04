import { z } from "zod";

export const TITULO_INFORME_MEMORIA = "Informe de Memoria de Labores";

export const TITULO_MEMORIA = TITULO_INFORME_MEMORIA;

export const beneficiariosGrupoSchema = z.object({
  hombres: z.coerce.number().int("Debe ser un entero").min(0, "No puede ser negativo"),
  mujeres: z.coerce.number().int("Debe ser un entero").min(0, "No puede ser negativo"),
  jovenes: z.coerce.number().int("Debe ser un entero").min(0, "No puede ser negativo"),
});

export const beneficiariosSchema = z.object({
  directos: beneficiariosGrupoSchema,
  indirectos: beneficiariosGrupoSchema,
});

const listaTexto = z
  .array(z.string())
  .transform((arr) => arr.map((s) => s.trim()).filter(Boolean));

export const proyectoAvanceSchema = z
  .object({
    descripcion: z.string().trim(),
    logrado: z.coerce.number().int().min(0, "No puede ser negativo"),
    meta: z.coerce
      .number()
      .int()
      .min(1, "Indique la meta total (el número que usted defina, no tiene que ser 10)"),
  })
  .refine((a) => a.logrado <= a.meta, {
    message: "El logrado no puede superar la meta",
    path: ["logrado"],
  });

const listaAvances = z
  .array(proyectoAvanceSchema)
  .transform((arr) =>
    arr.filter((a) => a.descripcion.length > 0 || a.logrado > 0),
  );

export const proyectoItemSchema = z.object({
  nombre: z.string().trim().min(1, "Indique el nombre del proyecto"),
  mes: z.string().regex(/^\d{4}-\d{2}$/, "Seleccione el mes del proyecto"),
  descripcion: z.string().trim(),
  beneficiarios: beneficiariosSchema,
  avances: listaAvances,
  resultados: listaTexto,
  efectos: listaTexto,
});

const proyectoTieneContenido = (p: z.infer<typeof proyectoItemSchema>) =>
  p.nombre.length > 0 ||
  p.descripcion.length > 0 ||
  p.avances.length > 0 ||
  p.resultados.length > 0 ||
  p.efectos.length > 0;

export const proyectosMemoriaSchema = z
  .object({
    proyectos: z.array(proyectoItemSchema),
    imagenes: z
      .array(z.array(z.string()).max(4))
      .optional()
      .default([]),
  })
  .transform((data) => {
    const pares = data.proyectos.map((proyecto, index) => ({
      proyecto,
      imagenes: data.imagenes[index] ?? [],
    }));
    const filtrados = pares.filter(({ proyecto }) =>
      proyectoTieneContenido(proyecto),
    );
    return {
      proyectos: filtrados.map(({ proyecto }) => proyecto),
      imagenes: filtrados.map(({ imagenes }) => imagenes),
    };
  });

export type ProyectosMemoriaInput = z.infer<typeof proyectosMemoriaSchema>;
export type ProyectoAvance = z.infer<typeof proyectoAvanceSchema>;
export type ProyectoItem = z.infer<typeof proyectoItemSchema>;
export type Beneficiarios = z.infer<typeof beneficiariosSchema>;
export type BeneficiariosGrupo = z.infer<typeof beneficiariosGrupoSchema>;
