"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import {
  getImagenPublicUrl,
  MEMORIA_IMAGENES_BUCKET,
  normalizeImagenStoragePath,
} from "./constants";

export function useImagenDisplayUrl(path: string | null) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const cleanPath = normalizeImagenStoragePath(path);
    if (!cleanPath) {
      setUrl(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setUrl(null);

    (async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase.storage
          .from(MEMORIA_IMAGENES_BUCKET)
          .createSignedUrl(cleanPath, 60 * 60);

        if (!cancelled && !error && data?.signedUrl) {
          setUrl(data.signedUrl);
          return;
        }
      } catch {
        // intentar URL pública
      }

      if (!cancelled) {
        setUrl(getImagenPublicUrl(cleanPath));
      }
    })().finally(() => {
      if (!cancelled) setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [path]);

  return { url, loading };
}
