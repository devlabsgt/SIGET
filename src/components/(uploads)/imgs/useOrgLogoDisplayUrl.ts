"use client";

import { useMemo } from "react";
import { getOrgLogoPublicUrl } from "./constants";

/** URL del logo — bucket público, sin server action. */
export function useOrgLogoDisplayUrl(path: string | null) {
  const url = useMemo(() => getOrgLogoPublicUrl(path), [path]);
  return { url, loading: false };
}
