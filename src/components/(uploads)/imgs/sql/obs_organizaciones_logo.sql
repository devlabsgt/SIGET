-- Bucket público (logos visibles sin signed URL)
UPDATE storage.buckets
SET public = true
WHERE id = 'obs-organizaciones-logos';

-- El warning de Supabase aparece porque hay políticas SELECT amplias
-- en un bucket ya público. Puedes eliminar la de lectura pública redundante:
-- DROP POLICY IF EXISTS "obs-organizaciones-logos public read" ON storage.objects;

-- Mantén solo la de escritura para usuarios autenticados (subir/editar logos):
-- CREATE POLICY "obs-organizaciones-logos authenticated all"
-- ON storage.objects FOR ALL TO authenticated
-- USING (bucket_id = 'obs-organizaciones-logos')
-- WITH CHECK (bucket_id = 'obs-organizaciones-logos');

ALTER TABLE obs_organizaciones
  ADD COLUMN IF NOT EXISTS logo TEXT NULL;
