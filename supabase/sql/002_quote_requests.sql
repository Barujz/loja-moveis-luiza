-- Luiza Mobiliário de Luxo
-- Pedidos de orçamento de compradores aprovados sobre catálogos publicados.
--
-- Execute este arquivo inteiro, uma vez, no SQL Editor do Supabase,
-- depois de supabase/sql/001_initial_schema.sql.
-- Não altera tabelas, funções, políticas nem dados já existentes.
-- Não cria usuário e não usa service_role para gravar ou ler a tabela.
--
-- Os testes manuais estão em supabase/tests/quote_permissions.sql.
-- Eles encerram com ROLLBACK e não fazem parte deste schema.

-- ---------------------------------------------------------------------------
-- Tipos
-- ---------------------------------------------------------------------------

create type public.quote_state as enum (
  'aberta',
  'encerrada'
);

-- ---------------------------------------------------------------------------
-- Tabela
-- ---------------------------------------------------------------------------

create table public.quote_requests (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references public.buyers (id) on delete cascade,
  catalog_id uuid not null references public.catalogs (id) on delete cascade,
  supplier_id uuid not null references public.suppliers (id) on delete cascade,
  message text not null,
  state public.quote_state not null default 'aberta',
  created_at timestamptz not null default pg_catalog.now(),
  updated_at timestamptz not null default pg_catalog.now(),
  closed_at timestamptz,
  constraint quote_requests_message_length check (char_length(btrim(message)) between 3 and 2000),
  constraint quote_requests_closed_check check (
    (state = 'aberta' and closed_at is null)
    or (state = 'encerrada' and closed_at is not null)
  )
);

comment on table public.quote_requests is
  'Solicitação de orçamento de um comprador para um catálogo publicado. O fornecedor é o dono desse catálogo. Não guarda preço.';

comment on column public.quote_requests.buyer_id is
  'Cadastro do comprador que pediu o orçamento. Na API, precisa ser o da sessão.';

comment on column public.quote_requests.catalog_id is
  'Catálogo publicado e visível para quem solicita.';

comment on column public.quote_requests.supplier_id is
  'Fornecedor dono do catálogo. Não pode ser outro.';

comment on column public.quote_requests.state is
  'aberta: aguarda o comercial. encerrada: somente um administrador aprovado fecha, e a linha não reabre.';

create unique index quote_requests_one_open_key
  on public.quote_requests (buyer_id, catalog_id)
  where state = 'aberta';

create index quote_requests_buyer_created_idx
  on public.quote_requests (buyer_id, created_at desc);

create index quote_requests_state_created_idx
  on public.quote_requests (state, created_at desc);

-- ---------------------------------------------------------------------------
-- Guarda
-- SECURITY DEFINER para ler comprador, catálogo e fornecedor sem depender
-- da política de quem chama. Não devolve CNPJ, e-mail nem outro campo privado.
-- ---------------------------------------------------------------------------

create or replace function public.guard_quote_request()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  catalog_supplier uuid;
  buyer_ok boolean;
  catalog_ok boolean;
begin
  if tg_op = 'DELETE' then
    if public.is_api_role() then
      raise exception 'solicitação de orçamento não pode ser excluída'
        using errcode = '42501';
    end if;

    return old;
  end if;

  if tg_op = 'INSERT' then
    if new.state is distinct from 'aberta' or new.closed_at is not null then
      raise exception 'solicitação nova entra aberta'
        using errcode = '42501';
    end if;

    new.message := btrim(new.message);
    new.updated_at := pg_catalog.now();

    if public.is_api_role() then
      select exists (
        select 1
        from public.buyers b
        join public.profiles p on p.id = b.profile_id
        where b.id = new.buyer_id
          and b.profile_id = auth.uid()
          and b.status = 'aprovado'
          and p.role = 'comprador'
          and p.status = 'aprovado'
      ) into buyer_ok;

      if not coalesce(buyer_ok, false) then
        raise exception 'somente um comprador aprovado solicita orçamento'
          using errcode = '42501';
      end if;

      catalog_ok := public.catalog_is_public(new.catalog_id)
        or public.catalog_is_restricted(new.catalog_id);

      if not catalog_ok then
        raise exception 'catálogo indisponível para esta solicitação'
          using errcode = '42501';
      end if;
    end if;

    select c.supplier_id into catalog_supplier
    from public.catalogs c
    where c.id = new.catalog_id;

    if catalog_supplier is null or catalog_supplier is distinct from new.supplier_id then
      raise exception 'o fornecedor da solicitação não é o do catálogo'
        using errcode = '42501';
    end if;

    return new;
  end if;

  if new.id is distinct from old.id
    or new.buyer_id is distinct from old.buyer_id
    or new.catalog_id is distinct from old.catalog_id
    or new.supplier_id is distinct from old.supplier_id
    or new.message is distinct from old.message
    or new.created_at is distinct from old.created_at then
    raise exception 'o vínculo da solicitação de orçamento é imutável'
      using errcode = '42501';
  end if;

  if public.is_api_role() and not public.is_approved_admin() then
    raise exception 'somente um administrador aprovado encerra a solicitação'
      using errcode = '42501';
  end if;

  if old.state is distinct from 'aberta' or new.state is distinct from 'encerrada' then
    raise exception 'a solicitação só pode ser encerrada'
      using errcode = '42501';
  end if;

  new.closed_at := pg_catalog.now();
  new.updated_at := pg_catalog.now();
  return new;
end;
$$;

comment on function public.guard_quote_request() is
  'Na API, só comprador com perfil e empresa aprovados abre pedido para catálogo publicado que já pode ver. O fornecedor tem de ser o do catálogo. Administrador aprovado só encerra. Não há exclusão nem troca de dono pela API.';

-- ---------------------------------------------------------------------------
-- Trigger
-- ---------------------------------------------------------------------------

create trigger quote_requests_guard
  before insert or update or delete on public.quote_requests
  for each row execute function public.guard_quote_request();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.quote_requests enable row level security;

create policy quote_requests_select_own_or_admin
  on public.quote_requests
  for select
  to authenticated
  using (
    (select public.is_approved_admin())
    or exists (
      select 1
      from public.buyers b
      where b.id = buyer_id
        and b.profile_id = (select auth.uid())
    )
  );

create policy quote_requests_insert_approved_buyer
  on public.quote_requests
  for insert
  to authenticated
  with check (
    state = 'aberta'
    and closed_at is null
    and exists (
      select 1
      from public.buyers b
      join public.profiles p on p.id = b.profile_id
      where b.id = buyer_id
        and b.profile_id = (select auth.uid())
        and b.status = 'aprovado'
        and p.role = 'comprador'
        and p.status = 'aprovado'
    )
    and (
      (select public.catalog_is_public(catalog_id))
      or (select public.catalog_is_restricted(catalog_id))
    )
    and exists (
      select 1
      from public.catalogs c
      where c.id = quote_requests.catalog_id
        and c.supplier_id = quote_requests.supplier_id
    )
  );

create policy quote_requests_update_admin
  on public.quote_requests
  for update
  to authenticated
  using ((select public.is_approved_admin()))
  with check ((select public.is_approved_admin()));

-- ---------------------------------------------------------------------------
-- Privilégios
-- anon não lê nem grava. authenticated não exclui.
-- service_role não recebe a tabela nem a guarda: ela ignora RLS.
-- ---------------------------------------------------------------------------

revoke all on table public.quote_requests from public, anon, authenticated, service_role;
grant select, insert, update on table public.quote_requests to authenticated;

revoke all on function public.guard_quote_request() from public, anon, authenticated, service_role;
grant execute on function public.guard_quote_request() to authenticated;

notify pgrst, 'reload schema';
