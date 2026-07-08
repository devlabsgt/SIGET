"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  CalendarCheck,
  Loader2,
  Pencil,
  Plus,
  QrCode,
  Trash2,
  Users,
} from "lucide-react";
import { toast } from "react-toastify";
import { cn } from "@/lib/utils";
import { useActividades, useEliminarActividad } from "./lib/hooks";
import { confirmQuitarActividad } from "./lib/swal";
import { CrearActividad } from "./forms/Crear";
import { VerEditarActividad } from "./forms/VerEditar";
import type { ActividadRecord } from "./lib/zod";
import { formatFechaActividad } from "./lib/zod";

export default function ActividadesList() {
  const router = useRouter();
  const { data: actividades = [], isLoading, error } = useActividades();
  const eliminar = useEliminarActividad();
  const [crearOpen, setCrearOpen] = useState(false);
  const [editarActividad, setEditarActividad] = useState<ActividadRecord | null>(
    null,
  );
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (act: ActividadRecord) => {
    const ok = await confirmQuitarActividad(
      `¿Eliminar la actividad «${act.nombre}» y todos sus registros?`,
    );
    if (!ok) return;
    setDeletingId(act.id);
    const res = await eliminar.mutateAsync(act.id);
    setDeletingId(null);
    if (res.success) {
      toast.success("Actividad eliminada.");
    } else {
      toast.error("No se pudo eliminar la actividad.");
    }
  };

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
            SIGET
          </p>
          <h1 className="text-2xl font-black text-foreground sm:text-3xl">
            Registro de asistencia
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Crea actividades, genera un código QR y consulta los registros.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCrearOpen(true)}
          className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-azul-trifinio px-6 text-[10px] font-bold uppercase tracking-widest text-white transition-opacity hover:opacity-90 active:scale-95"
        >
          <Plus className="size-4" />
          Nueva actividad
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="size-8 animate-spin text-celeste-trifinio" />
        </div>
      ) : error ? (
        <p className="py-12 text-center text-sm text-red-500">
          No se pudieron cargar las actividades.
        </p>
      ) : actividades.length === 0 ? (
        <div className="rounded-2xl bg-zinc-50 p-12 text-center dark:bg-zinc-800/60">
          <CalendarCheck className="mx-auto mb-4 size-10 text-muted-foreground" />
          <p className="font-semibold text-foreground">Sin actividades</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Crea tu primera actividad para generar un QR de asistencia.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <AnimatePresence mode="popLayout" initial={false}>
            {actividades.map((act) => (
              <motion.div
                key={act.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8, scale: 0.99 }}
                transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
                className="group rounded-2xl bg-zinc-50 p-5 dark:bg-zinc-800/60"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h2 className="truncate text-lg font-black text-foreground">
                        {act.nombre}
                      </h2>
                      {!act.activo && (
                        <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-700 dark:bg-amber-950 dark:text-amber-400">
                          Inactiva
                        </span>
                      )}
                    </div>
                    {act.descripcion && (
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                        {act.descripcion}
                      </p>
                    )}
                    <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Users className="size-3.5" />
                        {act.total_registros ?? 0} registros
                      </span>
                      <span className="inline-flex items-center gap-1 capitalize">
                        <CalendarCheck className="size-3.5" />
                        {formatFechaActividad(act.fecha_realizacion)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link
                    href={`/siget/actividades/${act.id}`}
                    className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg bg-sky-100 px-3 text-xs font-bold text-azul-trifinio transition-colors hover:bg-sky-200 dark:bg-sky-950 dark:text-azul-trifinio dark:hover:bg-sky-900"
                  >
                    <QrCode className="size-3.5" />
                    Ver QR y registros
                  </Link>
                  <button
                    type="button"
                    onClick={() => setEditarActividad(act)}
                    className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg bg-sky-100 px-3 text-xs font-bold text-azul-trifinio transition-colors hover:bg-sky-200 dark:bg-sky-950 dark:text-azul-trifinio dark:hover:bg-sky-900"
                  >
                    <Pencil className="size-3.5" />
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(act)}
                    disabled={deletingId === act.id}
                    className={cn(
                      "inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg bg-red-100 px-3 text-xs font-bold text-red-600 transition-colors hover:bg-red-200 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-red-950 dark:text-red-400 dark:hover:bg-red-900",
                    )}
                  >
                    {deletingId === act.id ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="size-3.5" />
                    )}
                    Eliminar
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <CrearActividad
        open={crearOpen}
        onClose={() => setCrearOpen(false)}
        onCreated={(id) => router.push(`/siget/actividades/${id}`)}
      />

      <VerEditarActividad
        open={!!editarActividad}
        actividad={editarActividad}
        onClose={() => setEditarActividad(null)}
      />
    </div>
  );
}
