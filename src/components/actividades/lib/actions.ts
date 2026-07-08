"use server";

import { createClient } from "@/utils/supabase/server";
import { createPublicClient } from "@/utils/supabase/public";
import {
  actividadFormSchema,
  registroAsistenciaSchema,
  type ActividadFormValues,
  type ActividadRecord,
  type ParticipanteRecord,
  type RegistroAsistenciaRecord,
  type RegistroAsistenciaValues,
} from "./zod";

type ActionResult = {
  success: boolean;
  error: string | null;
  detail?: string | null;
};
type ActionResultWithId = ActionResult & { id?: string };

function mapDbError(error: { code?: string; message?: string }): ActionResult {
  if (error.code === "23505") {
    return {
      success: false,
      error: "DUPLICATE",
      detail: error.message ?? null,
    };
  }
  if (error.code === "42501") {
    return {
      success: false,
      error: "FORBIDDEN",
      detail: error.message ?? "Sin permiso para esta operación.",
    };
  }
  return {
    success: false,
    error: "DB_ERROR",
    detail: error.message ?? "Error desconocido en la base de datos.",
  };
}

async function requireAuth() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase: null, user: null, error: "UNAUTHORIZED" as const };
  return { supabase, user, error: null };
}

function normalizarActividad(row: Record<string, unknown>): ActividadRecord {
  return {
    id: String(row.id),
    nombre: String(row.nombre ?? ""),
    descripcion: (row.descripcion as string | null) ?? null,
    fecha_realizacion: String(
      row.fecha_realizacion ?? row.created_at ?? "",
    ).split("T")[0],
    activo: row.activo !== false,
    created_at: String(row.created_at ?? ""),
    updated_at: (row.updated_at as string | null) ?? null,
    total_registros:
      typeof row.total_registros === "number" ? row.total_registros : undefined,
  };
}

function normalizarParticipante(row: Record<string, unknown>): ParticipanteRecord {
  return {
    dpi: String(row.dpi ?? ""),
    nombre: String(row.nombre ?? ""),
    fecha_nacimiento: String(row.fecha_nacimiento ?? "").split("T")[0],
    genero: row.genero as ParticipanteRecord["genero"],
    departamento: String(row.departamento ?? ""),
    municipio: String(row.municipio ?? ""),
    es_trifinio: row.es_trifinio === true,
    puesto: (row.puesto as string | null) ?? null,
    direccion_administrativa:
      (row.direccion_administrativa as string | null) ?? null,
    created_at: String(row.created_at ?? ""),
    updated_at: (row.updated_at as string | null) ?? null,
  };
}

function registroDesdeDpiRow(
  data: Record<string, unknown>,
  digits: string,
): ParticipanteRecord {
  return normalizarParticipante({ ...data, dpi: digits, updated_at: null });
}

function normalizarRegistro(row: Record<string, unknown>): RegistroAsistenciaRecord {
  return {
    id: String(row.id),
    actividad_id: String(row.actividad_id),
    dpi: String(row.dpi ?? ""),
    nombre: String(row.nombre ?? ""),
    puesto: (row.puesto as string | null) ?? null,
    direccion_administrativa:
      (row.direccion_administrativa as string | null) ?? null,
    fecha_nacimiento: String(row.fecha_nacimiento ?? "").split("T")[0],
    genero: (row.genero ?? "masculino") as RegistroAsistenciaRecord["genero"],
    departamento: String(row.departamento ?? ""),
    municipio: String(row.municipio ?? ""),
    es_trifinio: row.es_trifinio === true,
    created_at: String(row.created_at ?? ""),
  };
}

export async function getActividades(): Promise<ActividadRecord[]> {
  const auth = await requireAuth();
  if (!auth.supabase) return [];

  const { data, error } = await auth.supabase
    .from("asist_actividades")
    .select("*, asist_registros(count)")
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return data.map((row) => {
    const count = Array.isArray(row.asist_registros)
      ? (row.asist_registros[0] as { count: number } | undefined)?.count ?? 0
      : 0;
    return normalizarActividad({ ...row, total_registros: count });
  });
}

export async function getActividadPublica(
  id: string,
): Promise<ActividadRecord | null> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("asist_actividades")
    .select("*")
    .eq("id", id)
    .eq("activo", true)
    .maybeSingle();

  if (error || !data) return null;
  return normalizarActividad(data);
}

export async function getActividad(id: string): Promise<ActividadRecord | null> {
  const auth = await requireAuth();
  if (!auth.supabase) return null;

  const { data, error } = await auth.supabase
    .from("asist_actividades")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;
  return normalizarActividad(data);
}

export async function getParticipantePorDpi(
  dpi: string,
): Promise<ParticipanteRecord | null> {
  const digits = dpi.replace(/\D/g, "");
  if (digits.length !== 13) return null;

  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("asist_registros")
    .select("*")
    .eq("dpi", digits)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;

  return registroDesdeDpiRow(data, digits);
}

export async function getRegistrosActividad(
  actividadId: string,
): Promise<RegistroAsistenciaRecord[]> {
  const auth = await requireAuth();
  if (!auth.supabase) return [];

  const { data, error } = await auth.supabase
    .from("asist_registros")
    .select("*")
    .eq("actividad_id", actividadId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data.map(normalizarRegistro);
}

export async function createActividad(
  values: ActividadFormValues,
): Promise<ActionResultWithId> {
  const auth = await requireAuth();
  if (!auth.supabase) return { success: false, error: auth.error };

  const parsed = actividadFormSchema.safeParse(values);
  if (!parsed.success) return { success: false, error: "INVALID_INPUT" };

  const { data, error } = await auth.supabase
    .from("asist_actividades")
    .insert({
      nombre: parsed.data.nombre,
      descripcion: parsed.data.descripcion || null,
      fecha_realizacion: parsed.data.fecha_realizacion,
      activo: parsed.data.activo,
      created_by: auth.user!.id,
    })
    .select("id")
    .single();

  if (error) return mapDbError(error);
  return { success: true, error: null, id: data.id };
}

export async function updateActividad(
  id: string,
  values: ActividadFormValues,
): Promise<ActionResult> {
  const auth = await requireAuth();
  if (!auth.supabase) return { success: false, error: auth.error };

  const parsed = actividadFormSchema.safeParse(values);
  if (!parsed.success) return { success: false, error: "INVALID_INPUT" };

  const { error } = await auth.supabase
    .from("asist_actividades")
    .update({
      nombre: parsed.data.nombre,
      descripcion: parsed.data.descripcion || null,
      fecha_realizacion: parsed.data.fecha_realizacion,
      activo: parsed.data.activo,
      updated_by: auth.user!.id,
    })
    .eq("id", id);

  if (error) return mapDbError(error);
  return { success: true, error: null };
}

export async function deleteActividad(id: string): Promise<ActionResult> {
  const auth = await requireAuth();
  if (!auth.supabase) return { success: false, error: auth.error };

  const { error } = await auth.supabase
    .from("asist_actividades")
    .delete()
    .eq("id", id);

  if (error) return mapDbError(error);
  return { success: true, error: null };
}

export async function registrarAsistencia(
  values: RegistroAsistenciaValues,
): Promise<ActionResult> {
  const parsed = registroAsistenciaSchema.safeParse(values);
  if (!parsed.success) return { success: false, error: "INVALID_INPUT" };

  const supabase = createPublicClient();
  const data = parsed.data;

  const { data: actividad } = await supabase
    .from("asist_actividades")
    .select("id, activo")
    .eq("id", data.actividad_id)
    .eq("activo", true)
    .maybeSingle();

  if (!actividad) return { success: false, error: "NOT_FOUND" };

  const { data: existente, error: dupError } = await supabase
    .from("asist_registros")
    .select("id")
    .eq("actividad_id", data.actividad_id)
    .eq("dpi", data.dpi)
    .maybeSingle();

  if (dupError && !dupError.message.includes("dpi")) {
    return mapDbError(dupError);
  }

  if (existente) {
    return {
      success: false,
      error: "DUPLICATE",
      detail: "Este DPI ya está registrado en esta actividad.",
    };
  }

  const registroPayload = {
    actividad_id: data.actividad_id,
    dpi: data.dpi,
    nombre: data.nombre,
    fecha_nacimiento: data.fecha_nacimiento.split("T")[0],
    genero: data.genero,
    departamento: data.departamento,
    municipio: data.municipio,
    es_trifinio: data.es_trifinio,
    puesto: data.es_trifinio ? data.puesto?.trim() || null : "",
    direccion_administrativa: data.es_trifinio
      ? data.direccion_administrativa?.trim() || null
      : "",
  };

  const { error } = await supabase
    .from("asist_registros")
    .insert(registroPayload);

  if (error) return mapDbError(error);

  return { success: true, error: null };
}

export async function deleteRegistro(id: string): Promise<ActionResult> {
  const auth = await requireAuth();
  if (!auth.supabase) return { success: false, error: auth.error };

  const { error } = await auth.supabase
    .from("asist_registros")
    .delete()
    .eq("id", id);

  if (error) return mapDbError(error);
  return { success: true, error: null };
}
