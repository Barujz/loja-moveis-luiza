-- Testes manuais de permissão das fichas cadastrais.
--
-- Rode o arquivo inteiro, uma vez, depois de
-- supabase/sql/001_initial_schema.sql e supabase/sql/003_registration_forms.sql.
-- Ele abre BEGIN e termina em ROLLBACK. Não há COMMIT.
-- Não retire o ROLLBACK e não execute apenas os INSERT.
-- A coluna encrypted_password fica vazia: estes registros não autenticam.
-- Se o editor respeitar a transação, um erro no meio também desfaz os dados,
-- porque a transação aborta antes de qualquer COMMIT.
--
-- O que dá para revisar sem executar o banco:
--   ausência de cercas Markdown
--   anon e service_role sem privilégio na tabela nova
--   authenticated com SELECT, INSERT, UPDATE e DELETE
--   políticas só para authenticated
--   guarda chamando is_api_role(), current_account_can_write() e is_approved_admin()
--
-- O que só um PostgreSQL em execução confirma:
--   cada SELECT, INSERT, UPDATE e DELETE abaixo, o SQLSTATE e o efeito na linha
-- Este arquivo não registra que esses testes tenham passado.

begin;

create or replace function public._registration_try(statement text)
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

create or replace function public._registration_expect(actual text, expected text, message text)
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

grant execute on function public._registration_try(text) to anon, authenticated;
grant execute on function public._registration_expect(text, text, text) to anon, authenticated;

do $priv$
declare
  privilege text;
begin
  foreach privilege in array array['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'TRUNCATE'] loop
    if has_table_privilege('anon', 'public.registration_forms', privilege) then
      raise exception 'anon não deveria ter % em registration_forms', privilege;
    end if;
  end loop;

  foreach privilege in array array['SELECT', 'INSERT', 'UPDATE', 'DELETE'] loop
    if not has_table_privilege('authenticated', 'public.registration_forms', privilege) then
      raise exception 'authenticated precisa de % em registration_forms', privilege;
    end if;
  end loop;

  if has_table_privilege('authenticated', 'public.registration_forms', 'TRUNCATE') then
    raise exception 'authenticated não deveria truncar registration_forms';
  end if;

  if not has_function_privilege('authenticated', 'public.guard_registration_form()', 'EXECUTE') then
    raise exception 'authenticated precisa executar guard_registration_form';
  end if;

  if has_function_privilege('anon', 'public.guard_registration_form()', 'EXECUTE') then
    raise exception 'anon não deveria executar guard_registration_form';
  end if;

  if exists (select 1 from pg_catalog.pg_roles where rolname = 'service_role') then
    foreach privilege in array array['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'TRUNCATE'] loop
      if has_table_privilege('service_role', 'public.registration_forms', privilege) then
        raise exception 'service_role não deveria ter % em registration_forms', privilege;
      end if;
    end loop;

    if has_function_privilege('service_role', 'public.guard_registration_form()', 'EXECUTE') then
      raise exception 'service_role não deveria executar guard_registration_form';
    end if;
  else
    raise notice 'service_role ausente neste servidor; o privilégio da tabela nova não foi conferido para esse papel';
  end if;
end
$priv$;

select set_config('request.jwt.claim.sub', '', true);
select set_config('request.jwt.claim.role', '', true);
select set_config('request.jwt.claims', '', true);

insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change,
  email_change_token_current,
  reauthentication_token,
  phone_change,
  phone_change_token
) values
  (
    '00000000-0000-0000-0000-000000000000',
    '91111111-1111-4111-9111-111111111111',
    'authenticated',
    'authenticated',
    'ficha.pendente@example.com',
    '',
    pg_catalog.now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"role":"comprador","full_name":"Comprador Pendente Ficha"}'::jsonb,
    pg_catalog.now(),
    pg_catalog.now(),
    '', '', '', '', '', '', '', ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '92222222-2222-4222-9222-222222222222',
    'authenticated',
    'authenticated',
    'ficha.comprador@example.com',
    '',
    pg_catalog.now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"role":"comprador","full_name":"Comprador Ficha"}'::jsonb,
    pg_catalog.now(),
    pg_catalog.now(),
    '', '', '', '', '', '', '', ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '93333333-3333-4333-9333-333333333333',
    'authenticated',
    'authenticated',
    'ficha.fornecedor@example.com',
    '',
    pg_catalog.now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"role":"fornecedor","full_name":"Fornecedor Ficha"}'::jsonb,
    pg_catalog.now(),
    pg_catalog.now(),
    '', '', '', '', '', '', '', ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '94444444-4444-4444-9444-444444444444',
    'authenticated',
    'authenticated',
    'ficha.suspenso@example.com',
    '',
    pg_catalog.now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"role":"comprador","full_name":"Comprador Suspenso Ficha"}'::jsonb,
    pg_catalog.now(),
    pg_catalog.now(),
    '', '', '', '', '', '', '', ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '95555555-5555-4555-9555-555555555555',
    'authenticated',
    'authenticated',
    'ficha.outro@example.com',
    '',
    pg_catalog.now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"role":"comprador","full_name":"Outro Comprador Ficha"}'::jsonb,
    pg_catalog.now(),
    pg_catalog.now(),
    '', '', '', '', '', '', '', ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '96666666-6666-4666-9666-666666666666',
    'authenticated',
    'authenticated',
    'ficha.admin@example.com',
    '',
    pg_catalog.now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"role":"comprador","full_name":"Administrador Ficha"}'::jsonb,
    pg_catalog.now(),
    pg_catalog.now(),
    '', '', '', '', '', '', '', ''
  );

update public.profiles
set status = 'aprovado'
where id in (
  '92222222-2222-4222-9222-222222222222',
  '93333333-3333-4333-9333-333333333333',
  '94444444-4444-4444-9444-444444444444',
  '95555555-5555-4555-9555-555555555555'
);

update public.profiles
set role = 'administrador',
    status = 'aprovado'
where id = '96666666-6666-4666-9666-666666666666';

select public._registration_expect(
  (select role::text from public.profiles where id = '93333333-3333-4333-9333-333333333333'),
  'fornecedor',
  'o perfil de fornecedor da ficha nasceu como fornecedor'
);
select public._registration_expect(
  (select status::text from public.profiles where id = '91111111-1111-4111-9111-111111111111'),
  'pendente',
  'o comprador pendente da ficha continua pendente'
);

-- Visitante
select set_config('request.jwt.claim.sub', '', true);
select set_config('request.jwt.claim.role', 'anon', true);
select set_config('request.jwt.claims', '{"role":"anon"}', true);
set local role anon;

select public._registration_expect(
  public._registration_try('select count(*) from public.registration_forms'),
  '42501',
  'anônimo não consulta fichas'
);
select public._registration_expect(
  public._registration_try(
    'insert into public.registration_forms (profile_id, party, legal_name, tax_id, address, phone, email, responsible_name, segment) values (''92222222-2222-4222-9222-222222222222'', ''comprador'', ''Hotel Anônimo'', ''34028316000103'', ''Rua das Flores, 10'', ''5545999992001'', ''anonimo@example.com'', ''Ana'', ''Hotelaria'')'
  ),
  '42501',
  'anônimo não cria ficha'
);

reset role;

-- Comprador pendente cria a própria ficha com CPF
select set_config('request.jwt.claim.sub', '91111111-1111-4111-9111-111111111111', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"91111111-1111-4111-9111-111111111111","role":"authenticated"}',
  true
);
set local role authenticated;

select public._registration_expect(
  public._registration_try(
    'insert into public.registration_forms (profile_id, party, legal_name, tax_id, address, phone, email, responsible_name, segment) values (''91111111-1111-4111-9111-111111111111'', ''comprador'', ''Hotel Pendente'', ''52998224725'', ''Rua das Flores, 10'', ''5545999992001'', ''pendente@example.com'', ''Paula'', ''Hotelaria'')'
  ),
  '1',
  'comprador pendente cria a própria ficha'
);
select public._registration_expect(
  public._registration_try(
    'insert into public.registration_forms (profile_id, party, legal_name, tax_id, address, phone, email, responsible_name, segment) values (''92222222-2222-4222-9222-222222222222'', ''comprador'', ''Hotel de Outro'', ''34028316000103'', ''Rua das Flores, 10'', ''5545999992001'', ''outro@example.com'', ''Paula'', ''Hotelaria'')'
  ),
  '42501',
  'comprador não cria ficha em nome de outro usuário'
);
select public._registration_expect(
  public._registration_try(
    'insert into public.registration_forms (profile_id, party, legal_name, tax_id, address, phone, email, responsible_name, segment) values (''91111111-1111-4111-9111-111111111111'', ''fornecedor'', ''Hotel Pendente'', ''52998224725'', ''Rua das Flores, 10'', ''5545999992001'', ''pendente@example.com'', ''Paula'', ''Hotelaria'')'
  ),
  '42501',
  'comprador não grava ficha de fornecedor'
);
select public._registration_expect(
  public._registration_try(
    'insert into public.registration_forms (profile_id, party, legal_name, tax_id, address, phone, email, responsible_name, segment) values (''91111111-1111-4111-9111-111111111111'', ''comprador'', ''Hotel Pendente'', ''11111111111'', ''Rua das Flores, 10'', ''5545999992001'', ''pendente@example.com'', ''Paula'', ''Hotelaria'')'
  ),
  '23514',
  'documento inválido não entra na ficha'
);

reset role;

-- Fornecedor aprovado
select set_config('request.jwt.claim.sub', '93333333-3333-4333-9333-333333333333', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"93333333-3333-4333-9333-333333333333","role":"authenticated"}',
  true
);
set local role authenticated;

select public._registration_expect(
  public._registration_try(
    'insert into public.registration_forms (profile_id, party, legal_name, tax_id, address, phone, email, responsible_name, segment) values (''93333333-3333-4333-9333-333333333333'', ''fornecedor'', ''Ateliê Ficha Ltda'', ''61.407.832/0001-11'', ''Avenida Brasil, 200'', ''(45) 99999-2002'', ''FICHA@EXAMPLE.COM'', ''Ana Comercial'', ''Mobiliário'')'
  ),
  '1',
  'fornecedor cria a própria ficha'
);
select public._registration_expect(
  (select tax_id from public.registration_forms where profile_id = '93333333-3333-4333-9333-333333333333'),
  '61407832000111',
  'o CNPJ da ficha fica só com dígitos'
);
select public._registration_expect(
  (select email from public.registration_forms where profile_id = '93333333-3333-4333-9333-333333333333'),
  'ficha@example.com',
  'o e-mail da ficha fica normalizado'
);
select public._registration_expect(
  (select count(*) from public.registration_forms)::text,
  '1',
  'fornecedor não vê a ficha de outro usuário'
);

reset role;

-- Outro comprador não altera nem exclui a ficha alheia
select set_config('request.jwt.claim.sub', '95555555-5555-4555-9555-555555555555', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"95555555-5555-4555-9555-555555555555","role":"authenticated"}',
  true
);
set local role authenticated;

select public._registration_expect(
  (select count(*) from public.registration_forms)::text,
  '0',
  'outro comprador não consulta fichas alheias'
);
select public._registration_expect(
  public._registration_try(
    'update public.registration_forms set address = ''Endereço invadido, 1'' where profile_id = ''93333333-3333-4333-9333-333333333333'''
  ),
  '0',
  'outro comprador não altera ficha alheia'
);
select public._registration_expect(
  public._registration_try(
    'delete from public.registration_forms where profile_id = ''93333333-3333-4333-9333-333333333333'''
  ),
  '0',
  'outro comprador não exclui ficha alheia'
);

reset role;

-- Administrador consulta todas e não grava no lugar de outro
select set_config('request.jwt.claim.sub', '96666666-6666-4666-9666-666666666666', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"96666666-6666-4666-9666-666666666666","role":"authenticated"}',
  true
);
set local role authenticated;

select public._registration_expect(
  (select count(*) from public.registration_forms)::text,
  '2',
  'administrador aprovado consulta todas as fichas'
);
select public._registration_expect(
  public._registration_try(
    'insert into public.registration_forms (profile_id, party, legal_name, tax_id, address, phone, email, responsible_name, segment) values (''96666666-6666-4666-9666-666666666666'', ''comprador'', ''Painel'', ''34028316000103'', ''Rua das Flores, 10'', ''5545999992003'', ''admin@example.com'', ''Admin'', ''Hotelaria'')'
  ),
  '42501',
  'administrador não cria ficha de comprador para si'
);
select public._registration_expect(
  public._registration_try(
    'update public.registration_forms set address = ''Endereço do painel, 9'' where profile_id = ''93333333-3333-4333-9333-333333333333'''
  ),
  '0',
  'administrador não altera a ficha pela API'
);

reset role;

-- Autor altera a própria ficha e não troca o vínculo
select set_config('request.jwt.claim.sub', '93333333-3333-4333-9333-333333333333', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"93333333-3333-4333-9333-333333333333","role":"authenticated"}',
  true
);
set local role authenticated;

select public._registration_expect(
  public._registration_try(
    'update public.registration_forms set address = ''Avenida Brasil, 250'' where profile_id = ''93333333-3333-4333-9333-333333333333'''
  ),
  '1',
  'fornecedor altera a própria ficha'
);
select public._registration_expect(
  (select address from public.registration_forms where profile_id = '93333333-3333-4333-9333-333333333333'),
  'Avenida Brasil, 250',
  'o endereço da própria ficha foi atualizado'
);
select public._registration_expect(
  public._registration_try(
    'update public.registration_forms set profile_id = ''95555555-5555-4555-9555-555555555555'' where profile_id = ''93333333-3333-4333-9333-333333333333'''
  ),
  '42501',
  'o autor não transfere a ficha'
);

reset role;

-- Conta suspensa ainda consulta, mas não altera nem exclui
select set_config('request.jwt.claim.sub', '', true);
select set_config('request.jwt.claim.role', '', true);
select set_config('request.jwt.claims', '', true);

update public.profiles
set status = 'suspenso'
where id = '93333333-3333-4333-9333-333333333333';

select set_config('request.jwt.claim.sub', '93333333-3333-4333-9333-333333333333', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"93333333-3333-4333-9333-333333333333","role":"authenticated"}',
  true
);
set local role authenticated;

select public._registration_expect(
  (select count(*) from public.registration_forms where profile_id = '93333333-3333-4333-9333-333333333333')::text,
  '1',
  'conta suspensa ainda consulta a própria ficha'
);
select public._registration_expect(
  public._registration_try(
    'update public.registration_forms set address = ''Endereço suspenso, 1'' where profile_id = ''93333333-3333-4333-9333-333333333333'''
  ),
  '0',
  'conta suspensa não altera a própria ficha'
);
select public._registration_expect(
  public._registration_try(
    'delete from public.registration_forms where profile_id = ''93333333-3333-4333-9333-333333333333'''
  ),
  '0',
  'conta suspensa não exclui a própria ficha'
);

reset role;

-- Autor ativo exclui a própria ficha
select set_config('request.jwt.claim.sub', '91111111-1111-4111-9111-111111111111', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"91111111-1111-4111-9111-111111111111","role":"authenticated"}',
  true
);
set local role authenticated;

select public._registration_expect(
  public._registration_try(
    'delete from public.registration_forms where profile_id = ''91111111-1111-4111-9111-111111111111'''
  ),
  '1',
  'o autor exclui a própria ficha'
);
select public._registration_expect(
  (select count(*) from public.registration_forms)::text,
  '0',
  'a ficha excluída some da consulta do autor'
);

reset role;

select set_config('request.jwt.claim.sub', '96666666-6666-4666-9666-666666666666', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"96666666-6666-4666-9666-666666666666","role":"authenticated"}',
  true
);
set local role authenticated;

select public._registration_expect(
  (select count(*) from public.registration_forms)::text,
  '1',
  'administrador ainda vê a ficha que o autor não excluiu'
);

reset role;

rollback;
