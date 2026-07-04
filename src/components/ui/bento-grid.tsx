import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function BentoGrid({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "grid w-full grid-cols-1 gap-4 md:grid-cols-3 md:gap-5 md:auto-rows-[minmax(11rem,auto)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function BentoCard({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("relative flex h-full min-h-[11rem] flex-col", className)}>
      {children}
    </div>
  );
}
