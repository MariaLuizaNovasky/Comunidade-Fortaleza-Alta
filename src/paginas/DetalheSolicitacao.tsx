import { useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../contextos/AuthContexto'
import { useAviso } from '../contextos/AvisoContexto'
import { useConsulta } from '../lib/hooks'
import { mensagemErro, supabase } from '../lib/supabase'
import { dataBr, dataHoraBr, diasAte, iniciais, tempoRelativo } from '../lib/formato'
import { PRIORIDADES, PROXIMOS_STATUS, STATUS_ABERTOS, STATUS_SOLICITACAO } from '../lib/constantes'
import type {
  InteracaoComAutor,
  Perfil,
  SolicitacaoComRelacoes,
  StatusSolicitacao,
} from '../lib/tipos'
import { Icone } from '../componentes/Icone'
import {
  Alternador,
  Area,
  Botao,
  Cartao,
  Carregando,
  Estrelas,
  Modal,
  Selecao,
  Selo,
  Vazio,
} from '../componentes/ui'

export default function DetalheSolicitacao() {
  const { id = '' } = useParams()
  const { perfil, ehEquipe } = useAuth()
  const aviso = useAviso()

  const [mensagem, setMensagem] = useState('')
  const [interna, setInterna] = useState(false)
  const [enviandoMensagem, setEnviandoMensagem] = useState(false)
  const [modalStatus, setModalStatus] = useState(false)
  const [novoStatus, setNovoStatus] = useState<StatusSolicitacao | ''>('')
  const [observacaoStatus, setObservacaoStatus] = useState('')
  const [salvandoStatus, setSalvandoStatus] = useState(false)
  const [modalAvaliacao, setModalAvaliacao] = useState(false)
  const [nota, setNota] = useState(5)
  const [comentario, setComentario] = useState('')
  const [salvandoAvaliacao, setSalvandoAvaliacao] = useState(false)

  const {
    dados: solicitacao,
    carregando,
    erro,
    recarregar,
  } = useConsulta<SolicitacaoComRelacoes | null>(async () => {
    const { data, error } = await supabase
      .from('solicitacoes')
      .select(
        '*, categoria:categorias_servico(id,nome,cor), morador:perfis!solicitacoes_morador_id_fkey(id,nome,telefone,rua,numero), responsavel:perfis!solicitacoes_responsavel_id_fkey(id,nome)',
      )
      .eq('id', id)
      .maybeSingle()
    if (error) throw new Error(mensagemErro(error))
    return data as unknown as SolicitacaoComRelacoes | null
  }, [id])

  const { dados: interacoes, recarregar: recarregarInteracoes } = useConsulta<InteracaoComAutor[]>(
    async () => {
      const { data, error } = await supabase
        .from('solicitacao_interacoes')
        .select('*, autor:perfis(id,nome,papel)')
        .eq('solicitacao_id', id)
        .order('criado_em', { ascending: true })
      if (error) throw new Error(mensagemErro(error))
      return (data ?? []) as unknown as InteracaoComAutor[]
    },
    [id],
  )

  const { dados: equipe } = useConsulta<Perfil[]>(async () => {
    if (!ehEquipe) return []
    const { data, error } = await supabase
      .from('perfis')
      .select('*')
      .in('papel', ['admin', 'diretoria'])
      .eq('ativo', true)
      .order('nome')
    if (error) throw new Error(error.message)
    return (data ?? []) as Perfil[]
  }, [ehEquipe])

  if (carregando) return <Carregando texto="Carregando atendimento…" />

  if (erro || !solicitacao) {
    return (
      <Vazio
        icone="busca"
        titulo="Atendimento não encontrado"
        descricao={erro ?? 'Este atendimento não existe ou você não tem acesso a ele.'}
        acao={
          <Link to="/solicitacoes">
            <Botao variante="secundario">Voltar para a lista</Botao>
          </Link>
        }
      />
    )
  }

  const souDono = solicitacao.morador_id === perfil?.id
  const dias = diasAte(solicitacao.prazo_atendimento)
  const atrasada = dias !== null && dias < 0 && STATUS_ABERTOS.includes(solicitacao.status)
  const podeAvaliar = souDono && solicitacao.status === 'concluida' && !solicitacao.avaliacao

  async function enviarMensagem(e: FormEvent) {
    e.preventDefault()
    if (mensagem.trim().length < 2 || !perfil) return
    setEnviandoMensagem(true)
    try {
      const { error } = await supabase.from('solicitacao_interacoes').insert({
        solicitacao_id: id,
        autor_id: perfil.id,
        mensagem: mensagem.trim(),
        interna: ehEquipe ? interna : false,
      })
      if (error) throw new Error(mensagemErro(error))
      setMensagem('')
      setInterna(false)
      recarregarInteracoes()
      aviso.sucesso('Mensagem enviada.')
    } catch (e2) {
      aviso.erro(e2 instanceof Error ? e2.message : 'Não foi possível enviar a mensagem.')
    } finally {
      setEnviandoMensagem(false)
    }
  }

  async function salvarStatus() {
    if (!novoStatus) return
    setSalvandoStatus(true)
    try {
      const { error } = await supabase
        .from('solicitacoes')
        .update({ status: novoStatus })
        .eq('id', id)
      if (error) throw new Error(mensagemErro(error))

      if (observacaoStatus.trim()) {
        await supabase.from('solicitacao_interacoes').insert({
          solicitacao_id: id,
          autor_id: perfil?.id ?? null,
          mensagem: observacaoStatus.trim(),
        })
      }

      setModalStatus(false)
      setObservacaoStatus('')
      setNovoStatus('')
      recarregar()
      recarregarInteracoes()
      aviso.sucesso('Situação atualizada.')
    } catch (e) {
      aviso.erro(e instanceof Error ? e.message : 'Não foi possível atualizar a situação.')
    } finally {
      setSalvandoStatus(false)
    }
  }

  async function definirResponsavel(idResponsavel: string) {
    try {
      const { error } = await supabase
        .from('solicitacoes')
        .update({ responsavel_id: idResponsavel || null })
        .eq('id', id)
      if (error) throw new Error(mensagemErro(error))
      recarregar()
      aviso.sucesso('Responsável atualizado.')
    } catch (e) {
      aviso.erro(e instanceof Error ? e.message : 'Não foi possível definir o responsável.')
    }
  }

  async function salvarAvaliacao() {
    setSalvandoAvaliacao(true)
    try {
      const { error } = await supabase
        .from('solicitacoes')
        .update({ avaliacao: nota, avaliacao_comentario: comentario.trim() || null })
        .eq('id', id)
      if (error) throw new Error(mensagemErro(error))
      setModalAvaliacao(false)
      recarregar()
      aviso.sucesso('Obrigado pela avaliação!')
    } catch (e) {
      aviso.erro(e instanceof Error ? e.message : 'Não foi possível registrar a avaliação.')
    } finally {
      setSalvandoAvaliacao(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        to="/solicitacoes"
        className="texto-suave sem-impressao mb-4 inline-flex items-center gap-1.5 text-sm font-semibold transition hover:text-mata-700"
      >
        <Icone nome="voltar" className="h-4 w-4" />
        Voltar para os atendimentos
      </Link>

      <Cartao className="p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-sm font-bold text-mata-700 dark:text-mata-300">
            {solicitacao.protocolo}
          </span>
          <Selo rotulo={STATUS_SOLICITACAO[solicitacao.status]} />
          <Selo rotulo={PRIORIDADES[solicitacao.prioridade]} />
          {atrasada && (
            <span className="selo bg-rose-50 text-rose-800 ring-rose-600/20 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-400/30">
              <Icone nome="alerta" className="h-3.5 w-3.5" />
              {Math.abs(dias!)} {Math.abs(dias!) === 1 ? 'dia' : 'dias'} de atraso
            </span>
          )}
        </div>

        <h1 className="mt-3 text-2xl font-bold tracking-tight">{solicitacao.titulo}</h1>
        <p className="mt-3 whitespace-pre-wrap text-[15px] leading-relaxed">
          {solicitacao.descricao}
        </p>

        <dl className="mt-6 grid gap-x-6 gap-y-4 border-t pt-5 sm:grid-cols-2 lg:grid-cols-3"
            style={{ borderColor: 'var(--borda)' }}>
          <Informacao icone="filtro" rotulo="Categoria" valor={solicitacao.categoria?.nome ?? '—'} />
          <Informacao icone="local" rotulo="Local" valor={solicitacao.local_ocorrencia ?? '—'} />
          <Informacao
            icone="calendario"
            rotulo="Aberto em"
            valor={`${dataBr(solicitacao.criado_em)} (${tempoRelativo(solicitacao.criado_em)})`}
          />
          <Informacao
            icone="relogio"
            rotulo="Prazo de atendimento"
            valor={dataBr(solicitacao.prazo_atendimento)}
          />
          <Informacao
            icone="perfil"
            rotulo="Responsável"
            valor={solicitacao.responsavel?.nome ?? 'Ainda não atribuído'}
          />
          {solicitacao.concluida_em && (
            <Informacao
              icone="check"
              rotulo="Concluído em"
              valor={dataHoraBr(solicitacao.concluida_em)}
            />
          )}
          {ehEquipe && solicitacao.morador && (
            <>
              <Informacao icone="moradores" rotulo="Morador" valor={solicitacao.morador.nome} />
              <Informacao
                icone="telefone"
                rotulo="Contato"
                valor={solicitacao.morador.telefone ?? '—'}
              />
            </>
          )}
        </dl>

        {solicitacao.avaliacao && (
          <div className="mt-5 rounded-xl bg-mata-500/8 p-4">
            <p className="mb-2 text-sm font-semibold">Avaliação do morador</p>
            <Estrelas nota={solicitacao.avaliacao} tamanho="h-5 w-5" />
            {solicitacao.avaliacao_comentario && (
              <p className="texto-suave mt-2 text-sm italic">
                “{solicitacao.avaliacao_comentario}”
              </p>
            )}
          </div>
        )}

        <div className="sem-impressao mt-6 flex flex-wrap gap-2 border-t pt-5" style={{ borderColor: 'var(--borda)' }}>
          {ehEquipe && (
            <>
              <Botao
                icone="editar"
                onClick={() => {
                  setNovoStatus(PROXIMOS_STATUS[solicitacao.status][0] ?? '')
                  setModalStatus(true)
                }}
              >
                Alterar situação
              </Botao>
              <Selecao
                value={solicitacao.responsavel_id ?? ''}
                onChange={(e) => definirResponsavel(e.target.value)}
                aria-label="Definir responsável"
                className="min-w-[200px]"
              >
                <option value="">Sem responsável</option>
                {(equipe ?? []).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome}
                  </option>
                ))}
              </Selecao>
            </>
          )}
          {podeAvaliar && (
            <Botao icone="estrela" onClick={() => setModalAvaliacao(true)}>
              Avaliar atendimento
            </Botao>
          )}
          <Botao variante="secundario" icone="baixar" onClick={() => window.print()}>
            Imprimir
          </Botao>
        </div>
      </Cartao>

      {/* Linha do tempo */}
      <Cartao className="mt-4">
        <div className="border-b px-5 py-4" style={{ borderColor: 'var(--borda)' }}>
          <h2 className="font-semibold">Andamento do atendimento</h2>
          <p className="texto-suave mt-0.5 text-sm">
            Histórico completo de mensagens e mudanças de situação.
          </p>
        </div>

        <div className="px-5 py-5">
          {interacoes === null ? (
            <Carregando texto="Carregando histórico…" />
          ) : interacoes.length === 0 ? (
            <p className="texto-suave py-6 text-center text-sm">Nenhum registro no histórico.</p>
          ) : (
            <ol className="relative space-y-5 border-l pl-6" style={{ borderColor: 'var(--borda)' }}>
              {interacoes.map((it) => (
                <li key={it.id} className="relative">
                  <span
                    className={`absolute -left-[31px] top-1 flex h-4 w-4 items-center justify-center rounded-full ring-4
                      ${it.status_novo ? 'bg-mata-600' : 'bg-slate-300 dark:bg-slate-600'}`}
                    style={{ boxShadow: '0 0 0 4px var(--superficie)' }}
                    aria-hidden="true"
                  />
                  <div
                    className={`rounded-xl px-4 py-3 ${
                      it.interna
                        ? 'bg-terra-50 ring-1 ring-terra-300 dark:bg-terra-900/20 dark:ring-terra-700'
                        : 'bg-mata-500/5'
                    }`}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-mata-700 text-[10px] font-bold text-white">
                        {iniciais(it.autor?.nome)}
                      </span>
                      <span className="text-sm font-semibold">{it.autor?.nome ?? 'Sistema'}</span>
                      {it.interna && (
                        <span className="selo bg-terra-100 text-terra-800 ring-terra-600/20 dark:bg-terra-400/10 dark:text-terra-200 dark:ring-terra-400/30">
                          <Icone nome="cadeado" className="h-3 w-3" />
                          Nota interna
                        </span>
                      )}
                      {it.status_novo && (
                        <Selo rotulo={STATUS_SOLICITACAO[it.status_novo]} />
                      )}
                      <span className="texto-suave ml-auto text-xs">
                        {dataHoraBr(it.criado_em)}
                      </span>
                    </div>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">{it.mensagem}</p>
                  </div>
                </li>
              ))}
            </ol>
          )}

          {solicitacao.status !== 'cancelada' && (
            <form onSubmit={enviarMensagem} className="sem-impressao mt-6 border-t pt-5" style={{ borderColor: 'var(--borda)' }}>
              <Area
                rotulo="Enviar mensagem"
                rows={3}
                maxLength={1000}
                placeholder={
                  ehEquipe
                    ? 'Responda ao morador ou registre uma observação…'
                    : 'Acrescente informações ou tire uma dúvida sobre o pedido…'
                }
                value={mensagem}
                onChange={(e) => setMensagem(e.target.value)}
              />
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                {ehEquipe ? (
                  <Alternador
                    rotulo="Nota interna"
                    descricao="Visível apenas para a diretoria."
                    marcado={interna}
                    aoMudar={setInterna}
                  />
                ) : (
                  <span />
                )}
                <Botao
                  type="submit"
                  icone="enviar"
                  carregando={enviandoMensagem}
                  disabled={mensagem.trim().length < 2}
                >
                  Enviar
                </Botao>
              </div>
            </form>
          )}
        </div>
      </Cartao>

      {/* Modal: alterar situação */}
      <Modal
        aberto={modalStatus}
        aoFechar={() => setModalStatus(false)}
        titulo="Alterar situação do atendimento"
        rodape={
          <>
            <Botao variante="secundario" onClick={() => setModalStatus(false)}>
              Cancelar
            </Botao>
            <Botao onClick={salvarStatus} carregando={salvandoStatus} disabled={!novoStatus}>
              Salvar
            </Botao>
          </>
        }
      >
        <div className="space-y-4">
          <Selecao
            rotulo="Nova situação"
            value={novoStatus}
            onChange={(e) => setNovoStatus(e.target.value as StatusSolicitacao)}
          >
            <option value="">Selecione…</option>
            {PROXIMOS_STATUS[solicitacao.status].map((s) => (
              <option key={s} value={s}>
                {STATUS_SOLICITACAO[s].texto}
              </option>
            ))}
          </Selecao>
          <Area
            rotulo="Observação (opcional)"
            rows={3}
            placeholder="Explique o que foi feito ou o que falta para concluir."
            value={observacaoStatus}
            onChange={(e) => setObservacaoStatus(e.target.value)}
          />
          <p className="texto-suave text-sm">
            A mudança é registrada automaticamente no histórico do atendimento.
          </p>
        </div>
      </Modal>

      {/* Modal: avaliação */}
      <Modal
        aberto={modalAvaliacao}
        aoFechar={() => setModalAvaliacao(false)}
        titulo="Avaliar o atendimento"
        rodape={
          <>
            <Botao variante="secundario" onClick={() => setModalAvaliacao(false)}>
              Agora não
            </Botao>
            <Botao onClick={salvarAvaliacao} carregando={salvandoAvaliacao}>
              Enviar avaliação
            </Botao>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <span className="rotulo">Como você avalia este atendimento?</span>
            <Estrelas nota={nota} aoEscolher={setNota} />
          </div>
          <Area
            rotulo="Comentário (opcional)"
            rows={3}
            placeholder="Conte o que achou do atendimento da associação."
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
          />
        </div>
      </Modal>
    </div>
  )
}

function Informacao({
  icone,
  rotulo,
  valor,
}: {
  icone: 'filtro' | 'local' | 'calendario' | 'relogio' | 'perfil' | 'check' | 'moradores' | 'telefone'
  rotulo: string
  valor: string
}) {
  return (
    <div className="flex gap-2.5">
      <Icone nome={icone} className="mt-0.5 h-[18px] w-[18px] shrink-0 text-mata-600 dark:text-mata-400" />
      <div className="min-w-0">
        <dt className="texto-suave text-xs font-semibold uppercase tracking-wide">{rotulo}</dt>
        <dd className="mt-0.5 text-sm font-medium">{valor}</dd>
      </div>
    </div>
  )
}
