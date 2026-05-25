"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import AnimacionLogoTrifinio from "./AnimacionLogoTrifinio";
import { createPortal } from "react-dom";

interface LogoTrifinioLoginProps {
  backgroundEffect?: "blur" | "glow" | "none";
}

export default function LogoTrifinioLogin({
  backgroundEffect = "none",
}: LogoTrifinioLoginProps) {
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFullScreen(true);
  };

  const logoVariants = {
    hidden: { opacity: 0, scale: 0.8, rotate: -5 },
    visible: {
      opacity: 1, scale: 1, rotate: 0,
      transition: { type: "spring" as const, stiffness: 50, damping: 16, duration: 2.4 },
    },
  };

  const textContainerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.12, delayChildren: 0.05 },
    },
  };

  const titleVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1, x: 0,
      transition: { type: "spring" as const, stiffness: 40, damping: 18, duration: 1.3 },
    },
  };

  const sloganVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1, y: 0,
      transition: { type: "spring" as const, stiffness: 50, damping: 16, duration: 1.1 },
    },
  };

  const lineVariants = {
    hidden: { scaleX: 0 },
    visible: {
      scaleX: 1,
      transition: { duration: 1.2, ease: "easeInOut" as const },
    },
  };

  const countriesVariants = {
    hidden: { opacity: 0, y: 5 },
    visible: {
      opacity: 1, y: 0,
      transition: { duration: 0.3, ease: "easeOut" as const },
    },
  };

  return (
    <>
      <motion.div
        onClick={handleClick}
        whileTap={{ scale: 0.96 }}
        className="relative select-none cursor-pointer flex items-center justify-center w-full mx-auto overflow-hidden"
        initial="hidden"
        animate="visible"
      >
        {backgroundEffect === "blur" && (
          <div className="absolute inset-0 bg-white/55 dark:bg-white/10 backdrop-blur-md border border-white/50 dark:border-white/10 -z-10 shadow-xl rounded-2xl" />
        )}

        {backgroundEffect === "glow" && (
          <div className="absolute inset-x-[-20%] inset-y-[-10%] bg-white/50 dark:bg-transparent blur-[60px] -z-10 rounded-[100px]" />
        )}

        <div className="flex flex-row items-center justify-center gap-5 w-full">
          <motion.div variants={logoVariants} className="shrink-0">
            <Image
              src="/trifinio/logo.png"
              alt="Plan Trifinio"
              width={100}
              height={100}
              className="w-[92px] md:w-[100px] h-auto object-contain"
              priority
            />
          </motion.div>

          <motion.div
            variants={textContainerVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col items-center justify-center text-center relative"
          >
            <motion.h1
              variants={titleVariants}
              className="font-black whitespace-nowrap text-azul-trifinio dark:text-white leading-[0.95]"
              style={{ fontFamily: "'Arial Black', sans-serif", fontSize: "1.75rem" }}
            >
              Plan Trifinio
            </motion.h1>

            <motion.p
              variants={sloganVariants}
              className="font-bold italic mt-1 text-azul-trifinio dark:text-white leading-tight"
              style={{ fontFamily: "Arial, sans-serif", fontSize: "1.1rem" }}
            >
              &ldquo;Agua sin fronteras&rdquo;
            </motion.p>

            <motion.div
              variants={lineVariants}
              className="w-full h-[2px] mt-2 bg-azul-trifinio dark:bg-white origin-center"
            />

            <motion.p
              variants={countriesVariants}
              className="font-semibold mt-2 text-azul-trifinio dark:text-white whitespace-nowrap text-[clamp(8px,2.35vw,0.6rem)] tracking-wide sm:tracking-[0.15em]"
              style={{ fontFamily: "Arial, sans-serif" }}
            >
              El Salvador&ensp;•&ensp;Guatemala&ensp;•&ensp;Honduras
            </motion.p>
          </motion.div>
        </div>
      </motion.div>

      {mounted && createPortal(
        <AnimacionLogoTrifinio isOpen={isFullScreen} onClose={() => setIsFullScreen(false)} />,
        document.body
      )}
    </>
  );
}
