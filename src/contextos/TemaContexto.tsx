import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

type Tema = 'claro' | 'escuro'

interface ContextoTema {
  tema: Tema
  alternarTema: () => void
}

const Contexto = createContext<ContextoTema | null>(null)

function temaInicial(): Tema {
  try {
    const salvo = localStorage.getItem('fortaleza-alta-tema')
    if (salvo === 'claro' || salvo === 'escuro') return salvo
  } catch {
    /* modo privado pode bloquear o localStorage */
  }
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'escuro' : 'claro'
}

export function ProvedorTema({ children }: { children: ReactNode }) {
  const [tema, setTema] = useState<Tema>(temaInicial)

  useEffect(() => {
    document.documentElement.dataset.tema = tema
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', tema === 'escuro' ? '#071511' : '#115e4a')
    try {
      localStorage.setItem('fortaleza-alta-tema', tema)
    } catch {
      /* ignora falha de armazenamento */
    }
  }, [tema])

  const alternarTema = () => setTema((t) => (t === 'claro' ? 'escuro' : 'claro'))

  return <Contexto.Provider value={{ tema, alternarTema }}>{children}</Contexto.Provider>
}

export function useTema(): ContextoTema {
  const ctx = useContext(Contexto)
  if (!ctx) throw new Error('useTema precisa estar dentro de ProvedorTema')
  return ctx
}
