"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getOrganizacionesLogos } from "@/components/(SIGET)/observatorio/forms/lib/actions";
import { useOrgLogoDisplayUrl } from "@/components/(uploads)/imgs/useOrgLogoDisplayUrl";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

if (typeof window !== "undefined") {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).__ORG_CINTILLO_VERSION__ = "v3-public-url";
}

type OrgLogo = { id: string; nombre: string; logo: string | null };

const PLAN_TRIFINIO_MATCH = "plan trifinio";

/** Ancho completo, siempre transparente (hereda el fondo de la página) */
const ORG_CINTILLO_SECTION_CLASS =
  "w-full bg-transparent text-foreground py-10 md:py-14 px-4 md:px-8 lg:px-12 xl:px-16";

function extractPlanTrifinio(orgs: OrgLogo[]) {
  const planTrifinio =
    orgs.find((o) => o.nombre.toLowerCase().includes(PLAN_TRIFINIO_MATCH)) ?? null;
  const others = orgs
    .filter((o) => o.id !== planTrifinio?.id)
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es", { sensitivity: "base" }));

  return { planTrifinio, others };
}

function OrgLogoLightbox({
  nombre,
  imageUrl,
  onClose,
}: {
  nombre: string;
  imageUrl: string;
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-200 flex items-center justify-center overflow-y-auto bg-white/25 dark:bg-white/5 backdrop-blur-md py-10 px-6 cursor-pointer"
      onClick={onClose}
    >
      <motion.img
        // eslint-disable-next-line @next/next/no-img-element
        src={imageUrl}
        alt={nombre}
        className="my-auto block max-w-[min(92vw,640px)] max-h-[calc(100dvh-5rem)] w-auto h-auto object-contain object-center pointer-events-none select-none"
        initial={{ opacity: 0, scale: 0.75, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.85, y: 8 }}
        transition={{ type: "spring", stiffness: 320, damping: 26 }}
        onClick={(e) => e.stopPropagation()}
      />
    </motion.div>
  );
}

function OrgLogoItem({
  org,
  featured = false,
  onView,
}: {
  org: OrgLogo;
  featured?: boolean;
  onView: (org: OrgLogo, url: string) => void;
}) {
  const { url } = useOrgLogoDisplayUrl(org.logo);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [url]);

  const showLogo = Boolean(url) && !imgError;

  const containerClass = "group relative flex flex-col items-center shrink-0";

  const logoButtonClass =
    "inline-flex items-center justify-center shrink-0 border-0 bg-transparent p-0 shadow-none transition-transform duration-300 ease-out group-hover:-translate-y-2 cursor-pointer";

  const imgClass = cn(
    "block w-auto max-w-full object-contain object-center pointer-events-none",
    featured ? "h-44 md:h-52" : "h-36 md:h-44"
  );

  const nameClass = cn(
    "font-bold text-celeste-trifinio text-center leading-snug line-clamp-3 uppercase tracking-wide w-full max-w-[14rem] px-1",
    featured ? "text-sm md:text-base" : "text-xs md:text-sm"
  );

  const nameOnlySlotClass = cn(
    "flex items-center justify-center shrink-0 px-2",
    featured ? "min-h-44 md:min-h-52" : "min-h-36 md:min-h-44"
  );

  if (!showLogo) {
    return (
      <div className={containerClass}>
        <div className={nameOnlySlotClass}>
          <p className={nameClass}>{org.nombre}</p>
        </div>
        <div className="min-h-9 pt-1" aria-hidden />
      </div>
    );
  }

  return (
    <div className={containerClass}>
      <button
        type="button"
        onClick={() => url && onView(org, url)}
        aria-label={org.nombre}
        className={logoButtonClass}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url!}
          alt={org.nombre}
          onError={() => setImgError(true)}
          className={imgClass}
        />
      </button>

      <p
        className={cn(
          nameClass,
          "min-h-9 pt-1.5 opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 ease-out pointer-events-none"
        )}
      >
        {org.nombre}
      </p>
    </div>
  );
}

function OrgLogoRow({
  orgs,
  onView,
}: {
  orgs: OrgLogo[];
  onView: (org: OrgLogo, url: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-5 lg:gap-6 justify-items-center w-full">
      {orgs.map((org) => (
        <OrgLogoItem key={org.id} org={org} onView={onView} />
      ))}
    </div>
  );
}

export default function OrganizacionesLogoCintillo({
  variant = "default",
}: {
  variant?: "default" | "public";
}) {
  const [orgs, setOrgs] = useState<OrgLogo[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewer, setViewer] = useState<{ nombre: string; url: string } | null>(null);

  useEffect(() => {
    getOrganizacionesLogos()
      .then(setOrgs)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const { planTrifinio, others } = useMemo(() => extractPlanTrifinio(orgs), [orgs]);

  if (loading) {
    return (
      <div
        className={cn(
          ORG_CINTILLO_SECTION_CLASS,
          variant === "public" ? "pb-8 md:pb-12" : "mt-10 pb-20"
        )}
      >
        <div className="w-full">
          <Skeleton className="h-4 w-48 mx-auto mb-6 rounded-md bg-muted" />
          <div className="flex flex-wrap justify-center gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-36 w-44 md:h-44 md:w-52 shrink-0 rounded-md bg-muted" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (orgs.length === 0) return null;

  const handleView = (org: OrgLogo, url: string) => {
    setViewer({ nombre: org.nombre, url });
  };

  return (
    <>
      <div
        className={cn(
          ORG_CINTILLO_SECTION_CLASS,
          variant === "public" ? "pb-8 md:pb-12" : "mt-10 pb-20"
        )}
      >
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="relative z-10 w-full"
        >
          <p
            className={cn(
              "font-black uppercase text-center mb-6 md:mb-8 text-celeste-trifinio",
              variant === "public"
                ? "text-sm font-bold tracking-[0.25em] md:text-base"
                : "text-[10px] tracking-[0.2em] md:text-xs"
            )}
          >
            {variant === "public"
              ? "— Organizaciones del observatorio —"
              : "Organizaciones del observatorio"}
          </p>

          {planTrifinio && (
            <div className="flex flex-col items-center">
              <OrgLogoItem org={planTrifinio} featured onView={handleView} />
            </div>
          )}

          {others.length > 0 && (
            <div className={planTrifinio ? "mt-6 md:mt-8" : undefined}>
              <OrgLogoRow orgs={others} onView={handleView} />
            </div>
          )}
        </motion.section>
      </div>

      <AnimatePresence>
        {viewer && (
          <OrgLogoLightbox
            key={viewer.url}
            nombre={viewer.nombre}
            imageUrl={viewer.url}
            onClose={() => setViewer(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
