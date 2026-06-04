"use client";

import { useState, useEffect } from "react";
import { User, Loader2, Shield } from "lucide-react";
import { MagicCard } from "@/components/ui/magic-card";
import { useProfile } from "./lib/hooks";
import {
  useUser,
  useUserContext,
} from "@/components/(base)/providers/UserProvider";
import {
  canManageUsers,
  isUserVisibleToActor,
} from "@/components/(base)/(users)/usuarios/lib/permissions";
import { InfoPerfil } from "./forms/InfoPerfil";
import { InfoUser } from "./forms/InfoUser";
import { cn } from "@/lib/utils";

interface VerPerfilProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string | null;
}

export default function VerPerfil({ isOpen, onClose, userId }: VerPerfilProps) {
  const sessionUser = useUser();
  const { effectiveRole } = useUserContext();
  const [view, setView] = useState<"perfil" | "usuario">("perfil");

  const targetId = userId || sessionUser?.id || "";
  const isSelf = sessionUser?.id === targetId;

  const { profile, loading } = useProfile(targetId, isOpen);

  const canEdit =
    isSelf ||
    (!!profile?.rol &&
      canManageUsers(effectiveRole) &&
      isUserVisibleToActor(profile.rol, effectiveRole));

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-background/60 backdrop-blur-md">
      <div className="flex min-h-full items-center justify-center p-4 sm:p-6">
        <MagicCard
          className={cn(
            "w-full flex flex-col rounded-3xl border border-border/60 bg-card overflow-hidden shadow-none max-h-[calc(100dvh-2rem)]",
            "max-w-md lg:max-w-7xl xl:max-w-[90rem]",
          )}
        >
          <div className="relative shrink-0 px-4 sm:px-6 border-b border-border/40 bg-muted/5 pt-4 pb-3 lg:pt-5 lg:pb-4">
            <h2 className="w-full text-lg font-semibold tracking-tight text-foreground truncate lg:text-sm">
              {profile?.nombre || "Usuario"}
            </h2>

            <div className="lg:hidden mt-3 flex w-full items-center rounded-xl border border-border/40 bg-muted/50 p-1">
              <button
                type="button"
                onClick={() => setView("usuario")}
                className={cn(
                  "flex-1 justify-center px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-200 flex items-center gap-1.5",
                  view === "usuario"
                    ? "bg-purple-700 text-purple-200 dark:bg-purple-900 dark:text-purple-200 ring-1 ring-purple-200 dark:ring-purple-900"
                    : "text-muted-foreground",
                )}
              >
                <Shield size={12} />
                Accesos
              </button>
              <button
                type="button"
                onClick={() => setView("perfil")}
                className={cn(
                  "flex-1 justify-center px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-200 flex items-center gap-1.5",
                  view === "perfil"
                    ? "bg-blue-700 text-blue-200 dark:bg-blue-900 dark:text-blue-300 ring-1 ring-blue-200 dark:ring-blue-900"
                    : "text-muted-foreground",
                )}
              >
                <User size={12} />
                Información
              </button>
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto bg-background/50 custom-scrollbar px-4 sm:px-6 py-4 lg:py-3">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-40 gap-3 text-muted-foreground">
                <Loader2 className="animate-spin" size={32} />
                <p className="text-sm">Cargando información...</p>
              </div>
            ) : (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className={cn(view !== "perfil" && "max-lg:hidden")}>
                  <InfoPerfil
                    userId={targetId}
                    canEdit={canEdit}
                    onClose={onClose}
                  />
                </div>
                <div
                  className={cn(view === "usuario" ? "lg:hidden" : "hidden")}
                >
                  <InfoUser
                    userId={targetId}
                    canEdit={canEdit}
                    onClose={onClose}
                    onViewChange={setView}
                  />
                </div>
              </div>
            )}
          </div>
        </MagicCard>
      </div>
    </div>
  );
}
