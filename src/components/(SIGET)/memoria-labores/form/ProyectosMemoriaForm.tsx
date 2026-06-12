"use client";

import {
  useState,
  useTransition,
  useRef,
  useLayoutEffect,
  useCallback,
} from "react";
import {
  ArrowRight,
  ChevronLeft,
  Loader2,
  Minus,
  Plus,
  Save,
  Trash2,
  Users,
  CalendarDays,
  TrendingUp,
  ListChecks,
  Sparkles,
} from "lucide-react";
import Swal from "sweetalert2";
import { cn } from "@/lib/utils";
import {
  createProyectoMemoria,
  updateProyectoMemoria,
} from "../lib/actions";
import { proyectosMemoriaSchema } from "../lib/schemas";
import {
  emptyProyectoAvance,
  emptyProyectoItem,
  emptyProyectoMemoria,
  normalizeProyectosFromDb,
  type Beneficiarios,
  type ProyectoAvance,
  type ProyectoItem,
  type ProyectosMemoria,
  type ProyectosMemoriaInput,
} from "../lib/types";

interface ProyectosMemoriaFormProps {
  initial?: ProyectosMemoria | null;
  onBack?: () => void;
  onSaved: () => void;
  variant?: "admin" | "public";
  onCreatePublic?: (
    input: ProyectosMemoriaInput,
  ) => Promise<{ success: true }>;
  onReview?: (input: ProyectosMemoriaInput) => void;
  restoreDraft?: ProyectosMemoriaInput | null;
}

type ProyectoListaKey = "resultados" | "efectos";

const sectionTitleClass =
  "flex items-center gap-2 bg-azul-trifinio text-white px-4 py-2.5 rounded-t-xl text-sm font-bold tracking-tight";

const formSectionClass =
  "rounded-xl border border-border bg-card shadow-sm dark:border-zinc-700/90 dark:bg-zinc-900/90";

const formInputClass =
  "h-10 w-full rounded-lg border border-border bg-zinc-50 px-3 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground/70 focus-visible:ring-2 focus-visible:ring-celeste-trifinio dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:[color-scheme:dark]";

const formTextareaClass =
  "w-full rounded-lg border border-border bg-zinc-50 px-3 py-2 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground/70 focus-visible:ring-2 focus-visible:ring-celeste-trifinio resize-none overflow-hidden dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500";

const formLabelClass =
  "text-[11px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-300";

const sectionAddButtonBase =
  "flex items-center gap-2 text-xs font-bold hover:underline cursor-pointer";

const sectionAddButtonColor = {
  avance: "text-amber-600 dark:text-amber-400",
  resultado: "text-violet-600 dark:text-violet-400",
  efecto: "text-emerald-600 dark:text-emerald-400",
  proyecto: "text-azul-trifinio dark:text-azul-trifinio/90",
  beneficiarios: "text-sky-600 dark:text-sky-400",
} as const;

type ProyectoSeccionKey = keyof typeof sectionAddButtonColor;

const proyectoSeccionShell =
  "rounded-xl border border-border bg-card p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-900/80";

const proyectoSeccionShellCompact =
  "border-t border-border pt-3 dark:border-zinc-700 sm:rounded-xl sm:border sm:border-border sm:bg-card sm:p-4 sm:shadow-sm sm:pt-4 dark:sm:border-zinc-700 dark:sm:bg-zinc-900/80";

const formSectionBodyClass = (isPublic: boolean) =>
  isPublic ? "p-3 sm:p-4" : "p-4";

const proyectosListBodyClass = (isPublic: boolean) =>
  isPublic ? "space-y-4 p-2 sm:space-y-5 sm:p-4" : "space-y-5 p-4";

const proyectoCardClass = (isPublic: boolean) =>
  cn(
    "space-y-3 sm:space-y-4",
    isPublic
      ? "border-b border-border pb-4 last:border-b-0 last:pb-0 dark:border-zinc-700 sm:rounded-xl sm:border sm:p-4 sm:bg-muted/20 dark:sm:bg-zinc-950/50"
      : "rounded-xl border border-border p-4 bg-muted/20 dark:border-zinc-700 dark:bg-zinc-950/50",
  );

const nestedItemShellClass = (compact: boolean) =>
  cn(
    "space-y-2",
    compact
      ? "border-t border-border py-3 first:border-t-0 first:pt-0 dark:border-zinc-700 sm:rounded-lg sm:border sm:border-border/80 sm:bg-muted/30 sm:p-3 sm:first:border-t dark:sm:border-zinc-800 dark:sm:bg-zinc-950/60"
      : "rounded-lg border border-border/80 bg-muted/30 p-3 dark:border-zinc-800 dark:bg-zinc-950/60",
  );

function SectionRemoveButton({
  label,
  onClick,
  className,
}: {
  label: string;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        sectionAddButtonBase,
        "text-red-600 dark:text-red-400",
        className,
      )}
    >
      <Minus className="w-4 h-4" />
      {label}
    </button>
  );
}

const Field = ({
  className,
  value,
  onChange,
  rows = 2,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => {
  const ref = useRef<HTMLTextAreaElement>(null);

  const resize = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, []);

  useLayoutEffect(() => {
    resize();
  }, [value, resize]);

  return (
    <textarea
      ref={ref}
      rows={rows}
      value={value}
      onChange={(e) => {
        onChange?.(e);
        requestAnimationFrame(resize);
      }}
      className={cn(formTextareaClass, className)}
      {...props}
    />
  );
};

const TextInput = ({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input {...props} className={cn(formInputClass, className)} />
);

const Label = ({
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) => (
  <label {...props} className={cn(formLabelClass, className)} />
);

const FieldHint = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <p
    className={cn(
      "text-[11px] leading-relaxed text-muted-foreground dark:text-zinc-500",
      className,
    )}
  >
    {children}
  </p>
);

const NumericInput = ({
  className,
  value,
  onValueChange,
  ...props
}: Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> & {
  value: number;
  onValueChange: (value: number) => void;
}) => (
  <input
    {...props}
    type="tel"
    inputMode="numeric"
    pattern="[0-9]*"
    autoComplete="off"
    value={value === 0 ? "" : String(value)}
    onChange={(e) => {
      const digits = e.target.value.replace(/\D/g, "");
      onValueChange(digits === "" ? 0 : parseInt(digits, 10));
    }}
    className={cn(formInputClass, className)}
  />
);

function ProyectoSubseccion({
  seccion,
  title,
  icon,
  children,
  compact = false,
}: {
  seccion: ProyectoSeccionKey;
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <div className={compact ? proyectoSeccionShellCompact : proyectoSeccionShell}>
      <p
        className={cn(
          "flex items-center gap-2 text-sm font-bold border-b border-border dark:border-zinc-700",
          compact ? "mb-3 pb-2 sm:mb-4 sm:pb-3" : "mb-4 pb-3",
          sectionAddButtonColor[seccion],
        )}
      >
        {icon}
        {title}
      </p>
      <div className={cn("space-y-3", compact && "space-y-0 sm:space-y-3")}>
        {children}
      </div>
    </div>
  );
}

function SectionAddButton({
  label,
  color,
  onClick,
}: {
  label: string;
  color: ProyectoSeccionKey;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(sectionAddButtonBase, sectionAddButtonColor[color])}
    >
      <Plus className="w-4 h-4" />
      {label}
    </button>
  );
}

export default function ProyectosMemoriaForm({
  initial = null,
  onBack,
  onSaved,
  variant = "admin",
  onCreatePublic,
  onReview,
  restoreDraft = null,
}: ProyectosMemoriaFormProps) {
  const [form, setForm] = useState<ProyectosMemoriaInput>(() => {
    if (restoreDraft) return restoreDraft;
    if (!initial) return emptyProyectoMemoria();
    const proyectos = normalizeProyectosFromDb(
      initial.proyectos,
      initial.beneficiarios,
    );
    return {
      cargo: initial.cargo ?? "",
      nombre: initial.nombre ?? "",
      oficina: initial.oficina ?? "",
      proyectos: proyectos.length ? proyectos : [emptyProyectoItem()],
    };
  });
  const [isPending, startTransition] = useTransition();

  const isPublic = variant === "public";
  const isEdit = Boolean(initial) && !isPublic;

  const updateProyecto = (
    index: number,
    field: "nombre" | "mes" | "descripcion",
    value: string,
  ) => {
    setForm((prev) => ({
      ...prev,
      proyectos: prev.proyectos.map((p, i) =>
        i === index ? { ...p, [field]: value } : p,
      ),
    }));
  };

  const updateProyectoLista = (
    proyectoIndex: number,
    key: ProyectoListaKey,
    listaIndex: number,
    value: string,
  ) => {
    setForm((prev) => ({
      ...prev,
      proyectos: prev.proyectos.map((p, i) =>
        i === proyectoIndex
          ? {
              ...p,
              [key]: p[key].map((v, j) => (j === listaIndex ? value : v)),
            }
          : p,
      ),
    }));
  };

  const addProyectoListaItem = (
    proyectoIndex: number,
    key: ProyectoListaKey,
  ) => {
    setForm((prev) => ({
      ...prev,
      proyectos: prev.proyectos.map((p, i) =>
        i === proyectoIndex ? { ...p, [key]: [...p[key], ""] } : p,
      ),
    }));
  };

  const removeProyectoListaItem = (
    proyectoIndex: number,
    key: ProyectoListaKey,
    listaIndex: number,
  ) => {
    setForm((prev) => ({
      ...prev,
      proyectos: prev.proyectos.map((p, i) =>
        i === proyectoIndex
          ? {
              ...p,
              [key]:
                p[key].length > 1
                  ? p[key].filter((_, j) => j !== listaIndex)
                  : p[key],
            }
          : p,
      ),
    }));
  };

  const updateProyectoAvance = (
    proyectoIndex: number,
    avanceIndex: number,
    field: keyof ProyectoAvance,
    value: string | number,
  ) => {
    setForm((prev) => ({
      ...prev,
      proyectos: prev.proyectos.map((p, i) =>
        i === proyectoIndex
          ? {
              ...p,
              avances: p.avances.map((a, j) =>
                j === avanceIndex
                  ? {
                      ...a,
                      [field]:
                        field === "descripcion"
                          ? String(value)
                          : field === "meta"
                            ? Math.max(
                                0,
                                parseInt(String(value || "0"), 10) || 0,
                              )
                            : Math.max(
                                0,
                                parseInt(String(value || "0"), 10) || 0,
                              ),
                    }
                  : a,
              ),
            }
          : p,
      ),
    }));
  };

  const addProyectoAvance = (proyectoIndex: number) => {
    setForm((prev) => ({
      ...prev,
      proyectos: prev.proyectos.map((p, i) =>
        i === proyectoIndex
          ? { ...p, avances: [...p.avances, emptyProyectoAvance()] }
          : p,
      ),
    }));
  };

  const removeProyectoAvance = (
    proyectoIndex: number,
    avanceIndex: number,
  ) => {
    setForm((prev) => ({
      ...prev,
      proyectos: prev.proyectos.map((p, i) =>
        i === proyectoIndex
          ? {
              ...p,
              avances:
                p.avances.length > 1
                  ? p.avances.filter((_, j) => j !== avanceIndex)
                  : p.avances,
            }
          : p,
      ),
    }));
  };

  const addProyecto = () => {
    setForm((prev) => ({
      ...prev,
      proyectos: [...prev.proyectos, emptyProyectoItem()],
    }));
  };

  const removeProyecto = (index: number) => {
    setForm((prev) => ({
      ...prev,
      proyectos:
        prev.proyectos.length > 1
          ? prev.proyectos.filter((_, i) => i !== index)
          : prev.proyectos,
    }));
  };

  const updateProyectoBeneficiario = (
    proyectoIndex: number,
    grupo: keyof Beneficiarios,
    campo: keyof Beneficiarios["directos"],
    value: number,
  ) => {
    setForm((prev) => ({
      ...prev,
      proyectos: prev.proyectos.map((p, i) =>
        i === proyectoIndex
          ? {
              ...p,
              beneficiarios: {
                ...p.beneficiarios,
                [grupo]: {
                  ...p.beneficiarios[grupo],
                  [campo]:
                    Number.isFinite(value) && value >= 0 ? value : 0,
                },
              },
            }
          : p,
      ),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const parsed = proyectosMemoriaSchema.safeParse(form);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      const path = issue?.path?.join(".");
      Swal.fire({
        icon: "warning",
        title: "Revise el formulario",
        text: `${path ? `${path}: ` : ""}${issue?.message ?? "Datos inválidos."}`,
      });
      return;
    }

    const data = parsed.data;

    if (isPublic && onReview) {
      onReview(data);
      return;
    }

    startTransition(async () => {
      try {
        if (isPublic) {
          if (!onCreatePublic) throw new Error("Acción de envío no configurada.");
          await onCreatePublic(data);
        } else if (isEdit && initial) {
          await updateProyectoMemoria(initial.id, data);
        } else {
          await createProyectoMemoria(data);
        }
        const isDark = document.documentElement.classList.contains("dark");
        await Swal.fire({
          icon: "success",
          title: isPublic
            ? "Informe enviado"
            : isEdit
              ? "Memoria actualizada"
              : "Memoria registrada",
          timer: 1600,
          showConfirmButton: false,
          background: isDark ? "#252526" : "#ffffff",
          color: isDark ? "#cccccc" : "#000000",
        });
        if (isPublic) setForm(emptyProyectoMemoria());
        onSaved();
      } catch (err) {
        await Swal.fire({
          icon: "error",
          title: "No se pudo guardar",
          text: err instanceof Error ? err.message : "Error desconocido",
        });
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      {!isPublic && (
        <div className="flex items-center gap-3 mb-6">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="h-10 w-10 shrink-0 flex items-center justify-center rounded-xl bg-card border border-border hover:bg-accent transition-colors cursor-pointer dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800"
            >
              <ChevronLeft className="w-5 h-5 text-muted-foreground dark:text-zinc-400" />
            </button>
          )}
          <div className="min-w-0">
            <h2 className="text-2xl font-black tracking-tight text-foreground dark:text-zinc-50 leading-tight">
              {isEdit ? "Editar informe" : "Nuevo informe de memoria de labores"}
            </h2>
            <p className="text-sm text-muted-foreground dark:text-zinc-400">
              Formulario de solicitud de información — Plan Trifinio
            </p>
          </div>
        </div>
      )}

      <div className={cn("space-y-6", isPublic && "space-y-4 sm:space-y-6")}>
        <section
          className={cn(
            formSectionClass,
            isPublic && "rounded-lg shadow-none sm:rounded-xl sm:shadow-sm",
          )}
        >
          <div className={sectionTitleClass}>
            <CalendarDays className="w-4 h-4" />
            Datos del informe
          </div>
          <div
            className={cn(
              formSectionBodyClass(isPublic),
              "grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4",
            )}
          >
            <div className="grid gap-1.5 md:col-span-2">
              <Label htmlFor="oficina">
                Oficina / Unidad técnica o proyecto
              </Label>
              <TextInput
                id="oficina"
                value={form.oficina ?? ""}
                onChange={(e) =>
                  setForm((p) => ({ ...p, oficina: e.target.value }))
                }
                placeholder="ej. Unidad de Comunicación"
              />
              <FieldHint>
                Área del Plan Trifinio que reporta esta memoria (unidad técnica,
                oficina o proyecto desde el cual se envía el informe).
              </FieldHint>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="cargo">Cargo</Label>
              <TextInput
                id="cargo"
                value={form.cargo ?? ""}
                onChange={(e) =>
                  setForm((p) => ({ ...p, cargo: e.target.value }))
                }
                placeholder="ej. Técnico de proyectos"
              />
              <FieldHint>
                Puesto o función de la persona que completa y envía el
                formulario.
              </FieldHint>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="nombre">Nombre</Label>
              <TextInput
                id="nombre"
                value={form.nombre ?? ""}
                onChange={(e) =>
                  setForm((p) => ({ ...p, nombre: e.target.value }))
                }
                placeholder="ej. Juan Pérez"
              />
              <FieldHint>
                Nombre completo de quien reporta (no es el nombre del proyecto).
              </FieldHint>
            </div>
          </div>
        </section>

        <ProyectosEjecutadosSection
          items={form.proyectos}
          onChange={updateProyecto}
          onBeneficiarioChange={updateProyectoBeneficiario}
          onAvanceChange={updateProyectoAvance}
          onAvanceAdd={addProyectoAvance}
          onAvanceRemove={removeProyectoAvance}
          onListaChange={updateProyectoLista}
          onListaAdd={addProyectoListaItem}
          onListaRemove={removeProyectoListaItem}
          onAdd={addProyecto}
          onRemove={removeProyecto}
          sectionTitleClass={sectionTitleClass}
          isPublic={isPublic}
          isEdit={isEdit}
          isPending={isPending}
          onBack={onBack}
          onReview={onReview}
        />
      </div>
    </form>
  );
}

function ProyectosEjecutadosSection({
  items,
  onChange,
  onBeneficiarioChange,
  onAvanceChange,
  onAvanceAdd,
  onAvanceRemove,
  onListaChange,
  onListaAdd,
  onListaRemove,
  onAdd,
  onRemove,
  sectionTitleClass,
  isPublic,
  isEdit,
  isPending,
  onBack,
  onReview,
}: {
  items: ProyectoItem[];
  onChange: (
    index: number,
    field: "nombre" | "mes" | "descripcion",
    value: string,
  ) => void;
  onBeneficiarioChange: (
    proyectoIndex: number,
    grupo: keyof Beneficiarios,
    campo: keyof Beneficiarios["directos"],
    value: number,
  ) => void;
  onAvanceChange: (
    proyectoIndex: number,
    avanceIndex: number,
    field: keyof ProyectoAvance,
    value: string | number,
  ) => void;
  onAvanceAdd: (proyectoIndex: number) => void;
  onAvanceRemove: (proyectoIndex: number, avanceIndex: number) => void;
  onListaChange: (
    proyectoIndex: number,
    key: ProyectoListaKey,
    listaIndex: number,
    value: string,
  ) => void;
  onListaAdd: (proyectoIndex: number, key: ProyectoListaKey) => void;
  onListaRemove: (
    proyectoIndex: number,
    key: ProyectoListaKey,
    listaIndex: number,
  ) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
  sectionTitleClass: string;
  isPublic: boolean;
  isEdit: boolean;
  isPending: boolean;
  onBack?: () => void;
  onReview?: (input: ProyectosMemoriaInput) => void;
}) {
  return (
    <section
      className={cn(
        formSectionClass,
        isPublic && "rounded-lg shadow-none sm:rounded-xl sm:shadow-sm",
      )}
    >
      <div className={sectionTitleClass}>
        <ListChecks className="w-4 h-4" />
        Proyectos ejecutados por mes
      </div>
      <div className={proyectosListBodyClass(isPublic)}>
        {items.map((item, i) => (
          <div key={i} className={proyectoCardClass(isPublic)}>
            <div className="flex items-center justify-between gap-2">
              <span
                className={cn(
                  "text-sm font-black truncate",
                  sectionAddButtonColor.proyecto,
                )}
              >
                {item.nombre.trim() || `Proyecto ${i + 1}`}
              </span>
              {items.length > 1 && (
                <button
                  type="button"
                  onClick={() => onRemove(i)}
                  className="h-8 w-8 shrink-0 flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-red-50 hover:text-red-600 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-red-950/40 dark:hover:text-red-400 transition-colors cursor-pointer"
                  aria-label="Eliminar proyecto"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                <div className="flex-1 min-w-0 grid gap-1.5">
                  <Label htmlFor={`proyecto-nombre-${i}`}>
                    Nombre del proyecto
                  </Label>
                  <TextInput
                    id={`proyecto-nombre-${i}`}
                    value={item.nombre}
                    onChange={(e) => onChange(i, "nombre", e.target.value)}
                    placeholder="ej. Fortalecimiento comunitario en la frontera"
                  />
                  <FieldHint>
                    Título o nombre con el que se identifica este proyecto
                    dentro del informe.
                  </FieldHint>
                </div>
                <div className="w-full sm:w-40 shrink-0 grid gap-1.5">
                  <Label htmlFor={`proyecto-mes-${i}`}>Mes</Label>
                  <TextInput
                    id={`proyecto-mes-${i}`}
                    type="month"
                    value={item.mes}
                    onChange={(e) => onChange(i, "mes", e.target.value)}
                    className="min-w-0 px-2"
                  />
                  <FieldHint>Mes de ejecución o reporte.</FieldHint>
                </div>
              </div>
              <div className="grid gap-1.5">
                <Label>Descripción del proyecto</Label>
                <Field
                  rows={2}
                  value={item.descripcion}
                  onChange={(e) => onChange(i, "descripcion", e.target.value)}
                  placeholder="Descripción del proyecto"
                />
                <FieldHint>
                  Resumen de qué consistió el proyecto y las actividades
                  realizadas en ese mes.
                </FieldHint>
              </div>
            </div>

            <ProyectoAvancesLista
              items={item.avances}
              compact={isPublic}
              onChange={(j, field, value) =>
                onAvanceChange(i, j, field, value)
              }
              onAdd={() => onAvanceAdd(i)}
              onRemove={(j) => onAvanceRemove(i, j)}
            />

            <ProyectoListaInterna
              titulo="Principales resultados del período"
              ayuda="Logros concretos obtenidos con este proyecto durante el período reportado."
              icon={<ListChecks className="w-3.5 h-3.5" />}
              items={item.resultados}
              placeholder="Descripción por proyecto"
              addLabel="Agregar resultado"
              removeLabel="Eliminar resultado"
              addColor="resultado"
              compact={isPublic}
              onChange={(j, v) => onListaChange(i, "resultados", j, v)}
              onAdd={() => onListaAdd(i, "resultados")}
              onRemove={(j) => onListaRemove(i, "resultados", j)}
            />

            <ProyectoListaInterna
              titulo="Efectos alcanzados"
              ayuda="Cambios o impactos en comunidad: expansión de teoría, aplicación práctica o réplica de lo aprendido."
              icon={<Sparkles className="w-3.5 h-3.5" />}
              items={item.efectos}
              compact={isPublic}
              placeholder="Descripción de expansión de teoría / aplicación y réplica en comunidad"
              addLabel="Agregar efecto alcanzado"
              removeLabel="Eliminar efecto alcanzado"
              addColor="efecto"
              onChange={(j, v) => onListaChange(i, "efectos", j, v)}
              onAdd={() => onListaAdd(i, "efectos")}
              onRemove={(j) => onListaRemove(i, "efectos", j)}
            />

            <ProyectoBeneficiariosFields
              proyectoIndex={i}
              beneficiarios={item.beneficiarios}
              compact={isPublic}
              onChange={onBeneficiarioChange}
            />
          </div>
        ))}
        <SectionAddButton
          label="Agregar proyecto"
          color="proyecto"
          onClick={onAdd}
        />
        <FieldHint>
          Agregue un bloque por cada proyecto ejecutado en el período. Cada
          bloque agrupa mes, descripción, avances medibles, resultados y
          efectos de ese proyecto.
        </FieldHint>

        <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-3 pt-4 mt-2 border-t border-border dark:border-zinc-700">
          {!isPublic && onBack && (
            <button
              type="button"
              onClick={onBack}
              className="h-11 px-5 rounded-xl border border-border bg-background text-foreground font-bold uppercase text-[10px] tracking-widest hover:bg-muted/50 transition-all cursor-pointer dark:border-zinc-700 dark:bg-zinc-900"
            >
              Cancelar
            </button>
          )}
          <button
            type="submit"
            disabled={isPending}
            className="h-11 px-6 rounded-xl bg-azul-trifinio text-white font-bold uppercase text-[10px] tracking-widest hover:opacity-90 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
          >
            {isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isPublic && onReview ? (
              <ArrowRight className="w-4 h-4" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {isPublic && onReview
              ? "Revisar informe"
              : isPublic
                ? "Enviar informe"
                : isEdit
                  ? "Guardar cambios"
                  : "Registrar memoria"}
          </button>
        </div>
      </div>
    </section>
  );
}

function ProyectoBeneficiariosFields({
  proyectoIndex,
  beneficiarios,
  onChange,
  compact = false,
}: {
  proyectoIndex: number;
  beneficiarios: Beneficiarios;
  onChange: (
    proyectoIndex: number,
    grupo: keyof Beneficiarios,
    campo: keyof Beneficiarios["directos"],
    value: number,
  ) => void;
  compact?: boolean;
}) {
  return (
    <ProyectoSubseccion
      seccion="beneficiarios"
      title="Beneficiarios alcanzados"
      icon={<Users className="w-3.5 h-3.5" />}
      compact={compact}
    >
      {(["directos", "indirectos"] as const).map((grupo) => (
        <div
          key={grupo}
          className={cn(
            grupo === "indirectos" &&
              "mt-5 border-t border-border pt-5 dark:border-zinc-700",
          )}
        >
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground dark:text-zinc-400 mb-2">
            Beneficiarios {grupo}
          </p>
          <div
            className={cn(
              "grid gap-2 sm:gap-3",
              compact ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-1 sm:grid-cols-3",
            )}
          >
            {(["hombres", "mujeres", "jovenes"] as const).map((campo) => (
              <div
                key={campo}
                className={cn(
                  "grid gap-1.5",
                  compact && campo === "jovenes" && "col-span-2 sm:col-span-1",
                )}
              >
                <Label
                  className="capitalize normal-case tracking-normal text-[10px]"
                  htmlFor={`p${proyectoIndex}-${grupo}-${campo}`}
                >
                  {campo === "jovenes" ? "Jóvenes" : campo}
                </Label>
                <NumericInput
                  id={`p${proyectoIndex}-${grupo}-${campo}`}
                  value={beneficiarios[grupo][campo]}
                  onValueChange={(n) =>
                    onChange(proyectoIndex, grupo, campo, n)
                  }
                />
              </div>
            ))}
          </div>
        </div>
      ))}
      <FieldHint>
        Personas alcanzadas por este proyecto. Directos: participaron de forma
        activa. Indirectos: se beneficiaron sin participación directa. Jóvenes
        según criterio del proyecto (ej. 15–29 años).
      </FieldHint>
    </ProyectoSubseccion>
  );
}

function ProyectoAvancesLista({
  items,
  onChange,
  onAdd,
  onRemove,
  compact = false,
}: {
  items: ProyectoAvance[];
  onChange: (
    index: number,
    field: keyof ProyectoAvance,
    value: string | number,
  ) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
  compact?: boolean;
}) {
  return (
    <ProyectoSubseccion
      seccion="avance"
      title="Avances por proyecto"
      icon={<TrendingUp className="w-3.5 h-3.5" />}
      compact={compact}
    >
      {items.map((avance, j) => (
          <div key={j} className={nestedItemShellClass(compact)}>
            <div className="flex items-start gap-2">
              <div
                className={cn(
                  "flex h-9 w-8 shrink-0 items-center justify-center rounded-lg bg-muted/60 text-sm font-black text-muted-foreground dark:bg-zinc-800 dark:text-zinc-300 sm:h-10",
                  compact && "hidden sm:flex",
                )}
              >
                {j + 1}
              </div>
              <div className="min-w-0 flex-1 space-y-2">
                <div className="grid gap-1.5">
                  <div className="flex items-center gap-2">
                    {compact ? (
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted/60 text-xs font-black text-muted-foreground dark:bg-zinc-800 dark:text-zinc-300 sm:hidden">
                        {j + 1}
                      </span>
                    ) : null}
                    <Label className="normal-case tracking-normal text-[10px] flex-1">
                      Descripción del indicador
                    </Label>
                  </div>
                  <Field
                    rows={2}
                    value={avance.descripcion}
                    onChange={(e) => onChange(j, "descripcion", e.target.value)}
                    placeholder="ej. Talleres de capacitación realizados"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-[1fr_auto_1fr_auto] sm:items-end">
                  <div className="grid gap-1.5">
                    <Label className="normal-case tracking-normal text-[10px]">
                      Logrado
                    </Label>
                    <NumericInput
                      value={avance.logrado}
                      onValueChange={(n) => onChange(j, "logrado", n)}
                      placeholder="ej. 7"
                    />
                  </div>
                  <span className="hidden pb-2.5 text-lg font-black text-muted-foreground dark:text-zinc-500 sm:block">
                    /
                  </span>
                  <div className="grid gap-1.5">
                    <Label className="normal-case tracking-normal text-[10px]">
                      Meta
                    </Label>
                    <NumericInput
                      value={avance.meta}
                      onValueChange={(n) => onChange(j, "meta", n)}
                      placeholder="ej. 10"
                    />
                  </div>
                  <div className="col-span-2 flex justify-center sm:col-span-1 sm:col-start-4 sm:row-start-1">
                    <div className="w-full rounded-lg bg-amber-500/10 px-3 h-10 flex items-center justify-center text-sm font-black text-amber-600 dark:text-amber-400 sm:min-w-[4rem] sm:w-auto">
                      {avance.meta > 0
                        ? `${avance.logrado}/${avance.meta}`
                        : "—"}
                    </div>
                  </div>
                </div>
                <div className="space-y-1 pt-1">
                  <FieldHint>
                    <span className="font-semibold text-foreground/70 dark:text-zinc-400">
                      Indicador:
                    </span>{" "}
                    Qué se está midiendo (ej. talleres impartidos, familias
                    capacitadas, instituciones fortalecidas).
                  </FieldHint>
                  <FieldHint>
                    <span className="font-semibold text-foreground/70 dark:text-zinc-400">
                      Logrado:
                    </span>{" "}
                    Cantidad alcanzada hasta la fecha en este indicador.
                  </FieldHint>
                  <FieldHint>
                    <span className="font-semibold text-foreground/70 dark:text-zinc-400">
                      Meta:
                    </span>{" "}
                    Objetivo total planificado. Puede ser cualquier número que
                    usted defina (10, 50, 100…). La escala no está limitada a
                    10.
                  </FieldHint>
                </div>
              </div>
            </div>
            <SectionRemoveButton
              onClick={() => onRemove(j)}
              label="Eliminar avance"
            />
          </div>
        ))}
        <div
          className={cn(
            compact &&
              "mt-5 border-t border-border pt-4 dark:border-zinc-700 sm:mt-3 sm:border-t-0 sm:pt-0",
          )}
        >
          <SectionAddButton
            label="Agregar avance por proyecto"
            color="avance"
            onClick={onAdd}
          />
          <FieldHint className="mt-3">
            Indicadores medibles del avance. Usted define la escala: puede ser 7
            de 10, 15 de 20, 80 de 100, etc.
          </FieldHint>
        </div>
    </ProyectoSubseccion>
  );
}

function ProyectoListaInterna({
  titulo,
  ayuda,
  icon,
  items,
  placeholder,
  addLabel,
  removeLabel,
  addColor,
  onChange,
  onAdd,
  onRemove,
  compact = false,
}: {
  titulo: string;
  ayuda?: string;
  icon: React.ReactNode;
  items: string[];
  placeholder: string;
  addLabel: string;
  removeLabel: string;
  addColor: Exclude<ProyectoSeccionKey, "proyecto" | "beneficiarios">;
  onChange: (index: number, value: string) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
  compact?: boolean;
}) {
  return (
    <ProyectoSubseccion
      seccion={addColor}
      title={titulo}
      icon={icon}
      compact={compact}
    >
      {items.map((value, j) => (
          <div key={j} className={nestedItemShellClass(compact)}>
            <div className="flex items-start gap-1.5 sm:gap-2">
              <div className="flex h-9 w-7 shrink-0 items-center justify-center rounded-lg bg-muted/60 text-sm font-black text-muted-foreground dark:bg-zinc-800 dark:text-zinc-300 sm:h-10 sm:w-8">
                {j + 1}
              </div>
              <Field
                rows={2}
                value={value}
                onChange={(e) => onChange(j, e.target.value)}
                placeholder={placeholder}
                className="min-w-0 flex-1"
              />
            </div>
            <SectionRemoveButton
              onClick={() => onRemove(j)}
              label={removeLabel}
            />
          </div>
        ))}
      <div
        className={cn(
          compact &&
            "mt-5 border-t border-border pt-4 dark:border-zinc-700 sm:mt-3 sm:border-t-0 sm:pt-0",
        )}
      >
        <SectionAddButton label={addLabel} color={addColor} onClick={onAdd} />
        {ayuda ? <FieldHint className="mt-3">{ayuda}</FieldHint> : null}
      </div>
    </ProyectoSubseccion>
  );
}
