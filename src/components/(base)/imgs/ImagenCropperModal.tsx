"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Cropper, { Area } from "react-easy-crop";
import { Loader2, RotateCw, X, ZoomIn, ZoomOut } from "lucide-react";
import { toast } from "react-toastify";
import { cn } from "@/lib/utils";
import { cropImage, type PixelCrop } from "./cropImage";
import {
  compressImagenFile,
  MAX_IMAGEN_BYTES,
  MEMORIA_IMAGEN_ASPECT,
} from "./constants";

const ZOOM_MAX = 3;
const ZOOM_FLOOR = 0.2;
const modalEase = [0.4, 0, 0.2, 1] as const;

export default function ImagenCropperModal({
  open,
  imageSrc,
  onClose,
  onApply,
}: {
  open: boolean;
  imageSrc: string;
  onClose: () => void;
  onApply: (file: File) => Promise<void>;
}) {
  const reduceMotion = useReducedMotion();
  const cropContainerRef = useRef<HTMLDivElement>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [minZoom, setMinZoom] = useState(ZOOM_FLOOR);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<PixelCrop | null>(
    null,
  );
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const onCropComplete = useCallback((_area: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const handleMediaLoaded = useCallback(
    (mediaSize: {
      width: number;
      height: number;
      naturalWidth: number;
      naturalHeight: number;
    }) => {
      const el = cropContainerRef.current;
      if (!el) return;

      const { width: containerWidth, height: containerHeight } =
        el.getBoundingClientRect();
      if (!containerWidth || !containerHeight) return;

      const fitZoom = Math.min(
        containerWidth / mediaSize.width,
        containerHeight / mediaSize.height,
      );
      const computedMin = Math.max(ZOOM_FLOOR, fitZoom * 0.45);
      const initialZoom = Math.min(1, Math.max(computedMin, fitZoom * 0.98));
      setMinZoom(computedMin);
      setZoom(initialZoom);
      setCrop({ x: 0, y: 0 });
    },
    [],
  );

  const handleRotate = () => {
    setRotation((r) => r + 90);
    setCrop({ x: 0, y: 0 });
  };

  const handleApply = async () => {
    if (!croppedAreaPixels) return;
    setUploading(true);
    try {
      const blob = await cropImage(imageSrc, croppedAreaPixels, rotation);
      let file = new File([blob], "imagen.jpg", { type: "image/jpeg" });
      file = await compressImagenFile(file);

      if (file.size > MAX_IMAGEN_BYTES) {
        toast.error("La imagen supera los 200 KB. Intente con una más pequeña.");
        return;
      }

      await onApply(file);
      onClose();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Error al procesar la imagen.";
      toast.error(message);
    } finally {
      setUploading(false);
    }
  };

  const overlayTransition = reduceMotion
    ? { duration: 0 }
    : { duration: 0.25, ease: modalEase };

  const panelTransition = reduceMotion
    ? { duration: 0 }
    : { duration: 0.3, ease: modalEase };

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          key="imagen-cropper-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={overlayTransition}
          className={cn(
            "fixed inset-0 z-[210] flex",
            "max-md:h-dvh max-md:flex-col max-md:bg-zinc-100 dark:max-md:bg-zinc-900",
            "md:items-center md:justify-center md:bg-zinc-700/20 md:p-6 md:backdrop-blur-sm",
          )}
        >
          <motion.div
            initial={
              reduceMotion
                ? { opacity: 1 }
                : { opacity: 0, y: 20, scale: 0.97 }
            }
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={
              reduceMotion
                ? { opacity: 0 }
                : { opacity: 0, y: 14, scale: 0.98 }
            }
            transition={panelTransition}
            className={cn(
              "flex min-h-0 w-full flex-col overflow-hidden bg-zinc-100 dark:bg-zinc-800",
              "max-md:h-full max-md:max-w-none",
              "md:max-h-[92dvh] md:max-w-2xl md:rounded-3xl md:border md:border-border md:shadow-lg dark:md:border-zinc-700",
            )}
          >
            <div className="flex shrink-0 items-center justify-between px-5 pt-[max(1.25rem,env(safe-area-inset-top))] md:px-6 md:pt-6">
              <h3 className="text-base font-black text-foreground md:text-lg">
                Recortar imagen
              </h3>
              <button
                type="button"
                onClick={onClose}
                disabled={uploading}
                className="flex h-10 w-10 items-center justify-center rounded-xl text-celeste-trifinio transition-colors hover:bg-celeste-trifinio/10 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div
              ref={cropContainerRef}
              className="relative mx-5 mt-3 min-h-[min(52dvh,520px)] flex-1 overflow-hidden rounded-2xl bg-white md:mx-6 md:mt-4 md:min-h-[min(58dvh,560px)]"
            >
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                minZoom={minZoom}
                maxZoom={ZOOM_MAX}
                rotation={rotation}
                aspect={MEMORIA_IMAGEN_ASPECT}
                objectFit="contain"
                restrictPosition={false}
                showGrid
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onRotationChange={setRotation}
                onCropComplete={onCropComplete}
                onMediaLoaded={handleMediaLoaded}
                style={{
                  containerStyle: { background: "#ffffff" },
                  mediaStyle: { background: "#ffffff" },
                  cropAreaStyle: { border: "2px solid #059669" },
                }}
              />
            </div>

            <div className="shrink-0 space-y-3 px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] md:px-6 md:pb-6">
              <div className="flex items-center gap-3">
                <ZoomOut className="h-4 w-4 shrink-0 text-muted-foreground" />
                <input
                  type="range"
                  min={minZoom}
                  max={ZOOM_MAX}
                  step={0.05}
                  value={Math.max(minZoom, Math.min(ZOOM_MAX, zoom))}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="flex-1 accent-emerald-600"
                />
                <ZoomIn className="h-4 w-4 shrink-0 text-muted-foreground" />
              </div>

              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={handleRotate}
                  className="inline-flex h-9 items-center gap-2 rounded-lg bg-zinc-200 px-4 text-xs font-bold text-zinc-700 transition-colors hover:bg-zinc-300 cursor-pointer dark:bg-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-600"
                >
                  Rotar Imagen
                  <RotateCw className="h-4 w-4 shrink-0" />
                </button>
              </div>

              <div className="flex items-center justify-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={uploading}
                  className="inline-flex h-11 flex-1 items-center justify-center rounded-xl border-0 bg-zinc-200 px-6 text-[10px] font-bold uppercase tracking-widest text-zinc-700 transition-colors hover:bg-zinc-300 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer dark:bg-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-600 md:flex-none"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleApply}
                  disabled={uploading || !croppedAreaPixels}
                  className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border-0 bg-emerald-200 px-6 text-[10px] font-bold uppercase tracking-widest text-emerald-900 transition-colors hover:bg-emerald-300 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer dark:bg-emerald-800/70 dark:text-emerald-50 dark:hover:bg-emerald-700/80 md:flex-none"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Subiendo…
                    </>
                  ) : (
                    "Guardar"
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
