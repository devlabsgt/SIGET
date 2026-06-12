"use server";

import { createClient } from "@/utils/supabase/server";
import {
  proyectosMemoriaSchema,
  type ProyectosMemoriaInput,
} from "@/components/(SIGET)/memoria-labores/lib/schemas";
import {
  periodoFromProyectos,
  sumBeneficiariosProyectos,
} from "@/components/(SIGET)/memoria-labores/lib/types";

const TABLE = "cs_proyectos_memoria_labores";

export async function createInforme(
  input: ProyectosMemoriaInput,
): Promise<{ success: true }> {
  const result = proyectosMemoriaSchema.safeParse(input);

  if (!result.success) {
    const issue = result.error.issues[0];
    const path = issue?.path?.join(".");
    return Promise.reject(
      new Error(
        `Datos inválidos${path ? ` (${path})` : ""}: ${issue?.message ?? "revise el formulario."}`,
      ),
    );
  }

  const data = result.data;

  try {
    const supabase = await createClient();
    const { error } = await supabase.from(TABLE).insert({
      periodo: periodoFromProyectos(data.proyectos),
      cargo: data.cargo || null,
      nombre: data.nombre || null,
      oficina: data.oficina || null,
      proyectos: data.proyectos,
      beneficiarios: sumBeneficiariosProyectos(data.proyectos),
    });

    if (error) {
      console.error("[createInforme]", error);
      throw new Error("No se pudo enviar el informe. Intente de nuevo.");
    }

    return { success: true };
  } catch (err) {
    if (err instanceof Error && err.message.startsWith("Datos inválidos")) {
      throw err;
    }
    console.error("[createInforme]", err);
    throw new Error("No se pudo enviar el informe. Intente de nuevo.");
  }
}
