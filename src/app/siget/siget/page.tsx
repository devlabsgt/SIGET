import { Suspense } from "react";
import Dashboard from "@/components/(SIGET)/observatorio/ObservatorioWeb";

export default function SIGETPage() {
  return (
    <Suspense>
      <Dashboard />
    </Suspense>
  );
}
