alter table public.cs_proyectos_memoria_labores
  add column if not exists created_at timestamptz;

update public.cs_proyectos_memoria_labores
set created_at = coalesce(periodo, now())
where created_at is null;

alter table public.cs_proyectos_memoria_labores
  alter column created_at set default now(),
  alter column created_at set not null;

create index if not exists cs_pml_created_at_idx
  on public.cs_proyectos_memoria_labores (created_at desc);
