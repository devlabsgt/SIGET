-- =============================================================================
-- Imágenes de proyectos en la Memoria de Labores
-- Columna jsonb en el reporte + bucket público de Storage
-- =============================================================================

-- Columna imagenes (si aún no existe; ver también migración profiles_audit)
ALTER TABLE public.cs_proyectos_memoria_labores
  ADD COLUMN IF NOT EXISTS imagenes jsonb NOT NULL DEFAULT '[]'::jsonb;

-- 2) Bucket público (las imágenes se sirven por URL pública, sin signed URL).
INSERT INTO storage.buckets (id, name, public)
VALUES (
  'memoria-labores-imagenes',
  'memoria-labores-imagenes',
  true
)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 3) Política única de Storage: acceso total para usuarios autenticados.
--    La lectura pública se sirve por `public = true`.
DROP POLICY IF EXISTS "memoria-labores-imagenes subir autenticado" ON storage.objects;
DROP POLICY IF EXISTS "memoria-labores-imagenes eliminar autenticado" ON storage.objects;
DROP POLICY IF EXISTS "memoria-labores-imagenes autenticado all" ON storage.objects;
CREATE POLICY "memoria-labores-imagenes autenticado all"
  ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'memoria-labores-imagenes')
  WITH CHECK (bucket_id = 'memoria-labores-imagenes');
