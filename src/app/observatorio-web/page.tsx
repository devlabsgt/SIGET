"use client";

import { Suspense } from "react";
import Reportes from "@/components/(SIGET)/observatorio/reportes/Reportes";

export default function ObservatorioWebPage() {
  return (
    <Suspense>
      <div className="flex-1 w-full min-w-0 max-w-none px-2 md:px-4 lg:px-6 pb-20 pt-32 md:pt-20">
        <Reportes
          onBack={() => {
            if (typeof window !== "undefined") {
              window.location.href = "/";
            }
          }}
        />
      </div>
    </Suspense>
  );
}
