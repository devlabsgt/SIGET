import { Suspense } from "react";
import { ActividadesPanel } from "@/components/actividades/ActividadesPanel";

export default function ActividadesPage() {
  return (
    <Suspense>
      <ActividadesPanel />
    </Suspense>
  );
}
