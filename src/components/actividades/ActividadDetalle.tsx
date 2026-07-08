"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, Loader2, Pencil } from "lucide-react";
import { useActividad, useRegistrosActividad } from "./lib/hooks";
import { formatFechaActividad } from "./lib/zod";
import {
  statsPorDepartamento,
  statsPorGenero,
  statsPorRangoEdad,
  statsPorTrifinio,
} from "./lib/stats";
import { QrActividad } from "./QrActividad";
import { GraficasAsistencia } from "./GraficasAsistencia";
import { TablaRegistros } from "./TablaRegistros";
import { VerEditarActividad } from "./forms/VerEditar";

export function ActividadDetalle({ actividadId }: { actividadId: string }) {
  const { data: actividad, isLoading: loadingAct } = useActividad(actividadId);
  const { data: registros = [], isLoading: loadingReg } =
    useRegistrosActividad(actividadId);
  const [editarOpen, setEditarOpen] = useState(false);

  const porGenero = useMemo(() => statsPorGenero(registros), [registros]);
  const porDepartamento = useMemo(
    () => statsPorDepartamento(registros),
    [registros],
  );
  const porRangoEdad = useMemo(() => statsPorRangoEdad(registros), [registros]);
  const porTrifinio = useMemo(() => statsPorTrifinio(registros), [registros]);

  if (loadingAct) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="size-8 animate-spin text-celeste-trifinio" />
      </div>
    );
  }

  if (!actividad) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="text-lg font-semibold text-foreground">
          Actividad no encontrada
        </p>
        <Link
          href="/siget/actividades"
          className="mt-4 inline-flex cursor-pointer text-sm font-bold text-azul-trifinio hover:underline"
        >
          Volver al listado
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <Link
        href="/siget/actividades"
        className="mb-6 inline-flex cursor-pointer items-center gap-1 text-sm font-bold text-azul-trifinio hover:underline"
      >
        <ChevronLeft className="size-4" />
        Volver a actividades
      </Link>

      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
            Detalle de actividad
          </p>
          <h1 className="text-2xl font-black text-foreground sm:text-3xl">
            {actividad.nombre}
          </h1>
          <p className="mt-1 text-sm font-semibold capitalize text-celeste-trifinio">
            {formatFechaActividad(actividad.fecha_realizacion)}
          </p>
          {actividad.descripcion && (
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              {actividad.descripcion}
            </p>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-bold text-sky-700 dark:bg-sky-950 dark:text-sky-300">
              {registros.length} registros
            </span>
            {!actividad.activo && (
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700 dark:bg-amber-950 dark:text-amber-400">
                Inactiva
              </span>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={() => setEditarOpen(true)}
          className="inline-flex h-9 shrink-0 cursor-pointer items-center gap-1.5 self-start rounded-lg bg-sky-100 px-3 text-xs font-bold text-azul-trifinio transition-colors hover:bg-sky-200 dark:bg-sky-950 dark:text-azul-trifinio dark:hover:bg-sky-900"
        >
          <Pencil className="size-3.5" />
          Editar actividad
        </button>
      </div>

      <div className="mb-8 grid gap-6 lg:grid-cols-[auto_1fr]">
        <div className="rounded-2xl bg-zinc-50 p-6 dark:bg-zinc-800/60">
          <p className="mb-4 text-center text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
            Código QR de asistencia
          </p>
          <QrActividad
            actividadId={actividadId}
            nombreActividad={actividad.nombre}
            size={220}
          />
          <p className="mt-4 text-center text-xs text-muted-foreground">
            Escanea para abrir el formulario público de registro.
          </p>
        </div>
        <div>
          <GraficasAsistencia
            porGenero={porGenero}
            porDepartamento={porDepartamento}
            porRangoEdad={porRangoEdad}
            porTrifinio={porTrifinio}
          />
        </div>
      </div>

      <div className="rounded-2xl bg-zinc-50 p-5 dark:bg-zinc-800/60">
        <h2 className="mb-4 text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
          Registros de asistencia
        </h2>
        <TablaRegistros
          registros={registros}
          actividadId={actividadId}
          isLoading={loadingReg}
        />
      </div>

      <VerEditarActividad
        open={editarOpen}
        actividad={actividad}
        onClose={() => setEditarOpen(false)}
      />
    </div>
  );
}
