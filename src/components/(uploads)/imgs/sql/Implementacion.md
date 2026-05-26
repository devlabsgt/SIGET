# Implementación: logos de organizaciones (`components/(uploads)/imgs`)

Documentación de cómo está construido el sistema de subida de logos en SIGET y cómo debe quedar configurado Supabase Storage.

---

## Resumen

Los logos de organizaciones del observatorio se guardan en **Supabase Storage** (bucket público) y la **ruta del archivo** se persiste en `obs_organizaciones.logo`. La app construye URLs públicas directas para mostrarlos en admin, home y observatorio web.

| Concepto | Valor |
|----------|--------|
| Bucket | `obs-organizaciones-logos` |
| Columna BD | `obs_organizaciones.logo` (`TEXT NULL`) |
| Formatos | JPEG, PNG |
| Tamaño máx. | 200 KB |
| Dimensión máx. | 1024 px (lado mayor) |
| Salida del editor | PNG (soporta transparencia) |

---

## Archivos del módulo

```
src/components/(uploads)/imgs/
├── constants.ts              # Bucket, límites, compresión, URL pública
├── cropImage.ts              # Recorte + rotación con canvas
├── ImageEditorModal.tsx      # Modal de recorte (react-easy-crop)
├── ImageUploader.tsx         # UI de subida, preview, eliminar
├── OrgLogoCell.tsx           # Celda conectada a obs_organizaciones
├── useOrgLogoDisplayUrl.ts   # Hook cliente → URL pública
├── org-logo-actions.ts       # Fallback server: signed URL con admin
└── sql/
    ├── obs_organizaciones_logo.sql
    └── Implementacion.md     # Este archivo
```

### Integración en SIGET

| Dónde | Componente |
|-------|------------|
| Gestión → Organizaciones | `OrgLogoCell` en `GestionOrgsSectores.tsx` |
| Home pública / Observatorio Web | `OrganizacionesLogoCintillo.tsx` |
| Server actions | `updateOrganizacionLogo`, `getOrganizacionesLogos` en `forms/lib/actions.ts` |

---

## Dependencias

```bash
pnpm add browser-image-compression react-easy-crop
```

También usa: `@supabase/supabase-js`, `lucide-react`, `react-toastify`, `framer-motion`.

---

## Base de datos

Ejecutar `sql/obs_organizaciones_logo.sql`:

```sql
ALTER TABLE obs_organizaciones
  ADD COLUMN IF NOT EXISTS logo TEXT NULL;
```

- Se guarda **solo el path** dentro del bucket (ej. `1779741479099-k2yo0zjn.png`), no la URL completa.
- `NULL` = organización sin logo.

---

## Configuración del bucket en Supabase

### 1. Crear el bucket

En **Storage → New bucket**:

- **Name:** `obs-organizaciones-logos`
- **Public bucket:** ✅ activado

O vía SQL:

```sql
UPDATE storage.buckets
SET public = true
WHERE id = 'obs-organizaciones-logos';
```

### 2. Políticas recomendadas

Como el bucket es **público**, las imágenes son accesibles por URL directa sin signed URL:

```
https://<PROJECT>.supabase.co/storage/v1/object/public/obs-organizaciones-logos/<path>
```

**No hace falta** una política SELECT amplia en `storage.objects`. Si existe, Supabase muestra el warning:

> *Clients can list all files in this bucket*

Eso permite **listar todos los archivos** del bucket, lo cual no necesitamos (la app conoce el path desde la BD).

#### Qué hacer con el warning

1. Ir a **Storage → obs-organizaciones-logos → Policies**
2. Eliminar las políticas **SELECT** / lectura pública redundantes
3. Mantener solo escritura para usuarios autenticados

Ejemplo de política de escritura:

```sql
CREATE POLICY "obs-organizaciones-logos authenticated write"
ON storage.objects FOR ALL TO authenticated
USING (bucket_id = 'obs-organizaciones-logos')
WITH CHECK (bucket_id = 'obs-organizaciones-logos');
```

#### Resumen de acceso

| Acción | Quién | Cómo |
|--------|--------|------|
| Ver logo | Público | URL directa (bucket public + path en BD) |
| Listar bucket | Nadie | Sin políticas SELECT amplias |
| Subir / reemplazar / borrar | `authenticated` | Cliente Supabase del usuario logueado |

### 3. Permisos en la app (roles)

Solo estos roles ven botones de subir/eliminar en `ImageUploader`:

- `super`
- `admin`
- `admin-observatorio`

---

## Flujo de subida

```
Usuario elige imagen (galería / cámara / drag & drop)
        ↓
Validación: solo image/jpeg o image/png
        ↓
ImageEditorModal (recorte libre, zoom, rotación ±90°)
        ↓
cropImage.ts → PNG con fondo transparente si aplica
        ↓
compressLogoFile() → máx. 200 KB, máx. 1024 px
        ↓
generateStoragePath() → "timestamp-random.png"
        ↓
supabase.storage.from(bucket).upload(path, file)
        ↓
Si había logo anterior → remove(oldPath)
        ↓
updateOrganizacionLogo(orgId, newPath)  →  obs_organizaciones.logo
```

### Detalles del editor

- **Proporción:** libre (`aspect` opcional; logos de org usan proporción libre)
- **Fondo del crop:** blanco en la UI
- **Salida:** siempre PNG (transparencia en zonas fuera de la imagen)
- **Zoom inicial:** ajusta para ver la imagen completa al abrir

---

## Flujo de visualización

### Cliente (admin, cintillo público)

```ts
// constants.ts
getOrgLogoPublicUrl(path) → URL pública del bucket

// useOrgLogoDisplayUrl.ts
useOrgLogoDisplayUrl(path) → { url, loading: false }
```

No usa signed URLs en el cliente porque el bucket es público.

### Servidor (fallback)

`org-logo-actions.ts` → `getOrgLogoDisplayUrl(path)` intenta signed URL con service role y, si falla, devuelve la URL pública.

`getOrganizacionesLogos()` usa `createAdminClient()` para leer `id, nombre, logo` y alimentar `OrganizacionesLogoCintillo`.

---

## Componentes principales

### `ImageUploader`

Props relevantes:

```ts
interface ImageUploaderProps {
  bucketName?: string;           // default: obs-organizaciones-logos
  currentImagePath: string | null;
  onUploadSuccess: (newPath: string) => void | Promise<void>;
  onDeleteSuccess: () => void | Promise<void>;
  disabled?: boolean;
  aspect?: number;               // opcional; org logos = libre
  aspectLabel?: string;
  compact?: boolean;             // celda pequeña en tablas
}
```

Modos:

- **`compact`:** celda en tabla de organizaciones (icono subir / preview / lightbox)
- **Completo:** área grande con galería, cámara y drag & drop

### `OrgLogoCell`

Wrapper que conecta `ImageUploader` con `updateOrganizacionLogo(orgId, path)`.

```tsx
<OrgLogoCell
  orgId={org.id}
  logoPath={org.logo}
  onUpdated={refresh}
/>
```

---

## Convención de paths en Storage

Generados en cliente:

```ts
`${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`
// Ejemplo: 1779741479099-k2yo0zjn.png
```

- Sin carpetas por organización (archivos en raíz del bucket)
- Al reemplazar logo se borra el archivo anterior del bucket

---

## Checklist de despliegue

1. [ ] Bucket `obs-organizaciones-logos` creado y marcado **Public**
2. [ ] Columna `obs_organizaciones.logo` existe
3. [ ] Política de escritura para `authenticated`
4. [ ] Políticas SELECT redundantes eliminadas (sin warning en dashboard)
5. [ ] Variables `NEXT_PUBLIC_SUPABASE_URL` y anon key configuradas
6. [ ] Service role disponible para server actions admin (`createAdminClient`)
7. [ ] Probar: subir logo → ver en Gestión Organizaciones → ver en home/observatorio

---

## Replicar en otro proyecto

1. Copiar la carpeta `src/components/(uploads)/imgs/` (excepto docs si no se necesitan)
2. Instalar `browser-image-compression` y `react-easy-crop`
3. Ajustar imports de Supabase y hook de roles (`useUserContext`)
4. Crear bucket público y políticas según esta guía
5. Añadir columna `logo TEXT` (o equivalente) en tu tabla
6. Conectar `onUploadSuccess` / `onDeleteSuccess` a tus server actions

---

## Referencia SQL

Ver archivo hermano: [`obs_organizaciones_logo.sql`](./obs_organizaciones_logo.sql)
