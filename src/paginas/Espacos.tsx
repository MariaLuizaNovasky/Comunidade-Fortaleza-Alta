import { useState } from 'react'
import { useAuth } from '../contextos/AuthContexto'
import { useAviso } from '../contextos/AvisoContexto'
import { useConsulta } from '../lib/hooks'
import { mensagemErro, supabase } from '../lib/supabase'
import { dataBr, hojeIso, horaBr, moeda } from '../lib/formato'
import { STATUS_RESERVA } from '../lib/constantes'
import type { Espaco, Reserva } from '../lib/tipos'
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
  Selo,
  TituloPagina,
  Vazio,
} from '../componentes/ui'

export default function Espacos() {
  const { perfil, ehEquipe } = useAuth()
  const aviso = useAviso()

  const [reservando, setReservando] = useState<Espaco | null>(null)
  const [form, setForm] = useState({
    data: hojeIso(),
    hora_inicio: '14:00',
    hora_fim: '22:00',
    finalidade: '',
    numero_convidados: '',
  })
  const [salvando, setSalvando] = useState(false)
  const [editando, setEditando] = useState<Partial<Espaco> | null>(null)
  const [excluindo, setExcluindo] = useState<Espaco | null>(null)

  const { dados: espacos, carregando, recarregar } = useConsulta<Espaco[]>(async () => {
    let consulta = supabase.from('espacos').select('*').order('nome')
    if (!ehEquipe) consulta = consulta.eq('ativo', true)
    const { data, error } = await consulta
    if (error) throw new Error(error.message)
    return (data ?? []) as Espaco[]
  }, [ehEquipe])

  // Reservas já confirmadas do espaço escolhido, para mostrar a agenda ocupada
  const { dados: ocupadas } = useConsulta<Reserva[]>(async () => {
    if (!reservando) return []
    const { data, error } = await supabase
      .from('reservas')
      .select('*')
      .eq('espaco_id', reservando.id)
      .gte('data', hojeIso())
      .in('status', ['pendente', 'confirmada'])
      .order('data')
      .limit(20)
    if (error) throw new Error(error.message)
    return (data ?? []) as Reserva[]
  }, [reservando?.id])

  async function confirmarReserva() {
    if (!reservando || !perfil) return
    if (form.hora_fim <= form.hora_inicio) {
      aviso.erro('O horário de término deve ser depois do início.')
      return
    }
    setSalvando(true)
    try {
      const { error } = await supabase.from('reservas').insert({
        espaco_id: reservando.id,
        morador_id: perfil.id,
        data: form.data,
        hora_inicio: form.hora_inicio,
        hora_fim: form.hora_fim,
        finalidade: form.finalidade.trim() || null,
        numero_convidados: Number(form.numero_convidados) || 0,
        valor: reservando.valor_locacao,
        status: 'pendente',
      })
      if (error) throw new Error(mensagemErro(error))
      aviso.sucesso('Reserva solicitada! Aguarde a confirmação da diretoria.')
      setReservando(null)
      setForm({ ...form, finalidade: '', numero_convidados: '' })
    } catch (e) {
      aviso.erro(e instanceof Error ? e.message : 'Não foi possível reservar.')
    } finally {
      setSalvando(false)
    }
  }

  async function salvarEspaco() {
    if (!editando?.nome?.trim()) {
      aviso.erro('Informe o nome do espaço.')
      return
    }
    setSalvando(true)
    try {
      const registro = {
        nome: editando.nome.trim(),
        descricao: editando.descricao?.trim() || null,
        capacidade: Number(editando.capacidade ?? 0),
        valor_locacao: Number(editando.valor_locacao ?? 0),
        regras: editando.regras?.trim() || null,
        ativo: editando.ativo ?? true,
      }
      const { error } = editando.id
        ? await supabase.from('espacos').update(registro).eq('id', editando.id)
        : await supabase.from('espacos').insert(registro)
      if (error) throw new Error(mensagemErro(error))
      aviso.sucesso(editando.id ? 'Espaço atualizado.' : 'Espaço cadastrado.')
      setEditando(null)
      recarregar()
    } catch (e) {
      aviso.erro(e instanceof Error ? e.message : 'Não foi possível salvar o espaço.')
    } finally {
      setSalvando(false)
    }
  }

  async function excluirEspaco() {
    if (!excluindo) return
    setSalvando(true)
    try {
      const { error } = await supabase.from('espacos').delete().eq('id', excluindo.id)
      if (error) throw new Error(mensagemErro(error))
      aviso.sucesso('Espaço removido.')
      setExcluindo(null)
      recarregar()
    } catch (e) {
      aviso.erro(e instanceof Error ? e.message : 'Não foi possível remover.')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div>
      <TituloPagina
        titulo="Espaços comunitários"
        descricao="Reserve o salão de festas, a quadra e os demais espaços da associação."
        acao={
          ehEquipe ? (
            <Botao
              icone="mais"
              onClick={() =>
                setEditando({ nome: '', descricao: '', capacidade: 0, valor_locacao: 0, ativo: true })
              }
            >
              Novo espaço
            </Botao>
          ) : undefined
        }
      />

      {carregando ? (
        <Cartao>
          <Esqueleto linhas={3} />
        </Cartao>
      ) : (espacos ?? []).length === 0 ? (
        <Cartao>
          <Vazio icone="espaco" titulo="Nenhum espaço cadastrado" />
        </Cartao>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {(espacos ?? []).map((e) => (
            <Cartao key={e.id} className="flex flex-col p-5">
              <div className="flex items-start justify-between gap-3">
                <span className="rounded-xl bg-mata-500/10 p-2.5 text-mata-700 dark:text-mata-300">
                  <Icone nome="espaco" />
                </span>
                {!e.ativo && (
                  <span className="selo bg-slate-100 text-slate-700 ring-slate-500/20 dark:bg-slate-500/10 dark:text-slate-300 dark:ring-slate-400/30">
                    Indisponível
                  </span>
                )}
              </div>

              <h2 className="mt-3.5 text-lg font-semibold">{e.nome}</h2>
              <p className="texto-suave mt-1.5 flex-1 text-sm leading-relaxed">{e.descricao}</p>

              <dl className="texto-suave mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs">
                <span className="inline-flex items-center gap-1.5">
                  <Icone nome="pessoas" className="h-3.5 w-3.5" />
                  Até {e.capacidade} pessoas
                </span>
                <span className="inline-flex items-center gap-1.5 font-semibold">
                  <Icone nome="dinheiro" className="h-3.5 w-3.5" />
                  {e.valor_locacao > 0 ? moeda(e.valor_locacao) : 'Uso gratuito'}
                </span>
              </dl>

              {e.regras && (
                <p className="texto-suave mt-3 rounded-lg bg-mata-500/5 px-3 py-2 text-xs leading-relaxed">
                  <strong className="font-semibold">Regras: </strong>
                  {e.regras}
                </p>
              )}

              <div className="mt-4 flex gap-2">
                {e.ativo && (
                  <Botao tamanho="pequeno" icone="calendario" onClick={() => setReservando(e)}>
                    Reservar
                  </Botao>
                )}
                {ehEquipe && (
                  <>
                    <Botao
                      variante="secundario"
                      tamanho="pequeno"
                      icone="editar"
                      onClick={() => setEditando(e)}
                    >
                      Editar
                    </Botao>
                    <Botao
                      variante="fantasma"
                      tamanho="pequeno"
                      icone="lixeira"
                      onClick={() => setExcluindo(e)}
                      aria-label={`Remover ${e.nome}`}
                    />
                  </>
                )}
              </div>
            </Cartao>
          ))}
        </div>
      )}

      {/* Reserva */}
      <Modal
        aberto={!!reservando}
        aoFechar={() => setReservando(null)}
        titulo={`Reservar: ${reservando?.nome ?? ''}`}
        rodape={
          <>
            <Botao variante="secundario" onClick={() => setReservando(null)}>
              Cancelar
            </Botao>
            <Botao onClick={confirmarReserva} carregando={salvando}>
              Solicitar reserva
            </Botao>
          </>
        }
      >
        <div className="space-y-4">
          {reservando && reservando.valor_locacao > 0 && (
            <div className="rounded-xl bg-terra-50 px-4 py-3 text-sm dark:bg-terra-900/20">
              Valor da locação: <strong>{moeda(reservando.valor_locacao)}</strong>, pago na sede
              até a data do evento.
            </div>
          )}

          <Campo
            rotulo="Data"
            type="date"
            required
            min={hojeIso()}
            value={form.data}
            onChange={(e) => setForm({ ...form, data: e.target.value })}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo
              rotulo="Início"
              type="time"
              required
              value={form.hora_inicio}
              onChange={(e) => setForm({ ...form, hora_inicio: e.target.value })}
            />
            <Campo
              rotulo="Término"
              type="time"
              required
              value={form.hora_fim}
              onChange={(e) => setForm({ ...form, hora_fim: e.target.value })}
            />
          </div>
          <Campo
            rotulo="Finalidade"
            placeholder="Ex.: Aniversário de 15 anos"
            value={form.finalidade}
            onChange={(e) => setForm({ ...form, finalidade: e.target.value })}
          />
          <Campo
            rotulo="Número de convidados"
            type="number"
            min={0}
            max={reservando?.capacidade ?? 999}
            value={form.numero_convidados}
            dica={reservando ? `Capacidade máxima: ${reservando.capacidade} pessoas.` : undefined}
            onChange={(e) => setForm({ ...form, numero_convidados: e.target.value })}
          />

          {(ocupadas ?? []).length > 0 && (
            <div>
              <p className="rotulo">Datas já reservadas</p>
              <ul className="space-y-1.5">
                {(ocupadas ?? []).map((r) => (
                  <li key={r.id} className="flex items-center justify-between gap-2 text-sm">
                    <span>
                      {dataBr(r.data)} · {horaBr(r.hora_inicio)} às {horaBr(r.hora_fim)}
                    </span>
                    <Selo rotulo={STATUS_RESERVA[r.status]} />
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </Modal>

      {/* Cadastro / edição (equipe) */}
      <Modal
        aberto={!!editando}
        aoFechar={() => setEditando(null)}
        titulo={editando?.id ? 'Editar espaço' : 'Novo espaço'}
        rodape={
          <>
            <Botao variante="secundario" onClick={() => setEditando(null)}>
              Cancelar
            </Botao>
            <Botao onClick={salvarEspaco} carregando={salvando}>
              Salvar
            </Botao>
          </>
        }
      >
        {editando && (
          <div className="space-y-4">
            <Campo
              rotulo="Nome"
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
            <div className="grid gap-4 sm:grid-cols-2">
              <Campo
                rotulo="Capacidade"
                type="number"
                min={0}
                value={String(editando.capacidade ?? 0)}
                onChange={(e) => setEditando({ ...editando, capacidade: Number(e.target.value) })}
              />
              <Campo
                rotulo="Valor da locação (R$)"
                type="number"
                min={0}
                step="0.01"
                value={String(editando.valor_locacao ?? 0)}
                onChange={(e) =>
                  setEditando({ ...editando, valor_locacao: Number(e.target.value) })
                }
              />
            </div>
            <Area
              rotulo="Regras de uso"
              rows={3}
              value={editando.regras ?? ''}
              onChange={(e) => setEditando({ ...editando, regras: e.target.value })}
            />
            <Alternador
              rotulo="Espaço disponível"
              marcado={editando.ativo ?? true}
              aoMudar={(v) => setEditando({ ...editando, ativo: v })}
            />
          </div>
        )}
      </Modal>

      <Confirmacao
        aberto={!!excluindo}
        titulo="Remover espaço"
        mensagem={`Remover "${excluindo?.nome}" também apaga as reservas vinculadas. Deseja continuar?`}
        textoConfirmar="Remover"
        perigo
        carregando={salvando}
        aoConfirmar={excluirEspaco}
        aoCancelar={() => setExcluindo(null)}
      />
    </div>
  )
}
