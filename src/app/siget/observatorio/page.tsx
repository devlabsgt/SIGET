import { Suspense } from "react";
import ObservatorioWeb from "@/components/(SIGET)/observatorio/ObservatorioWeb";

export default function ObservatorioWebPage() {
  return (
    <Suspense>
      <ObservatorioWeb />
    </Suspense>
  );
}
