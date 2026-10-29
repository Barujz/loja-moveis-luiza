-- Testes manuais de permissão dos pedidos de orçamento.
--
-- Rode o arquivo inteiro, uma vez, depois de
-- supabase/sql/001_initial_schema.sql e supabase/sql/002_quote_requests.sql.
-- Ele abre BEGIN e termina em ROLLBACK. Não há COMMIT.
-- Não retire o ROLLBACK e não execute apenas os INSERT.
-- A coluna encrypted_password fica vazia: estes registros não autenticam.
-- Se o editor respeitar a transação, um erro no meio também desfaz os dados,
-- porque a transação aborta antes de qualquer COMMIT.
--
-- O que dá para revisar sem executar o banco:
--   ausência de cercas Markdown
--   anon e service_role sem privilégio na tabela nova
--   authenticated sem DELETE
--   índice único só para state = aberta
--   guarda e políticas chamando catalog_is_public(uuid), catalog_is_restricted(uuid),
--   is_api_role() e is_approved_admin()
--
-- O que só um PostgreSQL em execução confirma:
--   cada SELECT, INSERT, UPDATE e DELETE abaixo, o SQLSTATE e o efeito na linha
-- Este arquivo não registra que esses testes tenham passado.

begin;

create or replace function public._quote_try(statement text)
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

create or replace function public._quote_expect(actual text, expected text, message text)
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

grant execute on function public._quote_try(text) to anon, authenticated;
grant execute on function public._quote_expect(text, text, text) to anon, authenticated;

do $priv$
declare
  privilege text;
begin
  foreach privilege in array array['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'TRUNCATE'] loop
    if has_table_privilege('anon', 'public.quote_requests', privilege) then
      raise exception 'anon não deveria ter % em quote_requests', privilege;
    end if;
  end loop;

  foreach privilege in array array['SELECT', 'INSERT', 'UPDATE'] loop
    if not has_table_privilege('authenticated', 'public.quote_requests', privilege) then
      raise exception 'authenticated precisa de % em quote_requests', privilege;
    end if;
  end loop;

  if has_table_privilege('authenticated', 'public.quote_requests', 'DELETE') then
    raise exception 'authenticated não deveria excluir quote_requests';
  end if;

  if not has_function_privilege('authenticated', 'public.guard_quote_request()', 'EXECUTE') then
    raise exception 'authenticated precisa executar guard_quote_request';
  end if;

  if has_function_privilege('anon', 'public.guard_quote_request()', 'EXECUTE') then
    raise exception 'anon não deveria executar guard_quote_request';
  end if;

  if exists (select 1 from pg_catalog.pg_roles where rolname = 'service_role') then
    foreach privilege in array array['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'TRUNCATE'] loop
      if has_table_privilege('service_role', 'public.quote_requests', privilege) then
        raise exception 'service_role não deveria ter % em quote_requests', privilege;
      end if;
    end loop;

    if has_function_privilege('service_role', 'public.guard_quote_request()', 'EXECUTE') then
      raise exception 'service_role não deveria executar guard_quote_request';
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
    '81111111-1111-4111-8111-111111111111',
    'authenticated',
    'authenticated',
    'quote.pendente@example.com',
    '',
    pg_catalog.now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"role":"comprador","full_name":"Comprador Pendente"}'::jsonb,
    pg_catalog.now(),
    pg_catalog.now(),
    '', '', '', '', '', '', '', ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '82222222-2222-4222-8222-222222222222',
    'authenticated',
    'authenticated',
    'quote.aprovado.a@example.com',
    '',
    pg_catalog.now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"role":"comprador","full_name":"Comprador Aprovado A"}'::jsonb,
    pg_catalog.now(),
    pg_catalog.now(),
    '', '', '', '', '', '', '', ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '83333333-3333-4333-8333-333333333333',
    'authenticated',
    'authenticated',
    'quote.aprovado.b@example.com',
    '',
    pg_catalog.now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"role":"comprador","full_name":"Comprador Aprovado B"}'::jsonb,
    pg_catalog.now(),
    pg_catalog.now(),
    '', '', '', '', '', '', '', ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '84444444-4444-4444-8444-444444444444',
    'authenticated',
    'authenticated',
    'quote.empresa.pendente@example.com',
    '',
    pg_catalog.now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"role":"comprador","full_name":"Empresa Pendente"}'::jsonb,
    pg_catalog.now(),
    pg_catalog.now(),
    '', '', '', '', '', '', '', ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '85555555-5555-4555-8555-555555555555',
    'authenticated',
    'authenticated',
    'quote.fornecedor.a@example.com',
    '',
    pg_catalog.now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"role":"fornecedor","full_name":"Fornecedor Orçamento A"}'::jsonb,
    pg_catalog.now(),
    pg_catalog.now(),
    '', '', '', '', '', '', '', ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '86666666-6666-4666-8666-666666666666',
    'authenticated',
    'authenticated',
    'quote.fornecedor.b@example.com',
    '',
    pg_catalog.now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"role":"fornecedor","full_name":"Fornecedor Orçamento B"}'::jsonb,
    pg_catalog.now(),
    pg_catalog.now(),
    '', '', '', '', '', '', '', ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '87777777-7777-4777-8777-777777777777',
    'authenticated',
    'authenticated',
    'quote.admin@example.com',
    '',
    pg_catalog.now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"role":"comprador","full_name":"Administrador Orçamento"}'::jsonb,
    pg_catalog.now(),
    pg_catalog.now(),
    '', '', '', '', '', '', '', ''
  );

insert into public.buyers (profile_id, company_name, cnpj, job_title, segment, whatsapp)
values
  ('81111111-1111-4111-8111-111111111111', 'Hotel Pendente', '27865757000102', 'Gerente', 'Hotelaria', '5545999991001'),
  ('82222222-2222-4222-8222-222222222222', 'Hotel Aprovado A', '34028316000103', 'Diretor', 'Hotelaria', '5545999991002'),
  ('83333333-3333-4333-8333-333333333333', 'Hotel Aprovado B', '45723174000110', 'Compras', 'Hotelaria', '5545999991003'),
  ('84444444-4444-4444-8444-444444444444', 'Hotel Empresa Pendente', '52345678000100', 'Compras', 'Hotelaria', '5545999991004');

insert into public.suppliers (
  profile_id, legal_name, trade_name, cnpj, segment, description, logo,
  commercial_contact, contact_email, whatsapp
) values
  (
    '85555555-5555-4555-8555-555555555555',
    'Fornecedor Orçamento A Ltda',
    'Ateliê Orçamento A',
    '61407832000111',
    'Mobiliário',
    'Descrição da empresa A para pedidos de orçamento.',
    'logos/quote-a.png',
    'Ana Comercial',
    'quote.comercial.a@example.com',
    '5545999991005'
  ),
  (
    '86666666-6666-4666-8666-666666666666',
    'Fornecedor Orçamento B Ltda',
    'Ateliê Orçamento B',
    '70984125000189',
    'Iluminação',
    'Descrição da empresa B para pedidos de orçamento.',
    'logos/quote-b.png',
    'Bruno Comercial',
    'quote.comercial.b@example.com',
    '5545999991006'
  );

update public.profiles
set status = 'aprovado'
where id in (
  '82222222-2222-4222-8222-222222222222',
  '83333333-3333-4333-8333-333333333333',
  '84444444-4444-4444-8444-444444444444',
  '85555555-5555-4555-8555-555555555555',
  '86666666-6666-4666-8666-666666666666'
);

update public.profiles
set role = 'administrador',
    status = 'aprovado'
where id = '87777777-7777-4777-8777-777777777777';

update public.buyers
set status = 'aprovado'
where profile_id in (
  '82222222-2222-4222-8222-222222222222',
  '83333333-3333-4333-8333-333333333333'
);

update public.suppliers
set status = 'aprovado'
where profile_id in (
  '85555555-5555-4555-8555-555555555555',
  '86666666-6666-4666-8666-666666666666'
);

insert into public.catalogs (supplier_id, category_id, title, description, visibility)
select s.id, c.id, 'Orçamento público', 'Descrição do catálogo público para orçamento.', 'publico'::public.catalog_visibility
from public.suppliers s
cross join public.catalog_categories c
where s.profile_id = '85555555-5555-4555-8555-555555555555'
  and c.slug = 'enxoval-de-ab';

insert into public.catalogs (supplier_id, category_id, title, description, visibility)
select s.id, c.id, 'Orçamento restrito', 'Descrição do catálogo restrito para orçamento.', 'restrito'::public.catalog_visibility
from public.suppliers s
cross join public.catalog_categories c
where s.profile_id = '85555555-5555-4555-8555-555555555555'
  and c.slug = 'enxoval-de-ab';

insert into public.catalogs (supplier_id, category_id, title, description, visibility)
select s.id, c.id, 'Orçamento suspenso', 'Descrição do catálogo que será suspenso.', 'publico'::public.catalog_visibility
from public.suppliers s
cross join public.catalog_categories c
where s.profile_id = '85555555-5555-4555-8555-555555555555'
  and c.slug = 'enxoval-de-ab';

insert into public.catalogs (supplier_id, category_id, title, description, visibility)
select s.id, c.id, 'Orçamento rascunho', 'Descrição do catálogo que permanece pendente.', 'publico'::public.catalog_visibility
from public.suppliers s
cross join public.catalog_categories c
where s.profile_id = '85555555-5555-4555-8555-555555555555'
  and c.slug = 'enxoval-de-ab';

insert into public.catalog_files (
  id, catalog_id, supplier_id, kind, bucket_id, storage_path, mime_type, byte_size, status
)
select
  case c.title
    when 'Orçamento público' then 'c1111111-1111-4111-8111-111111111111'::uuid
    when 'Orçamento restrito' then 'c2222222-2222-4222-8222-222222222222'::uuid
    else 'c3333333-3333-4333-8333-333333333333'::uuid
  end,
  c.id,
  c.supplier_id,
  'pdf',
  'catalog-pdfs',
  c.id::text || '/' || case c.title
    when 'Orçamento público' then 'c1111111-1111-4111-8111-111111111111'
    when 'Orçamento restrito' then 'c2222222-2222-4222-8222-222222222222'
    else 'c3333333-3333-4333-8333-333333333333'
  end || '.pdf',
  'application/pdf',
  2048,
  'aprovado'
from public.catalogs c
where c.title in ('Orçamento público', 'Orçamento restrito', 'Orçamento suspenso');

update public.catalogs
set status = 'aprovado'
where title in ('Orçamento público', 'Orçamento restrito', 'Orçamento suspenso');

update public.catalogs
set status = 'suspenso'
where title = 'Orçamento suspenso';

select set_config(
  'quote.buyer_a_id',
  (select id::text from public.buyers where profile_id = '82222222-2222-4222-8222-222222222222'),
  true
);
select set_config(
  'quote.buyer_b_id',
  (select id::text from public.buyers where profile_id = '83333333-3333-4333-8333-333333333333'),
  true
);
select set_config(
  'quote.buyer_pending_id',
  (select id::text from public.buyers where profile_id = '81111111-1111-4111-8111-111111111111'),
  true
);
select set_config(
  'quote.buyer_company_pending_id',
  (select id::text from public.buyers where profile_id = '84444444-4444-4444-8444-444444444444'),
  true
);
select set_config(
  'quote.supplier_a_id',
  (select id::text from public.suppliers where profile_id = '85555555-5555-4555-8555-555555555555'),
  true
);
select set_config(
  'quote.supplier_b_id',
  (select id::text from public.suppliers where profile_id = '86666666-6666-4666-8666-666666666666'),
  true
);
select set_config(
  'quote.public_catalog_id',
  (select id::text from public.catalogs where title = 'Orçamento público'),
  true
);
select set_config(
  'quote.restricted_catalog_id',
  (select id::text from public.catalogs where title = 'Orçamento restrito'),
  true
);
select set_config(
  'quote.suspended_catalog_id',
  (select id::text from public.catalogs where title = 'Orçamento suspenso'),
  true
);
select set_config(
  'quote.draft_catalog_id',
  (select id::text from public.catalogs where title = 'Orçamento rascunho'),
  true
);

select public._quote_expect(
  (select case when published_pdf_id is not null and published_at is not null then 'publicado' else 'oculto' end
   from public.catalogs where title = 'Orçamento público'),
  'publicado',
  'o catálogo público de teste ficou publicado'
);
select public._quote_expect(
  (select status::text from public.catalogs where title = 'Orçamento suspenso'),
  'suspenso',
  'o catálogo de teste foi suspenso'
);
select public._quote_expect(
  (select status::text from public.buyers where profile_id = '84444444-4444-4444-8444-444444444444'),
  'pendente',
  'a empresa do quarto comprador continua pendente'
);

-- Visitante
select set_config('request.jwt.claim.sub', '', true);
select set_config('request.jwt.claim.role', 'anon', true);
select set_config('request.jwt.claims', '{"role":"anon"}', true);
set local role anon;

select public._quote_expect(
  public._quote_try('select count(*) from public.quote_requests'),
  '42501',
  'anônimo não consulta pedidos de orçamento'
);
select public._quote_expect(
  public._quote_try(
    format(
      'insert into public.quote_requests (buyer_id, catalog_id, supplier_id, message) values (%L::uuid, %L::uuid, %L::uuid, %L)',
      current_setting('quote.buyer_a_id'),
      current_setting('quote.public_catalog_id'),
      current_setting('quote.supplier_a_id'),
      'Pedido anônimo'
    )
  ),
  '42501',
  'anônimo não cria pedido de orçamento'
);

reset role;

-- Comprador com perfil e empresa pendentes
select set_config('request.jwt.claim.sub', '81111111-1111-4111-8111-111111111111', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"81111111-1111-4111-8111-111111111111","role":"authenticated"}',
  true
);
set local role authenticated;

select public._quote_expect(
  public._quote_try(
    format(
      'insert into public.quote_requests (buyer_id, catalog_id, supplier_id, message) values (%L::uuid, %L::uuid, %L::uuid, %L)',
      current_setting('quote.buyer_pending_id'),
      current_setting('quote.public_catalog_id'),
      current_setting('quote.supplier_a_id'),
      'Pedido de comprador pendente'
    )
  ),
  '42501',
  'comprador pendente não solicita orçamento'
);

reset role;

-- Perfil aprovado, empresa ainda pendente
select set_config('request.jwt.claim.sub', '84444444-4444-4444-8444-444444444444', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"84444444-4444-4444-8444-444444444444","role":"authenticated"}',
  true
);
set local role authenticated;

select public._quote_expect(
  public._quote_try(
    format(
      'insert into public.quote_requests (buyer_id, catalog_id, supplier_id, message) values (%L::uuid, %L::uuid, %L::uuid, %L)',
      current_setting('quote.buyer_company_pending_id'),
      current_setting('quote.public_catalog_id'),
      current_setting('quote.supplier_a_id'),
      'Pedido com empresa pendente'
    )
  ),
  '42501',
  'perfil aprovado com empresa pendente não solicita orçamento'
);

reset role;

-- Fornecedor
select set_config('request.jwt.claim.sub', '85555555-5555-4555-8555-555555555555', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"85555555-5555-4555-8555-555555555555","role":"authenticated"}',
  true
);
set local role authenticated;

select public._quote_expect(
  (select count(*) from public.quote_requests)::text,
  '0',
  'fornecedor não vê pedidos de orçamento'
);
select public._quote_expect(
  public._quote_try(
    format(
      'insert into public.quote_requests (buyer_id, catalog_id, supplier_id, message) values (%L::uuid, %L::uuid, %L::uuid, %L)',
      current_setting('quote.buyer_a_id'),
      current_setting('quote.public_catalog_id'),
      current_setting('quote.supplier_a_id'),
      'Pedido feito pelo fornecedor'
    )
  ),
  '42501',
  'fornecedor não cria pedido de orçamento'
);

reset role;

-- Administrador não é comprador
select set_config('request.jwt.claim.sub', '87777777-7777-4777-8777-777777777777', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"87777777-7777-4777-8777-777777777777","role":"authenticated"}',
  true
);
set local role authenticated;

select public._quote_expect(
  public._quote_try(
    format(
      'insert into public.quote_requests (buyer_id, catalog_id, supplier_id, message) values (%L::uuid, %L::uuid, %L::uuid, %L)',
      current_setting('quote.buyer_a_id'),
      current_setting('quote.public_catalog_id'),
      current_setting('quote.supplier_a_id'),
      'Pedido feito pelo administrador'
    )
  ),
  '42501',
  'administrador não cria pedido no lugar do comprador'
);

reset role;

-- Comprador aprovado A
select set_config('request.jwt.claim.sub', '82222222-2222-4222-8222-222222222222', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"82222222-2222-4222-8222-222222222222","role":"authenticated"}',
  true
);
set local role authenticated;

select public._quote_expect(
  public._quote_try(
    format(
      'insert into public.quote_requests (buyer_id, catalog_id, supplier_id, message) values (%L::uuid, %L::uuid, %L::uuid, %L)',
      current_setting('quote.buyer_a_id'),
      current_setting('quote.public_catalog_id'),
      current_setting('quote.supplier_b_id'),
      'Fornecedor trocado'
    )
  ),
  '42501',
  'comprador aprovado não aponta outro fornecedor'
);
select public._quote_expect(
  public._quote_try(
    format(
      'insert into public.quote_requests (buyer_id, catalog_id, supplier_id, message) values (%L::uuid, %L::uuid, %L::uuid, %L)',
      current_setting('quote.buyer_b_id'),
      current_setting('quote.public_catalog_id'),
      current_setting('quote.supplier_a_id'),
      'Pedido com comprador alheio'
    )
  ),
  '42501',
  'comprador aprovado não usa o cadastro de outro comprador'
);
select public._quote_expect(
  public._quote_try(
    format(
      'insert into public.quote_requests (buyer_id, catalog_id, supplier_id, message) values (%L::uuid, %L::uuid, %L::uuid, %L)',
      current_setting('quote.buyer_a_id'),
      current_setting('quote.draft_catalog_id'),
      current_setting('quote.supplier_a_id'),
      'Pedido de rascunho'
    )
  ),
  '42501',
  'comprador aprovado não solicita orçamento de catálogo pendente'
);
select public._quote_expect(
  public._quote_try(
    format(
      'insert into public.quote_requests (buyer_id, catalog_id, supplier_id, message) values (%L::uuid, %L::uuid, %L::uuid, %L)',
      current_setting('quote.buyer_a_id'),
      current_setting('quote.suspended_catalog_id'),
      current_setting('quote.supplier_a_id'),
      'Pedido de catálogo suspenso'
    )
  ),
  '42501',
  'comprador aprovado não solicita orçamento de catálogo suspenso'
);
select public._quote_expect(
  public._quote_try(
    format(
      'insert into public.quote_requests (buyer_id, catalog_id, supplier_id, message, state) values (%L::uuid, %L::uuid, %L::uuid, %L, ''encerrada'')',
      current_setting('quote.buyer_a_id'),
      current_setting('quote.public_catalog_id'),
      current_setting('quote.supplier_a_id'),
      'Pedido já encerrado'
    )
  ),
  '42501',
  'pedido novo não entra encerrado'
);
select public._quote_expect(
  public._quote_try(
    format(
      'insert into public.quote_requests (buyer_id, catalog_id, supplier_id, message) values (%L::uuid, %L::uuid, %L::uuid, %L)',
      current_setting('quote.buyer_a_id'),
      current_setting('quote.public_catalog_id'),
      current_setting('quote.supplier_a_id'),
      'ab'
    )
  ),
  '23514',
  'mensagem curta demais é recusada'
);
select public._quote_expect(
  public._quote_try(
    format(
      'insert into public.quote_requests (id, buyer_id, catalog_id, supplier_id, message) values (%L::uuid, %L::uuid, %L::uuid, %L::uuid, %L)',
      'd1111111-1111-4111-8111-111111111111',
      current_setting('quote.buyer_a_id'),
      current_setting('quote.public_catalog_id'),
      current_setting('quote.supplier_a_id'),
      'Quero um orçamento do catálogo público.'
    )
  ),
  '1',
  'comprador aprovado solicita orçamento do catálogo público'
);
select public._quote_expect(
  public._quote_try(
    format(
      'insert into public.quote_requests (id, buyer_id, catalog_id, supplier_id, message) values (%L::uuid, %L::uuid, %L::uuid, %L::uuid, %L)',
      'd2222222-2222-4222-8222-222222222222',
      current_setting('quote.buyer_a_id'),
      current_setting('quote.restricted_catalog_id'),
      current_setting('quote.supplier_a_id'),
      'Quero um orçamento do catálogo restrito.'
    )
  ),
  '1',
  'comprador aprovado solicita orçamento do catálogo restrito'
);
select public._quote_expect(
  public._quote_try(
    format(
      'insert into public.quote_requests (buyer_id, catalog_id, supplier_id, message) values (%L::uuid, %L::uuid, %L::uuid, %L)',
      current_setting('quote.buyer_a_id'),
      current_setting('quote.public_catalog_id'),
      current_setting('quote.supplier_a_id'),
      'Segundo pedido aberto do mesmo catálogo.'
    )
  ),
  '23505',
  'não há dois pedidos abertos do mesmo comprador para o mesmo catálogo'
);
select public._quote_expect(
  public._quote_try($sql$
    update public.quote_requests
    set message = 'Mensagem reescrita pelo comprador'
    where id = 'd1111111-1111-4111-8111-111111111111'
  $sql$),
  '0',
  'comprador não recebe a própria linha para editar'
);
select public._quote_expect(
  public._quote_try(
    format(
      'update public.quote_requests set buyer_id = %L::uuid where id = ''d1111111-1111-4111-8111-111111111111''',
      current_setting('quote.buyer_b_id')
    )
  ),
  '0',
  'comprador não recebe a linha para trocar o dono'
);
select public._quote_expect(
  public._quote_try($sql$
    update public.quote_requests
    set state = 'encerrada'
    where id = 'd1111111-1111-4111-8111-111111111111'
  $sql$),
  '0',
  'comprador não encerra o próprio pedido'
);
select public._quote_expect(
  public._quote_try($sql$
    delete from public.quote_requests
    where id = 'd1111111-1111-4111-8111-111111111111'
  $sql$),
  '42501',
  'comprador não tem privilégio para excluir pedido'
);
select public._quote_expect(
  (select count(*) from public.quote_requests)::text,
  '2',
  'comprador aprovado vê só os próprios pedidos'
);

reset role;

select public._quote_expect(
  (select message from public.quote_requests where id = 'd1111111-1111-4111-8111-111111111111'),
  'Quero um orçamento do catálogo público.',
  'a mensagem continua a original depois das tentativas do comprador'
);
select public._quote_expect(
  (select buyer_id::text from public.quote_requests where id = 'd1111111-1111-4111-8111-111111111111'),
  current_setting('quote.buyer_a_id'),
  'o comprador do pedido continua o original'
);
select public._quote_expect(
  (select supplier_id::text from public.quote_requests where id = 'd1111111-1111-4111-8111-111111111111'),
  current_setting('quote.supplier_a_id'),
  'o fornecedor gravado é o dono do catálogo'
);
select public._quote_expect(
  (select state::text from public.quote_requests where id = 'd1111111-1111-4111-8111-111111111111'),
  'aberta',
  'o pedido público continua aberto'
);

-- Comprador aprovado B
select set_config('request.jwt.claim.sub', '83333333-3333-4333-8333-333333333333', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"83333333-3333-4333-8333-333333333333","role":"authenticated"}',
  true
);
set local role authenticated;

select public._quote_expect(
  (select count(*) from public.quote_requests where id = 'd1111111-1111-4111-8111-111111111111')::text,
  '0',
  'outro comprador não vê o pedido alheio'
);
select public._quote_expect(
  public._quote_try(
    format(
      'insert into public.quote_requests (id, buyer_id, catalog_id, supplier_id, message) values (%L::uuid, %L::uuid, %L::uuid, %L::uuid, %L)',
      'd3333333-3333-4333-8333-333333333333',
      current_setting('quote.buyer_b_id'),
      current_setting('quote.public_catalog_id'),
      current_setting('quote.supplier_a_id'),
      'Pedido do segundo comprador.'
    )
  ),
  '1',
  'outro comprador aprovado pode pedir o mesmo catálogo'
);
select public._quote_expect(
  (select count(*) from public.quote_requests)::text,
  '1',
  'o segundo comprador vê só o próprio pedido'
);

reset role;

-- Administrador acompanha e só encerra
select set_config('request.jwt.claim.sub', '87777777-7777-4777-8777-777777777777', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"87777777-7777-4777-8777-777777777777","role":"authenticated"}',
  true
);
set local role authenticated;

select public._quote_expect(
  (select count(*) from public.quote_requests)::text,
  '3',
  'administrador aprovado vê todos os pedidos'
);
select public._quote_expect(
  public._quote_try($sql$
    update public.quote_requests
    set message = 'Mensagem reescrita pelo administrador'
    where id = 'd1111111-1111-4111-8111-111111111111'
  $sql$),
  '42501',
  'administrador não reescreve a mensagem'
);
select public._quote_expect(
  public._quote_try(
    format(
      'update public.quote_requests set buyer_id = %L::uuid where id = ''d1111111-1111-4111-8111-111111111111''',
      current_setting('quote.buyer_b_id')
    )
  ),
  '42501',
  'administrador não troca o comprador do pedido'
);
select public._quote_expect(
  public._quote_try(
    format(
      'update public.quote_requests set supplier_id = %L::uuid where id = ''d1111111-1111-4111-8111-111111111111''',
      current_setting('quote.supplier_b_id')
    )
  ),
  '42501',
  'administrador não troca o fornecedor do pedido'
);
select public._quote_expect(
  public._quote_try($sql$
    update public.quote_requests
    set state = 'encerrada'
    where id = 'd1111111-1111-4111-8111-111111111111'
  $sql$),
  '1',
  'administrador aprovado encerra o pedido'
);
select public._quote_expect(
  (select state::text from public.quote_requests where id = 'd1111111-1111-4111-8111-111111111111'),
  'encerrada',
  'o pedido encerrado fica visível para o administrador'
);
select public._quote_expect(
  (
    select case when closed_at is not null then 'fechado' else 'aberto' end
    from public.quote_requests
    where id = 'd1111111-1111-4111-8111-111111111111'
  ),
  'fechado',
  'encerrar preenche a data de fechamento'
);
select public._quote_expect(
  public._quote_try($sql$
    update public.quote_requests
    set state = 'aberta'
    where id = 'd1111111-1111-4111-8111-111111111111'
  $sql$),
  '42501',
  'pedido encerrado não reabre'
);
select public._quote_expect(
  public._quote_try($sql$
    delete from public.quote_requests
    where id = 'd3333333-3333-4333-8333-333333333333'
  $sql$),
  '42501',
  'administrador não tem privilégio para excluir pedido'
);

reset role;

select public._quote_expect(
  (select message from public.quote_requests where id = 'd1111111-1111-4111-8111-111111111111'),
  'Quero um orçamento do catálogo público.',
  'a mensagem continua a original depois das tentativas do administrador'
);

-- O mesmo comprador pode abrir de novo depois do encerramento
select set_config('request.jwt.claim.sub', '82222222-2222-4222-8222-222222222222', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"82222222-2222-4222-8222-222222222222","role":"authenticated"}',
  true
);
set local role authenticated;

select public._quote_expect(
  public._quote_try(
    format(
      'insert into public.quote_requests (id, buyer_id, catalog_id, supplier_id, message) values (%L::uuid, %L::uuid, %L::uuid, %L::uuid, %L)',
      'd4444444-4444-4444-8444-444444444444',
      current_setting('quote.buyer_a_id'),
      current_setting('quote.public_catalog_id'),
      current_setting('quote.supplier_a_id'),
      'Novo pedido depois do encerramento.'
    )
  ),
  '1',
  'depois de encerrar, o comprador pode abrir outro pedido do mesmo catálogo'
);
select public._quote_expect(
  (select count(*) from public.quote_requests where buyer_id = current_setting('quote.buyer_a_id')::uuid and state = 'aberta')::text,
  '2',
  'o comprador vê o pedido restrito e o novo pedido público'
);

reset role;

-- Mesmo com DELETE concedido e política permissiva, a guarda bloqueia a API.
grant delete on table public.quote_requests to authenticated;
create policy quote_requests_delete_test
  on public.quote_requests
  for delete
  to authenticated
  using (true);

select set_config('request.jwt.claim.sub', '82222222-2222-4222-8222-222222222222', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"82222222-2222-4222-8222-222222222222","role":"authenticated"}',
  true
);
set local role authenticated;

select public._quote_expect(
  public._quote_try($sql$
    delete from public.quote_requests
    where id = 'd4444444-4444-4444-8444-444444444444'
  $sql$),
  '42501',
  'a guarda impede o comprador de excluir mesmo com privilégio e política'
);

reset role;

select set_config('request.jwt.claim.sub', '87777777-7777-4777-8777-777777777777', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"87777777-7777-4777-8777-777777777777","role":"authenticated"}',
  true
);
set local role authenticated;

select public._quote_expect(
  public._quote_try($sql$
    delete from public.quote_requests
    where id = 'd4444444-4444-4444-8444-444444444444'
  $sql$),
  '42501',
  'a guarda impede o administrador de excluir mesmo com privilégio e política'
);

reset role;

drop policy quote_requests_delete_test on public.quote_requests;
revoke delete on table public.quote_requests from authenticated;

select public._quote_expect(
  (select count(*) from public.quote_requests where id = 'd4444444-4444-4444-8444-444444444444')::text,
  '1',
  'o pedido continua depois das tentativas de exclusão'
);
select public._quote_expect(
  case
    when has_table_privilege('authenticated', 'public.quote_requests', 'DELETE') then 'concedido'
    else 'revogado'
  end,
  'revogado',
  'o privilégio temporário de exclusão foi retirado'
);

select set_config('request.jwt.claim.sub', '', true);
select set_config('request.jwt.claim.role', '', true);
select set_config('request.jwt.claims', '', true);

drop function public._quote_try(text);
drop function public._quote_expect(text, text, text);

rollback;
