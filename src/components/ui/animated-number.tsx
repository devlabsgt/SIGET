"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

export function useCountUp(
  target: number,
  active: boolean,
  duration = 2000,
  runId: string | number = 0,
) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!active) {
      setValue(0);
      return;
    }
    if (target === 0) {
      setValue(0);
      return;
    }

    setValue(0);
    const start = performance.now();
    let frame = 0;

    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      setValue(Math.round(eased * target));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, active, duration, runId]);

  return value;
}

const defaultFormatter = (value: number) =>
  new Intl.NumberFormat("es-GT").format(value);

export function AnimatedNumber({
  value,
  active,
  loading,
  className,
  runId = 0,
  formatter = defaultFormatter,
}: {
  value: number;
  active: boolean;
  loading?: boolean;
  className?: string;
  runId?: string | number;
  formatter?: (value: number) => string;
}) {
  const displayed = useCountUp(value, active && !loading, 2000, runId);

  return (
    <span className={cn("tabular-nums", className)}>
      {loading ? "—" : formatter(displayed)}
    </span>
  );
}
