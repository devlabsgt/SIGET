"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Loader2, Search } from "lucide-react";
import { toast } from "react-toastify";
import { cn } from "@/lib/utils";
import { modalActionMessage } from "@/components/ui/modal-toast";
import { useBuscarParticipante, useRegistrarAsistencia } from "./lib/hooks";
import {
  DEPARTAMENTOS_GT,
  getMunicipiosPorDepartamento,
} from "./lib/guatemala-locations";
import {
  normalizarDpiInput,
  registroAsistenciaSchema,
  type ActividadRecord,
  type ParticipanteRecord,
} from "./lib/zod";

const selectClass =
  "flex h-10 w-full rounded-lg border-2 border-celeste-trifinio bg-transparent px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-celeste-trifinio/30";

const inputClass =
  "flex h-10 w-full rounded-lg border-2 border-celeste-trifinio bg-transparent px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-celeste-trifinio/30";

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="text-sm font-semibold leading-none text-foreground/70">
      {children}
    </label>
  );
}

function aplicarParticipante(
  p: ParticipanteRecord,
  setters: {
    setNombre: (v: string) => void;
    setFechaNacimiento: (v: string) => void;
    setGenero: (v: "masculino" | "femenino" | "") => void;
    setDepartamento: (v: string) => void;
    setMunicipio: (v: string) => void;
    setEsTrifinio: (v: boolean | null) => void;
    setPuesto: (v: string) => void;
    setDireccionAdministrativa: (v: string) => void;
  },
) {
  setters.setNombre(p.nombre);
  setters.setFechaNacimiento(p.fecha_nacimiento);
  setters.setGenero(p.genero);
  setters.setDepartamento(p.departamento);
  setters.setMunicipio(p.municipio);
  setters.setEsTrifinio(p.es_trifinio);
  setters.setPuesto(p.puesto ?? "");
  setters.setDireccionAdministrativa(p.direccion_administrativa ?? "");
}

function limpiarDatosPersonales(setters: {
  setNombre: (v: string) => void;
  setFechaNacimiento: (v: string) => void;
  setGenero: (v: "masculino" | "femenino" | "") => void;
  setDepartamento: (v: string) => void;
  setMunicipio: (v: string) => void;
  setEsTrifinio: (v: boolean | null) => void;
  setPuesto: (v: string) => void;
  setDireccionAdministrativa: (v: string) => void;
}) {
  setters.setNombre("");
  setters.setFechaNacimiento("");
  setters.setGenero("");
  setters.setDepartamento("");
  setters.setMunicipio("");
  setters.setEsTrifinio(null);
  setters.setPuesto("");
  setters.setDireccionAdministrativa("");
}

export function RegistroPublico({ actividad }: { actividad: ActividadRecord }) {
  const buscar = useBuscarParticipante();
  const registrar = useRegistrarAsistencia();

  const [paso, setPaso] = useState<"dpi" | "formulario">("dpi");
  const [enviado, setEnviado] = useState(false);
  const [dpi, setDpi] = useState("");
  const [participanteEncontrado, setParticipanteEncontrado] = useState(false);

  const [nombre, setNombre] = useState("");
  const [puesto, setPuesto] = useState("");
  const [direccionAdministrativa, setDireccionAdministrativa] = useState("");
  const [fechaNacimiento, setFechaNacimiento] = useState("");
  const [genero, setGenero] = useState<"masculino" | "femenino" | "">("");
  const [departamento, setDepartamento] = useState("");
  const [municipio, setMunicipio] = useState("");
  const [esTrifinio, setEsTrifinio] = useState<boolean | null>(null);

  const setters = {
    setNombre,
    setFechaNacimiento,
    setGenero,
    setDepartamento,
    setMunicipio,
    setEsTrifinio,
    setPuesto,
    setDireccionAdministrativa,
  };

  const municipios = useMemo(
    () => getMunicipiosPorDepartamento(departamento),
    [departamento],
  );

  const dpiCompleto = dpi.length === 13;

  const handleDpiChange = (value: string) => {
    setDpi(normalizarDpiInput(value));
  };

  const handleDepartamento = (value: string) => {
    setDepartamento(value);
    setMunicipio("");
  };

  const handleEsTrifinio = (value: boolean) => {
    setEsTrifinio(value);
    if (!value) {
      setPuesto("");
      setDireccionAdministrativa("");
    }
  };

  const handleBuscarDpi = async () => {
    if (!dpiCompleto) {
      toast.warn("Ingresa un DPI válido de 13 dígitos.");
      return;
    }
    const participante = await buscar.mutateAsync(dpi);
    limpiarDatosPersonales(setters);
    if (participante) {
      aplicarParticipante(participante, setters);
      setParticipanteEncontrado(true);
      toast.success("Participante encontrado. Revisa tus datos.");
    } else {
      setParticipanteEncontrado(false);
      toast.info("DPI no registrado. Completa tus datos.");
    }
    setPaso("formulario");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (esTrifinio === null) {
      toast.warn("Indica si eres parte de Trifinio.");
      return;
    }
    const parsed = registroAsistenciaSchema.safeParse({
      actividad_id: actividad.id,
      dpi,
      nombre,
      puesto,
      direccion_administrativa: direccionAdministrativa,
      fecha_nacimiento: fechaNacimiento,
      genero,
      departamento,
      municipio,
      es_trifinio: esTrifinio,
    });
    if (!parsed.success) {
      toast.warn("Revisa los datos del formulario.");
      return;
    }
    const res = await registrar.mutateAsync(parsed.data);
    if (res.success) {
      setEnviado(true);
      toast.success("Asistencia registrada correctamente.");
    } else {
      toast.error(
        modalActionMessage(
          res.error ?? undefined,
          "No se pudo registrar la asistencia.",
        ),
      );
    }
  };

  if (enviado) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 py-16 text-center">
        <CheckCircle2 className="mb-4 size-16 text-emerald-500" />
        <h1 className="text-2xl font-black text-foreground">
          ¡Registro exitoso!
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Tu asistencia a «{actividad.nombre}» ha sido registrada.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-lg px-4 py-8 sm:px-6">
      <div className="mb-8 text-center">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
          Plan Trifinio · SIGET
        </p>
        <h1 className="mt-1 text-2xl font-black text-foreground">
          Registro de asistencia
        </h1>
        <p className="mt-2 text-sm font-semibold text-azul-trifinio">
          {actividad.nombre}
        </p>
        {actividad.descripcion && (
          <p className="mt-1 text-sm text-muted-foreground">
            {actividad.descripcion}
          </p>
        )}
      </div>

      <AnimatePresence mode="wait">
        {paso === "dpi" ? (
          <motion.div
            key="dpi"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
            className="space-y-4 rounded-2xl bg-zinc-50 p-5 dark:bg-zinc-800/60"
          >
            <div className="space-y-2">
              <FieldLabel>DPI</FieldLabel>
              <input
                type="text"
                inputMode="numeric"
                value={dpi}
                onChange={(e) => handleDpiChange(e.target.value)}
                className={inputClass}
                maxLength={13}
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                {dpi.length}/13 dígitos
              </p>
            </div>
            <button
              type="button"
              onClick={handleBuscarDpi}
              disabled={!dpiCompleto || buscar.isPending}
              className="inline-flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border-0 bg-azul-trifinio text-[10px] font-bold uppercase tracking-widest text-white transition-opacity hover:opacity-90 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {buscar.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Buscando…
                </>
              ) : (
                <>
                  <Search className="size-4" />
                  Continuar
                </>
              )}
            </button>
          </motion.div>
        ) : (
          <motion.form
            key="formulario"
            onSubmit={handleSubmit}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
            className="space-y-4 rounded-2xl bg-zinc-50 p-5 dark:bg-zinc-800/60"
          >
            <div className="flex items-center justify-between gap-2 rounded-xl bg-sky-50 px-3 py-2 dark:bg-sky-950/40">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  DPI
                </p>
                <p className="font-mono text-sm font-bold tabular-nums">{dpi}</p>
              </div>
              <button
                type="button"
                onClick={() => setPaso("dpi")}
                className="cursor-pointer text-xs font-bold text-azul-trifinio hover:underline"
              >
                Cambiar
              </button>
            </div>

            {participanteEncontrado && (
              <p className="rounded-lg bg-emerald-100 px-3 py-2 text-xs font-semibold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
                Datos cargados desde registros anteriores. Puedes actualizarlos.
              </p>
            )}

            <div className="space-y-2">
              <FieldLabel>Nombre completo</FieldLabel>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className={inputClass}
                required
              />
            </div>

            <div className="space-y-2">
              <FieldLabel>¿Es parte de Trifinio?</FieldLabel>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: true, label: "Sí" },
                  { value: false, label: "No" },
                ].map((opt) => (
                  <button
                    key={String(opt.value)}
                    type="button"
                    onClick={() => handleEsTrifinio(opt.value)}
                    className={cn(
                      "h-10 cursor-pointer rounded-lg border-2 text-sm font-bold transition-colors",
                      esTrifinio === opt.value
                        ? "border-celeste-trifinio bg-celeste-trifinio/10 text-foreground"
                        : "border-celeste-trifinio/40 bg-transparent text-muted-foreground hover:border-celeste-trifinio",
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <AnimatePresence initial={false}>
              {esTrifinio === true && (
                <motion.div
                  key="trifinio-campos"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
                  className="space-y-4 overflow-hidden"
                >
                  <div className="space-y-2">
                    <FieldLabel>Puesto (opcional)</FieldLabel>
                    <input
                      type="text"
                      value={puesto}
                      onChange={(e) => setPuesto(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div className="space-y-2">
                    <FieldLabel>Dirección administrativa (opcional)</FieldLabel>
                    <input
                      type="text"
                      value={direccionAdministrativa}
                      onChange={(e) => setDireccionAdministrativa(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-2">
              <FieldLabel>Fecha de nacimiento</FieldLabel>
              <input
                type="date"
                value={fechaNacimiento}
                onChange={(e) => setFechaNacimiento(e.target.value)}
                className={inputClass}
                required
              />
            </div>

            <div className="space-y-2">
              <FieldLabel>Género</FieldLabel>
              <div className="grid grid-cols-2 gap-2">
                {(["masculino", "femenino"] as const).map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGenero(g)}
                    className={cn(
                      "h-10 cursor-pointer rounded-lg border-2 text-sm font-bold capitalize transition-colors",
                      genero === g
                        ? "border-celeste-trifinio bg-celeste-trifinio/10 text-foreground"
                        : "border-celeste-trifinio/40 bg-transparent text-muted-foreground hover:border-celeste-trifinio",
                    )}
                  >
                    {g === "masculino" ? "Masculino" : "Femenino"}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <FieldLabel>Departamento</FieldLabel>
              <select
                value={departamento}
                onChange={(e) => handleDepartamento(e.target.value)}
                className={selectClass}
                required
              >
                <option value="" disabled>
                  Seleccione…
                </option>
                {DEPARTAMENTOS_GT.map((d) => (
                  <option key={d.codigo} value={d.nombre}>
                    {d.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <FieldLabel>Municipio</FieldLabel>
              <select
                value={municipio}
                onChange={(e) => setMunicipio(e.target.value)}
                className={selectClass}
                required
                disabled={!departamento}
              >
                <option value="" disabled>
                  {departamento ? "Seleccione…" : "Primero elija departamento"}
                </option>
                {municipios.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={registrar.isPending || !genero || esTrifinio === null}
              className="inline-flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border-0 bg-emerald-200 text-[10px] font-bold uppercase tracking-widest text-emerald-900 transition-colors hover:bg-emerald-300 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-emerald-800/70 dark:text-emerald-50 dark:hover:bg-emerald-700/80"
            >
              {registrar.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Enviando…
                </>
              ) : (
                "Registrar asistencia"
              )}
            </button>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
