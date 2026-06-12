"use server";

import { createClient } from "@/utils/supabase/server";
import type { ProyectosMemoria } from "./types";
import {
  proyectosMemoriaSchema,
  type ProyectosMemoriaInput,
} from "./schemas";
import {
  normalizeProyectosFromDb,
  periodoFromProyectos,
  sumBeneficiariosProyectos,
} from "./types";

const TABLE = "cs_proyectos_memoria_labores";
const ALLOWED_ROLES = ["super", "admin", "comunicacion"];

async function requireAuth() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("No autenticado.");

  return { supabase, user };
}

async function requireRoleAccess() {
  const { supabase, user } = await requireAuth();

  const role =
    (user.user_metadata?.rol as string | undefined) || user.role || "user";

  if (!ALLOWED_ROLES.includes(role)) {
    throw new Error("No tiene permisos para gestionar la memoria de labores.");
  }

  return { supabase, user, role };
}

const SELECT_COLUMNS =
  "id, periodo, cargo, nombre, oficina, proyectos, beneficiarios, created_at";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalize(row: any): ProyectosMemoria {
  const proyectos = normalizeProyectosFromDb(
    row.proyectos,
    row.beneficiarios ?? undefined,
  );
  return {
    id: row.id,
    periodo: row.periodo,
    cargo: row.cargo ?? null,
    nombre: row.nombre ?? null,
    oficina: row.oficina ?? null,
    proyectos,
    beneficiarios: sumBeneficiariosProyectos(proyectos),
    created_at: row.created_at ?? row.periodo ?? new Date().toISOString(),
  };
}

function validateAndBuildPayload(input: ProyectosMemoriaInput) {
  const result = proyectosMemoriaSchema.safeParse(input);

  if (!result.success) {
    const issue = result.error.issues[0];
    const path = issue?.path?.join(".");
    throw new Error(
      `Datos inválidos${path ? ` (${path})` : ""}: ${issue?.message ?? "revise el formulario."}`,
    );
  }

  const data = result.data;
  return {
    periodo: periodoFromProyectos(data.proyectos),
    cargo: data.cargo || null,
    nombre: data.nombre || null,
    oficina: data.oficina || null,
    proyectos: data.proyectos,
    beneficiarios: sumBeneficiariosProyectos(data.proyectos),
  };
}

export async function getProyectosMemoria(): Promise<ProyectosMemoria[]> {
  const { supabase } = await requireRoleAccess();
  const { data, error } = await supabase
    .from(TABLE)
    .select(SELECT_COLUMNS)
    .order("periodo", { ascending: false });

  if (error) throw new Error(error.message);
  return (data || []).map(normalize);
}

export async function getProyectoMemoria(
  id: string,
): Promise<ProyectosMemoria | null> {
  const { supabase } = await requireRoleAccess();
  const { data, error } = await supabase
    .from(TABLE)
    .select(SELECT_COLUMNS)
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(error.message);
  }
  return data ? normalize(data) : null;
}

export async function createProyectoMemoria(
  input: ProyectosMemoriaInput,
): Promise<ProyectosMemoria> {
  const { supabase } = await requireRoleAccess();
  const { data, error } = await supabase
    .from(TABLE)
    .insert(validateAndBuildPayload(input))
    .select(SELECT_COLUMNS)
    .single();

  if (error) throw new Error(error.message);
  return normalize(data);
}

export async function updateProyectoMemoria(
  id: string,
  input: ProyectosMemoriaInput,
): Promise<ProyectosMemoria> {
  const { supabase } = await requireRoleAccess();
  const { data, error } = await supabase
    .from(TABLE)
    .update(validateAndBuildPayload(input))
    .eq("id", id)
    .select(SELECT_COLUMNS)
    .single();

  if (error) throw new Error(error.message);
  return normalize(data);
}

export async function deleteProyectoMemoria(id: string): Promise<void> {
  const { supabase } = await requireRoleAccess();
  const { error } = await supabase.from(TABLE).delete().eq("id", id);
  if (error) throw new Error(error.message);
}
