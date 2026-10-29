-- Luiza Mobiliário de Luxo
-- Fichas cadastrais comerciais, separadas das contas de comprador e fornecedor.
--
-- Execute este arquivo inteiro, uma vez, no SQL Editor do Supabase,
-- depois de supabase/sql/001_initial_schema.sql.
-- Não altera tabelas, funções, políticas nem dados já existentes.
-- Não cria usuário e não usa service_role para gravar ou ler a tabela.
--
-- Os testes manuais estão em supabase/tests/registration_form_permissions.sql.
-- Eles encerram com ROLLBACK e não fazem parte deste schema.

-- ---------------------------------------------------------------------------
-- Tipos
-- ---------------------------------------------------------------------------

create type public.registration_party as enum (
  'comprador',
  'fornecedor'
);

create or replace function public.is_valid_cpf(value text)
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
begin
  if digits is null or char_length(digits) <> 11 then
    return false;
  end if;

  if digits ~ '^([0-9])\1{10}$' then
    return false;
  end if;

  for i in 1..9 loop
    sum1 := sum1 + (substr(digits, i, 1))::integer * (11 - i);
  end loop;

  digit1 := sum1 % 11;
  digit1 := case when digit1 < 2 then 0 else 11 - digit1 end;

  if digit1 <> (substr(digits, 10, 1))::integer then
    return false;
  end if;

  for i in 1..10 loop
    sum2 := sum2 + (substr(digits, i, 1))::integer * (12 - i);
  end loop;

  digit2 := sum2 % 11;
  digit2 := case when digit2 < 2 then 0 else 11 - digit2 end;

  return digit2 = (substr(digits, 11, 1))::integer;
end;
$$;

comment on function public.is_valid_cpf(text) is
  'CPF com 11 dígitos e verificadores. Não lê tabelas e não eleva privilégio.';

-- ---------------------------------------------------------------------------
-- Tabela
-- ---------------------------------------------------------------------------

create table public.registration_forms (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  party public.registration_party not null,
  legal_name text not null,
  tax_id text not null,
  address text not null,
  phone text not null,
  email text not null,
  responsible_name text not null,
  segment text not null,
  created_at timestamptz not null default pg_catalog.now(),
  updated_at timestamptz not null default pg_catalog.now(),
  constraint registration_forms_legal_name_length check (char_length(btrim(legal_name)) between 2 and 200),
  constraint registration_forms_tax_id_valid check (
    public.is_valid_cnpj(tax_id) or public.is_valid_cpf(tax_id)
  ),
  constraint registration_forms_address_length check (char_length(btrim(address)) between 8 and 300),
  constraint registration_forms_phone_valid check (public.is_valid_phone(phone)),
  constraint registration_forms_email_valid check (public.is_valid_email(email)),
  constraint registration_forms_responsible_length check (char_length(btrim(responsible_name)) between 2 and 160),
  constraint registration_forms_segment_length check (char_length(btrim(segment)) between 2 and 80)
);

comment on table public.registration_forms is
  'Ficha cadastral comercial de um comprador ou fornecedor autenticado. Não substitui a conta em buyers ou suppliers e não guarda senha.';

comment on column public.registration_forms.profile_id is
  'Usuário que criou a ficha. Na API, precisa ser a sessão.';

comment on column public.registration_forms.party is
  'comprador ou fornecedor. Tem de ser o papel do perfil e não muda depois.';

comment on column public.registration_forms.legal_name is
  'Nome ou razão social informados na ficha.';

comment on column public.registration_forms.tax_id is
  'CNPJ de 14 dígitos ou CPF de 11, só números, quando um dos dois se aplica.';

comment on column public.registration_forms.email is
  'E-mail da ficha. Pode ser diferente do e-mail de login.';

create index registration_forms_profile_created_idx
  on public.registration_forms (profile_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Guarda
-- ---------------------------------------------------------------------------

create or replace function public.guard_registration_form()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  owner_role text;
  owner_ok boolean;
begin
  if tg_op = 'DELETE' then
    if public.is_api_role()
      and (
        old.profile_id is distinct from auth.uid()
        or not public.current_account_can_write()
      ) then
      raise exception 'somente o autor com conta ativa exclui a própria ficha'
        using errcode = '42501';
    end if;

    return old;
  end if;

  new.legal_name := btrim(new.legal_name);
  new.tax_id := public.digits_only(new.tax_id);
  new.address := btrim(new.address);
  new.phone := public.digits_only(new.phone);
  new.email := lower(btrim(new.email));
  new.responsible_name := btrim(new.responsible_name);
  new.segment := btrim(new.segment);
  new.updated_at := pg_catalog.now();

  if tg_op = 'INSERT' then
    select p.role::text into owner_role
    from public.profiles p
    where p.id = new.profile_id;

    owner_ok := owner_role in ('comprador', 'fornecedor')
      and owner_role is not distinct from new.party::text;

    if not coalesce(owner_ok, false) then
      raise exception 'a ficha precisa ser de um comprador ou fornecedor'
        using errcode = '42501';
    end if;

    if public.is_api_role()
      and (
        new.profile_id is distinct from auth.uid()
        or not public.current_account_can_write()
      ) then
      raise exception 'a ficha fica vinculada a quem a cria, com conta ativa'
        using errcode = '42501';
    end if;

    return new;
  end if;

  if new.id is distinct from old.id
    or new.profile_id is distinct from old.profile_id
    or new.party is distinct from old.party
    or new.created_at is distinct from old.created_at then
    raise exception 'o vínculo da ficha cadastral é imutável'
      using errcode = '42501';
  end if;

  if public.is_api_role()
    and (
      old.profile_id is distinct from auth.uid()
      or not public.current_account_can_write()
    ) then
    raise exception 'somente o autor com conta ativa altera a própria ficha'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

comment on function public.guard_registration_form() is
  'Na API, comprador ou fornecedor com conta pendente ou aprovada grava só a própria ficha, no próprio papel. Administrador aprovado consulta todas e não grava no lugar de outro. Conta suspensa ou rejeitada não altera nem exclui. Não há exclusão cruzada.';

-- ---------------------------------------------------------------------------
-- Trigger
-- ---------------------------------------------------------------------------

create trigger registration_forms_guard
  before insert or update or delete on public.registration_forms
  for each row execute function public.guard_registration_form();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.registration_forms enable row level security;

create policy registration_forms_select_own_or_admin
  on public.registration_forms
  for select
  to authenticated
  using (
    profile_id = (select auth.uid())
    or (select public.is_approved_admin())
  );

create policy registration_forms_insert_own
  on public.registration_forms
  for insert
  to authenticated
  with check (
    profile_id = (select auth.uid())
    and (select public.current_account_can_write())
    and exists (
      select 1
      from public.profiles p
      where p.id = profile_id
        and p.role::text = party::text
        and p.role in ('comprador', 'fornecedor')
    )
  );

create policy registration_forms_update_own
  on public.registration_forms
  for update
  to authenticated
  using (
    profile_id = (select auth.uid())
    and (select public.current_account_can_write())
  )
  with check (
    profile_id = (select auth.uid())
    and (select public.current_account_can_write())
  );

create policy registration_forms_delete_own
  on public.registration_forms
  for delete
  to authenticated
  using (
    profile_id = (select auth.uid())
    and (select public.current_account_can_write())
  );

-- ---------------------------------------------------------------------------
-- Privilégios
-- anon não lê nem grava. service_role não recebe a tabela nem a guarda:
-- ela ignora RLS. Estes REVOKE valem só para os objetos novos.
-- ---------------------------------------------------------------------------

revoke all on table public.registration_forms from public, anon, authenticated, service_role;
grant select, insert, update, delete on table public.registration_forms to authenticated;

revoke all on function public.guard_registration_form() from public, anon, authenticated, service_role;
grant execute on function public.guard_registration_form() to authenticated;

revoke all on function public.is_valid_cpf(text) from public, anon, authenticated, service_role;
grant execute on function public.is_valid_cpf(text) to anon, authenticated;

notify pgrst, 'reload schema';
