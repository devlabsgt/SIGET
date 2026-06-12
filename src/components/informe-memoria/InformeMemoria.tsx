"use client";

import Crear from "./forms/Crear";

export function InformeMemoria() {
  return (
    <div className="relative w-full min-h-[calc(100vh-4rem)] dark:bg-zinc-950">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#d1d5db_1px,transparent_1px)] bg-size-[24px_24px] opacity-50 dark:bg-[radial-gradient(oklch(28%_0_0)_1px,transparent_1px)] dark:opacity-30" />
      <div className="relative z-10 w-full max-w-[1100px] mx-auto px-4 md:px-6 pt-8 md:pt-12 pb-12">
        <div className="mb-8">
          <p className="text-[10px] font-black uppercase tracking-widest text-celeste-trifinio dark:text-celeste-trifinio/90">
            Plan Trifinio
          </p>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-foreground dark:text-zinc-50 leading-tight mt-1">
            Informe de Memoria de Labores
          </h1>
          <p className="text-sm text-muted-foreground dark:text-zinc-400 mt-2 max-w-2xl">
            Complete el formulario con la información de su oficina o unidad
            técnica. No requiere iniciar sesión.
          </p>
        </div>
        <Crear />
      </div>
    </div>
  );
}
