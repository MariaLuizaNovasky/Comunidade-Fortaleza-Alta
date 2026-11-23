import { Link } from 'react-router-dom'
import { useAuth } from '../contextos/AuthContexto'
import { useConsulta } from '../lib/hooks'
import { supabase } from '../lib/supabase'
import { dataBr, moeda, tempoRelativo } from '../lib/formato'
import { STATUS_SOLICITACAO, PRIORIDADES } from '../lib/constantes'
import type { ComunicadoComAutor, Indicadores, SolicitacaoComRelacoes } from '../lib/tipos'
import { BarraPorSituacao, BarrasPorCategoria, BarrasPorMes } from '../componentes/Graficos'
import { ConviteInstalacao } from '../componentes/InstalarPwa'
import { Icone } from '../componentes/Icone'
import { Botao, Cartao, Carregando, Indicador, Selo, Vazio } from '../componentes/ui'

export default function Painel() {
  const { perfil, ehEquipe } = useAuth()

  const { dados: indicadores, carregando } = useConsulta<Indicadores>(async () => {
    const { data, error } = await supabase.rpc('fn_indicadores_painel')
    if (error) throw new Error(error.message)
    return data as unknown as Indicadores
  }, [perfil?.id])

  const { dados: recentes } = useConsulta<SolicitacaoComRelacoes[]>(async () => {
    const { data, error } = await supabase
      .from('solicitacoes')
      .select(
        '*, categoria:categorias_servico(id,nome,cor), morador:perfis!solicitacoes_morador_id_fkey(id,nome,telefone,rua,numero), responsavel:perfis!solicitacoes_responsavel_id_fkey(id,nome)',
      )
      .order('criado_em', { ascending: false })
      .limit(5)
    if (error) throw new Error(error.message)
    return (data ?? []) as unknown as SolicitacaoComRelacoes[]
  }, [perfil?.id])

  const { dados: comunicados } = useConsulta<ComunicadoComAutor[]>(async () => {
    const { data, error } = await supabase
      .from('comunicados')
      .select('*, autor:perfis(id,nome)')
      .eq('publicado', true)
      .order('fixado', { ascending: false })
      .order('publicado_em', { ascending: false })
      .limit(3)
    if (error) throw new Error(error.message)
    return (data ?? []) as unknown as ComunicadoComAutor[]
  }, [])

  const primeiroNome = perfil?.nome?.split(' ')[0] ?? ''
  const hora = new Date().getHours()
  const saudacao = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite'

  return (
    <div>
      <ConviteInstalacao />

      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight sm:text-[28px]">
          {primeiroNome ? `${saudacao}, ${primeiroNome}!` : `${saudacao}!`}
        </h1>
        <p className="texto-suave mt-1 text-[15px]">
          {ehEquipe
            ? 'Acompanhe os atendimentos e a rotina da associação.'
            : 'Acompanhe seus pedidos e as novidades do bairro.'}
        </p>
      </div>

      {carregando && !indicadores ? (
        <Carregando />
      ) : indicadores?.equipe ? (
        <>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            <Indicador
              rotulo="Em aberto"
              valor={indicadores.solicitacoes_abertas}
              icone="chamado"
              detalhe={`${indicadores.solicitacoes_mes} abertos neste mês`}
            />
            <Indicador
              rotulo="Fora do prazo"
              valor={indicadores.solicitacoes_atrasadas}
              icone="alerta"
              destaque={indicadores.solicitacoes_atrasadas > 0}
              detalhe="Prazo de atendimento vencido"
            />
            <Indicador
              rotulo="Moradores ativos"
              valor={indicadores.moradores_ativos}
              icone="moradores"
              detalhe={`${indicadores.inadimplentes} em atraso`}
            />
            <Indicador
              rotulo="Recebido no mês"
              valor={moeda(indicadores.recebido_mes)}
              icone="dinheiro"
              detalhe={`${moeda(indicadores.a_receber)} a receber`}
            />
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            <Indicador
              rotulo="Concluídos no mês"
              valor={indicadores.concluidas_mes}
              icone="check"
              detalhe={`Tempo médio: ${indicadores.tempo_medio_dias} dias`}
            />
            <Indicador
              rotulo="Agendamentos"
              valor={indicadores.agendamentos_proximos}
              icone="agenda"
              detalhe="Próximos atendimentos"
            />
            <Indicador
              rotulo="Reservas pendentes"
              valor={indicadores.reservas_pendentes}
              icone="calendario"
              detalhe="Aguardando confirmação"
            />
            <Indicador
              rotulo="Inadimplentes"
              valor={indicadores.inadimplentes}
              icone="financeiro"
              destaque={indicadores.inadimplentes > 0}
              detalhe="Mensalidades vencidas"
            />
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            <Cartao className="p-5 lg:col-span-2">
              <h2 className="mb-1 font-semibold">Atendimentos por mês</h2>
              <p className="texto-suave mb-5 text-sm">Últimos seis meses</p>
              <BarrasPorMes dados={indicadores.por_mes} />
            </Cartao>

            <Cartao className="p-5">
              <h2 className="mb-1 font-semibold">Situação dos atendimentos</h2>
              <p className="texto-suave mb-5 text-sm">Todos os registros</p>
              <BarraPorSituacao dados={indicadores.por_status} />
            </Cartao>
          </div>

          <Cartao className="mt-4 p-5">
            <h2 className="mb-1 font-semibold">Atendimentos por categoria</h2>
            <p className="texto-suave mb-5 text-sm">Demandas mais frequentes do bairro</p>
            <BarrasPorCategoria dados={indicadores.por_categoria} />
          </Cartao>
        </>
      ) : indicadores ? (
        <>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            <Indicador
              rotulo="Em andamento"
              valor={indicadores.minhas_abertas}
              icone="chamado"
              detalhe={`${indicadores.minhas_solicitacoes} no total`}
            />
            <Indicador
              rotulo="Concluídos"
              valor={indicadores.minhas_concluidas}
              icone="check"
              detalhe="Pedidos já atendidos"
            />
            <Indicador
              rotulo="Agendamentos"
              valor={indicadores.meus_agendamentos}
              icone="agenda"
              detalhe={`${indicadores.minhas_reservas} reservas ativas`}
            />
            <Indicador
              rotulo="Mensalidades"
              valor={indicadores.mensalidades_pendentes}
              icone="financeiro"
              destaque={indicadores.mensalidades_pendentes > 0}
              detalhe={
                indicadores.valor_devido > 0 ? `${moeda(indicadores.valor_devido)} em aberto` : 'Tudo em dia'
              }
            />
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <Link to="/solicitacoes/nova" className="group">
              <Cartao className="flex h-full items-center gap-4 p-5 transition group-hover:border-mata-400">
                <span className="rounded-xl bg-mata-700 p-3 text-white">
                  <Icone nome="mais" />
                </span>
                <span>
                  <span className="block font-semibold">Abrir atendimento</span>
                  <span className="texto-suave block text-sm">Registre uma demanda do bairro</span>
                </span>
              </Cartao>
            </Link>
            <Link to="/servicos" className="group">
              <Cartao className="flex h-full items-center gap-4 p-5 transition group-hover:border-mata-400">
                <span className="rounded-xl bg-mata-500/10 p-3 text-mata-700 dark:text-mata-300">
                  <Icone nome="servico" />
                </span>
                <span>
                  <span className="block font-semibold">Agendar serviço</span>
                  <span className="texto-suave block text-sm">Declarações, vistorias e mais</span>
                </span>
              </Cartao>
            </Link>
            <Link to="/espacos" className="group">
              <Cartao className="flex h-full items-center gap-4 p-5 transition group-hover:border-mata-400">
                <span className="rounded-xl bg-mata-500/10 p-3 text-mata-700 dark:text-mata-300">
                  <Icone nome="espaco" />
                </span>
                <span>
                  <span className="block font-semibold">Reservar espaço</span>
                  <span className="texto-suave block text-sm">Salão, quadra e sala de reuniões</span>
                </span>
              </Cartao>
            </Link>
          </div>
        </>
      ) : null}

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <Cartao>
          <div className="flex items-center justify-between gap-3 border-b px-5 py-4" style={{ borderColor: 'var(--borda)' }}>
            <h2 className="font-semibold">
              {ehEquipe ? 'Últimos atendimentos' : 'Meus últimos pedidos'}
            </h2>
            <Link
              to="/solicitacoes"
              className="text-sm font-semibold text-mata-700 hover:underline dark:text-mata-300"
            >
              Ver todos
            </Link>
          </div>

          {recentes === null ? (
            <Carregando texto="Buscando atendimentos…" />
          ) : recentes.length === 0 ? (
            <Vazio
              icone="chamado"
              titulo="Nenhum atendimento ainda"
              descricao="Quando um pedido for registrado, ele aparece aqui."
              acao={
                <Link to="/solicitacoes/nova">
                  <Botao icone="mais">Abrir atendimento</Botao>
                </Link>
              }
            />
          ) : (
            <ul className="divide-y" style={{ borderColor: 'var(--borda)' }}>
              {recentes.map((s) => (
                <li key={s.id}>
                  <Link
                    to={`/solicitacoes/${s.id}`}
                    className="flex items-start gap-3 px-5 py-3.5 transition hover:bg-mata-500/5"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="truncate font-semibold">{s.titulo}</span>
                        <Selo rotulo={STATUS_SOLICITACAO[s.status]} />
                      </span>
                      <span className="texto-suave mt-1 block truncate text-sm">
                        {s.protocolo}
                        {ehEquipe && s.morador ? ` · ${s.morador.nome}` : ''}
                        {' · '}
                        {tempoRelativo(s.criado_em)}
                      </span>
                    </span>
                    {s.prioridade !== 'media' && (
                      <Selo rotulo={PRIORIDADES[s.prioridade]} className="mt-0.5 shrink-0" />
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Cartao>

        <Cartao>
          <div className="flex items-center justify-between gap-3 border-b px-5 py-4" style={{ borderColor: 'var(--borda)' }}>
            <h2 className="font-semibold">Comunicados da diretoria</h2>
            <Link
              to="/comunicados"
              className="text-sm font-semibold text-mata-700 hover:underline dark:text-mata-300"
            >
              Ver todos
            </Link>
          </div>

          {comunicados === null ? (
            <Carregando texto="Buscando comunicados…" />
          ) : comunicados.length === 0 ? (
            <Vazio icone="comunicado" titulo="Nenhum comunicado publicado" />
          ) : (
            <ul className="divide-y" style={{ borderColor: 'var(--borda)' }}>
              {comunicados.map((c) => (
                <li key={c.id} className="px-5 py-3.5">
                  <div className="flex items-start gap-2">
                    {c.fixado && (
                      <Icone
                        nome="fixado"
                        className="mt-0.5 h-4 w-4 shrink-0 text-terra-500"
                      />
                    )}
                    <div className="min-w-0">
                      <p className="font-semibold">{c.titulo}</p>
                      <p className="texto-suave mt-1 line-clamp-2 text-sm">{c.conteudo}</p>
                      <p className="texto-suave mt-1.5 text-xs">
                        {dataBr(c.publicado_em)}
                        {c.autor ? ` · ${c.autor.nome}` : ''}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Cartao>
      </div>
    </div>
  )
}
