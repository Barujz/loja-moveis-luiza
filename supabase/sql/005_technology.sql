-- Luiza Mobiliário de Luxo
-- Área institucional de inovação tecnológica.
-- Não insere texto, logotipo nem solução. A página fica vazia até um administrador publicar.
--
-- Execute este arquivo inteiro, uma vez, no SQL Editor do Supabase,
-- depois de supabase/sql/001_initial_schema.sql.
-- Não altera tabelas, políticas nem dados já existentes.
--
-- Os testes manuais estão em supabase/tests/technology_permissions.sql.
-- Eles encerram com ROLLBACK e não fazem parte deste schema.

create table public.technology_profile (
  id boolean primary key default true,
  summary text,
  logo_url text,
  published boolean not null default false,
  updated_at timestamptz not null default pg_catalog.now(),
  constraint technology_profile_singleton check (id),
  constraint technology_profile_summary_length check (
    summary is null or char_length(btrim(summary)) between 10 and 2000
  ),
  constraint technology_profile_logo_url check (
    logo_url is null
    or logo_url ~ '^https://[A-Za-z0-9._~:/?#\[\]@!$&''()*+,;=%-]+$'
  )
);

comment on table public.technology_profile is
  'Apresentação institucional publicada pelo administrador. Sem linha, a página não mostra texto nem logotipo.';

create table public.technology_solutions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  image_url text,
  icon text,
  link_url text,
  sort_order integer not null default 0,
  published boolean not null default false,
  created_at timestamptz not null default pg_catalog.now(),
  updated_at timestamptz not null default pg_catalog.now(),
  constraint technology_solutions_title_length check (char_length(btrim(title)) between 2 and 120),
  constraint technology_solutions_description_length check (char_length(btrim(description)) between 10 and 800),
  constraint technology_solutions_image_url check (
    image_url is null
    or image_url ~ '^https://[A-Za-z0-9._~:/?#\[\]@!$&''()*+,;=%-]+$'
  ),
  constraint technology_solutions_icon check (
    icon is null or icon in ('layers', 'spark', 'shield', 'cpu')
  ),
  constraint technology_solutions_link_url check (
    link_url is null
    or link_url ~ '^https://[A-Za-z0-9._~:/?#\[\]@!$&''()*+,;=%-]+$'
    or (link_url ~ '^/[^/]' and link_url !~ '\\')
  )
);

comment on table public.technology_solutions is
  'Soluções publicadas na página de tecnologia. Não há cadastro de exemplo.';

create index technology_solutions_published_idx
  on public.technology_solutions (published, sort_order, title);

create or replace function public.guard_technology_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if public.is_api_role() and not public.is_approved_admin() then
    raise exception 'somente um administrador aprovado publica a apresentação tecnológica'
      using errcode = '42501';
  end if;
  if tg_op = 'DELETE' then
    return old;
  end if;
  if new.summary is not null then
    new.summary := nullif(btrim(new.summary), '');
  end if;
  if new.logo_url is not null then
    new.logo_url := nullif(btrim(new.logo_url), '');
  end if;
  new.updated_at := pg_catalog.now();
  return new;
end;
$$;

create or replace function public.guard_technology_solution()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if public.is_api_role() and not public.is_approved_admin() then
    raise exception 'somente um administrador aprovado publica soluções tecnológicas'
      using errcode = '42501';
  end if;
  if tg_op = 'DELETE' then
    return old;
  end if;
  new.title := btrim(new.title);
  new.description := btrim(new.description);
  if new.image_url is not null then
    new.image_url := nullif(btrim(new.image_url), '');
  end if;
  if new.icon is not null then
    new.icon := nullif(btrim(new.icon), '');
  end if;
  if new.link_url is not null then
    new.link_url := nullif(btrim(new.link_url), '');
  end if;
  new.updated_at := pg_catalog.now();
  return new;
end;
$$;

create trigger technology_profile_guard
  before insert or update or delete on public.technology_profile
  for each row execute function public.guard_technology_profile();

create trigger technology_solutions_guard
  before insert or update or delete on public.technology_solutions
  for each row execute function public.guard_technology_solution();

alter table public.technology_profile enable row level security;
alter table public.technology_solutions enable row level security;

create policy technology_profile_select
  on public.technology_profile
  for select
  to anon, authenticated
  using (published or (select public.is_approved_admin()));

create policy technology_profile_write
  on public.technology_profile
  for all
  to authenticated
  using ((select public.is_approved_admin()))
  with check ((select public.is_approved_admin()));

create policy technology_solutions_select
  on public.technology_solutions
  for select
  to anon, authenticated
  using (published or (select public.is_approved_admin()));

create policy technology_solutions_write
  on public.technology_solutions
  for all
  to authenticated
  using ((select public.is_approved_admin()))
  with check ((select public.is_approved_admin()));

revoke all on table public.technology_profile from public, anon, authenticated, service_role;
revoke all on table public.technology_solutions from public, anon, authenticated, service_role;
grant select on table public.technology_profile to anon, authenticated;
grant select, insert, update, delete on table public.technology_profile to authenticated;
grant select on table public.technology_solutions to anon, authenticated;
grant select, insert, update, delete on table public.technology_solutions to authenticated;

revoke all on function public.guard_technology_profile() from public, anon, authenticated, service_role;
revoke all on function public.guard_technology_solution() from public, anon, authenticated, service_role;
grant execute on function public.guard_technology_profile() to authenticated;
grant execute on function public.guard_technology_solution() to authenticated;

notify pgrst, 'reload schema';
