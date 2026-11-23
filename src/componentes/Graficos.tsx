import { useId, useState } from 'react'
import type { StatusSolicitacao } from '../lib/tipos'
import { STATUS_SOLICITACAO } from '../lib/constantes'

/** Cor de cada situação (tokens validados em `index.css`). */
export const COR_STATUS: Record<StatusSolicitacao, string> = {
  aberta: 'var(--viz-aberta)',
  em_analise: 'var(--viz-analise)',
  em_andamento: 'var(--viz-andamento)',
  aguardando_morador: 'var(--viz-aguardando)',
  concluida: 'var(--viz-concluida)',
  cancelada: 'var(--viz-cancelada)',
}

function Dica({ texto, x, y }: { texto: string; x: number; y: number }) {
  return (
    <div
      className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs font-semibold shadow-cartao"
      style={{
        left: `${x}%`,
        top: `${y}px`,
        background: 'var(--viz-tinta)',
        color: 'var(--viz-superficie)',
      }}
      role="tooltip"
    >
      {texto}
    </div>
  )
}

// ---------------------------------------------------------------
// Barras verticais — uma série (ex.: atendimentos por mês)
// ---------------------------------------------------------------
export function BarrasPorMes({
  dados,
  rotuloValor = 'atendimentos',
}: {
  dados: { mes: string; total: number }[]
  rotuloValor?: string
}) {
  const [ativo, setAtivo] = useState<number | null>(null)
  const maximo = Math.max(1, ...dados.map((d) => d.total))
  const idTabela = useId()

  const nomeMes = (iso: string) => {
    const [ano, mes] = iso.split('-')
    const data = new Date(Number(ano), Number(mes) - 1, 1)
    return data.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')
  }

  if (dados.length === 0) {
    return <p className="texto-suave py-10 text-center text-sm">Sem dados no período.</p>
  }

  return (
    <div className="viz">
      <div className="relative flex h-48 items-end gap-2 sm:gap-3">
        {/* linha de base recessiva */}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-[22px] h-px"
          style={{ background: 'var(--viz-grade)' }}
          aria-hidden="true"
        />
        {dados.map((d, i) => {
          const altura = (d.total / maximo) * 100
          return (
            <div
              key={d.mes}
              className="relative flex h-full flex-1 flex-col justify-end"
              onMouseEnter={() => setAtivo(i)}
              onMouseLeave={() => setAtivo(null)}
              onFocus={() => setAtivo(i)}
              onBlur={() => setAtivo(null)}
              tabIndex={0}
            >
              {ativo === i && (
                <Dica
                  x={50}
                  y={-6}
                  texto={`${nomeMes(d.mes)}: ${d.total} ${rotuloValor}`}
                />
              )}
              <div className="flex h-[calc(100%-22px)] items-end">
                <div
                  className="w-full rounded-t transition-[height,opacity]"
                  style={{
                    height: `${Math.max(altura, d.total > 0 ? 3 : 0)}%`,
                    background: 'var(--viz-serie)',
                    opacity: ativo === null || ativo === i ? 1 : 0.55,
                    borderTopLeftRadius: 4,
                    borderTopRightRadius: 4,
                  }}
                />
              </div>
              <span
                className="mt-1.5 block text-center text-[11px] font-semibold"
                style={{ color: 'var(--viz-tinta-suave)' }}
              >
                {nomeMes(d.mes)}
              </span>
            </div>
          )
        })}
      </div>

      {/* Alternativa textual acessível */}
      <table className="sr-only" id={idTabela}>
        <caption>Atendimentos por mês</caption>
        <tbody>
          {dados.map((d) => (
            <tr key={d.mes}>
              <th scope="row">{d.mes}</th>
              <td>{d.total}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ---------------------------------------------------------------
// Barras horizontais — magnitude por categoria, com valor visível
// ---------------------------------------------------------------
export function BarrasPorCategoria({
  dados,
  limite = 6,
}: {
  dados: { nome: string; total: number }[]
  limite?: number
}) {
  const ordenado = [...dados].sort((a, b) => b.total - a.total)
  const principais = ordenado.slice(0, limite)
  const resto = ordenado.slice(limite)
  const lista =
    resto.length > 0
      ? [...principais, { nome: 'Outras', total: resto.reduce((s, d) => s + d.total, 0) }]
      : principais

  const maximo = Math.max(1, ...lista.map((d) => d.total))

  if (lista.length === 0) {
    return <p className="texto-suave py-10 text-center text-sm">Nenhum atendimento registrado.</p>
  }

  return (
    <div className="viz space-y-3">
      {lista.map((d) => (
        <div key={d.nome}>
          <div className="mb-1 flex items-baseline justify-between gap-3">
            <span className="truncate text-sm font-medium" style={{ color: 'var(--viz-tinta)' }}>
              {d.nome}
            </span>
            {/* valor sempre visível: atende à exigência de rótulo direto */}
            <span className="shrink-0 text-sm font-bold tabular-nums" style={{ color: 'var(--viz-tinta)' }}>
              {d.total}
            </span>
          </div>
          <div
            className="h-2.5 w-full overflow-hidden rounded-full"
            style={{ background: 'var(--viz-serie-fraca)' }}
          >
            <div
              className="h-full rounded-full transition-[width]"
              style={{ width: `${(d.total / maximo) * 100}%`, background: 'var(--viz-serie)' }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------
// Barra segmentada — distribuição por situação
// ---------------------------------------------------------------
export function BarraPorSituacao({
  dados,
}: {
  dados: Partial<Record<StatusSolicitacao, number>>
}) {
  const [ativo, setAtivo] = useState<StatusSolicitacao | null>(null)
  const entradas = (Object.keys(STATUS_SOLICITACAO) as StatusSolicitacao[])
    .map((s) => ({ status: s, total: dados[s] ?? 0 }))
    .filter((e) => e.total > 0)

  const total = entradas.reduce((s, e) => s + e.total, 0)

  if (total === 0) {
    return <p className="texto-suave py-10 text-center text-sm">Nenhum atendimento registrado.</p>
  }

  return (
    <div className="viz">
      <div className="flex h-5 w-full gap-[2px] overflow-hidden rounded-full">
        {entradas.map((e) => (
          <div
            key={e.status}
            title={`${STATUS_SOLICITACAO[e.status].texto}: ${e.total}`}
            onMouseEnter={() => setAtivo(e.status)}
            onMouseLeave={() => setAtivo(null)}
            className="h-full transition-opacity first:rounded-l-full last:rounded-r-full"
            style={{
              width: `${(e.total / total) * 100}%`,
              background: COR_STATUS[e.status],
              opacity: ativo === null || ativo === e.status ? 1 : 0.5,
            }}
          />
        ))}
      </div>

      {/* Legenda com contagem: identidade nunca depende só da cor */}
      <ul className="mt-4 grid grid-cols-1 gap-y-2">
        {entradas.map((e) => (
          <li
            key={e.status}
            className="flex items-center justify-between gap-2 text-sm"
            onMouseEnter={() => setAtivo(e.status)}
            onMouseLeave={() => setAtivo(null)}
          >
            <span className="flex min-w-0 items-center gap-2">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-sm"
                style={{ background: COR_STATUS[e.status] }}
              />
              <span className="truncate" style={{ color: 'var(--viz-tinta)' }}>
                {STATUS_SOLICITACAO[e.status].texto}
              </span>
            </span>
            <span className="shrink-0 font-bold tabular-nums" style={{ color: 'var(--viz-tinta)' }}>
              {e.total}
              <span className="ml-1 font-normal" style={{ color: 'var(--viz-tinta-suave)' }}>
                ({Math.round((e.total / total) * 100)}%)
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
