alter table public.departamentos
  add column if not exists descripcion text;

alter table public.puestos
  drop column if exists es_jefatura;

create table if not exists public.puesto_jefaturas (
  puesto_id uuid not null,
  departamento_id uuid not null,
  unique (puesto_id, departamento_id)
);

alter table public.puesto_jefaturas
  add constraint puesto_jefaturas_puesto_id_fkey
  foreign key (puesto_id) references public.puestos(id) on delete cascade;

alter table public.puesto_jefaturas
  add constraint puesto_jefaturas_departamento_id_fkey
  foreign key (departamento_id) references public.departamentos(id) on delete cascade;

create index puesto_jefaturas_puesto_id_idx on public.puesto_jefaturas (puesto_id);
create index puesto_jefaturas_departamento_id_idx on public.puesto_jefaturas (departamento_id);

alter table public.puesto_jefaturas enable row level security;

drop policy if exists puesto_jefaturas_all_authenticated on public.puesto_jefaturas;
create policy puesto_jefaturas_all_authenticated
  on public.puesto_jefaturas
  for all
  to authenticated
  using (true)
  with check (true);
