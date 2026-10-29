-- Luiza Mobiliário de Luxo
-- Schema inicial de perfis, aprovação, correções e catálogos PDF de fornecedores.
--
-- Execute este arquivo inteiro, uma vez, no SQL Editor do Supabase.
-- SQL puro. Não cria usuário, senha nem administrador.
-- Não importa o catálogo estático do site (src/lib/products.ts).
-- Não cria empresas parceiras, pedidos de contato, ficha cadastral nem página institucional.
-- Os PDFs ficam em buckets privados. Não há coluna de preço e nenhum arquivo é publicado sozinho.
--
-- Depois, os testes manuais estão em supabase/tests/permissions.sql.
-- Eles encerram com ROLLBACK e não fazem parte deste schema.
--
-- Primeiro administrador, em um passo separado, depois de criar o usuário
-- em Authentication, Users:
--
--   update public.profiles
--   set role = 'administrador',
--       status = 'aprovado'
--   where id = '<uuid do usuário>';

-- ---------------------------------------------------------------------------
-- Tipos
-- ---------------------------------------------------------------------------

create type public.user_role as enum (
  'comprador',
  'fornecedor',
  'administrador'
);

create type public.approval_status as enum (
  'pendente',
  'aprovado',
  'rejeitado',
  'suspenso'
);

create type public.approval_subject as enum (
  'perfil',
  'comprador',
  'fornecedor',
  'catalogo',
  'arquivo'
);

create type public.catalog_visibility as enum (
  'publico',
  'restrito'
);

create type public.correction_state as enum (
  'aberta',
  'atendida',
  'cancelada'
);

create type public.catalog_file_kind as enum (
  'pdf',
  'capa'
);

-- ---------------------------------------------------------------------------
-- Validadores. Sem SECURITY DEFINER: não leem tabelas nem elevam privilégio.
-- ---------------------------------------------------------------------------

create or replace function public.digits_only(value text)
returns text
language sql
immutable
set search_path = ''
as $$
  select nullif(regexp_replace(coalesce(value, ''), '\D', '', 'g'), '');
$$;

create or replace function public.is_valid_email(value text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select value is not null
    and char_length(btrim(value)) between 6 and 200
    and btrim(value) ~* '^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$';
$$;

create or replace function public.is_valid_phone(value text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select public.digits_only(value) is not null
    and char_length(public.digits_only(value)) between 10 and 13;
$$;

create or replace function public.is_valid_cnpj(value text)
returns boolean
language plpgsql
immutable
set search_path = ''
as $$
declare
  digits text := public.digits_only(value);
  i integer;
  sum1 integer := 0;
  sum2 integer := 0;
  digit1 integer;
  digit2 integer;
  weights1 integer[] := array[5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  weights2 integer[] := array[6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
begin
  if digits is null or char_length(digits) <> 14 then
    return false;
  end if;

  if digits ~ '^([0-9])\1{13}$' then
    return false;
  end if;

  for i in 1..12 loop
    sum1 := sum1 + (substr(digits, i, 1))::integer * weights1[i];
  end loop;

  digit1 := sum1 % 11;
  digit1 := case when digit1 < 2 then 0 else 11 - digit1 end;

  if digit1 <> (substr(digits, 13, 1))::integer then
    return false;
  end if;

  for i in 1..13 loop
    sum2 := sum2 + (substr(digits, i, 1))::integer * weights2[i];
  end loop;

  digit2 := sum2 % 11;
  digit2 := case when digit2 < 2 then 0 else 11 - digit2 end;

  return digit2 = (substr(digits, 14, 1))::integer;
end;
$$;

create or replace function public.is_valid_logo_ref(value text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select value is not null
    and char_length(btrim(value)) between 1 and 500
    and btrim(value) !~* '^(javascript|data):'
    and (
      btrim(value) ~ '^https://[A-Za-z0-9._~:/?#\[\]@!$&''()*+,;=%-]+$'
      or btrim(value) ~ '^logos/[A-Za-z0-9._/-]+$'
    );
$$;

-- ---------------------------------------------------------------------------
-- Tabelas
-- Nome, e-mail de login e telefone de conta ficam em profiles,
-- espelhando auth.users. O e-mail de login não é editável pela API.
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.user_role not null,
  status public.approval_status not null default 'pendente',
  full_name text not null default '',
  email text,
  phone text,
  created_at timestamptz not null default pg_catalog.now(),
  updated_at timestamptz not null default pg_catalog.now(),
  constraint profiles_full_name_length check (char_length(full_name) <= 160),
  constraint profiles_email_format check (email is null or public.is_valid_email(email)),
  constraint profiles_phone_format check (phone is null or public.is_valid_phone(phone))
);

comment on table public.profiles is
  'Conta da aplicação, 1:1 com auth.users. Senhas ficam somente no Supabase Auth.';

comment on column public.profiles.email is
  'Cópia do e-mail de auth.users, atualizada por trigger. A API não altera esta coluna.';

create table public.buyers (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references public.profiles (id) on delete cascade,
  company_name text not null,
  cnpj text not null,
  job_title text not null,
  segment text not null,
  whatsapp text not null,
  status public.approval_status not null default 'pendente',
  created_at timestamptz not null default pg_catalog.now(),
  updated_at timestamptz not null default pg_catalog.now(),
  constraint buyers_company_name_length check (char_length(btrim(company_name)) between 2 and 200),
  constraint buyers_cnpj_valid check (public.is_valid_cnpj(cnpj)),
  constraint buyers_job_title_length check (char_length(btrim(job_title)) between 2 and 80),
  constraint buyers_segment_length check (char_length(btrim(segment)) between 2 and 80),
  constraint buyers_whatsapp_valid check (public.is_valid_phone(whatsapp))
);

comment on table public.buyers is
  'Comprador. Nome e e-mail de login vêm de profiles; aqui ficam empresa, CNPJ, cargo, segmento e WhatsApp.';

create table public.suppliers (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references public.profiles (id) on delete cascade,
  legal_name text not null,
  trade_name text not null,
  cnpj text not null,
  segment text not null,
  description text not null,
  logo text not null,
  commercial_contact text not null,
  contact_email text not null,
  whatsapp text not null,
  status public.approval_status not null default 'pendente',
  created_at timestamptz not null default pg_catalog.now(),
  updated_at timestamptz not null default pg_catalog.now(),
  constraint suppliers_legal_name_length check (char_length(btrim(legal_name)) between 2 and 200),
  constraint suppliers_trade_name_length check (char_length(btrim(trade_name)) between 2 and 200),
  constraint suppliers_cnpj_valid check (public.is_valid_cnpj(cnpj)),
  constraint suppliers_segment_length check (char_length(btrim(segment)) between 2 and 80),
  constraint suppliers_description_length check (char_length(btrim(description)) between 10 and 4000),
  constraint suppliers_logo_valid check (public.is_valid_logo_ref(logo)),
  constraint suppliers_contact_name_length check (char_length(btrim(commercial_contact)) between 2 and 160),
  constraint suppliers_contact_email_valid check (public.is_valid_email(contact_email)),
  constraint suppliers_whatsapp_valid check (public.is_valid_phone(whatsapp))
);

comment on table public.suppliers is
  'Fornecedor. O e-mail de login continua em profiles; contact_email é o contato comercial.';

create table public.approval_decisions (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles (id) on delete set null,
  subject_type public.approval_subject not null,
  subject_id uuid not null,
  previous_status public.approval_status,
  new_status public.approval_status,
  previous_role public.user_role,
  new_role public.user_role,
  note text,
  created_at timestamptz not null default pg_catalog.now(),
  constraint approval_decisions_has_change check (
    previous_status is distinct from new_status
    or previous_role is distinct from new_role
  ),
  constraint approval_decisions_note_length check (note is null or char_length(note) <= 2000)
);

comment on table public.approval_decisions is
  'Histórico imutável de papel e status. actor_id nulo indica ajuste feito no SQL Editor.';

create table public.catalog_categories (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references public.catalog_categories (id),
  name text not null,
  slug text not null,
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default pg_catalog.now(),
  updated_at timestamptz not null default pg_catalog.now(),
  constraint catalog_categories_name_length check (char_length(btrim(name)) between 2 and 80),
  constraint catalog_categories_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint catalog_categories_not_self check (parent_id is null or parent_id <> id)
);

comment on table public.catalog_categories is
  'Categorias e subcategorias administráveis dos catálogos PDF. Uma subcategoria aponta só para uma categoria raiz. Não publica página.';

create table public.catalogs (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid not null references public.suppliers (id) on delete cascade,
  category_id uuid not null references public.catalog_categories (id),
  title text not null,
  slug text,
  description text,
  visibility public.catalog_visibility not null default 'restrito',
  status public.approval_status not null default 'pendente',
  published_at timestamptz,
  published_pdf_id uuid,
  published_cover_id uuid,
  created_at timestamptz not null default pg_catalog.now(),
  updated_at timestamptz not null default pg_catalog.now(),
  constraint catalogs_title_length check (char_length(btrim(title)) between 2 and 160),
  constraint catalogs_slug_length check (slug is null or char_length(slug) between 1 and 120),
  constraint catalogs_description_length check (description is null or char_length(description) <= 4000),
  constraint catalogs_published_only_when_approved check (
    published_at is null or status = 'aprovado'
  ),
  constraint catalogs_files_only_when_approved check (
    status = 'aprovado' or (published_pdf_id is null and published_cover_id is null)
  )
);

comment on table public.catalogs is
  'Catálogo PDF de um fornecedor. Vários catálogos por empresa. Não substitui o catálogo estático do site e não guarda preço.';

comment on column public.catalogs.visibility is
  'publico: visitante pode ler depois da aprovação. restrito: exige sessão de comprador ou administrador aprovado.';

comment on column public.catalogs.published_pdf_id is
  'Versão de PDF aprovada que pode ser baixada. Um envio novo não ocupa esta coluna até outra aprovação.';

create table public.catalog_files (
  id uuid primary key default gen_random_uuid(),
  catalog_id uuid not null references public.catalogs (id) on delete cascade,
  supplier_id uuid not null references public.suppliers (id) on delete cascade,
  kind public.catalog_file_kind not null,
  bucket_id text not null,
  storage_path text not null,
  mime_type text not null,
  byte_size bigint not null,
  status public.approval_status not null default 'pendente',
  published_at timestamptz,
  superseded_at timestamptz,
  created_at timestamptz not null default pg_catalog.now(),
  updated_at timestamptz not null default pg_catalog.now(),
  constraint catalog_files_size_check check (
    (kind = 'pdf' and mime_type = 'application/pdf' and byte_size between 1 and 52428800)
    or (
      kind = 'capa'
      and mime_type in ('image/jpeg', 'image/png', 'image/webp')
      and byte_size between 1 and 5242880
    )
  ),
  constraint catalog_files_bucket_check check (
    (kind = 'pdf' and bucket_id = 'catalog-pdfs')
    or (kind = 'capa' and bucket_id = 'catalog-covers')
  ),
  constraint catalog_files_publish_check check (
    published_at is null or status = 'aprovado'
  ),
  constraint catalog_files_supersede_check check (
    superseded_at is null or status in ('aprovado', 'suspenso')
  )
);

comment on table public.catalog_files is
  'Versão de PDF ou capa. O fornecedor envia o PDF já sem valores. O administrador confere antes de aprovar. Não há leitura nem remoção automática de preços.';

alter table public.catalogs
  add constraint catalogs_published_pdf_fkey
  foreign key (published_pdf_id) references public.catalog_files (id) on delete set null;

alter table public.catalogs
  add constraint catalogs_published_cover_fkey
  foreign key (published_cover_id) references public.catalog_files (id) on delete set null;

create table public.catalog_downloads (
  id uuid primary key default gen_random_uuid(),
  catalog_id uuid not null references public.catalogs (id) on delete cascade,
  file_id uuid not null references public.catalog_files (id) on delete cascade,
  downloaded_by uuid references public.profiles (id) on delete set null,
  downloaded_at timestamptz not null default pg_catalog.now()
);

comment on table public.catalog_downloads is
  'Registro de download de PDF para consulta do administrador. A capa não entra nesta contagem. A API não insere nesta tabela: só record_catalog_download contabiliza um PDF já publicado e visível para a sessão.';

create table public.correction_requests (
  id uuid primary key default gen_random_uuid(),
  subject_type public.approval_subject not null,
  subject_id uuid not null,
  requested_by uuid not null references public.profiles (id),
  reason text not null,
  state public.correction_state not null default 'aberta',
  response text,
  created_at timestamptz not null default pg_catalog.now(),
  updated_at timestamptz not null default pg_catalog.now(),
  closed_at timestamptz,
  constraint correction_requests_subject_check check (
    subject_type in ('comprador', 'fornecedor', 'catalogo')
  ),
  constraint correction_requests_reason_length check (char_length(btrim(reason)) between 3 and 2000),
  constraint correction_requests_response_length check (
    response is null or char_length(response) <= 2000
  ),
  constraint correction_requests_closed_check check (
    (state = 'aberta' and closed_at is null)
    or (state <> 'aberta' and closed_at is not null)
  )
);

comment on table public.correction_requests is
  'Pedido de correção feito por um administrador, com motivo e resposta do responsável.';

create unique index buyers_cnpj_key on public.buyers (cnpj);
create unique index suppliers_cnpj_key on public.suppliers (cnpj);

create unique index catalog_categories_slug_key on public.catalog_categories (slug);

create unique index catalogs_supplier_slug_key
  on public.catalogs (supplier_id, slug)
  where slug is not null;

create unique index catalog_files_storage_key
  on public.catalog_files (bucket_id, storage_path);

create unique index catalog_files_one_current_kind
  on public.catalog_files (catalog_id, kind)
  where status = 'aprovado' and superseded_at is null;

create unique index correction_requests_one_open_key
  on public.correction_requests (subject_type, subject_id)
  where state = 'aberta';

create index profiles_role_status_idx on public.profiles (role, status);
create index buyers_status_idx on public.buyers (status);
create index suppliers_status_idx on public.suppliers (status);
create index catalog_categories_parent_idx on public.catalog_categories (parent_id);
create index catalogs_supplier_status_idx on public.catalogs (supplier_id, status);
create index catalogs_category_idx on public.catalogs (category_id);
create index catalogs_visibility_status_idx on public.catalogs (visibility, status);
create index catalog_files_catalog_kind_idx on public.catalog_files (catalog_id, kind, status);
create index catalog_downloads_catalog_idx
  on public.catalog_downloads (catalog_id, downloaded_at desc);
create index approval_decisions_subject_idx
  on public.approval_decisions (subject_type, subject_id, created_at desc);
create index correction_requests_subject_idx
  on public.correction_requests (subject_type, subject_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Consultas internas
-- SECURITY DEFINER só onde a política precisa ver status sem abrir a linha.
-- Nenhuma devolve CNPJ, e-mail comercial ou outro campo privado.
-- ---------------------------------------------------------------------------

create or replace function public.is_api_role()
returns boolean
language sql
stable
set search_path = ''
as $$
  select coalesce(
    current_user in ('anon', 'authenticated', 'service_role')
      or session_user in ('authenticator', 'service_role')
      or coalesce(
        nullif(current_setting('request.jwt.claim.role', true), ''),
        nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role'
      ) in ('anon', 'authenticated', 'service_role'),
    false
  );
$$;

comment on function public.is_api_role() is
  'Verdadeiro para anon, authenticated, service_role, authenticator ou um JWT desses papéis. No SQL Editor, postgres sem JWT recebe false, nunca NULL.';

create or replace function public.is_approved_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'administrador'
      and status = 'aprovado'
  );
$$;

create or replace function public.current_account_can_write()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and status in ('pendente', 'aprovado')
  );
$$;

create or replace function public.subject_owner_id(
  subject_type public.approval_subject,
  subject_id uuid
)
returns uuid
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  owner_id uuid;
begin
  if subject_type = 'perfil' then
    return subject_id;
  elsif subject_type = 'comprador' then
    select profile_id into owner_id from public.buyers where id = subject_id;
  elsif subject_type = 'fornecedor' then
    select profile_id into owner_id from public.suppliers where id = subject_id;
  elsif subject_type = 'catalogo' then
    select s.profile_id into owner_id
    from public.catalogs c
    join public.suppliers s on s.id = c.supplier_id
    where c.id = subject_id;
  elsif subject_type = 'arquivo' then
    select s.profile_id into owner_id
    from public.catalog_files f
    join public.suppliers s on s.id = f.supplier_id
    where f.id = subject_id;
  end if;

  return owner_id;
end;
$$;

create or replace function public.can_read_decision(
  subject_type public.approval_subject,
  subject_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.is_approved_admin()
    or public.subject_owner_id(subject_type, subject_id) = auth.uid();
$$;

create or replace function public.catalog_is_public(catalog_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.catalogs c
    join public.suppliers s on s.id = c.supplier_id
    join public.profiles owner_profile on owner_profile.id = s.profile_id
    where c.id = catalog_id
      and c.visibility = 'publico'
      and c.status = 'aprovado'
      and c.published_at is not null
      and c.published_pdf_id is not null
      and s.status = 'aprovado'
      and owner_profile.role = 'fornecedor'
      and owner_profile.status = 'aprovado'
  );
$$;

create or replace function public.catalog_is_restricted(catalog_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.catalogs c
    join public.suppliers s on s.id = c.supplier_id
    join public.profiles owner_profile on owner_profile.id = s.profile_id
    where c.id = catalog_is_restricted.catalog_id
      and c.visibility = 'restrito'
      and c.status = 'aprovado'
      and c.published_at is not null
      and c.published_pdf_id is not null
      and s.status = 'aprovado'
      and owner_profile.role = 'fornecedor'
      and owner_profile.status = 'aprovado'
      and (
        public.is_approved_admin()
        or exists (
          select 1
          from public.profiles viewer
          join public.buyers b on b.profile_id = viewer.id
          where viewer.id = auth.uid()
            and viewer.role = 'comprador'
            and viewer.status = 'aprovado'
            and b.status = 'aprovado'
        )
      )
  );
$$;

create or replace function public.catalog_file_is_public(file_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.catalogs c
    join public.catalog_files f on f.id = file_id
    where public.catalog_is_public(c.id)
      and f.catalog_id = c.id
      and f.supplier_id = c.supplier_id
      and f.status = 'aprovado'
      and f.superseded_at is null
      and f.published_at is not null
      and (
        (c.published_pdf_id = f.id and f.kind = 'pdf')
        or (c.published_cover_id = f.id and f.kind = 'capa')
      )
  );
$$;

create or replace function public.catalog_file_is_restricted(file_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.catalogs c
    join public.catalog_files f on f.id = file_id
    where public.catalog_is_restricted(c.id)
      and f.catalog_id = c.id
      and f.supplier_id = c.supplier_id
      and f.status = 'aprovado'
      and f.superseded_at is null
      and f.published_at is not null
      and (
        (c.published_pdf_id = f.id and f.kind = 'pdf')
        or (c.published_cover_id = f.id and f.kind = 'capa')
      )
  );
$$;

create or replace function public.assert_catalog_publication(
  file_id uuid,
  catalog_id uuid,
  supplier_id uuid,
  kind public.catalog_file_kind
)
returns void
language plpgsql
set search_path = ''
as $$
begin
  if assert_catalog_publication.file_id is null then
    return;
  end if;

  if not exists (
    select 1
    from public.catalog_files f
    where f.id = assert_catalog_publication.file_id
      and f.catalog_id = assert_catalog_publication.catalog_id
      and f.supplier_id = assert_catalog_publication.supplier_id
      and f.kind = assert_catalog_publication.kind
      and f.superseded_at is null
      and (
        f.status = 'aprovado'
        or pg_catalog.pg_trigger_depth() > 1
      )
  ) then
    raise exception 'o arquivo publicado precisa estar aprovado, pertencer a este catálogo e não ter sido substituído'
      using errcode = '42501';
  end if;
end;
$$;

create or replace function public.catalog_storage_visible(bucket text, object_name text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.catalog_files f
    join public.suppliers s on s.id = f.supplier_id
    where f.bucket_id = bucket
      and f.storage_path = object_name
      and (
        public.is_approved_admin()
        or s.profile_id = auth.uid()
        or public.catalog_file_is_public(f.id)
        or public.catalog_file_is_restricted(f.id)
      )
  );
$$;

create or replace function public.catalog_storage_upload_allowed(bucket text, object_name text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.catalog_files f
    join public.suppliers s on s.id = f.supplier_id
    where f.bucket_id = bucket
      and f.storage_path = object_name
      and f.status = 'pendente'
      and f.superseded_at is null
      and s.profile_id = auth.uid()
      and s.status = 'aprovado'
      and exists (
        select 1
        from public.profiles owner_profile
        where owner_profile.id = s.profile_id
          and owner_profile.role = 'fornecedor'
          and owner_profile.status = 'aprovado'
      )
  );
$$;

create or replace function public.catalog_storage_delete_allowed(bucket text, object_name text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.catalog_files f
    join public.suppliers s on s.id = f.supplier_id
    where f.bucket_id = bucket
      and f.storage_path = object_name
      and f.status in ('pendente', 'rejeitado')
      and s.profile_id = auth.uid()
      and s.status = 'aprovado'
      and exists (
        select 1
        from public.profiles owner_profile
        where owner_profile.id = s.profile_id
          and owner_profile.role = 'fornecedor'
          and owner_profile.status = 'aprovado'
      )
  );
$$;

-- ---------------------------------------------------------------------------
-- Regras de privilégio e de publicação
-- ---------------------------------------------------------------------------

create or replace function public.assert_staff_change(owner_id uuid)
returns void
language plpgsql
set search_path = ''
as $$
begin
  if not public.is_api_role() then
    return;
  end if;

  if auth.uid() is null or not public.is_approved_admin() then
    raise exception 'somente um administrador aprovado pode alterar papel ou status'
      using errcode = '42501';
  end if;

  if auth.uid() = owner_id then
    raise exception 'não é permitido alterar o próprio papel ou status'
      using errcode = '42501';
  end if;
end;
$$;

create or replace function public.assert_account_can_write(owner_id uuid)
returns void
language plpgsql
set search_path = ''
as $$
begin
  if not public.is_api_role() then
    return;
  end if;

  if public.is_approved_admin() and auth.uid() is distinct from owner_id then
    return;
  end if;

  if auth.uid() is distinct from owner_id or not public.current_account_can_write() then
    raise exception 'perfil suspenso, rejeitado ou sem sessão não altera este cadastro'
      using errcode = '42501';
  end if;
end;
$$;

create or replace function public.guard_profile_insert()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  -- Bloqueia insert vindo de anon, authenticated ou service_role.
  -- supabase_auth_admin, postgres e supabase_admin passam: é o caminho do
  -- trigger handle_new_user. O papel administrador continua proibido abaixo,
  -- mesmo que o metadado do Auth peça esse papel.
  if current_user in ('anon', 'authenticated', 'service_role')
    or session_user in ('anon', 'authenticated', 'service_role', 'authenticator') then
    raise exception 'perfis são criados apenas pelo Supabase Auth'
      using errcode = '42501';
  end if;

  if new.role = 'administrador' then
    raise exception 'não é permitido criar um administrador direto no cadastro'
      using errcode = '42501';
  end if;

  if new.status is distinct from 'pendente' then
    raise exception 'um perfil novo entra como pendente'
      using errcode = '42501';
  end if;

  if new.email is not null then
    new.email := lower(btrim(new.email));
  end if;

  if new.phone is not null then
    new.phone := public.digits_only(new.phone);
  end if;

  return new;
end;
$$;

create or replace function public.guard_profile_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.id is distinct from old.id then
    raise exception 'o identificador do perfil não pode ser alterado'
      using errcode = '42501';
  end if;

  if new.email is distinct from old.email
    and current_user in ('anon', 'authenticated', 'service_role') then
    raise exception 'o e-mail de login acompanha o Supabase Auth e não pode ser alterado por aqui'
      using errcode = '42501';
  end if;

  if new.email is not null then
    new.email := lower(btrim(new.email));
  end if;

  if new.phone is not null then
    new.phone := public.digits_only(new.phone);
  end if;

  if new.role is distinct from old.role or new.status is distinct from old.status then
    perform public.assert_staff_change(old.id);
  end if;

  if new.role is distinct from old.role and public.is_api_role() then
    if new.role = 'fornecedor' and exists (
      select 1 from public.buyers where profile_id = old.id
    ) then
      raise exception 'este perfil já possui cadastro de comprador'
        using errcode = '42501';
    end if;

    if new.role = 'comprador' and exists (
      select 1 from public.suppliers where profile_id = old.id
    ) then
      raise exception 'este perfil já possui cadastro de fornecedor'
        using errcode = '42501';
    end if;
  end if;

  if new.status = 'suspenso' and old.status is distinct from 'suspenso' then
    update public.buyers
    set status = 'suspenso'
    where profile_id = new.id
      and status is distinct from 'suspenso';

    update public.suppliers
    set status = 'suspenso'
    where profile_id = new.id
      and status is distinct from 'suspenso';
  end if;

  new.updated_at := pg_catalog.now();
  return new;
end;
$$;

create or replace function public.guard_buyer()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  owner_role public.user_role;
  demoted boolean := false;
begin
  new.cnpj := public.digits_only(new.cnpj);
  new.whatsapp := public.digits_only(new.whatsapp);

  if not public.is_valid_cnpj(new.cnpj) or not public.is_valid_phone(new.whatsapp) then
    raise exception 'CNPJ ou WhatsApp do comprador é inválido'
      using errcode = '23514';
  end if;

  if exists (
    select 1 from public.suppliers s where s.cnpj = new.cnpj
  ) then
    raise exception 'este CNPJ já está vinculado a um fornecedor'
      using errcode = '23505';
  end if;

  if tg_op = 'INSERT' then
    if public.is_api_role() then
      select role into owner_role from public.profiles where id = new.profile_id;

      if auth.uid() is null
        or new.profile_id is distinct from auth.uid()
        or owner_role is distinct from 'comprador'
        or new.status is distinct from 'pendente'
        or not public.current_account_can_write() then
        raise exception 'somente o próprio comprador pode abrir um cadastro pendente'
          using errcode = '42501';
      end if;
    elsif new.status is distinct from 'pendente'
      and new.status is distinct from 'aprovado'
      and new.status is distinct from 'rejeitado'
      and new.status is distinct from 'suspenso' then
      raise exception 'status de comprador inválido'
        using errcode = '23514';
    end if;

    return new;
  end if;

  if new.profile_id is distinct from old.profile_id then
    raise exception 'o vínculo com o perfil não pode ser alterado'
      using errcode = '42501';
  end if;

  perform public.assert_account_can_write(old.profile_id);

  if old.status = 'aprovado'
    and public.is_api_role()
    and (
      new.company_name is distinct from old.company_name
      or new.cnpj is distinct from old.cnpj
      or new.job_title is distinct from old.job_title
      or new.segment is distinct from old.segment
      or new.whatsapp is distinct from old.whatsapp
    )
    and not (
      public.is_approved_admin()
      and auth.uid() is distinct from old.profile_id
      and new.status = 'aprovado'
    ) then
    new.status := 'pendente';
    demoted := true;
    perform set_config(
      'app.approval_note',
      'Dados do comprador aprovado foram alterados e voltaram para análise.',
      true
    );
  end if;

  if new.status is distinct from old.status and not demoted then
    perform public.assert_staff_change(old.profile_id);
  end if;

  if new.status = 'aprovado' and not exists (
    select 1
    from public.profiles p
    where p.id = new.profile_id
      and p.role = 'comprador'
      and p.status = 'aprovado'
      and char_length(btrim(p.full_name)) between 2 and 160
      and public.is_valid_email(p.email)
      and char_length(btrim(new.company_name)) between 2 and 200
      and public.is_valid_cnpj(new.cnpj)
      and char_length(btrim(new.job_title)) between 2 and 80
      and char_length(btrim(new.segment)) between 2 and 80
      and public.is_valid_phone(new.whatsapp)
  ) then
    raise exception 'comprador incompleto: nome, e-mail de login, empresa, CNPJ, cargo, segmento, WhatsApp e conta aprovada são obrigatórios'
      using errcode = '23514';
  end if;

  new.updated_at := pg_catalog.now();
  return new;
end;
$$;

create or replace function public.guard_supplier()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  owner_role public.user_role;
  owner_status public.approval_status;
  demoted boolean := false;
begin
  new.cnpj := public.digits_only(new.cnpj);
  new.whatsapp := public.digits_only(new.whatsapp);
  new.contact_email := lower(btrim(new.contact_email));
  new.logo := btrim(new.logo);

  if not public.is_valid_cnpj(new.cnpj)
    or not public.is_valid_phone(new.whatsapp)
    or not public.is_valid_email(new.contact_email)
    or not public.is_valid_logo_ref(new.logo) then
    raise exception 'CNPJ, WhatsApp, e-mail comercial ou logo do fornecedor é inválido'
      using errcode = '23514';
  end if;

  if exists (
    select 1 from public.buyers b where b.cnpj = new.cnpj
  ) then
    raise exception 'este CNPJ já está vinculado a um comprador'
      using errcode = '23505';
  end if;

  if tg_op = 'INSERT' then
    if public.is_api_role() then
      select role into owner_role from public.profiles where id = new.profile_id;

      if auth.uid() is null
        or new.profile_id is distinct from auth.uid()
        or owner_role is distinct from 'fornecedor'
        or new.status is distinct from 'pendente'
        or not public.current_account_can_write() then
        raise exception 'somente o próprio fornecedor pode abrir um cadastro pendente'
          using errcode = '42501';
      end if;
    end if;

    return new;
  end if;

  if new.profile_id is distinct from old.profile_id then
    raise exception 'o vínculo com o perfil não pode ser alterado'
      using errcode = '42501';
  end if;

  perform public.assert_account_can_write(old.profile_id);

  if old.status = 'aprovado'
    and public.is_api_role()
    and (
      new.legal_name is distinct from old.legal_name
      or new.trade_name is distinct from old.trade_name
      or new.cnpj is distinct from old.cnpj
      or new.segment is distinct from old.segment
      or new.description is distinct from old.description
      or new.logo is distinct from old.logo
      or new.commercial_contact is distinct from old.commercial_contact
      or new.contact_email is distinct from old.contact_email
      or new.whatsapp is distinct from old.whatsapp
    )
    and not (
      public.is_approved_admin()
      and auth.uid() is distinct from old.profile_id
      and new.status = 'aprovado'
    ) then
    new.status := 'pendente';
    demoted := true;
    perform set_config(
      'app.approval_note',
      'Dados do fornecedor aprovado foram alterados e voltaram para análise.',
      true
    );
  end if;

  if new.status is distinct from old.status and not demoted then
    perform public.assert_staff_change(old.profile_id);
  end if;

  if new.status = 'aprovado' then
    select role, status into owner_role, owner_status
    from public.profiles
    where id = new.profile_id;

    if owner_role is distinct from 'fornecedor' or owner_status is distinct from 'aprovado' then
      raise exception 'aprove a conta do fornecedor antes de aprovar a empresa'
        using errcode = '23514';
    end if;
  end if;

  if new.status = 'suspenso' and old.status is distinct from 'suspenso' then
    update public.catalogs
    set status = 'suspenso'
    where supplier_id = new.id
      and status is distinct from 'suspenso';
  end if;

  new.updated_at := pg_catalog.now();
  return new;
end;
$$;

create or replace function public.caller_owns_subject(
  subject_type public.approval_subject,
  subject_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.subject_owner_id(subject_type, subject_id) = auth.uid();
$$;

create or replace function public.guard_catalog_category()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if public.is_api_role() and not public.is_approved_admin() then
    raise exception 'somente um administrador aprovado altera categorias'
      using errcode = '42501';
  end if;

  new.name := btrim(new.name);
  new.slug := lower(btrim(new.slug));

  if new.parent_id is not null and not exists (
    select 1
    from public.catalog_categories parent
    where parent.id = new.parent_id
      and parent.parent_id is null
      and parent.id is distinct from new.id
  ) then
    raise exception 'subcategoria só aponta para uma categoria raiz'
      using errcode = '23514';
  end if;

  new.updated_at := pg_catalog.now();
  return new;
end;
$$;

create or replace function public.guard_catalog()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  owner_id uuid;
  supplier_status public.approval_status;
  owner_status public.approval_status;
  demoted boolean := false;
  pdf_id uuid;
  cover_id uuid;
begin
  select s.profile_id, s.status, p.status
    into owner_id, supplier_status, owner_status
  from public.suppliers s
  join public.profiles p on p.id = s.profile_id
  where s.id = new.supplier_id;

  new.title := btrim(new.title);

  if tg_op = 'INSERT' then
    if public.is_api_role()
      and (
        auth.uid() is null
        or owner_id is distinct from auth.uid()
        or supplier_status is distinct from 'aprovado'
        or owner_status is distinct from 'aprovado'
        or new.status is distinct from 'pendente'
        or new.published_at is not null
        or new.published_pdf_id is not null
        or new.published_cover_id is not null
        or not public.current_account_can_write()
      ) then
      raise exception 'catálogo novo entra pendente, sem publicação, pelo fornecedor dono'
        using errcode = '42501';
    end if;

    if new.status is distinct from 'aprovado' then
      new.published_at := null;
      new.published_pdf_id := null;
      new.published_cover_id := null;
    end if;

    return new;
  end if;

  if new.supplier_id is distinct from old.supplier_id then
    raise exception 'o catálogo não pode trocar de fornecedor'
      using errcode = '42501';
  end if;

  if public.is_api_role()
    and current_user not in ('postgres', 'supabase_admin')
    and (
      new.published_pdf_id is distinct from old.published_pdf_id
      or new.published_cover_id is distinct from old.published_cover_id
    ) then
    raise exception 'os identificadores publicados não podem ser alterados diretamente'
      using errcode = '42501';
  end if;

  -- A publicação de uma versão nova entra por função SECURITY DEFINER.
  -- current_user vira o dono, enquanto a sessão da API continua reconhecível.
  if current_user in ('postgres', 'supabase_admin')
    and public.is_api_role()
    and new.category_id is not distinct from old.category_id
    and new.title is not distinct from old.title
    and new.slug is not distinct from old.slug
    and new.description is not distinct from old.description
    and new.visibility is not distinct from old.visibility
    and new.status is not distinct from old.status then
    if new.published_pdf_id is distinct from old.published_pdf_id then
      perform public.assert_catalog_publication(new.published_pdf_id, new.id, new.supplier_id, 'pdf');
    end if;

    if new.published_cover_id is distinct from old.published_cover_id then
      perform public.assert_catalog_publication(new.published_cover_id, new.id, new.supplier_id, 'capa');
    end if;

    new.updated_at := pg_catalog.now();
    return new;
  end if;

  if public.is_api_role()
    and not public.is_approved_admin()
    and (
      supplier_status is distinct from 'aprovado'
      or owner_status is distinct from 'aprovado'
    ) then
    raise exception 'somente fornecedor aprovado gerencia catálogos'
      using errcode = '42501';
  end if;

  perform public.assert_account_can_write(owner_id);

  if old.status = 'aprovado'
    and public.is_api_role()
    and (
      new.title is distinct from old.title
      or new.slug is distinct from old.slug
      or new.description is distinct from old.description
      or new.category_id is distinct from old.category_id
      or new.visibility is distinct from old.visibility
    )
    and not (
      public.is_approved_admin()
      and auth.uid() is distinct from owner_id
      and new.status = 'aprovado'
    ) then
    new.status := 'pendente';
    demoted := true;
    perform set_config(
      'app.approval_note',
      'Catálogo aprovado foi alterado e voltou para análise.',
      true
    );
  end if;

  if new.status is distinct from old.status and not demoted then
    perform public.assert_staff_change(owner_id);
  end if;

  if new.status = 'aprovado'
    and (
      supplier_status is distinct from 'aprovado'
      or owner_status is distinct from 'aprovado'
      or char_length(btrim(coalesce(new.description, ''))) < 10
      or not exists (
        select 1
        from public.catalog_categories category
        where category.id = new.category_id
          and category.active
      )
    ) then
    raise exception 'aprove o fornecedor, escolha uma categoria ativa e preencha a descrição antes de publicar o catálogo'
      using errcode = '23514';
  end if;

  if new.status = 'aprovado'
    and (
      old.status is distinct from 'aprovado'
      or new.published_pdf_id is null
    ) then
    select f.id into pdf_id
    from public.catalog_files f
    where f.catalog_id = new.id
      and f.supplier_id = new.supplier_id
      and f.kind = 'pdf'
      and f.status = 'aprovado'
      and f.superseded_at is null
    order by f.created_at desc
    limit 1;

    if pdf_id is null then
      raise exception 'é preciso um PDF aprovado, enviado sem preços, antes de publicar o catálogo'
        using errcode = '23514';
    end if;

    select f.id into cover_id
    from public.catalog_files f
    where f.catalog_id = new.id
      and f.supplier_id = new.supplier_id
      and f.kind = 'capa'
      and f.status = 'aprovado'
      and f.superseded_at is null
    order by f.created_at desc
    limit 1;

    new.published_pdf_id := pdf_id;
    new.published_cover_id := cover_id;
    new.published_at := pg_catalog.now();

    update public.catalog_files
    set published_at = pg_catalog.now()
    where id in (pdf_id, cover_id)
      and published_at is null;
  elsif new.status is distinct from 'aprovado' then
    new.published_at := null;
    new.published_pdf_id := null;
    new.published_cover_id := null;
  elsif new.published_at is distinct from old.published_at and public.is_api_role() then
    raise exception 'a publicação acompanha a aprovação'
      using errcode = '42501';
  end if;

  new.updated_at := pg_catalog.now();
  return new;
end;
$$;

create or replace function public.cascade_catalog_suspension()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Roda depois do UPDATE do catálogo. Suspender os arquivos no BEFORE
  -- faria outro UPDATE na mesma linha ainda dentro do comando original.
  perform public.suspend_catalog_files(new.id);
  return null;
end;
$$;

create or replace function public.suspend_catalog_files(target_catalog uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if public.is_api_role() and not public.is_approved_admin() then
    raise exception 'somente um administrador suspende os arquivos do catálogo'
      using errcode = '42501';
  end if;

  update public.catalog_files
  set status = 'suspenso'
  where catalog_id = target_catalog
    and status is distinct from 'suspenso';
end;
$$;

create or replace function public.link_approved_catalog_file(file_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  chosen_catalog uuid;
  chosen_kind public.catalog_file_kind;
  catalog_status public.approval_status;
begin
  if public.is_api_role() and not public.is_approved_admin() then
    raise exception 'somente a aprovação de um administrador publica uma versão'
      using errcode = '42501';
  end if;

  select f.catalog_id, f.kind
    into chosen_catalog, chosen_kind
  from public.catalog_files f
  where f.id = file_id;

  if chosen_catalog is null then
    raise exception 'arquivo de catálogo não encontrado'
      using errcode = '23503';
  end if;

  update public.catalog_files
  set superseded_at = pg_catalog.now()
  where catalog_id = chosen_catalog
    and kind = chosen_kind
    and id is distinct from file_id
    and status = 'aprovado'
    and superseded_at is null;

  select status into catalog_status
  from public.catalogs
  where id = chosen_catalog;

  if catalog_status = 'aprovado' and chosen_kind = 'pdf' then
    update public.catalogs
    set published_pdf_id = file_id,
        published_at = pg_catalog.now()
    where id = chosen_catalog;
  elsif catalog_status = 'aprovado' and chosen_kind = 'capa' then
    update public.catalogs
    set published_cover_id = file_id
    where id = chosen_catalog;
  end if;
end;
$$;

create or replace function public.guard_catalog_file()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  owner_id uuid;
  supplier_status public.approval_status;
  owner_status public.approval_status;
  catalog_supplier uuid;
  extension text;
begin
  select s.profile_id, s.status, p.status
    into owner_id, supplier_status, owner_status
  from public.suppliers s
  join public.profiles p on p.id = s.profile_id
  where s.id = new.supplier_id;

  select c.supplier_id into catalog_supplier
  from public.catalogs c
  where c.id = new.catalog_id;

  if catalog_supplier is distinct from new.supplier_id then
    raise exception 'o arquivo precisa pertencer ao catálogo do mesmo fornecedor'
      using errcode = '42501';
  end if;

  extension := case
    when new.kind = 'pdf' and new.mime_type = 'application/pdf' then '.pdf'
    when new.kind = 'capa' and new.mime_type = 'image/jpeg' then '.jpg'
    when new.kind = 'capa' and new.mime_type = 'image/png' then '.png'
    when new.kind = 'capa' and new.mime_type = 'image/webp' then '.webp'
    else null
  end;

  if extension is null
    or new.storage_path is distinct from new.catalog_id::text || '/' || new.id::text || extension then
    raise exception 'o caminho do arquivo precisa ser o identificador do catálogo e da versão'
      using errcode = '23514';
  end if;

  if tg_op = 'UPDATE'
    and current_user in ('postgres', 'supabase_admin')
    and public.is_api_role()
    and new.catalog_id is not distinct from old.catalog_id
    and new.supplier_id is not distinct from old.supplier_id
    and new.kind is not distinct from old.kind
    and new.bucket_id is not distinct from old.bucket_id
    and new.storage_path is not distinct from old.storage_path
    and new.mime_type is not distinct from old.mime_type
    and new.byte_size is not distinct from old.byte_size
    and (
      new.status is not distinct from old.status
      or new.status = 'suspenso'
    ) then
    if new.status is distinct from 'aprovado' then
      new.published_at := null;
    end if;
    -- superseded_at fica: a versão já substituída continua fora da publicação.
    new.updated_at := pg_catalog.now();
    return new;
  end if;

  if tg_op = 'UPDATE'
    and new.status is not distinct from old.status
    and new.superseded_at is not distinct from old.superseded_at
    and new.storage_path is not distinct from old.storage_path
    and old.published_at is null
    and new.published_at is not null
    and new.status = 'aprovado'
    and (not public.is_api_role() or public.is_approved_admin()) then
    new.updated_at := pg_catalog.now();
    return new;
  end if;

  if tg_op = 'INSERT' then
    if public.is_api_role()
      and (
        auth.uid() is null
        or owner_id is distinct from auth.uid()
        or supplier_status is distinct from 'aprovado'
        or owner_status is distinct from 'aprovado'
        or new.status is distinct from 'pendente'
        or new.published_at is not null
        or new.superseded_at is not null
        or not public.current_account_can_write()
      ) then
      raise exception 'arquivo novo entra pendente, sem publicação, pelo fornecedor dono'
        using errcode = '42501';
    end if;

    if new.status is distinct from 'aprovado' then
      new.published_at := null;
    end if;

    new.updated_at := pg_catalog.now();
    return new;
  end if;

  if new.catalog_id is distinct from old.catalog_id
    or new.supplier_id is distinct from old.supplier_id
    or new.kind is distinct from old.kind
    or new.bucket_id is distinct from old.bucket_id
    or new.storage_path is distinct from old.storage_path
    or new.mime_type is distinct from old.mime_type
    or new.byte_size is distinct from old.byte_size then
    raise exception 'arquivo enviado não pode ser reescrito; envie outra versão'
      using errcode = '42501';
  end if;

  if public.is_api_role()
    and not public.is_approved_admin()
    and (
      supplier_status is distinct from 'aprovado'
      or owner_status is distinct from 'aprovado'
    ) then
    raise exception 'somente fornecedor aprovado envia ou altera arquivos'
      using errcode = '42501';
  end if;

  perform public.assert_account_can_write(owner_id);

  if new.status is distinct from old.status or new.superseded_at is distinct from old.superseded_at then
    perform public.assert_staff_change(owner_id);
  end if;

  if new.status is distinct from 'aprovado' then
    new.published_at := null;
    if new.status is distinct from 'suspenso' then
      new.superseded_at := null;
    end if;

    if not exists (
      select 1
      from public.catalogs c
      where c.id = new.catalog_id
        and c.status = 'suspenso'
    ) then
      update public.catalogs
      set published_cover_id = case
            when published_cover_id = new.id then null
            else published_cover_id
          end,
          published_pdf_id = case
            when published_pdf_id = new.id then null
            else published_pdf_id
          end,
          status = case
            when published_pdf_id = new.id and status = 'aprovado' then 'pendente'::public.approval_status
            else status
          end
      where id = new.catalog_id
        and status is distinct from 'suspenso'
        and (published_pdf_id = new.id or published_cover_id = new.id);
    end if;
  elsif old.status is distinct from 'aprovado' then
    perform public.link_approved_catalog_file(new.id);
    if exists (
      select 1
      from public.catalogs c
      where c.id = new.catalog_id
        and c.status = 'aprovado'
        and (
          (new.kind = 'pdf' and c.published_pdf_id = new.id)
          or (new.kind = 'capa' and c.published_cover_id = new.id)
        )
    ) then
      new.published_at := pg_catalog.now();
    else
      new.published_at := null;
    end if;
  elsif new.published_at is distinct from old.published_at and public.is_api_role() then
    raise exception 'a publicação do arquivo acompanha a aprovação'
      using errcode = '42501';
  end if;

  new.updated_at := pg_catalog.now();
  return new;
end;
$$;

create or replace function public.guard_catalog_download()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.downloaded_by is distinct from auth.uid() then
    raise exception 'o download registra somente o usuário da sessão'
      using errcode = '42501';
  end if;

  if not exists (
    select 1
    from public.catalog_files f
    join public.catalogs c on c.id = f.catalog_id
    where f.id = new.file_id
      and f.catalog_id = new.catalog_id
      and f.kind = 'pdf'
      and c.published_pdf_id = f.id
      and (
        public.catalog_is_public(c.id)
        or public.catalog_is_restricted(c.id)
      )
  ) then
    raise exception 'somente o PDF publicado e visível para esta sessão entra no registro'
      using errcode = '42501';
  end if;

  new.downloaded_at := pg_catalog.now();
  return new;
end;
$$;

create or replace function public.record_catalog_download(target_file uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  chosen_catalog uuid;
  new_id uuid;
begin
  if not exists (
    select 1
    from public.catalog_files f
    where f.id = target_file
      and f.kind = 'pdf'
  ) then
    raise exception 'a visualização da capa não é contabilizada como download'
      using errcode = '42501';
  end if;

  if not public.catalog_file_is_public(target_file)
    and not public.catalog_file_is_restricted(target_file) then
    raise exception 'somente o PDF publicado e visível para esta sessão pode ser contabilizado'
      using errcode = '42501';
  end if;

  select f.catalog_id into chosen_catalog
  from public.catalog_files f
  where f.id = target_file;

  insert into public.catalog_downloads (catalog_id, file_id, downloaded_by)
  values (chosen_catalog, target_file, auth.uid())
  returning id into new_id;

  return new_id;
end;
$$;

create or replace function public.guard_content_delete()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  owner_id uuid;
begin
  if not public.is_api_role() then
    return old;
  end if;

  if old.status in ('aprovado', 'suspenso') then
    raise exception 'conteúdo aprovado ou suspenso não pode ser excluído'
      using errcode = '42501';
  end if;

  select profile_id into owner_id
  from public.suppliers
  where id = old.supplier_id;

  if auth.uid() is distinct from owner_id or not public.current_account_can_write() then
    raise exception 'somente o fornecedor dono, com conta ativa, pode excluir este rascunho'
      using errcode = '42501';
  end if;

  return old;
end;
$$;

create or replace function public.record_approval_decision()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  subject public.approval_subject;
  prev_role public.user_role;
  next_role public.user_role;
  decision_note text;
begin
  if tg_op is distinct from 'UPDATE' then
    raise exception 'histórico gerado apenas em atualização'
      using errcode = '42501';
  end if;

  subject := case tg_table_name
    when 'profiles' then 'perfil'::public.approval_subject
    when 'buyers' then 'comprador'::public.approval_subject
    when 'suppliers' then 'fornecedor'::public.approval_subject
    when 'catalogs' then 'catalogo'::public.approval_subject
    when 'catalog_files' then 'arquivo'::public.approval_subject
    else null
  end;

  if subject is null then
    raise exception 'tabela sem histórico de aprovação';
  end if;

  if tg_table_name = 'profiles' then
    if old.status is not distinct from new.status
      and old.role is not distinct from new.role then
      return new;
    end if;
    prev_role := old.role;
    next_role := new.role;
  elsif old.status is not distinct from new.status then
    return new;
  end if;

  decision_note := nullif(pg_catalog.current_setting('app.approval_note', true), '');

  insert into public.approval_decisions (
    actor_id,
    subject_type,
    subject_id,
    previous_status,
    new_status,
    previous_role,
    new_role,
    note
  ) values (
    auth.uid(),
    subject,
    new.id,
    old.status,
    new.status,
    prev_role,
    next_role,
    decision_note
  );

  if new.status = 'aprovado' and subject <> 'perfil'::public.approval_subject then
    update public.correction_requests
    set state = 'atendida',
        closed_at = pg_catalog.now(),
        updated_at = pg_catalog.now()
    where subject_type = subject
      and subject_id = new.id
      and state = 'aberta';
  end if;

  perform set_config('app.approval_note', '', true);
  return new;
end;
$$;

create or replace function public.guard_decision_insert()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  -- current_user, e não o JWT: o histórico legítimo é inserido por uma função
  -- SECURITY DEFINER, cujo current_user é o dono da função.
  if current_user in ('anon', 'authenticated', 'service_role') then
    raise exception 'o histórico não aceita inserção direta pela API'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

create or replace function public.block_decision_mutation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'o histórico de decisões é imutável'
    using errcode = '42501';
end;
$$;

create or replace function public.guard_correction()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  owner_id uuid;
begin
  if tg_op = 'INSERT' then
    owner_id := public.subject_owner_id(new.subject_type, new.subject_id);

    if owner_id is null then
      raise exception 'não há cadastro para esta solicitação de correção'
        using errcode = '23503';
    end if;

    if public.is_api_role() then
      if not public.is_approved_admin() or auth.uid() is distinct from new.requested_by then
        raise exception 'somente um administrador aprovado abre solicitação de correção'
          using errcode = '42501';
      end if;

      if auth.uid() = owner_id then
        raise exception 'um administrador não solicita correção do próprio cadastro'
          using errcode = '42501';
      end if;
    end if;

    new.reason := btrim(new.reason);
    new.state := 'aberta';
    new.closed_at := null;
    new.updated_at := pg_catalog.now();

    perform set_config('app.approval_note', 'Correção solicitada: ' || left(new.reason, 500), true);

    if new.subject_type = 'comprador' then
      update public.buyers
      set status = 'pendente'
      where id = new.subject_id
        and status = 'aprovado';
    elsif new.subject_type = 'fornecedor' then
      update public.suppliers
      set status = 'pendente'
      where id = new.subject_id
        and status = 'aprovado';
    elsif new.subject_type = 'catalogo' then
      update public.catalogs
      set status = 'pendente'
      where id = new.subject_id
        and status = 'aprovado';
    end if;

    return new;
  end if;

  if new.subject_type is distinct from old.subject_type
    or new.subject_id is distinct from old.subject_id
    or new.requested_by is distinct from old.requested_by
    or new.created_at is distinct from old.created_at then
    raise exception 'o vínculo da solicitação de correção é imutável'
      using errcode = '42501';
  end if;

  owner_id := public.subject_owner_id(new.subject_type, new.subject_id);

  if public.is_api_role() and auth.uid() = owner_id and not public.is_approved_admin() then
    if not public.current_account_can_write() then
      raise exception 'perfil suspenso ou rejeitado não responde à correção'
        using errcode = '42501';
    end if;

    if new.reason is distinct from old.reason
      or new.state is distinct from old.state
      or new.closed_at is distinct from old.closed_at then
      raise exception 'o responsável só pode preencher a resposta'
        using errcode = '42501';
    end if;

    if old.state is distinct from 'aberta' then
      raise exception 'solicitação de correção encerrada'
        using errcode = '42501';
    end if;
  elsif public.is_api_role() then
    if not public.is_approved_admin() or auth.uid() = owner_id then
      raise exception 'somente outro administrador acompanha esta solicitação'
        using errcode = '42501';
    end if;

    if new.reason is distinct from old.reason then
      raise exception 'o motivo registrado não pode ser reescrito'
        using errcode = '42501';
    end if;
  end if;

  if new.state = 'aberta' then
    new.closed_at := null;
  elsif old.state = 'aberta' and new.closed_at is null then
    new.closed_at := pg_catalog.now();
  end if;

  new.updated_at := pg_catalog.now();
  return new;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested text;
  safe_role public.user_role;
  given_name text;
  given_phone text;
  given_email text;
begin
  requested := lower(coalesce(new.raw_user_meta_data ->> 'role', 'comprador'));

  -- Metadado administrador, ou qualquer outro valor, não eleva o perfil.
  if requested = 'fornecedor' then
    safe_role := 'fornecedor';
  else
    safe_role := 'comprador';
  end if;

  if jsonb_typeof(new.raw_user_meta_data -> 'full_name') = 'string' then
    given_name := left(btrim(new.raw_user_meta_data ->> 'full_name'), 160);
  else
    given_name := '';
  end if;

  if jsonb_typeof(new.raw_user_meta_data -> 'phone') = 'string' then
    given_phone := public.digits_only(new.raw_user_meta_data ->> 'phone');
  else
    given_phone := null;
  end if;

  given_email := nullif(lower(btrim(coalesce(new.email, ''))), '');

  insert into public.profiles (id, role, status, full_name, email, phone)
  values (new.id, safe_role, 'pendente', coalesce(given_name, ''), given_email, given_phone)
  on conflict (id) do nothing;

  return new;
end;
$$;

create or replace function public.sync_profile_from_auth()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  given_name text;
  given_phone text;
  given_email text;
begin
  if new.email is not distinct from old.email
    and new.raw_user_meta_data is not distinct from old.raw_user_meta_data then
    return new;
  end if;

  given_email := nullif(lower(btrim(coalesce(new.email, ''))), '');

  if jsonb_typeof(new.raw_user_meta_data -> 'full_name') = 'string' then
    given_name := left(btrim(new.raw_user_meta_data ->> 'full_name'), 160);
  else
    given_name := null;
  end if;

  if jsonb_typeof(new.raw_user_meta_data -> 'phone') = 'string' then
    given_phone := public.digits_only(new.raw_user_meta_data ->> 'phone');
  else
    given_phone := null;
  end if;

  -- E-mail de login continua espelhando o Auth.
  -- Nome e telefone de conta suspensa ou rejeitada não acompanham o metadado:
  -- o usuário não recupera edição do perfil por auth.updateUser.
  update public.profiles
  set email = given_email,
      full_name = case
        when status in ('suspenso', 'rejeitado') then full_name
        else coalesce(given_name, full_name)
      end,
      phone = case
        when status in ('suspenso', 'rejeitado') then phone
        when given_phone is not null then given_phone
        else phone
      end,
      updated_at = pg_catalog.now()
  where id = new.id;

  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------

create trigger profiles_guard_insert
  before insert on public.profiles
  for each row execute function public.guard_profile_insert();

create trigger profiles_guard_update
  before update on public.profiles
  for each row execute function public.guard_profile_update();

create trigger profiles_record_decision
  after update of role, status on public.profiles
  for each row execute function public.record_approval_decision();

create trigger buyers_guard
  before insert or update on public.buyers
  for each row execute function public.guard_buyer();

create trigger buyers_record_decision
  after update of status on public.buyers
  for each row execute function public.record_approval_decision();

create trigger suppliers_guard
  before insert or update on public.suppliers
  for each row execute function public.guard_supplier();

create trigger suppliers_record_decision
  after update of status on public.suppliers
  for each row execute function public.record_approval_decision();

create trigger catalogs_guard
  before insert or update on public.catalogs
  for each row execute function public.guard_catalog();

create trigger catalogs_suspend_files
  after update of status on public.catalogs
  for each row
  when (old.status is distinct from 'suspenso' and new.status = 'suspenso')
  execute function public.cascade_catalog_suspension();

create trigger catalogs_guard_delete
  before delete on public.catalogs
  for each row execute function public.guard_content_delete();

create trigger catalogs_record_decision
  after update of status on public.catalogs
  for each row execute function public.record_approval_decision();

create trigger catalog_categories_guard
  before insert or update on public.catalog_categories
  for each row execute function public.guard_catalog_category();

create trigger catalog_files_guard
  before insert or update on public.catalog_files
  for each row execute function public.guard_catalog_file();

create trigger catalog_files_guard_delete
  before delete on public.catalog_files
  for each row execute function public.guard_content_delete();

create trigger catalog_files_record_decision
  after update of status on public.catalog_files
  for each row execute function public.record_approval_decision();

create trigger catalog_downloads_guard
  before insert on public.catalog_downloads
  for each row execute function public.guard_catalog_download();

insert into public.catalog_categories (name, slug, sort_order)
values ('Enxoval de A&B', 'enxoval-de-ab', 10);

create trigger approval_decisions_guard_insert
  before insert on public.approval_decisions
  for each row execute function public.guard_decision_insert();

create trigger approval_decisions_block_mutation
  before update or delete on public.approval_decisions
  for each row execute function public.block_decision_mutation();

create trigger correction_requests_guard
  before insert or update on public.correction_requests
  for each row execute function public.guard_correction();

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create trigger on_auth_user_updated
  after update of email, raw_user_meta_data on auth.users
  for each row execute function public.sync_profile_from_auth();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.buyers enable row level security;
alter table public.suppliers enable row level security;
alter table public.approval_decisions enable row level security;
alter table public.catalogs enable row level security;
alter table public.catalog_categories enable row level security;
alter table public.catalog_files enable row level security;
alter table public.catalog_downloads enable row level security;
alter table public.correction_requests enable row level security;

create policy profiles_select_own_or_admin
  on public.profiles
  for select
  to authenticated
  using (
    id = (select auth.uid())
    or (select public.is_approved_admin())
  );

create policy profiles_update_own_or_admin
  on public.profiles
  for update
  to authenticated
  using (
    (
      id = (select auth.uid())
      and (select public.current_account_can_write())
    )
    or (select public.is_approved_admin())
  )
  with check (
    (
      id = (select auth.uid())
      and (select public.current_account_can_write())
    )
    or (select public.is_approved_admin())
  );

create policy buyers_select_own_or_admin
  on public.buyers
  for select
  to authenticated
  using (
    profile_id = (select auth.uid())
    or (select public.is_approved_admin())
  );

create policy buyers_insert_own_pending
  on public.buyers
  for insert
  to authenticated
  with check (
    profile_id = (select auth.uid())
    and status = 'pendente'
    and (select public.current_account_can_write())
  );

create policy buyers_update_own_or_admin
  on public.buyers
  for update
  to authenticated
  using (
    (
      profile_id = (select auth.uid())
      and (select public.current_account_can_write())
    )
    or (select public.is_approved_admin())
  )
  with check (
    (
      profile_id = (select auth.uid())
      and (select public.current_account_can_write())
    )
    or (select public.is_approved_admin())
  );

create policy suppliers_select_own_or_admin
  on public.suppliers
  for select
  to authenticated
  using (
    profile_id = (select auth.uid())
    or (select public.is_approved_admin())
  );

create policy suppliers_insert_own_pending
  on public.suppliers
  for insert
  to authenticated
  with check (
    profile_id = (select auth.uid())
    and status = 'pendente'
    and (select public.current_account_can_write())
  );

create policy suppliers_update_own_or_admin
  on public.suppliers
  for update
  to authenticated
  using (
    (
      profile_id = (select auth.uid())
      and (select public.current_account_can_write())
    )
    or (select public.is_approved_admin())
  )
  with check (
    (
      profile_id = (select auth.uid())
      and (select public.current_account_can_write())
    )
    or (select public.is_approved_admin())
  );

create policy approval_decisions_select_involved
  on public.approval_decisions
  for select
  to authenticated
  using ((select public.can_read_decision(subject_type, subject_id)));

create policy catalogs_select_public
  on public.catalogs
  for select
  to anon
  using ((select public.catalog_is_public(id)));

create policy catalogs_select_authenticated
  on public.catalogs
  for select
  to authenticated
  using (
    (select public.catalog_is_public(id))
    or (select public.catalog_is_restricted(id))
    or (select public.is_approved_admin())
    or exists (
      select 1
      from public.suppliers s
      where s.id = supplier_id
        and s.profile_id = (select auth.uid())
    )
  );

create policy catalogs_insert_own_pending
  on public.catalogs
  for insert
  to authenticated
  with check (
    status = 'pendente'
    and published_at is null
    and (select public.current_account_can_write())
    and exists (
      select 1
      from public.suppliers s
      join public.profiles owner_profile on owner_profile.id = s.profile_id
      where s.id = supplier_id
        and s.profile_id = (select auth.uid())
        and s.status = 'aprovado'
        and owner_profile.role = 'fornecedor'
        and owner_profile.status = 'aprovado'
    )
  );

create policy catalogs_update_own_or_admin
  on public.catalogs
  for update
  to authenticated
  using (
    (select public.is_approved_admin())
    or exists (
      select 1
      from public.suppliers s
      join public.profiles owner_profile on owner_profile.id = s.profile_id
      where s.id = supplier_id
        and s.profile_id = (select auth.uid())
        and s.status = 'aprovado'
        and owner_profile.role = 'fornecedor'
        and owner_profile.status = 'aprovado'
    )
  )
  with check (
    (select public.is_approved_admin())
    or exists (
      select 1
      from public.suppliers s
      join public.profiles owner_profile on owner_profile.id = s.profile_id
      where s.id = supplier_id
        and s.profile_id = (select auth.uid())
        and s.status = 'aprovado'
        and owner_profile.role = 'fornecedor'
        and owner_profile.status = 'aprovado'
    )
  );

create policy catalogs_delete_own_draft
  on public.catalogs
  for delete
  to authenticated
  using (
    status in ('pendente', 'rejeitado')
    and exists (
      select 1
      from public.suppliers s
      join public.profiles owner_profile on owner_profile.id = s.profile_id
      where s.id = supplier_id
        and s.profile_id = (select auth.uid())
        and s.status = 'aprovado'
        and owner_profile.role = 'fornecedor'
        and owner_profile.status = 'aprovado'
    )
  );

create policy catalog_categories_select_anon
  on public.catalog_categories
  for select
  to anon
  using (active);

create policy catalog_categories_select_authenticated
  on public.catalog_categories
  for select
  to authenticated
  using (active or (select public.is_approved_admin()));

create policy catalog_categories_insert_admin
  on public.catalog_categories
  for insert
  to authenticated
  with check ((select public.is_approved_admin()));

create policy catalog_categories_update_admin
  on public.catalog_categories
  for update
  to authenticated
  using ((select public.is_approved_admin()))
  with check ((select public.is_approved_admin()));

create policy catalog_files_select_public
  on public.catalog_files
  for select
  to anon
  using ((select public.catalog_file_is_public(id)));

create policy catalog_files_select_authenticated
  on public.catalog_files
  for select
  to authenticated
  using (
    (select public.catalog_file_is_public(id))
    or (select public.catalog_file_is_restricted(id))
    or (select public.is_approved_admin())
    or exists (
      select 1
      from public.suppliers s
      where s.id = supplier_id
        and s.profile_id = (select auth.uid())
    )
  );

create policy catalog_files_insert_own_pending
  on public.catalog_files
  for insert
  to authenticated
  with check (
    status = 'pendente'
    and published_at is null
    and superseded_at is null
    and (select public.current_account_can_write())
    and exists (
      select 1
      from public.catalogs c
      join public.suppliers s on s.id = c.supplier_id
      join public.profiles owner_profile on owner_profile.id = s.profile_id
      where c.id = catalog_id
        and s.id = supplier_id
        and s.profile_id = (select auth.uid())
        and s.status = 'aprovado'
        and owner_profile.role = 'fornecedor'
        and owner_profile.status = 'aprovado'
    )
  );

create policy catalog_files_update_own_or_admin
  on public.catalog_files
  for update
  to authenticated
  using (
    (select public.is_approved_admin())
    or exists (
      select 1
      from public.suppliers s
      join public.profiles owner_profile on owner_profile.id = s.profile_id
      where s.id = supplier_id
        and s.profile_id = (select auth.uid())
        and s.status = 'aprovado'
        and owner_profile.role = 'fornecedor'
        and owner_profile.status = 'aprovado'
    )
  )
  with check (
    (select public.is_approved_admin())
    or exists (
      select 1
      from public.suppliers s
      join public.profiles owner_profile on owner_profile.id = s.profile_id
      where s.id = supplier_id
        and s.profile_id = (select auth.uid())
        and s.status = 'aprovado'
        and owner_profile.role = 'fornecedor'
        and owner_profile.status = 'aprovado'
    )
  );

create policy catalog_files_delete_own_draft
  on public.catalog_files
  for delete
  to authenticated
  using (
    status in ('pendente', 'rejeitado')
    and exists (
      select 1
      from public.suppliers s
      join public.profiles owner_profile on owner_profile.id = s.profile_id
      where s.id = supplier_id
        and s.profile_id = (select auth.uid())
        and s.status = 'aprovado'
        and owner_profile.role = 'fornecedor'
        and owner_profile.status = 'aprovado'
    )
  );

create policy catalog_downloads_select_admin
  on public.catalog_downloads
  for select
  to authenticated
  using ((select public.is_approved_admin()));

create policy correction_requests_select_involved
  on public.correction_requests
  for select
  to authenticated
  using (
    (select public.is_approved_admin())
    or requested_by = (select auth.uid())
    or (select public.caller_owns_subject(subject_type, subject_id))
  );

create policy correction_requests_insert_admin
  on public.correction_requests
  for insert
  to authenticated
  with check (
    requested_by = (select auth.uid())
    and state = 'aberta'
    and (select public.is_approved_admin())
  );

create policy correction_requests_update_involved
  on public.correction_requests
  for update
  to authenticated
  using (
    (select public.is_approved_admin())
    or (
      (select public.current_account_can_write())
      and (select public.caller_owns_subject(subject_type, subject_id))
    )
  )
  with check (
    (select public.is_approved_admin())
    or (
      (select public.current_account_can_write())
      and (select public.caller_owns_subject(subject_type, subject_id))
    )
  );

-- ---------------------------------------------------------------------------
-- Privilégios
-- A service_role não recebe execute nas guardas. Ela ignora RLS, mas a
-- ausência de execute faz a operação falhar antes de alterar status.
-- ---------------------------------------------------------------------------

revoke all on table public.profiles from anon, authenticated;
revoke all on table public.buyers from anon, authenticated;
revoke all on table public.suppliers from anon, authenticated;
revoke all on table public.approval_decisions from anon, authenticated;
revoke all on table public.catalogs from anon, authenticated;
revoke all on table public.catalog_categories from anon, authenticated;
revoke all on table public.catalog_files from anon, authenticated;
revoke all on table public.catalog_downloads from anon, authenticated;
revoke all on table public.correction_requests from anon, authenticated;

grant select, update on table public.profiles to authenticated;
grant select, insert, update on table public.buyers to authenticated;
grant select, insert, update on table public.suppliers to authenticated;
grant select on table public.approval_decisions to authenticated;
grant select on table public.catalog_categories to anon, authenticated;
grant insert, update on table public.catalog_categories to authenticated;
grant select on table public.catalogs to anon, authenticated;
grant insert, update, delete on table public.catalogs to authenticated;
grant select on table public.catalog_files to anon, authenticated;
grant insert, update, delete on table public.catalog_files to authenticated;
grant select on table public.catalog_downloads to authenticated;
grant select, insert, update on table public.correction_requests to authenticated;

revoke all on function public.digits_only(text) from public, anon, authenticated, service_role;
revoke all on function public.is_valid_email(text) from public, anon, authenticated, service_role;
revoke all on function public.is_valid_phone(text) from public, anon, authenticated, service_role;
revoke all on function public.is_valid_cnpj(text) from public, anon, authenticated, service_role;
revoke all on function public.is_valid_logo_ref(text) from public, anon, authenticated, service_role;
revoke all on function public.is_api_role() from public, anon, authenticated, service_role;
revoke all on function public.is_approved_admin() from public, anon, authenticated, service_role;
revoke all on function public.current_account_can_write() from public, anon, authenticated, service_role;
revoke all on function public.subject_owner_id(public.approval_subject, uuid) from public, anon, authenticated, service_role;
revoke all on function public.can_read_decision(public.approval_subject, uuid) from public, anon, authenticated, service_role;
revoke all on function public.catalog_is_public(uuid) from public, anon, authenticated, service_role;
revoke all on function public.catalog_is_restricted(uuid) from public, anon, authenticated, service_role;
revoke all on function public.catalog_file_is_public(uuid) from public, anon, authenticated, service_role;
revoke all on function public.catalog_file_is_restricted(uuid) from public, anon, authenticated, service_role;
revoke all on function public.catalog_storage_visible(text, text) from public, anon, authenticated, service_role;
revoke all on function public.catalog_storage_upload_allowed(text, text) from public, anon, authenticated, service_role;
revoke all on function public.catalog_storage_delete_allowed(text, text) from public, anon, authenticated, service_role;
revoke all on function public.caller_owns_subject(public.approval_subject, uuid) from public, anon, authenticated, service_role;
revoke all on function public.assert_staff_change(uuid) from public, anon, authenticated, service_role;
revoke all on function public.assert_account_can_write(uuid) from public, anon, authenticated, service_role;
revoke all on function public.guard_profile_insert() from public, anon, authenticated, service_role;
revoke all on function public.guard_profile_update() from public, anon, authenticated, service_role;
revoke all on function public.guard_buyer() from public, anon, authenticated, service_role;
revoke all on function public.guard_supplier() from public, anon, authenticated, service_role;
revoke all on function public.guard_catalog_category() from public, anon, authenticated, service_role;
revoke all on function public.guard_catalog() from public, anon, authenticated, service_role;
revoke all on function public.guard_catalog_file() from public, anon, authenticated, service_role;
revoke all on function public.guard_catalog_download() from public, anon, authenticated, service_role;
revoke all on function public.record_catalog_download(uuid) from public, anon, authenticated, service_role;
revoke all on function public.assert_catalog_publication(uuid, uuid, uuid, public.catalog_file_kind) from public, anon, authenticated, service_role;
revoke all on function public.link_approved_catalog_file(uuid) from public, anon, authenticated, service_role;
revoke all on function public.suspend_catalog_files(uuid) from public, anon, authenticated, service_role;
revoke all on function public.cascade_catalog_suspension() from public, anon, authenticated, service_role;
revoke all on function public.guard_content_delete() from public, anon, authenticated, service_role;
revoke all on function public.record_approval_decision() from public, anon, authenticated, service_role;
revoke all on function public.guard_decision_insert() from public, anon, authenticated, service_role;
revoke all on function public.block_decision_mutation() from public, anon, authenticated, service_role;
revoke all on function public.guard_correction() from public, anon, authenticated, service_role;
revoke all on function public.handle_new_user() from public, anon, authenticated, service_role;
revoke all on function public.sync_profile_from_auth() from public, anon, authenticated, service_role;

grant execute on function public.digits_only(text) to anon, authenticated;
grant execute on function public.is_valid_email(text) to anon, authenticated;
grant execute on function public.is_valid_phone(text) to anon, authenticated;
grant execute on function public.is_valid_cnpj(text) to anon, authenticated;
grant execute on function public.is_valid_logo_ref(text) to anon, authenticated;
grant execute on function public.is_api_role() to anon, authenticated;
grant execute on function public.is_approved_admin() to authenticated;
grant execute on function public.current_account_can_write() to authenticated;
grant execute on function public.can_read_decision(public.approval_subject, uuid) to authenticated;
grant execute on function public.catalog_is_public(uuid) to anon, authenticated;
grant execute on function public.catalog_is_restricted(uuid) to authenticated;
grant execute on function public.catalog_file_is_public(uuid) to anon, authenticated;
grant execute on function public.catalog_file_is_restricted(uuid) to authenticated;
grant execute on function public.catalog_storage_visible(text, text) to anon, authenticated;
grant execute on function public.catalog_storage_upload_allowed(text, text) to authenticated;
grant execute on function public.catalog_storage_delete_allowed(text, text) to authenticated;
grant execute on function public.caller_owns_subject(public.approval_subject, uuid) to authenticated;
grant execute on function public.assert_staff_change(uuid) to authenticated;
grant execute on function public.assert_account_can_write(uuid) to authenticated;
grant execute on function public.guard_profile_insert() to supabase_auth_admin;
grant execute on function public.guard_profile_update() to authenticated, supabase_auth_admin;
grant execute on function public.guard_buyer() to authenticated;
grant execute on function public.guard_supplier() to authenticated;
grant execute on function public.guard_catalog_category() to authenticated;
grant execute on function public.guard_catalog() to authenticated;
grant execute on function public.guard_catalog_file() to authenticated;
grant execute on function public.guard_catalog_download() to anon, authenticated;
grant execute on function public.record_catalog_download(uuid) to anon, authenticated;
grant execute on function public.link_approved_catalog_file(uuid) to authenticated;
grant execute on function public.suspend_catalog_files(uuid) to authenticated;
grant execute on function public.cascade_catalog_suspension() to authenticated;
grant execute on function public.guard_content_delete() to authenticated;
grant execute on function public.record_approval_decision() to authenticated;
grant execute on function public.guard_decision_insert() to authenticated;
grant execute on function public.block_decision_mutation() to authenticated;
grant execute on function public.guard_correction() to authenticated;
grant execute on function public.handle_new_user() to supabase_auth_admin;
grant execute on function public.sync_profile_from_auth() to supabase_auth_admin;

-- Buckets privados. A URL pública do Storage não entrega estes objetos.
-- O download usa o JWT de quem pode ver a versão aprovada.
-- Não usar service_role para assinar arquivo pendente, rejeitado ou suspenso:
-- essa chave ignora as políticas abaixo.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('catalog-pdfs', 'catalog-pdfs', false, 52428800, array['application/pdf']::text[]),
  (
    'catalog-covers',
    'catalog-covers',
    false,
    5242880,
    array['image/jpeg', 'image/png', 'image/webp']::text[]
  );

create policy catalog_storage_select
  on storage.objects
  for select
  to anon, authenticated
  using (
    bucket_id in ('catalog-pdfs', 'catalog-covers')
    and public.catalog_storage_visible(bucket_id, name)
  );

create policy catalog_storage_insert
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id in ('catalog-pdfs', 'catalog-covers')
    and public.catalog_storage_upload_allowed(bucket_id, name)
  );

create policy catalog_storage_delete
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id in ('catalog-pdfs', 'catalog-covers')
    and public.catalog_storage_delete_allowed(bucket_id, name)
  );

notify pgrst, 'reload schema';
