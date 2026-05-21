"use client";

import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import LogoTrifinio from "@/components/(SIGET)/logo/LogoTrifinio";
import LogoTrifinioMobile from "@/components/(SIGET)/logo/LogoTrifinio-mobile";
import { useUser } from "@/components/(base)/providers/UserProvider";
import { cn } from "@/lib/utils";

export function PublicHome() {
  const user = useUser();
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
    <div className="relative w-full min-h-screen">
      <div className="flex flex-col md:hidden w-full min-h-screen bg-card">
        <div
          className={cn(
            "w-full relative z-[2]",
            user ? "pt-[6.5rem]" : "pt-16",
          )}
        >
          <div className="relative w-full">
            <div className="w-full overflow-hidden">
              <motion.img
                src="/trifinio/hero-background2.jpg"
                alt="Plan Trifinio"
                style={{
                  y: useTransform(scrollY, [0, 800], [0, 150]),
                  scale: bgScale,
                }}
                className="w-full h-auto object-contain block origin-center"
              />
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative isolate w-full">
                <LogoTrifinioMobile backgroundEffect="blur" />
              </div>
            </div>
          </div>
        </div>

        <div className="relative flex-1 w-full bg-muted dark:bg-background px-4 pt-8 pb-20">
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:24px_24px] dark:bg-[radial-gradient(oklch(36%_0_0)_1px,transparent_1px)] opacity-60" />
        </div>
      </div>

      <div className="hidden md:block relative w-full min-h-screen">
        <div className="fixed top-0 left-0 w-full h-[75vh] z-0 bg-[#0a1628] overflow-hidden">
          <motion.div
            className="absolute inset-0 bg-cover bg-center origin-center"
            style={{
              backgroundImage: "url('/trifinio/hero-background2.jpg')",
              scale: bgScale,
            }}
          />
        </div>

        <motion.div
          className="fixed top-0 left-0 w-full h-[65vh] flex justify-center items-center z-[5] pt-16 pb-[140px]"
          style={{ y: logoY, opacity: logoOpacity }}
        >
          <div className="relative flex justify-center items-center px-8">
            <LogoTrifinio />
          </div>
        </motion.div>

        <div className="relative z-10 w-full mt-[65vh]">
          <div className="relative w-full min-h-screen bg-muted dark:bg-background rounded-t-[3rem] px-8 lg:px-12 pt-10 pb-20">
            <div className="absolute inset-0 pointer-events-none rounded-t-[3rem] bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:24px_24px] dark:bg-[radial-gradient(oklch(36%_0_0)_1px,transparent_1px)] opacity-60" />
          </div>
        </div>
      </div>
    </div>
  );
}
