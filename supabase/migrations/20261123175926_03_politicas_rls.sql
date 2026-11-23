-- ============================================================
-- Migracao 03: Row Level Security
-- ============================================================

alter table public.perfis                enable row level security;
alter table public.categorias_servico    enable row level security;
alter table public.solicitacoes          enable row level security;
alter table public.solicitacao_interacoes enable row level security;
alter table public.servicos              enable row level security;
alter table public.agendamentos          enable row level security;
alter table public.espacos               enable row level security;
alter table public.reservas              enable row level security;
alter table public.mensalidades          enable row level security;
alter table public.comunicados           enable row level security;
alter table public.configuracoes         enable row level security;

-- ------------------------------------------------------------
-- Impede que um morador promova a si mesmo
-- ------------------------------------------------------------
create or replace function public.fn_proteger_papel()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.fn_e_admin() then
    if new.papel is distinct from old.papel then
      raise exception 'Somente um administrador pode alterar o papel de um usuario.';
    end if;
    if new.ativo is distinct from old.ativo then
      raise exception 'Somente um administrador pode ativar ou desativar um cadastro.';
    end if;
  end if;
  return new;
end;
$$;

create trigger trg_perfis_proteger_papel
  before update on public.perfis
  for each row execute function public.fn_proteger_papel();

-- ------------------------------------------------------------
-- PERFIS
-- ------------------------------------------------------------
create policy "perfis_select" on public.perfis
  for select to authenticated
  using (id = auth.uid() or public.fn_e_equipe());

create policy "perfis_insert_proprio" on public.perfis
  for insert to authenticated
  with check (id = auth.uid() or public.fn_e_admin());

create policy "perfis_update" on public.perfis
  for update to authenticated
  using (id = auth.uid() or public.fn_e_admin())
  with check (id = auth.uid() or public.fn_e_admin());

create policy "perfis_delete_admin" on public.perfis
  for delete to authenticated
  using (public.fn_e_admin());

-- ------------------------------------------------------------
-- CATEGORIAS / SERVICOS / ESPACOS  (leitura livre, escrita da equipe)
-- ------------------------------------------------------------
create policy "categorias_select" on public.categorias_servico
  for select to authenticated using (true);
create policy "categorias_write" on public.categorias_servico
  for all to authenticated using (public.fn_e_equipe()) with check (public.fn_e_equipe());

create policy "servicos_select" on public.servicos
  for select to authenticated using (true);
create policy "servicos_write" on public.servicos
  for all to authenticated using (public.fn_e_equipe()) with check (public.fn_e_equipe());

create policy "espacos_select" on public.espacos
  for select to authenticated using (true);
create policy "espacos_write" on public.espacos
  for all to authenticated using (public.fn_e_equipe()) with check (public.fn_e_equipe());

-- ------------------------------------------------------------
-- SOLICITACOES
-- ------------------------------------------------------------
create policy "solicitacoes_select" on public.solicitacoes
  for select to authenticated
  using (morador_id = auth.uid() or responsavel_id = auth.uid() or public.fn_e_equipe());

create policy "solicitacoes_insert" on public.solicitacoes
  for insert to authenticated
  with check (morador_id = auth.uid() or public.fn_e_equipe());

create policy "solicitacoes_update" on public.solicitacoes
  for update to authenticated
  using (morador_id = auth.uid() or public.fn_e_equipe())
  with check (morador_id = auth.uid() or public.fn_e_equipe());

create policy "solicitacoes_delete" on public.solicitacoes
  for delete to authenticated
  using (public.fn_e_equipe());

-- ------------------------------------------------------------
-- INTERACOES
-- ------------------------------------------------------------
create policy "interacoes_select" on public.solicitacao_interacoes
  for select to authenticated
  using (
    (not interna or public.fn_e_equipe())
    and exists (
      select 1 from public.solicitacoes s
       where s.id = solicitacao_id
         and (s.morador_id = auth.uid() or s.responsavel_id = auth.uid() or public.fn_e_equipe())
    )
  );

create policy "interacoes_insert" on public.solicitacao_interacoes
  for insert to authenticated
  with check (
    (autor_id = auth.uid() or autor_id is null)
    and (not interna or public.fn_e_equipe())
    and exists (
      select 1 from public.solicitacoes s
       where s.id = solicitacao_id
         and (s.morador_id = auth.uid() or public.fn_e_equipe())
    )
  );

create policy "interacoes_delete" on public.solicitacao_interacoes
  for delete to authenticated using (public.fn_e_equipe());

-- ------------------------------------------------------------
-- AGENDAMENTOS
-- ------------------------------------------------------------
create policy "agendamentos_select" on public.agendamentos
  for select to authenticated
  using (morador_id = auth.uid() or public.fn_e_equipe());

create policy "agendamentos_insert" on public.agendamentos
  for insert to authenticated
  with check (morador_id = auth.uid() or public.fn_e_equipe());

create policy "agendamentos_update" on public.agendamentos
  for update to authenticated
  using (morador_id = auth.uid() or public.fn_e_equipe())
  with check (morador_id = auth.uid() or public.fn_e_equipe());

create policy "agendamentos_delete" on public.agendamentos
  for delete to authenticated
  using (morador_id = auth.uid() or public.fn_e_equipe());

-- ------------------------------------------------------------
-- RESERVAS
-- ------------------------------------------------------------
create policy "reservas_select" on public.reservas
  for select to authenticated
  using (morador_id = auth.uid() or public.fn_e_equipe());

create policy "reservas_insert" on public.reservas
  for insert to authenticated
  with check (morador_id = auth.uid() or public.fn_e_equipe());

create policy "reservas_update" on public.reservas
  for update to authenticated
  using (morador_id = auth.uid() or public.fn_e_equipe())
  with check (morador_id = auth.uid() or public.fn_e_equipe());

create policy "reservas_delete" on public.reservas
  for delete to authenticated
  using (morador_id = auth.uid() or public.fn_e_equipe());

-- ------------------------------------------------------------
-- MENSALIDADES  (morador apenas consulta)
-- ------------------------------------------------------------
create policy "mensalidades_select" on public.mensalidades
  for select to authenticated
  using (morador_id = auth.uid() or public.fn_e_equipe());

create policy "mensalidades_write" on public.mensalidades
  for all to authenticated
  using (public.fn_e_equipe()) with check (public.fn_e_equipe());

-- ------------------------------------------------------------
-- COMUNICADOS
-- ------------------------------------------------------------
create policy "comunicados_select" on public.comunicados
  for select to authenticated
  using (publicado or public.fn_e_equipe());

create policy "comunicados_write" on public.comunicados
  for all to authenticated
  using (public.fn_e_equipe()) with check (public.fn_e_equipe());

-- ------------------------------------------------------------
-- CONFIGURACOES
-- ------------------------------------------------------------
create policy "configuracoes_select" on public.configuracoes
  for select to authenticated using (true);
create policy "configuracoes_write" on public.configuracoes
  for all to authenticated using (public.fn_e_admin()) with check (public.fn_e_admin());
