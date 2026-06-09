"use server";

import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";

export interface ObsSector {
  id: string;
  nombre: string;
}

export interface ObsOrganizacion {
  id: string;
  nombre: string;
  logo?: string | null;
}

export interface ObsPolitica {
  id: string;
  sector_id: string;
  codigo: string;
  descripcion: string;
  activo: boolean;
  obs_sectores?: { nombre: string };
}

export interface ObsCampo {
  id: string;
  nombre: string;
  activo: boolean;
  orden?: number | null;
}

export interface ObsPredefinedField {
  id: string;
  nombre: string;
  orden: number;
}

export interface ObsIndicadorCampo {
  id: string;
  indicador_id: string;
  campo_id: string;
  orden: string;
  activo: boolean;
  obs_campos?: ObsCampo;
}

export interface ObsIndicador {
  id: string;
  politica_id: string;
  nombre: string;
  activo: boolean;
  obs_politicas?: ObsPolitica;
  obs_indicador_campos?: ObsIndicadorCampo[];
}

export interface ObsNacionalidad {
  id: string;
  nombre: string;
}

export interface ObsPerfil {
  id: string;
  nombre: string;
}

export interface RegistroEntrada {
  id: string;
  indicadorId: string;
  nacionalidadId: string;
  perfilId: string;
  valores: Record<string, string>; // indicador_campo_id → cantidad
}

export async function getSectores() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("obs_sectores").select("*").order("nombre");
  if (error) throw new Error(error.message);
  return data as ObsSector[];
}

export async function getOrganizacionesBySector(sectorId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("obs_organizaciones_sectores")
    .select("organizacion_id, obs_organizaciones(id, nombre, logo)")
    .eq("sector_id", sectorId);
  if (error) throw new Error(error.message);
  return (data || []).map((row: any) => row.obs_organizaciones as ObsOrganizacion).filter(Boolean);
}

export async function getSectorIdsByOrganizacion(organizacionId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("obs_organizaciones_sectores")
    .select("sector_id")
    .eq("organizacion_id", organizacionId);
  if (error) throw new Error(error.message);
  return (data || []).map((row) => row.sector_id as string);
}

export async function getPoliticasBySector(sectorId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("obs_politicas").select("*").eq("sector_id", sectorId).eq("activo", true).order("codigo");
  if (error) throw new Error(error.message);
  return data as ObsPolitica[];
}

export async function getAllPoliticas() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("obs_politicas")
    .select("*, obs_sectores(nombre)")
    .order("codigo", { ascending: true });
  if (error) throw new Error(error.message);
  return data;
}

export async function getAllRegistros() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("obs_registros")
    .select("*, obs_organizaciones(nombre)")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}

export interface RegistroHistoricoValor {
  id: string;
  cantidad: number;
  campoNombre: string;
  campoOrden: number;
  indicadorNombre: string;
  politicaId: string | null;
  politicaCodigo: string;
  politicaDescripcion: string;
  sectorId: string | null;
  sectorNombre: string;
  nacionalidadNombre: string | null;
  perfilNombre: string | null;
}

export interface RegistroHistoricoPolitica {
  codigo: string;
  descripcion: string;
}

export interface RegistroHistorico {
  id: string;
  mes: number;
  anio: number;
  createdAt: string;
  createdById: string | null;
  creadorNombre: string | null;
  creadorEmail: string | null;
  organizacionId: string | null;
  organizacionNombre: string;
  totalAtenciones: number;
  totalValores: number;
  politicas: RegistroHistoricoPolitica[];
  valores: RegistroHistoricoValor[];
}

export async function getRegistrosHistoricos(
  organizacionId?: string,
): Promise<RegistroHistorico[]> {
  const supabase = await createClient();

  let query = supabase
    .from("obs_registros")
    .select(
      `
      id,
      mes,
      anio,
      created_at,
      created_by,
      organizacion_id,
      obs_organizaciones ( nombre ),
      obs_registros_valores (
        id,
        cantidad,
        nacionalidad_id,
        perfil_id,
        obs_indicador_campos (
          orden,
          obs_campos ( nombre ),
          obs_indicadores (
            nombre,
            obs_politicas (
              id,
              codigo,
              descripcion,
              sector_id,
              obs_sectores ( nombre )
            )
          )
        )
      )
    `,
    )
    .order("created_at", { ascending: false });

  if (organizacionId) {
    query = query.eq("organizacion_id", organizacionId);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  if (!data) return [];

  const creatorIds = [
    ...new Set(
      (data as any[])
        .map((r) => r.created_by as string | null)
        .filter(Boolean),
    ),
  ] as string[];

  const [nacRes, perfRes, creatorsRes] = await Promise.all([
    supabase.from("obs_nacionalidades").select("id, nombre"),
    supabase.from("obs_perfiles").select("id, nombre"),
    creatorIds.length > 0
      ? supabase
          .from("profiles")
          .select("id, nombre, email")
          .in("id", creatorIds)
      : Promise.resolve({ data: [] as { id: string; nombre: string | null; email: string | null }[], error: null }),
  ]);

  const nacMap = new Map<string, string>(
    (nacRes.data || []).map((n: any) => [n.id, n.nombre]),
  );
  const perfMap = new Map<string, string>(
    (perfRes.data || []).map((p: any) => [p.id, p.nombre]),
  );
  const creatorMap = new Map<
    string,
    { nombre: string | null; email: string | null }
  >(
    (creatorsRes.data || []).map((p: any) => [
      p.id,
      { nombre: p.nombre ?? null, email: p.email ?? null },
    ]),
  );

  const unwrap = <T,>(value: T | T[] | null | undefined): T | null => {
    if (value == null) return null;
    return Array.isArray(value) ? (value[0] ?? null) : value;
  };

  return (data as any[]).map((reg) => {
    const org = unwrap<any>(reg.obs_organizaciones);
    const rawValores = (reg.obs_registros_valores || []) as any[];

    const valores: RegistroHistoricoValor[] = rawValores.map((v) => {
      const ic = unwrap<any>(v.obs_indicador_campos);
      const campo = unwrap<any>(ic?.obs_campos);
      const ind = unwrap<any>(ic?.obs_indicadores);
      const pol = unwrap<any>(ind?.obs_politicas);
      const sec = unwrap<any>(pol?.obs_sectores);

      return {
        id: v.id,
        cantidad: v.cantidad ?? 0,
        campoNombre: campo?.nombre ?? "Sin especificar",
        campoOrden: parseInt(String(ic?.orden ?? "0"), 10),
        indicadorNombre: ind?.nombre ?? "Sin especificar",
        politicaId: pol?.id ?? null,
        politicaCodigo: pol?.codigo ?? "—",
        politicaDescripcion: pol?.descripcion ?? "",
        sectorId: pol?.sector_id ?? null,
        sectorNombre: sec?.nombre ?? "Sin especificar",
        nacionalidadNombre: v.nacionalidad_id
          ? (nacMap.get(v.nacionalidad_id) ?? "Sin especificar")
          : null,
        perfilNombre: v.perfil_id
          ? (perfMap.get(v.perfil_id) ?? "Sin especificar")
          : null,
      };
    });

    const totalAtenciones = valores.reduce((s, v) => s + v.cantidad, 0);
    const politicaMap = new Map<string, string>();
    for (const v of valores) {
      if (v.politicaCodigo && v.politicaCodigo !== "—") {
        politicaMap.set(v.politicaCodigo, v.politicaDescripcion);
      }
    }
    const politicas = Array.from(politicaMap.entries())
      .map(([codigo, descripcion]) => ({ codigo, descripcion }))
      .sort((a, b) =>
        a.codigo.localeCompare(b.codigo, "es", { numeric: true }),
      );

    const creator = reg.created_by
      ? creatorMap.get(reg.created_by)
      : undefined;

    return {
      id: reg.id,
      mes: reg.mes,
      anio: reg.anio,
      createdAt: reg.created_at,
      createdById: reg.created_by ?? null,
      creadorNombre: creator?.nombre ?? null,
      creadorEmail: creator?.email ?? null,
      organizacionId: reg.organizacion_id,
      organizacionNombre: org?.nombre ?? "Sin organización",
      totalAtenciones,
      totalValores: valores.length,
      politicas,
      valores,
    };
  });
}

export async function deleteRegistro(registroId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("No autenticado.");

  const { data: profile } = await supabase
    .from("profiles")
    .select("rol")
    .eq("id", user.id)
    .single();

  const role =
    profile?.rol ||
    (user.user_metadata?.rol as string | undefined) ||
    user.role ||
    "";

  if (!role.includes("admin") && role !== "super") {
    throw new Error("No tiene permisos para eliminar registros.");
  }

  const { error: valoresError } = await supabase
    .from("obs_registros_valores")
    .delete()
    .eq("registro_id", registroId);

  if (valoresError) throw new Error(valoresError.message);

  const { error: registroError } = await supabase
    .from("obs_registros")
    .delete()
    .eq("id", registroId);

  if (registroError) throw new Error(registroError.message);
}

export async function getIndicadoresByPolitica(politicaId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("obs_indicadores")
    .select("*, obs_politicas(*), obs_indicador_campos(*, obs_campos(*))")
    .eq("politica_id", politicaId)
    .eq("activo", true)
    .order("nombre");
  if (error) throw new Error(error.message);
  return data as ObsIndicador[];
}

export async function getAllCampos() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("obs_campos")
    .select("*")
    .eq("activo", true)
    .order("nombre");
  if (error) throw new Error(error.message);
  return data as ObsCampo[];
}

export async function getPredefinedFields(): Promise<ObsPredefinedField[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("obs_campos")
    .select("id, nombre, orden")
    .eq("activo", true);

  if (error) {
    const { data: fallback, error: fallbackError } = await supabase
      .from("obs_campos")
      .select("id, nombre")
      .eq("activo", true)
      .order("nombre", { ascending: true });
    if (fallbackError) throw new Error(fallbackError.message);
    return (fallback ?? []).map((row, index) => ({
      id: row.id,
      nombre: row.nombre,
      orden: index + 1,
    }));
  }

  return (data ?? [])
    .map((row, index) => ({
      id: row.id,
      nombre: row.nombre,
      orden: typeof row.orden === "number" ? row.orden : index + 1,
    }))
    .sort(
      (a, b) =>
        a.orden - b.orden ||
        a.nombre.localeCompare(b.nombre, "es", { sensitivity: "base" })
    );
}

export async function createPredefinedField(nombre: string, orden: number) {
  const trimmed = nombre.trim();
  if (!trimmed) throw new Error("El nombre no puede estar vacío.");

  const supabase = await createClient();
  let result = await supabase
    .from("obs_campos")
    .insert({ nombre: trimmed, activo: true, orden })
    .select("id, nombre, orden")
    .single();

  if (result.error) {
    result = await supabase
      .from("obs_campos")
      .insert({ nombre: trimmed, activo: true })
      .select("id, nombre")
      .single();
  }

  if (result.error) throw new Error(result.error.message);
  const row = result.data as { id: string; nombre: string; orden?: number | null };
  return {
    id: row.id,
    nombre: row.nombre,
    orden: row.orden ?? orden,
  } satisfies ObsPredefinedField;
}

export async function updatePredefinedField(id: string, nombre: string, orden: number) {
  const trimmed = nombre.trim();
  if (!trimmed) throw new Error("El nombre no puede estar vacío.");

  const supabase = await createClient();
  let result = await supabase
    .from("obs_campos")
    .update({ nombre: trimmed, orden })
    .eq("id", id)
    .select("id, nombre, orden")
    .single();

  if (result.error) {
    result = await supabase
      .from("obs_campos")
      .update({ nombre: trimmed })
      .eq("id", id)
      .select("id, nombre")
      .single();
  }

  if (result.error) throw new Error(result.error.message);
  const row = result.data as { id: string; nombre: string; orden?: number | null };
  return {
    id: row.id,
    nombre: row.nombre,
    orden: row.orden ?? orden,
  } satisfies ObsPredefinedField;
}

export async function deletePredefinedField(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("obs_campos")
    .update({ activo: false })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function createPolitica(sectorId: string, codigo: string, descripcion: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("obs_politicas")
    .insert({
      sector_id: sectorId,
      codigo: codigo.trim(),
      descripcion: descripcion.trim(),
      activo: true
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as ObsPolitica;
}

export interface FormValor {
  id: string;
  nombre: string;
  persisted?: boolean;
  indicadorCampoId?: string; // ID from obs_indicador_campos if persisted
  campoId?: string; // Real obs_campos.id when referencing an existing catalog field
}

export interface FormIndicador {
  id: string;
  nombre: string;
  valores: FormValor[];
  persisted?: boolean;
}

export async function createPoliticaConIndicadores(
  sectorId: string, 
  codigo: string, 
  descripcion: string, 
  gruposIndicadores: FormIndicador[],
  politicaId?: string | null
) {
  const supabase = await createClient();
  
  let currentPoliticaId = politicaId;

  if (currentPoliticaId) {
    // Actualizar política existente
    const { error: polError } = await supabase
      .from("obs_politicas")
      .update({
        sector_id: sectorId,
        codigo: codigo.trim(),
        descripcion: descripcion.trim()
      })
      .eq("id", currentPoliticaId);
      
    if (polError) throw new Error(polError.message);
  } else {
    // Crear nueva política
    const { data: pol, error: polError } = await supabase
      .from("obs_politicas")
      .insert({
        sector_id: sectorId,
        codigo: codigo.trim(),
        descripcion: descripcion.trim(),
        activo: true
      })
      .select()
      .single();
      
    if (polError) throw new Error(polError.message);
    currentPoliticaId = pol.id;
  }

  for (const grupo of gruposIndicadores) {
    let currentIndicadorId = grupo.id;

    if (grupo.persisted) {
      // Actualizar nombre del indicador persistido
      const { error: indError } = await supabase
        .from("obs_indicadores")
        .update({ nombre: grupo.nombre.trim() })
        .eq("id", grupo.id);

      if (indError) throw new Error(indError.message);
    } else {
      // Insertar nuevo indicador
      const { data: ind, error: indError } = await supabase
        .from("obs_indicadores")
        .insert({
          politica_id: currentPoliticaId,
          nombre: grupo.nombre.trim(),
          activo: true
        })
        .select()
        .single();

      if (indError) throw new Error(indError.message);
      currentIndicadorId = ind.id;
    }

    if (grupo.persisted) {
      // Desactivar todos los campos existentes de este indicador temporalmente
      // Los que sigan existiendo en el form se volverán a activar en el loop
      const { error: deactivateError } = await supabase
        .from("obs_indicador_campos")
        .update({ activo: false })
        .eq("indicador_id", currentIndicadorId);
        
      if (deactivateError) throw new Error(deactivateError.message);
    }

    // Procesar campos (valores) via obs_campos + obs_indicador_campos
    for (let i = 0; i < grupo.valores.length; i++) {
      const valor = grupo.valores[i];

      if (valor.persisted) {
        // Actualizar nombre del campo en obs_campos
        const { error: campoError } = await supabase
          .from("obs_campos")
          .update({ nombre: valor.nombre.trim() })
          .eq("id", valor.id);

        if (campoError) throw new Error(campoError.message);

        // Actualizar orden y estado en obs_indicador_campos si existe
        if (valor.indicadorCampoId) {
          const { error: icError } = await supabase
            .from("obs_indicador_campos")
            .update({ orden: String(i + 1), activo: true })
            .eq("id", valor.indicadorCampoId);

          if (icError) throw new Error(icError.message);
        }
      } else if (valor.campoId) {
        // Campo ya existe en obs_campos (del catálogo), solo crear la relación
        const { error: icError } = await supabase
          .from("obs_indicador_campos")
          .insert({
            indicador_id: currentIndicadorId,
            campo_id: valor.campoId,
            orden: String(i + 1),
            activo: true
          });

        if (icError) throw new Error(icError.message);
      } else {
        // Crear nuevo campo en obs_campos
        const { data: campo, error: campoError } = await supabase
          .from("obs_campos")
          .insert({
            nombre: valor.nombre.trim(),
            activo: true
          })
          .select()
          .single();

        if (campoError) throw new Error(campoError.message);

        // Crear relación en obs_indicador_campos
        const { error: icError } = await supabase
          .from("obs_indicador_campos")
          .insert({
            indicador_id: currentIndicadorId,
            campo_id: campo.id,
            orden: String(i + 1),
            activo: true
          });

        if (icError) throw new Error(icError.message);
      }
    }
  }
  
  return { id: currentPoliticaId };
}

export async function createRegistro(organizacionId: string, mes: number, anio: number, registros: RegistroEntrada[]) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  const userId = session?.user?.id;

  const { data: registro, error: regError } = await supabase
    .from("obs_registros")
    .insert({
      organizacion_id: organizacionId,
      mes,
      anio,
      created_by: userId
    })
    .select()
    .single();

  if (regError) throw new Error(regError.message);

  // Build valor rows from all entries
  const valoresToInsert = registros.flatMap((entry) =>
    Object.entries(entry.valores).map(([indicadorCampoId, cantidad]) => ({
      registro_id: registro.id,
      indicador_campo_id: indicadorCampoId,
      cantidad: parseInt(cantidad || "0", 10),
      nacionalidad_id: entry.nacionalidadId && entry.nacionalidadId !== "__none__" ? entry.nacionalidadId : null,
      perfil_id: entry.perfilId && entry.perfilId !== "__none__" ? entry.perfilId : null
    }))
  );

  if (valoresToInsert.length > 0) {
    const { error: valError } = await supabase
      .from("obs_registros_valores")
      .insert(valoresToInsert);

    if (valError) throw new Error(valError.message);
  }

  return registro;
}

export async function createSector(nombre: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("obs_sectores")
    .insert({ nombre: nombre.trim() })
    .select()
    .single();
  
  if (error) throw new Error(error.message);
  return data as ObsSector;
}

export interface OrgWithSectors {
  id: string;
  nombre: string;
  logo: string | null;
  sectores: { id: string; nombre: string }[];
}

export async function getOrganizacionesLogos(): Promise<
  { id: string; nombre: string; logo: string | null }[]
> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("obs_organizaciones")
    .select("id, nombre, logo")
    .order("nombre");
  if (error) throw new Error(error.message);

  return (data ?? []).map((org) => ({
    id: org.id,
    nombre: org.nombre,
    logo: org.logo ?? null,
  }));
}

export async function getAllOrganizaciones(): Promise<OrgWithSectors[]> {
  const supabase = await createClient();
  // Traer todas las organizaciones
  const { data: orgs, error: orgError } = await supabase
    .from("obs_organizaciones")
    .select("id, nombre, logo")
    .order("nombre");
  if (orgError) throw new Error(orgError.message);

  // Traer todos los vínculos con sectores
  const { data: links, error: linkError } = await supabase
    .from("obs_organizaciones_sectores")
    .select("organizacion_id, sector_id, obs_sectores(id, nombre)");
  if (linkError) throw new Error(linkError.message);

  // Agrupar sectores por organización
  const sectorsByOrg = new Map<string, { id: string; nombre: string }[]>();
  for (const link of links || []) {
    const orgId = link.organizacion_id;
    const sector = (link as any).obs_sectores as { id: string; nombre: string } | null;
    if (!sector) continue;
    if (!sectorsByOrg.has(orgId)) sectorsByOrg.set(orgId, []);
    sectorsByOrg.get(orgId)!.push(sector);
  }

  return (orgs || []).map((org: any) => ({
    id: org.id,
    nombre: org.nombre,
    logo: org.logo ?? null,
    sectores: sectorsByOrg.get(org.id) || [],
  }));
}

export async function updateOrganizacionLogo(organizacionId: string, logo: string | null) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("obs_organizaciones")
    .update({ logo })
    .eq("id", organizacionId);
  if (error) throw new Error(error.message);
}

export async function updateOrganizacionNombre(organizacionId: string, nombre: string) {
  const trimmed = nombre.trim();
  if (!trimmed) throw new Error("El nombre no puede estar vacío.");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("obs_organizaciones")
    .update({ nombre: trimmed })
    .eq("id", organizacionId)
    .select("id, nombre")
    .single();
  if (error) throw new Error(error.message);
  return data as ObsOrganizacion;
}

export async function createOrganizacion(nombre: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("obs_organizaciones")
    .insert({ nombre: nombre.trim() })
    .select("id, nombre")
    .single();
  if (error) throw new Error(error.message);
  return data as ObsOrganizacion;
}

export async function unlinkOrganizacionFromSector(organizacionId: string, sectorId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("obs_organizaciones_sectores")
    .delete()
    .eq("organizacion_id", organizacionId)
    .eq("sector_id", sectorId);
  if (error) throw new Error(error.message);
}

export async function linkOrganizacionToSector(organizacionId: string, sectorId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("obs_organizaciones_sectores")
    .insert({ organizacion_id: organizacionId, sector_id: sectorId });
  if (error) throw new Error(error.message);
}

export async function getNacionalidades() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("obs_nacionalidades")
    .select("*")
    .order("nombre");
  if (error) throw new Error(error.message);
  return data as ObsNacionalidad[];
}

export async function getPerfiles() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("obs_perfiles")
    .select("*")
    .order("nombre");
  if (error) throw new Error(error.message);
  return data as ObsPerfil[];
}

export async function createNacionalidad(nombre: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("obs_nacionalidades")
    .insert({ nombre: nombre.trim() })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as ObsNacionalidad;
}

export async function createPerfil(nombre: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("obs_perfiles")
    .insert({ nombre: nombre.trim() })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as ObsPerfil;
}

export async function updateNacionalidad(id: string, nombre: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("obs_nacionalidades")
    .update({ nombre: nombre.trim() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as ObsNacionalidad;
}

export async function updatePerfil(id: string, nombre: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("obs_perfiles")
    .update({ nombre: nombre.trim() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as ObsPerfil;
}

export async function deleteNacionalidad(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("obs_nacionalidades")
    .delete()
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deletePerfil(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("obs_perfiles")
    .delete()
    .eq("id", id);
  if (error) throw new Error(error.message);
}
