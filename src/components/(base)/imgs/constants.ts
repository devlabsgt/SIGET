export const MEMORIA_IMAGENES_BUCKET = "memoria-labores-imagenes";

/** Formato vertical 3:4 (ancho / alto). */
export const MEMORIA_IMAGEN_ASPECT = 3 / 4;

/** Máximo de imágenes por proyecto. */
export const MEMORIA_MAX_IMAGENES = 4;

export const ALLOWED_IMAGEN_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export type AllowedImagenType = (typeof ALLOWED_IMAGEN_TYPES)[number];

export const MAX_IMAGEN_SIZE_MB = 0.2;
export const MAX_IMAGEN_BYTES = 200 * 1024;
export const MAX_IMAGEN_DIMENSION = 1280;

export function isAllowedImagenType(type: string): type is AllowedImagenType {
  return (ALLOWED_IMAGEN_TYPES as readonly string[]).includes(type);
}

/** Ruta relativa dentro del bucket (sin prefijo ni URL completa). */
export function normalizeImagenStoragePath(
  path: string | null | undefined,
): string | null {
  if (!path) return null;
  const trimmed = path.trim();
  if (!trimmed || trimmed.startsWith("blob:")) return null;

  const publicMarker = `/storage/v1/object/public/${MEMORIA_IMAGENES_BUCKET}/`;
  const publicIdx = trimmed.indexOf(publicMarker);
  if (publicIdx >= 0) {
    const rest = trimmed.slice(publicIdx + publicMarker.length).split("?")[0] ?? "";
    return decodeURIComponent(rest).replace(/^\//, "") || null;
  }

  const signMarker = `/storage/v1/object/sign/${MEMORIA_IMAGENES_BUCKET}/`;
  const signIdx = trimmed.indexOf(signMarker);
  if (signIdx >= 0) {
    const rest = trimmed.slice(signIdx + signMarker.length).split("?")[0] ?? "";
    return decodeURIComponent(rest).replace(/^\//, "") || null;
  }

  const bucketPrefix = `${MEMORIA_IMAGENES_BUCKET}/`;
  if (trimmed.startsWith(bucketPrefix)) {
    return trimmed.slice(bucketPrefix.length);
  }

  return trimmed.replace(/^\//, "") || null;
}

export function getImagenPublicUrl(
  path: string | null | undefined,
): string | null {
  const cleanPath = normalizeImagenStoragePath(path);
  if (!cleanPath) return null;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  if (!base) return null;
  return `${base}/storage/v1/object/public/${MEMORIA_IMAGENES_BUCKET}/${cleanPath}`;
}

type StorageListClient = {
  storage: {
    from: (bucket: string) => {
      list: (
        path?: string,
        options?: { limit?: number; search?: string },
      ) => Promise<{
        data: { name: string }[] | null;
        error: { message: string } | null;
      }>;
    };
  };
};

/** Comprueba si el archivo existe en el bucket (nombre exacto). */
export async function imagenExistsInStorage(
  supabase: StorageListClient,
  path: string,
): Promise<boolean> {
  const cleanPath = normalizeImagenStoragePath(path);
  if (!cleanPath) return false;

  const slash = cleanPath.lastIndexOf("/");
  const folder = slash >= 0 ? cleanPath.slice(0, slash) : "";
  const fileName = slash >= 0 ? cleanPath.slice(slash + 1) : cleanPath;
  const searchToken = fileName.split(".")[0]?.slice(0, 13) ?? fileName;

  const { data, error } = await supabase.storage
    .from(MEMORIA_IMAGENES_BUCKET)
    .list(folder, { limit: 20, search: searchToken });

  if (error) return false;
  return (data ?? []).some((item) => item.name === fileName);
}

export function generateImagenStoragePath(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.jpg`;
}

async function fileToJpeg(
  file: File,
  maxDim: number,
  quality: number,
): Promise<File> {
  const url = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });

    const scale = Math.min(1, maxDim / Math.max(image.width, image.height));
    const width = Math.max(1, Math.round(image.width * scale));
    const height = Math.max(1, Math.round(image.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("No se pudo comprimir la imagen");

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(image, 0, 0, width, height);

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (result) =>
          result ? resolve(result) : reject(new Error("Error al comprimir")),
        "image/jpeg",
        quality,
      );
    });

    return new File([blob], generateImagenStoragePath(), {
      type: "image/jpeg",
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Comprime la imagen recortada hasta quedar bajo MAX_IMAGEN_BYTES (200 KB). */
export async function compressImagenFile(file: File): Promise<File> {
  const { default: imageCompression } = await import("browser-image-compression");

  const dimensions = [MAX_IMAGEN_DIMENSION, 1024, 900, 768, 640, 512];

  for (const maxDim of dimensions) {
    const compressed = await imageCompression(file, {
      maxSizeMB: MAX_IMAGEN_SIZE_MB,
      maxWidthOrHeight: maxDim,
      useWebWorker: true,
      fileType: "image/jpeg",
      initialQuality: 0.82,
    });

    if (compressed.size <= MAX_IMAGEN_BYTES) {
      return new File([compressed], generateImagenStoragePath(), {
        type: "image/jpeg",
      });
    }
  }

  const jpegQualities = [0.85, 0.75, 0.65, 0.55, 0.45, 0.35];
  for (const maxDim of dimensions) {
    for (const quality of jpegQualities) {
      const jpeg = await fileToJpeg(file, maxDim, quality);
      if (jpeg.size <= MAX_IMAGEN_BYTES) return jpeg;
    }
  }

  throw new Error(
    "No se pudo comprimir la imagen por debajo de 200 KB. Intente con una imagen más pequeña.",
  );
}
