-- ============================================================
-- Migracao 02: funcoes auxiliares, triggers e automacoes
-- ============================================================

-- Atualiza a coluna atualizado_em automaticamente
create or replace function public.fn_touch_atualizado_em()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.atualizado_em := now();
  return new;
end;
$$;

create trigger trg_perfis_touch before update on public.perfis
  for each row execute function public.fn_touch_atualizado_em();
create trigger trg_solicitacoes_touch before update on public.solicitacoes
  for each row execute function public.fn_touch_atualizado_em();
create trigger trg_agendamentos_touch before update on public.agendamentos
  for each row execute function public.fn_touch_atualizado_em();
create trigger trg_reservas_touch before update on public.reservas
  for each row execute function public.fn_touch_atualizado_em();

-- ------------------------------------------------------------
-- Papel do usuario logado (SECURITY DEFINER evita recursao de RLS)
-- ------------------------------------------------------------
create or replace function public.fn_papel_atual()
returns public.papel_usuario
language sql
stable
security definer
set search_path = ''
as $$
  select papel from public.perfis where id = auth.uid();
$$;

create or replace function public.fn_e_equipe()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select papel in ('admin', 'diretoria') from public.perfis where id = auth.uid()),
    false
  );
$$;

create or replace function public.fn_e_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select papel = 'admin' from public.perfis where id = auth.uid()),
    false
  );
$$;

-- ------------------------------------------------------------
-- Cria o perfil automaticamente ao cadastrar um usuario
-- O primeiro usuario do sistema vira admin
-- ------------------------------------------------------------
create or replace function public.fn_novo_usuario()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_total integer;
  v_papel public.papel_usuario;
begin
  select count(*) into v_total from public.perfis;
  if v_total = 0 then
    v_papel := 'admin';
  else
    v_papel := 'morador';
  end if;

  insert into public.perfis (id, nome, email, telefone, cpf, rua, numero, papel)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'nome'), ''), split_part(new.email, '@', 1)),
    new.email,
    nullif(trim(new.raw_user_meta_data ->> 'telefone'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'cpf'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'rua'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'numero'), ''),
    v_papel
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

create trigger trg_auth_novo_usuario
  after insert on auth.users
  for each row execute function public.fn_novo_usuario();

-- ------------------------------------------------------------
-- Define o prazo de atendimento a partir da categoria
-- ------------------------------------------------------------
create or replace function public.fn_definir_prazo_solicitacao()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_prazo integer;
begin
  if new.prazo_atendimento is null and new.categoria_id is not null then
    select prazo_dias into v_prazo
      from public.categorias_servico where id = new.categoria_id;
    if v_prazo is not null then
      new.prazo_atendimento := (new.criado_em::date + v_prazo);
    end if;
  end if;
  return new;
end;
$$;

create trigger trg_solicitacao_prazo
  before insert on public.solicitacoes
  for each row execute function public.fn_definir_prazo_solicitacao();

-- ------------------------------------------------------------
-- Registra automaticamente a mudanca de status na linha do tempo
-- ------------------------------------------------------------
create or replace function public.fn_log_status_solicitacao()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status is distinct from old.status then
    insert into public.solicitacao_interacoes
      (solicitacao_id, autor_id, mensagem, status_anterior, status_novo)
    values (
      new.id,
      auth.uid(),
      'Status alterado de "' || old.status::text || '" para "' || new.status::text || '".',
      old.status,
      new.status
    );

    if new.status = 'concluida' and new.concluida_em is null then
      new.concluida_em := now();
    end if;
  end if;
  return new;
end;
$$;

create trigger trg_solicitacao_log_status
  before update on public.solicitacoes
  for each row execute function public.fn_log_status_solicitacao();

-- ------------------------------------------------------------
-- Impede reservas sobrepostas no mesmo espaco
-- ------------------------------------------------------------
create or replace function public.fn_validar_reserva()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_conflitos integer;
begin
  if new.status = 'cancelada' then
    return new;
  end if;

  select count(*) into v_conflitos
  from public.reservas r
  where r.espaco_id = new.espaco_id
    and r.data = new.data
    and r.status in ('pendente', 'confirmada', 'concluida')
    and r.id is distinct from new.id
    and r.hora_inicio < new.hora_fim
    and r.hora_fim > new.hora_inicio;

  if v_conflitos > 0 then
    raise exception 'Ja existe uma reserva para este espaco no horario informado.';
  end if;

  return new;
end;
$$;

create trigger trg_reserva_validar
  before insert or update on public.reservas
  for each row execute function public.fn_validar_reserva();

-- ------------------------------------------------------------
-- Marca mensalidades vencidas como atrasadas
-- ------------------------------------------------------------
create or replace function public.fn_atualizar_mensalidades_atrasadas()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_afetadas integer;
begin
  update public.mensalidades
     set status = 'atrasada'
   where status = 'pendente'
     and vencimento < current_date;
  get diagnostics v_afetadas = row_count;
  return v_afetadas;
end;
$$;

-- ------------------------------------------------------------
-- Gera as mensalidades de um mes de referencia para todos os ativos
-- ------------------------------------------------------------
create or replace function public.fn_gerar_mensalidades(p_referencia date)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_valor numeric(10,2);
  v_dia integer;
  v_ref date := date_trunc('month', p_referencia)::date;
  v_criadas integer;
begin
  if not public.fn_e_equipe() then
    raise exception 'Apenas a equipe da associacao pode gerar mensalidades.';
  end if;

  select valor_mensalidade, dia_vencimento into v_valor, v_dia
    from public.configuracoes where id;

  insert into public.mensalidades (morador_id, referencia, valor, vencimento)
  select p.id, v_ref, coalesce(v_valor, 30), v_ref + (coalesce(v_dia, 10) - 1)
    from public.perfis p
   where p.ativo and p.papel = 'morador'
  on conflict (morador_id, referencia) do nothing;

  get diagnostics v_criadas = row_count;
  return v_criadas;
end;
$$;

-- ------------------------------------------------------------
-- Indicadores do painel (uma chamada em vez de varias consultas)
-- ------------------------------------------------------------
create or replace function public.fn_indicadores_painel()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_eh_equipe boolean := public.fn_e_equipe();
  v_uid uuid := auth.uid();
  v_res jsonb;
begin
  if v_uid is null then
    return '{}'::jsonb;
  end if;

  if v_eh_equipe then
    select jsonb_build_object(
      'equipe', true,
      'moradores_ativos', (select count(*) from public.perfis where ativo and papel = 'morador'),
      'solicitacoes_abertas', (select count(*) from public.solicitacoes
                                where status in ('aberta','em_analise','em_andamento','aguardando_morador')),
      'solicitacoes_atrasadas', (select count(*) from public.solicitacoes
                                  where status in ('aberta','em_analise','em_andamento')
                                    and prazo_atendimento < current_date),
      'solicitacoes_mes', (select count(*) from public.solicitacoes
                            where criado_em >= date_trunc('month', now())),
      'concluidas_mes', (select count(*) from public.solicitacoes
                          where status = 'concluida' and concluida_em >= date_trunc('month', now())),
      'agendamentos_proximos', (select count(*) from public.agendamentos
                                 where data_hora >= now() and status in ('pendente','confirmado')),
      'reservas_pendentes', (select count(*) from public.reservas where status = 'pendente'),
      'inadimplentes', (select count(distinct morador_id) from public.mensalidades
                         where status in ('pendente','atrasada') and vencimento < current_date),
      'recebido_mes', (select coalesce(sum(valor),0) from public.mensalidades
                        where status = 'paga' and pago_em >= date_trunc('month', now())),
      'a_receber', (select coalesce(sum(valor),0) from public.mensalidades
                     where status in ('pendente','atrasada')),
      'tempo_medio_dias', (select round(coalesce(avg(extract(epoch from (concluida_em - criado_em)) / 86400), 0), 1)
                            from public.solicitacoes where status = 'concluida'),
      'por_status', (select coalesce(jsonb_object_agg(status, total), '{}'::jsonb)
                      from (select status::text as status, count(*) as total
                              from public.solicitacoes group by status) s),
      'por_categoria', (select coalesce(jsonb_agg(jsonb_build_object('nome', nome, 'total', total)
                                                  order by total desc), '[]'::jsonb)
                         from (select coalesce(c.nome, 'Sem categoria') as nome, count(*) as total
                                 from public.solicitacoes s
                                 left join public.categorias_servico c on c.id = s.categoria_id
                                group by 1) t),
      'por_mes', (select coalesce(jsonb_agg(jsonb_build_object('mes', mes, 'total', total) order by mes), '[]'::jsonb)
                   from (select to_char(date_trunc('month', criado_em), 'YYYY-MM') as mes, count(*) as total
                           from public.solicitacoes
                          where criado_em >= date_trunc('month', now()) - interval '5 months'
                         group by 1) m)
    ) into v_res;
  else
    select jsonb_build_object(
      'equipe', false,
      'minhas_solicitacoes', (select count(*) from public.solicitacoes where morador_id = v_uid),
      'minhas_abertas', (select count(*) from public.solicitacoes
                          where morador_id = v_uid
                            and status in ('aberta','em_analise','em_andamento','aguardando_morador')),
      'minhas_concluidas', (select count(*) from public.solicitacoes
                             where morador_id = v_uid and status = 'concluida'),
      'meus_agendamentos', (select count(*) from public.agendamentos
                             where morador_id = v_uid and data_hora >= now()
                               and status in ('pendente','confirmado')),
      'minhas_reservas', (select count(*) from public.reservas
                           where morador_id = v_uid and data >= current_date
                             and status in ('pendente','confirmada')),
      'mensalidades_pendentes', (select count(*) from public.mensalidades
                                  where morador_id = v_uid and status in ('pendente','atrasada')),
      'valor_devido', (select coalesce(sum(valor),0) from public.mensalidades
                        where morador_id = v_uid and status in ('pendente','atrasada'))
    ) into v_res;
  end if;

  return v_res;
end;
$$;
