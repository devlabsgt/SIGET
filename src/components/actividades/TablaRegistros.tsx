"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Search, Trash2 } from "lucide-react";
import { toast } from "react-toastify";
import type { RegistroAsistenciaRecord } from "./lib/zod";
import { useEliminarRegistro } from "./lib/hooks";
import { confirmQuitarActividad } from "./lib/swal";

function formatFecha(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("es-GT", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function celdaOpcional(value: string | null) {
  return value?.trim() ? value : "—";
}

export function TablaRegistros({
  registros,
  actividadId,
  isLoading,
}: {
  registros: RegistroAsistenciaRecord[];
  actividadId: string;
  isLoading: boolean;
}) {
  const [search, setSearch] = useState("");
  const eliminar = useEliminarRegistro(actividadId);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return registros;
    return registros.filter(
      (r) =>
        r.dpi.includes(q) ||
        r.nombre.toLowerCase().includes(q) ||
        (r.puesto ?? "").toLowerCase().includes(q) ||
        r.departamento.toLowerCase().includes(q) ||
        r.municipio.toLowerCase().includes(q) ||
        (r.direccion_administrativa ?? "").toLowerCase().includes(q),
    );
  }, [registros, search]);

  const handleDelete = async (id: string, nombre: string) => {
    const ok = await confirmQuitarActividad(
      `¿Eliminar el registro de ${nombre}?`,
    );
    if (!ok) return;
    setDeletingId(id);
    const res = await eliminar.mutateAsync(id);
    setDeletingId(null);
    if (res.success) {
      toast.success("Registro eliminado.");
    } else {
      toast.error("No se pudo eliminar el registro.");
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="size-8 animate-spin text-celeste-trifinio" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-10 w-full rounded-xl border-2 border-celeste-trifinio bg-transparent pl-10 pr-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-celeste-trifinio/30"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          {registros.length === 0
            ? "Aún no hay registros de asistencia."
            : "No se encontraron registros."}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border dark:border-zinc-700">
          <table className="w-full min-w-[960px] text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-zinc-50 text-[10px] font-bold uppercase tracking-widest text-muted-foreground dark:border-zinc-700 dark:bg-zinc-800">
                <th className="px-4 py-3">Fecha y hora</th>
                <th className="px-4 py-3">DPI</th>
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Trifinio</th>
                <th className="px-4 py-3">Puesto</th>
                <th className="px-4 py-3">Dir. administrativa</th>
                <th className="px-4 py-3">Género</th>
                <th className="px-4 py-3">Departamento</th>
                <th className="px-4 py-3">Municipio</th>
                <th className="px-4 py-3 w-12" />
              </tr>
            </thead>
            <tbody>
              <AnimatePresence mode="popLayout" initial={false}>
                {filtered.map((r) => (
                  <motion.tr
                    key={r.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                    className="border-b border-border last:border-0 dark:border-zinc-800"
                  >
                    <td className="px-4 py-3 whitespace-nowrap text-xs text-muted-foreground">
                      {formatFecha(r.created_at)}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs tabular-nums">
                      {r.dpi}
                    </td>
                    <td className="px-4 py-3 font-semibold">{r.nombre}</td>
                    <td className="px-4 py-3">
                      {r.es_trifinio ? "Sí" : "No"}
                    </td>
                    <td className="px-4 py-3">{celdaOpcional(r.puesto)}</td>
                    <td className="px-4 py-3">
                      {celdaOpcional(r.direccion_administrativa)}
                    </td>
                    <td className="px-4 py-3 capitalize">{r.genero}</td>
                    <td className="px-4 py-3">{r.departamento}</td>
                    <td className="px-4 py-3">{r.municipio}</td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => handleDelete(r.id, r.nombre)}
                        disabled={deletingId === r.id}
                        className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg bg-red-100 text-red-600 hover:bg-red-200 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-red-950 dark:text-red-400 dark:hover:bg-red-900"
                      >
                        {deletingId === r.id ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="size-3.5" />
                        )}
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
