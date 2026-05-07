"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import AnimatedIcon from "@/components/ui/AnimatedIcon";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useUser } from "@/components/(base)/providers/UserProvider";
import { AuroraText } from "@/components/ui/aurora-text";

// Import simulated views
import Formularios from "./Formularios";
import Reportes from "./Reportes";

export default function ObservatorioWeb() {
  const router = useRouter();
  const user = useUser();
  const metadata = user?.user_metadata || {};
  const realRole = metadata.rol || user?.role || "user";
  const [effectiveRole, setEffectiveRole] = useState(realRole);

  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<"menu" | "formularios" | "reportes">("menu");

  const fullText = "Es un gusto verte hoy, desde aquí puedes gestionar el Observatorio Web de Plan Trifinio";
  const [typedText, setTypedText] = useState("");

  useEffect(() => {
    if (realRole) setEffectiveRole(realRole);
    setLoading(false);
  }, [realRole]);

  useEffect(() => {
    let i = 0;
    const timeout = setTimeout(() => {
      const interval = setInterval(() => {
        setTypedText(fullText.substring(0, i + 1));
        i++;
        if (i >= fullText.length) clearInterval(interval);
      }, 30);
      return () => clearInterval(interval);
    }, 600);
    return () => clearTimeout(timeout);
  }, []);

  if (loading) {
    return (
      <div className="flex-1 w-full px-6 lg:px-12 space-y-10 max-w-550 mx-auto pb-10 pt-20">
        <Skeleton className="h-[400px] w-full rounded-[2.5rem]" />
      </div>
    );
  }

  return (
    <>
      <div className="fixed inset-0 pointer-events-none z-[-1] bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:24px_24px] dark:bg-[radial-gradient(#1f2937_1px,transparent_1px)] opacity-60" />
      <div className="flex-1 w-full px-2 md:px-6 lg:px-12 max-w-[1600px] mx-auto pb-20 pt-32 md:pt-20">
        
        <AnimatePresence mode="wait">
          {activeView === "menu" && (
            <motion.div
              key="menu"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="space-y-12"
            >
              {/* Header Centrado */}
              <div className="flex flex-col items-center justify-center text-center w-full gap-4 relative z-10">
                <div id="observatorio-header-icon" className="group cursor-pointer flex items-center justify-center gap-4 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 pl-2 pr-8 py-2 rounded-full text-xs font-black uppercase tracking-[0.15em] mb-6 border border-blue-100 dark:border-blue-500/20 shadow-sm transition-all hover:shadow-lg hover:bg-blue-100 dark:hover:bg-blue-500/20">
                   <div className="shrink-0 flex items-center justify-center w-16 h-16 bg-white border border-slate-200 rounded-full transition-transform group-hover:scale-105 shadow-sm">
                     <AnimatedIcon iconKey="qqvpjphn" target="#observatorio-header-icon" size={48} />
                   </div>
                   Módulos del Observatorio Web
                </div>
                
                <motion.h2 
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="text-4xl md:text-6xl font-black tracking-tighter text-slate-900 dark:text-white leading-tight"
                >
                  ¡Bienvenido,{" "}
                  <AuroraText>
                    {metadata.nombre?.split(' ')[0] || 'Usuario'}
                  </AuroraText>
                  !
                </motion.h2>

                <p className="text-base md:text-lg text-slate-500 dark:text-slate-400 font-medium max-w-xl mx-auto leading-relaxed min-h-[56px] md:min-h-[60px]">
                  {typedText}
                  <motion.span
                    animate={{ opacity: [1, 0] }}
                    transition={{ repeat: Infinity, duration: 0.8 }}
                    className="inline-block w-[2px] h-[1em] bg-blue-600 ml-1 align-middle"
                  />
                </p>
              </div>

              {/* Cards estilo Pricing */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto mt-12 relative z-10">
                
                {/* Card Avanzada -> Reportes (Azul) */}
                <div id="card-reportes" className="bg-white dark:bg-[#09090b] rounded-3xl border border-blue-500/30 dark:border-blue-500/20 shadow-xl p-0 flex flex-col justify-between relative overflow-hidden ring-1 ring-blue-500/20 cursor-pointer group hover:shadow-2xl hover:-translate-y-1 transition-all duration-300" onClick={() => setActiveView("reportes")}>
                  <div className="bg-blue-600 text-white text-center py-2 text-[10px] font-black tracking-widest uppercase">
                    Análisis de Datos
                  </div>
                  <div className="p-8 flex flex-col h-full">
                    <div className="flex items-start gap-5 mb-8">
                      <div className="flex shrink-0 items-center justify-center w-20 h-20 bg-white dark:bg-white border border-slate-200 rounded-2xl group-hover:scale-110 transition-transform shadow-sm">
                        <AnimatedIcon iconKey="mbhqzvjk" target="#card-reportes" size={48} />
                      </div>
                      <div className="flex flex-col pt-1">
                        <h3 className="text-3xl font-black text-slate-900 dark:text-white leading-none mb-2">Reportes</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-snug">Generación de reportes y cruce de variables de los indicadores recolectados.</p>
                      </div>
                    </div>
                    <button className="w-full text-center py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md transition-colors mb-8 cursor-pointer pointer-events-none">
                      Generar Reportes
                    </button>
                    <ul className="space-y-4 mt-auto">
                      {[
                        "Descarga de datos en PDF/Excel",
                        "Gráficos interactivos dinámicos",
                        "Análisis avanzado y filtros"
                      ].map((feature, i) => (
                        <li key={i} className="flex items-center gap-3 text-sm font-medium text-slate-600 dark:text-slate-300">
                          <svg className="w-5 h-5 text-blue-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Card Básica -> Formularios (Verde) */}
                <div id="card-formularios" className="bg-white dark:bg-[#09090b] rounded-3xl border border-emerald-500/30 dark:border-emerald-500/20 shadow-xl p-0 flex flex-col justify-between relative overflow-hidden ring-1 ring-emerald-500/20 cursor-pointer group hover:shadow-2xl hover:-translate-y-1 transition-all duration-300" onClick={() => setActiveView("formularios")}>
                  <div className="bg-emerald-600 text-white text-center py-2 text-[10px] font-black tracking-widest uppercase">
                    Recolección de Datos
                  </div>
                  <div className="p-8 flex flex-col h-full">
                    <div className="flex items-start gap-5 mb-8">
                      <div className="flex shrink-0 items-center justify-center w-20 h-20 bg-white dark:bg-white border border-slate-200 rounded-2xl group-hover:scale-110 transition-transform shadow-sm">
                        <AnimatedIcon iconKey="uwkcewhk" target="#card-formularios" size={48} />
                      </div>
                      <div className="flex flex-col pt-1">
                        <h3 className="text-3xl font-black text-slate-900 dark:text-white leading-none mb-2">Formularios</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-snug">Gestión de recolección de datos mediante formularios interactivos.</p>
                      </div>
                    </div>
                    <button className="w-full text-center py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition-colors mb-8 cursor-pointer pointer-events-none">
                      Acceder a Formularios
                    </button>
                    <ul className="space-y-4 mt-auto">
                      {[
                        "Creación y llenado de registros",
                        "Edición de datos en tiempo real",
                        "Historial de envíos por usuario"
                      ].map((feature, i) => (
                        <li key={i} className="flex items-center gap-3 text-sm font-medium text-slate-600 dark:text-slate-300">
                          <svg className="w-5 h-5 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

              </div>
            </motion.div>
          )}

          {activeView === "formularios" && (
            <Formularios key="formularios" onBack={() => setActiveView("menu")} />
          )}

          {activeView === "reportes" && (
            <Reportes key="reportes" onBack={() => setActiveView("menu")} />
          )}
        </AnimatePresence>

      </div>
    </>
  );
}
