import { Suspense } from "react";
import PlantillasList from "@/components/(SIGET)/observatorio/forms/PlantillasList";

export default function PlantillasPage() {
  return (
    <div className="flex flex-1 min-h-0 w-full">
      <Suspense>
        <PlantillasList />
      </Suspense>
    </div>
  );
}
