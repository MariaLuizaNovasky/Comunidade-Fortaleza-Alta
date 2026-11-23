-- ============================================================
-- Migracao 05: restringe a execucao das funcoes expostas na API
-- Funcoes de trigger nao precisam de permissao de EXECUTE: o
-- gatilho roda com os privilegios do dono da tabela.
-- ============================================================

-- Exige papel de equipe tambem na rotina de mensalidades atrasadas
create or replace function public.fn_atualizar_mensalidades_atrasadas()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_afetadas integer;
begin
  if not public.fn_e_equipe() then
    raise exception 'Apenas a equipe da associacao pode executar esta rotina.';
  end if;

  update public.mensalidades
     set status = 'atrasada'
   where status = 'pendente'
     and vencimento < current_date;
  get diagnostics v_afetadas = row_count;
  return v_afetadas;
end;
$$;

-- Remove o acesso padrao de todos os papeis
revoke all on function public.fn_touch_atualizado_em()               from public, anon, authenticated;
revoke all on function public.fn_novo_usuario()                      from public, anon, authenticated;
revoke all on function public.fn_definir_prazo_solicitacao()         from public, anon, authenticated;
revoke all on function public.fn_log_status_solicitacao()            from public, anon, authenticated;
revoke all on function public.fn_validar_reserva()                   from public, anon, authenticated;
revoke all on function public.fn_proteger_papel()                    from public, anon, authenticated;
revoke all on function public.fn_papel_atual()                       from public, anon, authenticated;
revoke all on function public.fn_e_equipe()                          from public, anon, authenticated;
revoke all on function public.fn_e_admin()                           from public, anon, authenticated;
revoke all on function public.fn_indicadores_painel()                from public, anon, authenticated;
revoke all on function public.fn_gerar_mensalidades(date)            from public, anon, authenticated;
revoke all on function public.fn_atualizar_mensalidades_atrasadas()  from public, anon, authenticated;

-- Devolve apenas o necessario a usuarios autenticados.
-- fn_papel_atual / fn_e_equipe / fn_e_admin sao avaliadas dentro das
-- politicas de RLS, por isso precisam continuar executaveis.
grant execute on function public.fn_papel_atual()                      to authenticated;
grant execute on function public.fn_e_equipe()                         to authenticated;
grant execute on function public.fn_e_admin()                          to authenticated;
grant execute on function public.fn_indicadores_painel()               to authenticated;
grant execute on function public.fn_gerar_mensalidades(date)           to authenticated;
grant execute on function public.fn_atualizar_mensalidades_atrasadas() to authenticated;
