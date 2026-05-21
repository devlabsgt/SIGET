"use client";

import { useState, useEffect, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  FolderOpen,
  Plus,
  Unlink,
  Link,
  Loader2,
  ChevronDown,
  ChevronRight,
  Check,
  X,
  AlertCircle,
  Search,
} from "lucide-react";
import {
  getSectores,
  getAllOrganizaciones,
  createSector,
  createOrganizacion,
  unlinkOrganizacionFromSector,
  linkOrganizacionToSector,
  ObsSector,
  OrgWithSectors,
} from "./lib/actions";
import { toast } from "react-toastify";
import Swal from "sweetalert2";

// ─── Small inline form ────────────────────────────────────────────────────────
function InlineForm({
  placeholder,
  onConfirm,
  onCancel,
  loading,
}: {
  placeholder: string;
  onConfirm: (value: string) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const [value, setValue] = useState("");
  return (
    <div className="flex items-center gap-2 mt-2">
      <input
        autoFocus
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && value.trim()) onConfirm(value.trim());
          if (e.key === "Escape") onCancel();
        }}
        placeholder={placeholder}
        className="flex-1 min-w-0 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all"
      />
      <button
        onClick={() => value.trim() && onConfirm(value.trim())}
        disabled={!value.trim() || loading}
        className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-40 transition-all cursor-pointer shadow-sm"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
      </button>
      <button
        onClick={onCancel}
        className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 transition-all cursor-pointer border border-slate-200 dark:border-slate-700/60"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

interface VincularSectorModalProps {
  sectorId: string;
  sectorNombre: string;
  todasLasOrgs: OrgWithSectors[];
  onClose: () => void;
  onSuccess: () => void;
  sectoresTotales: ObsSector[];
}

// ─── OrgCard ─────────────────────────────────────────────────────────────────
// Definido fuera del modal para que React NO lo desmonte en cada re-render.
function OrgCard({
  d,
  sectorId,
  isPending,
  onLink,
  onUnlink,
}: {
  d: OrgWithSectors;
  sectorId: string;
  isPending: boolean;
  onLink: (id: string, nombre: string) => void;
  onUnlink: (id: string, nombre: string) => void;
}) {
  const isLinked = d.sectores.some((s) => s.id === sectorId);
  return (
    <motion.div
      layout
      transition={{ type: "spring", stiffness: 380, damping: 32 }}
      className={`flex items-center justify-between p-3 rounded-xl border gap-3 ${
        isLinked
          ? "border-border bg-card dark:bg-secondary/30"
          : "border-border bg-muted/50 dark:bg-card"
      }`}
    >
      <span className="text-xs font-bold text-foreground truncate flex-1 min-w-0 text-left">
        {d.nombre}
      </span>

      {/* Botón animado: fade + rotate entre verde ↔ rojo */}
      <div className="relative w-8 h-8 shrink-0">
        <AnimatePresence mode="wait" initial={false}>
          {isLinked ? (
            <motion.button
              key="unlink"
              onClick={() => onUnlink(d.id, d.nombre)}
              disabled={isPending}
              initial={{ opacity: 0, scale: 0.6, rotate: -15 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.6, rotate: 15 }}
              whileTap={{ scale: 0.85 }}
              whileHover={{ scale: 1.12 }}
              transition={{ type: "spring", stiffness: 420, damping: 24 }}
              className="absolute inset-0 flex items-center justify-center rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 cursor-pointer border border-rose-500/20 dark:border-rose-900/35 shadow-sm"
              title="Desvincular de este sector"
            >
              {isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Unlink className="w-3.5 h-3.5" />
              )}
            </motion.button>
          ) : (
            <motion.button
              key="link"
              onClick={() => onLink(d.id, d.nombre)}
              disabled={isPending}
              initial={{ opacity: 0, scale: 0.6, rotate: 15 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.6, rotate: -15 }}
              whileTap={{ scale: 0.85 }}
              whileHover={{ scale: 1.12 }}
              transition={{ type: "spring", stiffness: 420, damping: 24 }}
              className="absolute inset-0 flex items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 cursor-pointer border border-emerald-500/30 shadow-sm"
              title="Vincular a este sector"
            >
              {isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Link className="w-3.5 h-3.5" />
              )}
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function VincularSectorModal({
  sectorId,
  sectorNombre,
  todasLasOrgs,
  onClose,
  onSuccess,
  sectoresTotales,
}: VincularSectorModalProps) {
  const [isPending, startTransition] = useTransition();

  // Buscar disponibles
  const [searchDisp, setSearchDisp] = useState("");

  const filteredOrgs = todasLasOrgs.filter((d) =>
    d.nombre.toLowerCase().includes(searchDisp.toLowerCase())
  );

  // Ordenar primero las vinculadas al sector actual, y luego las desvinculadas.
  // Alfabéticamente dentro de cada grupo.
  const sortedOrgs = [...filteredOrgs].sort((a, b) => {
    const aLinked = a.sectores.some((s) => s.id === sectorId);
    const bLinked = b.sectores.some((s) => s.id === sectorId);
    if (aLinked && !bLinked) return -1;
    if (!aLinked && bLinked) return 1;
    return a.nombre.localeCompare(b.nombre);
  });

  // Crear nueva org desde modal
  const [newOrgName, setNewOrgName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleLinkExisting = (orgId: string, orgNombre: string) => {
    startTransition(async () => {
      try {
        await linkOrganizacionToSector(orgId, sectorId);
        toast.success(`"${orgNombre}" vinculada a "${sectorNombre}" correctamente.`);
        onSuccess();
      } catch (err: any) {
        toast.error(err.message || "No se pudo vincular la organización.");
      }
    });
  };

  const handleUnlinkExisting = (orgId: string, orgNombre: string) => {
    startTransition(async () => {
      try {
        await unlinkOrganizacionFromSector(orgId, sectorId);
        toast.success(`"${orgNombre}" desvinculada de "${sectorNombre}" correctamente.`);
        onSuccess();
      } catch (err: any) {
        toast.error(err.message || "No se pudo desvincular la organización.");
      }
    });
  };

  const handleCreateAndLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrgName.trim()) return;

    setIsCreating(true);
    try {
      await createOrganizacion(newOrgName);
      toast.success(`Organización "${newOrgName}" creada correctamente. Ya está disponible en la lista de arriba.`);
      setNewOrgName("");
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || "No se pudo crear la organización.");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 backdrop-blur-sm md:p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-black border border-slate-200 dark:border-slate-800/60 rounded-none md:rounded-3xl shadow-2xl p-6 w-full h-full md:h-auto md:max-h-[90vh] md:max-w-md lg:max-w-3xl flex flex-col"
      >
        {/* Cabecera del modal */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800/40 shrink-0">
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
              Vincular a Sector
            </h3>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5 text-emerald-600 dark:text-emerald-400">
              {sectorNombre}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="mt-4 shrink-0 space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar de las disponibles..."
              value={searchDisp}
              onChange={(e) => setSearchDisp(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800/50 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 transition-all"
            />
          </div>
          <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 pl-1 text-left uppercase tracking-wider flex items-center gap-1.5 flex-wrap">
            * Click en el icono
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 shrink-0">
              <Link className="w-3 h-3 text-emerald-700 dark:text-emerald-400" />
            </span>
            para vincular y en
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 border border-rose-100/20 dark:border-rose-900/30 shrink-0">
              <Unlink className="w-3 h-3 text-rose-700 dark:text-rose-400" />
            </span>
            para desvincular
          </p>
        </div>

        {/* Listado de Organizaciones con scroll flexible y animaciones layout */}
        <div className="flex-1 overflow-y-auto py-3 my-2 pr-1 custom-scrollbar">
          {sortedOrgs.length === 0 ? (
            <div className="text-center py-8 bg-slate-50/40 dark:bg-slate-900/10 border border-dashed border-slate-200/60 dark:border-slate-800/40 rounded-2xl">
              <Building2 className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
              <p className="text-[11px] font-bold text-slate-400">No hay organizaciones.</p>
              <p className="text-[9px] text-slate-400/80 mt-0.5">Use el formulario de abajo para registrar una nueva.</p>
            </div>
          ) : (
            <div className="flex flex-col lg:flex-row gap-3 items-start w-full">
              {(() => {
                const halfLength = Math.ceil(sortedOrgs.length / 2);
                const leftOrgs = sortedOrgs.slice(0, halfLength);
                const rightOrgs = sortedOrgs.slice(halfLength);
                return (
                  <>
                    {/* Columna Izquierda */}
                    <div className="flex-1 flex flex-col gap-3 w-full">
                      {leftOrgs.map((d) => (
                        <OrgCard
                          key={d.id}
                          d={d}
                          sectorId={sectorId}
                          isPending={isPending}
                          onLink={handleLinkExisting}
                          onUnlink={handleUnlinkExisting}
                        />
                      ))}
                    </div>

                    {/* Columna Derecha */}
                    {rightOrgs.length > 0 && (
                      <div className="flex-1 flex flex-col gap-3 w-full">
                        {rightOrgs.map((d) => (
                          <OrgCard
                            key={d.id}
                            d={d}
                            sectorId={sectorId}
                            isPending={isPending}
                            onLink={handleLinkExisting}
                            onUnlink={handleUnlinkExisting}
                          />
                        ))}
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          )}
        </div>

        {/* Formulario de creación de ancho completo al pie */}
        <form onSubmit={handleCreateAndLink} className="border-t border-slate-100 dark:border-slate-800 pt-4 mt-auto shrink-0 space-y-2.5">
          <p className="text-[9px] font-black text-emerald-650 dark:text-emerald-450 uppercase tracking-widest pl-1">
            ¿No encuentra la organización? Regístrela aquí:
          </p>
          <div className="space-y-2">
            <input
              type="text"
              required
              value={newOrgName}
              onChange={(e) => setNewOrgName(e.target.value)}
              placeholder="Nombre de la nueva organización..."
              className="w-full bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800/50 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 transition-all"
            />
            <div className="flex justify-center w-full">
              <button
                type="submit"
                disabled={isCreating || !newOrgName.trim()}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-[11px] font-bold tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/10"
              >
                {isCreating ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Plus className="w-3.5 h-3.5" />
                )}
                Crear organización
              </button>
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export default function GestionOrgsSectores() {
  const [sectores, setSectores] = useState<ObsSector[]>([]);
  const [orgs, setOrgs] = useState<OrgWithSectors[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSectorId, setExpandedSectorId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  // Inline forms
  const [showNewSector, setShowNewSector] = useState(false);
  const [newSectorLoading, setNewSectorLoading] = useState(false);

  // Modal de vinculación
  const [activeLinkingSector, setActiveLinkingSector] = useState<{ id: string; nombre: string } | null>(null);
  const [unlinkingId, setUnlinkingId] = useState<string | null>(null);

  const refresh = async () => {
    try {
      const [s, o] = await Promise.all([getSectores(), getAllOrganizaciones()]);
      setSectores(s);
      setOrgs(o);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const toggleSector = (id: string) => {
    setExpandedSectorId((prev) => (prev === id ? null : id));
  };

  const handleCreateSector = async (nombre: string) => {
    setNewSectorLoading(true);
    try {
      const s = await createSector(nombre);
      toast.success(`Sector "${s.nombre}" creado con éxito.`);
      setShowNewSector(false);
      await refresh();
      setExpandedSectorId(s.id);
    } catch (err: any) {
      toast.error(err.message || "Error al crear sector.");
    } finally {
      setNewSectorLoading(false);
    }
  };

  const handleUnlink = async (org: OrgWithSectors, sectorId: string) => {
    const result = await Swal.fire({
      title: "¿Desvincular organización?",
      text: `¿Está seguro de que desea retirar "${org.nombre}" de este sector?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#e11d48", // Rose-600
      cancelButtonColor: "#475569",  // Slate-600
      confirmButtonText: "Sí, desvincular",
      cancelButtonText: "Cancelar",
      background: document.documentElement.classList.contains("dark") ? "#0f172a" : "#ffffff",
      color: document.documentElement.classList.contains("dark") ? "#f8fafc" : "#0f172a",
    });

    if (!result.isConfirmed) return;

    setUnlinkingId(org.id);
    try {
      await unlinkOrganizacionFromSector(org.id, sectorId);
      toast.success(`"${org.nombre}" ha sido desvinculada del sector.`);
      await refresh();
    } catch (err: any) {
      toast.error(err.message || "Error al desvincular.");
    } finally {
      setUnlinkingId(null);
    }
  };

  // ── Filters & Computations ──
  const filteredSectores = sectores.filter((s) =>
    s.nombre.toLowerCase().includes(search.toLowerCase())
  );

  const orgsBySector = (sectorId: string) =>
    orgs.filter((o) => o.sectores.some((s) => s.id === sectorId));

  // Organizaciones que NO están vinculadas a un sector específico
  const orgsNotInSector = (sectorId: string) =>
    orgs.filter((o) => !o.sectores.some((s) => s.id === sectorId));

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mb-3" />
        <p className="text-xs font-bold text-slate-400">Cargando datos del observatorio...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* ── Toolbar Superior ── */}
      <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-5 px-6 md:px-8">
        <div>
          <h3 className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-wider">
            Gestión Estructural
          </h3>
          <p className="text-[10px] text-slate-400 mt-0.5">Sectores y organizaciones vinculadas en el observatorio.</p>
        </div>

        {/* Acciones principales y buscador: en móvil cada cosa en una sola fila (flex-col) */}
        <div className="flex flex-col gap-2.5 w-full sm:flex-row sm:items-center sm:flex-1 lg:justify-end">
          <div className="relative flex-1 w-full sm:max-w-md lg:max-w-xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar sector..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-background border border-slate-200 dark:border-border rounded-xl text-xs font-bold text-slate-700 dark:text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/10 transition-all"
            />
          </div>

          <button
            onClick={() => setShowNewSector(!showNewSector)}
            className="flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-md shadow-emerald-500/10 shrink-0 w-full sm:w-auto"
          >
            <Plus className="w-3.5 h-3.5" /> Nuevo Sector
          </button>
        </div>
      </div>

      {/* ── Formulario inline para Nuevo Sector ── */}
      <AnimatePresence>
        {showNewSector && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="px-6 md:px-8 py-2">
              <div className="bg-emerald-50/20 dark:bg-emerald-950/5 border border-emerald-100/50 dark:border-emerald-900/20 rounded-3xl p-5 shadow-sm">
                <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest block mb-1">
                  Registrar Nuevo Sector
                </span>
                <InlineForm
                  placeholder="Nombre del sector (ej. Reintegración Económica, Salud...)"
                  onConfirm={handleCreateSector}
                  onCancel={() => setShowNewSector(false)}
                  loading={newSectorLoading}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Listado de Sectores ── */}
      <div className="divide-y divide-slate-100 dark:divide-slate-800/80 border-t border-b border-slate-100 dark:border-slate-800/80 mt-6">
        {filteredSectores.length === 0 ? (
          <div className="text-center py-16 bg-slate-50/50 dark:bg-slate-900/10 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl my-4">
            <FolderOpen className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-500">No se encontraron sectores.</p>
            {search && <p className="text-xs text-slate-400 mt-1">Pruebe con otros términos de búsqueda.</p>}
          </div>
        ) : (
          filteredSectores.map((sector, sIdx) => {
            const sectorOrgs = orgsBySector(sector.id);
            const sortedOrgs = [...sectorOrgs].sort((a, b) => a.nombre.localeCompare(b.nombre));
            const isOpen = expandedSectorId === sector.id;

            return (
              <motion.div
                key={sector.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: sIdx * 0.03 }}
                className={`overflow-hidden transition-all duration-300 rounded-2xl ${
                  isOpen 
                    ? "border border-border bg-muted/40 dark:bg-secondary/20 my-3" 
                    : "border border-transparent bg-transparent"
                }`}
              >
                {/* Sector Header */}
                <div
                  className={`flex items-center gap-3 px-5 py-4.5 cursor-pointer select-none transition-all ${
                    isOpen 
                      ? "bg-muted/60 dark:bg-accent/40 border-b border-border" 
                      : "bg-transparent hover:bg-muted/40 dark:hover:bg-accent/20"
                  }`}
                  onClick={() => toggleSector(sector.id)}
                >
                  <div className="w-8 h-8 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-slate-900 dark:text-white leading-tight">{sector.nombre}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                      {sectorOrgs.length} organización{sectorOrgs.length !== 1 ? "es" : ""}
                    </p>
                  </div>
                </div>

                {/* Listado de Organizaciones del Sector */}
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden bg-muted/30 dark:bg-background rounded-b-2xl"
                    >
                      {sortedOrgs.length === 0 ? (
                        <div className="px-6 py-8 text-center bg-slate-50/20 dark:bg-slate-900/10 flex flex-col items-center justify-center gap-2.5">
                          <p className="text-xs text-slate-400 font-medium italic">
                            Ninguna organización vinculada a este sector.
                          </p>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveLinkingSector({ id: sector.id, nombre: sector.nombre });
                            }}
                            className="inline-flex items-center px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all cursor-pointer shadow-sm gap-1.5"
                          >
                            <Plus className="w-3.5 h-3.5" /> Vincular Organización
                          </button>
                        </div>
                      ) : (
                        <div className="px-6 md:px-8 py-5 space-y-5">
                          {/* Fila del encabezado de la sección: título a la izquierda, botón a la derecha */}
                          <div className="flex flex-col gap-1 border-b border-border pb-3">
                            <div className="flex items-center justify-between gap-4">
                              <span className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest text-left">
                                Organizaciones Vinculadas
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveLinkingSector({ id: sector.id, nombre: sector.nombre });
                                }}
                                className="flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-xl border border-emerald-600 dark:border-emerald-500/60 hover:bg-emerald-50/50 dark:hover:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer shrink-0 shadow-sm"
                              >
                                Vincular Org
                                <Link className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                              </button>
                            </div>
                            <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 pl-1 text-left uppercase tracking-wider flex items-center gap-1.5 flex-wrap mt-1">
                              * Click en el botón
                              <span className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 border border-rose-100/20 dark:border-rose-900/30 shrink-0">
                                <Unlink className="w-3 h-3 text-rose-700 dark:text-rose-400" />
                              </span>
                              para desvincular
                            </p>
                          </div>

                          {/* Listado de organizaciones en 2 columnas en pantalla grande */}
                          <div className="space-y-3">
                            <ul className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                              {sortedOrgs.map((org) => (
                                <li
                                  key={org.id}
                                  className="flex flex-row items-center justify-between gap-3 p-3.5 bg-slate-50 dark:bg-card border border-border rounded-2xl transition-all w-full hover:bg-slate-100 dark:hover:bg-accent/30"
                                >
                                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                    <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center shrink-0">
                                      <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                    </div>
                                    <span className="text-xs font-bold text-foreground truncate text-left flex-1">
                                      {org.nombre}
                                    </span>
                                  </div>
                                  <button
                                    onClick={() => handleUnlink(org, sector.id)}
                                    disabled={unlinkingId === org.id}
                                    className="flex items-center justify-center w-8 h-8 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 text-rose-700 dark:text-rose-400 transition-all cursor-pointer border border-rose-100/20 dark:border-rose-900/30 disabled:opacity-40 shrink-0"
                                    title="Desvincular Organización"
                                  >
                                    {unlinkingId === org.id ? (
                                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    ) : (
                                      <Unlink className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })
        )}
      </div>

      {/* ── Modal de Vinculación y Creación ── */}
      <AnimatePresence>
        {activeLinkingSector && (
          <VincularSectorModal
            sectorId={activeLinkingSector.id}
            sectorNombre={activeLinkingSector.nombre}
            todasLasOrgs={orgs}
            sectoresTotales={sectores}
            onClose={() => setActiveLinkingSector(null)}
            onSuccess={async () => {
              await refresh();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
