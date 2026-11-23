import { useEffect, useState } from 'react'
import { Icone } from './Icone'
import { Botao } from './ui'

interface EventoInstalacao extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const CHAVE_DISPENSADO = 'fortaleza-alta-instalacao-dispensada'

/** Faixa que convida a instalar o aplicativo na tela inicial. */
export function ConviteInstalacao() {
  const [evento, setEvento] = useState<EventoInstalacao | null>(null)
  const [visivel, setVisivel] = useState(false)
  const [ehIos, setEhIos] = useState(false)

  useEffect(() => {
    let dispensado = false
    try {
      dispensado = localStorage.getItem(CHAVE_DISPENSADO) === 'sim'
    } catch {
      /* armazenamento indisponível */
    }
    if (dispensado) return

    const jaInstalado =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as { standalone?: boolean }).standalone === true
    if (jaInstalado) return

    const iosDetectado =
      /iphone|ipad|ipod/i.test(navigator.userAgent) && !/crios|fxios/i.test(navigator.userAgent)
    if (iosDetectado) {
      setEhIos(true)
      setVisivel(true)
      return
    }

    const aoPoderInstalar = (e: Event) => {
      e.preventDefault()
      setEvento(e as EventoInstalacao)
      setVisivel(true)
    }
    const aoInstalar = () => setVisivel(false)

    window.addEventListener('beforeinstallprompt', aoPoderInstalar)
    window.addEventListener('appinstalled', aoInstalar)
    return () => {
      window.removeEventListener('beforeinstallprompt', aoPoderInstalar)
      window.removeEventListener('appinstalled', aoInstalar)
    }
  }, [])

  const dispensar = () => {
    setVisivel(false)
    try {
      localStorage.setItem(CHAVE_DISPENSADO, 'sim')
    } catch {
      /* ignora */
    }
  }

  const instalar = async () => {
    if (!evento) return
    await evento.prompt()
    const escolha = await evento.userChoice
    if (escolha.outcome === 'accepted') setVisivel(false)
    setEvento(null)
  }

  if (!visivel) return null

  return (
    <div className="sem-impressao superficie mb-5 flex flex-wrap items-center gap-3 rounded-2xl border border-mata-300 bg-mata-50 px-4 py-3 dark:border-mata-700 dark:bg-mata-900/40">
      <span className="rounded-xl bg-mata-700 p-2 text-white">
        <Icone nome="instalar" />
      </span>
      <div className="min-w-[200px] flex-1">
        <p className="text-sm font-semibold">Instale o aplicativo no seu celular</p>
        <p className="texto-suave text-sm">
          {ehIos
            ? 'No Safari, toque em Compartilhar e depois em “Adicionar à Tela de Início”.'
            : 'Acesso rápido, em tela cheia, e funciona mesmo sem internet.'}
        </p>
      </div>
      <div className="flex gap-2">
        {!ehIos && (
          <Botao tamanho="pequeno" onClick={instalar}>
            Instalar
          </Botao>
        )}
        <Botao variante="fantasma" tamanho="pequeno" onClick={dispensar}>
          Agora não
        </Botao>
      </div>
    </div>
  )
}

/** Mostra uma faixa fixa quando o aparelho perde a conexão. */
export function AvisoOffline() {
  const [offline, setOffline] = useState(!navigator.onLine)

  useEffect(() => {
    const online = () => setOffline(false)
    const caiu = () => setOffline(true)
    window.addEventListener('online', online)
    window.addEventListener('offline', caiu)
    return () => {
      window.removeEventListener('online', online)
      window.removeEventListener('offline', caiu)
    }
  }, [])

  if (!offline) return null

  return (
    <div
      role="status"
      className="sem-impressao sticky top-0 z-40 flex items-center justify-center gap-2 bg-terra-500 px-4 py-2 text-sm font-semibold text-white"
    >
      <Icone nome="offline" className="h-[18px] w-[18px]" />
      Você está sem conexão — exibindo os dados salvos no aparelho.
    </div>
  )
}
