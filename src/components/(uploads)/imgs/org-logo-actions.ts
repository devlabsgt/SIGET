"use server";

import { createAdminClient } from "@/utils/supabase/admin";
import { OBS_ORG_LOGOS_BUCKET, getOrgLogoPublicUrl } from "./constants";

/** URL de visualización del logo (signed URL vía service role, sin depender de RLS del cliente). */
export async function getOrgLogoDisplayUrl(path: string | null): Promise<string | null> {
  if (!path) return null;

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.storage
      .from(OBS_ORG_LOGOS_BUCKET)
      .createSignedUrl(path, 60 * 60 * 24);

    if (!error && data?.signedUrl) return data.signedUrl;
  } catch (err) {
    console.error("[getOrgLogoDisplayUrl] admin signed URL failed:", err);
  }

  return getOrgLogoPublicUrl(path);
}
