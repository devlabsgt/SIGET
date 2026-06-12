import { Suspense } from "react";
import { InformeMemoria } from "@/components/informe-memoria/InformeMemoria";

export default function InformeMemoriaPage() {
  return (
    <Suspense>
      <InformeMemoria />
    </Suspense>
  );
}
