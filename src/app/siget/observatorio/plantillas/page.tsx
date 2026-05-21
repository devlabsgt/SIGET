import { Suspense } from "react";
import PlantillasList from "@/components/(SIGET)/observatorio/forms/PlantillasList";

export default function PlantillasPage() {
  return (
    <Suspense>
      <PlantillasList />
    </Suspense>
  );
}
