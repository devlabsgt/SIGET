"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { cn } from "@/lib/utils";

type InteractiveHoverButtonProps = {
  children: React.ReactNode;
  className?: string;
  hoverClassName?: string;
  href?: string;
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children">;

function ButtonInner({
  children,
  hoverClassName,
}: {
  children: React.ReactNode;
  hoverClassName?: string;
}) {
  return (
    <>
      <div className="flex items-center justify-center gap-2">
        <div className="h-2 w-2 rounded-full bg-current opacity-90 transition-all duration-300 group-hover:scale-[100.8]" />
        <span className="inline-block transition-all duration-300 group-hover:translate-x-12 group-hover:opacity-0">
          {children}
        </span>
      </div>
      <div
        className={cn(
          "absolute inset-0 z-10 flex w-full translate-x-12 items-center justify-center gap-2 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100",
          hoverClassName ?? "text-primary-foreground",
        )}
      >
        <span className="whitespace-nowrap">{children}</span>
        <ArrowRight className="size-4 shrink-0" />
      </div>
    </>
  );
}

export function InteractiveHoverButton({
  children,
  className,
  hoverClassName,
  href,
  ...props
}: InteractiveHoverButtonProps) {
  const classes = cn(
    "group relative w-auto cursor-pointer overflow-hidden rounded-full border p-2 px-6 text-center text-sm font-semibold",
    className,
  );

  if (href) {
    return (
      <Link href={href} className={classes}>
        <ButtonInner hoverClassName={hoverClassName}>{children}</ButtonInner>
      </Link>
    );
  }

  return (
    <button type="button" className={classes} {...props}>
      <ButtonInner hoverClassName={hoverClassName}>{children}</ButtonInner>
    </button>
  );
}
