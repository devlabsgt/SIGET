"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  Plus,
  Loader2,
  FileText,
  Pencil,
  Trash2,
  Filter,
} from "lucide-react";
import Swal from "sweetalert2";
import { useUserContext } from "@/components/(base)/providers/UserProvider";
import {
  deleteProyectoMemoria,
  getProyectosMemoria,
} from "./lib/actions";
import {
  formatCreatedAt,
  formatMemoriaPeriodo,
  sortMemoriasPorMes,
  TITULO_INFORME_MEMORIA,
  type ProyectosMemoria,
} from "./lib/types";
import ProyectosMemoriaForm from "./form/ProyectosMemoriaForm";
import { InformeMemoriaVista } from "./InformeMemoriaVista";

type View =
  | { mode: "list" }
  | { mode: "create" }
  | { mode: "edit"; memoria: ProyectosMemoria };

const TODOS = "__todos__";

const filterSelectClass =
  "h-10 w-full min-w-0 rounded-xl border border-border bg-card px-3 text-sm font-semibold text-foreground outline-none transition-all focus-visible:ring-2 focus-visible:ring-celeste-trifinio dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100";

function InformeMemoriaAccordion({
  informe,
  canDelete,
  open,
  onToggle,
  onEdit,
  onDelete,
}: {
  informe: ProyectosMemoria;
  canDelete: boolean;
  open: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="group w-full transition-shadow hover:shadow-lg">
      <InformeMemoriaVista
        cargo={informe.cargo}
        nombre={informe.nombre}
        oficina={informe.oficina}
        proyectos={informe.proyectos}
        periodo={informe.periodo}
        registrado={formatCreatedAt(informe.created_at)}
        accordionOpen={open}
        onAccordionToggle={onToggle}
        footer={
          <div className="mt-6 flex items-center justify-end gap-2 border-t border-slate-100 pt-5 dark:border-zinc-800">
            <button
              type="button"
              onClick={onEdit}
              className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full border border-border text-xs font-bold text-foreground hover:bg-muted/60 transition-colors cursor-pointer"
            >
              <Pencil className="w-3.5 h-3.5" />
              Editar
            </button>
            {canDelete && (
              <button
                type="button"
                onClick={onDelete}
                className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full border border-red-200 text-xs font-bold text-red-600 hover:bg-red-50 dark:border-red-900/40 dark:hover:bg-red-900/20 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Eliminar
              </button>
            )}
          </div>
        }
      />
    </div>
  );
}

export default function ProyectosMemoriaList() {
  const router = useRouter();
  const { effectiveRole } = useUserContext();
  const canDelete = effectiveRole === "super" || effectiveRole === "admin";

  const [view, setView] = useState<View>({ mode: "list" });
  const [memorias, setMemorias] = useState<ProyectosMemoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtroInformante, setFiltroInformante] = useState(TODOS);
  const [filtroOficina, setFiltroOficina] = useState(TODOS);
  const [openIds, setOpenIds] = useState<Set<string>>(new Set());
  const [, startTransition] = useTransition();

  const load = () => {
    setLoading(true);
    getProyectosMemoria()
      .then((data) => {
        setMemorias(sortMemoriasPorMes(data));
        setError(null);
      })
      .catch((e) =>
        setError(e instanceof Error ? e.message : "Error al cargar"),
      )
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, []);

  const informantes = useMemo(() => {
    const valores = new Set<string>();
    for (const m of memorias) {
      const nombre = m.nombre?.trim();
      if (nombre) valores.add(nombre);
    }
    return Array.from(valores).sort((a, b) => a.localeCompare(b, "es"));
  }, [memorias]);

  const oficinas = useMemo(() => {
    const valores = new Set<string>();
    for (const m of memorias) {
      const oficina = m.oficina?.trim();
      if (oficina) valores.add(oficina);
    }
    return Array.from(valores).sort((a, b) => a.localeCompare(b, "es"));
  }, [memorias]);

  const memoriasFiltradas = useMemo(() => {
    return sortMemoriasPorMes(
      memorias.filter((m) => {
        const coincideInformante =
          filtroInformante === TODOS ||
          m.nombre?.trim() === filtroInformante;
        const coincideOficina =
          filtroOficina === TODOS || m.oficina?.trim() === filtroOficina;
        return coincideInformante && coincideOficina;
      }),
    );
  }, [memorias, filtroInformante, filtroOficina]);

  const toggleOpen = (id: string) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleDelete = async (m: ProyectosMemoria) => {
    const isDark = document.documentElement.classList.contains("dark");
    const result = await Swal.fire({
      title: "¿Eliminar informe?",
      text: `${TITULO_INFORME_MEMORIA} — ${formatMemoriaPeriodo(m)}`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: isDark ? "#2c5f9b" : "#2563eb",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
      background: isDark ? "#252526" : "#ffffff",
      color: isDark ? "#cccccc" : "#000000",
    });
    if (!result.isConfirmed) return;

    startTransition(async () => {
      try {
        await deleteProyectoMemoria(m.id);
        setMemorias((prev) => prev.filter((x) => x.id !== m.id));
        setOpenIds((prev) => {
          const next = new Set(prev);
          next.delete(m.id);
          return next;
        });
      } catch (e) {
        await Swal.fire({
          icon: "error",
          title: "No se pudo eliminar",
          text: e instanceof Error ? e.message : "Error desconocido",
        });
      }
    });
  };

  if (view.mode !== "list") {
    return (
      <div className="w-full px-3 sm:px-6 lg:px-8 pt-6 md:pt-10">
        <ProyectosMemoriaForm
          initial={view.mode === "edit" ? view.memoria : null}
          onBack={() => setView({ mode: "list" })}
          onSaved={() => {
            setView({ mode: "list" });
            load();
          }}
        />
      </div>
    );
  }

  return (
    <div className="w-full px-3 sm:px-6 lg:px-8 pt-6 md:pt-10 pb-20">
      <div className="flex flex-wrap items-center gap-3 mb-8">
        <button
          type="button"
          onClick={() => router.push("/siget")}
          className="h-10 w-10 shrink-0 flex items-center justify-center rounded-xl bg-card border border-border hover:bg-accent transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-5 h-5 text-muted-foreground" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-black uppercase tracking-widest text-celeste-trifinio">
            Plan Trifinio
          </p>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-foreground leading-tight">
            {TITULO_INFORME_MEMORIA}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Informes institucionales recopilados por período.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setView({ mode: "create" })}
          className="h-11 px-5 rounded-xl bg-azul-trifinio text-white font-bold uppercase text-[10px] tracking-widest hover:opacity-90 transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Nuevo informe
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24">
          <Loader2 className="w-10 h-10 animate-spin text-celeste-trifinio mb-4" />
          <p className="text-muted-foreground">Cargando informes...</p>
        </div>
      ) : error ? (
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive">
          {error}
        </div>
      ) : memorias.length === 0 ? (
        <div className="text-center py-24">
          <div className="w-20 h-20 bg-muted dark:bg-accent rounded-full flex items-center justify-center mx-auto mb-6">
            <FileText className="w-10 h-10 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-bold text-foreground mb-2">
            Aún no hay informes registrados
          </h3>
          <p className="text-muted-foreground max-w-sm mx-auto">
            Cree el primer informe de memoria de labores usando el botón “Nuevo
            informe”.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-6 w-full">
          <div className="rounded-2xl border border-border bg-card/80 p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50">
            <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
              <Filter className="h-3.5 w-3.5" />
              Filtros
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="space-y-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Informante
                </span>
                <select
                  value={filtroInformante}
                  onChange={(e) => setFiltroInformante(e.target.value)}
                  className={filterSelectClass}
                >
                  <option value={TODOS}>Todos los informantes</option>
                  {informantes.map((nombre) => (
                    <option key={nombre} value={nombre}>
                      {nombre}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Oficina
                </span>
                <select
                  value={filtroOficina}
                  onChange={(e) => setFiltroOficina(e.target.value)}
                  className={filterSelectClass}
                >
                  <option value={TODOS}>Todas las oficinas</option>
                  {oficinas.map((oficina) => (
                    <option key={oficina} value={oficina}>
                      {oficina}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              {memoriasFiltradas.length} informe
              {memoriasFiltradas.length !== 1 ? "s" : ""} · ordenados por mes
            </p>
          </div>

          {memoriasFiltradas.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border px-6 py-16 text-center dark:border-zinc-800">
              <p className="text-sm font-semibold text-foreground">
                No hay informes con los filtros seleccionados
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Pruebe con otro informante u oficina.
              </p>
            </div>
          ) : (
            <>
              {memoriasFiltradas.map((m) => (
                <InformeMemoriaAccordion
                  key={m.id}
                  informe={m}
                  canDelete={canDelete}
                  open={openIds.has(m.id)}
                  onToggle={() => toggleOpen(m.id)}
                  onEdit={() => setView({ mode: "edit", memoria: m })}
                  onDelete={() => handleDelete(m)}
                />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
