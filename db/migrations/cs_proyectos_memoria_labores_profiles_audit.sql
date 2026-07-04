-- Normaliza cs_proyectos_memoria_labores:
-- - Informante desde profiles (created_by), sin duplicar cargo/nombre/oficina
-- - Solo proyectos jsonb (avances/resultados/efectos por proyecto)
-- - Auditoría: created_by, updated_by, updated_at

alter table public.cs_proyectos_memoria_labores
  add column if not exists created_by uuid references public.profiles (id) on delete set null,
  add column if not exists updated_by uuid references public.profiles (id) on delete set null,
  add column if not exists updated_at timestamptz,
  add column if not exists imagenes jsonb not null default '[]'::jsonb;

alter table public.cs_proyectos_memoria_labores
  drop column if exists titulo,
  drop column if exists cargo,
  drop column if exists nombre,
  drop column if exists oficina,
  drop column if exists avances,
  drop column if exists resultados,
  drop column if exists efectos,
  drop column if exists beneficiarios;

create or replace function public.cs_pml_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists cs_pml_set_updated_at on public.cs_proyectos_memoria_labores;

create trigger cs_pml_set_updated_at
  before update on public.cs_proyectos_memoria_labores
  for each row
  execute function public.cs_pml_set_updated_at();

create index if not exists cs_pml_created_by_idx
  on public.cs_proyectos_memoria_labores (created_by);
