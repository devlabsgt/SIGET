"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  FolderOpen,
  Plus,
  Link,
  Loader2,
  X,
  Search,
  Pencil,
} from "lucide-react";
import {
  getSectores,
  getAllOrganizaciones,
  createSector,
  createOrganizacion,
  updateOrganizacionNombre,
  unlinkOrganizacionFromSector,
  linkOrganizacionToSector,
  ObsSector,
  OrgWithSectors,
} from "./lib/actions";
import OrgLogoCell from "@/components/(uploads)/imgs/OrgLogoCell";
import { ORG_LIST_LOGO_CLASS } from "@/components/(uploads)/imgs/ImageUploader";
import { toast } from "react-toastify";
import Swal from "sweetalert2";

type ViewMode = "sector" | "organizaciones";

const VIEW_MODE_STORAGE_KEY = "siget-gestion-estructural-view";

const BTN_OUTLINE_EMERALD =
  "inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-md font-bold text-xs transition-all cursor-pointer whitespace-nowrap border border-emerald-100 dark:border-emerald-800 hover:bg-emerald-100/80 dark:hover:bg-emerald-900/30 disabled:opacity-40 disabled:cursor-not-allowed";

const BTN_OUTLINE_EMERALD_MD =
  "inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-md font-bold text-xs transition-all cursor-pointer border border-emerald-100 dark:border-emerald-800 hover:bg-emerald-100/80 dark:hover:bg-emerald-900/30 disabled:opacity-40 disabled:cursor-not-allowed";

const BTN_OUTLINE_EMERALD_FLEX =
  "flex flex-1 items-center justify-center gap-1.5 py-2.5 px-4 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-md font-bold text-xs transition-all cursor-pointer border border-emerald-100 dark:border-emerald-800 hover:bg-emerald-100/80 dark:hover:bg-emerald-900/30 disabled:opacity-40 disabled:cursor-not-allowed";

const BTN_CANCEL =
  "flex flex-1 items-center justify-center py-2.5 px-4 rounded-md border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors disabled:opacity-40";

const PANEL_CARD_CLASS =
  "bg-card rounded-2xl xl:rounded-3xl border border-border overflow-hidden shadow-xl shadow-slate-200/20 dark:shadow-none flex flex-col min-h-0 min-w-0";

interface VincularSectorModalProps {
  sectorId: string;
  sectorNombre: string;
  todasLasOrgs: OrgWithSectors[];
  onClose: () => void;
  onSuccess: () => void;
}

function VincularSectorModal({
  sectorId,
  sectorNombre,
  todasLasOrgs,
  onClose,
  onSuccess,
}: VincularSectorModalProps) {
  const [searchDisp, setSearchDisp] = useState("");
  const [saving, setSaving] = useState(false);

  const initialLinkedIds = useMemo(
    () =>
      new Set(
        todasLasOrgs
          .filter((o) => o.sectores.some((s) => s.id === sectorId))
          .map((o) => o.id)
      ),
    [todasLasOrgs, sectorId]
  );

  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    () => new Set(initialLinkedIds)
  );

  const filteredOrgs = useMemo(
    () =>
      todasLasOrgs
        .filter((d) => d.nombre.toLowerCase().includes(searchDisp.toLowerCase()))
        .sort((a, b) => a.nombre.localeCompare(b.nombre)),
    [todasLasOrgs, searchDisp]
  );

  const { leftOrgs, rightOrgs } = useMemo(() => {
    const half = Math.ceil(filteredOrgs.length / 2);
    return {
      leftOrgs: filteredOrgs.slice(0, half),
      rightOrgs: filteredOrgs.slice(half),
    };
  }, [filteredOrgs]);

  const renderOrgItem = (org: OrgWithSectors) => {
    const checked = selectedIds.has(org.id);
    return (
      <li key={org.id}>
        <label
          className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
            checked
              ? "border-emerald-300/60 dark:border-emerald-800/50 bg-emerald-50/30 dark:bg-emerald-950/10"
              : "border-border bg-muted/30 dark:bg-card hover:bg-muted/50"
          } ${saving ? "opacity-60 pointer-events-none" : ""}`}
        >
          <input
            type="checkbox"
            checked={checked}
            disabled={saving}
            onChange={(e) => toggleOrg(org.id, e.target.checked)}
            className="w-4 h-4 rounded accent-emerald-600 shrink-0 cursor-pointer"
          />
          <span className="text-xs font-bold text-foreground truncate flex-1">{org.nombre}</span>
        </label>
      </li>
    );
  };

  const isDirty = useMemo(() => {
    if (selectedIds.size !== initialLinkedIds.size) return true;
    for (const id of selectedIds) {
      if (!initialLinkedIds.has(id)) return true;
    }
    return false;
  }, [selectedIds, initialLinkedIds]);

  const filteredSelectedCount = filteredOrgs.filter((o) => selectedIds.has(o.id)).length;
  const allSelected = filteredOrgs.length > 0 && filteredSelectedCount === filteredOrgs.length;
  const someSelected = filteredSelectedCount > 0 && !allSelected;

  const toggleOrg = (orgId: string, next: boolean) => {
    setSelectedIds((prev) => {
      const nextSet = new Set(prev);
      if (next) nextSet.add(orgId);
      else nextSet.delete(orgId);
      return nextSet;
    });
  };

  const toggleAllFiltered = (next: boolean) => {
    setSelectedIds((prev) => {
      const nextSet = new Set(prev);
      filteredOrgs.forEach((o) => {
        if (next) nextSet.add(o.id);
        else nextSet.delete(o.id);
      });
      return nextSet;
    });
  };

  const handleClose = async () => {
    if (isDirty) {
      const result = await Swal.fire({
        title: "¿Descartar cambios?",
        text: "Tiene selecciones sin guardar.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#e11d48",
        cancelButtonColor: "#475569",
        confirmButtonText: "Sí, descartar",
        cancelButtonText: "Seguir editando",
        background: document.documentElement.classList.contains("dark") ? "#0f172a" : "#ffffff",
        color: document.documentElement.classList.contains("dark") ? "#f8fafc" : "#0f172a",
      });
      if (!result.isConfirmed) return;
    }
    onClose();
  };

  const handleSave = async () => {
    const toLink = [...selectedIds].filter((id) => !initialLinkedIds.has(id));
    const toUnlink = [...initialLinkedIds].filter((id) => !selectedIds.has(id));

    if (toLink.length === 0 && toUnlink.length === 0) {
      onClose();
      return;
    }

    const parts: string[] = [];
    if (toLink.length > 0) {
      parts.push(`vincular ${toLink.length} organización${toLink.length !== 1 ? "es" : ""}`);
    }
    if (toUnlink.length > 0) {
      parts.push(`desvincular ${toUnlink.length} organización${toUnlink.length !== 1 ? "es" : ""}`);
    }

    const result = await Swal.fire({
      title: "¿Confirmar cambios?",
      html: `Se ${parts.join(" y ")} del sector <b>${sectorNombre}</b>.`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#059669",
      cancelButtonColor: "#475569",
      confirmButtonText: "Sí, guardar",
      cancelButtonText: "Cancelar",
      background: document.documentElement.classList.contains("dark") ? "#0f172a" : "#ffffff",
      color: document.documentElement.classList.contains("dark") ? "#f8fafc" : "#0f172a",
    });

    if (!result.isConfirmed) return;

    setSaving(true);
    try {
      await Promise.all([
        ...toLink.map((id) => linkOrganizacionToSector(id, sectorId)),
        ...toUnlink.map((id) => unlinkOrganizacionFromSector(id, sectorId)),
      ]);
      toast.success("Vinculaciones actualizadas correctamente.");
      await onSuccess();
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "No se pudieron guardar los cambios.";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center backdrop-blur-md md:p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-black border border-slate-200 dark:border-slate-800/60 rounded-none md:rounded-3xl shadow-2xl p-6 w-full h-full md:h-auto md:max-h-[90vh] md:max-w-md lg:max-w-2xl flex flex-col"
      >
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800/40 shrink-0">
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
              Vincular a Sector
            </h3>
            <p className="text-[10px] font-bold uppercase tracking-widest mt-0.5 text-emerald-600 dark:text-emerald-400">
              {sectorNombre}
            </p>
          </div>
          <button
            onClick={handleClose}
            disabled={saving}
            className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-40"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-4 shrink-0 space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar organizaciones..."
              value={searchDisp}
              onChange={(e) => setSearchDisp(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800/50 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 transition-all"
            />
          </div>
          <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 pl-1">
            Marque las organizaciones y presione Guardar para aplicar los cambios.
          </p>
        </div>

        {filteredOrgs.length > 0 && (
          <label className="mt-3 flex items-center gap-3 px-3 py-2.5 rounded-xl border border-emerald-200/60 dark:border-emerald-900/40 bg-emerald-50/40 dark:bg-emerald-950/10 cursor-pointer shrink-0">
            <input
              type="checkbox"
              checked={allSelected}
              ref={(el) => {
                if (el) el.indeterminate = someSelected;
              }}
              disabled={saving}
              onChange={(e) => toggleAllFiltered(e.target.checked)}
              className="w-4 h-4 rounded accent-emerald-600 cursor-pointer"
            />
            <span className="text-xs font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
              Seleccionar todas ({filteredOrgs.length})
            </span>
            {isDirty && (
              <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider ml-auto">
                Sin guardar
              </span>
            )}
          </label>
        )}

        <div className="flex-1 overflow-y-auto py-3 my-2 pr-1 custom-scrollbar">
          {filteredOrgs.length === 0 ? (
            <div className="text-center py-8 bg-slate-50/40 dark:bg-slate-900/10 border border-dashed border-slate-200/60 dark:border-slate-800/40 rounded-2xl">
              <Building2 className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
              <p className="text-[11px] font-bold text-slate-400">No hay organizaciones.</p>
              <p className="text-[9px] text-slate-400/80 mt-0.5">
                Regístrelas en la pestaña Organizaciones.
              </p>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-2 items-start w-full">
              <ul className="flex-1 flex flex-col gap-2 w-full min-w-0">
                {leftOrgs.map(renderOrgItem)}
              </ul>
              {rightOrgs.length > 0 && (
                <ul className="flex-1 flex flex-col gap-2 w-full min-w-0">
                  {rightOrgs.map(renderOrgItem)}
                </ul>
              )}
            </div>
          )}
        </div>

        <div className="border-t border-slate-100 dark:border-slate-800 pt-4 mt-auto shrink-0 flex gap-2">
          <button
            type="button"
            onClick={handleClose}
            disabled={saving}
            className={BTN_CANCEL}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !isDirty}
            className={BTN_OUTLINE_EMERALD_FLEX}
          >
            {saving ? (
              <>
                Guardando...
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              </>
            ) : (
              "Guardar"
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function CrearSectorModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (sector: ObsSector) => Promise<void>;
}) {
  const [newSectorName, setNewSectorName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSectorName.trim()) return;

    setIsCreating(true);
    try {
      const sector = await createSector(newSectorName.trim());
      toast.success(`Sector "${sector.nombre}" creado con éxito.`);
      await onCreated(sector);
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error al crear sector.";
      toast.error(message);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center backdrop-blur-md p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-black border border-slate-200 dark:border-slate-800/60 rounded-3xl shadow-2xl p-6 w-full max-w-md flex flex-col"
      >
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800/40">
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
              Nuevo sector
            </h3>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">
              Registro en el observatorio
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isCreating}
            className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-40"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleCreate} className="pt-4 space-y-4">
          <div>
            <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest block mb-2">
              Nombre
            </label>
            <input
              autoFocus
              type="text"
              required
              value={newSectorName}
              onChange={(e) => setNewSectorName(e.target.value)}
              placeholder="Ej. Reintegración Económica, Salud..."
              className="w-full bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800/50 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 transition-all"
            />
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400">
            Después podrá vincular organizaciones a este sector.
          </p>
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={isCreating}
              className={BTN_CANCEL}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isCreating || !newSectorName.trim()}
              className={BTN_OUTLINE_EMERALD_FLEX}
            >
              {isCreating ? (
                <>
                  Creando...
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                </>
              ) : (
                <>
                  Crear sector
                  <Plus className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function CrearOrganizacionModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => Promise<void>;
}) {
  const [newOrgName, setNewOrgName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrgName.trim()) return;

    setIsCreating(true);
    try {
      await createOrganizacion(newOrgName.trim());
      toast.success(`Organización "${newOrgName.trim()}" creada correctamente.`);
      await onSuccess();
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "No se pudo crear la organización.";
      toast.error(message);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center backdrop-blur-md p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-black border border-slate-200 dark:border-slate-800/60 rounded-3xl shadow-2xl p-6 w-full max-w-md flex flex-col"
      >
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800/40">
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
              Nueva organización
            </h3>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">
              Registro en el observatorio
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isCreating}
            className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-40"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleCreate} className="pt-4 space-y-4">
          <div>
            <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest block mb-2">
              Nombre
            </label>
            <input
              autoFocus
              type="text"
              required
              value={newOrgName}
              onChange={(e) => setNewOrgName(e.target.value)}
              placeholder="Nombre de la organización..."
              className="w-full bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800/50 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 transition-all"
            />
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400">
            Después de crearla, podrá subir su logo desde la lista.
          </p>
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={isCreating}
              className={BTN_CANCEL}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isCreating || !newOrgName.trim()}
              className={BTN_OUTLINE_EMERALD_FLEX}
            >
              {isCreating ? (
                <>
                  Creando...
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                </>
              ) : (
                <>
                  Crear organización
                  <Plus className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function EditarOrganizacionModal({
  org,
  onClose,
  onSuccess,
}: {
  org: OrgWithSectors;
  onClose: () => void;
  onSuccess: () => Promise<void>;
}) {
  const [nombre, setNombre] = useState(org.nombre);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = nombre.trim();
    if (!trimmed) return;
    if (trimmed === org.nombre) {
      onClose();
      return;
    }

    setIsSaving(true);
    try {
      await updateOrganizacionNombre(org.id, trimmed);
      toast.success(`Organización renombrada a "${trimmed}".`);
      await onSuccess();
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "No se pudo actualizar el nombre.";
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center backdrop-blur-md p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-black border border-slate-200 dark:border-slate-800/60 rounded-3xl shadow-2xl p-6 w-full max-w-md flex flex-col"
      >
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800/40">
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
              Editar organización
            </h3>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">
              Cambiar nombre
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-40"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSave} className="pt-4 space-y-4">
          <div>
            <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest block mb-2">
              Nombre
            </label>
            <input
              autoFocus
              type="text"
              required
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Nombre de la organización..."
              className="w-full bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800/50 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 transition-all"
            />
          </div>
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className={BTN_CANCEL}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving || !nombre.trim()}
              className={BTN_OUTLINE_EMERALD_FLEX}
            >
              {isSaving ? (
                <>
                  Guardando...
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                </>
              ) : (
                "Guardar"
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function OrganizacionesPanel({
  orgs,
  search,
  onRefresh,
  className = "",
  twoColumns = false,
  showLogoHint = false,
}: {
  orgs: OrgWithSectors[];
  search: string;
  onRefresh: () => Promise<void>;
  className?: string;
  twoColumns?: boolean;
  showLogoHint?: boolean;
}) {
  const [editingOrg, setEditingOrg] = useState<OrgWithSectors | null>(null);

  const filteredOrgs = useMemo(
    () =>
      orgs
        .filter((o) => o.nombre.toLowerCase().includes(search.toLowerCase()))
        .sort((a, b) => a.nombre.localeCompare(b.nombre)),
    [orgs, search]
  );

  const renderOrgRow = (org: OrgWithSectors) => (
    <div
      key={org.id}
      className="flex items-center gap-3 px-3 sm:px-4 md:px-5 py-0 w-full hover:bg-muted/40 dark:hover:bg-accent/20 transition-colors"
    >
      <OrgLogoCell
        orgId={org.id}
        logoPath={org.logo}
        onUpdated={onRefresh}
        compactClassName={ORG_LIST_LOGO_CLASS}
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-black text-slate-900 dark:text-white leading-tight truncate">
          {org.nombre}
        </p>
      </div>
      <button
        type="button"
        onClick={() => setEditingOrg(org)}
        className={`${BTN_OUTLINE_EMERALD} shrink-0 px-2.5 py-1.5 mr-1`}
        title="Editar nombre"
      >
        Editar
        <Pencil className="w-3.5 h-3.5 shrink-0" />
      </button>
    </div>
  );

  return (
    <>
    {showLogoHint && (
      <p className="px-3 sm:px-4 md:px-5 lg:px-5 py-2 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold border-b border-slate-100 dark:border-slate-800/80">
        Clic en la imagen para ver o editar el logo.
      </p>
    )}
    <div
      className={`${showLogoHint ? "border-t-0" : "border-t"} border-b border-slate-100 dark:border-slate-800/80 ${className} ${
        twoColumns
          ? "grid grid-cols-2 divide-x divide-y divide-slate-100 dark:divide-slate-800/80"
          : "divide-y divide-slate-100 dark:divide-slate-800/80"
      }`}
    >
      {filteredOrgs.length === 0 ? (
        <div className={`text-center py-12 px-4 ${twoColumns ? "col-span-2" : ""}`}>
          <Building2 className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-500">No se encontraron organizaciones.</p>
          {search && <p className="text-xs text-slate-400 mt-1">Pruebe con otros términos de búsqueda.</p>}
        </div>
      ) : (
        filteredOrgs.map(renderOrgRow)
      )}
    </div>

    <AnimatePresence>
      {editingOrg && (
        <EditarOrganizacionModal
          org={editingOrg}
          onClose={() => setEditingOrg(null)}
          onSuccess={onRefresh}
        />
      )}
    </AnimatePresence>
    </>
  );
}

function SectoresPanel({
  sectores,
  orgs,
  search,
  onLinkSector,
  className = "",
  singleColumnOrgs = false,
}: {
  sectores: ObsSector[];
  orgs: OrgWithSectors[];
  search: string;
  onLinkSector: (sector: { id: string; nombre: string }) => void;
  className?: string;
  singleColumnOrgs?: boolean;
}) {
  const filteredSectores = useMemo(
    () => sectores.filter((s) => s.nombre.toLowerCase().includes(search.toLowerCase())),
    [sectores, search]
  );

  const orgsBySector = (sectorId: string) =>
    orgs.filter((o) => o.sectores.some((s) => s.id === sectorId));

  return (
    <div
      className={`divide-y divide-slate-100 dark:divide-slate-800/80 border-t border-slate-100 dark:border-slate-800/80 ${className}`}
    >
      {filteredSectores.length === 0 ? (
        <div className="text-center py-12 px-4 bg-slate-50/50 dark:bg-slate-900/10 border border-dashed border-slate-200 dark:border-slate-800 mx-4 my-4 rounded-2xl">
          <FolderOpen className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-500">No se encontraron sectores.</p>
          {search && <p className="text-xs text-slate-400 mt-1">Pruebe con otros términos de búsqueda.</p>}
        </div>
      ) : (
        filteredSectores.map((sector) => {
          const sectorOrgs = orgsBySector(sector.id);
          const sortedOrgs = [...sectorOrgs].sort((a, b) => a.nombre.localeCompare(b.nombre));

          return (
            <div
              key={sector.id}
              className="group border-b border-slate-100 dark:border-slate-800/80 last:border-b-0"
            >
              <div className="flex items-start justify-between gap-3 px-3 sm:px-4 md:px-5 py-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-slate-900 dark:text-white leading-tight transition-colors group-hover:text-emerald-700 dark:group-hover:text-emerald-400">
                    {sector.nombre}
                  </p>
                  {sortedOrgs.length === 0 ? (
                    <p className="text-[10px] text-slate-400 font-medium italic mt-1">
                      Ninguna organización vinculada a este sector.
                    </p>
                  ) : (
                    <ul
                      className={`grid gap-x-4 gap-y-0.5 mt-1 ${
                        singleColumnOrgs ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2"
                      }`}
                    >
                      {sortedOrgs.map((org) => (
                        <li
                          key={org.id}
                          className="text-[10px] text-slate-400 font-bold tracking-wide leading-snug min-w-0 truncate transition-colors group-hover:text-emerald-400 dark:group-hover:text-emerald-300"
                          title={org.nombre}
                        >
                          {org.nombre}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => onLinkSector({ id: sector.id, nombre: sector.nombre })}
                  className={`${BTN_OUTLINE_EMERALD} px-2.5 py-2 shrink-0`}
                  title="Vincular"
                >
                  Vincular
                  <Link className="w-3.5 h-3.5 shrink-0" />
                </button>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

function PanelToolbar({
  placeholder,
  search,
  onSearchChange,
  onCreate,
}: {
  placeholder: string;
  search: string;
  onSearchChange: (value: string) => void;
  onCreate: () => void;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_auto] items-stretch sm:items-center gap-2 w-full">
      <div className="relative w-full min-w-0">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder={placeholder}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-background border border-slate-200 dark:border-border rounded-xl text-xs font-bold text-slate-700 dark:text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/10 transition-all"
        />
      </div>
      <button type="button" onClick={onCreate} className={`${BTN_OUTLINE_EMERALD_MD} shrink-0 w-full sm:w-auto`}>
        Crear
        <Plus className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export default function GestionOrgsSectores() {
  const [sectores, setSectores] = useState<ObsSector[]>([]);
  const [orgs, setOrgs] = useState<OrgWithSectors[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("sector");
  const [searchOrg, setSearchOrg] = useState("");
  const [searchSector, setSearchSector] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem(VIEW_MODE_STORAGE_KEY);
    if (stored === "sector" || stored === "organizaciones") {
      setViewMode(stored);
    }
  }, []);

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem(VIEW_MODE_STORAGE_KEY, mode);
    setShowNewSectorModal(false);
    setShowNewOrgModal(false);
  };

  const [showNewSectorModal, setShowNewSectorModal] = useState(false);
  const [showNewOrgModal, setShowNewOrgModal] = useState(false);

  const [activeLinkingSector, setActiveLinkingSector] = useState<{ id: string; nombre: string } | null>(null);

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

  const handleSectorCreated = async () => {
    await refresh();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mb-3" />
        <p className="text-xs font-bold text-slate-400">Cargando datos del observatorio...</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Vista móvil / tablet: un solo recuadro */}
      <div className={`lg:hidden ${PANEL_CARD_CLASS}`}>
        <div className="border-b border-slate-100 dark:border-slate-800/80 pb-4 px-3 sm:px-4 md:px-5 pt-4 md:pt-5">
          <div className="flex flex-col gap-3 w-full">
            <div className="shrink-0 min-w-0">
              <h3 className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-wider">
                Gestión Estructural
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {viewMode === "sector"
                  ? "Sectores y organizaciones vinculadas en el observatorio."
                  : "Registro de organizaciones y carga de logos."}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_auto_auto] items-stretch sm:items-center gap-2 w-full">
              <div className="relative w-full min-w-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder={viewMode === "sector" ? "Buscar sector..." : "Buscar organización..."}
                  value={viewMode === "sector" ? searchSector : searchOrg}
                  onChange={(e) =>
                    viewMode === "sector" ? setSearchSector(e.target.value) : setSearchOrg(e.target.value)
                  }
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-background border border-slate-200 dark:border-border rounded-xl text-xs font-bold text-slate-700 dark:text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/10 transition-all"
                />
              </div>

              <div className="inline-grid grid-cols-2 p-1 rounded-xl border border-border/40 bg-muted/70 dark:bg-muted/30 w-full sm:w-max shrink-0 justify-self-stretch sm:justify-self-auto">
                {(["sector", "organizaciones"] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => handleViewModeChange(mode)}
                    className={`w-full min-w-22 px-5 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap capitalize text-center ${
                      viewMode === mode
                        ? "bg-background text-foreground shadow-sm ring-1 ring-border/60"
                        : "bg-transparent text-muted-foreground hover:text-foreground hover:bg-muted/60 dark:hover:bg-muted/50"
                    }`}
                  >
                    {mode === "sector" ? "Sectores" : "Organizaciones"}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() =>
                  viewMode === "sector" ? setShowNewSectorModal(true) : setShowNewOrgModal(true)
                }
                className={`${BTN_OUTLINE_EMERALD_MD} shrink-0 w-full sm:w-auto justify-self-stretch sm:justify-self-auto`}
              >
                Crear
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {viewMode === "organizaciones" ? (
          <OrganizacionesPanel
            orgs={orgs}
            search={searchOrg}
            onRefresh={refresh}
            className="border-b-0"
            showLogoHint
          />
        ) : (
          <SectoresPanel
            sectores={sectores}
            orgs={orgs}
            search={searchSector}
            onLinkSector={setActiveLinkingSector}
            className="border-b-0"
          />
        )}
      </div>

      {/* Vista escritorio: dos recuadros lado a lado */}
      <div className="hidden lg:grid lg:grid-cols-[minmax(0,7fr)_minmax(0,3fr)] gap-4 xl:gap-5 w-full">
        <div className={PANEL_CARD_CLASS}>
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800/80 space-y-3">
            <h4 className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-wider">
              Organizaciones
            </h4>
            <PanelToolbar
              placeholder="Buscar organización..."
              search={searchOrg}
              onSearchChange={setSearchOrg}
              onCreate={() => setShowNewOrgModal(true)}
            />
          </div>
          <OrganizacionesPanel
            orgs={orgs}
            search={searchOrg}
            onRefresh={refresh}
            className="border-0"
            twoColumns
            showLogoHint
          />
        </div>

        <div className={PANEL_CARD_CLASS}>
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800/80 space-y-3">
            <h4 className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-wider">
              Sectores
            </h4>
            <PanelToolbar
              placeholder="Buscar sector..."
              search={searchSector}
              onSearchChange={setSearchSector}
              onCreate={() => setShowNewSectorModal(true)}
            />
          </div>
          <SectoresPanel
            sectores={sectores}
            orgs={orgs}
            search={searchSector}
            onLinkSector={setActiveLinkingSector}
            className="border-0"
            singleColumnOrgs
          />
        </div>
      </div>

      <AnimatePresence>
        {showNewSectorModal && (
          <CrearSectorModal
            onClose={() => setShowNewSectorModal(false)}
            onCreated={handleSectorCreated}
          />
        )}
        {showNewOrgModal && (
          <CrearOrganizacionModal
            onClose={() => setShowNewOrgModal(false)}
            onSuccess={refresh}
          />
        )}
        {activeLinkingSector && (
          <VincularSectorModal
            sectorId={activeLinkingSector.id}
            sectorNombre={activeLinkingSector.nombre}
            todasLasOrgs={orgs}
            onClose={() => setActiveLinkingSector(null)}
            onSuccess={refresh}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
