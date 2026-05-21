import { Suspense } from "react";
import FormulariosList from "@/components/(SIGET)/observatorio/forms/FormulariosList";

export default function FormulariosPage() {
  return (
    <Suspense>
      <FormulariosList />
    </Suspense>
  );
}