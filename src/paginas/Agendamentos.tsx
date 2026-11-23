import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contextos/AuthContexto'
import { useAviso } from '../contextos/AvisoContexto'
import { useConsulta } from '../lib/hooks'
import { mensagemErro, supabase } from '../lib/supabase'
import { dataHoraBr, moeda, tempoRelativo } from '../lib/formato'
import { STATUS_AGENDAMENTO } from '../lib/constantes'
import type { AgendamentoComRelacoes, StatusAgendamento } from '../lib/tipos'
import { Icone } from '../componentes/Icone'
import { Botao, Cartao, Esqueleto, Selecao, Selo, TituloPagina, Vazio } from '../componentes/ui'

export default function Agendamentos() {
  const { ehEquipe } = useAuth()
  const aviso = useAviso()
  const [filtro, setFiltro] = useState<'proximos' | 'todos' | StatusAgendamento>('proximos')
  const [salvandoId, setSalvandoId] = useState<string | null>(null)

  const { dados, carregando, recarregar } = useConsulta<AgendamentoComRelacoes[]>(async () => {
    let consulta = supabase
      .from('agendamentos')
      .select(
        '*, servico:servicos(id,nome,valor,duracao_minutos), morador:perfis(id,nome,telefone)',
      )
      .order('data_hora', { ascending: true })
      .limit(300)

    if (filtro === 'proximos') {
      consulta = consulta
        .gte('data_hora', new Date().toISOString())
        .in('status', ['pendente', 'confirmado'])
    } else if (filtro !== 'todos') {
      consulta = consulta.eq('status', filtro)
    }

    const { data, error } = await consulta
    if (error) throw new Error(mensagemErro(error))
    return (data ?? []) as unknown as AgendamentoComRelacoes[]
  }, [filtro])

  const agrupados = useMemo(() => {
    const mapa = new Map<string, AgendamentoComRelacoes[]>()
    for (const a of dados ?? []) {
      const chave = new Date(a.data_hora).toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
      })
      mapa.set(chave, [...(mapa.get(chave) ?? []), a])
    }
    return [...mapa.entries()]
  }, [dados])

  async function mudarStatus(id: string, status: StatusAgendamento) {
    setSalvandoId(id)
    try {
      const { error } = await supabase.from('agendamentos').update({ status }).eq('id', id)
      if (error) throw new Error(mensagemErro(error))
      aviso.sucesso('Agendamento atualizado.')
      recarregar()
    } catch (e) {
      aviso.erro(e instanceof Error ? e.message : 'Não foi possível atualizar.')
    } finally {
      setSalvandoId(null)
    }
  }

  return (
    <div>
      <TituloPagina
        titulo="Agendamentos"
        descricao={
          ehEquipe
            ? 'Atendimentos agendados pelos moradores. Confirme ou cancele conforme a agenda da sede.'
            : 'Seus atendimentos agendados na associação.'
        }
        acao={
          <Link to="/servicos">
            <Botao icone="mais">Agendar serviço</Botao>
          </Link>
        }
      />

      <Cartao className="sem-impressao mb-4 p-4">
        <Selecao
          value={filtro}
          onChange={(e) => setFiltro(e.target.value as typeof filtro)}
          aria-label="Filtrar agendamentos"
          className="sm:max-w-xs"
        >
          <option value="proximos">Próximos agendamentos</option>
          <option value="todos">Todos</option>
          {(Object.keys(STATUS_AGENDAMENTO) as StatusAgendamento[]).map((s) => (
            <option key={s} value={s}>
              {STATUS_AGENDAMENTO[s].texto}
            </option>
          ))}
        </Selecao>
      </Cartao>

      {carregando ? (
        <Cartao>
          <Esqueleto linhas={4} />
        </Cartao>
      ) : agrupados.length === 0 ? (
        <Cartao>
          <Vazio
            icone="agenda"
            titulo="Nenhum agendamento"
            descricao="Agende um serviço da associação para vê-lo aqui."
            acao={
              <Link to="/servicos">
                <Botao icone="mais">Ver serviços</Botao>
              </Link>
            }
          />
        </Cartao>
      ) : (
        <div className="space-y-5">
          {agrupados.map(([dia, itens]) => (
            <div key={dia}>
              <h2 className="texto-suave mb-2 px-1 text-sm font-semibold uppercase tracking-wide">
                {dia}
              </h2>
              <Cartao>
                <ul className="divide-y" style={{ borderColor: 'var(--borda)' }}>
                  {itens.map((a) => (
                    <li key={a.id} className="flex flex-wrap items-start gap-4 px-5 py-4">
                      <div className="flex w-16 shrink-0 flex-col items-center rounded-xl bg-mata-500/10 py-2">
                        <span className="text-lg font-bold text-mata-800 dark:text-mata-200">
                          {new Date(a.data_hora).toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        <span className="texto-suave text-[10px] font-semibold uppercase">
                          {a.servico?.duracao_minutos ?? 60} min
                        </span>
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold">{a.servico?.nome ?? 'Serviço removido'}</p>
                          <Selo rotulo={STATUS_AGENDAMENTO[a.status]} />
                        </div>
                        <p className="texto-suave mt-1 text-sm">
                          {ehEquipe && a.morador ? `${a.morador.nome} · ` : ''}
                          {dataHoraBr(a.data_hora)} ({tempoRelativo(a.data_hora)})
                        </p>
                        {a.servico && a.servico.valor > 0 && (
                          <p className="texto-suave mt-0.5 text-sm">
                            Valor: {moeda(a.servico.valor)}
                          </p>
                        )}
                        {a.observacoes && (
                          <p className="mt-2 rounded-lg bg-mata-500/5 px-3 py-2 text-sm">
                            {a.observacoes}
                          </p>
                        )}
                        {ehEquipe && a.morador?.telefone && (
                          <p className="texto-suave mt-1.5 inline-flex items-center gap-1.5 text-sm">
                            <Icone nome="telefone" className="h-3.5 w-3.5" />
                            {a.morador.telefone}
                          </p>
                        )}
                      </div>

                      <div className="sem-impressao flex shrink-0 flex-wrap gap-2">
                        {ehEquipe && a.status === 'pendente' && (
                          <Botao
                            tamanho="pequeno"
                            icone="check"
                            carregando={salvandoId === a.id}
                            onClick={() => mudarStatus(a.id, 'confirmado')}
                          >
                            Confirmar
                          </Botao>
                        )}
                        {ehEquipe && a.status === 'confirmado' && (
                          <Botao
                            variante="secundario"
                            tamanho="pequeno"
                            icone="check"
                            carregando={salvandoId === a.id}
                            onClick={() => mudarStatus(a.id, 'realizado')}
                          >
                            Marcar realizado
                          </Botao>
                        )}
                        {(a.status === 'pendente' || a.status === 'confirmado') && (
                          <Botao
                            variante="fantasma"
                            tamanho="pequeno"
                            carregando={salvandoId === a.id}
                            onClick={() => mudarStatus(a.id, 'cancelado')}
                          >
                            Cancelar
                          </Botao>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </Cartao>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
