"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Plus, LayoutTemplate, Loader2, Search, Settings2, FileText, LayoutDashboard, Building2, Globe, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import ConstructorFormulario from "./ConstructorFormulario";
import GestionOrgsSectores from "./GestionOrgsSectores";
import GestionNacionalidadesPerfiles from "./GestionNacionalidadesPerfiles";
import { useSectores, usePoliticas } from "./lib/hooks";
import { createSector } from "./lib/actions";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import { useQueryClient } from "@tanstack/react-query";
import ObsToastContainer from "./ObsToastContainer";
import { useUserContext } from "@/components/(base)/providers/UserProvider";

const ROLES_WITH_PLANTILLAS = ["admin", "super", "admin-observatorio"];

/** Ordena códigos tipo 1.1.2 · 1.1.10 · 1.2.1 numéricamente por segmento. */
function comparePoliticaCodigo(a: string, b: string): number {
  const toParts = (code: string) =>
    code.trim().split(".").map((part) => {
      const n = parseInt(part, 10);
      return Number.isNaN(n) ? part.toLowerCase() : n;
    });

  const partsA = toParts(a);
  const partsB = toParts(b);
  const len = Math.max(partsA.length, partsB.length);

  for (let i = 0; i < len; i++) {
    const pa = partsA[i];
    const pb = partsB[i];
    if (pa === undefined) return -1;
    if (pb === undefined) return 1;
    if (pa !== pb) {
      if (typeof pa === "number" && typeof pb === "number") return pa - pb;
      return String(pa).localeCompare(String(pb), "es", { numeric: true });
    }
  }
  return a.localeCompare(b, "es", { numeric: true });
}

export default function PlantillasList() {
  const router = useRouter();
  const { effectiveRole } = useUserContext();
  const queryClient = useQueryClient();
  const [view, setView] = useState<"list" | "new" | "edit" | "orgs" | "catalogos">("list");

  const [isCollapsed, setIsCollapsed] = useState(true);

  const { data: sectores = [], isLoading: loadingSectores } = useSectores();
  const { data: plantillas = [], isLoading: loadingPlantillas } = usePoliticas();

  const [activeSector, setActiveSector] = useState<string>("all");
  const [selectedPolitica, setSelectedPolitica] = useState<any>(null);

  // Restore sidebar view selection from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedView = localStorage.getItem("lastSidebarView");
      if (savedView === "list" || savedView === "orgs" || savedView === "catalogos") {
        setView(savedView as any);
      }
    }
  }, []);

  // Wrapper function to change view and save sidebar choices in localStorage
  const handleViewChange = (newView: "list" | "new" | "edit" | "orgs" | "catalogos") => {
    setView(newView);
    if (newView === "list" || newView === "orgs" || newView === "catalogos") {
      localStorage.setItem("lastSidebarView", newView);
    }
  };
  const [initialSectorForNew, setInitialSectorForNew] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!ROLES_WITH_PLANTILLAS.includes(effectiveRole)) {
      router.replace("/siget/observatorio");
    }
  }, [effectiveRole, router]);

  const handleCreateSector = async () => {
    const { value: nombre } = await Swal.fire({
      title: 'Nuevo Sector',
      input: 'text',
      inputLabel: 'Nombre del sector',
      inputPlaceholder: 'Ej. Seguridad, Educación...',
      showCancelButton: true,
      confirmButtonColor: '#059669',
      cancelButtonText: 'Cancelar',
      confirmButtonText: 'Crear Sector'
    });

    if (nombre) {
      try {
        await createSector(nombre);
        queryClient.invalidateQueries({ queryKey: ["sectores"] });
        toast.success("El sector ha sido creado.");
      } catch (err) {
        toast.error("No se pudo crear el sector.");
      }
    }
  };

  const currentActiveSector = activeSector === "all" && sectores.length > 0 ? sectores[0].id : activeSector;

  if (view === "new") {
    return (
      <ConstructorFormulario
        onBack={() => handleViewChange("list")}
        initialData={initialSectorForNew ? { sectorId: initialSectorForNew } : undefined}
      />
    );
  }

  if (view === "edit" && selectedPolitica) {
    return (
      <ConstructorFormulario
        onBack={() => { handleViewChange("list"); setSelectedPolitica(null); }}
        initialData={{
          politica: selectedPolitica,
          sectorId: selectedPolitica.sector_id
        }}
      />
    );
  }

  const effectiveActiveSector = activeSector === "all" && sectores.length > 0 ? sectores[0].id : activeSector;

  const filteredPlantillas = (effectiveActiveSector === "all"
    ? plantillas
    : plantillas.filter((p: any) => p.sector_id === effectiveActiveSector)
  ).filter((p: any) =>
    p.codigo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.descripcion?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedPlantillas = [...filteredPlantillas].sort((a: any, b: any) =>
    comparePoliticaCodigo(a.codigo || "", b.codigo || "")
  );

  const openPoliticaEditor = (p: any) => {
    setSelectedPolitica(p);
    handleViewChange("edit");
  };

  return (
    <div className="relative flex w-full h-screen overflow-hidden bg-background pt-[104px] md:pt-16">
      {/* Backdrop overlay when sidebar is expanded */}
      {!isCollapsed && (
        <div
          onClick={() => setIsCollapsed(true)}
          className="fixed inset-0 z-20 bg-black/5 dark:bg-black/40 backdrop-blur-[1px] top-[104px] md:top-16 left-0 right-0 bottom-0"
        />
      )}

      {/* Sidebar - Menú Izquierdo */}
      <aside
        className={`border-r border-border bg-muted/80 dark:bg-card/95 backdrop-blur-sm flex flex-col shrink-0 transition-all duration-300 z-30 absolute left-0 top-[104px] md:top-16 bottom-0 ${
          isCollapsed
            ? "w-[50px] md:w-[70px]"
            : "w-fit max-w-full"
        }`}
      >
        <div className={`border-b border-border h-[64px] flex items-center w-full ${isCollapsed ? "justify-center px-1" : "px-4 py-4"}`}>
          <div className={`flex items-center ${isCollapsed ? "justify-center" : "gap-3 whitespace-nowrap"}`}>
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-2 rounded-lg bg-card border border-border hover:bg-accent transition-colors cursor-pointer shrink-0"
            >
              <LayoutDashboard className="w-4 h-4 text-emerald-600 dark:text-emerald-400/80" />
            </button>
            {!isCollapsed && (
              <h1 className="font-bold text-[11px] tracking-tight text-foreground whitespace-nowrap">Panel de Gestión</h1>
            )}
          </div>
        </div>

        <nav className="flex-1 flex flex-col border-b border-border">
          <button
            onClick={() => {
              handleViewChange("list");
              if (window.innerWidth < 768) setIsCollapsed(true);
            }}
            className={`w-full flex items-center font-bold text-[11px] transition-all cursor-pointer border-b border-border whitespace-nowrap ${
              isCollapsed ? "justify-center py-4 px-2" : "gap-3 px-4 py-4"
            } ${
              view === "list"
                ? "bg-emerald-50 text-emerald-700 dark:bg-white/6 dark:text-emerald-300/90 border-r-2 border-r-emerald-600 dark:border-r-emerald-500/50"
                : "text-muted-foreground hover:bg-accent/60 dark:hover:bg-white/4"
            }`}
          >
            <FileText className="w-4 h-4 shrink-0" />
            {!isCollapsed && <span className="text-[11px] tracking-tight leading-tight">Formularios</span>}
          </button>

          <button
            onClick={() => {
              handleViewChange("orgs");
              if (window.innerWidth < 768) setIsCollapsed(true);
            }}
            className={`w-full flex items-center font-bold text-[11px] transition-all cursor-pointer border-b border-border whitespace-nowrap ${
              isCollapsed ? "justify-center py-4 px-2" : "gap-3 px-4 py-4"
            } ${
              view === "orgs"
                ? "bg-emerald-50 text-emerald-700 dark:bg-white/6 dark:text-emerald-300/90 border-r-2 border-r-emerald-600 dark:border-r-emerald-500/50"
                : "text-muted-foreground hover:bg-accent/60 dark:hover:bg-white/4"
            }`}
            title="Organizaciones y Sectores"
          >
            <Building2 className="w-4 h-4 shrink-0" />
            {!isCollapsed && <span className="text-[11px] tracking-tight leading-tight">Orgs. y Sectores</span>}
          </button>

          <button
            onClick={() => {
              handleViewChange("catalogos");
              if (window.innerWidth < 768) setIsCollapsed(true);
            }}
            className={`w-full flex items-center font-bold text-[11px] transition-all cursor-pointer border-b border-border whitespace-nowrap ${
              isCollapsed ? "justify-center py-4 px-2" : "gap-3 px-4 py-4"
            } ${
              view === "catalogos"
                ? "bg-emerald-50 text-emerald-700 dark:bg-white/6 dark:text-emerald-300/90 border-r-2 border-r-emerald-600 dark:border-r-emerald-500/50"
                : "text-muted-foreground hover:bg-accent/60 dark:hover:bg-white/4"
            }`}
            title="Nacionalidades y Perfiles"
          >
            <Globe className="w-4 h-4 shrink-0" />
            {!isCollapsed && <span className="text-[11px] tracking-tight leading-tight">Nac. y Perfiles</span>}
          </button>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto custom-scrollbar pl-[50px] md:pl-[70px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={view === "orgs" ? "orgs" : view === "catalogos" ? "catalogos" : "formularios"}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`w-full py-6 md:pt-6 max-w-full ${view === "orgs" || view === "catalogos" ? "px-0 lg:px-4 xl:px-5" : "px-4 md:px-8"}`}
          >
            {/* ── Organizaciones y Sectores View ── */}
            {view === "orgs" ? (
              <>
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 lg:mb-8 gap-4 px-4 lg:px-5 xl:px-6 w-full">
                  <div>
                    <h2 className="text-2xl font-bold text-foreground tracking-tight">
                      Organizaciones y Sectores
                    </h2>
                    <p className="text-sm text-muted-foreground">Gestione la estructura de organizaciones vinculadas a sectores.</p>
                  </div>
                </div>
                <div className="w-full px-4 lg:px-5 xl:px-6">
                  <GestionOrgsSectores />
                </div>
              </>
            ) : view === "catalogos" ? (
              <>
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4 px-4 md:px-8 max-w-6xl mx-auto w-full">
                  <div>
                    <h2 className="text-2xl font-bold text-foreground tracking-tight">
                      Nacionalidades y Perfiles
                    </h2>
                    <p className="text-sm text-muted-foreground">Administre los catálogos de nacionalidades y perfiles para los registros del observatorio.</p>
                  </div>
                </div>
                <div className="w-full max-w-6xl mx-auto bg-card md:rounded-3xl border-y md:border border-border overflow-hidden shadow-xl shadow-slate-200/20 dark:shadow-none py-4 md:py-6">
                  <GestionNacionalidadesPerfiles />
                </div>
              </>
            ) : (
            <>
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
              <div>
                <h2 className="text-2xl font-bold text-foreground tracking-tight">
                  Gestión de Formularios
                </h2>
                <p className="text-sm text-muted-foreground">Administre los formularios de indicadores para el observatorio.</p>
              </div>
            </div>

            <div className="bg-card rounded-3xl border border-border overflow-hidden shadow-xl shadow-slate-200/20 dark:shadow-none">
              {/* Tabs de Sectores Estilo Navegador (Restaurado) */}
              <div className="flex items-center border-b border-border bg-muted/50 dark:bg-secondary/30 overflow-x-auto no-scrollbar">
                {sectores.map((s: any) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      setActiveSector(s.id);
                      localStorage.setItem("lastSelectedSector", s.id);
                    }}
                    className={`px-8 py-4 text-xs font-bold transition-all whitespace-nowrap cursor-pointer relative ${effectiveActiveSector === s.id
                      ? "text-emerald-800 bg-emerald-50 dark:text-emerald-300/90 dark:bg-white/5 border-b-2 border-b-emerald-600 dark:border-b-emerald-500/50"
                      : "text-muted-foreground hover:text-foreground"
                      }`}
                  >
                    {s.nombre}
                  </button>
                ))}

                <button
                  onClick={handleCreateSector}
                  className="ml-auto w-[220px] py-4 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:bg-secondary dark:text-emerald-300/80 dark:hover:bg-accent transition-all whitespace-nowrap cursor-pointer border-l border-border flex items-center justify-center gap-2 shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Nuevo Sector
                </button>
              </div>

              <div className="p-0">
                {/* Buscador y Botón Nuevo Formulario (Restaurado) */}
                <div className="flex flex-col md:flex-row items-stretch border-b border-border">
                  <div className="relative flex-1">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Buscar por código o descripción..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-14 pr-6 py-5 bg-transparent border-0 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none transition-all"
                    />
                  </div>
                  <button
                    onClick={() => {
                      setInitialSectorForNew(effectiveActiveSector !== "all" ? effectiveActiveSector : null);
                      handleViewChange("new");
                    }}
                    className="w-full md:w-[220px] py-5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-secondary dark:text-emerald-300/80 dark:hover:bg-accent font-bold text-sm transition-all active:scale-95 cursor-pointer whitespace-nowrap border-t md:border-t-0 md:border-l border-border flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Nuevo Formulario
                  </button>
                </div>

                <div className="p-4 md:p-6 pt-3 md:pt-4">
                  {loadingPlantillas || loadingSectores ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-pulse">
                      {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="p-6 rounded-2xl border border-border bg-muted/50 h-[220px]" />
                      ))}
                    </div>
                  ) : plantillas.length === 0 ? (
                    <div className="text-center py-20">
                      <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                        <LayoutTemplate className="w-10 h-10 text-muted-foreground" />
                      </div>
                      <h3 className="text-xl font-bold text-foreground mb-2">No hay formularios</h3>
                      <p className="text-muted-foreground max-w-sm mx-auto">Aún no se ha creado ninguna política. Presione el botón superior para crear el primero.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="pl-1">
                        <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400/70 uppercase tracking-[0.2em]">
                          Políticas migratorias del sector
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Seleccione una política para editar su formulario.
                        </p>
                      </div>
                      <div className="space-y-3">
                        {sortedPlantillas.map((p: any) => (
                          <div
                            key={p.id}
                            className="flex rounded-2xl border border-border bg-card hover:border-emerald-500/25 dark:hover:border-emerald-500/20 overflow-hidden transition-colors"
                          >
                            <div className="w-1.5 bg-emerald-500/60 dark:bg-emerald-500/40 shrink-0 self-stretch" />
                            <div className="flex-1 min-w-0 px-5 py-5">
                              <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-300/90 bg-emerald-100 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full uppercase tracking-wider">
                                {p.codigo}
                              </span>
                              <p className="text-xs font-bold text-foreground/80 leading-relaxed line-clamp-2 mt-2">
                                {p.descripcion}
                              </p>
                              <button
                                type="button"
                                onClick={() => openPoliticaEditor(p)}
                                className="mt-3 pt-2 w-full border-t border-border/60 flex items-center justify-end gap-1 text-[8px] font-bold normal-case tracking-normal text-emerald-600 dark:text-emerald-400/70 cursor-pointer"
                              >
                                Click para editar
                                <ArrowRight className="w-3 h-3 shrink-0" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            </>
            )}
          </motion.div>
        </AnimatePresence>
      </main>
      <ObsToastContainer />
    </div>
  );
}

