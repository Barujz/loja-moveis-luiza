-- Testes manuais de permissão.
--
-- Rode o arquivo inteiro, uma vez, depois de supabase/sql/001_initial_schema.sql.
-- Ele abre BEGIN e termina em ROLLBACK. Não há COMMIT.
-- Não retire o ROLLBACK e não execute apenas os INSERT.
-- A coluna encrypted_password fica vazia: estes registros não autenticam.
-- Se o editor respeitar a transação, um erro no meio também desfaz os dados,
-- porque a transação aborta antes de qualquer COMMIT.
--
-- O que dá para revisar sem executar o banco:
--   ausência de cercas Markdown e de escapes quebrados no SQL
--   anon sem GRANT SELECT nas tabelas privadas
--   EXECUTE de handle_new_user e guard_profile_insert para supabase_auth_admin
--   handle_new_user nunca grava role administrador
--   sync_profile_from_auth não copia nome/telefone quando o perfil está suspenso
--
-- O que só um PostgreSQL em execução confirma:
--   cada SELECT, INSERT e UPDATE abaixo, o SQLSTATE e o efeito na linha
--   o privilégio real do papel supabase_auth_admin, se esse papel existir
-- Este arquivo não registra que esses testes tenham passado.

begin;

create or replace function public._perm_try(statement text)
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

create or replace function public._perm_expect(actual text, expected text, message text)
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

create or replace function public._perm_catalog_count()
returns bigint
language sql
security invoker
set search_path = public
as $$
  select count(*) from public.catalogs;
$$;

grant execute on function public._perm_try(text) to anon, authenticated;
grant execute on function public._perm_expect(text, text, text) to anon, authenticated;
grant execute on function public._perm_catalog_count() to anon, authenticated;

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
    '11111111-1111-4111-8111-111111111111',
    'authenticated',
    'authenticated',
    'comprador.pendente@example.com',
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
    '22222222-2222-4222-8222-222222222222',
    'authenticated',
    'authenticated',
    'comprador.aprovado@example.com',
    '',
    pg_catalog.now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"role":"comprador","full_name":"Comprador Aprovado"}'::jsonb,
    pg_catalog.now(),
    pg_catalog.now(),
    '', '', '', '', '', '', '', ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '33333333-3333-4333-8333-333333333333',
    'authenticated',
    'authenticated',
    'fornecedor.a@example.com',
    '',
    pg_catalog.now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"role":"fornecedor","full_name":"Fornecedor A"}'::jsonb,
    pg_catalog.now(),
    pg_catalog.now(),
    '', '', '', '', '', '', '', ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '44444444-4444-4444-8444-444444444444',
    'authenticated',
    'authenticated',
    'fornecedor.b@example.com',
    '',
    pg_catalog.now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"role":"fornecedor","full_name":"Fornecedor B"}'::jsonb,
    pg_catalog.now(),
    pg_catalog.now(),
    '', '', '', '', '', '', '', ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '55555555-5555-4555-8555-555555555555',
    'authenticated',
    'authenticated',
    'admin@example.com',
    '',
    pg_catalog.now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"role":"administrador","full_name":"Administrador"}'::jsonb,
    pg_catalog.now(),
    pg_catalog.now(),
    '', '', '', '', '', '', '', ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '66666666-6666-4666-8666-666666666666',
    'authenticated',
    'authenticated',
    'suspenso@example.com',
    '',
    pg_catalog.now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"role":"fornecedor","full_name":"Fornecedor Suspenso"}'::jsonb,
    pg_catalog.now(),
    pg_catalog.now(),
    '', '', '', '', '', '', '', ''
  );

select public._perm_expect(
  public._perm_try($sql$
    insert into public.buyers (profile_id, company_name, cnpj, job_title, segment, whatsapp)
    values (
      '11111111-1111-4111-8111-111111111111',
      'Hotel Pendente',
      '11111111111111',
      'Gerente',
      'Hotelaria',
      '5545999990001'
    )
  $sql$),
  '23514',
  'CNPJ inválido deve ser recusado no banco'
);

insert into public.buyers (profile_id, company_name, cnpj, job_title, segment, whatsapp)
values
  ('11111111-1111-4111-8111-111111111111', 'Hotel Pendente', '11222333000181', 'Gerente', 'Hotelaria', '5545999990001'),
  ('22222222-2222-4222-8222-222222222222', 'Hotel Aprovado', '11444777000161', 'Diretor', 'Hotelaria', '5545999990002');

insert into public.suppliers (
  profile_id, legal_name, trade_name, cnpj, segment, description, logo,
  commercial_contact, contact_email, whatsapp
) values
  (
    '33333333-3333-4333-8333-333333333333',
    'Fornecedor A Ltda',
    'Ateliê A',
    '19131243000197',
    'Mobiliário',
    'Descrição da empresa A para projetos de hotelaria.',
    'logos/atelie-a.png',
    'Ana Comercial',
    'comercial.a@example.com',
    '5545999990003'
  ),
  (
    '44444444-4444-4444-8444-444444444444',
    'Fornecedor B Ltda',
    'Ateliê B',
    '04252011000110',
    'Iluminação',
    'Descrição da empresa B para projetos de hotelaria.',
    'logos/atelie-b.png',
    'Bruno Comercial',
    'comercial.b@example.com',
    '5545999990004'
  ),
  (
    '66666666-6666-4666-8666-666666666666',
    'Fornecedor Suspenso Ltda',
    'Ateliê Suspenso',
    '00000000000191',
    'Decoração',
    'Descrição da empresa suspensa para projetos de hotelaria.',
    'logos/atelie-suspenso.png',
    'Carla Comercial',
    'comercial.suspenso@example.com',
    '5545999990005'
  );

select public._perm_expect(
  (select role::text from public.profiles where id = '55555555-5555-4555-8555-555555555555'),
  'comprador',
  'metadado administrador no cadastro não cria perfil administrador'
);

select set_config('request.jwt.claim.sub', '44444444-4444-4444-8444-444444444444', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"44444444-4444-4444-8444-444444444444","role":"authenticated"}',
  true
);
set local role authenticated;

select public._perm_expect(
  public._perm_try($sql$
    insert into public.catalogs (supplier_id, category_id, title, description)
    select s.id, c.id, 'Catálogo antecipado', 'Descrição enviada antes da aprovação da empresa.'
    from public.suppliers s
    cross join public.catalog_categories c
    where s.profile_id = '44444444-4444-4444-8444-444444444444'
      and c.slug = 'enxoval-de-ab'
  $sql$),
  '42501',
  'fornecedor pendente não envia catálogo'
);

select set_config('request.jwt.claim.sub', '', true);
select set_config('request.jwt.claim.role', '', true);
select set_config('request.jwt.claims', '', true);
reset role;

update public.profiles
set status = 'aprovado'
where id in (
  '22222222-2222-4222-8222-222222222222',
  '33333333-3333-4333-8333-333333333333',
  '44444444-4444-4444-8444-444444444444',
  '66666666-6666-4666-8666-666666666666'
);

update public.profiles
set role = 'administrador',
    status = 'aprovado'
where id = '55555555-5555-4555-8555-555555555555';

update public.buyers
set status = 'aprovado'
where profile_id = '22222222-2222-4222-8222-222222222222';

update public.suppliers
set status = 'aprovado'
where profile_id in (
  '33333333-3333-4333-8333-333333333333',
  '44444444-4444-4444-8444-444444444444',
  '66666666-6666-4666-8666-666666666666'
);

insert into public.catalogs (supplier_id, category_id, title, description, visibility)
select s.id, c.id, 'Catálogo público A', 'Descrição do catálogo público do fornecedor A.', 'publico'::public.catalog_visibility
from public.suppliers s
cross join public.catalog_categories c
where s.profile_id = '33333333-3333-4333-8333-333333333333'
  and c.slug = 'enxoval-de-ab';

insert into public.catalogs (supplier_id, category_id, title, description, visibility)
select s.id, c.id, 'Catálogo restrito A', 'Descrição do catálogo restrito do fornecedor A.', 'restrito'::public.catalog_visibility
from public.suppliers s
cross join public.catalog_categories c
where s.profile_id = '33333333-3333-4333-8333-333333333333'
  and c.slug = 'enxoval-de-ab';

insert into public.catalogs (supplier_id, category_id, title, description, visibility)
select s.id, c.id, 'Catálogo restrito B', 'Descrição do catálogo restrito do fornecedor B.', 'restrito'::public.catalog_visibility
from public.suppliers s
cross join public.catalog_categories c
where s.profile_id = '44444444-4444-4444-8444-444444444444'
  and c.slug = 'enxoval-de-ab';

insert into public.catalogs (supplier_id, category_id, title, description, visibility)
select s.id, c.id, 'Catálogo público suspenso', 'Descrição do catálogo que deixará de ser público.', 'publico'::public.catalog_visibility
from public.suppliers s
cross join public.catalog_categories c
where s.profile_id = '66666666-6666-4666-8666-666666666666'
  and c.slug = 'enxoval-de-ab';

insert into public.catalog_files (
  id, catalog_id, supplier_id, kind, bucket_id, storage_path, mime_type, byte_size, status
)
select
  case c.title
    when 'Catálogo público A' then 'a1111111-1111-4111-8111-111111111111'::uuid
    when 'Catálogo restrito A' then 'a2222222-2222-4222-8222-222222222222'::uuid
    when 'Catálogo restrito B' then 'a3333333-3333-4333-8333-333333333333'::uuid
    else 'a4444444-4444-4444-8444-444444444444'::uuid
  end,
  c.id,
  c.supplier_id,
  'pdf',
  'catalog-pdfs',
  c.id::text || '/' || case c.title
    when 'Catálogo público A' then 'a1111111-1111-4111-8111-111111111111'
    when 'Catálogo restrito A' then 'a2222222-2222-4222-8222-222222222222'
    when 'Catálogo restrito B' then 'a3333333-3333-4333-8333-333333333333'
    else 'a4444444-4444-4444-8444-444444444444'
  end || '.pdf',
  'application/pdf',
  2048,
  'aprovado'
from public.catalogs c;

update public.catalogs
set status = 'aprovado';

select set_config(
  'test.supplier_a_id',
  (select id::text from public.suppliers where profile_id = '33333333-3333-4333-8333-333333333333'),
  true
);
select set_config(
  'test.suspended_catalog_id',
  (select id::text from public.catalogs where title = 'Catálogo público suspenso'),
  true
);
select set_config(
  'test.restricted_catalog_id',
  (select id::text from public.catalogs where title = 'Catálogo restrito A'),
  true
);
select set_config(
  'test.restricted_pdf_id',
  (select published_pdf_id::text from public.catalogs where title = 'Catálogo restrito A'),
  true
);
select set_config(
  'test.public_catalog_id',
  (select id::text from public.catalogs where title = 'Catálogo público A'),
  true
);
select set_config(
  'test.public_pdf_id',
  (select published_pdf_id::text from public.catalogs where title = 'Catálogo público A'),
  true
);
select set_config(
  'test.other_catalog_id',
  (select id::text from public.catalogs where title = 'Catálogo restrito B'),
  true
);

insert into public.catalog_categories (name, slug, active)
values ('Categoria oculta', 'categoria-oculta', false);

-- Visitante anônimo
select set_config('request.jwt.claim.sub', '', true);
select set_config('request.jwt.claim.role', 'anon', true);
select set_config('request.jwt.claims', '{"role":"anon"}', true);
set local role anon;

select public._perm_expect(public._perm_catalog_count()::text, '2', 'anônimo vê só os catálogos públicos aprovados');
select public._perm_expect(
  (select count(*) from public.catalog_files)::text,
  '2',
  'anônimo vê só os PDFs publicados dos catálogos públicos'
);
select public._perm_expect(
  (select count(*) from public.catalogs where title = 'Catálogo público A')::text,
  '1',
  'anônimo recebe o catálogo público pelo privilégio de leitura e pela política'
);
select public._perm_expect(
  (select count(*) from public.catalogs where title = 'Catálogo restrito A')::text,
  '0',
  'catálogo restrito não é linha visível; a tabela continua legível pelo anônimo'
);
select public._perm_expect(
  (select count(*) from public.catalog_categories where slug = 'enxoval-de-ab')::text,
  '1',
  'anônimo lê a categoria ativa sem função administrativa'
);
select public._perm_expect(
  (select count(*) from public.catalog_categories where slug = 'categoria-oculta')::text,
  '0',
  'anônimo não recebe categoria inativa'
);
select public._perm_expect(
  public._perm_try($sql$
    insert into public.catalog_categories (name, slug)
    values ('Categoria indevida', 'categoria-indevida')
  $sql$),
  '42501',
  'anônimo não cria categoria'
);
select public._perm_expect(
  public._perm_try($sql$
    insert into public.catalog_downloads (catalog_id, file_id, downloaded_by)
    values (
      '00000000-0000-0000-0000-000000000001',
      'a1111111-1111-4111-8111-111111111111',
      null
    )
  $sql$),
  '42501',
  'anônimo não insere download diretamente'
);
select public._perm_expect(
  public._perm_try(
    format(
      'select public.record_catalog_download(%L::uuid)',
      current_setting('test.public_pdf_id')
    )
  ),
  '1',
  'a contabilização aceita o PDF público visível'
);
select public._perm_expect(
  public._perm_try(
    format(
      'select public.record_catalog_download(%L::uuid)',
      current_setting('test.restricted_pdf_id')
    )
  ),
  '42501',
  'anônimo não contabiliza o PDF restrito'
);
select public._perm_expect(
  public._perm_try('select count(*) from public.catalog_downloads'),
  '42501',
  'anônimo não consulta o registro de downloads'
);
select public._perm_expect(
  public._perm_try('select count(*) from public.buyers'),
  '42501',
  'anônimo não tem SELECT em compradores'
);
select public._perm_expect(
  public._perm_try('select count(*) from public.suppliers'),
  '42501',
  'anônimo não tem SELECT em fornecedores'
);
select public._perm_expect(
  public._perm_try('select count(*) from public.profiles'),
  '42501',
  'anônimo não tem SELECT em perfis'
);
select public._perm_expect(
  public._perm_try('select count(*) from public.correction_requests'),
  '42501',
  'anônimo não tem SELECT em correções'
);
select public._perm_expect(
  public._perm_try('select count(*) from public.approval_decisions'),
  '42501',
  'anônimo não tem SELECT no histórico'
);

reset role;

-- Comprador pendente
select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}',
  true
);
set local role authenticated;

select public._perm_expect(public._perm_catalog_count()::text, '2', 'comprador pendente vê só catálogos públicos');
select public._perm_expect((select count(*) from public.buyers)::text, '1', 'comprador pendente lê só o próprio cadastro');
select public._perm_expect(
  public._perm_try($sql$
    update public.buyers
    set status = 'aprovado'
    where profile_id = '11111111-1111-4111-8111-111111111111'
  $sql$),
  '42501',
  'comprador pendente não se aprova'
);
select public._perm_expect(
  public._perm_try($sql$
    update public.profiles
    set role = 'administrador'
    where id = '11111111-1111-4111-8111-111111111111'
  $sql$),
  '42501',
  'comprador pendente não vira administrador'
);
select public._perm_expect(
  public._perm_try(
    format(
      'insert into public.correction_requests (subject_type, subject_id, requested_by, reason) values (''fornecedor'', %L::uuid, ''11111111-1111-4111-8111-111111111111'', ''Tentativa indevida'')',
      current_setting('test.supplier_a_id')
    )
  ),
  '42501',
  'comprador pendente não abre correção para o fornecedor já identificado'
);

reset role;

select public._perm_expect(
  (select count(*) from public.correction_requests where reason = 'Tentativa indevida')::text,
  '0',
  'a tentativa do comprador pendente não criou solicitação'
);

-- Comprador aprovado
select set_config('request.jwt.claim.sub', '22222222-2222-4222-8222-222222222222', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}',
  true
);
set local role authenticated;

select public._perm_expect(public._perm_catalog_count()::text, '4', 'comprador aprovado vê públicos e restritos');
select public._perm_expect(
  public._perm_try(
    format(
      'update public.suppliers set description = ''Alteração indevida do comprador no cadastro do fornecedor.'' where id = %L::uuid',
      current_setting('test.supplier_a_id')
    )
  ),
  '0',
  'a política não entrega a linha; zero linhas não é, sozinho, o bloqueio'
);

reset role;

select public._perm_expect(
  (
    select description
    from public.suppliers
    where id = current_setting('test.supplier_a_id')::uuid
  ),
  'Descrição da empresa A para projetos de hotelaria.',
  'depois da tentativa, a descrição do fornecedor continua a original'
);

select set_config('request.jwt.claim.sub', '22222222-2222-4222-8222-222222222222', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}',
  true
);
set local role authenticated;

select public._perm_expect(
  public._perm_try(
    format(
      'update public.catalogs set published_pdf_id = ''a3333333-3333-4333-8333-333333333333'' where id = %L::uuid',
      current_setting('test.public_catalog_id')
    )
  ),
  '0',
  'comprador não alcança o catálogo para trocar o PDF publicado'
);

reset role;

select public._perm_expect(
  (select published_pdf_id::text from public.catalogs where id = current_setting('test.public_catalog_id')::uuid),
  'a1111111-1111-4111-8111-111111111111',
  'depois da tentativa do comprador, o PDF publicado continua o original'
);

-- Fornecedor A
select set_config('request.jwt.claim.sub', '33333333-3333-4333-8333-333333333333', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"33333333-3333-4333-8333-333333333333","role":"authenticated"}',
  true
);
set local role authenticated;

select public._perm_expect(public._perm_catalog_count()::text, '3', 'fornecedor vê os próprios catálogos e os públicos, não o restrito alheio');
select public._perm_expect(
  public._perm_try(
    format(
      'update public.catalogs set published_pdf_id = ''a3333333-3333-4333-8333-333333333333'' where id = %L::uuid',
      current_setting('test.public_catalog_id')
    )
  ),
  '42501',
  'fornecedor não troca diretamente o PDF publicado'
);
select public._perm_expect(
  (select published_pdf_id::text from public.catalogs where id = current_setting('test.public_catalog_id')::uuid),
  'a1111111-1111-4111-8111-111111111111',
  'o PDF publicado permanece a versão aprovada'
);
select public._perm_expect(
  public._perm_try(
    format(
      'insert into public.catalog_files (id, catalog_id, supplier_id, kind, bucket_id, storage_path, mime_type, byte_size) values (''a6666666-6666-4666-8666-666666666666'', %L::uuid, %L::uuid, ''pdf'', ''catalog-pdfs'', %L, ''application/pdf'', 1024)',
      current_setting('test.other_catalog_id'),
      current_setting('test.supplier_a_id'),
      current_setting('test.other_catalog_id') || '/a6666666-6666-4666-8666-666666666666.pdf'
    )
  ),
  '42501',
  'fornecedor não vincula arquivo ao catálogo de outra empresa'
);
select public._perm_expect(
  public._perm_try($sql$
    insert into public.catalog_categories (name, slug)
    values ('Categoria do fornecedor', 'categoria-do-fornecedor')
  $sql$),
  '42501',
  'fornecedor não cria categoria'
);
select public._perm_expect(
  public._perm_try(
    format(
      'insert into public.catalog_files (id, catalog_id, supplier_id, kind, bucket_id, storage_path, mime_type, byte_size) values (''a5555555-5555-4555-8555-555555555555'', %L::uuid, %L::uuid, ''pdf'', ''catalog-pdfs'', %L, ''application/pdf'', 4096)',
      current_setting('test.public_catalog_id'),
      current_setting('test.supplier_a_id'),
      current_setting('test.public_catalog_id') || '/a5555555-5555-4555-8555-555555555555.pdf'
    )
  ),
  '1',
  'fornecedor envia outra versão do PDF sem publicar a anterior'
);
select public._perm_expect(
  public._perm_try(
    format(
      'insert into storage.objects (bucket_id, name, metadata) values (''catalog-pdfs'', %L, ''{"mimetype":"application/pdf","size":4096}''::jsonb)',
      current_setting('test.public_catalog_id') || '/a5555555-5555-4555-8555-555555555555.pdf'
    )
  ),
  '1',
  'fornecedor grava o PDF pendente no bucket privado'
);
select public._perm_expect(
  public._perm_try($sql$
    update public.catalog_files
    set status = 'aprovado'
    where id = 'a5555555-5555-4555-8555-555555555555'
  $sql$),
  '42501',
  'fornecedor não aprova a própria versão'
);

reset role;

select public._perm_expect(
  (select status::text from public.catalog_files where id = 'a5555555-5555-4555-8555-555555555555'),
  'pendente',
  'a versão nova permanece pendente'
);
select public._perm_expect(
  (select published_pdf_id::text from public.catalogs where id = current_setting('test.public_catalog_id')::uuid),
  'a1111111-1111-4111-8111-111111111111',
  'o PDF já aprovado continua sendo o publicado'
);
select public._perm_expect(
  (select status::text from public.catalogs where id = current_setting('test.public_catalog_id')::uuid),
  'aprovado',
  'enviar outra versão não tira o catálogo do ar'
);

select set_config('request.jwt.claim.sub', '', true);
select set_config('request.jwt.claim.role', 'anon', true);
select set_config('request.jwt.claims', '{"role":"anon"}', true);
set local role anon;

select public._perm_expect(
  (select count(*) from public.catalog_files where id = 'a5555555-5555-4555-8555-555555555555')::text,
  '0',
  'anônimo não recebe a linha da versão pendente'
);
select public._perm_expect(
  public._perm_try($sql$
    select public.record_catalog_download('a5555555-5555-4555-8555-555555555555')
  $sql$),
  '42501',
  'versão pendente não é contabilizada nem publicada'
);
select public._perm_expect(
  (
    select count(*)
    from storage.objects
    where bucket_id = 'catalog-pdfs'
      and name = current_setting('test.public_catalog_id') || '/a5555555-5555-4555-8555-555555555555.pdf'
  )::text,
  '0',
  'anônimo não lê o objeto pendente no Storage'
);
select public._perm_expect(
  (select count(*) from public.catalog_files where id = 'a1111111-1111-4111-8111-111111111111')::text,
  '1',
  'anônimo continua lendo a versão já publicada'
);

reset role;

-- Administrador
select set_config('request.jwt.claim.sub', '55555555-5555-4555-8555-555555555555', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"55555555-5555-4555-8555-555555555555","role":"authenticated"}',
  true
);
set local role authenticated;

select public._perm_expect(
  public._perm_try($sql$
    update public.catalog_files
    set status = 'aprovado'
    where id = 'a5555555-5555-4555-8555-555555555555'
  $sql$),
  '1',
  'administrador aprova a versão nova'
);
select public._perm_expect(
  (select published_pdf_id::text from public.catalogs where title = 'Catálogo público A'),
  'a5555555-5555-4555-8555-555555555555',
  'a versão aprovada substitui a publicada'
);
select public._perm_expect(
  (
    select case when superseded_at is null then 'vigente' else 'substituida' end
    from public.catalog_files
    where id = 'a1111111-1111-4111-8111-111111111111'
  ),
  'substituida',
  'a versão anterior deixa de ser disponibilizada'
);

reset role;

select set_config('request.jwt.claim.sub', '', true);
select set_config('request.jwt.claim.role', 'anon', true);
select set_config('request.jwt.claims', '{"role":"anon"}', true);
set local role anon;

select public._perm_expect(
  (
    select count(*)
    from storage.objects
    where bucket_id = 'catalog-pdfs'
      and name = current_setting('test.public_catalog_id') || '/a5555555-5555-4555-8555-555555555555.pdf'
  )::text,
  '1',
  'depois da aprovação, o mesmo objeto privado fica legível para o anônimo'
);
select public._perm_expect(
  (select count(*) from public.catalog_files where id = 'a1111111-1111-4111-8111-111111111111')::text,
  '0',
  'a versão substituída sai da leitura anônima'
);

reset role;

-- Suspensão pelo administrador autenticado, com PDF vigente e versão já substituída.
select set_config('request.jwt.claim.sub', '55555555-5555-4555-8555-555555555555', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"55555555-5555-4555-8555-555555555555","role":"authenticated"}',
  true
);
set local role authenticated;

select public._perm_expect(
  public._perm_try($sql$
    update public.catalogs
    set status = 'suspenso'
    where title = 'Catálogo público A'
  $sql$),
  '1',
  'administrador autenticado suspende o catálogo com versões sem erro de constraint'
);

reset role;

select public._perm_expect(
  (select status::text from public.catalogs where title = 'Catálogo público A'),
  'suspenso',
  'o catálogo com duas versões fica suspenso'
);
select public._perm_expect(
  (
    select case
      when published_at is null and published_pdf_id is null and published_cover_id is null then 'oculto'
      else 'publicado'
    end
    from public.catalogs
    where title = 'Catálogo público A'
  ),
  'oculto',
  'a suspensão autenticada não publica o catálogo'
);
select public._perm_expect(
  (
    select case
      when status = 'suspenso' and superseded_at is not null and published_at is null then 'historico'
      else 'perdido'
    end
    from public.catalog_files
    where id = 'a1111111-1111-4111-8111-111111111111'
  ),
  'historico',
  'a primeira versão continua suspensa e marcada como substituída'
);
select public._perm_expect(
  (
    select case
      when status = 'suspenso' and superseded_at is null and published_at is null then 'suspenso'
      else 'outro'
    end
    from public.catalog_files
    where id = 'a5555555-5555-4555-8555-555555555555'
  ),
  'suspenso',
  'a versão vigente também fica suspensa'
);
select public._perm_expect(
  (
    select count(*)::text
    from public.catalog_files
    where catalog_id = (select id from public.catalogs where title = 'Catálogo público A')
  ),
  '2',
  'as duas versões permanecem no histórico'
);
select public._perm_expect(
  (
    select case
      when exists (
        select 1
        from public.approval_decisions
        where subject_type = 'catalogo'
          and subject_id = (select id from public.catalogs where title = 'Catálogo público A')
          and previous_status = 'aprovado'
          and new_status = 'suspenso'
      ) then 'suspenso'
      else 'ausente'
    end
  ),
  'suspenso',
  'a suspensão autenticada registra a transição de aprovado para suspenso'
);
select public._perm_expect(
  (select case when public.catalog_file_is_public('a1111111-1111-4111-8111-111111111111') then 'publico' else 'oculto' end),
  'oculto',
  'a versão substituída não volta a ser pública'
);
select public._perm_expect(
  (select case when public.catalog_file_is_public('a5555555-5555-4555-8555-555555555555') then 'publico' else 'oculto' end),
  'oculto',
  'a versão suspensa deixa de ser pública'
);

select set_config('request.jwt.claim.sub', '', true);
select set_config('request.jwt.claim.role', 'anon', true);
select set_config('request.jwt.claims', '{"role":"anon"}', true);
set local role anon;

select public._perm_expect(
  (select count(*) from public.catalogs where title = 'Catálogo público A')::text,
  '0',
  'o catálogo suspenso pelo administrador sai da leitura pública'
);
select public._perm_expect(
  (select count(*) from public.catalog_files where id = 'a1111111-1111-4111-8111-111111111111')::text,
  '0',
  'a versão substituída continua inacessível ao público'
);
select public._perm_expect(
  (select count(*) from public.catalog_files where id = 'a5555555-5555-4555-8555-555555555555')::text,
  '0',
  'a versão vigente suspensa fica inacessível ao público'
);
select public._perm_expect(
  public._perm_try($sql$
    select public.record_catalog_download('a1111111-1111-4111-8111-111111111111')
  $sql$),
  '42501',
  'versão substituída e suspensa não é contabilizada como download'
);
select public._perm_expect(
  public._perm_try($sql$
    select public.record_catalog_download('a5555555-5555-4555-8555-555555555555')
  $sql$),
  '42501',
  'PDF vigente suspenso não é contabilizado como download'
);

reset role;

select set_config('request.jwt.claim.sub', '55555555-5555-4555-8555-555555555555', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"55555555-5555-4555-8555-555555555555","role":"authenticated"}',
  true
);
set local role authenticated;

select public._perm_expect(public._perm_catalog_count()::text, '4', 'administrador vê todos os catálogos');
select public._perm_expect(
  public._perm_try($sql$
    update public.profiles
    set status = 'suspenso'
    where id = '55555555-5555-4555-8555-555555555555'
  $sql$),
  '42501',
  'administrador não suspende a própria conta'
);
select public._perm_expect(
  public._perm_try(
    format(
      'insert into public.correction_requests (subject_type, subject_id, requested_by, reason) values (''fornecedor'', %L::uuid, ''55555555-5555-4555-8555-555555555555'', ''Enviar contrato social atualizado'')',
      current_setting('test.supplier_a_id')
    )
  ),
  '1',
  'administrador abre correção para o fornecedor identificado'
);

reset role;

select public._perm_expect(
  (
    select status::text
    from public.suppliers
    where profile_id = '33333333-3333-4333-8333-333333333333'
  ),
  'pendente',
  'correção tira o fornecedor do ar até nova análise'
);
select public._perm_expect(
  (
    select reason
    from public.correction_requests
    where requested_by = '55555555-5555-4555-8555-555555555555'
      and state = 'aberta'
  ),
  'Enviar contrato social atualizado',
  'motivo da correção fica registrado'
);

select set_config('request.jwt.claim.sub', '', true);
select set_config('request.jwt.claim.role', 'anon', true);
select set_config('request.jwt.claims', '{"role":"anon"}', true);
set local role anon;

select public._perm_expect(
  (select count(*) from public.catalogs where title = 'Catálogo público A')::text,
  '0',
  'correção tira o catálogo público do ar até nova análise'
);

reset role;

-- Fornecedor responde; não reescreve o motivo
select set_config('request.jwt.claim.sub', '33333333-3333-4333-8333-333333333333', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"33333333-3333-4333-8333-333333333333","role":"authenticated"}',
  true
);
set local role authenticated;

select public._perm_expect(
  public._perm_try($sql$
    update public.correction_requests
    set response = 'Contrato anexado.'
    where state = 'aberta'
  $sql$),
  '1',
  'fornecedor responde a correção'
);
select public._perm_expect(
  public._perm_try($sql$
    update public.correction_requests
    set reason = 'Motivo trocado pelo fornecedor'
    where state = 'aberta'
  $sql$),
  '42501',
  'fornecedor não altera o motivo'
);

reset role;

-- Suspensão. Limpa o JWT anterior para o ajuste do SQL Editor não herdar a sessão da API.
select set_config('request.jwt.claim.sub', '', true);
select set_config('request.jwt.claim.role', '', true);
select set_config('request.jwt.claims', '', true);

update public.profiles
set status = 'suspenso'
where id = '66666666-6666-4666-8666-666666666666';

update auth.users
set email = 'suspenso.novo@example.com',
    raw_user_meta_data = '{"role":"administrador","full_name":"Nome Indevido","phone":"5545999990099"}'::jsonb
where id = '66666666-6666-4666-8666-666666666666';

select public._perm_expect(
  (select role::text from public.profiles where id = '66666666-6666-4666-8666-666666666666'),
  'fornecedor',
  'metadado posterior não promove conta suspensa a administrador'
);
select public._perm_expect(
  (select full_name from public.profiles where id = '66666666-6666-4666-8666-666666666666'),
  'Fornecedor Suspenso',
  'conta suspensa não altera o nome pelo metadado do Auth'
);
select public._perm_expect(
  (select case when phone is null then 'sem-telefone' else phone end from public.profiles where id = '66666666-6666-4666-8666-666666666666'),
  'sem-telefone',
  'conta suspensa não altera o telefone pelo metadado do Auth'
);
select public._perm_expect(
  (select email from public.profiles where id = '66666666-6666-4666-8666-666666666666'),
  'suspenso.novo@example.com',
  'o e-mail de login continua espelhando o Auth'
);
select public._perm_expect(
  (select status::text from public.catalogs where id = current_setting('test.suspended_catalog_id')::uuid),
  'suspenso',
  'suspender a conta conclui sem conflito e suspende o catálogo'
);
select public._perm_expect(
  (
    select case
      when published_at is null and published_pdf_id is null and published_cover_id is null then 'oculto'
      else 'publicado'
    end
    from public.catalogs
    where id = current_setting('test.suspended_catalog_id')::uuid
  ),
  'oculto',
  'a suspensão da conta não publica o catálogo'
);
select public._perm_expect(
  (select status::text from public.catalog_files where id = 'a4444444-4444-4444-8444-444444444444'),
  'suspenso',
  'o PDF da conta suspensa fica suspenso, não aprovado'
);
select public._perm_expect(
  (
    select case
      when exists (
        select 1
        from public.approval_decisions
        where subject_type = 'catalogo'
          and subject_id = current_setting('test.suspended_catalog_id')::uuid
          and previous_status = 'aprovado'
          and new_status = 'suspenso'
      ) then 'suspenso'
      else 'ausente'
    end
  ),
  'suspenso',
  'o histórico da conta suspensa registra a transição de aprovado para suspenso'
);

select set_config('request.jwt.claim.sub', '', true);
select set_config('request.jwt.claim.role', 'anon', true);
select set_config('request.jwt.claims', '{"role":"anon"}', true);
set local role anon;

select public._perm_expect(
  (select count(*) from public.catalogs where title = 'Catálogo público suspenso')::text,
  '0',
  'catálogo de conta suspensa sai do ar'
);
select public._perm_expect(
  (select count(*) from public.catalog_files where id = 'a4444444-4444-4444-8444-444444444444')::text,
  '0',
  'o PDF da conta suspensa deixa de ser acessível'
);
select public._perm_expect(
  public._perm_try($sql$
    select public.record_catalog_download('a4444444-4444-4444-8444-444444444444')
  $sql$),
  '42501',
  'PDF suspenso não é contabilizado como download'
);

reset role;

select set_config('request.jwt.claim.sub', '66666666-6666-4666-8666-666666666666', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"66666666-6666-4666-8666-666666666666","role":"authenticated"}',
  true
);
set local role authenticated;

select public._perm_expect(
  (select count(*) from public.catalogs where title = 'Catálogo público suspenso')::text,
  '1',
  'usuário suspenso ainda vê o próprio catálogo'
);
select public._perm_expect(
  public._perm_try(
    format(
      'update public.catalogs set description = ''Tentativa de edição com a conta suspensa.'' where id = %L::uuid',
      current_setting('test.suspended_catalog_id')
    )
  ),
  '0',
  'a conta suspensa não recebe a linha para atualizar'
);
select public._perm_expect(
  public._perm_try($sql$
    insert into public.catalogs (supplier_id, category_id, title, description)
    select s.id, c.id, 'Novo catálogo', 'Descrição que não pode nascer de conta suspensa.'
    from public.suppliers s
    cross join public.catalog_categories c
    where s.profile_id = '66666666-6666-4666-8666-666666666666'
      and c.slug = 'enxoval-de-ab'
  $sql$),
  '42501',
  'usuário suspenso não cria catálogo'
);

reset role;

select public._perm_expect(
  (
    select description
    from public.catalogs
    where id = current_setting('test.suspended_catalog_id')::uuid
  ),
  'Descrição do catálogo que deixará de ser público.',
  'a descrição do catálogo suspenso permanece a original'
);

select set_config('request.jwt.claim.sub', '', true);
select set_config('request.jwt.claim.role', '', true);
select set_config('request.jwt.claims', '', true);

update public.catalogs
set status = 'suspenso'
where title = 'Catálogo restrito B';

select public._perm_expect(
  (select status::text from public.catalogs where title = 'Catálogo restrito B'),
  'suspenso',
  'suspender o catálogo diretamente conclui sem conflito de gatilho'
);
select public._perm_expect(
  (
    select case
      when published_at is null and published_pdf_id is null and published_cover_id is null then 'oculto'
      else 'publicado'
    end
    from public.catalogs
    where title = 'Catálogo restrito B'
  ),
  'oculto',
  'a suspensão direta não publica o catálogo'
);
select public._perm_expect(
  (select status::text from public.catalog_files where id = 'a3333333-3333-4333-8333-333333333333'),
  'suspenso',
  'o PDF do catálogo suspenso diretamente fica suspenso'
);
select public._perm_expect(
  (
    select case
      when exists (
        select 1
        from public.approval_decisions
        where subject_type = 'catalogo'
          and subject_id = (select id from public.catalogs where title = 'Catálogo restrito B')
          and previous_status = 'aprovado'
          and new_status = 'suspenso'
      ) then 'suspenso'
      else 'ausente'
    end
  ),
  'suspenso',
  'a suspensão direta registra a transição de aprovado para suspenso'
);

select set_config('request.jwt.claim.sub', '', true);
select set_config('request.jwt.claim.role', 'anon', true);
select set_config('request.jwt.claims', '{"role":"anon"}', true);
set local role anon;

select public._perm_expect(
  (select count(*) from public.catalogs where title = 'Catálogo restrito B')::text,
  '0',
  'catálogo suspenso diretamente não fica visível ao anônimo'
);
select public._perm_expect(
  (select count(*) from public.catalog_files where id = 'a3333333-3333-4333-8333-333333333333')::text,
  '0',
  'PDF do catálogo suspenso diretamente não fica acessível ao anônimo'
);

reset role;

select set_config('request.jwt.claim.sub', '22222222-2222-4222-8222-222222222222', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}',
  true
);
set local role authenticated;

select public._perm_expect(
  (select count(*) from public.catalogs where title = 'Catálogo restrito B')::text,
  '0',
  'comprador aprovado também deixa de ver o catálogo suspenso diretamente'
);

select set_config('request.jwt.claim.sub', '', true);
select set_config('request.jwt.claim.role', '', true);
select set_config('request.jwt.claims', '', true);
reset role;

do $priv$
begin
  if not exists (select 1 from pg_catalog.pg_roles where rolname = 'supabase_auth_admin') then
    raise notice 'supabase_auth_admin ausente neste servidor; o privilégio de cadastro não foi executado aqui';
    return;
  end if;

  if not has_function_privilege('supabase_auth_admin', 'public.handle_new_user()', 'EXECUTE') then
    raise exception 'supabase_auth_admin não pode executar handle_new_user';
  end if;

  if not has_function_privilege('supabase_auth_admin', 'public.guard_profile_insert()', 'EXECUTE') then
    raise exception 'supabase_auth_admin não pode executar guard_profile_insert';
  end if;

  if not has_function_privilege('supabase_auth_admin', 'public.sync_profile_from_auth()', 'EXECUTE') then
    raise exception 'supabase_auth_admin não pode executar sync_profile_from_auth';
  end if;

  if not has_function_privilege('supabase_auth_admin', 'public.guard_profile_update()', 'EXECUTE') then
    raise exception 'supabase_auth_admin não pode executar guard_profile_update';
  end if;
end
$priv$;

drop function public._perm_try(text);
drop function public._perm_expect(text, text, text);
drop function public._perm_catalog_count();

rollback;
