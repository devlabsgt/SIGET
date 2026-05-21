"use server";

import { createClient } from "@/utils/supabase/server";

export interface ObsSector {
  id: string;
  nombre: string;
}

export interface ObsOrganizacion {
  id: string;
  nombre: string;
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
    .select("organizacion_id, obs_organizaciones(id, nombre)")
    .eq("sector_id", sectorId);
  if (error) throw new Error(error.message);
  return (data || []).map((row: any) => row.obs_organizaciones as ObsOrganizacion).filter(Boolean);
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
  sectores: { id: string; nombre: string }[];
}

export async function getAllOrganizaciones(): Promise<OrgWithSectors[]> {
  const supabase = await createClient();
  // Traer todas las organizaciones
  const { data: orgs, error: orgError } = await supabase
    .from("obs_organizaciones")
    .select("id, nombre")
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
    sectores: sectorsByOrg.get(org.id) || [],
  }));
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
