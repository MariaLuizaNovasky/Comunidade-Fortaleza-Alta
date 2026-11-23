-- ============================================================
-- Migracao 06: historico de status com nomes legiveis
-- ============================================================

create or replace function public.fn_rotulo_status(p public.status_solicitacao)
returns text
language sql
immutable
set search_path = ''
as $$
  select case p
    when 'aberta' then 'Aberta'
    when 'em_analise' then 'Em análise'
    when 'em_andamento' then 'Em andamento'
    when 'aguardando_morador' then 'Aguardando morador'
    when 'concluida' then 'Concluída'
    when 'cancelada' then 'Cancelada'
  end;
$$;

revoke all on function public.fn_rotulo_status(public.status_solicitacao) from public, anon;
grant execute on function public.fn_rotulo_status(public.status_solicitacao) to authenticated;

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
      'Situação alterada de "' || public.fn_rotulo_status(old.status)
        || '" para "' || public.fn_rotulo_status(new.status) || '".',
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

revoke all on function public.fn_log_status_solicitacao() from public, anon, authenticated;
