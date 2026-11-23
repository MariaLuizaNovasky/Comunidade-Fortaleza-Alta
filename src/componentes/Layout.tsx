import { useEffect, useState, type ReactNode } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contextos/AuthContexto'
import { useTema } from '../contextos/TemaContexto'
import { iniciais } from '../lib/formato'
import { PAPEIS } from '../lib/constantes'
import { Icone, type NomeIcone } from './Icone'
import { AvisoOffline } from './InstalarPwa'

interface ItemMenu {
  rota: string
  texto: string
  icone: NomeIcone
  somenteEquipe?: boolean
  somenteAdmin?: boolean
}

const MENU: ItemMenu[] = [
  { rota: '/', texto: 'Painel', icone: 'painel' },
  { rota: '/solicitacoes', texto: 'Atendimentos', icone: 'chamado' },
  { rota: '/servicos', texto: 'Serviços', icone: 'servico' },
  { rota: '/agendamentos', texto: 'Agendamentos', icone: 'agenda' },
  { rota: '/espacos', texto: 'Espaços', icone: 'espaco' },
  { rota: '/reservas', texto: 'Reservas', icone: 'calendario' },
  { rota: '/mensalidades', texto: 'Mensalidades', icone: 'financeiro' },
  { rota: '/comunicados', texto: 'Comunicados', icone: 'comunicado' },
  { rota: '/moradores', texto: 'Moradores', icone: 'moradores', somenteEquipe: true },
  { rota: '/relatorios', texto: 'Relatórios', icone: 'relatorio', somenteEquipe: true },
  { rota: '/configuracoes', texto: 'Configurações', icone: 'config', somenteAdmin: true },
]

const MENU_INFERIOR: ItemMenu[] = [
  { rota: '/', texto: 'Painel', icone: 'painel' },
  { rota: '/solicitacoes', texto: 'Atendimentos', icone: 'chamado' },
  { rota: '/comunicados', texto: 'Avisos', icone: 'comunicado' },
]

export function Layout({ children }: { children: ReactNode }) {
  const { perfil, sair, ehEquipe, ehAdmin } = useAuth()
  const { tema, alternarTema } = useTema()
  const navegar = useNavigate()
  const local = useLocation()
  const [menuAberto, setMenuAberto] = useState(false)

  useEffect(() => {
    setMenuAberto(false)
  }, [local.pathname])

  const itens = MENU.filter(
    (i) => (!i.somenteEquipe || ehEquipe) && (!i.somenteAdmin || ehAdmin),
  )

  const aoSair = async () => {
    await sair()
    navegar('/entrar', { replace: true })
  }

  const Marca = (
    <div className="flex items-center gap-3">
      <img src={`${import.meta.env.BASE_URL}favicon.svg`} alt="" className="h-10 w-10 rounded-xl" />
      <div className="leading-tight">
        <p className="text-[15px] font-bold">Fortaleza Alta</p>
        <p className="texto-suave text-xs">Associação de Moradores</p>
      </div>
    </div>
  )

  const Navegacao = (
    <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4" aria-label="Menu principal">
      {itens.map((item) => (
        <NavLink
          key={item.rota}
          to={item.rota}
          end={item.rota === '/'}
          className={({ isActive }) => `link-nav ${isActive ? 'link-nav-ativo' : ''}`}
        >
          <Icone nome={item.icone} className="h-[18px] w-[18px] shrink-0" />
          {item.texto}
        </NavLink>
      ))}
    </nav>
  )

  const Rodape = (
    <div className="border-t px-3 py-3" style={{ borderColor: 'var(--borda)' }}>
      <NavLink
        to="/perfil"
        className={({ isActive }) =>
          `flex items-center gap-3 rounded-xl px-2 py-2 transition hover:bg-mata-500/10 ${
            isActive ? 'bg-mata-500/10' : ''
          }`
        }
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-mata-700 text-sm font-bold text-white">
          {iniciais(perfil?.nome)}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold">{perfil?.nome ?? '—'}</span>
          <span className="texto-suave block text-xs">
            {perfil ? PAPEIS[perfil.papel].texto : ''}
          </span>
        </span>
      </NavLink>
      <div className="mt-2 flex gap-1">
        <button
          type="button"
          onClick={alternarTema}
          className="link-nav flex-1 justify-center"
          aria-label={tema === 'claro' ? 'Ativar tema escuro' : 'Ativar tema claro'}
        >
          <Icone nome={tema === 'claro' ? 'lua' : 'sol'} className="h-[18px] w-[18px]" />
          {tema === 'claro' ? 'Escuro' : 'Claro'}
        </button>
        <button type="button" onClick={aoSair} className="link-nav flex-1 justify-center text-rose-600 dark:text-rose-400">
          <Icone nome="sair" className="h-[18px] w-[18px]" />
          Sair
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen">
      <AvisoOffline />

      {/* Menu lateral fixo (telas grandes) */}
      <aside
        className="sem-impressao superficie fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r lg:flex"
        style={{ borderColor: 'var(--borda)' }}
      >
        <div className="border-b px-4 py-4" style={{ borderColor: 'var(--borda)' }}>
          {Marca}
        </div>
        {Navegacao}
        {Rodape}
      </aside>

      {/* Barra superior (telas pequenas) */}
      <header
        className="sem-impressao superficie area-segura-topo sticky top-0 z-30 flex items-center justify-between gap-3 border-b px-4 py-3 lg:hidden"
        style={{ borderColor: 'var(--borda)' }}
      >
        {Marca}
        <button
          type="button"
          onClick={() => setMenuAberto(true)}
          className="rounded-xl p-2 transition hover:bg-mata-500/10"
          aria-label="Abrir menu"
        >
          <Icone nome="menu" className="h-6 w-6" />
        </button>
      </header>

      {/* Gaveta lateral (telas pequenas) */}
      {menuAberto && (
        <div className="sem-impressao fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-mata-950/50 backdrop-blur-sm"
            onClick={() => setMenuAberto(false)}
            aria-hidden="true"
          />
          <div
            className="superficie absolute inset-y-0 right-0 flex w-[82%] max-w-xs animate-entra-direita flex-col border-l"
            style={{ borderColor: 'var(--borda)' }}
          >
            <div
              className="flex items-center justify-between border-b px-4 py-4"
              style={{ borderColor: 'var(--borda)' }}
            >
              {Marca}
              <button
                type="button"
                onClick={() => setMenuAberto(false)}
                className="rounded-lg p-1.5 transition hover:bg-mata-500/10"
                aria-label="Fechar menu"
              >
                <Icone nome="fechar" className="h-5 w-5" />
              </button>
            </div>
            {Navegacao}
            {Rodape}
          </div>
        </div>
      )}

      {/* Conteúdo */}
      <main className="lg:pl-64">
        <div className="mx-auto max-w-6xl px-4 pb-28 pt-5 sm:px-6 lg:pb-10 lg:pt-8">{children}</div>
      </main>

      {/* Navegação inferior (telas pequenas) */}
      <nav
        className="sem-impressao superficie area-segura-baixo fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t lg:hidden"
        style={{ borderColor: 'var(--borda)' }}
        aria-label="Navegação rápida"
      >
        {MENU_INFERIOR.map((item) => (
          <NavLink
            key={item.rota}
            to={item.rota}
            end={item.rota === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 py-2.5 text-[11px] font-semibold transition ${
                isActive ? 'text-mata-700 dark:text-mata-300' : 'texto-suave'
              }`
            }
          >
            <Icone nome={item.icone} className="h-[22px] w-[22px]" />
            {item.texto}
          </NavLink>
        ))}
        <button
          type="button"
          onClick={() => setMenuAberto(true)}
          className="texto-suave flex flex-col items-center gap-1 py-2.5 text-[11px] font-semibold"
        >
          <Icone nome="menu" className="h-[22px] w-[22px]" />
          Mais
        </button>
      </nav>
    </div>
  )
}
