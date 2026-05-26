"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Loader2, ClipboardList, ArrowRight, LayoutTemplate } from "lucide-react";
import { useRouter } from "next/navigation";
import Formularios from "./Formularios";
import { useSectores, usePoliticas, useOrganizacionSectores } from "./lib/hooks";
import { ObsPolitica } from "./lib/actions";
import {
  useUser,
  useUserContext,
} from "@/components/(base)/providers/UserProvider";

const ROLES_WITH_PLANTILLAS = ["admin", "super", "admin-observatorio"];

export default function FormulariosList() {
  const router = useRouter();
  const user = useUser();
  const { effectiveRole } = useUserContext();
  const canSeePlantillas = ROLES_WITH_PLANTILLAS.includes(effectiveRole);
  const canChooseOrg =
    effectiveRole.includes("admin") || effectiveRole === "super";
  const restrictByOrg = !canChooseOrg;
  const userOrganizacionId = user?.user_metadata?.organizacion_id as
    | string
    | undefined;

  const [selectedPolitica, setSelectedPolitica] = useState<ObsPolitica | null>(null);

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
      : visiblePoliticas.filter((p: ObsPolitica) => p.sector_id === effectiveSector)
  ) as ObsPolitica[];

  const sortedPoliticas = [...filteredPoliticas].sort((a, b) =>
    (a.codigo || "").localeCompare(b.codigo || "", "es", { numeric: true })
  );

  const isLoading =
    loadingSectores || loadingPoliticas || (restrictByOrg && loadingOrgSectores);

  const emptyMessage = restrictByOrg && !userOrganizacionId
    ? "No tiene una organización asignada. Contacte a un administrador."
    : canSeePlantillas
      ? "Aún no se han creado plantillas para este sector. Vaya a la sección de Plantillas para crear formularios primero."
      : "Aún no hay formularios disponibles para su organización en este sector. Contacte a un administrador si necesita acceso.";

  return (
    <div className="flex-1 w-full px-2 md:px-6 lg:px-12 max-w-[1600px] mx-auto pb-20 pt-32 md:pt-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="w-full"
      >
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/siget/observatorio")}
              className="p-2.5 rounded-xl bg-card border border-border hover:bg-accent transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5 text-muted-foreground" />
            </button>
            <div>
              <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <ClipboardList className="w-6 h-6 text-purple-600" />
                Ingresar Datos
              </h2>
              <p className="text-sm text-muted-foreground">
                Seleccione un formulario para registrar los datos del período.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-[2.5rem] border border-border overflow-hidden shadow-xl shadow-slate-200/20 dark:shadow-none">
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

          <div className="p-6 md:p-10">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-10 h-10 animate-spin text-purple-500 mb-4" />
                <p className="text-muted-foreground">Cargando formularios disponibles...</p>
              </div>
            ) : sortedPoliticas.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-20 h-20 bg-muted dark:bg-accent rounded-full flex items-center justify-center mx-auto mb-6">
                  <LayoutTemplate className="w-10 h-10 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">
                  No hay formularios disponibles
                </h3>
                <p className="text-muted-foreground max-w-sm mx-auto mb-8">
                  {emptyMessage}
                </p>
                {canSeePlantillas && (
                  <button
                    onClick={() => router.push("/siget/observatorio/plantillas")}
                    className="px-6 py-3 bg-purple-100 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 font-bold rounded-xl hover:bg-purple-200 dark:hover:bg-purple-500/20 transition-colors cursor-pointer"
                  >
                    Ir a Plantillas
                  </button>
                )}
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
                  <div className="mb-6">
                    <p className="text-[10px] font-black text-purple-600 dark:text-purple-400 uppercase tracking-[0.2em]">
                      Seleccione el formulario que desea llenar
                    </p>
                  </div>

                  <div className="space-y-3">
                    {sortedPoliticas.map((p) => (
                      <div
                        key={p.id}
                        className="flex rounded-2xl border border-border bg-muted/50 dark:bg-background hover:border-purple-200 dark:hover:border-purple-900/60 overflow-hidden transition-colors"
                      >
                        <div className="w-1.5 bg-purple-600 shrink-0 self-stretch" />
                        <div className="flex-1 min-w-0 px-5 py-5">
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
    </div>
  );
}
