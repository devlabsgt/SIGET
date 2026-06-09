import { Suspense } from "react";
import FormulariosList from "@/components/(SIGET)/observatorio/forms/FormulariosList";

export default function FormulariosPage() {
  return (
    <div className="flex flex-1 min-h-0 w-full">
      <Suspense>
        <FormulariosList />
      </Suspense>
    </div>
  );
}