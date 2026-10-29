-- Luiza Mobiliário de Luxo
-- Empresas parceiras: leitura pública só dos dados comerciais de fornecedores aprovados.
--
-- Execute este arquivo inteiro, uma vez, no SQL Editor do Supabase,
-- depois de supabase/sql/001_initial_schema.sql.
-- Não altera tabelas, políticas nem dados já existentes.
-- Não devolve CNPJ, razão social, e-mail, telefone nem nome de contato.
--
-- Os testes manuais estão em supabase/tests/partner_companies.sql.
-- Eles encerram com ROLLBACK e não fazem parte deste schema.

create or replace function public.partner_companies()
returns table (
  id uuid,
  trade_name text,
  description text,
  logo text,
  segment text
)
language sql
stable
security definer
set search_path = ''
as $$
  select s.id, s.trade_name, s.description, s.logo, s.segment
  from public.suppliers s
  join public.profiles owner_profile on owner_profile.id = s.profile_id
  where s.status = 'aprovado'
    and owner_profile.role = 'fornecedor'
    and owner_profile.status = 'aprovado'
    and exists (
      select 1
      from public.catalogs c
      where c.supplier_id = s.id
        and c.status = 'aprovado'
        and c.published_at is not null
        and c.published_pdf_id is not null
    )
  order by s.trade_name;
$$;

comment on function public.partner_companies() is
  'Fornecedores aprovados com algum catálogo publicado. Só nome comercial, descrição, logo e segmento. Não devolve CNPJ, razão social, e-mail, telefone nem contato. Os catálogos continuam sujeitos à visibilidade de quem consulta.';

revoke all on function public.partner_companies() from public, anon, authenticated, service_role;
grant execute on function public.partner_companies() to anon, authenticated;

notify pgrst, 'reload schema';
