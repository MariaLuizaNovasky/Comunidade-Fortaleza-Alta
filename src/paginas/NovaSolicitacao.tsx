import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contextos/AuthContexto'
import { useAviso } from '../contextos/AvisoContexto'
import { useConsulta } from '../lib/hooks'
import { mensagemErro, supabase } from '../lib/supabase'
import { PRIORIDADES } from '../lib/constantes'
import type { CategoriaServico, PrioridadeSolicitacao } from '../lib/tipos'
import { Icone } from '../componentes/Icone'
import { Area, Botao, Campo, Cartao, Carregando, Selecao, TituloPagina } from '../componentes/ui'

export default function NovaSolicitacao() {
  const { perfil } = useAuth()
  const aviso = useAviso()
  const navegar = useNavigate()

  const [enviando, setEnviando] = useState(false)
  const [erros, setErros] = useState<Record<string, string>>({})
  const [form, setForm] = useState({
    titulo: '',
    descricao: '',
    categoria_id: '',
    prioridade: 'media' as PrioridadeSolicitacao,
    local_ocorrencia: '',
  })

  const { dados: categorias, carregando } = useConsulta<CategoriaServico[]>(async () => {
    const { data, error } = await supabase
      .from('categorias_servico')
      .select('*')
      .eq('ativo', true)
      .order('nome')
    if (error) throw new Error(error.message)
    return (data ?? []) as CategoriaServico[]
  }, [])

  const definir = (campo: keyof typeof form, valor: string) =>
    setForm((f) => ({ ...f, [campo]: valor }))

  const categoriaEscolhida = categorias?.find((c) => c.id === form.categoria_id)

  async function enviar(e: FormEvent) {
    e.preventDefault()
    const novos: Record<string, string> = {}
    if (form.titulo.trim().length < 5) novos.titulo = 'Descreva o assunto em pelo menos 5 caracteres.'
    if (form.descricao.trim().length < 15) {
      novos.descricao = 'Detalhe o pedido com pelo menos 15 caracteres.'
    }
    if (!form.categoria_id) novos.categoria_id = 'Escolha a categoria do atendimento.'
    setErros(novos)
    if (Object.keys(novos).length > 0) return

    if (!perfil) {
      aviso.erro('Não foi possível identificar seu cadastro.')
      return
    }

    setEnviando(true)
    try {
      const { data, error } = await supabase
        .from('solicitacoes')
        .insert({
          morador_id: perfil.id,
          titulo: form.titulo.trim(),
          descricao: form.descricao.trim(),
          categoria_id: form.categoria_id,
          prioridade: form.prioridade,
          local_ocorrencia:
            form.local_ocorrencia.trim() ||
            [perfil.rua, perfil.numero].filter(Boolean).join(', ') ||
            null,
        })
        .select('id, protocolo')
        .single()

      if (error) throw new Error(mensagemErro(error))

      // Registra a abertura na linha do tempo do chamado
      await supabase.from('solicitacao_interacoes').insert({
        solicitacao_id: data.id,
        autor_id: perfil.id,
        mensagem: 'Atendimento registrado pelo morador.',
        status_novo: 'aberta',
      })

      aviso.sucesso(`Atendimento registrado! Protocolo ${data.protocolo}.`)
      navegar(`/solicitacoes/${data.id}`, { replace: true })
    } catch (erro) {
      aviso.erro(erro instanceof Error ? erro.message : 'Não foi possível registrar o atendimento.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        to="/solicitacoes"
        className="texto-suave mb-4 inline-flex items-center gap-1.5 text-sm font-semibold transition hover:text-mata-700"
      >
        <Icone nome="voltar" className="h-4 w-4" />
        Voltar para os atendimentos
      </Link>

      <TituloPagina
        titulo="Novo atendimento"
        descricao="Descreva a demanda com o máximo de detalhes. Você receberá um número de protocolo para acompanhar o andamento."
      />

      {carregando ? (
        <Carregando texto="Carregando categorias…" />
      ) : (
        <form onSubmit={enviar} noValidate>
          <Cartao className="space-y-5 p-5 sm:p-6">
            <Campo
              rotulo="Assunto"
              required
              maxLength={120}
              placeholder="Ex.: Poste sem iluminação na Rua das Palmeiras"
              value={form.titulo}
              erro={erros.titulo}
              onChange={(e) => definir('titulo', e.target.value)}
            />

            <div>
              <span className="rotulo">
                Categoria<span className="ml-0.5 text-rose-600">*</span>
              </span>
              <div className="grid gap-2 sm:grid-cols-2">
                {(categorias ?? []).map((c) => {
                  const marcada = form.categoria_id === c.id
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => definir('categoria_id', c.id)}
                      aria-pressed={marcada}
                      className={`superficie flex items-start gap-3 rounded-xl border p-3 text-left transition
                        ${marcada ? 'border-mata-600 ring-2 ring-mata-500/25' : 'hover:border-mata-400'}`}
                    >
                      <span
                        className="mt-1 h-3 w-3 shrink-0 rounded-full"
                        style={{ background: c.cor ?? '#64748b' }}
                      />
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold">{c.nome}</span>
                        <span className="texto-suave block text-xs leading-snug">
                          {c.descricao}
                        </span>
                      </span>
                    </button>
                  )
                })}
              </div>
              {erros.categoria_id && (
                <p className="mt-1.5 text-sm font-medium text-rose-600">{erros.categoria_id}</p>
              )}
              {categoriaEscolhida && (
                <p className="texto-suave mt-2 flex items-center gap-1.5 text-sm">
                  <Icone nome="relogio" className="h-4 w-4" />
                  Prazo estimado de atendimento: {categoriaEscolhida.prazo_dias}{' '}
                  {categoriaEscolhida.prazo_dias === 1 ? 'dia' : 'dias'}.
                </p>
              )}
            </div>

            <Area
              rotulo="Descrição detalhada"
              required
              rows={5}
              maxLength={2000}
              placeholder="Conte o que está acontecendo, há quanto tempo e se há risco para os moradores."
              value={form.descricao}
              erro={erros.descricao}
              dica={`${form.descricao.length}/2000 caracteres`}
              onChange={(e) => definir('descricao', e.target.value)}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <Campo
                rotulo="Local da ocorrência"
                icone="local"
                placeholder={
                  [perfil?.rua, perfil?.numero].filter(Boolean).join(', ') || 'Rua e número'
                }
                value={form.local_ocorrencia}
                dica="Deixe em branco para usar seu endereço cadastrado."
                onChange={(e) => definir('local_ocorrencia', e.target.value)}
              />
              <Selecao
                rotulo="Prioridade"
                value={form.prioridade}
                onChange={(e) => definir('prioridade', e.target.value)}
              >
                {Object.entries(PRIORIDADES).map(([valor, r]) => (
                  <option key={valor} value={valor}>
                    {r.texto}
                  </option>
                ))}
              </Selecao>
            </div>

            <div className="flex flex-wrap justify-end gap-2 border-t pt-5" style={{ borderColor: 'var(--borda)' }}>
              <Link to="/solicitacoes">
                <Botao variante="secundario" type="button">
                  Cancelar
                </Botao>
              </Link>
              <Botao type="submit" icone="enviar" carregando={enviando}>
                Registrar atendimento
              </Botao>
            </div>
          </Cartao>
        </form>
      )}
    </div>
  )
}
