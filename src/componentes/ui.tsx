import {
  forwardRef,
  useEffect,
  useId,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react'
import { Icone, type NomeIcone } from './Icone'
import type { Rotulo } from '../lib/constantes'

// ---------------------------------------------------------------
// Botão
// ---------------------------------------------------------------
type VarianteBotao = 'primario' | 'secundario' | 'suave' | 'perigo' | 'fantasma'

const VARIANTES: Record<VarianteBotao, string> = {
  primario: 'bg-mata-700 text-white hover:bg-mata-800 active:bg-mata-900 shadow-sm',
  secundario:
    'superficie border text-[color:var(--texto)] hover:bg-mata-500/10 active:bg-mata-500/15',
  suave: 'bg-mata-500/10 text-mata-800 hover:bg-mata-500/20 dark:text-mata-200',
  perigo: 'bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800 shadow-sm',
  fantasma: 'text-[color:var(--texto)] hover:bg-mata-500/10',
}

interface PropsBotao extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: VarianteBotao
  icone?: NomeIcone
  carregando?: boolean
  blocoCompleto?: boolean
  tamanho?: 'pequeno' | 'normal'
}

export function Botao({
  variante = 'primario',
  icone,
  carregando = false,
  blocoCompleto = false,
  tamanho = 'normal',
  children,
  className = '',
  disabled,
  ...resto
}: PropsBotao) {
  return (
    <button
      {...resto}
      disabled={disabled || carregando}
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition
        disabled:cursor-not-allowed disabled:opacity-55
        ${tamanho === 'pequeno' ? 'px-3 py-1.5 text-sm' : 'px-4 py-2.5 text-[15px]'}
        ${VARIANTES[variante]} ${blocoCompleto ? 'w-full' : ''} ${className}`}
    >
      {carregando ? (
        <svg viewBox="0 0 24 24" className="h-4 w-4 animate-spin" aria-hidden="true">
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" fill="none" opacity=".25" />
          <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" />
        </svg>
      ) : icone ? (
        <Icone nome={icone} className="h-[18px] w-[18px]" />
      ) : null}
      {children}
    </button>
  )
}

// ---------------------------------------------------------------
// Campos de formulário
// ---------------------------------------------------------------
interface PropsCampo extends InputHTMLAttributes<HTMLInputElement> {
  rotulo?: string
  erro?: string
  dica?: string
  icone?: NomeIcone
}

export const Campo = forwardRef<HTMLInputElement, PropsCampo>(function Campo(
  { rotulo, erro, dica, icone, className = '', id, ...resto },
  ref,
) {
  const idGerado = useId()
  const idCampo = id ?? idGerado
  return (
    <div className={className}>
      {rotulo && (
        <label htmlFor={idCampo} className="rotulo">
          {rotulo}
          {resto.required && <span className="ml-0.5 text-rose-600">*</span>}
        </label>
      )}
      <div className="relative">
        {icone && (
          <Icone
            nome={icone}
            className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400"
          />
        )}
        <input
          {...resto}
          ref={ref}
          id={idCampo}
          aria-invalid={!!erro}
          aria-describedby={erro ? `${idCampo}-erro` : dica ? `${idCampo}-dica` : undefined}
          className={`campo ${icone ? 'pl-10' : ''} ${erro ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/15' : ''}`}
        />
      </div>
      {erro ? (
        <p id={`${idCampo}-erro`} className="mt-1.5 text-sm font-medium text-rose-600">
          {erro}
        </p>
      ) : dica ? (
        <p id={`${idCampo}-dica`} className="texto-suave mt-1.5 text-sm">
          {dica}
        </p>
      ) : null}
    </div>
  )
})

interface PropsArea extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  rotulo?: string
  erro?: string
  dica?: string
}

export function Area({ rotulo, erro, dica, className = '', id, ...resto }: PropsArea) {
  const idGerado = useId()
  const idCampo = id ?? idGerado
  return (
    <div className={className}>
      {rotulo && (
        <label htmlFor={idCampo} className="rotulo">
          {rotulo}
          {resto.required && <span className="ml-0.5 text-rose-600">*</span>}
        </label>
      )}
      <textarea
        {...resto}
        id={idCampo}
        aria-invalid={!!erro}
        className={`campo resize-y ${erro ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/15' : ''}`}
      />
      {erro ? (
        <p className="mt-1.5 text-sm font-medium text-rose-600">{erro}</p>
      ) : dica ? (
        <p className="texto-suave mt-1.5 text-sm">{dica}</p>
      ) : null}
    </div>
  )
}

interface PropsSelecao extends SelectHTMLAttributes<HTMLSelectElement> {
  rotulo?: string
  erro?: string
  children: ReactNode
}

export function Selecao({ rotulo, erro, className = '', id, children, ...resto }: PropsSelecao) {
  const idGerado = useId()
  const idCampo = id ?? idGerado
  return (
    <div className={className}>
      {rotulo && (
        <label htmlFor={idCampo} className="rotulo">
          {rotulo}
          {resto.required && <span className="ml-0.5 text-rose-600">*</span>}
        </label>
      )}
      <select
        {...resto}
        id={idCampo}
        className={`campo cursor-pointer appearance-none bg-[length:18px] bg-[right_0.75rem_center] bg-no-repeat pr-10
          ${erro ? 'border-rose-400' : ''}`}
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
        }}
      >
        {children}
      </select>
      {erro && <p className="mt-1.5 text-sm font-medium text-rose-600">{erro}</p>}
    </div>
  )
}

export function Alternador({
  rotulo,
  descricao,
  marcado,
  aoMudar,
  desabilitado,
}: {
  rotulo: string
  descricao?: string
  marcado: boolean
  aoMudar: (v: boolean) => void
  desabilitado?: boolean
}) {
  return (
    <label className={`flex items-start gap-3 ${desabilitado ? 'opacity-60' : 'cursor-pointer'}`}>
      <button
        type="button"
        role="switch"
        aria-checked={marcado}
        disabled={desabilitado}
        onClick={() => aoMudar(!marcado)}
        className={`mt-0.5 h-6 w-11 shrink-0 rounded-full p-0.5 transition
          ${marcado ? 'bg-mata-700' : 'bg-slate-300 dark:bg-slate-600'}`}
      >
        <span
          className={`block h-5 w-5 rounded-full bg-white shadow transition-transform
            ${marcado ? 'translate-x-5' : 'translate-x-0'}`}
        />
      </button>
      <span>
        <span className="block text-sm font-medium">{rotulo}</span>
        {descricao && <span className="texto-suave block text-sm">{descricao}</span>}
      </span>
    </label>
  )
}

// ---------------------------------------------------------------
// Blocos de conteúdo
// ---------------------------------------------------------------
export function Cartao({
  children,
  className = '',
  ...resto
}: { children: ReactNode; className?: string } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div {...resto} className={`cartao ${className}`}>
      {children}
    </div>
  )
}

export function Selo({ rotulo, className = '' }: { rotulo: Rotulo; className?: string }) {
  return (
    <span className={`selo ${rotulo.classe} ${className}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${rotulo.ponto}`} />
      {rotulo.texto}
    </span>
  )
}

export function TituloPagina({
  titulo,
  descricao,
  acao,
}: {
  titulo: string
  descricao?: string
  acao?: ReactNode
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-[28px]">{titulo}</h1>
        {descricao && <p className="texto-suave mt-1 max-w-2xl text-[15px]">{descricao}</p>}
      </div>
      {acao && <div className="sem-impressao flex shrink-0 gap-2">{acao}</div>}
    </div>
  )
}

export function Vazio({
  icone = 'busca',
  titulo,
  descricao,
  acao,
}: {
  icone?: NomeIcone
  titulo: string
  descricao?: string
  acao?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="mb-4 rounded-2xl bg-mata-500/10 p-4 text-mata-700 dark:text-mata-300">
        <Icone nome={icone} className="h-7 w-7" />
      </div>
      <h3 className="text-lg font-semibold">{titulo}</h3>
      {descricao && <p className="texto-suave mt-1.5 max-w-md text-[15px]">{descricao}</p>}
      {acao && <div className="mt-5">{acao}</div>}
    </div>
  )
}

export function Carregando({ texto = 'Carregando…' }: { texto?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-[color:var(--texto-suave)]">
      <svg viewBox="0 0 24 24" className="h-5 w-5 animate-spin" aria-hidden="true">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" fill="none" opacity=".25" />
        <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" />
      </svg>
      <span className="text-sm font-medium">{texto}</span>
    </div>
  )
}

export function Esqueleto({ linhas = 3 }: { linhas?: number }) {
  return (
    <div className="space-y-3 p-4" aria-hidden="true">
      {Array.from({ length: linhas }).map((_, i) => (
        <div key={i} className="h-14 animate-pulse rounded-xl bg-slate-200/70 dark:bg-slate-700/40" />
      ))}
    </div>
  )
}

// ---------------------------------------------------------------
// Modal
// ---------------------------------------------------------------
export function Modal({
  aberto,
  aoFechar,
  titulo,
  children,
  rodape,
  largura = 'max-w-lg',
}: {
  aberto: boolean
  aoFechar: () => void
  titulo: string
  children: ReactNode
  rodape?: ReactNode
  largura?: string
}) {
  useEffect(() => {
    if (!aberto) return
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') aoFechar()
    }
    document.addEventListener('keydown', aoTeclar)
    const overflowAnterior = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', aoTeclar)
      document.body.style.overflow = overflowAnterior
    }
  }, [aberto, aoFechar])

  if (!aberto) return null

  return (
    <div className="sem-impressao fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div
        className="absolute inset-0 bg-mata-950/50 backdrop-blur-sm"
        onClick={aoFechar}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        className={`superficie relative z-10 max-h-[92vh] w-full ${largura} animate-sobe-suave
          overflow-y-auto rounded-t-3xl border shadow-cartao sm:rounded-2xl`}
      >
        <div className="superficie sticky top-0 z-10 flex items-center justify-between gap-4 border-b px-5 py-4">
          <h2 className="text-lg font-semibold">{titulo}</h2>
          <button
            type="button"
            onClick={aoFechar}
            className="rounded-lg p-1.5 transition hover:bg-mata-500/10"
            aria-label="Fechar"
          >
            <Icone nome="fechar" className="h-5 w-5" />
          </button>
        </div>
        <div className="px-5 py-5">{children}</div>
        {rodape && (
          <div className="superficie sticky bottom-0 flex flex-wrap justify-end gap-2 border-t px-5 py-4">
            {rodape}
          </div>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------
// Avaliação por estrelas
// ---------------------------------------------------------------
export function Estrelas({
  nota,
  aoEscolher,
  tamanho = 'h-6 w-6',
}: {
  nota: number
  aoEscolher?: (n: number) => void
  tamanho?: string
}) {
  return (
    <div className="flex gap-1" role={aoEscolher ? 'radiogroup' : undefined}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={!aoEscolher}
          onClick={() => aoEscolher?.(n)}
          aria-label={`${n} ${n === 1 ? 'estrela' : 'estrelas'}`}
          aria-checked={aoEscolher ? nota === n : undefined}
          role={aoEscolher ? 'radio' : undefined}
          className={`transition ${aoEscolher ? 'cursor-pointer hover:scale-110' : 'cursor-default'}
            ${n <= nota ? 'text-terra-400' : 'text-slate-300 dark:text-slate-600'}`}
        >
          <Icone nome="estrela" className={tamanho} preenchido={n <= nota} />
        </button>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------
// Indicador numérico do painel
// ---------------------------------------------------------------
export function Indicador({
  rotulo,
  valor,
  icone,
  detalhe,
  destaque = false,
}: {
  rotulo: string
  valor: string | number
  icone: NomeIcone
  detalhe?: string
  destaque?: boolean
}) {
  return (
    <Cartao className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="texto-suave text-[12px] font-medium uppercase leading-tight tracking-wide sm:text-[13px]">
            {rotulo}
          </p>
          <p
            className={`mt-1.5 whitespace-nowrap text-xl font-bold sm:text-2xl ${
              destaque ? 'text-rose-600 dark:text-rose-400' : ''
            }`}
          >
            {valor}
          </p>
          {detalhe && <p className="texto-suave mt-1 text-sm">{detalhe}</p>}
        </div>
        <span
          className={`hidden shrink-0 rounded-xl p-2.5 sm:block ${
            destaque
              ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
              : 'bg-mata-500/10 text-mata-700 dark:text-mata-300'
          }`}
        >
          <Icone nome={icone} />
        </span>
      </div>
    </Cartao>
  )
}

// ---------------------------------------------------------------
// Paginação
// ---------------------------------------------------------------
export function Paginacao({
  pagina,
  totalPaginas,
  aoMudar,
  totalItens,
}: {
  pagina: number
  totalPaginas: number
  aoMudar: (p: number) => void
  totalItens: number
}) {
  if (totalPaginas <= 1) return null
  return (
    <div className="sem-impressao flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3"
         style={{ borderColor: 'var(--borda)' }}>
      <p className="texto-suave text-sm">
        Página {pagina} de {totalPaginas} · {totalItens} {totalItens === 1 ? 'registro' : 'registros'}
      </p>
      <div className="flex gap-2">
        <Botao
          variante="secundario"
          tamanho="pequeno"
          onClick={() => aoMudar(pagina - 1)}
          disabled={pagina <= 1}
        >
          Anterior
        </Botao>
        <Botao
          variante="secundario"
          tamanho="pequeno"
          onClick={() => aoMudar(pagina + 1)}
          disabled={pagina >= totalPaginas}
        >
          Próxima
        </Botao>
      </div>
    </div>
  )
}

export function Confirmacao({
  aberto,
  titulo,
  mensagem,
  textoConfirmar = 'Confirmar',
  perigo = false,
  carregando = false,
  aoConfirmar,
  aoCancelar,
}: {
  aberto: boolean
  titulo: string
  mensagem: string
  textoConfirmar?: string
  perigo?: boolean
  carregando?: boolean
  aoConfirmar: () => void
  aoCancelar: () => void
}) {
  return (
    <Modal
      aberto={aberto}
      aoFechar={aoCancelar}
      titulo={titulo}
      largura="max-w-md"
      rodape={
        <>
          <Botao variante="secundario" onClick={aoCancelar}>
            Cancelar
          </Botao>
          <Botao variante={perigo ? 'perigo' : 'primario'} onClick={aoConfirmar} carregando={carregando}>
            {textoConfirmar}
          </Botao>
        </>
      }
    >
      <p className="text-[15px] leading-relaxed">{mensagem}</p>
    </Modal>
  )
}
