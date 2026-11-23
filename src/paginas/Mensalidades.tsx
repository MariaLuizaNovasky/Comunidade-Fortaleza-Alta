import { useMemo, useState } from 'react'
import { useAuth } from '../contextos/AuthContexto'
import { useAviso } from '../contextos/AvisoContexto'
import { useAtraso, useConsulta } from '../lib/hooks'
import { mensagemErro, supabase } from '../lib/supabase'
import { baixarCsv, dataBr, hojeIso, mesReferencia, moeda, semAcento } from '../lib/formato'
import { FORMAS_PAGAMENTO, STATUS_MENSALIDADE } from '../lib/constantes'
import type { MensalidadeComMorador, StatusMensalidade } from '../lib/tipos'
import { Icone } from '../componentes/Icone'
import {
  Botao,
  Campo,
  Cartao,
  Esqueleto,
  Indicador,
  Modal,
  Selecao,
  Selo,
  TituloPagina,
  Vazio,
} from '../componentes/ui'

export default function Mensalidades() {
  const { ehEquipe } = useAuth()
  const aviso = useAviso()

  const [busca, setBusca] = useState('')
  const [status, setStatus] = useState<'todas' | StatusMensalidade>('todas')
  const [modalGerar, setModalGerar] = useState(false)
  const [referencia, setReferencia] = useState(hojeIso().slice(0, 7))
  const [baixando, setBaixando] = useState<MensalidadeComMorador | null>(null)
  const [formaPagamento, setFormaPagamento] = useState(FORMAS_PAGAMENTO[1])
  const [dataPagamento, setDataPagamento] = useState(hojeIso())
  const [salvando, setSalvando] = useState(false)
  const buscaAdiada = useAtraso(busca)

  const { dados, carregando, recarregar } = useConsulta<MensalidadeComMorador[]>(async () => {
    let consulta = supabase
      .from('mensalidades')
      .select('*, morador:perfis(id,nome,rua,numero)')
      .order('referencia', { ascending: false })
      .limit(500)
    if (status !== 'todas') consulta = consulta.eq('status', status)
    const { data, error } = await consulta
    if (error) throw new Error(mensagemErro(error))
    return (data ?? []) as unknown as MensalidadeComMorador[]
  }, [status])

  const filtradas = useMemo(() => {
    if (!dados) return []
    const termo = semAcento(buscaAdiada.trim())
    if (!termo) return dados
    return dados.filter((m) => semAcento(m.morador?.nome ?? '').includes(termo))
  }, [dados, buscaAdiada])

  const resumo = useMemo(() => {
    const base = filtradas
    return {
      total: base.reduce((s, m) => s + Number(m.valor), 0),
      pago: base.filter((m) => m.status === 'paga').reduce((s, m) => s + Number(m.valor), 0),
      aberto: base
        .filter((m) => m.status === 'pendente' || m.status === 'atrasada')
        .reduce((s, m) => s + Number(m.valor), 0),
      atrasadas: base.filter((m) => m.status === 'atrasada').length,
    }
  }, [filtradas])

  async function gerarMensalidades() {
    setSalvando(true)
    try {
      const { data, error } = await supabase.rpc('fn_gerar_mensalidades', {
        p_referencia: `${referencia}-01`,
      })
      if (error) throw new Error(mensagemErro(error))
      aviso.sucesso(
        data === 0
          ? 'Nenhuma mensalidade nova: todas já estavam geradas para este mês.'
          : `${data} mensalidade(s) gerada(s) para ${mesReferencia(`${referencia}-01`)}.`,
      )
      setModalGerar(false)
      recarregar()
    } catch (e) {
      aviso.erro(e instanceof Error ? e.message : 'Não foi possível gerar as mensalidades.')
    } finally {
      setSalvando(false)
    }
  }

  async function registrarPagamento() {
    if (!baixando) return
    setSalvando(true)
    try {
      const { error } = await supabase
        .from('mensalidades')
        .update({
          status: 'paga',
          pago_em: dataPagamento,
          forma_pagamento: formaPagamento,
        })
        .eq('id', baixando.id)
      if (error) throw new Error(mensagemErro(error))
      aviso.sucesso('Pagamento registrado.')
      setBaixando(null)
      recarregar()
    } catch (e) {
      aviso.erro(e instanceof Error ? e.message : 'Não foi possível registrar o pagamento.')
    } finally {
      setSalvando(false)
    }
  }

  async function atualizarAtrasadas() {
    try {
      const { data, error } = await supabase.rpc('fn_atualizar_mensalidades_atrasadas')
      if (error) throw new Error(mensagemErro(error))
      aviso.info(`${data ?? 0} mensalidade(s) marcada(s) como atrasada(s).`)
      recarregar()
    } catch (e) {
      aviso.erro(e instanceof Error ? e.message : 'Não foi possível atualizar.')
    }
  }

  const exportar = () =>
    baixarCsv(
      `mensalidades-${new Date().toISOString().slice(0, 10)}`,
      filtradas.map((m) => ({
        Morador: m.morador?.nome ?? '',
        Endereço: [m.morador?.rua, m.morador?.numero].filter(Boolean).join(', '),
        Referência: mesReferencia(m.referencia),
        Valor: m.valor,
        Vencimento: dataBr(m.vencimento),
        Situação: STATUS_MENSALIDADE[m.status].texto,
        'Pago em': m.pago_em ? dataBr(m.pago_em) : '',
        Forma: m.forma_pagamento ?? '',
      })),
    )

  return (
    <div>
      <TituloPagina
        titulo="Mensalidades"
        descricao={
          ehEquipe
            ? 'Controle das contribuições mensais dos associados.'
            : 'Suas contribuições com a associação de moradores.'
        }
        acao={
          ehEquipe ? (
            <>
              <Botao variante="secundario" icone="atualizar" onClick={atualizarAtrasadas}>
                Marcar atrasos
              </Botao>
              {filtradas.length > 0 && (
                <Botao variante="secundario" icone="baixar" onClick={exportar}>
                  Exportar
                </Botao>
              )}
              <Botao icone="mais" onClick={() => setModalGerar(true)}>
                Gerar mês
              </Botao>
            </>
          ) : undefined
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Indicador rotulo="Total no período" valor={moeda(resumo.total)} icone="financeiro" />
        <Indicador rotulo="Recebido" valor={moeda(resumo.pago)} icone="check" />
        <Indicador
          rotulo="Em aberto"
          valor={moeda(resumo.aberto)}
          icone="dinheiro"
          destaque={resumo.aberto > 0}
        />
        <Indicador
          rotulo="Atrasadas"
          valor={resumo.atrasadas}
          icone="alerta"
          destaque={resumo.atrasadas > 0}
        />
      </div>

      <Cartao className="sem-impressao mb-4 p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          {ehEquipe && (
            <Campo
              placeholder="Buscar morador"
              icone="busca"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              aria-label="Buscar morador"
            />
          )}
          <Selecao
            value={status}
            onChange={(e) => setStatus(e.target.value as typeof status)}
            aria-label="Filtrar por situação"
          >
            <option value="todas">Todas as situações</option>
            {(Object.keys(STATUS_MENSALIDADE) as StatusMensalidade[]).map((s) => (
              <option key={s} value={s}>
                {STATUS_MENSALIDADE[s].texto}
              </option>
            ))}
          </Selecao>
        </div>
      </Cartao>

      {carregando ? (
        <Cartao>
          <Esqueleto linhas={5} />
        </Cartao>
      ) : filtradas.length === 0 ? (
        <Cartao>
          <Vazio
            icone="financeiro"
            titulo="Nenhuma mensalidade"
            descricao={
              ehEquipe
                ? 'Use “Gerar mês” para criar as mensalidades de todos os associados ativos.'
                : 'Você ainda não possui mensalidades registradas.'
            }
          />
        </Cartao>
      ) : (
        <Cartao>
          <ul className="divide-y" style={{ borderColor: 'var(--borda)' }}>
            {filtradas.map((m) => (
              <li key={m.id} className="flex flex-wrap items-center gap-4 px-5 py-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">
                      {ehEquipe ? (m.morador?.nome ?? 'Morador removido') : mesReferencia(m.referencia)}
                    </p>
                    <Selo rotulo={STATUS_MENSALIDADE[m.status]} />
                  </div>
                  <p className="texto-suave mt-1 text-sm">
                    {ehEquipe && `${mesReferencia(m.referencia)} · `}
                    Vencimento {dataBr(m.vencimento)}
                    {m.pago_em && ` · Pago em ${dataBr(m.pago_em)}`}
                    {m.forma_pagamento && ` (${m.forma_pagamento})`}
                  </p>
                  {ehEquipe && m.morador?.rua && (
                    <p className="texto-suave mt-0.5 inline-flex items-center gap-1.5 text-xs">
                      <Icone nome="local" className="h-3.5 w-3.5" />
                      {[m.morador.rua, m.morador.numero].filter(Boolean).join(', ')}
                    </p>
                  )}
                </div>

                <p className="shrink-0 text-lg font-bold tabular-nums">{moeda(m.valor)}</p>

                {ehEquipe && m.status !== 'paga' && m.status !== 'isenta' && (
                  <Botao
                    tamanho="pequeno"
                    icone="check"
                    className="sem-impressao"
                    onClick={() => {
                      setBaixando(m)
                      setDataPagamento(hojeIso())
                    }}
                  >
                    Dar baixa
                  </Botao>
                )}
              </li>
            ))}
          </ul>
        </Cartao>
      )}

      {!ehEquipe && filtradas.some((m) => m.status !== 'paga' && m.status !== 'isenta') && (
        <Cartao className="mt-4 p-5">
          <h2 className="font-semibold">Como pagar</h2>
          <p className="texto-suave mt-1.5 text-sm leading-relaxed">
            O pagamento pode ser feito na sede da associação, no horário de atendimento, ou
            por PIX. Após o pagamento, a diretoria registra a baixa e a situação é atualizada
            aqui automaticamente.
          </p>
        </Cartao>
      )}

      {/* Gerar mensalidades do mês */}
      <Modal
        aberto={modalGerar}
        aoFechar={() => setModalGerar(false)}
        titulo="Gerar mensalidades do mês"
        rodape={
          <>
            <Botao variante="secundario" onClick={() => setModalGerar(false)}>
              Cancelar
            </Botao>
            <Botao onClick={gerarMensalidades} carregando={salvando}>
              Gerar
            </Botao>
          </>
        }
      >
        <div className="space-y-4">
          <Campo
            rotulo="Mês de referência"
            type="month"
            value={referencia}
            onChange={(e) => setReferencia(e.target.value)}
          />
          <p className="texto-suave text-sm leading-relaxed">
            Serão criadas mensalidades para todos os moradores ativos, usando o valor e o dia
            de vencimento definidos em Configurações. Quem já tiver a mensalidade deste mês
            não será duplicado.
          </p>
        </div>
      </Modal>

      {/* Baixa de pagamento */}
      <Modal
        aberto={!!baixando}
        aoFechar={() => setBaixando(null)}
        titulo="Registrar pagamento"
        rodape={
          <>
            <Botao variante="secundario" onClick={() => setBaixando(null)}>
              Cancelar
            </Botao>
            <Botao onClick={registrarPagamento} carregando={salvando}>
              Confirmar pagamento
            </Botao>
          </>
        }
      >
        {baixando && (
          <div className="space-y-4">
            <div className="rounded-xl bg-mata-500/8 px-4 py-3 text-sm">
              <strong>{baixando.morador?.nome}</strong> · {mesReferencia(baixando.referencia)} ·{' '}
              {moeda(baixando.valor)}
            </div>
            <Campo
              rotulo="Data do pagamento"
              type="date"
              value={dataPagamento}
              onChange={(e) => setDataPagamento(e.target.value)}
            />
            <Selecao
              rotulo="Forma de pagamento"
              value={formaPagamento}
              onChange={(e) => setFormaPagamento(e.target.value)}
            >
              {FORMAS_PAGAMENTO.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </Selecao>
          </div>
        )}
      </Modal>
    </div>
  )
}
