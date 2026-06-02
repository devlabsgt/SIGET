"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Swal from "sweetalert2";
import { BookOpen, Globe, KeyRound, LogIn, LogOut, Settings, ShieldAlert, Smartphone, User, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/utils/supabase/client";
import { useUserContext } from "@/components/(base)/providers/UserProvider";
import { AuroraText } from "@/components/ui/aurora-text";
import { PushNotificationToggle } from "@/components/ui/PushNotificationToggle";
import {
  ADMIN_MENU_OPTIONS,
  OBSERVATORIO_MENU_OPTIONS,
  getPerfilMenuOptions,
  getVisibleDashboardModules,
  type DashboardModule,
} from "@/components/(base)/dashboard/modules";
import { useAppSettings } from "@/components/(base)/(settings)/hooks";
import VerPerfil from "@/components/(base)/(users)/profile/VerPerfil";
import PassKeysModal from "@/components/(base)/layout/modals/PassKeysModal";
import ManualUsuarioModal from "@/components/(base)/layout/modals/ManualUsuarioModal";

const MENU_OPTION_ICONS: Record<string, LucideIcon> = {
  "movilidad-humana": Globe,
  "mi-perfil": User,
  "ingreso-seguro": KeyRound,
  dispositivos: Smartphone,
  usuarios: Users,
  configuraciones: Settings,
};

const MODULE_ICONS: Record<string, LucideIcon> = {
  observatorio: Globe,
  perfil: User,
  admin: Settings,
};

type MenuAccordionOption = {
  id: string;
  title: string;
  desc: string;
  href?: string;
};

function MenuAccordionIcon({ optionId }: { optionId: string }) {
  const Icon = MENU_OPTION_ICONS[optionId] ?? User;
  return <Icon className="size-6 shrink-0 text-celeste-trifinio" strokeWidth={2} aria-hidden />;
}

function MenuAccordion({
  id,
  title,
  subtitle,
  desc,
  options,
  pathname,
  open,
  onToggle,
  isRouteActive,
  onNavigate,
  onOptionClick,
}: {
  id: string;
  title: string;
  subtitle?: string;
  desc: string;
  options: readonly MenuAccordionOption[];
  pathname: string;
  open: boolean;
  onToggle: () => void;
  isRouteActive: boolean;
  onNavigate: () => void;
  onOptionClick?: (optionId: string) => void;
}) {
  const isExpanded = open || isRouteActive;

  return (
    <div
      id={id}
      className={cn(
        "overflow-hidden transition-colors duration-300 ease-out",
        open && "bg-zinc-100 dark:bg-zinc-800/70",
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className={cn(
          "relative flex w-full items-center gap-3 px-5 py-3.5 text-left transition-colors duration-300 cursor-pointer",
          !open && "hover:bg-muted/50 dark:hover:bg-white/5",
        )}
      >
        <span
          className={cn(
            "absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-celeste-trifinio transition-all duration-300 ease-out",
            isExpanded ? "opacity-100 scale-y-100" : "opacity-0 scale-y-50",
          )}
        />
        <div className="min-w-0 flex-1 pl-1">
          <p
            className={cn(
              "text-xs font-black uppercase leading-tight bg-gradient-to-r from-celeste-trifinio to-celeste-trifinio bg-clip-text transition-[background-size,color] duration-500 ease-out",
              open
                ? "bg-[length:100%_100%] text-transparent"
                : "bg-[length:0%_100%] text-foreground",
            )}
          >
            {title}
            {subtitle ? ` ${subtitle}` : ""}
          </p>
          <p className="text-[10px] text-muted-foreground leading-snug mt-0.5 line-clamp-1">
            {desc}
          </p>
        </div>
      </button>

      <div
        className={cn(
          "grid transition-[grid-template-rows] duration-300 ease-in-out",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="overflow-hidden">
          <div className="flex flex-col">
            {options.map((opt, index) => {
              const isActive = opt.href
                ? pathname === opt.href || pathname.startsWith(`${opt.href}/`)
                : false;

              const itemClassName = cn(
                "flex w-full items-center gap-3 px-5 py-3 text-left transition-colors duration-200 cursor-pointer",
                open ? "translate-y-0 opacity-100" : "-translate-y-1 opacity-0",
                isActive
                  ? "bg-zinc-200/80 dark:bg-zinc-700/60"
                  : "hover:bg-zinc-200/80 dark:hover:bg-zinc-700/60",
              );

              const itemContent = (
                <>
                  <MenuAccordionIcon optionId={opt.id} />
                  <div className="min-w-0">
                    <p className="text-sm font-bold leading-tight text-foreground">
                      {opt.title}
                    </p>
                    <p className="text-[10px] text-muted-foreground leading-snug truncate mt-0.5">
                      {opt.desc}
                    </p>
                  </div>
                </>
              );

              if (opt.href) {
                return (
                  <Link
                    key={opt.id}
                    id={`${id}-${opt.id}`}
                    href={opt.href}
                    onClick={onNavigate}
                    style={{ transitionDelay: open ? `${index * 40}ms` : "0ms" }}
                    className={itemClassName}
                  >
                    {itemContent}
                  </Link>
                );
              }

              return (
                <button
                  key={opt.id}
                  id={`${id}-${opt.id}`}
                  type="button"
                  onClick={() => {
                    onOptionClick?.(opt.id);
                    onNavigate();
                  }}
                  style={{ transitionDelay: open ? `${index * 40}ms` : "0ms" }}
                  className={itemClassName}
                >
                  {itemContent}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

interface MenuProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  user: any;
}

function MenuModuleLink({
  mod,
  pathname,
  onNavigate,
}: {
  mod: DashboardModule;
  pathname: string;
  onNavigate: () => void;
}) {
  const isActive = pathname === mod.href || pathname.startsWith(`${mod.href}/`);
  const Icon = MODULE_ICONS[mod.id] ?? User;

  return (
    <Link
      id={`menu-${mod.id}`}
      href={mod.href}
      onClick={onNavigate}
      className={cn(
        "flex items-center gap-3 px-5 py-3.5 transition-colors cursor-pointer",
        isActive
          ? "bg-zinc-100 dark:bg-zinc-800/70"
          : "hover:bg-muted/50 dark:hover:bg-white/5",
      )}
    >
      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted/60 dark:bg-white/10">
        <Icon className="size-5 text-celeste-trifinio" strokeWidth={2.25} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-black uppercase leading-tight text-foreground">
          {mod.title}
          {mod.subtitle ? ` ${mod.subtitle}` : ""}
        </p>
        <p className="text-[10px] text-muted-foreground leading-snug mt-0.5 line-clamp-2">
          {mod.desc}
        </p>
      </div>
    </Link>
  );
}

type MenuAccordionId = "observatorio" | "perfil" | "admin";

export default function Menu({ isOpen, setIsOpen, user }: MenuProps) {
  const pathname = usePathname();
  const { realRole, effectiveRole, simulatedRole, setSimulatedRole } = useUserContext();
  const { data: appSettings } = useAppSettings();
  const [openAccordionId, setOpenAccordionId] = useState<MenuAccordionId | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isPasskeysOpen, setIsPasskeysOpen] = useState(false);
  const [isManualOpen, setIsManualOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const menuTop =
    "top-[calc(var(--banner-height,0px)+var(--mobile-header-height)+var(--mobile-breadcrumb-height))] md:top-[calc(var(--banner-height,0px)+4rem)]";
  const menuHeight =
    "h-[calc(100dvh-var(--banner-height,0px)-var(--mobile-header-height)-var(--mobile-breadcrumb-height))] md:h-[calc(100dvh-var(--banner-height,0px)-4rem)]";

  const metadata = user?.user_metadata || {};
  const usuario = metadata.username || user?.email?.split("@")[0] || "—";
  const nombre = metadata.nombre || "—";

  const visibleModules = user ? getVisibleDashboardModules(effectiveRole) : [];
  const mainModules = visibleModules.filter(
    (mod) => mod.id !== "admin" && mod.id !== "observatorio" && mod.id !== "perfil",
  );
  const adminModule = visibleModules.find((mod) => mod.id === "admin");
  const observatorioModule = visibleModules.find((mod) => mod.id === "observatorio");
  const perfilModule = visibleModules.find((mod) => mod.id === "perfil");
  const isAdminRoute = pathname.startsWith("/siget/admin");
  const isObservatorioRoute = pathname.startsWith("/siget/observatorio");
  const passkeysEnabled = appSettings?.enable_passkeys ?? false;
  const perfilMenuOptions = getPerfilMenuOptions(passkeysEnabled);
  const manualUsuarioPath = appSettings?.manual_usuario_url ?? null;
  const canManageManual = realRole === "super";

  const toggleAccordion = (id: MenuAccordionId) => {
    setOpenAccordionId((current) => (current === id ? null : id));
  };

  useEffect(() => {
    if (isAdminRoute) setOpenAccordionId("admin");
  }, [isAdminRoute]);

  useEffect(() => {
    if (isObservatorioRoute) setOpenAccordionId("observatorio");
  }, [isObservatorioRoute]);

  useEffect(() => {
    if (!passkeysEnabled && isPasskeysOpen) setIsPasskeysOpen(false);
  }, [passkeysEnabled, isPasskeysOpen]);

  useEffect(() => {
    if (isProfileOpen || (isPasskeysOpen && passkeysEnabled)) setOpenAccordionId("perfil");
  }, [isProfileOpen, isPasskeysOpen, passkeysEnabled]);

  const handlePerfilOptionClick = (optionId: string) => {
    if (optionId === "mi-perfil") setIsProfileOpen(true);
    if (optionId === "ingreso-seguro" && passkeysEnabled) setIsPasskeysOpen(true);
  };

  const handleLogout = async () => {
    setIsOpen(false);
    const isDark = document.documentElement.classList.contains("dark");
    const result = await Swal.fire({
      title: "¿Cerrar sesión?",
      text: "Se cerrará tu sesión actual.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: isDark ? "#2c5f9b" : "#2563eb",
      cancelButtonColor: "#ef4444",
      confirmButtonText: "Sí, salir",
      cancelButtonText: "Cancelar",
      background: isDark ? "#252526" : "#ffffff",
      color: isDark ? "#cccccc" : "#000000",
    });

    if (result.isConfirmed) {
      const supabase = createClient();
      await supabase.auth.signOut();
      window.location.replace("/");
    }
  };

  return (
    <>
      {mounted &&
        createPortal(
          <>
            {isOpen && (
              <div
                className="fixed inset-0 z-[99] bg-background/40"
                onClick={() => setIsOpen(false)}
                aria-hidden="true"
              />
            )}

            <aside
              className={cn(
                "fixed right-0 z-[110] pointer-events-auto w-full sm:w-100 bg-card border-l border-border/40 transition-transform duration-500 overflow-y-auto flex flex-col",
                menuTop,
                menuHeight,
                isOpen ? "translate-x-0" : "translate-x-full pointer-events-none",
              )}
            >
        {user ? (
          <>
            <div className="flex w-full shrink-0 items-center justify-between px-6 h-[var(--mobile-breadcrumb-height)] md:h-auto md:pt-6 md:pb-4">
              <button
                type="button"
                onClick={handleLogout}
                className="group flex items-center justify-center gap-2 text-red-500 dark:text-red-400 cursor-pointer transition-colors duration-300 active:scale-95"
              >
                <LogOut className="size-4 md:size-6 shrink-0 rotate-180 transition-transform duration-500 ease-out group-hover:scale-125 group-hover:-translate-x-0.5" />
                <span className="text-sm font-bold bg-[linear-gradient(currentColor,currentColor)] bg-[length:0%_2px] bg-left-bottom bg-no-repeat transition-[background-size] duration-300 ease-out group-hover:bg-[length:100%_2px]">
                  Cerrar Sesión
                </span>
              </button>
              <PushNotificationToggle />
            </div>

            <div className="px-6">
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Usuario:
                  </p>
                  <p className="font-bold leading-tight text-celeste-trifinio truncate">{usuario}</p>
                </div>
                <div className="min-w-0 text-right">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Rol:
                  </p>
                  <p className="font-bold leading-tight text-celeste-trifinio uppercase truncate">
                    {effectiveRole}
                  </p>
                </div>
                <div className="col-span-2 min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Nombre:
                  </p>
                  <p className="font-bold leading-tight text-celeste-trifinio truncate">{nombre}</p>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="p-6" />
        )}

        {user && (
          <div className="px-6 pt-4">
            <button
              type="button"
              onClick={() => setIsManualOpen(true)}
              className="group flex w-full items-center gap-3 rounded-xl border border-celeste-trifinio/30 bg-celeste-trifinio/5 px-4 py-3 text-left transition-colors duration-300 hover:bg-celeste-trifinio/10 cursor-pointer active:scale-[0.99]"
            >
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-celeste-trifinio/15">
                <BookOpen className="size-5 text-celeste-trifinio" strokeWidth={2.25} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-black uppercase leading-tight text-foreground">
                  Manual de Usuario
                </p>
                <p className="text-[10px] text-muted-foreground leading-snug mt-0.5 line-clamp-1">
                  Consulta la guía completa del sistema
                </p>
              </div>
            </button>
          </div>
        )}

        <div className="flex flex-col flex-1 py-6 pb-8">
          {user ? (
            <>
              {(mainModules.length > 0 || observatorioModule || perfilModule || adminModule) && (
                <nav className="mb-6 flex flex-col divide-y divide-border/25">
                  {observatorioModule && (
                    <MenuAccordion
                      id="menu-observatorio"
                      title={observatorioModule.title}
                      subtitle={observatorioModule.subtitle}
                      desc={observatorioModule.desc}
                      options={OBSERVATORIO_MENU_OPTIONS}
                      pathname={pathname}
                      open={openAccordionId === "observatorio"}
                      onToggle={() => toggleAccordion("observatorio")}
                      isRouteActive={isObservatorioRoute}
                      onNavigate={() => setIsOpen(false)}
                    />
                  )}

                  {perfilModule && (
                    <MenuAccordion
                      id="menu-perfil"
                      title={perfilModule.title}
                      subtitle={perfilModule.subtitle}
                      desc={perfilModule.desc}
                      options={perfilMenuOptions}
                      pathname={pathname}
                      open={openAccordionId === "perfil"}
                      onToggle={() => toggleAccordion("perfil")}
                      isRouteActive={isProfileOpen || (isPasskeysOpen && passkeysEnabled)}
                      onNavigate={() => setIsOpen(false)}
                      onOptionClick={handlePerfilOptionClick}
                    />
                  )}

                  {mainModules.map((mod) => (
                    <MenuModuleLink
                      key={mod.id}
                      mod={mod}
                      pathname={pathname}
                      onNavigate={() => setIsOpen(false)}
                    />
                  ))}

                  {adminModule && (
                    <MenuAccordion
                      id="menu-admin"
                      title={adminModule.title}
                      subtitle={adminModule.subtitle}
                      desc={adminModule.desc}
                      options={ADMIN_MENU_OPTIONS}
                      pathname={pathname}
                      open={openAccordionId === "admin"}
                      onToggle={() => toggleAccordion("admin")}
                      isRouteActive={isAdminRoute}
                      onNavigate={() => setIsOpen(false)}
                    />
                  )}
                </nav>
              )}
            </>
          ) : (
            <div className="mb-8 mt-2">
              <Link
                href="/login"
                onClick={() => setIsOpen(false)}
                className="group flex items-center justify-center gap-2 w-full text-celeste-trifinio hover:text-celeste-trifinio/80 cursor-pointer transition-colors duration-300 active:scale-95 py-2"
              >
                <LogIn className="size-5 md:size-6 shrink-0 transition-transform duration-500 ease-out group-hover:scale-125 group-hover:translate-x-0.5" />
                <span className="text-sm font-bold transition-transform duration-500 ease-out group-hover:translate-x-0.5">
                  Iniciar Sesión
                </span>
              </Link>
            </div>
          )}
        </div>

        {user && realRole === "super" && (
          <div className="mt-auto px-6 pb-3">
            <div className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/50 p-3 rounded-xl">
              <ShieldAlert className="size-5 text-yellow-600 shrink-0" />
              <select
                value={simulatedRole || ""}
                onChange={(e) => setSimulatedRole(e.target.value || null)}
                className="bg-transparent text-xs font-bold text-yellow-700 outline-none cursor-pointer w-full"
              >
                <option value="">Rol Real: {realRole.toUpperCase()}</option>
                <option value="admin">Simular: ADMIN</option>
                <option value="admin-observatorio">Simular: ADMIN-OBSERVATORIO</option>
                <option value="observatorio">Simular: OBSERVATORIO</option>
                <option value="user">Simular: USER</option>
              </select>
            </div>
          </div>
        )}
        <div className={cn("px-6 py-4", !(user && realRole === "super") && "mt-auto")}>
          <div className="flex flex-col items-center justify-center gap-1">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 dark:text-zinc-400">
              © 2026 SIGET
            </p>
            <div className="text-xs font-bold uppercase tracking-widest text-zinc-600 dark:text-zinc-400 flex items-center gap-1 mt-1">
              Powered by{" "}
              <a
                href="https://www.oscar27jimenez.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline cursor-pointer transition-all inline-flex items-center text-zinc-900 dark:text-zinc-100"
              >
                <AuroraText className="text-xs whitespace-nowrap">
                  Kore | Ing. de Software
                </AuroraText>
              </a>
            </div>
          </div>
        </div>
      </aside>
          </>,
          document.body,
        )}

      {user && (
        <>
          <VerPerfil
            isOpen={isProfileOpen}
            onClose={() => setIsProfileOpen(false)}
            userId={null}
          />
          {passkeysEnabled && (
            <PassKeysModal
              isOpen={isPasskeysOpen}
              onClose={() => setIsPasskeysOpen(false)}
              user={user}
            />
          )}
          <ManualUsuarioModal
            isOpen={isManualOpen}
            onClose={() => setIsManualOpen(false)}
            manualPath={manualUsuarioPath}
            canManage={canManageManual}
          />
        </>
      )}
    </>
  );
}
