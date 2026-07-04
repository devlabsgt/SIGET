"use client";

import React, { useCallback, useEffect } from "react";
import { motion, useMotionTemplate, useMotionValue } from "motion/react";

import { cn } from "@/lib/utils";

interface MagicCardProps {
  children?: React.ReactNode;
  className?: string;
  innerClassName?: string;
  gradientSize?: number;
  gradientColor?: string;
  gradientOpacity?: number;
  gradientFrom?: string;
  gradientTo?: string;
  gradientEndColor?: string;
  borderWidth?: number;
  style?: React.CSSProperties;
}

export function MagicCard({
  children,
  className,
  innerClassName,
  gradientSize = 200,
  gradientColor = "#262626",
  gradientOpacity = 0.8,
  gradientFrom = "#9E7AFF",
  gradientTo = "#FE8BBB",
  gradientEndColor,
  borderWidth = 1,
  style,
}: MagicCardProps) {
  const fadeColor = gradientEndColor ?? "var(--border)";
  const mouseX = useMotionValue(-gradientSize);
  const mouseY = useMotionValue(-gradientSize);
  const reset = useCallback(() => {
    mouseX.set(-gradientSize);
    mouseY.set(-gradientSize);
  }, [gradientSize, mouseX, mouseY]);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      mouseX.set(e.clientX - rect.left);
      mouseY.set(e.clientY - rect.top);
    },
    [mouseX, mouseY],
  );

  useEffect(() => {
    reset();
  }, [reset]);

  useEffect(() => {
    const handleGlobalPointerOut = (e: PointerEvent) => {
      if (!e.relatedTarget) {
        reset();
      }
    };

    const handleVisibility = () => {
      if (document.visibilityState !== "visible") {
        reset();
      }
    };

    window.addEventListener("pointerout", handleGlobalPointerOut);
    window.addEventListener("blur", reset);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.removeEventListener("pointerout", handleGlobalPointerOut);
      window.removeEventListener("blur", reset);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [reset]);

  return (
    <div
      className={cn("group relative rounded-[inherit]", className)}
      onPointerMove={handlePointerMove}
      onPointerLeave={reset}
      style={style}
    >
      <motion.div
        className="pointer-events-none absolute inset-0 z-0 rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: useMotionTemplate`
          radial-gradient(${gradientSize}px circle at ${mouseX}px ${mouseY}px,
          ${gradientFrom}, 
          ${gradientTo}, 
          ${fadeColor} 100%
          )
          `,
        }}
      />

      <div
        className={cn(
          "absolute z-[1] rounded-[inherit] bg-background",
          innerClassName,
        )}
        style={{ inset: borderWidth }}
      />
      <div className="relative z-10 h-full w-full flex flex-col">{children}</div>
    </div>
  );
}
