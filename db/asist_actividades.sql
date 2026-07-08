-- Módulo de asistencia: actividades, participantes (DPI) y registros vía QR
-- Políticas RLS (dos niveles por tabla):
--   1) Público (anon + authenticated): ver y crear
--   2) Autenticado: editar y eliminar

-- ── Tablas ───────────────────────────────────────────────────────────────────

create table if not exists public.asist_actividades (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  descripcion text,
  activo boolean not null default true,
  created_by uuid references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

create table if not exists public.asist_participantes (
  dpi text primary key check (dpi ~ '^\d{13}$'),
  nombre text not null,
  fecha_nacimiento date not null,
  genero text not null check (genero in ('masculino', 'femenino')),
  departamento text not null,
  municipio text not null,
  es_trifinio boolean not null default false,
  puesto text,
  direccion_administrativa text,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

create table if not exists public.asist_registros (
  id uuid primary key default gen_random_uuid(),
  actividad_id uuid not null references public.asist_actividades (id) on delete cascade,
  dpi text not null references public.asist_participantes (dpi) on delete restrict,
  created_at timestamptz not null default now(),
  unique (actividad_id, dpi)
);

-- ── Índices ──────────────────────────────────────────────────────────────────

create index if not exists asist_actividades_created_at_idx
  on public.asist_actividades (created_at desc);

create index if not exists asist_actividades_activo_idx
  on public.asist_actividades (activo);

create index if not exists asist_participantes_nombre_idx
  on public.asist_participantes (nombre);

create index if not exists asist_participantes_departamento_idx
  on public.asist_participantes (departamento);

create index if not exists asist_registros_actividad_id_idx
  on public.asist_registros (actividad_id);

create index if not exists asist_registros_dpi_idx
  on public.asist_registros (dpi);

create index if not exists asist_registros_created_at_idx
  on public.asist_registros (created_at desc);

-- ── Triggers updated_at ──────────────────────────────────────────────────────

create or replace function public.asist_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists asist_actividades_set_updated_at on public.asist_actividades;
create trigger asist_actividades_set_updated_at
  before update on public.asist_actividades
  for each row
  execute function public.asist_set_updated_at();

drop trigger if exists asist_participantes_set_updated_at on public.asist_participantes;
create trigger asist_participantes_set_updated_at
  before update on public.asist_participantes
  for each row
  execute function public.asist_set_updated_at();

-- ── RLS ──────────────────────────────────────────────────────────────────────

alter table public.asist_actividades enable row level security;
alter table public.asist_participantes enable row level security;
alter table public.asist_registros enable row level security;

-- asist_actividades
drop policy if exists asist_actividades_publico on public.asist_actividades;
drop policy if exists asist_actividades_autenticado on public.asist_actividades;
drop policy if exists asist_actividades_select_public on public.asist_actividades;
drop policy if exists asist_actividades_mutate_authenticated on public.asist_actividades;

create policy asist_actividades_publico
  on public.asist_actividades
  for select
  to anon, authenticated
  using (true);

create policy asist_actividades_autenticado
  on public.asist_actividades
  for all
  to authenticated
  using (true)
  with check (true);

-- asist_participantes
drop policy if exists asist_participantes_publico on public.asist_participantes;
drop policy if exists asist_participantes_autenticado on public.asist_participantes;

-- Público: consultar DPI y registrar/actualizar datos al inscribirse
create policy asist_participantes_publico
  on public.asist_participantes
  for select
  to anon, authenticated
  using (true);

create policy asist_participantes_publico_insert
  on public.asist_participantes
  for insert
  to anon, authenticated
  with check (true);

create policy asist_participantes_publico_update
  on public.asist_participantes
  for update
  to anon, authenticated
  using (true)
  with check (true);

-- Autenticado: eliminar participantes
create policy asist_participantes_autenticado_delete
  on public.asist_participantes
  for delete
  to authenticated
  using (true);

-- asist_registros
drop policy if exists asist_registros_publico on public.asist_registros;
drop policy if exists asist_registros_autenticado on public.asist_registros;
drop policy if exists asist_registros_select_public on public.asist_registros;
drop policy if exists asist_registros_insert_public on public.asist_registros;
drop policy if exists asist_registros_mutate_authenticated on public.asist_registros;
drop policy if exists asist_registros_autenticado_delete on public.asist_registros;
drop policy if exists asist_registros_publico_insert on public.asist_registros;

create policy asist_registros_publico
  on public.asist_registros
  for select
  to anon, authenticated
  using (true);

create policy asist_registros_publico_insert
  on public.asist_registros
  for insert
  to anon, authenticated
  with check (true);

create policy asist_registros_autenticado
  on public.asist_registros
  for update
  to authenticated
  using (true)
  with check (true);

create policy asist_registros_autenticado_delete
  on public.asist_registros
  for delete
  to authenticated
  using (true);
