"use client";

import { useState, useEffect } from "react";
import { useAppSettings, useUpdateAppSettings } from "./hooks";
import { Settings, Shield, Key, Loader2 } from "lucide-react";

const toggleClassName =
  "w-11 h-6 bg-muted border border-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-background after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-background after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-celeste-trifinio dark:peer-checked:bg-celeste-trifinio";

export default function AppSettings() {
  const { data: settings, isLoading, isError } = useAppSettings();
  const { mutate: updateSettings, isPending } = useUpdateAppSettings();

  const [requireAuth, setRequireAuth] = useState<boolean>(false);
  const [enablePasskeys, setEnablePasskeys] = useState<boolean>(false);

  useEffect(() => {
    if (settings) {
      setRequireAuth(settings.require_device_authorization);
      setEnablePasskeys(settings.enable_passkeys);
    }
  }, [settings]);

  if (isLoading) {
    return (
      <div className="flex h-40 w-full items-center justify-center px-4 pt-4 md:pt-28">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="px-4 pt-4 md:pt-28">
        <div className="rounded-lg bg-red-500/10 p-4 font-medium text-red-600 dark:text-red-400">
          Error al cargar los ajustes del sistema.
        </div>
      </div>
    );
  }

  const handleAuthChange = (checked: boolean) => {
    setRequireAuth(checked);
    updateSettings({
      id: settings?.id,
      require_device_authorization: checked,
      enable_passkeys: enablePasskeys,
    });
  };

  const handlePasskeysChange = (checked: boolean) => {
    setEnablePasskeys(checked);
    updateSettings({
      id: settings?.id,
      require_device_authorization: requireAuth,
      enable_passkeys: checked,
    });
  };

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 pb-10 pt-4 md:pt-28">
      <div className="flex w-full flex-col items-center gap-1 text-center">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-amber-500/10 p-2">
            <Settings className="size-5 text-amber-600 dark:text-amber-400" />
          </div>
          <h1 className="text-3xl font-bold tracking-tighter text-foreground">
            Configuraciones
          </h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Ajustes generales del sistema y seguridad.
        </p>
      </div>

      <div className="flex w-full flex-col divide-y divide-border/25 overflow-hidden rounded-2xl border border-border/80 bg-card">
        <div className="flex items-center justify-between gap-4 p-4 md:p-5 transition-colors hover:bg-muted/50 dark:hover:bg-white/5">
          <div className="flex min-w-0 items-center gap-4">
            <div className="rounded-lg bg-amber-500/10 p-2.5">
              <Shield className="size-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="min-w-0 space-y-0.5 text-left">
              <h3 className="text-base font-semibold text-foreground">
                Autorización de dispositivos
              </h3>
              <p className="text-xs text-muted-foreground">
                Requerir aprobación manual para nuevos dispositivos.
              </p>
            </div>
          </div>
          <label className="relative inline-flex shrink-0 cursor-pointer items-center">
            <input
              type="checkbox"
              className="peer sr-only"
              checked={requireAuth}
              disabled={isPending}
              onChange={(e) => handleAuthChange(e.target.checked)}
            />
            <div className={toggleClassName} />
          </label>
        </div>

        <div className="flex items-center justify-between gap-4 p-4 md:p-5 transition-colors hover:bg-muted/50 dark:hover:bg-white/5">
          <div className="flex min-w-0 items-center gap-4">
            <div className="rounded-lg bg-purple-500/10 p-2.5">
              <Key className="size-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="min-w-0 space-y-0.5 text-left">
              <h3 className="text-base font-semibold text-foreground">
                Habilitar Passkeys
              </h3>
              <p className="text-xs text-muted-foreground">
                Permitir el inicio de sesión sin contraseña.
              </p>
            </div>
          </div>
          <label className="relative inline-flex shrink-0 cursor-pointer items-center">
            <input
              type="checkbox"
              className="peer sr-only"
              checked={enablePasskeys}
              disabled={isPending}
              onChange={(e) => handlePasskeysChange(e.target.checked)}
            />
            <div className={toggleClassName} />
          </label>
        </div>
      </div>
    </div>
  );
}
