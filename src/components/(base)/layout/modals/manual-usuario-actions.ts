"use server";

import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";

const MANUAL_BUCKET = "documentos";
const MANUAL_MAX_BYTES = 10 * 1024 * 1024; // 10 MB — límite del bucket

function isPdfFile(file: { type: string; name: string }): boolean {
  if (file.type === "application/pdf") return true;
  return file.name.toLowerCase().endsWith(".pdf");
}

function getFormDataFile(formData: FormData): File | null {
  const file = formData.get("file");
  if (!file || typeof file === "string") return null;
  if (!("arrayBuffer" in file) || typeof file.arrayBuffer !== "function") return null;
  return file as File;
}

async function assertSuperUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("No autenticado");

  const metadata = user.user_metadata || {};
  const realRole = metadata.rol || user.role || "user";
  if (realRole !== "super") throw new Error("No autorizado");

  return user;
}

async function assertAuthenticatedUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("No autenticado");

  return user;
}

async function saveManualPath(path: string | null): Promise<void> {
  const admin = createAdminClient();

  const { data: existing, error: selectError } = await admin
    .from("app_settings")
    .select("id")
    .limit(1)
    .maybeSingle();

  if (selectError) throw new Error(selectError.message);

  if (existing?.id) {
    const { error } = await admin
      .from("app_settings")
      .update({
        manual_usuario_url: path,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);

    if (error) throw new Error(error.message);
  } else {
    const { error } = await admin.from("app_settings").insert({ manual_usuario_url: path });

    if (error) throw new Error(error.message);
  }
}

export async function getManualUsuarioSignedUrl(
  path: string | null,
): Promise<string | null> {
  if (!path) return null;

  await assertAuthenticatedUser();

  const admin = createAdminClient();
  const { data, error } = await admin.storage
    .from(MANUAL_BUCKET)
    .createSignedUrl(path, 60 * 60);

  if (error) {
    console.error("[getManualUsuarioSignedUrl]", error);
    throw new Error(error.message);
  }

  return data?.signedUrl ?? null;
}

export async function uploadManualUsuario(formData: FormData): Promise<string> {
  await assertSuperUser();

  const file = getFormDataFile(formData);
  if (!file) {
    throw new Error("Archivo no válido");
  }
  if (!isPdfFile(file)) {
    throw new Error("Solo se permiten archivos PDF.");
  }
  if (file.size > MANUAL_MAX_BYTES) {
    throw new Error("El PDF no debe superar los 10 MB.");
  }

  const admin = createAdminClient();

  const { data: settings } = await admin
    .from("app_settings")
    .select("manual_usuario_url")
    .limit(1)
    .maybeSingle();

  const path = `manual-usuario-${Date.now()}.pdf`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await admin.storage
    .from(MANUAL_BUCKET)
    .upload(path, buffer, { contentType: "application/pdf", upsert: false });

  if (uploadError) throw new Error(uploadError.message);

  if (settings?.manual_usuario_url) {
    await admin.storage.from(MANUAL_BUCKET).remove([settings.manual_usuario_url]);
  }

  await saveManualPath(path);

  return path;
}

export async function deleteManualUsuario(): Promise<void> {
  await assertSuperUser();

  const admin = createAdminClient();

  const { data: settings } = await admin
    .from("app_settings")
    .select("manual_usuario_url")
    .limit(1)
    .maybeSingle();

  const currentPath = settings?.manual_usuario_url;
  if (!currentPath) return;

  const { error } = await admin.storage.from(MANUAL_BUCKET).remove([currentPath]);
  if (error) throw new Error(error.message);

  await saveManualPath(null);
}
