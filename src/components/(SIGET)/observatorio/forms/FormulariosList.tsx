"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  Loader2,
  ClipboardList,
  ArrowRight,
  LayoutTemplate,
  LayoutDashboard,
  History,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Formularios from "./Formularios";
import RegistrosHistoricos from "./RegistrosHistoricos";
import { useSectores, usePoliticas, useOrganizacionSectores } from "./lib/hooks";
import { ObsPolitica } from "./lib/actions";
import {
  useUser,
  useUserContext,
} from "@/components/(base)/providers/UserProvider";

const SIDEBAR_TRANSITION = { duration: 0.28, ease: [0.4, 0, 0.2, 1] as const };
const SIDEBAR_EXPANDED_WIDTH = 260;

type FormView = "datos" | "historico";

const sidebarNavItemClass = (isActive: boolean, isCollapsed: boolean) =>
  `w-full flex items-center font-bold text-sm transition-colors duration-200 cursor-pointer border-b border-border ${
    isCollapsed ? "justify-center py-4 px-2" : "gap-3 px-4 py-4"
  } ${
    isActive
      ? "bg-purple-50 text-purple-700 dark:bg-white/6 dark:text-purple-300/90 border-r-2 border-r-purple-600 dark:border-r-purple-500/50 hover:bg-purple-100 dark:hover:bg-white/10"
      : "text-muted-foreground hover:bg-purple-50 hover:text-purple-700 dark:hover:bg-white/8 dark:hover:text-purple-300/90"
  }`;

export default function FormulariosList() {
  const router = useRouter();
  const user = useUser();
  const { effectiveRole } = useUserContext();
  const canChooseOrg =
    effectiveRole.includes("admin") || effectiveRole === "super";
  const canDeleteRegistros =
    effectiveRole.includes("admin") || effectiveRole === "super";
  const restrictByOrg = !canChooseOrg;
  const userOrganizacionId = user?.user_metadata?.organizacion_id as
    | string
    | undefined;

  const [view, setView] = useState<FormView>("datos");
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isMd, setIsMd] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedView = localStorage.getItem("lastFormulariosView");
      if (savedView === "datos" || savedView === "historico") {
        setView(savedView);
      }
    }
  }, []);

  const handleViewChange = (newView: FormView) => {
    setView(newView);
    localStorage.setItem("lastFormulariosView", newView);
  };

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const sync = () => setIsMd(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const [selectedPolitica, setSelectedPolitica] = useState<ObsPolitica | null>(
    null,
  );

  const { data: sectores = [], isLoading: loadingSectores } = useSectores();
  const { data: politicas = [], isLoading: loadingPoliticas } = usePoliticas();
  const { data: orgSectorIds = [], isLoading: loadingOrgSectores } =
    useOrganizacionSectores(userOrganizacionId, restrictByOrg);

  const [activeSector, setActiveSector] = useState<string>("all");

  const visibleSectores = useMemo(() => {
    if (!restrictByOrg) return sectores;
    if (!userOrganizacionId) return [];
    return sectores.filter((s) => orgSectorIds.includes(s.id));
  }, [restrictByOrg, sectores, userOrganizacionId, orgSectorIds]);

  const visiblePoliticas = useMemo(() => {
    if (!restrictByOrg) return politicas;
    if (!userOrganizacionId) return [];
    return politicas.filter((p: ObsPolitica) =>
      orgSectorIds.includes(p.sector_id),
    );
  }, [restrictByOrg, politicas, userOrganizacionId, orgSectorIds]);

  // Cuando se selecciona una política, el formulario de ingreso toma toda la pantalla.
  if (selectedPolitica) {
    return (
      <Formularios
        onBack={() => setSelectedPolitica(null)}
        initialPolitica={selectedPolitica}
        canChooseOrg={canChooseOrg}
        userOrganizacionId={userOrganizacionId}
      />
    );
  }

  const effectiveSector =
    activeSector === "all" && visibleSectores.length > 0
      ? visibleSectores[0].id
      : activeSector;

  const filteredPoliticas = (
    effectiveSector === "all"
      ? visiblePoliticas
      : visiblePoliticas.filter(
          (p: ObsPolitica) => p.sector_id === effectiveSector,
        )
  ) as ObsPolitica[];

  const sortedPoliticas = [...filteredPoliticas].sort((a, b) =>
    (a.codigo || "").localeCompare(b.codigo || "", "es", { numeric: true }),
  );

  const isLoading =
    loadingSectores ||
    loadingPoliticas ||
    (restrictByOrg && loadingOrgSectores);

  const emptyMessage =
    restrictByOrg && !userOrganizacionId
      ? "No tiene una organización asignada. Contacte a un administrador."
      : restrictByOrg
        ? "Aún no hay formularios disponibles para su organización en este sector. Contacte a un administrador si necesita acceso."
        : "Aún no hay formularios disponibles para este sector.";

  const collapsedSidebarWidth = isMd ? 70 : 50;

  const navItems: { id: FormView; label: string; icon: typeof ClipboardList }[] = [
    { id: "datos", label: "Datos", icon: ClipboardList },
    { id: "historico", label: "Registros históricos", icon: History },
  ];

  return (
    <div className="relative flex w-full flex-1 min-h-0 overflow-hidden bg-background">
      {/* Sidebar - Menú Izquierdo */}
      <motion.aside
        initial={false}
        animate={{
          width: isCollapsed ? collapsedSidebarWidth : SIDEBAR_EXPANDED_WIDTH,
        }}
        transition={SIDEBAR_TRANSITION}
        className="border-r border-border bg-muted dark:bg-card flex flex-col shrink-0 self-stretch overflow-hidden z-30"
      >
        <div
          className={`border-b border-border h-[64px] flex items-center w-full transition-colors duration-200 hover:bg-purple-50/60 dark:hover:bg-white/5 ${isCollapsed ? "justify-center px-1" : "px-4 py-4"}`}
        >
          <div
            className={`flex items-center min-w-0 ${isCollapsed ? "justify-center" : "gap-3"}`}
          >
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-2 rounded-lg bg-card border border-border hover:bg-purple-100 dark:hover:bg-white/10 transition-colors duration-200 cursor-pointer shrink-0"
            >
              <LayoutDashboard className="w-4 h-4 text-purple-600 dark:text-purple-400/80" />
            </button>
            <AnimatePresence>
              {!isCollapsed && (
                <motion.h1
                  key="sidebar-title"
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -6 }}
                  transition={{ ...SIDEBAR_TRANSITION, delay: 0.04 }}
                  className="font-bold text-base tracking-tight text-foreground whitespace-nowrap overflow-hidden"
                >
                  Ingreso de Datos
                </motion.h1>
              )}
            </AnimatePresence>
          </div>
        </div>

        <nav className="flex flex-col justify-start border-b border-border">
          {navItems.map((item, idx) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => {
                  handleViewChange(item.id);
                  if (window.innerWidth < 768) setIsCollapsed(true);
                }}
                className={sidebarNavItemClass(view === item.id, isCollapsed)}
                title={item.label}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <AnimatePresence>
                  {!isCollapsed && (
                    <motion.span
                      key={`nav-${item.id}`}
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -6 }}
                      transition={{
                        ...SIDEBAR_TRANSITION,
                        delay: 0.05 + idx * 0.03,
                      }}
                      className="tracking-tight leading-tight whitespace-nowrap overflow-hidden"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            );
          })}
        </nav>
      </motion.aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 overflow-y-auto custom-scrollbar">
        <div className="w-full max-w-[1600px] mx-auto pb-20 pt-6 md:pt-8 px-0 md:px-6 lg:px-10">
          <AnimatePresence mode="wait">
            {view === "datos" ? (
              <motion.div
                key="datos"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="w-full"
              >
                <div className="flex gap-3 pl-4 md:pl-0 mb-8">
                  <button
                    onClick={() => router.push("/siget/observatorio")}
                    className="shrink-0 mt-0.5 h-10 w-10 flex items-center justify-center rounded-xl bg-card border border-border hover:bg-accent transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-5 h-5 text-muted-foreground" />
                  </button>
                  <div className="min-w-0">
                    <h2 className="text-2xl font-bold text-foreground leading-tight">
                      Ingresar Datos
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      Seleccione un formulario para registrar los datos del
                      período.
                    </p>
                  </div>
                </div>

                <div className="bg-card rounded-none md:rounded-[2.5rem] border border-border overflow-hidden shadow-xl shadow-slate-200/20 dark:shadow-none">
                  {!isLoading && visibleSectores.length > 0 && (
                    <div className="flex items-center border-b border-border bg-muted/50 dark:bg-secondary/30 overflow-x-auto no-scrollbar">
                      {visibleSectores.map((s: any) => (
                        <button
                          key={s.id}
                          onClick={() => setActiveSector(s.id)}
                          className={`px-8 py-4 text-xs font-bold transition-all whitespace-nowrap cursor-pointer relative ${
                            effectiveSector === s.id
                              ? "text-purple-800 bg-purple-50 dark:bg-purple-900/20 border-b-2 border-b-purple-600 dark:text-purple-400"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {s.nombre}
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="py-4 px-0 md:p-10">
                    {isLoading ? (
                      <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="w-10 h-10 animate-spin text-purple-500 mb-4" />
                        <p className="text-muted-foreground">
                          Cargando formularios disponibles...
                        </p>
                      </div>
                    ) : sortedPoliticas.length === 0 ? (
                      <div className="text-center py-20">
                        <div className="w-20 h-20 bg-muted dark:bg-accent rounded-full flex items-center justify-center mx-auto mb-6">
                          <LayoutTemplate className="w-10 h-10 text-muted-foreground" />
                        </div>
                        <h3 className="text-xl font-bold text-foreground mb-2">
                          No hay formularios disponibles
                        </h3>
                        <p className="text-muted-foreground max-w-sm mx-auto">
                          {emptyMessage}
                        </p>
                      </div>
                    ) : (
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={effectiveSector}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="space-y-4"
                        >
                          <div className="mb-6 px-4 md:px-0">
                            <p className="text-[10px] font-black text-purple-600 dark:text-purple-400 uppercase tracking-[0.2em]">
                              Seleccione el formulario que desea llenar
                            </p>
                          </div>

                          <div className="space-y-0 md:space-y-3">
                            {sortedPoliticas.map((p) => (
                              <div
                                key={p.id}
                                className="flex rounded-none md:rounded-2xl border-y md:border border-border bg-muted/50 dark:bg-background hover:border-purple-200 dark:hover:border-purple-900/60 overflow-hidden transition-colors"
                              >
                                <div className="w-1.5 bg-purple-600 shrink-0 self-stretch" />
                                <div className="flex-1 min-w-0 px-4 md:px-5 py-5">
                                  <span className="text-[10px] font-black text-purple-700 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/50 px-2.5 py-1 rounded-full uppercase tracking-wider">
                                    {p.codigo}
                                  </span>
                                  <p className="text-xs font-bold text-foreground/80 leading-relaxed line-clamp-2 mt-2">
                                    {p.descripcion}
                                  </p>
                                  <button
                                    type="button"
                                    onClick={() => setSelectedPolitica(p)}
                                    className="mt-3 pt-2 w-full border-t border-purple-100/80 dark:border-purple-900/30 flex items-center justify-end gap-1 text-[8px] font-bold normal-case tracking-normal text-purple-600 dark:text-purple-400 cursor-pointer"
                                  >
                                    Clic para ingresar datos
                                    <ArrowRight className="w-3 h-3 shrink-0" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      </AnimatePresence>
                    )}
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="historico"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="w-full"
              >
                <div className="flex gap-3 pl-4 md:pl-0 mb-8">
                  <button
                    onClick={() => router.push("/siget/observatorio")}
                    className="shrink-0 mt-0.5 h-10 w-10 flex items-center justify-center rounded-xl bg-card border border-border hover:bg-accent transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-5 h-5 text-muted-foreground" />
                  </button>
                  <div className="min-w-0">
                    <h2 className="text-2xl font-bold text-foreground leading-tight">
                      Registros Históricos
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      Consulte los registros que se han ingresado en el
                      observatorio.
                    </p>
                  </div>
                </div>

                <RegistrosHistoricos
                  restrictByOrg={restrictByOrg}
                  userOrganizacionId={userOrganizacionId}
                  canDelete={canDeleteRegistros}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
