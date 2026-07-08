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

type ActionResult = { success: boolean; error: string | null };
type ActionResultWithId = ActionResult & { id?: string };

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
    fecha_nacimiento: String(row.fecha_nacimiento ?? ""),
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

function normalizarRegistro(row: Record<string, unknown>): RegistroAsistenciaRecord {
  const participante = row.asist_participantes as Record<string, unknown> | null;

  return {
    id: String(row.id),
    actividad_id: String(row.actividad_id),
    dpi: String(row.dpi ?? participante?.dpi ?? ""),
    nombre: String(participante?.nombre ?? ""),
    puesto: (participante?.puesto as string | null) ?? null,
    direccion_administrativa:
      (participante?.direccion_administrativa as string | null) ?? null,
    fecha_nacimiento: String(participante?.fecha_nacimiento ?? ""),
    genero: (participante?.genero ?? "masculino") as RegistroAsistenciaRecord["genero"],
    departamento: String(participante?.departamento ?? ""),
    municipio: String(participante?.municipio ?? ""),
    es_trifinio: participante?.es_trifinio === true,
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
    .from("asist_participantes")
    .select("*")
    .eq("dpi", digits)
    .maybeSingle();

  if (error || !data) return null;
  return normalizarParticipante(data);
}

export async function getRegistrosActividad(
  actividadId: string,
): Promise<RegistroAsistenciaRecord[]> {
  const auth = await requireAuth();
  if (!auth.supabase) return [];

  const { data, error } = await auth.supabase
    .from("asist_registros")
    .select("*, asist_participantes(*)")
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
      activo: parsed.data.activo,
      created_by: auth.user!.id,
    })
    .select("id")
    .single();

  if (error) return { success: false, error: "DB_ERROR" };
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
      activo: parsed.data.activo,
      updated_by: auth.user!.id,
    })
    .eq("id", id);

  if (error) return { success: false, error: "DB_ERROR" };
  return { success: true, error: null };
}

export async function deleteActividad(id: string): Promise<ActionResult> {
  const auth = await requireAuth();
  if (!auth.supabase) return { success: false, error: auth.error };

  const { error } = await auth.supabase
    .from("asist_actividades")
    .delete()
    .eq("id", id);

  if (error) return { success: false, error: "DB_ERROR" };
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

  const { data: existente } = await supabase
    .from("asist_registros")
    .select("id")
    .eq("actividad_id", data.actividad_id)
    .eq("dpi", data.dpi)
    .maybeSingle();

  if (existente) return { success: false, error: "DUPLICATE" };

  const participantePayload = {
    dpi: data.dpi,
    nombre: data.nombre,
    fecha_nacimiento: data.fecha_nacimiento,
    genero: data.genero,
    departamento: data.departamento,
    municipio: data.municipio,
    es_trifinio: data.es_trifinio,
    puesto: data.es_trifinio ? data.puesto?.trim() || null : null,
    direccion_administrativa: data.es_trifinio
      ? data.direccion_administrativa?.trim() || null
      : null,
    updated_at: new Date().toISOString(),
  };

  const { error: upsertError } = await supabase
    .from("asist_participantes")
    .upsert(participantePayload, { onConflict: "dpi" });

  if (upsertError) return { success: false, error: "DB_ERROR" };

  const { error } = await supabase.from("asist_registros").insert({
    actividad_id: data.actividad_id,
    dpi: data.dpi,
  });

  if (error) {
    if (error.code === "23505") return { success: false, error: "DUPLICATE" };
    return { success: false, error: "DB_ERROR" };
  }

  return { success: true, error: null };
}

export async function deleteRegistro(id: string): Promise<ActionResult> {
  const auth = await requireAuth();
  if (!auth.supabase) return { success: false, error: auth.error };

  const { error } = await auth.supabase
    .from("asist_registros")
    .delete()
    .eq("id", id);

  if (error) return { success: false, error: "DB_ERROR" };
  return { success: true, error: null };
}
