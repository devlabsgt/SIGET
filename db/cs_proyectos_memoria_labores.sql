create table if not exists public.cs_proyectos_memoria_labores (
  id uuid primary key default gen_random_uuid(),
  periodo timestamptz not null,
  proyectos jsonb not null default '[]'::jsonb,
  imagenes jsonb not null default '[]'::jsonb,
  created_by uuid references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

create index if not exists cs_pml_periodo_idx
  on public.cs_proyectos_memoria_labores (periodo desc);

create index if not exists cs_pml_created_at_idx
  on public.cs_proyectos_memoria_labores (created_at desc);

create index if not exists cs_pml_created_by_idx
  on public.cs_proyectos_memoria_labores (created_by);

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
