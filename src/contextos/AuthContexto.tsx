import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { mensagemErro, supabase } from '../lib/supabase'
import type { Perfil } from '../lib/tipos'

export interface DadosCadastro {
  nome: string
  email: string
  senha: string
  telefone?: string
  cpf?: string
  rua?: string
  numero?: string
}

interface ContextoAuth {
  sessao: Session | null
  usuario: User | null
  perfil: Perfil | null
  carregando: boolean
  ehEquipe: boolean
  ehAdmin: boolean
  entrar: (email: string, senha: string) => Promise<void>
  cadastrar: (dados: DadosCadastro) => Promise<{ precisaConfirmar: boolean }>
  sair: () => Promise<void>
  recuperarSenha: (email: string) => Promise<void>
  definirNovaSenha: (senha: string) => Promise<void>
  atualizarPerfil: (campos: Partial<Perfil>) => Promise<void>
  recarregarPerfil: () => Promise<void>
}

const Contexto = createContext<ContextoAuth | null>(null)

export function ProvedorAuth({ children }: { children: ReactNode }) {
  const [sessao, setSessao] = useState<Session | null>(null)
  const [perfil, setPerfil] = useState<Perfil | null>(null)
  const [carregando, setCarregando] = useState(true)
  const idPerfilCarregado = useRef<string | null>(null)

  const buscarPerfil = useCallback(async (idUsuario: string): Promise<Perfil | null> => {
    const { data, error } = await supabase
      .from('perfis')
      .select('*')
      .eq('id', idUsuario)
      .maybeSingle()

    if (error) {
      console.error('Falha ao carregar o perfil:', error.message)
      return null
    }
    return data as Perfil | null
  }, [])

  useEffect(() => {
    let ativo = true

    supabase.auth.getSession().then(async ({ data }) => {
      if (!ativo) return
      setSessao(data.session)
      if (data.session?.user) {
        const p = await buscarPerfil(data.session.user.id)
        if (!ativo) return
        setPerfil(p)
        idPerfilCarregado.current = data.session.user.id
      }
      setCarregando(false)
    })

    const { data: inscricao } = supabase.auth.onAuthStateChange((evento, novaSessao) => {
      if (!ativo) return
      setSessao(novaSessao)

      if (!novaSessao?.user) {
        setPerfil(null)
        idPerfilCarregado.current = null
        return
      }

      // Evita refazer a consulta a cada renovação silenciosa do token.
      if (evento === 'TOKEN_REFRESHED' && idPerfilCarregado.current === novaSessao.user.id) return

      void buscarPerfil(novaSessao.user.id).then((p) => {
        if (!ativo) return
        setPerfil(p)
        idPerfilCarregado.current = novaSessao.user.id
      })
    })

    return () => {
      ativo = false
      inscricao.subscription.unsubscribe()
    }
  }, [buscarPerfil])

  const entrar = async (email: string, senha: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password: senha,
    })
    if (error) throw new Error(mensagemErro(error))
  }

  const cadastrar = async (dados: DadosCadastro) => {
    const { data, error } = await supabase.auth.signUp({
      email: dados.email.trim().toLowerCase(),
      password: dados.senha,
      options: {
        data: {
          nome: dados.nome.trim(),
          telefone: dados.telefone ?? '',
          cpf: dados.cpf ?? '',
          rua: dados.rua ?? '',
          numero: dados.numero ?? '',
        },
        emailRedirectTo: window.location.origin + import.meta.env.BASE_URL,
      },
    })
    if (error) throw new Error(mensagemErro(error))
    return { precisaConfirmar: !data.session }
  }

  const sair = async () => {
    await supabase.auth.signOut()
    setPerfil(null)
    idPerfilCarregado.current = null
  }

  const recuperarSenha = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: window.location.origin + import.meta.env.BASE_URL,
    })
    if (error) throw new Error(mensagemErro(error))
  }

  const definirNovaSenha = async (senha: string) => {
    const { error } = await supabase.auth.updateUser({ password: senha })
    if (error) throw new Error(mensagemErro(error))
  }

  const atualizarPerfil = async (campos: Partial<Perfil>) => {
    if (!sessao?.user) throw new Error('Nenhum usuário autenticado.')
    const { data, error } = await supabase
      .from('perfis')
      .update(campos)
      .eq('id', sessao.user.id)
      .select()
      .single()
    if (error) throw new Error(mensagemErro(error))
    setPerfil(data as Perfil)
  }

  const recarregarPerfil = async () => {
    if (!sessao?.user) return
    setPerfil(await buscarPerfil(sessao.user.id))
  }

  const valor: ContextoAuth = {
    sessao,
    usuario: sessao?.user ?? null,
    perfil,
    carregando,
    ehEquipe: perfil?.papel === 'admin' || perfil?.papel === 'diretoria',
    ehAdmin: perfil?.papel === 'admin',
    entrar,
    cadastrar,
    sair,
    recuperarSenha,
    definirNovaSenha,
    atualizarPerfil,
    recarregarPerfil,
  }

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>
}

export function useAuth(): ContextoAuth {
  const ctx = useContext(Contexto)
  if (!ctx) throw new Error('useAuth precisa estar dentro de ProvedorAuth')
  return ctx
}
