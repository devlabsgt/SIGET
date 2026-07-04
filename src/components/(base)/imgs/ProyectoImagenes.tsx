"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Camera, ImagePlus, Loader2, X } from "lucide-react";
import { toast } from "react-toastify";
import { createClient } from "@/utils/supabase/client";
import { cn } from "@/lib/utils";
import ImagenCropperModal from "./ImagenCropperModal";
import ImagenTile from "./ImagenTile";
import { confirmEliminarImagen } from "./swal";
import {
  ALLOWED_IMAGEN_TYPES,
  generateImagenStoragePath,
  isAllowedImagenType,
  MEMORIA_IMAGENES_BUCKET,
  MEMORIA_MAX_IMAGENES,
} from "./constants";

const listItemMotionProps = {
  layout: true,
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8, scale: 0.99 },
  transition: { duration: 0.28, ease: [0.4, 0, 0.2, 1] as const },
} as const;

const tileClass =
  "relative aspect-[3/4] w-full overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-800";

function ImagenViewer({
  url,
  onClose,
}: {
  url: string;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[210] flex items-center justify-center bg-zinc-900/80 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white transition-colors hover:bg-white/20 cursor-pointer"
      >
        <X className="h-5 w-5" />
      </button>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt="Imagen del proyecto"
        onClick={(e) => e.stopPropagation()}
        className="max-h-[85dvh] w-auto rounded-2xl object-contain shadow-2xl"
      />
    </div>
  );
}

export default function ProyectoImagenes({
  paths,
  onAdd,
  onRemove,
  disabled = false,
  readOnly = false,
  max = MEMORIA_MAX_IMAGENES,
}: {
  paths: string[];
  onAdd?: (path: string) => void | Promise<void>;
  onRemove?: (path: string) => void | Promise<void>;
  disabled?: boolean;
  readOnly?: boolean;
  max?: number;
}) {
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const previewUrlsRef = useRef<Map<string, string>>(new Map());
  const [cropperSrc, setCropperSrc] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    return () => {
      for (const url of previewUrlsRef.current.values()) {
        URL.revokeObjectURL(url);
      }
      previewUrlsRef.current.clear();
    };
  }, []);

  const canAdd = !readOnly && !disabled && paths.length < max;

  const handlePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!isAllowedImagenType(file.type)) {
      toast.error("Solo se permiten imágenes JPEG, PNG o WEBP.");
      return;
    }
    setCropperSrc(URL.createObjectURL(file));
  };

  const closeCropper = () => {
    if (cropperSrc) URL.revokeObjectURL(cropperSrc);
    setCropperSrc(null);
  };

  const uploadFile = async (file: File) => {
    if (!onAdd) {
      toast.error("No se pudo registrar la imagen en el formulario.");
      return;
    }

    setBusy(true);
    const previewUrl = URL.createObjectURL(file);
    let uploadedPath: string | null = null;

    try {
      const supabase = createClient();
      const path = generateImagenStoragePath();
      const { error } = await supabase.storage
        .from(MEMORIA_IMAGENES_BUCKET)
        .upload(path, file, { contentType: "image/jpeg", upsert: false });
      if (error) throw error;

      uploadedPath = path;
      previewUrlsRef.current.set(path, previewUrl);
      setPreviewUrls((prev) => ({ ...prev, [path]: previewUrl }));

      await onAdd(path);
      toast.success("Imagen agregada.");
    } catch (err: unknown) {
      URL.revokeObjectURL(previewUrl);
      if (uploadedPath) {
        previewUrlsRef.current.delete(uploadedPath);
        setPreviewUrls((prev) => {
          const next = { ...prev };
          delete next[uploadedPath as string];
          return next;
        });
        const supabase = createClient();
        await supabase.storage
          .from(MEMORIA_IMAGENES_BUCKET)
          .remove([uploadedPath])
          .catch(() => undefined);
      }

      const message =
        err instanceof Error ? err.message : "No se pudo subir la imagen.";
      toast.error(message);
      throw err;
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (path: string) => {
    const result = await confirmEliminarImagen();
    if (!result.isConfirmed) return;
    setBusy(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.storage
        .from(MEMORIA_IMAGENES_BUCKET)
        .remove([path]);
      if (error) throw error;
      await onRemove?.(path);
      const localPreview = previewUrlsRef.current.get(path);
      if (localPreview) {
        URL.revokeObjectURL(localPreview);
        previewUrlsRef.current.delete(path);
        setPreviewUrls((prev) => {
          const next = { ...prev };
          delete next[path];
          return next;
        });
      }
      toast.success("Imagen eliminada.");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "No se pudo eliminar la imagen.";
      toast.error(message);
    } finally {
      setBusy(false);
    }
  };

  if (readOnly && paths.length === 0) return null;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <AnimatePresence mode="popLayout" initial={false}>
        {paths.map((path) => (
          <motion.div key={path} {...listItemMotionProps}>
            <ImagenTile
              path={path}
              previewUrl={previewUrls[path]}
              readOnly={readOnly}
              busy={busy}
              disabled={disabled}
              onView={setViewerUrl}
              onDelete={() => void handleDelete(path)}
            />
          </motion.div>
        ))}
      </AnimatePresence>

      {canAdd && (
        <motion.div {...listItemMotionProps} className={cn(tileClass, "bg-transparent")}>
          <input
            ref={galleryInputRef}
            type="file"
            accept={ALLOWED_IMAGEN_TYPES.join(",")}
            className="hidden"
            onChange={handlePick}
            disabled={busy}
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handlePick}
            disabled={busy}
          />
          <button
            type="button"
            onClick={() => galleryInputRef.current?.click()}
            disabled={busy}
            className="flex h-full w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-celeste-trifinio/60 bg-sky-50/50 text-azul-trifinio transition-colors hover:bg-sky-100/70 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer dark:bg-sky-950/20 dark:hover:bg-sky-950/40"
          >
            {busy ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <>
                <ImagePlus className="h-6 w-6" />
                <span className="text-[10px] font-bold uppercase tracking-widest">
                  Agregar
                </span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            disabled={busy}
            className="absolute bottom-1.5 right-1.5 flex h-8 w-8 items-center justify-center rounded-lg bg-azul-trifinio text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-50 cursor-pointer sm:hidden"
            title="Tomar foto"
          >
            <Camera className="h-4 w-4" />
          </button>
        </motion.div>
      )}

      <ImagenCropperModal
        open={cropperSrc !== null}
        imageSrc={cropperSrc ?? ""}
        onClose={closeCropper}
        onApply={uploadFile}
      />

      {viewerUrl && (
        <ImagenViewer url={viewerUrl} onClose={() => setViewerUrl(null)} />
      )}
    </div>
  );
}
