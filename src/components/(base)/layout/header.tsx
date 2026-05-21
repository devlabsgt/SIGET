"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "@/components/(base)/providers/UserProvider";
import { BreadcrumbNav } from "@/components/ui/breadcrumb-nav";
import { Menu as MenuIcon, X, RefreshCw, LogIn } from "lucide-react";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import Menu from "./Menu";
import { getPendingDevicesCount } from "@/components/(SIGET)/admin/lib/actions";
import Image from "next/image";
import { createPortal } from "react-dom";
import AnimacionLogoTrifinio from "@/components/(SIGET)/logo/AnimacionLogoTrifinio";

export default function Header() {
  const user = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const [pendingDevices, setPendingDevices] = useState(0);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const isPublicHome = pathname === "/";
  const isLoginPage = pathname === "/login";
  const showLoginButton = isPublicHome && !user;
  const showBreadcrumb = Boolean(user) && !isLoginPage;
  const showHamburger = Boolean(user);

  const metadata = user?.user_metadata || {};
  const role = metadata.rol || user?.role || "user";
  const canManage = ["super", "admin"].includes(role);

  useEffect(() => {
    setMounted(true);
    if (!canManage) return;
    getPendingDevicesCount().then((c) => setPendingDevices(c ?? 0));
  }, [canManage]);

  const handleLogoClick = (e: React.MouseEvent) => {
    // Prevent default navigation to show the animation instead
    e.preventDefault();
    setIsFullScreen(true);
  };

  return (
    <>
      <header className="w-full fixed left-0 transition-all bg-card border-b border-border/40 z-[100] shadow-sm">
        <div className="mx-auto flex h-14 md:h-16 items-center justify-between px-4 md:px-8 gap-4">
          <div className="flex items-center h-full">
            <div className="flex items-center shrink-0">
              <Link
                href={user ? "/siget" : "/"}
                onClick={handleLogoClick}
                className="flex flex-row items-center shrink-0 group gap-1 md:gap-1.5 cursor-pointer"
              >
                <motion.h1 
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className="text-2xl md:text-4xl font-extrabold tracking-tighter leading-none text-azul-trifinio dark:text-white transition-transform duration-300 group-hover:scale-105 origin-left"
                >
                  SIGET
                </motion.h1>
                <motion.div 
                  initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
                  animate={{ opacity: 1, clipPath: "inset(0 0 0 0)" }}
                  transition={{ duration: 0.8, delay: 0.2, ease: [0.25, 1, 0.5, 1] }}
                  className="text-xs md:text-sm font-black uppercase tracking-widest leading-[1.15] md:leading-[1.15] text-celeste-trifinio border-l border-border/60 pl-2 md:pl-3 transition-transform duration-300 group-hover:scale-[1.02] origin-left group-hover:text-azul-trifinio dark:group-hover:text-[#FFFDD0]"
                >
                  SISTEMA INTEGRAL DE<br />GESTIÓN TRIFINIO
                </motion.div>
              </Link>
            </div>
            {showBreadcrumb && (
              <div className="hidden md:flex ml-4 md:ml-6 border-l border-border/30 h-10 items-center pl-4 md:pl-6">
                <BreadcrumbNav />
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            <AnimatedThemeToggler />
            <button
              id="refresh-btn"
              onClick={() => window.location.reload()}
              className="flex items-center justify-center text-azul-trifinio hover:text-celeste-trifinio dark:text-white dark:hover:text-white/80 cursor-pointer transition-all hover:rotate-180 duration-500 active:scale-95"
            >
              <RefreshCw className="size-5 md:size-6" />
            </button>
            {showLoginButton && (
              <Link
                href="/login"
                className="group flex items-center justify-center gap-2 text-azul-trifinio hover:text-celeste-trifinio dark:text-white dark:hover:text-white/80 cursor-pointer transition-colors duration-300 active:scale-95"
                title="Iniciar Sesión"
              >
                <LogIn className="size-5 md:size-6 shrink-0 transition-transform duration-500 ease-out group-hover:scale-125 group-hover:translate-x-0.5" />
                <span className="hidden sm:inline text-sm font-bold transition-transform duration-500 ease-out group-hover:translate-x-0.5">
                  Iniciar Sesión
                </span>
              </Link>
            )}
            {showHamburger && (
            <div className="relative">
                  <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex items-center justify-center text-foreground hover:text-foreground/80 cursor-pointer transition-all active:scale-95"
                  >
                    <AnimatePresence mode="wait" initial={false}>
                      {isOpen ? (
                        <motion.div
                          key="close"
                          initial={{ opacity: 0, rotate: -90, scale: 0.8 }}
                          animate={{ opacity: 1, rotate: 0, scale: 1 }}
                          exit={{ opacity: 0, rotate: 90, scale: 0.8 }}
                          transition={{ duration: 0.2 }}
                        >
                          <X className="size-6 md:size-8" />
                        </motion.div>
                      ) : (
                        <motion.div
                          key="menu"
                          initial={{ opacity: 0, rotate: 90, scale: 0.8 }}
                          animate={{ opacity: 1, rotate: 0, scale: 1 }}
                          exit={{ opacity: 0, rotate: -90, scale: 0.8 }}
                          transition={{ duration: 0.2 }}
                        >
                          <MenuIcon className="size-6 md:size-8" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </button>
                  {!isOpen && canManage && pendingDevices > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-amber-500 text-[10px] font-bold text-white animate-pulse pointer-events-none">
                      {pendingDevices}
                    </span>
                  )}
              </div>
            )}
          </div>
        </div>
      </header>

      {showBreadcrumb && (
        <div 
          style={{ top: 'calc(var(--banner-height, 0px) + 56px)' }}
          className="fixed left-0 md:hidden w-full px-6 py-3 border-b border-border/40 bg-card z-[99]"
        >
          <BreadcrumbNav />
        </div>
      )}

      {showHamburger && <Menu isOpen={isOpen} setIsOpen={setIsOpen} user={user} />}

      {mounted && createPortal(
        <AnimacionLogoTrifinio isOpen={isFullScreen} onClose={() => setIsFullScreen(false)} />,
        document.body
      )}
    </>
  );
}
