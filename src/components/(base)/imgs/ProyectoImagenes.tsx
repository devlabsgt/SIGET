"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Camera, ImagePlus, Loader2, Trash2, X } from "lucide-react";
import { toast } from "react-toastify";
import { createClient } from "@/utils/supabase/client";
import { cn } from "@/lib/utils";
import ImagenBatchCropperModal from "./ImagenBatchCropperModal";
import ImagenCropperModal from "./ImagenCropperModal";
import ImagenTile from "./ImagenTile";
import { confirmEliminarImagen, confirmEliminarTodasImagenes, alertDemasiadasImagenes } from "./swal";
import {
  ALLOWED_IMAGEN_TYPES,
  generateImagenStoragePath,
  imagenExistsInStorage,
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
  onReplace,
  disabled = false,
  readOnly = false,
  max = MEMORIA_MAX_IMAGENES,
}: {
  paths: string[];
  onAdd?: (path: string) => void | Promise<void>;
  onRemove?: (path: string) => void | Promise<void>;
  onReplace?: (oldPath: string, newPath: string) => void | Promise<void>;
  disabled?: boolean;
  readOnly?: boolean;
  max?: number;
}) {
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const previewUrlsRef = useRef<Map<string, string>>(new Map());
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(
    null,
  );
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const [editState, setEditState] = useState<{ path: string; src: string } | null>(
    null,
  );
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
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
  const slotsLeft = max - paths.length;

  const uploadToBucket = async (file: File): Promise<string> => {
    const supabase = createClient();
    const path = generateImagenStoragePath();
    const { error } = await supabase.storage
      .from(MEMORIA_IMAGENES_BUCKET)
      .upload(path, file, { contentType: "image/jpeg", upsert: false });
    if (error) throw error;

    const confirmed = await imagenExistsInStorage(supabase, path);
    if (!confirmed) {
      await supabase.storage
        .from(MEMORIA_IMAGENES_BUCKET)
        .remove([path])
        .catch(() => undefined);
      throw new Error(
        "La imagen no quedó registrada en storage. Intente de nuevo.",
      );
    }
    return path;
  };

  const removeFromBucket = async (path: string) => {
    const supabase = createClient();
    await supabase.storage
      .from(MEMORIA_IMAGENES_BUCKET)
      .remove([path])
      .catch(() => undefined);
  };

  const registerPreview = (path: string, file: File) => {
    const previewUrl = URL.createObjectURL(file);
    previewUrlsRef.current.set(path, previewUrl);
    setPreviewUrls((prev) => ({ ...prev, [path]: previewUrl }));
  };

  const dropPreview = (path: string) => {
    const previewUrl = previewUrlsRef.current.get(path);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrlsRef.current.delete(path);
    setPreviewUrls((prev) => {
      const next = { ...prev };
      delete next[path];
      return next;
    });
  };

  const addProcessedFile = async (processed: File) => {
    if (!onAdd) {
      toast.error("No se pudo registrar la imagen en el formulario.");
      throw new Error("onAdd no configurado");
    }

    const path = await uploadToBucket(processed);
    registerPreview(path, processed);
    try {
      await onAdd(path);
    } catch (err) {
      dropPreview(path);
      await removeFromBucket(path);
      throw err;
    }
  };

  const reopenPicker = (source: "gallery" | "camera") => {
    window.setTimeout(() => {
      if (source === "gallery") galleryInputRef.current?.click();
      else cameraInputRef.current?.click();
    }, 0);
  };

  const openBatchReview = async (
    files: File[],
    source: "gallery" | "camera",
  ) => {
    const remaining = max - paths.length;
    if (remaining <= 0) {
      const result = await alertDemasiadasImagenes(remaining, max);
      if (result.isConfirmed) reopenPicker(source);
      return;
    }

    const valid = files.filter((f) => isAllowedImagenType(f.type));
    const rejected = files.length - valid.length;

    if (rejected > 0) {
      toast.warn("Solo JPEG, PNG o WEBP.");
    }

    if (!valid.length) return;

    if (valid.length > remaining) {
      const result = await alertDemasiadasImagenes(remaining, max);
      if (result.isConfirmed) reopenPicker(source);
      return;
    }

    setPendingFiles(valid);
  };

  const handleBatchConfirm = async (processed: File[]) => {
    setBusy(true);
    setProgress({ done: 0, total: processed.length });
    let ok = 0;

    for (let i = 0; i < processed.length; i += 1) {
      try {
        await addProcessedFile(processed[i]);
        ok += 1;
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "No se pudo subir la imagen.";
        toast.error(message);
      } finally {
        setProgress({ done: i + 1, total: processed.length });
      }
    }

    setBusy(false);
    setProgress(null);
    if (ok > 0) {
      toast.success(
        ok === 1 ? "Imagen agregada al proyecto." : `${ok} imágenes agregadas.`,
      );
    }
  };

  const handleGalleryPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (!files.length) return;
    void openBatchReview(files, "gallery");
  };

  const handleCameraPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    void openBatchReview([file], "camera");
  };

  const startEdit = (path: string, url: string) => {
    if (disabled || readOnly) return;
    setEditState({ path, src: url });
  };

  const closeCropper = () => {
    setEditState(null);
  };

  const applyEdit = async (file: File) => {
    if (!editState) return;
    if (!onReplace) {
      toast.error("No se pudo reemplazar la imagen.");
      return;
    }

    const oldPath = editState.path;
    setBusy(true);
    try {
      const newPath = await uploadToBucket(file);
      registerPreview(newPath, file);
      try {
        await onReplace(oldPath, newPath);
      } catch (err) {
        dropPreview(newPath);
        await removeFromBucket(newPath);
        throw err;
      }
      dropPreview(oldPath);
      await removeFromBucket(oldPath);
      toast.success("Imagen actualizada.");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "No se pudo actualizar la imagen.";
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
      await onRemove?.(path);
      await removeFromBucket(path);
      dropPreview(path);
      toast.success("Imagen eliminada.");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "No se pudo eliminar la imagen.";
      toast.error(message);
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteAll = async () => {
    if (!paths.length) return;
    const result = await confirmEliminarTodasImagenes(paths.length);
    if (!result.isConfirmed) return;

    setBusy(true);
    const objetivo = [...paths];
    let ok = 0;
    try {
      for (const path of objetivo) {
        try {
          await onRemove?.(path);
          await removeFromBucket(path);
          dropPreview(path);
          ok += 1;
        } catch {
          // continuar con las demás
        }
      }
      if (ok === objetivo.length) {
        toast.success("Imágenes eliminadas.");
      } else if (ok > 0) {
        toast.warn(`Se eliminaron ${ok} de ${objetivo.length} imágenes.`);
      } else {
        toast.error("No se pudieron eliminar las imágenes.");
      }
    } finally {
      setBusy(false);
    }
  };

  if (readOnly && paths.length === 0) return null;

  const showDeleteAll = !readOnly && paths.length > 1;

  return (
    <div className="space-y-3">
      {showDeleteAll && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => void handleDeleteAll()}
            disabled={busy || disabled}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-red-100 px-3 text-xs font-bold text-red-600 transition-colors hover:bg-red-200 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer dark:bg-red-950 dark:text-red-400 dark:hover:bg-red-900"
          >
            <Trash2 className="h-4 w-4 shrink-0" />
            Eliminar todas
          </button>
        </div>
      )}

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
              onEdit={onReplace ? (url) => startEdit(path, url) : undefined}
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
            multiple
            className="hidden"
            onChange={handleGalleryPick}
            disabled={busy}
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleCameraPick}
            disabled={busy}
          />
          <button
            type="button"
            onClick={() => galleryInputRef.current?.click()}
            disabled={busy}
            className="flex h-full w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-celeste-trifinio/60 bg-sky-50/50 px-2 text-azul-trifinio transition-colors hover:bg-sky-100/70 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer dark:bg-sky-950/20 dark:hover:bg-sky-950/40"
          >
            {busy ? (
              <>
                <Loader2 className="h-6 w-6 animate-spin" />
                {progress && (
                  <span className="text-center text-[9px] font-semibold opacity-80">
                    {progress.done}/{progress.total}
                  </span>
                )}
              </>
            ) : (
              <>
                <ImagePlus className="h-6 w-6" />
                <span className="text-center text-[10px] font-bold uppercase tracking-widest">
                  Agregar
                </span>
                {slotsLeft > 1 && (
                  <span className="text-center text-[9px] font-semibold opacity-80">
                    hasta {slotsLeft} a la vez
                  </span>
                )}
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
      </div>

      <ImagenBatchCropperModal
        open={pendingFiles.length > 0}
        files={pendingFiles}
        onClose={() => setPendingFiles([])}
        onConfirm={handleBatchConfirm}
      />

      <ImagenCropperModal
        open={editState !== null}
        imageSrc={editState?.src ?? ""}
        onClose={closeCropper}
        onApply={applyEdit}
      />

      {viewerUrl && (
        <ImagenViewer url={viewerUrl} onClose={() => setViewerUrl(null)} />
      )}
    </div>
  );
}
