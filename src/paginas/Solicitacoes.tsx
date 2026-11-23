import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contextos/AuthContexto'
import { useAtraso, useConsulta } from '../lib/hooks'
import { supabase } from '../lib/supabase'
import { baixarCsv, dataBr, diasAte, semAcento, tempoRelativo } from '../lib/formato'
import { PRIORIDADES, STATUS_ABERTOS, STATUS_SOLICITACAO } from '../lib/constantes'
import type { CategoriaServico, SolicitacaoComRelacoes, StatusSolicitacao } from '../lib/tipos'
import { Icone } from '../componentes/Icone'
import {
  Botao,
  Campo,
  Cartao,
  Esqueleto,
  Paginacao,
  Selecao,
  Selo,
  TituloPagina,
  Vazio,
} from '../componentes/ui'

const POR_PAGINA = 12

export default function Solicitacoes() {
  const { ehEquipe } = useAuth()
  const [busca, setBusca] = useState('')
  const [status, setStatus] = useState<'todos' | 'abertos' | StatusSolicitacao>('todos')
  const [categoria, setCategoria] = useState('todas')
  const [prioridade, setPrioridade] = useState('todas')
  const [pagina, setPagina] = useState(1)
  const buscaAdiada = useAtraso(busca)

  const { dados: categorias } = useConsulta<CategoriaServico[]>(async () => {
    const { data, error } = await supabase
      .from('categorias_servico')
      .select('*')
      .order('nome')
    if (error) throw new Error(error.message)
    return (data ?? []) as CategoriaServico[]
  }, [])

  const { dados: solicitacoes, carregando, recarregar } = useConsulta<SolicitacaoComRelacoes[]>(
    async () => {
      let consulta = supabase
        .from('solicitacoes')
        .select(
          '*, categoria:categorias_servico(id,nome,cor), morador:perfis!solicitacoes_morador_id_fkey(id,nome,telefone,rua,numero), responsavel:perfis!solicitacoes_responsavel_id_fkey(id,nome)',
        )
        .order('criado_em', { ascending: false })
        .limit(500)

      if (status === 'abertos') consulta = consulta.in('status', STATUS_ABERTOS)
      else if (status !== 'todos') consulta = consulta.eq('status', status)

      if (categoria !== 'todas') consulta = consulta.eq('categoria_id', categoria)
      if (prioridade !== 'todas') consulta = consulta.eq('prioridade', prioridade)

      const { data, error } = await consulta
      if (error) throw new Error(error.message)
      return (data ?? []) as unknown as SolicitacaoComRelacoes[]
    },
    [status, categoria, prioridade],
  )

  const filtradas = useMemo(() => {
    if (!solicitacoes) return []
    const termo = semAcento(buscaAdiada.trim())
    if (!termo) return solicitacoes
    return solicitacoes.filter((s) =>
      [s.protocolo, s.titulo, s.descricao, s.local_ocorrencia ?? '', s.morador?.nome ?? '']
        .map(semAcento)
        .some((campo) => campo.includes(termo)),
    )
  }, [solicitacoes, buscaAdiada])

  const totalPaginas = Math.max(1, Math.ceil(filtradas.length / POR_PAGINA))
  const paginaAtual = Math.min(pagina, totalPaginas)
  const visiveis = filtradas.slice((paginaAtual - 1) * POR_PAGINA, paginaAtual * POR_PAGINA)

  const exportar = () => {
    baixarCsv(
      `atendimentos-${new Date().toISOString().slice(0, 10)}`,
      filtradas.map((s) => ({
        Protocolo: s.protocolo,
        Título: s.titulo,
        Morador: s.morador?.nome ?? '',
        Categoria: s.categoria?.nome ?? '',
        Situação: STATUS_SOLICITACAO[s.status].texto,
        Prioridade: PRIORIDADES[s.prioridade].texto,
        Local: s.local_ocorrencia ?? '',
        Abertura: dataBr(s.criado_em),
        Prazo: dataBr(s.prazo_atendimento),
        Responsável: s.responsavel?.nome ?? '',
      })),
    )
  }

  const limparFiltros = () => {
    setBusca('')
    setStatus('todos')
    setCategoria('todas')
    setPrioridade('todas')
    setPagina(1)
  }

  const temFiltro =
    busca !== '' || status !== 'todos' || categoria !== 'todas' || prioridade !== 'todas'

  return (
    <div>
      <TituloPagina
        titulo="Atendimentos"
        descricao={
          ehEquipe
            ? 'Todos os pedidos registrados pelos moradores do bairro.'
            : 'Acompanhe os pedidos que você registrou na associação.'
        }
        acao={
          <>
            {ehEquipe && filtradas.length > 0 && (
              <Botao variante="secundario" icone="baixar" onClick={exportar}>
                Exportar
              </Botao>
            )}
            <Link to="/solicitacoes/nova">
              <Botao icone="mais">Novo atendimento</Botao>
            </Link>
          </>
        }
      />

      {/* Filtros em uma linha acima da lista */}
      <Cartao className="sem-impressao mb-4 p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Campo
            placeholder="Buscar por protocolo, título ou morador"
            icone="busca"
            value={busca}
            onChange={(e) => {
              setBusca(e.target.value)
              setPagina(1)
            }}
            aria-label="Buscar atendimentos"
          />
          <Selecao
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as typeof status)
              setPagina(1)
            }}
            aria-label="Filtrar por situação"
          >
            <option value="todos">Todas as situações</option>
            <option value="abertos">Somente em aberto</option>
            {(Object.keys(STATUS_SOLICITACAO) as StatusSolicitacao[]).map((s) => (
              <option key={s} value={s}>
                {STATUS_SOLICITACAO[s].texto}
              </option>
            ))}
          </Selecao>
          <Selecao
            value={categoria}
            onChange={(e) => {
              setCategoria(e.target.value)
              setPagina(1)
            }}
            aria-label="Filtrar por categoria"
          >
            <option value="todas">Todas as categorias</option>
            {(categorias ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </Selecao>
          <Selecao
            value={prioridade}
            onChange={(e) => {
              setPrioridade(e.target.value)
              setPagina(1)
            }}
            aria-label="Filtrar por prioridade"
          >
            <option value="todas">Todas as prioridades</option>
            {Object.entries(PRIORIDADES).map(([valor, r]) => (
              <option key={valor} value={valor}>
                {r.texto}
              </option>
            ))}
          </Selecao>
        </div>
        {temFiltro && (
          <div className="mt-3 flex items-center gap-3">
            <span className="texto-suave text-sm">
              {filtradas.length} {filtradas.length === 1 ? 'resultado' : 'resultados'}
            </span>
            <button
              type="button"
              onClick={limparFiltros}
              className="text-sm font-semibold text-mata-700 hover:underline dark:text-mata-300"
            >
              Limpar filtros
            </button>
          </div>
        )}
      </Cartao>

      <Cartao>
        {carregando ? (
          <Esqueleto linhas={5} />
        ) : visiveis.length === 0 ? (
          <Vazio
            icone="chamado"
            titulo={temFiltro ? 'Nenhum atendimento encontrado' : 'Nenhum atendimento registrado'}
            descricao={
              temFiltro
                ? 'Ajuste os filtros ou limpe a busca para ver mais resultados.'
                : 'Registre o primeiro pedido para a associação acompanhar.'
            }
            acao={
              temFiltro ? (
                <Botao variante="secundario" onClick={limparFiltros}>
                  Limpar filtros
                </Botao>
              ) : (
                <Link to="/solicitacoes/nova">
                  <Botao icone="mais">Novo atendimento</Botao>
                </Link>
              )
            }
          />
        ) : (
          <>
            <ul className="divide-y" style={{ borderColor: 'var(--borda)' }}>
              {visiveis.map((s) => {
                const dias = diasAte(s.prazo_atendimento)
                const atrasada =
                  dias !== null && dias < 0 && STATUS_ABERTOS.includes(s.status)

                return (
                  <li key={s.id}>
                    <Link
                      to={`/solicitacoes/${s.id}`}
                      className="block px-4 py-4 transition hover:bg-mata-500/5 sm:px-5"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-mata-700 dark:text-mata-300">
                          {s.protocolo}
                        </span>
                        <Selo rotulo={STATUS_SOLICITACAO[s.status]} />
                        {s.prioridade !== 'media' && <Selo rotulo={PRIORIDADES[s.prioridade]} />}
                        {atrasada && (
                          <span className="selo bg-rose-50 text-rose-800 ring-rose-600/20 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-400/30">
                            <Icone nome="alerta" className="h-3.5 w-3.5" />
                            {Math.abs(dias)} {Math.abs(dias) === 1 ? 'dia' : 'dias'} de atraso
                          </span>
                        )}
                      </div>

                      <p className="mt-2 font-semibold">{s.titulo}</p>
                      <p className="texto-suave mt-1 line-clamp-2 text-sm">{s.descricao}</p>

                      <div className="texto-suave mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                        {s.categoria && (
                          <span className="inline-flex items-center gap-1.5">
                            <span
                              className="h-2 w-2 rounded-full"
                              style={{ background: s.categoria.cor ?? '#64748b' }}
                            />
                            {s.categoria.nome}
                          </span>
                        )}
                        {ehEquipe && s.morador && (
                          <span className="inline-flex items-center gap-1.5">
                            <Icone nome="perfil" className="h-3.5 w-3.5" />
                            {s.morador.nome}
                          </span>
                        )}
                        {s.local_ocorrencia && (
                          <span className="inline-flex items-center gap-1.5">
                            <Icone nome="local" className="h-3.5 w-3.5" />
                            {s.local_ocorrencia}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1.5">
                          <Icone nome="relogio" className="h-3.5 w-3.5" />
                          {tempoRelativo(s.criado_em)}
                        </span>
                      </div>
                    </Link>
                  </li>
                )
              })}
            </ul>
            <Paginacao
              pagina={paginaAtual}
              totalPaginas={totalPaginas}
              aoMudar={setPagina}
              totalItens={filtradas.length}
            />
          </>
        )}
      </Cartao>

      {!carregando && (
        <div className="sem-impressao mt-4 text-center">
          <Botao variante="fantasma" tamanho="pequeno" icone="atualizar" onClick={recarregar}>
            Atualizar lista
          </Botao>
        </div>
      )}
    </div>
  )
}
