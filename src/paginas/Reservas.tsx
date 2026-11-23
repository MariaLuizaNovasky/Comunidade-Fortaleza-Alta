import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contextos/AuthContexto'
import { useAviso } from '../contextos/AvisoContexto'
import { useConsulta } from '../lib/hooks'
import { mensagemErro, supabase } from '../lib/supabase'
import { baixarCsv, dataBr, horaBr, moeda } from '../lib/formato'
import { STATUS_RESERVA } from '../lib/constantes'
import type { ReservaComRelacoes, StatusReserva } from '../lib/tipos'
import { Icone } from '../componentes/Icone'
import { Botao, Cartao, Esqueleto, Selecao, Selo, TituloPagina, Vazio } from '../componentes/ui'

export default function Reservas() {
  const { ehEquipe } = useAuth()
  const aviso = useAviso()
  const [filtro, setFiltro] = useState<'proximas' | 'todas' | StatusReserva>('proximas')
  const [salvandoId, setSalvandoId] = useState<string | null>(null)

  const { dados, carregando, recarregar } = useConsulta<ReservaComRelacoes[]>(async () => {
    let consulta = supabase
      .from('reservas')
      .select('*, espaco:espacos(id,nome,valor_locacao,capacidade), morador:perfis(id,nome,telefone)')
      .order('data', { ascending: true })
      .order('hora_inicio', { ascending: true })
      .limit(300)

    const hoje = new Date().toISOString().slice(0, 10)
    if (filtro === 'proximas') {
      consulta = consulta.gte('data', hoje).in('status', ['pendente', 'confirmada'])
    } else if (filtro !== 'todas') {
      consulta = consulta.eq('status', filtro)
    }

    const { data, error } = await consulta
    if (error) throw new Error(mensagemErro(error))
    return (data ?? []) as unknown as ReservaComRelacoes[]
  }, [filtro])

  async function mudarStatus(id: string, status: StatusReserva) {
    setSalvandoId(id)
    try {
      const { error } = await supabase.from('reservas').update({ status }).eq('id', id)
      if (error) throw new Error(mensagemErro(error))
      aviso.sucesso('Reserva atualizada.')
      recarregar()
    } catch (e) {
      aviso.erro(e instanceof Error ? e.message : 'Não foi possível atualizar.')
    } finally {
      setSalvandoId(null)
    }
  }

  const exportar = () =>
    baixarCsv(
      `reservas-${new Date().toISOString().slice(0, 10)}`,
      (dados ?? []).map((r) => ({
        Espaço: r.espaco?.nome ?? '',
        Morador: r.morador?.nome ?? '',
        Data: dataBr(r.data),
        Início: horaBr(r.hora_inicio),
        Término: horaBr(r.hora_fim),
        Finalidade: r.finalidade ?? '',
        Convidados: r.numero_convidados ?? 0,
        Valor: r.valor,
        Situação: STATUS_RESERVA[r.status].texto,
      })),
    )

  return (
    <div>
      <TituloPagina
        titulo="Reservas de espaços"
        descricao={
          ehEquipe
            ? 'Confirme ou recuse as reservas solicitadas pelos moradores.'
            : 'Acompanhe suas reservas dos espaços comunitários.'
        }
        acao={
          <>
            {ehEquipe && (dados ?? []).length > 0 && (
              <Botao variante="secundario" icone="baixar" onClick={exportar}>
                Exportar
              </Botao>
            )}
            <Link to="/espacos">
              <Botao icone="mais">Nova reserva</Botao>
            </Link>
          </>
        }
      />

      <Cartao className="sem-impressao mb-4 p-4">
        <Selecao
          value={filtro}
          onChange={(e) => setFiltro(e.target.value as typeof filtro)}
          aria-label="Filtrar reservas"
          className="sm:max-w-xs"
        >
          <option value="proximas">Próximas reservas</option>
          <option value="todas">Todas</option>
          {(Object.keys(STATUS_RESERVA) as StatusReserva[]).map((s) => (
            <option key={s} value={s}>
              {STATUS_RESERVA[s].texto}
            </option>
          ))}
        </Selecao>
      </Cartao>

      {carregando ? (
        <Cartao>
          <Esqueleto linhas={4} />
        </Cartao>
      ) : (dados ?? []).length === 0 ? (
        <Cartao>
          <Vazio
            icone="calendario"
            titulo="Nenhuma reserva"
            descricao="Reserve um espaço comunitário para vê-lo aqui."
            acao={
              <Link to="/espacos">
                <Botao icone="mais">Ver espaços</Botao>
              </Link>
            }
          />
        </Cartao>
      ) : (
        <Cartao>
          <ul className="divide-y" style={{ borderColor: 'var(--borda)' }}>
            {(dados ?? []).map((r) => (
              <li key={r.id} className="flex flex-wrap items-start gap-4 px-5 py-4">
                <div className="flex w-16 shrink-0 flex-col items-center rounded-xl bg-mata-500/10 py-2">
                  <span className="text-lg font-bold leading-none text-mata-800 dark:text-mata-200">
                    {new Date(`${r.data}T12:00:00`).getDate()}
                  </span>
                  <span className="texto-suave mt-0.5 text-[10px] font-semibold uppercase">
                    {new Date(`${r.data}T12:00:00`)
                      .toLocaleDateString('pt-BR', { month: 'short' })
                      .replace('.', '')}
                  </span>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{r.espaco?.nome ?? 'Espaço removido'}</p>
                    <Selo rotulo={STATUS_RESERVA[r.status]} />
                  </div>
                  <p className="texto-suave mt-1 text-sm">
                    {dataBr(r.data)} · {horaBr(r.hora_inicio)} às {horaBr(r.hora_fim)}
                    {r.valor > 0 ? ` · ${moeda(r.valor)}` : ' · Gratuito'}
                  </p>
                  {r.finalidade && <p className="mt-1 text-sm">{r.finalidade}</p>}
                  <p className="texto-suave mt-1 flex flex-wrap gap-x-4 text-xs">
                    {ehEquipe && r.morador && (
                      <span className="inline-flex items-center gap-1.5">
                        <Icone nome="perfil" className="h-3.5 w-3.5" />
                        {r.morador.nome}
                      </span>
                    )}
                    {ehEquipe && r.morador?.telefone && (
                      <span className="inline-flex items-center gap-1.5">
                        <Icone nome="telefone" className="h-3.5 w-3.5" />
                        {r.morador.telefone}
                      </span>
                    )}
                    {(r.numero_convidados ?? 0) > 0 && (
                      <span className="inline-flex items-center gap-1.5">
                        <Icone nome="pessoas" className="h-3.5 w-3.5" />
                        {r.numero_convidados} convidados
                      </span>
                    )}
                  </p>
                </div>

                <div className="sem-impressao flex shrink-0 flex-wrap gap-2">
                  {ehEquipe && r.status === 'pendente' && (
                    <Botao
                      tamanho="pequeno"
                      icone="check"
                      carregando={salvandoId === r.id}
                      onClick={() => mudarStatus(r.id, 'confirmada')}
                    >
                      Confirmar
                    </Botao>
                  )}
                  {ehEquipe && r.status === 'confirmada' && (
                    <Botao
                      variante="secundario"
                      tamanho="pequeno"
                      icone="check"
                      carregando={salvandoId === r.id}
                      onClick={() => mudarStatus(r.id, 'concluida')}
                    >
                      Concluir
                    </Botao>
                  )}
                  {(r.status === 'pendente' || r.status === 'confirmada') && (
                    <Botao
                      variante="fantasma"
                      tamanho="pequeno"
                      carregando={salvandoId === r.id}
                      onClick={() => mudarStatus(r.id, 'cancelada')}
                    >
                      Cancelar
                    </Botao>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </Cartao>
      )}
    </div>
  )
}
