"use client";

import { useTransition } from "react";
import { ChevronLeft, Loader2, Send } from "lucide-react";
import Swal from "sweetalert2";
import { InformeMemoriaVista } from "@/components/(SIGET)/memoria-labores/InformeMemoriaVista";
import type { ProyectosMemoriaInput } from "@/components/(SIGET)/memoria-labores/lib/types";
import { createInforme } from "../lib/actions";
import { PasoIndicador } from "./PasoIndicador";

export default function Confirmar({
  data,
  onBack,
  onSubmitted,
}: {
  data: ProyectosMemoriaInput;
  onBack: () => void;
  onSubmitted: () => void;
}) {
  const [isPending, startTransition] = useTransition();

  const handleConfirm = () => {
    startTransition(async () => {
      try {
        await createInforme(data);
        const isDark = document.documentElement.classList.contains("dark");
        await Swal.fire({
          icon: "success",
          title: "Informe enviado",
          text: "Su memoria de labores fue registrada correctamente.",
          timer: 2200,
          showConfirmButton: false,
          background: isDark ? "#252526" : "#ffffff",
          color: isDark ? "#cccccc" : "#000000",
        });
        onSubmitted();
      } catch (err) {
        await Swal.fire({
          icon: "error",
          title: "No se pudo enviar",
          text: err instanceof Error ? err.message : "Error desconocido",
        });
      }
    });
  };

  return (
    <div className="w-full space-y-4 sm:space-y-6">
      <PasoIndicador paso={2} />
      <div className="rounded-xl border border-border bg-card/50 px-3 py-2.5 dark:border-zinc-800 sm:rounded-2xl sm:px-4 sm:py-3">
        <h2 className="text-lg font-black text-foreground dark:text-zinc-50">
          Confirme su informe
        </h2>
        <p className="mt-1 text-sm text-muted-foreground dark:text-zinc-400">
          Revise los datos y gráficos antes de enviar. Si algo no es correcto,
          puede volver a editar.
        </p>
      </div>
      <InformeMemoriaVista
        cargo={data.cargo}
        nombre={data.nombre}
        oficina={data.oficina}
        proyectos={data.proyectos}
        registrado="Se registrará al confirmar"
        footer={
          <div className="mt-6 flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 dark:border-zinc-800 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={onBack}
              disabled={isPending}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border px-5 text-xs font-bold uppercase tracking-widest text-foreground transition-colors hover:bg-muted/60 disabled:opacity-50 cursor-pointer dark:border-zinc-700"
            >
              <ChevronLeft className="h-4 w-4" />
              Volver a editar
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isPending}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-azul-trifinio px-6 text-xs font-bold uppercase tracking-widest text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Confirmar y enviar
            </button>
          </div>
        }
      />
    </div>
  );
}
