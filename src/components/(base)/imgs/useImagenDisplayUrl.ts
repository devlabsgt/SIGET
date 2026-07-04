"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import {
  getImagenPublicUrl,
  imagenExistsInStorage,
  MEMORIA_IMAGENES_BUCKET,
  normalizeImagenStoragePath,
} from "./constants";

export function useImagenDisplayUrl(path: string | null) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    const cleanPath = normalizeImagenStoragePath(path);
    if (!cleanPath) {
      setUrl(null);
      setMissing(true);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setUrl(null);
    setMissing(false);

    (async () => {
      const supabase = createClient();
      const exists = await imagenExistsInStorage(supabase, cleanPath);

      if (cancelled) return;

      if (!exists) {
        setMissing(true);
        setUrl(null);
        return;
      }

      const publicUrl = getImagenPublicUrl(cleanPath);
      if (publicUrl) {
        setUrl(publicUrl);
        return;
      }

      const { data, error } = await supabase.storage
        .from(MEMORIA_IMAGENES_BUCKET)
        .createSignedUrl(cleanPath, 60 * 60);

      if (!cancelled) {
        setUrl(!error && data?.signedUrl ? data.signedUrl : null);
        if (error || !data?.signedUrl) setMissing(true);
      }
    })().finally(() => {
      if (!cancelled) setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [path]);

  return { url, loading, missing };
}
