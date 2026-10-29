-- Testes manuais da área de tecnologia.
--
-- Rode o arquivo inteiro, uma vez, depois de
-- supabase/sql/001_initial_schema.sql e supabase/sql/005_technology.sql.
-- Ele abre BEGIN e termina em ROLLBACK. Não há COMMIT.

begin;

create or replace function public._tech_try(statement text)
returns text
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  affected bigint;
begin
  execute statement;
  get diagnostics affected = row_count;
  return affected::text;
exception
  when others then
    return sqlstate;
end;
$$;

create or replace function public._tech_expect(actual text, expected text, message text)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  if actual is distinct from expected then
    raise exception '% — esperado %, obteve %', message, expected, coalesce(actual, 'null');
  end if;
end;
$$;

grant execute on function public._tech_try(text) to anon, authenticated;
grant execute on function public._tech_expect(text, text, text) to anon, authenticated;

do $priv$
declare
  privilege text;
begin
  foreach privilege in array array['INSERT', 'UPDATE', 'DELETE', 'TRUNCATE'] loop
    if has_table_privilege('anon', 'public.technology_solutions', privilege) then
      raise exception 'anon não deveria ter % em technology_solutions', privilege;
    end if;
  end loop;
  if not has_table_privilege('anon', 'public.technology_solutions', 'SELECT') then
    raise exception 'anon precisa consultar technology_solutions';
  end if;
  if exists (select 1 from pg_catalog.pg_roles where rolname = 'service_role')
    and has_table_privilege('service_role', 'public.technology_solutions', 'SELECT') then
    raise exception 'service_role não deveria ler technology_solutions';
  end if;
end
$priv$;

select set_config('request.jwt.claim.sub', '', true);
select set_config('request.jwt.claim.role', '', true);
select set_config('request.jwt.claims', '', true);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change,
  email_change_token_current, reauthentication_token, phone_change, phone_change_token
) values (
  '00000000-0000-0000-0000-000000000000',
  '98111111-1111-4111-9811-111111111111',
  'authenticated', 'authenticated', 'tech.admin@example.com', '',
  pg_catalog.now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"role":"comprador","full_name":"Admin Tecnologia"}'::jsonb,
  pg_catalog.now(), pg_catalog.now(),
  '', '', '', '', '', '', '', ''
);

update public.profiles
set role = 'administrador', status = 'aprovado'
where id = '98111111-1111-4111-9811-111111111111';

select set_config('request.jwt.claim.sub', '98111111-1111-4111-9811-111111111111', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"98111111-1111-4111-9811-111111111111","role":"authenticated"}',
  true
);
set local role authenticated;

select public._tech_expect(
  public._tech_try(
    'insert into public.technology_solutions (title, description, published) values (''Solução real'', ''Descrição oficial informada pela parceira.'', false)'
  ),
  '1',
  'administrador aprovado cria solução ainda não publicada'
);
select public._tech_expect(
  public._tech_try(
    'insert into public.technology_profile (summary, published) values (''Texto oficial da apresentação institucional.'', false)'
  ),
  '1',
  'administrador aprovado grava a apresentação sem publicar'
);

reset role;

select set_config('request.jwt.claim.sub', '', true);
select set_config('request.jwt.claim.role', 'anon', true);
select set_config('request.jwt.claims', '{"role":"anon"}', true);
set local role anon;

select public._tech_expect(
  (select count(*) from public.technology_solutions)::text,
  '0',
  'visitante não vê solução não publicada'
);
select public._tech_expect(
  (select count(*) from public.technology_profile)::text,
  '0',
  'visitante não vê apresentação não publicada'
);
select public._tech_expect(
  public._tech_try(
    'insert into public.technology_solutions (title, description) values (''Invento'', ''Texto inventado que não pode entrar.'')'
  ),
  '42501',
  'visitante não cria solução'
);

reset role;

select set_config('request.jwt.claim.sub', '98111111-1111-4111-9811-111111111111', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"98111111-1111-4111-9811-111111111111","role":"authenticated"}',
  true
);
set local role authenticated;

select public._tech_expect(
  public._tech_try('update public.technology_solutions set published = true'),
  '1',
  'administrador publica a solução'
);
select public._tech_expect(
  public._tech_try('update public.technology_profile set published = true'),
  '1',
  'administrador publica a apresentação'
);

reset role;

select set_config('request.jwt.claim.sub', '', true);
select set_config('request.jwt.claim.role', 'anon', true);
select set_config('request.jwt.claims', '{"role":"anon"}', true);
set local role anon;

select public._tech_expect(
  (select title from public.technology_solutions),
  'Solução real',
  'visitante vê somente a solução publicada'
);
select public._tech_expect(
  (select summary from public.technology_profile),
  'Texto oficial da apresentação institucional.',
  'visitante vê a apresentação publicada'
);

reset role;
rollback;
