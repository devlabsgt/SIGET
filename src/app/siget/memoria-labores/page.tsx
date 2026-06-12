import { Suspense } from "react";
import { MemoriaLaboresPanel } from "@/components/(SIGET)/memoria-labores";

export default function MemoriaLaboresPage() {
  return (
    <Suspense>
      <MemoriaLaboresPanel />
    </Suspense>
  );
}
