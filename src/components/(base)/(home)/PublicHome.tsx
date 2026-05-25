"use client";

import { useState } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { HeroVideoLayout } from "@/components/(base)/(home)/ConoceMasVideo";
import {
  ObservatorioHomeSections,
  ObservatorioFooterCurtain,
  FOOTER_SCROLL_SPACER_VH,
} from "@/components/(base)/(home)/ObservatorioHomeSections";
import { useUser } from "@/components/(base)/providers/UserProvider";

export function PublicHome() {
  const user = useUser();
  const [videoOpen, setVideoOpen] = useState(false);
  const { scrollY } = useScroll();
  const logoY = useTransform(scrollY, [0, 600], [0, -300]);
  const logoOpacity = useTransform(scrollY, [0, 400], [1, 0]);
  const bgScaleRaw = useTransform(scrollY, [0, 800], [1, 1.05]);
  const bgScale = useSpring(bgScaleRaw, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  return (
    <div className="relative flex w-full flex-col" style={{ zoom: 0.9 }}>
      {/* 1. Hero móvil */}
      <div className="flex flex-col w-full bg-card md:hidden">
        <div
          className="relative w-full shrink-0"
          style={{ paddingTop: user ? "100px" : "56px" }}
        >
          <img
            src="/trifinio/hero-background2.jpg"
            alt="Plan Trifinio"
            className="w-full h-auto block"
          />
          <div
            className="absolute inset-0 flex flex-col items-center justify-center px-4"
            style={{ top: user ? "100px" : "56px" }}
          >
            <HeroVideoLayout
              videoOpen={videoOpen}
              onOpen={() => setVideoOpen(true)}
              onClose={() => setVideoOpen(false)}
              mobile
            />
          </div>
        </div>
      </div>

      {/* 1. Hero desktop — 100vh en el flujo; sticky (no fixed global) */}
      <section className="relative hidden h-screen w-full shrink-0 md:block">
        <div
          className="sticky top-0 z-10 h-screen w-full overflow-hidden bg-[#0a1628]"
          style={{ zoom: 1 / 0.9 }}
        >
          <motion.div
            className="absolute inset-0 bg-cover bg-center origin-center"
            style={{
              backgroundImage: "url('/trifinio/hero-background2.jpg')",
              scale: bgScale,
            }}
          />
          <motion.div
            className="absolute inset-0 flex justify-center items-center z-[5] pt-16 px-4 lg:px-8 -translate-y-6 lg:-translate-y-8"
            style={{ y: logoY, opacity: logoOpacity }}
          >
            <div className="relative w-full max-w-5xl">
              <HeroVideoLayout
                videoOpen={videoOpen}
                onOpen={() => setVideoOpen(true)}
                onClose={() => setVideoOpen(false)}
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* 2. Contenido blanco — encima del footer fijo; curvas arriba/abajo en desktop */}
      <section className="relative z-20 w-full shrink-0 bg-background dark:bg-background md:overflow-hidden md:rounded-t-[3rem] md:rounded-b-[3rem] md:shadow-[0_28px_80px_rgba(10,22,40,0.14)]">
        <div className="pointer-events-none absolute inset-0 hidden bg-[radial-gradient(#d1d5db_1px,transparent_1px)] bg-size-[24px_24px] opacity-60 md:block dark:bg-[radial-gradient(oklch(36%_0_0)_1px,transparent_1px)] md:rounded-t-[3rem] md:rounded-b-[3rem]" />
        <div className="relative z-10 pt-2 md:pt-10">
          <ObservatorioHomeSections />
        </div>
      </section>

      {/* 3. Spacer (desktop): mismo alto que el footer; deja ver el footer fijo al llegar abajo */}
      <div
        className="hidden w-full shrink-0 md:block"
        style={{ height: `${FOOTER_SCROLL_SPACER_VH}vh`, zoom: 1 / 0.9 }}
        aria-hidden
      />

      {/* 4. Footer — móvil al final del flujo; desktop fijo abajo (revealed al hacer scroll) */}
      <ObservatorioFooterCurtain />
    </div>
  );
}
