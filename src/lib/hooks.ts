import { useCallback, useEffect, useRef, useState } from 'react'

interface ResultadoConsulta<T> {
  dados: T | null
  carregando: boolean
  erro: string | null
  recarregar: () => void
}

/**
 * Executa uma consulta assíncrona e controla carregamento, erro e recarga.
 * `deps` funciona como no useEffect.
 */
export function useConsulta<T>(
  consulta: () => Promise<T>,
  deps: unknown[] = [],
): ResultadoConsulta<T> {
  const [dados, setDados] = useState<T | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [gatilho, setGatilho] = useState(0)
  const consultaRef = useRef(consulta)
  consultaRef.current = consulta

  useEffect(() => {
    let ativo = true
    setCarregando(true)
    setErro(null)

    consultaRef
      .current()
      .then((resultado) => {
        if (ativo) setDados(resultado)
      })
      .catch((e: unknown) => {
        if (ativo) setErro(e instanceof Error ? e.message : 'Falha ao carregar os dados.')
      })
      .finally(() => {
        if (ativo) setCarregando(false)
      })

    return () => {
      ativo = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, gatilho])

  const recarregar = useCallback(() => setGatilho((g) => g + 1), [])

  return { dados, carregando, erro, recarregar }
}

/** Adia a atualização de um valor — útil em campos de busca. */
export function useAtraso<T>(valor: T, ms = 300): T {
  const [adiado, setAdiado] = useState(valor)
  useEffect(() => {
    const t = setTimeout(() => setAdiado(valor), ms)
    return () => clearTimeout(t)
  }, [valor, ms])
  return adiado
}
