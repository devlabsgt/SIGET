import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Download, Calendar, PieChart as PieChartIcon } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LabelList
} from "recharts";

interface ReportesProps {
  onBack: () => void;
}

const mockDataDemografia = [
  { name: "Ene", hombres: 400, mujeres: 240, ninos: 150 },
  { name: "Feb", hombres: 300, mujeres: 139, ninos: 200 },
  { name: "Mar", hombres: 200, mujeres: 980, ninos: 250 },
  { name: "Abr", hombres: 278, mujeres: 390, ninos: 180 },
  { name: "May", hombres: 189, mujeres: 480, ninos: 300 },
  { name: "Jun", hombres: 239, mujeres: 380, ninos: 200 },
];

const mockDataProteccion = [
  { org: "ACNUR", atenciones: 850 },
  { org: "C. Migrante S.J.", atenciones: 1200 },
  { org: "IsraAID", atenciones: 430 },
  { org: "Plan Int.", atenciones: 650 },
  { org: "Muni. Esquipulas", atenciones: 210 },
  { org: "OIM", atenciones: 940 },
  { org: "Refugio Niñez", atenciones: 580 },
];

const sectorData: Record<string, { name: string; value: number; color: string }[]> = {
  Protección: [
    { name: "Hombres", value: 1250, color: "#3b82f6" },
    { name: "Mujeres", value: 1840, color: "#8b5cf6" },
    { name: "Niños", value: 650, color: "#14b8a6" },
    { name: "Niñas", value: 680, color: "#f59e0b" },
    { name: "Unidades Familiares", value: 410, color: "#6366f1" },
    { name: "Discapacidad", value: 125, color: "#ef4444" },
    { name: "LGBTIQ+", value: 85, color: "#ec4899" },
    { name: "Niñez No Acompañada", value: 45, color: "#f97316" },
  ],
  "Reintegración Económica": [
    { name: "Hombres", value: 820, color: "#3b82f6" },
    { name: "Mujeres", value: 1150, color: "#8b5cf6" },
    { name: "Niños", value: 120, color: "#14b8a6" },
    { name: "Niñas", value: 135, color: "#f59e0b" },
    { name: "Unidades Familiares", value: 280, color: "#6366f1" },
    { name: "Discapacidad", value: 65, color: "#ef4444" },
    { name: "LGBTIQ+", value: 40, color: "#ec4899" },
    { name: "Niñez No Acompañada", value: 5, color: "#f97316" },
  ],
  Salud: [
    { name: "Hombres", value: 1850, color: "#3b82f6" },
    { name: "Mujeres", value: 2420, color: "#8b5cf6" },
    { name: "Niños", value: 1450, color: "#14b8a6" },
    { name: "Niñas", value: 1580, color: "#f59e0b" },
    { name: "Unidades Familiares", value: 890, color: "#6366f1" },
    { name: "Discapacidad", value: 340, color: "#ef4444" },
    { name: "LGBTIQ+", value: 95, color: "#ec4899" },
    { name: "Niñez No Acompañada", value: 25, color: "#f97316" },
  ],
  Albergue: [
    { name: "Hombres", value: 2100, color: "#3b82f6" },
    { name: "Mujeres", value: 1950, color: "#8b5cf6" },
    { name: "Niños", value: 890, color: "#14b8a6" },
    { name: "Niñas", value: 920, color: "#f59e0b" },
    { name: "Unidades Familiares", value: 1150, color: "#6366f1" },
    { name: "Discapacidad", value: 180, color: "#ef4444" },
    { name: "LGBTIQ+", value: 110, color: "#ec4899" },
    { name: "Niñez No Acompañada", value: 310, color: "#f97316" },
  ],
};

const mockTableData = [
  { sector: "Protección", org: "ACNUR", total: 850, familias: 140 },
  { sector: "Protección", org: "Casa del Migrante San José", total: 1200, familias: 210 },
  { sector: "Protección", org: "Organización Internacional para las Migraciones", total: 940, familias: 160 },
  { sector: "Protección", org: "Plan Internacional", total: 650, familias: 85 },
  { sector: "Protección", org: "Refugio de la Niñez", total: 580, familias: 75 },
  { sector: "Salud", org: "Médicos del Mundo", total: 850, familias: 90 },
  { sector: "Albergue", org: "Cruz Roja", total: 1560, familias: 210 },
  { sector: "Reintegración", org: "CONAMIGUA", total: 430, familias: 50 },
];

const CustomBarLabel = (props: any) => {
  const { x, y, value } = props;
  return (
    <text x={x} y={y - 8} fill="#64748b" fontSize={12} fontWeight="600" className="dark:fill-slate-400">
      {value}
    </text>
  );
};

export default function Reportes({ onBack }: ReportesProps) {
  const [selectedSector, setSelectedSector] = useState("Protección");
  const [dateMode, setDateMode] = useState<"Todo" | "Mes" | "Rango">("Todo");
  const [singleMonth, setSingleMonth] = useState("");
  const [startMonth, setStartMonth] = useState("");
  const [endMonth, setEndMonth] = useState("");

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full pb-10 space-y-6"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
          >
            <ChevronLeft className="w-5 h-5 text-slate-700 dark:text-slate-300" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Análisis de Datos</h2>
            <p className="text-sm text-slate-500">Reportes y cruce de variables del observatorio</p>
          </div>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-md transition-colors">
            <Download className="w-4 h-4" /> Excel
          </button>
          <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold shadow-md transition-colors">
            <Download className="w-4 h-4" /> PDF
          </button>
        </div>
      </div>

      {/* Selector de Fechas */}
      <div className="flex flex-col gap-4 px-0 pt-4 pb-0 md:p-4 bg-transparent md:bg-white md:dark:bg-[#09090b] border-0 md:border md:border-slate-200 md:dark:border-slate-800 rounded-none md:rounded-2xl shadow-none md:shadow-sm ">
        <div className="flex bg-slate-100 dark:bg-slate-900 p-0 md:p-1 rounded-lg md:rounded-xl w-full">
          {["Todo", "Mes", "Rango"].map((mode) => (
            <button
              key={mode}
              onClick={() => setDateMode(mode as any)}
              className={`flex-1 p-0 py-2 md:px-6 md:py-2 rounded-lg text-xs md:text-sm font-bold transition-all ${
                dateMode === mode
                  ? "bg-white dark:bg-[#09090b] text-blue-600 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              {mode}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {dateMode === "Mes" && (
            <motion.div
              key="mes"
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              className="flex items-center w-full"
            >
              <div className="relative w-full md:w-auto flex items-center">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none z-10" />
                {!singleMonth && (
                  <span className="absolute left-9 md:left-10 text-slate-400 text-xs md:text-sm font-bold pointer-events-none z-10">
                    Seleccionar Mes
                  </span>
                )}
                <input
                  type="month"
                  value={singleMonth}
                  onChange={(e) => setSingleMonth(e.target.value)}
                  className={`w-full md:w-auto pl-9 pr-2 py-1.5 md:pl-10 md:pr-4 md:py-3 rounded-lg md:rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs md:text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer ${singleMonth ? "text-slate-700 dark:text-slate-300" : "text-transparent"}`}
                />
              </div>
            </motion.div>
          )}

          {dateMode === "Rango" && (
            <motion.div
              key="rango"
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              className="flex flex-row items-center gap-2 md:gap-3 w-full"
            >
              <div className="relative flex-1 md:flex-none flex items-center min-w-0">
                <Calendar className="w-3 h-3 md:w-4 md:h-4 text-slate-400 absolute left-2 md:left-3 pointer-events-none z-10" />
                {!startMonth && (
                  <span className="absolute left-6 md:left-10 text-slate-400 text-[10px] md:text-sm font-bold pointer-events-none z-10 truncate">
                    Mes Inicio
                  </span>
                )}
                <input
                  type="month"
                  value={startMonth}
                  onChange={(e) => setStartMonth(e.target.value)}
                  className={`w-full min-w-0 pl-6 md:pl-10 pr-0 md:pr-4 py-1.5 md:py-3 rounded-lg md:rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-[10px] md:text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer ${startMonth ? "text-slate-700 dark:text-slate-300" : "text-transparent"}`}
                />
              </div>
              <span className="text-[10px] md:text-sm font-bold text-slate-400 text-center shrink-0">al</span>
              <div className="relative flex-1 md:flex-none flex items-center min-w-0">
                <Calendar className="w-3 h-3 md:w-4 md:h-4 text-slate-400 absolute left-2 md:left-3 pointer-events-none z-10" />
                {!endMonth && (
                  <span className="absolute left-6 md:left-10 text-slate-400 text-[10px] md:text-sm font-bold pointer-events-none z-10 truncate">
                    Mes Final
                  </span>
                )}
                <input
                  type="month"
                  value={endMonth}
                  onChange={(e) => setEndMonth(e.target.value)}
                  className={`w-full min-w-0 pl-6 md:pl-10 pr-0 md:pr-4 py-1.5 md:py-3 rounded-lg md:rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-[10px] md:text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer ${endMonth ? "text-slate-700 dark:text-slate-300" : "text-transparent"}`}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Selector de Sector y Gráfica de Dona */}
      <div className="bg-transparent md:bg-white md:dark:bg-[#09090b] rounded-none md:rounded-3xl border-0 md:border md:border-slate-200 md:dark:border-slate-800 shadow-none md:shadow-sm px-0 pt-4 pb-0 md:p-6 xl:p-8">
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-4 md:mb-8 gap-2 md:gap-4 border-b border-slate-100 dark:border-slate-800 pb-2 md:pb-6">
          <div>
            <h3 className="text-lg md:text-xl font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <PieChartIcon className="w-4 h-4 md:w-5 md:h-5 text-blue-500" /> Desglose Demográfico por Sector
            </h3>
            <p className="text-xs md:text-sm text-slate-500 mt-1">Seleccione un sector para visualizar el desglose total de atenciones (simulado como 100% llenado).</p>
          </div>
          <div className="grid grid-cols-2 gap-x-2 gap-y-5 w-full md:w-auto mt-2 md:mt-0">
            {Object.keys(sectorData).map((sector) => (
              <button
                key={sector}
                onClick={() => setSelectedSector(sector)}
                className={`p-0 py-2 md:px-4 md:py-2.5 rounded-lg md:rounded-xl font-semibold transition-all shadow-sm flex items-center justify-center text-center leading-tight ${
                  selectedSector === sector
                    ? "bg-blue-600 text-white ring-2 ring-blue-600 ring-offset-2 dark:ring-offset-[#09090b]"
                    : "bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <span className="text-sm md:text-base">{sector}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-8 items-center">
          <div className="h-[250px] md:h-[350px] w-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedSector}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
                className="h-full w-full"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={sectorData[selectedSector]}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {sectorData[selectedSector].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: any) => new Intl.NumberFormat('es-GT').format(Number(value))}
                      contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', color: '#0f172a', fontWeight: 'bold' }} 
                    />
                  </PieChart>
                </ResponsiveContainer>
              </motion.div>
            </AnimatePresence>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4">
            {sectorData[selectedSector].map((item, index) => (
              <div key={index} className="flex items-center justify-between p-2 md:p-4 rounded-lg md:rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="w-3 h-3 md:w-4 md:h-4 rounded-full shadow-sm" style={{ backgroundColor: item.color }} />
                  <span className="text-xs md:text-sm font-semibold text-slate-700 dark:text-slate-300">{item.name}</span>
                </div>
                <span className="text-sm md:text-base font-black text-slate-900 dark:text-white font-mono">
                  {new Intl.NumberFormat('es-GT').format(item.value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-6">
        {/* Gráfica de Barras 1 */}
        <div className="bg-transparent md:bg-white md:dark:bg-[#09090b] rounded-none md:rounded-3xl border-0 md:border md:border-slate-200 md:dark:border-slate-800 shadow-none md:shadow-sm px-0 py-4 md:p-6 xl:p-8">
          <h3 className="text-lg font-bold mb-4 md:mb-6 text-slate-800 dark:text-slate-200">Atenciones Mensuales por Demografía</h3>
          <div className="h-[250px] md:h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockDataDemografia}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#64748b" opacity={0.15} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} dy={5} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} dx={-5} />
                <Tooltip cursor={{ fill: "rgba(100,116,139,0.05)" }} contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', color: '#0f172a' }} />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '10px', fontSize: '10px' }} />
                <Bar dataKey="hombres" name="Hombres" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="mujeres" name="Mujeres" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="ninos" name="Niños/as" fill="#14b8a6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfica de Barras 2 */}
        <div className="bg-transparent md:bg-white md:dark:bg-[#09090b] rounded-none md:rounded-3xl border-0 md:border md:border-slate-200 md:dark:border-slate-800 shadow-none md:shadow-sm px-0 py-4 md:p-6 xl:p-8">
          <h3 className="text-lg font-bold mb-4 md:mb-6 text-slate-800 dark:text-slate-200">Atenciones Totales en Sector Protección</h3>
          <div className="h-[400px] md:h-[500px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockDataProteccion} layout="vertical" margin={{ left: 0, right: 20, top: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#64748b" opacity={0.15} />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis dataKey="org" type="category" axisLine={false} tickLine={false} tick={false} width={10} />
                <Tooltip cursor={{ fill: "rgba(100,116,139,0.05)" }} contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', color: '#0f172a' }} />
                <Bar dataKey="atenciones" name="Personas Atendidas" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={24}>
                  <LabelList dataKey="org" content={<CustomBarLabel />} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white dark:bg-[#09090b] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-6 xl:p-8 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">Resumen General por Organización</h3>
          <p className="text-sm text-slate-500 mt-1">Desglose de atenciones en todos los sectores participantes.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-6 xl:px-8 py-5">Sector</th>
                <th className="px-6 xl:px-8 py-5">Organización</th>
                <th className="px-6 xl:px-8 py-5 text-right">Personas Atendidas</th>
                <th className="px-6 xl:px-8 py-5 text-right">Unidades Familiares</th>
              </tr>
            </thead>
            <tbody>
              {mockTableData.map((row, i) => (
                <tr key={i} className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors last:border-0">
                  <td className="px-6 xl:px-8 py-5 font-semibold text-slate-700 dark:text-slate-300">{row.sector}</td>
                  <td className="px-6 xl:px-8 py-5 text-slate-600 dark:text-slate-400">{row.org}</td>
                  <td className="px-6 xl:px-8 py-5 text-right font-mono font-medium text-slate-700 dark:text-slate-300">{row.total}</td>
                  <td className="px-6 xl:px-8 py-5 text-right font-mono font-medium text-slate-700 dark:text-slate-300">{row.familias}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}
