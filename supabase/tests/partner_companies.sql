-- Testes manuais das empresas parceiras.
--
-- Rode o arquivo inteiro, uma vez, depois de
-- supabase/sql/001_initial_schema.sql e supabase/sql/004_partner_companies.sql.
-- Ele abre BEGIN e termina em ROLLBACK. Não há COMMIT.

begin;

create or replace function public._partner_try(statement text)
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

create or replace function public._partner_expect(actual text, expected text, message text)
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

grant execute on function public._partner_try(text) to anon, authenticated;
grant execute on function public._partner_expect(text, text, text) to anon, authenticated;

do $priv$
begin
  if not has_function_privilege('anon', 'public.partner_companies()', 'EXECUTE') then
    raise exception 'anon precisa executar partner_companies';
  end if;
  if not has_function_privilege('authenticated', 'public.partner_companies()', 'EXECUTE') then
    raise exception 'authenticated precisa executar partner_companies';
  end if;
  if exists (select 1 from pg_catalog.pg_roles where rolname = 'service_role')
    and has_function_privilege('service_role', 'public.partner_companies()', 'EXECUTE') then
    raise exception 'service_role não deveria executar partner_companies';
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
) values
  (
    '00000000-0000-0000-0000-000000000000',
    '97111111-1111-4111-9711-111111111111',
    'authenticated', 'authenticated', 'parceiro.aprovado@example.com', '',
    pg_catalog.now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"role":"fornecedor","full_name":"Fornecedor Parceiro"}'::jsonb,
    pg_catalog.now(), pg_catalog.now(),
    '', '', '', '', '', '', '', ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '97222222-2222-4222-9722-222222222222',
    'authenticated', 'authenticated', 'parceiro.pendente@example.com', '',
    pg_catalog.now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"role":"fornecedor","full_name":"Fornecedor Pendente"}'::jsonb,
    pg_catalog.now(), pg_catalog.now(),
    '', '', '', '', '', '', '', ''
  );

update public.profiles
set status = 'aprovado'
where id = '97111111-1111-4111-9711-111111111111';

insert into public.suppliers (
  profile_id, legal_name, trade_name, cnpj, segment, description, logo,
  commercial_contact, contact_email, whatsapp, status
) values
  (
    '97111111-1111-4111-9711-111111111111',
    'Parceiro Aprovado Ltda',
    'Ateliê Parceiro',
    '61407832000111',
    'Mobiliário',
    'Descrição comercial do ateliê parceiro aprovado.',
    'https://example.com/logo-parceiro.png',
    'Contato Interno',
    'interno@example.com',
    '5545999993001',
    'aprovado'
  ),
  (
    '97222222-2222-4222-9722-222222222222',
    'Parceiro Pendente Ltda',
    'Ateliê Pendente',
    '70984125000189',
    'Iluminação',
    'Descrição de um fornecedor que ainda não foi aprovado.',
    'logos/pendente.png',
    'Outro Contato',
    'pendente@example.com',
    '5545999993002',
    'pendente'
  );

insert into public.catalogs (supplier_id, category_id, title, description, visibility)
select s.id, c.id, 'Catálogo parceiro', 'Descrição do catálogo publicado do parceiro.', 'publico'::public.catalog_visibility
from public.suppliers s
cross join public.catalog_categories c
where s.profile_id = '97111111-1111-4111-9711-111111111111'
  and c.slug = 'enxoval-de-ab';

insert into public.catalog_files (
  id, catalog_id, supplier_id, kind, bucket_id, storage_path, mime_type, byte_size, status
)
select
  'd1111111-1111-4111-8111-111111111111',
  c.id,
  c.supplier_id,
  'pdf',
  'catalog-pdfs',
  c.id::text || '/d1111111-1111-4111-8111-111111111111.pdf',
  'application/pdf',
  2048,
  'aprovado'
from public.catalogs c
where c.title = 'Catálogo parceiro';

update public.catalogs
set status = 'aprovado'
where title = 'Catálogo parceiro';

select set_config('request.jwt.claim.role', 'anon', true);
select set_config('request.jwt.claims', '{"role":"anon"}', true);
set local role anon;

select public._partner_expect(
  (select trade_name from public.partner_companies() where trade_name = 'Ateliê Parceiro'),
  'Ateliê Parceiro',
  'visitante vê o nome comercial do fornecedor aprovado'
);
select public._partner_expect(
  (select count(*) from public.partner_companies() where trade_name = 'Ateliê Pendente')::text,
  '0',
  'visitante não vê fornecedor pendente'
);
select public._partner_expect(
  public._partner_try('select cnpj from public.suppliers'),
  '42501',
  'visitante não lê a tabela de fornecedores'
);

reset role;
rollback;
