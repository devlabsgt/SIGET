"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  asignarPersonaAPuesto,
  createDepartamento,
  createPuesto,
  deleteDepartamento,
  deletePuesto,
  getDepartamentos,
  getEstructuraOrganizacional,
  getPersonasParaAsignar,
  getPuestos,
  updateDepartamento,
  updatePuesto,
  reubicarPuesto,
} from "./actions";
import {
  ESTRUCTURA_VACIA,
  type AsignarPersonaValues,
  type DepartamentoFormValues,
  type PuestoFormValues,
  type ReubicarPuestoValues,
} from "./zod";

const ESTRUCTURA_KEY = ["estructura-organizacional"];
const DEPARTAMENTOS_KEY = ["departamentos-flat"];
const PUESTOS_KEY = ["puestos-flat"];
const PERSONAS_ASIGNAR_KEY = "personas-para-asignar";

export function useEstructuraOrganizacional() {
  return useQuery({
    queryKey: ESTRUCTURA_KEY,
    queryFn: async () => {
      const result = await getEstructuraOrganizacional();
      if (result.error === "UNAUTHORIZED" || result.error === "FORBIDDEN") {
        throw new Error(result.error);
      }
      return result.data ?? ESTRUCTURA_VACIA;
    },
  });
}

export function useDepartamentos() {
  return useQuery({
    queryKey: DEPARTAMENTOS_KEY,
    queryFn: getDepartamentos,
  });
}

export function usePuestos() {
  return useQuery({
    queryKey: PUESTOS_KEY,
    queryFn: getPuestos,
  });
}

function useInvalidateEstructura() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ESTRUCTURA_KEY });
    queryClient.invalidateQueries({ queryKey: DEPARTAMENTOS_KEY });
    queryClient.invalidateQueries({ queryKey: PUESTOS_KEY });
  };
}

export function useCrearDepartamento() {
  const invalidate = useInvalidateEstructura();
  return useMutation({
    mutationFn: (values: DepartamentoFormValues) => createDepartamento(values),
    onSuccess: invalidate,
  });
}

export function useEditarDepartamento() {
  const invalidate = useInvalidateEstructura();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: DepartamentoFormValues }) =>
      updateDepartamento(id, values),
    onSuccess: invalidate,
  });
}

export function useEliminarDepartamento() {
  const invalidate = useInvalidateEstructura();
  return useMutation({
    mutationFn: (id: string) => deleteDepartamento(id),
    onSuccess: invalidate,
  });
}

export function useCrearPuesto() {
  const invalidate = useInvalidateEstructura();
  return useMutation({
    mutationFn: (values: PuestoFormValues) => createPuesto(values),
    onSuccess: invalidate,
  });
}

export function useEditarPuesto() {
  const invalidate = useInvalidateEstructura();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: PuestoFormValues }) =>
      updatePuesto(id, values),
    onSuccess: invalidate,
  });
}

export function useEliminarPuesto() {
  const invalidate = useInvalidateEstructura();
  return useMutation({
    mutationFn: (id: string) => deletePuesto(id),
    onSuccess: invalidate,
  });
}

export function useReubicarPuesto() {
  const invalidate = useInvalidateEstructura();
  return useMutation({
    mutationFn: (values: ReubicarPuestoValues) => reubicarPuesto(values),
    onSuccess: invalidate,
  });
}

export function usePersonasParaAsignar(puestoId: string | null, enabled: boolean) {
  return useQuery({
    queryKey: [PERSONAS_ASIGNAR_KEY, puestoId],
    queryFn: () => getPersonasParaAsignar(puestoId!),
    enabled: enabled && Boolean(puestoId),
  });
}

export function useAsignarPersonaAPuesto() {
  const queryClient = useQueryClient();
  const invalidate = useInvalidateEstructura();
  return useMutation({
    mutationFn: (values: AsignarPersonaValues) => asignarPersonaAPuesto(values),
    onSuccess: (result) => {
      if (result.success) {
        invalidate();
        queryClient.invalidateQueries({ queryKey: [PERSONAS_ASIGNAR_KEY] });
      }
    },
  });
}
