alter table public.puestos
  drop column if exists es_jefatura;

alter table public.puestos enable row level security;

drop policy if exists puestos_all_authenticated on public.puestos;
create policy puestos_all_authenticated
  on public.puestos
  for all
  to authenticated
  using (true)
  with check (true);
