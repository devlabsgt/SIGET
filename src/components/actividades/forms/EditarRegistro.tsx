"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import { cn } from "@/lib/utils";
import {
  ModalShell,
  ModalInput,
  ModalLabel,
  ModalSubmit,
  ModalFooter,
} from "@/components/ui/general-modal";
import { actionErrorMessage } from "@/components/ui/modal-toast";
import { BusquedaSelect } from "../BusquedaSelect";
import { useEditarRegistro } from "../lib/hooks";
import {
  DEPARTAMENTOS_GT,
  getMunicipiosPorDepartamento,
} from "../lib/guatemala-locations";
import {
  institucionDesdeRegistro,
  normalizarDpiInput,
  normalizarFechaInput,
  normalizarTelefonoInput,
  registroEditSchema,
  type RegistroAsistenciaRecord,
  type TipoInstitucion,
} from "../lib/zod";

export function EditarRegistro({
  open,
  registro,
  actividadId,
  onClose,
}: {
  open: boolean;
  registro: RegistroAsistenciaRecord | null;
  actividadId: string;
  onClose: () => void;
}) {
  const editar = useEditarRegistro(actividadId);

  const [dpi, setDpi] = useState("");
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [puesto, setPuesto] = useState("");
  const [direccionAdministrativa, setDireccionAdministrativa] = useState("");
  const [fechaNacimiento, setFechaNacimiento] = useState("");
  const [genero, setGenero] = useState<"masculino" | "femenino" | "">("");
  const [departamento, setDepartamento] = useState("");
  const [municipio, setMunicipio] = useState("");
  const [esTrifinio, setEsTrifinio] = useState<boolean | null>(null);
  const [tipoInstitucion, setTipoInstitucion] = useState<TipoInstitucion>("sin");
  const [institucionOtra, setInstitucionOtra] = useState("");

  const municipios = useMemo(
    () => getMunicipiosPorDepartamento(departamento),
    [departamento],
  );

  const departamentosOpciones = useMemo(
    () => DEPARTAMENTOS_GT.map((d) => d.nombre),
    [],
  );

  useEffect(() => {
    if (!registro) return;
    setDpi(registro.dpi);
    setNombre(registro.nombre);
    setEmail(registro.email ?? "");
    setTelefono(registro.telefono ?? "");
    setPuesto(registro.puesto ?? "");
    setDireccionAdministrativa(registro.direccion_administrativa ?? "");
    setFechaNacimiento(normalizarFechaInput(registro.fecha_nacimiento));
    setGenero(registro.genero);
    setDepartamento(registro.departamento);
    setMunicipio(registro.municipio);
    setEsTrifinio(registro.es_trifinio);
    const { tipo, otra } = institucionDesdeRegistro(
      registro.institucion,
      registro.es_trifinio,
    );
    setTipoInstitucion(tipo);
    setInstitucionOtra(otra);
  }, [registro]);

  const handleClose = () => {
    if (editar.isPending) return;
    onClose();
  };

  const handleEsTrifinio = (value: boolean) => {
    setEsTrifinio(value);
    if (value) {
      setTipoInstitucion("sin");
      setInstitucionOtra("");
    } else {
      setDireccionAdministrativa("");
      setTipoInstitucion("sin");
      setInstitucionOtra("");
    }
  };

  const handleTipoInstitucion = (value: TipoInstitucion) => {
    setTipoInstitucion(value);
    if (value !== "otras") setInstitucionOtra("");
  };

  const handleDepartamento = (value: string) => {
    setDepartamento(value);
    setMunicipio("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registro || esTrifinio === null) {
      toast.warn("Indica si es parte de Trifinio.");
      return;
    }

    const parsed = registroEditSchema.safeParse({
      id: registro.id,
      actividad_id: actividadId,
      dpi,
      nombre,
      email,
      telefono,
      puesto,
      direccion_administrativa: direccionAdministrativa,
      tipo_institucion: tipoInstitucion,
      institucion_otra: institucionOtra,
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

    const res = await editar.mutateAsync(parsed.data);
    if (res.success) {
      toast.success("Registro actualizado.");
      onClose();
    } else {
      toast.error(
        actionErrorMessage(res, "No se pudo actualizar el registro."),
        { autoClose: res.detail ? 8000 : 3000 },
      );
    }
  };

  return (
    <ModalShell
      open={open}
      onClose={handleClose}
      title="Editar registro"
      subtitle="Asistencia"
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <ModalLabel htmlFor="edit-dpi">DPI</ModalLabel>
          <ModalInput
            id="edit-dpi"
            inputMode="numeric"
            value={dpi}
            onChange={(e) => setDpi(normalizarDpiInput(e.target.value))}
            maxLength={13}
            required
          />
        </div>

        <div className="space-y-2">
          <ModalLabel htmlFor="edit-nombre">Nombre completo</ModalLabel>
          <ModalInput
            id="edit-nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <ModalLabel htmlFor="edit-email">Correo electrónico (opcional)</ModalLabel>
          <ModalInput
            id="edit-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <ModalLabel htmlFor="edit-telefono">Teléfono (opcional)</ModalLabel>
          <ModalInput
            id="edit-telefono"
            type="tel"
            inputMode="numeric"
            value={telefono}
            onChange={(e) => setTelefono(normalizarTelefonoInput(e.target.value))}
            maxLength={8}
          />
          <p className="text-xs text-muted-foreground">
            8 dígitos · se agrega +502 al contactar por WhatsApp
          </p>
        </div>

        <div className="space-y-2">
          <ModalLabel>¿Es parte de Trifinio?</ModalLabel>
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
              key="trifinio"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
              className="space-y-4 overflow-hidden"
            >
              <div className="space-y-2">
                <ModalLabel htmlFor="edit-puesto">Puesto (opcional)</ModalLabel>
                <ModalInput
                  id="edit-puesto"
                  value={puesto}
                  onChange={(e) => setPuesto(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <ModalLabel htmlFor="edit-dir">Dirección administrativa (opcional)</ModalLabel>
                <ModalInput
                  id="edit-dir"
                  value={direccionAdministrativa}
                  onChange={(e) => setDireccionAdministrativa(e.target.value)}
                />
              </div>
            </motion.div>
          )}

          {esTrifinio === false && (
            <motion.div
              key="externo"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
              className="space-y-4 overflow-hidden"
            >
              <div className="space-y-2">
                <ModalLabel htmlFor="edit-institucion">Institución</ModalLabel>
                <select
                  id="edit-institucion"
                  value={tipoInstitucion}
                  onChange={(e) =>
                    handleTipoInstitucion(e.target.value as TipoInstitucion)
                  }
                  className="flex h-10 w-full rounded-lg border-2 border-celeste-trifinio bg-transparent px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-celeste-trifinio/30"
                >
                  <option value="sin">Sin Institución</option>
                  <option value="plan_trifinio">Plan Trifinio</option>
                  <option value="otras">Otras Instituciones</option>
                </select>
              </div>

              {tipoInstitucion === "otras" && (
                <div className="space-y-2">
                  <ModalLabel htmlFor="edit-institucion-otra">
                    Nombre de la institución
                  </ModalLabel>
                  <ModalInput
                    id="edit-institucion-otra"
                    value={institucionOtra}
                    onChange={(e) => setInstitucionOtra(e.target.value)}
                    required
                  />
                </div>
              )}

              <div className="space-y-2">
                <ModalLabel htmlFor="edit-puesto-ext">Puesto (opcional)</ModalLabel>
                <ModalInput
                  id="edit-puesto-ext"
                  value={puesto}
                  onChange={(e) => setPuesto(e.target.value)}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="space-y-2">
          <ModalLabel htmlFor="edit-fecha-nac">Fecha de nacimiento</ModalLabel>
          <ModalInput
            id="edit-fecha-nac"
            type="date"
            value={fechaNacimiento}
            onChange={(e) => setFechaNacimiento(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <ModalLabel>Género</ModalLabel>
          <div className="grid grid-cols-2 gap-2">
            {(["masculino", "femenino"] as const).map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setGenero(g)}
                className={cn(
                  "h-10 cursor-pointer rounded-lg border-2 text-sm font-bold transition-colors",
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
          <ModalLabel>Departamento</ModalLabel>
          <BusquedaSelect
            value={departamento}
            onChange={handleDepartamento}
            options={departamentosOpciones}
            placeholder="Buscar departamento…"
          />
        </div>

        <div className="space-y-2">
          <ModalLabel>Municipio</ModalLabel>
          <BusquedaSelect
            value={municipio}
            onChange={setMunicipio}
            options={municipios}
            placeholder={
              departamento ? "Buscar municipio…" : "Primero elija departamento"
            }
            disabled={!departamento}
            emptyMessage={
              departamento
                ? "Sin municipios coincidentes"
                : "Seleccione un departamento"
            }
          />
        </div>

        <ModalFooter>
          <button
            type="button"
            onClick={handleClose}
            disabled={editar.isPending}
            className="inline-flex h-11 cursor-pointer items-center justify-center rounded-xl border-0 bg-zinc-200 px-6 text-[10px] font-bold uppercase tracking-widest text-zinc-700 transition-colors hover:bg-zinc-300 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-600"
          >
            Cancelar
          </button>
          <ModalSubmit disabled={editar.isPending || !genero || esTrifinio === null}>
            {editar.isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Guardando…
              </>
            ) : (
              "Guardar cambios"
            )}
          </ModalSubmit>
        </ModalFooter>
      </form>
    </ModalShell>
  );
}
