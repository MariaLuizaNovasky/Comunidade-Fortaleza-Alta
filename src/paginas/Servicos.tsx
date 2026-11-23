import { useState } from 'react'
import { useAuth } from '../contextos/AuthContexto'
import { useAviso } from '../contextos/AvisoContexto'
import { useConsulta } from '../lib/hooks'
import { mensagemErro, supabase } from '../lib/supabase'
import { hojeIso, moeda } from '../lib/formato'
import type { CategoriaServico, Servico } from '../lib/tipos'
import { Icone } from '../componentes/Icone'
import {
  Alternador,
  Area,
  Botao,
  Campo,
  Cartao,
  Confirmacao,
  Esqueleto,
  Modal,
  Selecao,
  TituloPagina,
  Vazio,
} from '../componentes/ui'

const HORARIOS = ['08:00', '09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00']

export default function Servicos() {
  const { perfil, ehEquipe } = useAuth()
  const aviso = useAviso()

  const [agendando, setAgendando] = useState<Servico | null>(null)
  const [data, setData] = useState('')
  const [hora, setHora] = useState('09:00')
  const [observacoes, setObservacoes] = useState('')
  const [salvando, setSalvando] = useState(false)

  const [editando, setEditando] = useState<Partial<Servico> | null>(null)
  const [excluindo, setExcluindo] = useState<Servico | null>(null)

  const { dados: categorias } = useConsulta<CategoriaServico[]>(async () => {
    const { data: d, error } = await supabase.from('categorias_servico').select('*').order('nome')
    if (error) throw new Error(error.message)
    return (d ?? []) as CategoriaServico[]
  }, [])

  const { dados: servicos, carregando, recarregar } = useConsulta<Servico[]>(async () => {
    let consulta = supabase.from('servicos').select('*').order('nome')
    if (!ehEquipe) consulta = consulta.eq('ativo', true)
    const { data: d, error } = await consulta
    if (error) throw new Error(error.message)
    return (d ?? []) as Servico[]
  }, [ehEquipe])

  const nomeCategoria = (id: string | null) =>
    categorias?.find((c) => c.id === id)?.nome ?? 'Geral'

  async function confirmarAgendamento() {
    if (!agendando || !perfil || !data) {
      aviso.erro('Escolha a data do atendimento.')
      return
    }
    setSalvando(true)
    try {
      const { error } = await supabase.from('agendamentos').insert({
        servico_id: agendando.id,
        morador_id: perfil.id,
        data_hora: new Date(`${data}T${hora}:00`).toISOString(),
        observacoes: observacoes.trim() || null,
        status: 'pendente',
      })
      if (error) throw new Error(mensagemErro(error))
      aviso.sucesso('Agendamento solicitado! A diretoria irá confirmar.')
      setAgendando(null)
      setData('')
      setObservacoes('')
    } catch (e) {
      aviso.erro(e instanceof Error ? e.message : 'Não foi possível agendar.')
    } finally {
      setSalvando(false)
    }
  }

  async function salvarServico() {
    if (!editando?.nome?.trim()) {
      aviso.erro('Informe o nome do serviço.')
      return
    }
    setSalvando(true)
    try {
      const registro = {
        nome: editando.nome.trim(),
        descricao: editando.descricao?.trim() || null,
        categoria_id: editando.categoria_id || null,
        valor: Number(editando.valor ?? 0),
        duracao_minutos: Number(editando.duracao_minutos ?? 60),
        requer_agendamento: editando.requer_agendamento ?? true,
        ativo: editando.ativo ?? true,
      }
      const { error } = editando.id
        ? await supabase.from('servicos').update(registro).eq('id', editando.id)
        : await supabase.from('servicos').insert(registro)
      if (error) throw new Error(mensagemErro(error))
      aviso.sucesso(editando.id ? 'Serviço atualizado.' : 'Serviço cadastrado.')
      setEditando(null)
      recarregar()
    } catch (e) {
      aviso.erro(e instanceof Error ? e.message : 'Não foi possível salvar o serviço.')
    } finally {
      setSalvando(false)
    }
  }

  async function excluirServico() {
    if (!excluindo) return
    setSalvando(true)
    try {
      const { error } = await supabase.from('servicos').delete().eq('id', excluindo.id)
      if (error) throw new Error(mensagemErro(error))
      aviso.sucesso('Serviço removido.')
      setExcluindo(null)
      recarregar()
    } catch (e) {
      aviso.erro(e instanceof Error ? e.message : 'Não foi possível remover o serviço.')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div>
      <TituloPagina
        titulo="Serviços da associação"
        descricao="Atendimentos e serviços oferecidos aos moradores associados."
        acao={
          ehEquipe ? (
            <Botao
              icone="mais"
              onClick={() =>
                setEditando({
                  nome: '',
                  descricao: '',
                  valor: 0,
                  duracao_minutos: 60,
                  requer_agendamento: true,
                  ativo: true,
                })
              }
            >
              Novo serviço
            </Botao>
          ) : undefined
        }
      />

      {carregando ? (
        <Cartao>
          <Esqueleto linhas={4} />
        </Cartao>
      ) : (servicos ?? []).length === 0 ? (
        <Cartao>
          <Vazio icone="servico" titulo="Nenhum serviço cadastrado" />
        </Cartao>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(servicos ?? []).map((s) => (
            <Cartao key={s.id} className="flex flex-col p-5">
              <div className="flex items-start justify-between gap-3">
                <span className="rounded-xl bg-mata-500/10 p-2.5 text-mata-700 dark:text-mata-300">
                  <Icone nome="servico" />
                </span>
                {!s.ativo && (
                  <span className="selo bg-slate-100 text-slate-700 ring-slate-500/20 dark:bg-slate-500/10 dark:text-slate-300 dark:ring-slate-400/30">
                    Inativo
                  </span>
                )}
              </div>

              <h2 className="mt-3.5 font-semibold">{s.nome}</h2>
              <p className="texto-suave mt-1.5 flex-1 text-sm leading-relaxed">{s.descricao}</p>

              <dl className="texto-suave mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs">
                <span className="inline-flex items-center gap-1.5">
                  <Icone nome="filtro" className="h-3.5 w-3.5" />
                  {nomeCategoria(s.categoria_id)}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Icone nome="relogio" className="h-3.5 w-3.5" />
                  {s.duracao_minutos} min
                </span>
                <span className="inline-flex items-center gap-1.5 font-semibold">
                  <Icone nome="dinheiro" className="h-3.5 w-3.5" />
                  {s.valor > 0 ? moeda(s.valor) : 'Gratuito'}
                </span>
              </dl>

              <div className="mt-4 flex gap-2">
                {s.requer_agendamento && s.ativo && (
                  <Botao
                    tamanho="pequeno"
                    icone="agenda"
                    onClick={() => {
                      setAgendando(s)
                      setData(hojeIso())
                    }}
                  >
                    Agendar
                  </Botao>
                )}
                {ehEquipe && (
                  <>
                    <Botao
                      variante="secundario"
                      tamanho="pequeno"
                      icone="editar"
                      onClick={() => setEditando(s)}
                    >
                      Editar
                    </Botao>
                    <Botao
                      variante="fantasma"
                      tamanho="pequeno"
                      icone="lixeira"
                      onClick={() => setExcluindo(s)}
                      aria-label={`Remover ${s.nome}`}
                    />
                  </>
                )}
              </div>
            </Cartao>
          ))}
        </div>
      )}

      {/* Agendamento */}
      <Modal
        aberto={!!agendando}
        aoFechar={() => setAgendando(null)}
        titulo={`Agendar: ${agendando?.nome ?? ''}`}
        rodape={
          <>
            <Botao variante="secundario" onClick={() => setAgendando(null)}>
              Cancelar
            </Botao>
            <Botao onClick={confirmarAgendamento} carregando={salvando}>
              Solicitar agendamento
            </Botao>
          </>
        }
      >
        <div className="space-y-4">
          {agendando && agendando.valor > 0 && (
            <div className="rounded-xl bg-terra-50 px-4 py-3 text-sm dark:bg-terra-900/20">
              Este serviço tem custo de <strong>{moeda(agendando.valor)}</strong>, pago
              diretamente na sede da associação.
            </div>
          )}
          <Campo
            rotulo="Data desejada"
            type="date"
            required
            min={hojeIso()}
            value={data}
            onChange={(e) => setData(e.target.value)}
          />
          <div>
            <span className="rotulo">Horário</span>
            <div className="grid grid-cols-4 gap-2">
              {HORARIOS.map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => setHora(h)}
                  aria-pressed={hora === h}
                  className={`superficie rounded-xl border py-2 text-sm font-semibold transition
                    ${hora === h ? 'border-mata-600 bg-mata-700 text-white' : 'hover:border-mata-400'}`}
                >
                  {h}
                </button>
              ))}
            </div>
          </div>
          <Area
            rotulo="Observações (opcional)"
            rows={3}
            placeholder="Algum detalhe que a diretoria precise saber?"
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
          />
          <p className="texto-suave text-sm">
            O agendamento fica como <strong>pendente</strong> até a diretoria confirmar.
          </p>
        </div>
      </Modal>

      {/* Cadastro / edição (equipe) */}
      <Modal
        aberto={!!editando}
        aoFechar={() => setEditando(null)}
        titulo={editando?.id ? 'Editar serviço' : 'Novo serviço'}
        rodape={
          <>
            <Botao variante="secundario" onClick={() => setEditando(null)}>
              Cancelar
            </Botao>
            <Botao onClick={salvarServico} carregando={salvando}>
              Salvar
            </Botao>
          </>
        }
      >
        {editando && (
          <div className="space-y-4">
            <Campo
              rotulo="Nome do serviço"
              required
              value={editando.nome ?? ''}
              onChange={(e) => setEditando({ ...editando, nome: e.target.value })}
            />
            <Area
              rotulo="Descrição"
              rows={3}
              value={editando.descricao ?? ''}
              onChange={(e) => setEditando({ ...editando, descricao: e.target.value })}
            />
            <Selecao
              rotulo="Categoria"
              value={editando.categoria_id ?? ''}
              onChange={(e) => setEditando({ ...editando, categoria_id: e.target.value })}
            >
              <option value="">Sem categoria</option>
              {(categorias ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </Selecao>
            <div className="grid gap-4 sm:grid-cols-2">
              <Campo
                rotulo="Valor (R$)"
                type="number"
                min={0}
                step="0.01"
                value={String(editando.valor ?? 0)}
                onChange={(e) => setEditando({ ...editando, valor: Number(e.target.value) })}
              />
              <Campo
                rotulo="Duração (minutos)"
                type="number"
                min={10}
                step={10}
                value={String(editando.duracao_minutos ?? 60)}
                onChange={(e) =>
                  setEditando({ ...editando, duracao_minutos: Number(e.target.value) })
                }
              />
            </div>
            <Alternador
              rotulo="Exige agendamento"
              marcado={editando.requer_agendamento ?? true}
              aoMudar={(v) => setEditando({ ...editando, requer_agendamento: v })}
            />
            <Alternador
              rotulo="Serviço ativo"
              descricao="Serviços inativos não aparecem para os moradores."
              marcado={editando.ativo ?? true}
              aoMudar={(v) => setEditando({ ...editando, ativo: v })}
            />
          </div>
        )}
      </Modal>

      <Confirmacao
        aberto={!!excluindo}
        titulo="Remover serviço"
        mensagem={`Tem certeza que deseja remover "${excluindo?.nome}"? Os agendamentos ligados a ele também serão removidos.`}
        textoConfirmar="Remover"
        perigo
        carregando={salvando}
        aoConfirmar={excluirServico}
        aoCancelar={() => setExcluindo(null)}
      />
    </div>
  )
}
