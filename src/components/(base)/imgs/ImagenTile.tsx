"use client";

import { useEffect, useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import {
  getImagenPublicUrl,
  MEMORIA_IMAGENES_BUCKET,
  normalizeImagenStoragePath,
} from "./constants";
import { useImagenDisplayUrl } from "./useImagenDisplayUrl";

export default function ImagenTile({
  path,
  previewUrl,
  readOnly,
  busy,
  disabled,
  onView,
  onDelete,
}: {
  path: string;
  previewUrl?: string | null;
  readOnly?: boolean;
  busy?: boolean;
  disabled?: boolean;
  onView: (url: string) => void;
  onDelete: () => void;
}) {
  const storagePath = normalizeImagenStoragePath(path) ?? path;
  const { url: storedUrl, loading } = useImagenDisplayUrl(storagePath);
  const [previewBroken, setPreviewBroken] = useState(false);
  const [fallbackUrl, setFallbackUrl] = useState<string | null>(null);
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    setPreviewBroken(false);
    setFallbackUrl(null);
    setImgFailed(false);
  }, [path, previewUrl]);

  const displayUrl =
    !previewBroken && previewUrl
      ? previewUrl
      : (fallbackUrl ?? storedUrl);

  const handleImgError = async () => {
    if (!previewBroken && previewUrl && displayUrl === previewUrl) {
      setPreviewBroken(true);
      return;
    }

    const cleanPath = normalizeImagenStoragePath(path);
    if (!cleanPath) {
      setImgFailed(true);
      return;
    }

    if (fallbackUrl && displayUrl === fallbackUrl) {
      setImgFailed(true);
      return;
    }

    try {
      const supabase = createClient();
      const { data, error } = await supabase.storage
        .from(MEMORIA_IMAGENES_BUCKET)
        .createSignedUrl(cleanPath, 60 * 60);

      if (!error && data?.signedUrl && data.signedUrl !== displayUrl) {
        setFallbackUrl(data.signedUrl);
        return;
      }
    } catch {
      // sin URL firmada
    }

    const publicUrl = getImagenPublicUrl(cleanPath);
    if (publicUrl && publicUrl !== displayUrl) {
      setFallbackUrl(publicUrl);
      return;
    }

    setImgFailed(true);
  };

  return (
    <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-800">
      {displayUrl && !imgFailed ? (
        <button
          type="button"
          onClick={() => onView(displayUrl)}
          className="group block h-full w-full cursor-pointer"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={displayUrl}
            src={displayUrl}
            alt="Imagen del proyecto"
            onError={() => void handleImgError()}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        </button>
      ) : loading && !previewUrl ? (
        <div className="flex h-full w-full items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="flex h-full w-full items-center justify-center px-2 text-center text-[10px] font-semibold text-muted-foreground">
          No se pudo cargar la imagen
        </div>
      )}

      {!readOnly && (
        <button
          type="button"
          onClick={onDelete}
          disabled={busy || disabled}
          className="absolute right-1.5 top-1.5 flex h-8 w-8 items-center justify-center rounded-lg bg-red-100 text-red-600 shadow-sm transition-colors hover:bg-red-200 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer dark:bg-red-950 dark:text-red-400 dark:hover:bg-red-900"
          title="Eliminar imagen"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
