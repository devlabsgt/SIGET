"use client";

import { useState } from "react";
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

  const handleNext = () => setStep((s) => s + 1);
  const handlePrev = () => setStep((s) => s - 1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => {
      onBack();
    }, 2000);
  };

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

      <div className="bg-white dark:bg-[#09090b] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden p-6 xl:p-10">
        {/* Progress Bar */}
        <div className="flex items-center gap-4 mb-10 max-w-2xl">
          <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all duration-500"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
          <span className="text-xs font-bold text-slate-500 tracking-wider uppercase">Paso {step} de 3</span>
        </div>

        {isSaved ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <CheckCircle2 className="w-20 h-20 text-blue-600 mb-6" />
            <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">¡Datos guardados con éxito!</h3>
            <p className="text-slate-500 text-lg">Los indicadores han sido registrados en el sistema.</p>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-8">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  <div className="pb-4 border-b border-slate-100 dark:border-slate-800">
                    <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">Paso 1: Información Inicial</h3>
                    <p className="text-sm text-slate-500 mt-1">Seleccione el período y sector a reportar.</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl">
                    <div className="space-y-3">
                      <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Mes y año que se reporta</label>
                      <div className="relative flex items-center w-full">
                        <Calendar className="w-5 h-5 text-slate-400 absolute left-4 pointer-events-none z-10" />
                        {!formData.mesAnio && (
                          <span className="absolute left-12 text-slate-400 font-medium pointer-events-none z-10">
                            Seleccionar Mes
                          </span>
                        )}
                        <input
                          type="month"
                          required
                          value={formData.mesAnio}
                          onChange={(e) => setFormData({ ...formData, mesAnio: e.target.value })}
                          className={`w-full pl-12 pr-5 py-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer ${formData.mesAnio ? "text-slate-700 dark:text-slate-300" : "text-transparent"}`}
                        />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Sector</label>
                      <select
                        required
                        value={formData.sector}
                        onChange={(e) => setFormData({ ...formData, sector: e.target.value, organizacion: "" })}
                        className="w-full px-5 py-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-slate-700 dark:text-slate-300"
                      >
                        <option value="">Seleccione un sector...</option>
                        {Object.keys(SECTOR_ORGS).map((sector) => (
                          <option key={sector} value={sector}>
                            {sector}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-end pt-8 max-w-4xl">
                    <button
                      type="button"
                      disabled={!formData.mesAnio || !formData.sector}
                      onClick={handleNext}
                      className="px-8 py-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                  className="space-y-8"
                >
                  <div className="pb-4 border-b border-slate-100 dark:border-slate-800">
                    <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">Paso 2: Organización Responsable</h3>
                    <p className="text-sm text-slate-500 mt-1">Seleccione la organización correspondiente al sector {formData.sector}.</p>
                  </div>
                  <div className="space-y-3 max-w-2xl">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      Organización
                    </label>
                    <select
                      required
                      value={formData.organizacion}
                      onChange={(e) => setFormData({ ...formData, organizacion: e.target.value })}
                      className="w-full px-5 py-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-slate-700 dark:text-slate-300"
                    >
                      <option value="">Seleccione una organización...</option>
                      {formData.sector && SECTOR_ORGS[formData.sector].map((org) => (
                        <option key={org} value={org}>
                          {org}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex justify-between pt-8 max-w-4xl">
                    <button
                      type="button"
                      onClick={handlePrev}
                      className="px-8 py-4 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      Atrás
                    </button>
                    <button
                      type="button"
                      disabled={!formData.organizacion}
                      onClick={handleNext}
                      className="px-8 py-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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

                  <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-x-6 gap-y-8">
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

                  <div className="flex justify-between pt-10 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={handlePrev}
                      className="px-8 py-4 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      Atrás
                    </button>
                    <button
                      type="submit"
                      className="flex items-center gap-3 px-8 py-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md transition-colors"
                    >
                      <Save className="w-5 h-5" />
                      Guardar Reporte Definitivo
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </form>
        )}
      </div>
    </motion.div>
  );
}
