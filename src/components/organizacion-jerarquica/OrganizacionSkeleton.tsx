import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

function FilaSkeleton({
  nivel,
  ancho = "w-48",
  alto = "h-14",
}: {
  nivel: number;
  ancho?: string;
  alto?: string;
}) {
  return (
    <div
      className="flex items-stretch gap-2"
      style={{ marginLeft: nivel > 0 ? `${nivel * 1.25}rem` : undefined }}
    >
      <Skeleton className="mt-4 size-4 shrink-0 rounded-md" />
      <Skeleton className={cn("flex-1 rounded-xl", alto, ancho, "max-w-full")} />
    </div>
  );
}

function BloqueHijos({ niveles }: { niveles: number[] }) {
  return (
    <div className="space-y-2 border-l-2 border-celeste-trifinio/15 pl-3 md:pl-4">
      {niveles.map((nivel, i) => (
        <FilaSkeleton key={i} nivel={nivel} ancho={i % 2 === 0 ? "w-full" : "w-10/12"} />
      ))}
    </div>
  );
}

export function OrganizacionStatsSkeleton() {
  return (
    <div className="grid grid-cols-3 gap-3 shrink-0 w-full lg:w-auto lg:min-w-[420px]">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="flex flex-col items-center justify-center gap-2 rounded-xl border border-border/60 bg-card px-4 py-3"
        >
          <Skeleton className="size-4 rounded-md" />
          <Skeleton className="h-8 w-10 rounded-lg" />
          <Skeleton className="h-2.5 w-16 rounded-md" />
        </div>
      ))}
    </div>
  );
}

export function OrganizacionSkeleton() {
  return (
    <div className="animate-pulse space-y-4 px-4 md:px-0">
      <p className="animate-pulse text-center text-sm font-bold text-muted-foreground">
        Cargando estructura...
      </p>

      <div className="flex flex-col items-center gap-3 border-b border-border/50 pb-4">
        <Skeleton className="h-10 w-44 rounded-xl" />
      </div>

      <div className="space-y-3">
        <div className="flex items-start gap-3 rounded-xl border border-border/50 bg-card p-4 md:p-5">
          <Skeleton className="size-5 shrink-0 rounded-md" />
          <div className="min-w-0 flex-1 space-y-2.5">
            <Skeleton className="h-6 w-40 rounded-lg md:w-52" />
            <Skeleton className="h-3 w-full max-w-md rounded-md" />
            <Skeleton className="h-3 w-3/4 max-w-sm rounded-md" />
          </div>
        </div>

        <BloqueHijos niveles={[1, 1, 2, 2, 3]} />

        <FilaSkeleton nivel={1} ancho="w-full" alto="h-16" />

        <BloqueHijos niveles={[2, 2, 3, 3]} />
      </div>
    </div>
  );
}
