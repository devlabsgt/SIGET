alter table if exists public.cs_proyectos_memoria_labores
  drop column if exists titulo,
  drop column if exists avances,
  drop column if exists resultados,
  drop column if exists efectos;

create table if not exists public.cs_proyectos_memoria_labores (
  id uuid primary key default gen_random_uuid(),
  periodo timestamptz not null,
  cargo text,
  nombre text,
  oficina text,
  proyectos jsonb not null default '[]'::jsonb,
  beneficiarios jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.cs_proyectos_memoria_labores
  add column if not exists created_at timestamptz;

update public.cs_proyectos_memoria_labores
set created_at = coalesce(periodo, now())
where created_at is null;

alter table public.cs_proyectos_memoria_labores
  alter column created_at set default now(),
  alter column created_at set not null;

create index if not exists cs_pml_periodo_idx
  on public.cs_proyectos_memoria_labores (periodo desc);

create index if not exists cs_pml_created_at_idx
  on public.cs_proyectos_memoria_labores (created_at desc);

alter table public.cs_proyectos_memoria_labores enable row level security;

drop policy if exists cs_pml_insert_anon on public.cs_proyectos_memoria_labores;
drop policy if exists cs_pml_all_authenticated on public.cs_proyectos_memoria_labores;

create policy cs_pml_insert_anon
  on public.cs_proyectos_memoria_labores
  for insert
  to anon
  with check (true);

create policy cs_pml_all_authenticated
  on public.cs_proyectos_memoria_labores
  for all
  to authenticated
  using (true)
  with check (true);
