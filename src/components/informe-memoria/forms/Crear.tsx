"use client";

import { useState } from "react";
import ProyectosMemoriaForm from "@/components/(SIGET)/memoria-labores/form/ProyectosMemoriaForm";
import type { ProyectosMemoriaInput } from "@/components/(SIGET)/memoria-labores/lib/types";
import Confirmar from "./Confirmar";
import { PasoIndicador } from "./PasoIndicador";

export default function Crear() {
  const [paso, setPaso] = useState<1 | 2>(1);
  const [borrador, setBorrador] = useState<ProyectosMemoriaInput | null>(null);

  if (paso === 2 && borrador) {
    return (
      <Confirmar
        data={borrador}
        onBack={() => setPaso(1)}
        onSubmitted={() => {
          setBorrador(null);
          setPaso(1);
        }}
      />
    );
  }

  return (
    <div className="w-full space-y-4 sm:space-y-6">
      <PasoIndicador paso={1} />
      <ProyectosMemoriaForm
        variant="public"
        restoreDraft={borrador}
        onReview={(data) => {
          setBorrador(data);
          setPaso(2);
        }}
        onSaved={() => {}}
      />
    </div>
  );
}
