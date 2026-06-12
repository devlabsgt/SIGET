import { cn } from "@/lib/utils";

export function PasoIndicador({ paso }: { paso: 1 | 2 }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-full text-xs font-black",
            paso === 1
              ? "bg-azul-trifinio text-white"
              : "bg-emerald-500 text-white",
          )}
        >
          {paso === 1 ? "1" : "✓"}
        </span>
        <span
          className={cn(
            "text-xs font-bold uppercase tracking-wider",
            paso === 1 ? "text-foreground" : "text-muted-foreground",
          )}
        >
          Completar datos
        </span>
      </div>
      <div className="h-px flex-1 max-w-16 bg-border dark:bg-zinc-700" />
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-full text-xs font-black",
            paso === 2
              ? "bg-azul-trifinio text-white"
              : "bg-muted text-muted-foreground dark:bg-zinc-800",
          )}
        >
          2
        </span>
        <span
          className={cn(
            "text-xs font-bold uppercase tracking-wider",
            paso === 2 ? "text-foreground" : "text-muted-foreground",
          )}
        >
          Confirmar informe
        </span>
      </div>
    </div>
  );
}
