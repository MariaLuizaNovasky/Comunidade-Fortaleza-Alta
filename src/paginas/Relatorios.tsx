import { useMemo, useState } from 'react'
import { useConsulta } from '../lib/hooks'
import { mensagemErro, supabase } from '../lib/supabase'
import { baixarCsv, dataBr, moeda, numero } from '../lib/formato'
import { PRIORIDADES, STATUS_SOLICITACAO } from '../lib/constantes'
import type { Indicadores, SolicitacaoComRelacoes } from '../lib/tipos'
import { BarraPorSituacao, BarrasPorCategoria, BarrasPorMes } from '../componentes/Graficos'
import { Botao, Campo, Cartao, Carregando, Indicador, TituloPagina } from '../componentes/ui'

function inicioDoMes(meses = 5): string {
  const d = new Date()
  d.setMonth(d.getMonth() - meses, 1)
  return d.toISOString().slice(0, 10)
}

export default function Relatorios() {
  const [de, setDe] = useState(inicioDoMes())
  const [ate, setAte] = useState(new Date().toISOString().slice(0, 10))

  const { dados: indicadores, carregando } = useConsulta<Indicadores>(async () => {
    const { data, error } = await supabase.rpc('fn_indicadores_painel')
    if (error) throw new Error(mensagemErro(error))
    return data as unknown as Indicadores
  }, [])

  const { dados: periodo } = useConsulta<SolicitacaoComRelacoes[]>(async () => {
    const { data, error } = await supabase
      .from('solicitacoes')
      .select(
        '*, categoria:categorias_servico(id,nome,cor), morador:perfis!solicitacoes_morador_id_fkey(id,nome,telefone,rua,numero), responsavel:perfis!solicitacoes_responsavel_id_fkey(id,nome)',
      )
      .gte('criado_em', `${de}T00:00:00`)
      .lte('criado_em', `${ate}T23:59:59`)
      .order('criado_em', { ascending: false })
      .limit(2000)
    if (error) throw new Error(mensagemErro(error))
    return (data ?? []) as unknown as SolicitacaoComRelacoes[]
  }, [de, ate])

  const resumo = useMemo(() => {
    const lista = periodo ?? []
    const concluidas = lista.filter((s) => s.status === 'concluida')
    const avaliadas = lista.filter((s) => s.avaliacao !== null)
    const tempos = concluidas
      .filter((s) => s.concluida_em)
      .map(
        (s) =>
          (new Date(s.concluida_em!).getTime() - new Date(s.criado_em).getTime()) / 86_400_000,
      )

    return {
      total: lista.length,
      concluidas: concluidas.length,
      taxaConclusao: lista.length ? Math.round((concluidas.length / lista.length) * 100) : 0,
      tempoMedio: tempos.length
        ? (tempos.reduce((a, b) => a + b, 0) / tempos.length).toFixed(1)
        : '0',
      notaMedia: avaliadas.length
        ? (avaliadas.reduce((a, s) => a + (s.avaliacao ?? 0), 0) / avaliadas.length).toFixed(1)
        : '—',
      avaliadas: avaliadas.length,
    }
  }, [periodo])

  const porCategoria = useMemo(() => {
    const mapa = new Map<string, number>()
    for (const s of periodo ?? []) {
      const nome = s.categoria?.nome ?? 'Sem categoria'
      mapa.set(nome, (mapa.get(nome) ?? 0) + 1)
    }
    return [...mapa.entries()].map(([nome, total]) => ({ nome, total }))
  }, [periodo])

  const porSituacao = useMemo(() => {
    const mapa: Record<string, number> = {}
    for (const s of periodo ?? []) mapa[s.status] = (mapa[s.status] ?? 0) + 1
    return mapa
  }, [periodo])

  const exportarPeriodo = () =>
    baixarCsv(
      `relatorio-atendimentos-${de}-a-${ate}`,
      (periodo ?? []).map((s) => ({
        Protocolo: s.protocolo,
        Abertura: dataBr(s.criado_em),
        Título: s.titulo,
        Categoria: s.categoria?.nome ?? '',
        Situação: STATUS_SOLICITACAO[s.status].texto,
        Prioridade: PRIORIDADES[s.prioridade].texto,
        Morador: s.morador?.nome ?? '',
        Responsável: s.responsavel?.nome ?? '',
        'Concluído em': s.concluida_em ? dataBr(s.concluida_em) : '',
        Avaliação: s.avaliacao ?? '',
      })),
    )

  return (
    <div>
      <TituloPagina
        titulo="Relatórios"
        descricao="Indicadores de atendimento da associação, úteis para prestação de contas e assembleias."
        acao={
          <>
            <Botao variante="secundario" icone="baixar" onClick={exportarPeriodo}>
              Exportar período
            </Botao>
            <Botao variante="secundario" onClick={() => window.print()}>
              Imprimir
            </Botao>
          </>
        }
      />

      <Cartao className="sem-impressao mb-4 p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:max-w-xl">
          <Campo rotulo="De" type="date" value={de} onChange={(e) => setDe(e.target.value)} />
          <Campo rotulo="Até" type="date" value={ate} onChange={(e) => setAte(e.target.value)} />
        </div>
      </Cartao>

      <h2 className="mb-3 text-lg font-semibold">
        Período de {dataBr(de)} a {dataBr(ate)}
      </h2>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Indicador rotulo="Atendimentos" valor={numero(resumo.total)} icone="chamado" />
        <Indicador
          rotulo="Concluídos"
          valor={`${resumo.concluidas} (${resumo.taxaConclusao}%)`}
          icone="check"
        />
        <Indicador
          rotulo="Tempo médio"
          valor={`${resumo.tempoMedio} dias`}
          icone="relogio"
          detalhe="Da abertura à conclusão"
        />
        <Indicador
          rotulo="Satisfação"
          valor={resumo.notaMedia === '—' ? '—' : `${resumo.notaMedia} / 5`}
          icone="estrela"
          detalhe={`${resumo.avaliadas} avaliações`}
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Cartao className="p-5">
          <h3 className="mb-1 font-semibold">Situação no período</h3>
          <p className="texto-suave mb-5 text-sm">Distribuição dos atendimentos selecionados</p>
          <BarraPorSituacao dados={porSituacao} />
        </Cartao>

        <Cartao className="p-5">
          <h3 className="mb-1 font-semibold">Demandas por categoria</h3>
          <p className="texto-suave mb-5 text-sm">Onde o bairro mais precisa de atenção</p>
          <BarrasPorCategoria dados={porCategoria} limite={8} />
        </Cartao>
      </div>

      {carregando ? (
        <Carregando />
      ) : indicadores?.equipe ? (
        <>
          <h2 className="mb-3 mt-8 text-lg font-semibold">Visão geral da associação</h2>

          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            <Indicador
              rotulo="Moradores ativos"
              valor={indicadores.moradores_ativos}
              icone="moradores"
            />
            <Indicador
              rotulo="Inadimplentes"
              valor={indicadores.inadimplentes}
              icone="alerta"
              destaque={indicadores.inadimplentes > 0}
            />
            <Indicador
              rotulo="Recebido no mês"
              valor={moeda(indicadores.recebido_mes)}
              icone="dinheiro"
            />
            <Indicador rotulo="A receber" valor={moeda(indicadores.a_receber)} icone="financeiro" />
          </div>

          <Cartao className="mt-4 p-5">
            <h3 className="mb-1 font-semibold">Evolução dos atendimentos</h3>
            <p className="texto-suave mb-5 text-sm">Últimos seis meses, todos os registros</p>
            <BarrasPorMes dados={indicadores.por_mes} />
          </Cartao>
        </>
      ) : null}
    </div>
  )
}
