"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import {
  Plus,
  UserPlus,
  Briefcase,
  ListTree,
  ChevronsDown,
  Pencil,
} from "lucide-react";
import AnimatedIcon from "@/components/ui/AnimatedIcon";
import { Button } from "@/components/ui/button";
import { useUserContext } from "@/components/(base)/providers/UserProvider";
import { isSuperOrAdminRole } from "@/components/(base)/dashboard/modules";
import {
  OrganizacionTree,
  type AdminHandlers,
} from "./OrganizacionTree";
import { OrganigramaModal } from "./OrganigramaVertical";
import { OrganigramaIcon } from "./OrganigramaIcon";
import { OrganizacionSkeleton } from "./OrganizacionSkeleton";
import { useEstructuraOrganizacional, usePuestos, useAsignarPersonaAPuesto } from "./lib/hooks";
import { departamentoTieneJefe, puestosEnDepartamento } from "./lib/zod";
import { confirmarDesasignarPersona } from "./lib/swal";
import { modalActionMessage } from "@/components/ui/modal-toast";
import { CrearEstructura } from "./forms/Crear";
import { VerEditarEstructura } from "./forms/VerEditar";
import { AsignarPersonaPuesto } from "./forms/AsignarPersona";
import { ReubicarPuestoModal } from "./forms/ReubicarPuesto";

export function OrganizacionJerarquica() {
  const router = useRouter();
  const { effectiveRole } = useUserContext();
  const { data, isLoading, isError, refetch } = useEstructuraOrganizacional();
  const { data: puestos = [] } = usePuestos();
  const desasignarPersonaMutation = useAsignarPersonaAPuesto();
  const puedeEliminar = isSuperOrAdminRole(effectiveRole);

  const estructura = data ?? null;

  const [crear, setCrear] = useState<{
    open: boolean;
    tipo: "departamento" | "puesto";
    parentId: string | null;
    departamentoId?: string;
  }>({ open: false, tipo: "departamento", parentId: null });

  const [editar, setEditar] = useState<{
    open: boolean;
    tipo: "departamento" | "puesto";
    id: string | null;
  }>({ open: false, tipo: "departamento", id: null });

  const [asignar, setAsignar] = useState<{
    open: boolean;
    puestoId: string | null;
    puestoNombre: string;
  }>({ open: false, puestoId: null, puestoNombre: "" });

  const [reubicar, setReubicar] = useState<{
    open: boolean;
    puestoId: string | null;
    puestoNombre: string;
    departamentoActualId: string | null;
  }>({
    open: false,
    puestoId: null,
    puestoNombre: "",
    departamentoActualId: null,
  });

  const [organigramaOpen, setOrganigramaOpen] = useState(false);

  const abrirCrearDepartamento = (parentId: string | null = null) =>
    setCrear({ open: true, tipo: "departamento", parentId });

  const desasignarPersona = useCallback(
    async (puestoId: string, titularNombre: string) => {
      const result = await confirmarDesasignarPersona({
        title: "¿Desasignar persona?",
        text: `Se quitará a ${titularNombre} de este puesto.`,
      });
      if (!result.isConfirmed) return;

      const res = await desasignarPersonaMutation.mutateAsync({
        puesto_id: puestoId,
        profile_id: null,
      });

      if (res.success) {
        toast.success("Persona desasignada del puesto.");
        return;
      }

      toast.error(
        modalActionMessage(
          res.error ?? undefined,
          "No se pudo desasignar la persona.",
        ),
      );
    },
    [desasignarPersonaMutation],
  );

  const admin: AdminHandlers = useMemo(
    () => ({
      onAddDepartamento: (parentId) => abrirCrearDepartamento(parentId),
      onAddPuesto: (departamentoId) => {
        const enDep = puestosEnDepartamento(puestos, departamentoId);
        const tieneJefe = departamentoTieneJefe(puestos, departamentoId);
        if (enDep.length > 0 && !tieneJefe) {
          toast.warn(
            "Debe existir un jefe en esta dependencia antes de agregar más puestos.",
          );
          return;
        }
        setCrear({
          open: true,
          tipo: "puesto",
          parentId: null,
          departamentoId,
        });
      },
      onAsignarPersona: (puestoId, puestoNombre) =>
        setAsignar({ open: true, puestoId, puestoNombre }),
      onDesasignarPersona: (puestoId, _puestoNombre, titularNombre) =>
        void desasignarPersona(puestoId, titularNombre),
      onReubicarPuesto: (puestoId, puestoNombre) => {
        const puesto = puestos.find((p) => p.id === puestoId);
        setReubicar({
          open: true,
          puestoId,
          puestoNombre,
          departamentoActualId: puesto?.departamento_id ?? null,
        });
      },
      onEdit: (tipo, id) => setEditar({ open: true, tipo, id }),
    }),
    [puestos, desasignarPersona],
  );

  const estaVacio = Boolean(
    estructura && (!estructura.hijos || estructura.hijos.length === 0),
  );

  useEffect(() => {
    if (!isSuperOrAdminRole(effectiveRole)) {
      router.replace("/siget");
    }
  }, [effectiveRole, router]);

  if (!isSuperOrAdminRole(effectiveRole)) {
    return null;
  }

  return (
    <div className="relative w-full min-h-0 px-0 pt-2 pb-12 md:min-h-[calc(100vh-4rem)] md:px-8 md:pt-6 md:pb-16 lg:px-12">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#d1d5db_1px,transparent_1px)] bg-size-[24px_24px] opacity-50 dark:bg-[radial-gradient(oklch(36%_0_0)_1px,transparent_1px)] dark:opacity-40" />

      <div className="relative z-10 mx-auto w-full max-w-[min(100%,1600px)] space-y-4 md:space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4 min-w-0 px-4 md:gap-5 md:px-0">
            <div className="flex size-14 md:size-24 shrink-0 items-center justify-center rounded-2xl border border-celeste-trifinio/30 bg-zinc-100 p-1.5 shadow-sm md:p-2 dark:bg-zinc-800">
              <AnimatedIcon iconKey="sagolbcs" size={56} speed={1.5} />
            </div>
            <div className="space-y-2 min-w-0">
              <p className="text-[10px] font-black uppercase tracking-widest text-celeste-trifinio">
                Plan Trifinio
              </p>
              <h1 className="text-2xl font-black tracking-tight text-foreground md:text-4xl">
                Organización Administrativa
              </h1>
              <p className="text-sm md:text-base text-muted-foreground max-w-3xl">
                Visualización jerárquica de la estructura institucional del Plan
                Trifinio entre los tres países de la región.
              </p>
            </div>
          </div>

          {!isLoading && !isError && estructura && !estaVacio && (
            <div className="shrink-0 w-full px-4 md:px-0 lg:w-auto">
              <button
                type="button"
                onClick={() => setOrganigramaOpen(true)}
                className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-celeste-trifinio/40 bg-card px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-celeste-trifinio transition-colors hover:bg-celeste-trifinio/10 lg:w-auto"
              >
                <OrganigramaIcon className="size-4" />
                Ver organigrama
              </button>
            </div>
          )}
        </div>

        <div className="max-md:border-0 max-md:bg-transparent max-md:p-0 max-md:shadow-none rounded-2xl border border-border/60 bg-zinc-100 p-0 dark:bg-zinc-800 md:p-8 lg:p-10 md:shadow-sm md:min-h-[calc(100vh-18rem)]">
          {isLoading && <OrganizacionSkeleton />}

          {!isLoading && isError && (
            <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
              <p className="text-sm font-bold text-destructive">
                No se pudo verificar el acceso a la estructura.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <Button variant="outline" onClick={() => refetch()}>
                  Reintentar
                </Button>
                <Button onClick={() => abrirCrearDepartamento(null)}>
                  <Plus className="size-4" />
                  Crear departamento
                </Button>
              </div>
            </div>
          )}

          {!isLoading && !isError && estructura && (
            <>
              {!estaVacio && (
                <div className="mb-4 border-b border-border/50 px-4 pb-4 md:hidden">
                  <div className="flex flex-nowrap items-center gap-4 overflow-x-auto text-xs text-muted-foreground">
                    <span className="inline-flex shrink-0 items-center gap-1.5">
                      <ListTree className="size-3.5 text-celeste-trifinio" />
                      Añadir dependencia
                    </span>
                    <span className="inline-flex shrink-0 items-center gap-1.5">
                      <Briefcase className="size-3.5 text-celeste-trifinio" />
                      Añadir puesto
                    </span>
                    <span className="inline-flex shrink-0 items-center gap-1.5">
                      <UserPlus className="size-3.5 text-celeste-trifinio" />
                      Asignar persona
                    </span>
                    <span className="inline-flex shrink-0 items-center gap-1.5">
                      <Pencil className="size-3.5 text-celeste-trifinio" />
                      Editar
                    </span>
                    <span className="inline-flex shrink-0 items-center gap-1.5">
                      <ChevronsDown className="size-3.5 text-celeste-trifinio" />
                      Abrir / cerrar todo
                    </span>
                  </div>
                </div>
              )}
              <OrganizacionTree estructura={estructura} admin={admin} />
            </>
          )}
        </div>
      </div>

      {estructura && (
        <OrganigramaModal
          open={organigramaOpen}
          onClose={() => setOrganigramaOpen(false)}
          estructura={estructura}
          admin={admin}
        />
      )}

      <CrearEstructura
        open={crear.open}
        onOpenChange={(open) => setCrear((prev) => ({ ...prev, open }))}
        tipo={crear.tipo}
        presetParentId={crear.parentId}
        presetDepartamentoId={crear.departamentoId}
      />

      <VerEditarEstructura
        open={editar.open}
        onOpenChange={(open) => setEditar((prev) => ({ ...prev, open }))}
        tipo={editar.tipo}
        id={editar.id}
        puedeEliminar={puedeEliminar}
      />

      <AsignarPersonaPuesto
        open={asignar.open}
        onOpenChange={(open) => setAsignar((prev) => ({ ...prev, open }))}
        puestoId={asignar.puestoId}
        puestoNombre={asignar.puestoNombre}
      />

      <ReubicarPuestoModal
        open={reubicar.open}
        onOpenChange={(open) => setReubicar((prev) => ({ ...prev, open }))}
        puestoId={reubicar.puestoId}
        puestoNombre={reubicar.puestoNombre}
        departamentoActualId={reubicar.departamentoActualId}
      />
    </div>
  );
}
