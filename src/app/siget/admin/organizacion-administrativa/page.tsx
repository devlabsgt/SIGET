import { Suspense } from "react";
import { OrganizacionJerarquica } from "@/components/organizacion-jerarquica/OrganizacionJerarquica";

export default function OrganizacionAdministrativaPage() {
  return (
    <Suspense>
      <OrganizacionJerarquica />
    </Suspense>
  );
}
