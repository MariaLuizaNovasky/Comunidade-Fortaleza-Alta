import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'

type TipoAviso = 'sucesso' | 'erro' | 'info'

interface Aviso {
  id: number
  tipo: TipoAviso
  texto: string
}

interface ContextoAviso {
  sucesso: (texto: string) => void
  erro: (texto: string) => void
  info: (texto: string) => void
}

const Contexto = createContext<ContextoAviso | null>(null)

const ESTILOS: Record<TipoAviso, { caixa: string; icone: ReactNode }> = {
  sucesso: {
    caixa: 'border-mata-300 bg-mata-50 text-mata-900 dark:border-mata-700 dark:bg-mata-900 dark:text-mata-50',
    icone: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 shrink-0 text-mata-600 dark:text-mata-300">
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
  erro: {
    caixa: 'border-rose-300 bg-rose-50 text-rose-900 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-100',
    icone: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 shrink-0 text-rose-600 dark:text-rose-400">
        <path
          fillRule="evenodd"
          d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8-5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 10 5Zm0 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
  info: {
    caixa: 'border-sky-300 bg-sky-50 text-sky-900 dark:border-sky-800 dark:bg-sky-950 dark:text-sky-100',
    icone: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 shrink-0 text-sky-600 dark:text-sky-400">
        <path
          fillRule="evenodd"
          d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8-4a1 1 0 1 1 0 2 1 1 0 0 1 0-2Zm.75 4.25a.75.75 0 0 0-1.5 0v4a.75.75 0 0 0 1.5 0v-4Z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
}

export function ProvedorAviso({ children }: { children: ReactNode }) {
  const [avisos, setAvisos] = useState<Aviso[]>([])

  const adicionar = useCallback((tipo: TipoAviso, texto: string) => {
    const id = Date.now() + Math.random()
    setAvisos((atual) => [...atual, { id, tipo, texto }])
    setTimeout(() => setAvisos((atual) => atual.filter((a) => a.id !== id)), 5000)
  }, [])

  const valor: ContextoAviso = {
    sucesso: (t) => adicionar('sucesso', t),
    erro: (t) => adicionar('erro', t),
    info: (t) => adicionar('info', t),
  }

  return (
    <Contexto.Provider value={valor}>
      {children}
      <div
        className="sem-impressao pointer-events-none fixed inset-x-0 top-3 z-[100] flex flex-col items-center gap-2 px-3 sm:inset-x-auto sm:right-4 sm:items-end"
        role="status"
        aria-live="polite"
      >
        {avisos.map((aviso) => (
          <div
            key={aviso.id}
            className={`pointer-events-auto flex w-full max-w-sm animate-entra-direita items-start gap-3 rounded-xl border px-4 py-3 text-sm font-medium shadow-cartao ${ESTILOS[aviso.tipo].caixa}`}
          >
            {ESTILOS[aviso.tipo].icone}
            <span className="flex-1">{aviso.texto}</span>
            <button
              type="button"
              onClick={() => setAvisos((a) => a.filter((x) => x.id !== aviso.id))}
              className="shrink-0 opacity-50 transition hover:opacity-100"
              aria-label="Fechar aviso"
            >
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </Contexto.Provider>
  )
}

export function useAviso(): ContextoAviso {
  const ctx = useContext(Contexto)
  if (!ctx) throw new Error('useAviso precisa estar dentro de ProvedorAviso')
  return ctx
}
