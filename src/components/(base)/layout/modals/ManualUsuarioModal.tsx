"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useQueryClient } from "@tanstack/react-query";
import { BookOpen, Loader2, Trash2, Upload, X } from "lucide-react";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import { cn } from "@/lib/utils";
import {
  deleteManualUsuario,
  getManualUsuarioSignedUrl,
  uploadManualUsuario,
} from "@/components/(base)/layout/modals/manual-usuario-actions";

const ManualPdfMobileViewer = dynamic(
  () => import("@/components/(base)/layout/modals/ManualPdfMobileViewer"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="size-8 animate-spin text-celeste-trifinio" />
      </div>
    ),
  },
);

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const sync = () => setIsMobile(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  return isMobile;
}

interface ManualUsuarioModalProps {
  isOpen: boolean;
  onClose: () => void;
  manualPath: string | null;
  canManage: boolean;
}

export default function ManualUsuarioModal({
  isOpen,
  onClose,
  manualPath,
  canManage,
}: ManualUsuarioModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const [busy, setBusy] = useState(false);
  const [manualUrl, setManualUrl] = useState<string | null>(null);
  const [loadingUrl, setLoadingUrl] = useState(false);

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

  useEffect(() => {
    if (!isOpen || !manualPath) {
      setManualUrl(null);
      return;
    }

    let cancelled = false;
    setLoadingUrl(true);

    getManualUsuarioSignedUrl(manualPath)
      .then((url) => {
        if (!cancelled) setManualUrl(url);
      })
      .catch(() => {
        if (!cancelled) setManualUrl(null);
      })
      .finally(() => {
        if (!cancelled) setLoadingUrl(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, manualPath]);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (file.type !== "application/pdf") {
      toast.error("Solo se permiten archivos PDF.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("El PDF no debe superar los 10 MB.");
      return;
    }

    setBusy(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      await uploadManualUsuario(formData);
      await queryClient.invalidateQueries({ queryKey: ["appSettings"] });
      toast.success("Manual de usuario actualizado.");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Error al subir el manual.";
      toast.error(message);
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!manualPath) return;
    const isDark = document.documentElement.classList.contains("dark");
    const result = await Swal.fire({
      title: "¿Eliminar manual?",
      text: "Se eliminará el manual de usuario actual.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: isDark ? "#3f3f46" : "#e4e4e7",
      confirmButtonText: "Eliminar",
      cancelButtonText: "Cancelar",
      background: isDark ? "#252526" : "#ffffff",
      color: isDark ? "#cccccc" : "#000000",
    });
    if (!result.isConfirmed) return;

    setBusy(true);
    try {
      await deleteManualUsuario();
      await queryClient.invalidateQueries({ queryKey: ["appSettings"] });
      toast.success("Manual de usuario eliminado.");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Error al eliminar el manual.";
      toast.error(message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center bg-black/65 backdrop-blur-sm sm:p-4"
      onClick={onClose}
    >
      <div
        className={cn(
          "flex flex-col bg-white dark:bg-zinc-950 overflow-hidden",
          "h-dvh w-full",
          "sm:h-[92vh] sm:w-full sm:max-w-3xl sm:rounded-2xl sm:border sm:border-slate-200 sm:dark:border-slate-800 sm:shadow-2xl",
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={handleFileChange}
          disabled={busy}
        />

        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 px-4 py-3">
          <div className="flex items-center gap-2 min-w-0">
            <BookOpen className="size-5 shrink-0 text-celeste-trifinio" />
            <h3 className="truncate text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
              Manual de Usuario
            </h3>
          </div>
          <div className="flex items-center gap-1.5">
            {canManage && (
              <>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={busy}
                  className="flex items-center justify-center rounded-xl bg-celeste-trifinio p-2 text-white transition-colors hover:bg-celeste-trifinio/90 disabled:opacity-40 cursor-pointer"
                  title="Subir manual"
                >
                  {busy ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Upload className="size-4" />
                  )}
                </button>
                {manualPath && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={busy}
                    className="flex items-center justify-center rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-2 text-red-600 dark:text-red-400 transition-colors hover:bg-red-100/80 dark:hover:bg-red-900/30 disabled:opacity-40 cursor-pointer"
                    title="Eliminar manual"
                  >
                    <Trash2 className="size-4" />
                  </button>
                )}
              </>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              title="Cerrar"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        <div className="relative min-h-0 flex-1 bg-slate-100 dark:bg-zinc-900">
          {loadingUrl ? (
            <div className="flex h-full w-full items-center justify-center">
              <Loader2 className="size-8 animate-spin text-celeste-trifinio" />
            </div>
          ) : manualUrl ? (
            isMobile ? (
              <ManualPdfMobileViewer url={manualUrl} />
            ) : (
              <iframe
                key={manualUrl}
                src={manualUrl}
                title="Manual de Usuario"
                className="h-full w-full"
              />
            )
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-3 px-6 text-center">
              <BookOpen className="size-12 text-slate-300 dark:text-slate-600" />
              <p className="text-sm font-bold text-slate-500 dark:text-slate-400">
                {manualPath
                  ? "No se pudo cargar el manual."
                  : "Aún no hay un manual de usuario disponible."}
              </p>
              {canManage && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={busy}
                  className="mt-2 flex items-center justify-center rounded-xl bg-celeste-trifinio p-3 text-white transition-colors hover:bg-celeste-trifinio/90 disabled:opacity-40 cursor-pointer"
                  title="Subir manual (PDF, máx. 10 MB)"
                >
                  {busy ? (
                    <Loader2 className="size-5 animate-spin" />
                  ) : (
                    <Upload className="size-5" />
                  )}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
