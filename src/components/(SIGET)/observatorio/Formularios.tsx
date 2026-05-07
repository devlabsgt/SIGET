"use client";

import { useState, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, Save, AlertCircle, CheckCircle2, Calendar } from "lucide-react";

interface FormulariosProps {
  onBack: () => void;
}

const SECTOR_ORGS: Record<string, string[]> = {
  Protección: [
    "ACNUR",
    "Casa del Migrante San José",
    "IsraAID",
    "Plan Internacional",
    "Municipalidad de Esquipulas",
    "Organización Internacional para las Migraciones",
    "Refugio de la Niñez",
  ],
  "Reintegración Económica": [
    "Organización Internacional para las Migraciones",
    "CONAMIGUA",
    "Plan Trifinio",
    "Refugio de la Niñez",
  ],
  Salud: [
    "Médicos del Mundo",
    "ACNUR",
    "Organización Internacional para las Migraciones",
    "Casa del Migrante San José",
    "IsraAID",
    "Centro de Salud",
  ],
  Albergue: ["Casa del Migrante San José", "Cruz Roja"],
};

export default function Formularios({ onBack }: FormulariosProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    mesAnio: "",
    sector: "",
    organizacion: "",
    hombres: "",
    mujeres: "",
    ninos: "",
    ninas: "",
    unidadesFamiliares: "",
    discapacidad: "",
    lgbtiq: "",
    noAcompanada: "",
  });
  const [isSaved, setIsSaved] = useState(false);
  const monthInputRef = useRef<HTMLInputElement>(null);

  const handleNext = () => setStep((s) => s + 1);
  const handlePrev = () => setStep((s) => s - 1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => {
      onBack();
    }, 2000);
  };

  const mesFormateado = formData.mesAnio
    ? new Date(formData.mesAnio + "-01T00:00:00")
        .toLocaleDateString("es-ES", { month: "long", year: "numeric" })
        .replace(/^\w/, (c) => c.toUpperCase())
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full pb-10"
    >
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={onBack}
          className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
        >
          <ChevronLeft className="w-5 h-5 text-slate-700 dark:text-slate-300" />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Formulario de Captura</h2>
          <p className="text-sm text-slate-500">Ingreso de indicadores del observatorio</p>
        </div>
      </div>

      <div className="w-full">
        <div className="bg-white dark:bg-[#09090b] rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden px-2 py-8 md:p-8 xl:p-12">
          {/* Progress Bar */}
          <div className="flex items-center gap-6 mb-12">
            <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 transition-all duration-500"
                style={{ width: `${(step / 4) * 100}%` }}
              />
            </div>
            <span className="text-xs font-bold text-slate-500 tracking-wider uppercase">Paso {step} de 4</span>
          </div>

          {isSaved ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-24 text-center"
            >
              <CheckCircle2 className="w-20 h-20 text-blue-600 mb-8" />
              <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">¡Datos guardados con éxito!</h3>
              <p className="text-slate-500 text-lg">Los indicadores han sido registrados en el sistema.</p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-10">
              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-10 flex flex-col items-center"
                  >
                    <div className="w-full pb-6 border-b border-slate-100 dark:border-slate-800 text-center">
                      <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-200">Paso 1: Información Inicial</h3>
                      <p className="text-sm text-slate-500 mt-2">Seleccione el período y sector a reportar.</p>
                    </div>

                    {/* Mes y Año */}
                    <div className="flex flex-col items-center space-y-6 w-full">
                      <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em]">Mes y año que se reporta</label>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => {
                            if (monthInputRef.current) {
                              try { monthInputRef.current.showPicker(); } catch { monthInputRef.current.focus(); }
                            }
                          }}
                          className="inline-flex items-center gap-4 px-8 py-5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-blue-500 focus:ring-2 focus:ring-blue-500 outline-none transition-all cursor-pointer group"
                        >
                          <Calendar className="w-5 h-5 text-blue-500 shrink-0 group-hover:scale-110 transition-transform" />
                          <span className={mesFormateado ? "text-lg font-bold text-slate-800 dark:text-slate-200" : "text-lg font-medium text-slate-400"}>
                            {mesFormateado || "Seleccionar mes"}
                          </span>
                        </button>
                        <input
                          ref={monthInputRef}
                          type="month"
                          required
                          value={formData.mesAnio}
                          onChange={(e) => setFormData({ ...formData, mesAnio: e.target.value })}
                          className="absolute opacity-0 w-0 h-0 pointer-events-none"
                          tabIndex={-1}
                        />
                      </div>
                    </div>
                    {/* Sector - Radio pills */}
                    <div className="flex flex-col items-center space-y-10 w-full">
                      <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.5em]">Sector</label>
                      <div className="flex flex-wrap justify-center gap-6">
                        {[
                          { id: "Protección", color: "bg-blue-600 hover:text-blue-600 border-blue-200" },
                          { id: "Reintegración Económica", color: "bg-emerald-600 hover:text-emerald-600 border-emerald-200" },
                          { id: "Salud", color: "bg-rose-600 hover:text-rose-600 border-rose-200" },
                          { id: "Albergue", color: "bg-orange-600 hover:text-orange-600 border-orange-200" }
                        ].map((sector) => (
                          <button
                            key={sector.id}
                            type="button"
                            onClick={() => setFormData({ ...formData, sector: sector.id, organizacion: "" })}
                            className={`px-8 py-4 rounded-2xl text-base font-bold transition-all border cursor-pointer ${
                              formData.sector === sector.id
                                ? `${sector.color.split(" ")[0]} text-white border-transparent`
                                : `bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 ${sector.color.split(" ")[1]}`
                            }`}
                          >
                            {sector.id}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="w-full flex justify-center pt-8">
                      <button
                        type="button"
                        disabled={!formData.mesAnio || !formData.sector}
                        onClick={handleNext}
                        className="px-10 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm uppercase tracking-widest transition-all active:scale-95 disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer"
                      >
                        Continuar al Paso 2
                      </button>
                    </div>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-16 flex flex-col items-center"
                  >
                    <div className="w-full pb-8 border-b border-slate-100 dark:border-slate-800 text-center">
                      <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-200">Paso 2: Organización Responsable</h3>
                      <div className="mt-2 flex flex-col items-center gap-2">
                        <p className="text-sm text-slate-500">Seleccione la organización correspondiente al sector:</p>
                        <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-sm font-bold border border-blue-100 dark:border-blue-800">
                          {formData.sector}
                        </span>
                      </div>
                    </div>
                    {/* Organización - Radio pills */}
                    <div className="flex flex-col items-center space-y-8 w-full">
                      <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.5em]">Organización</label>
                      <div className="flex flex-wrap justify-center gap-6">
                        {formData.sector && SECTOR_ORGS[formData.sector].map((org) => {
                          let colorClass = "bg-blue-600 hover:text-blue-600 border-blue-200";
                          let customStyle = {};
                          
                          if (org === "Plan Trifinio") {
                            colorClass = ""; 
                            customStyle = formData.organizacion === org 
                              ? { backgroundColor: "#2c5f9b", color: "white", borderColor: "transparent" }
                              : { backgroundColor: "white", color: "#2c5f9b", borderColor: "#2c5f9b" };
                          } else if (org === "ACNUR") colorClass = "bg-sky-600 hover:text-sky-600 border-sky-200";
                          else if (org.includes("Niñez")) colorClass = "bg-purple-600 hover:text-purple-600 border-purple-200";
                          else if (org.includes("Migrante")) colorClass = "bg-amber-600 hover:text-amber-600 border-amber-200";
                          else if (org.includes("Internacional")) colorClass = "bg-indigo-600 hover:text-indigo-600 border-indigo-200";
                          else if (org.includes("CONAMIGUA")) colorClass = "bg-teal-600 hover:text-teal-600 border-teal-200";

                          return (
                            <button
                              key={org}
                              type="button"
                              onClick={() => setFormData({ ...formData, organizacion: org })}
                              style={customStyle}
                              className={`px-8 py-4 rounded-2xl text-base font-bold transition-all border cursor-pointer ${
                                org !== "Plan Trifinio" 
                                  ? (formData.organizacion === org
                                    ? `${colorClass.split(" ")[0]} text-white border-transparent`
                                    : `bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 ${colorClass.split(" ")[1]}`)
                                  : ""
                              }`}
                            >
                              {org}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="w-full flex justify-center gap-6 pt-6">
                      <button
                        type="button"
                        onClick={handlePrev}
                        className="px-10 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 font-bold text-sm text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all uppercase tracking-widest cursor-pointer"
                      >
                        Atrás
                      </button>
                      <button
                        type="button"
                        disabled={!formData.organizacion}
                        onClick={handleNext}
                        className="px-10 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm uppercase tracking-widest transition-all active:scale-95 disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer"
                      >
                        Continuar al Paso 3
                      </button>
                    </div>
                  </motion.div>
                )}

                {step === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-10"
                  >
                    <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-900/30 p-5 rounded-2xl flex items-start gap-4">
                      <AlertCircle className="w-6 h-6 text-blue-600 shrink-0 mt-0.5" />
                      <div>
                        <h3 className="text-lg font-bold text-blue-900 dark:text-blue-300">Personas que reciben información y orientación</h3>
                        <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">Ingrese la cantidad para cada indicador. Ingrese 0 si no hubo casos en la categoría.</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-8">
                      {[
                        { key: "hombres", label: "Hombres" },
                        { key: "mujeres", label: "Mujeres" },
                        { key: "ninos", label: "Niños" },
                        { key: "ninas", label: "Niñas" },
                        { key: "unidadesFamiliares", label: "Unidades Familiares" },
                        { key: "discapacidad", label: "Personas con discapacidad" },
                        { key: "lgbtiq", label: "Personas LGBTIQ+" },
                        { key: "noAcompanada", label: "Niñez y Adolescencia no Acompañada" },
                      ].map((field) => (
                        <div key={field.key} className="space-y-2">
                          <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 line-clamp-2 min-h-[40px] flex items-end">
                            {field.label}
                          </label>
                          <input
                            type="number"
                            min="0"
                            required
                            value={(formData as any)[field.key]}
                            onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                            className="w-full px-5 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-base font-mono text-slate-800 dark:text-slate-200"
                            placeholder="0"
                          />
                        </div>
                      ))}
                    </div>

                    <div className="w-full flex justify-center gap-6 pt-10">
                      <button
                        type="button"
                        onClick={handlePrev}
                        className="px-10 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 font-bold text-sm text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all uppercase tracking-widest cursor-pointer"
                      >
                        Atrás
                      </button>
                      <button
                        type="button"
                        onClick={handleNext}
                        className="px-10 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm uppercase tracking-widest transition-all active:scale-95 cursor-pointer"
                      >
                        Continuar al Resumen
                      </button>
                    </div>
                  </motion.div>
                )}

                {step === 4 && (
                  <motion.div
                    key="step4"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-10 flex flex-col items-center"
                  >
                    <div className="w-full pb-8 border-b border-slate-100 dark:border-slate-800 text-center">
                      <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-200">Paso 4: Confirmar Reporte</h3>
                      <p className="text-sm text-slate-500 mt-2">Revise la información antes del guardado definitivo.</p>
                    </div>

                    <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Resumen General */}
                      <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 space-y-4">
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Información General</h4>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-slate-500">Periodo:</span>
                            <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{mesFormateado}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-slate-500">Sector:</span>
                            <span className="text-sm font-bold text-blue-600">{formData.sector}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-slate-500">Organización:</span>
                            <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{formData.organizacion}</span>
                          </div>
                        </div>
                      </div>

                      {/* Resumen Numérico de Indicadores */}
                      <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 space-y-4">
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Indicadores Reportados</h4>
                        <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                          {[
                            { label: "Hombres", val: formData.hombres },
                            { label: "Mujeres", val: formData.mujeres },
                            { label: "Niños", val: formData.ninos },
                            { label: "Niñas", val: formData.ninas },
                            { label: "U. Famil.", val: formData.unidadesFamiliares },
                            { label: "Discap.", val: formData.discapacidad }
                          ].map((item, i) => (
                            <div key={i} className="flex justify-between">
                              <span className="text-xs text-slate-500">{item.label}:</span>
                              <span className="text-xs font-black text-slate-800 dark:text-slate-200">{item.val || "0"}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Visualización Gráfica Horizontal */}
                      <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 space-y-6 md:col-span-2">
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest text-center">Distribución Visual</h4>
                        
                        <div className="space-y-4">
                          {[
                            { label: "Hombres", value: parseInt(formData.hombres || "0"), color: "bg-blue-500" },
                            { label: "Mujeres", value: parseInt(formData.mujeres || "0"), color: "bg-rose-500" },
                            { label: "Niños", value: parseInt(formData.ninos || "0"), color: "bg-emerald-500" },
                            { label: "Niñas", value: parseInt(formData.ninas || "0"), color: "bg-purple-500" },
                            { label: "U. Familiares", value: parseInt(formData.unidadesFamiliares || "0"), color: "bg-amber-500" },
                            { label: "Discapacidad", value: parseInt(formData.discapacidad || "0"), color: "bg-teal-500" }
                          ].map((item, idx) => {
                            const maxValue = Math.max(...[
                              parseInt(formData.hombres || "0"),
                              parseInt(formData.mujeres || "0"),
                              parseInt(formData.ninos || "0"),
                              parseInt(formData.ninas || "0"),
                              parseInt(formData.unidadesFamiliares || "0"),
                              parseInt(formData.discapacidad || "0")
                            ], 1);
                            const percentage = (item.value / maxValue) * 100;

                            return (
                              <div key={idx} className="space-y-1.5">
                                <div className="flex justify-between items-center">
                                  <span className="text-[10px] font-bold text-slate-500 uppercase">{item.label}</span>
                                  <span className="text-xs font-black text-slate-900 dark:text-white">{item.value}</span>
                                </div>
                                <div className="h-3.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${percentage}%` }}
                                    transition={{ duration: 1, delay: idx * 0.1, ease: "easeOut" }}
                                    className={`h-full ${item.color} rounded-full`}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="w-full flex justify-center gap-6 pt-10">
                      <button
                        type="button"
                        onClick={handlePrev}
                        className="px-10 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 font-bold text-sm text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all uppercase tracking-widest cursor-pointer"
                      >
                        Corregir
                      </button>
                      <button
                        type="submit"
                        className="px-10 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm uppercase tracking-widest transition-all active:scale-95 cursor-pointer shadow-lg shadow-blue-600/20 flex items-center gap-3"
                      >
                        <Save className="w-4 h-4" />
                        Guardar Definitivo
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </form>
          )}
        </div>
      </div>
    </motion.div>
  );
}
