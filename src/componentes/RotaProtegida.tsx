import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contextos/AuthContexto'
import { Carregando, Vazio } from './ui'

export function RotaProtegida({
  children,
  somenteEquipe = false,
  somenteAdmin = false,
}: {
  children: ReactNode
  somenteEquipe?: boolean
  somenteAdmin?: boolean
}) {
  const { sessao, perfil, carregando, ehEquipe, ehAdmin } = useAuth()
  const local = useLocation()

  if (carregando) return <Carregando texto="Verificando seu acesso…" />

  if (!sessao) {
    // Mantém o trecho após o # (erros e tokens vindos dos links de e-mail)
    return <Navigate to={{ pathname: '/entrar', hash: local.hash }} state={{ de: local.pathname }} replace />
  }

  if (perfil && !perfil.ativo) {
    return (
      <Vazio
        icone="cadeado"
        titulo="Cadastro inativo"
        descricao="Seu cadastro está inativo. Procure a diretoria da associação para regularizar o acesso."
      />
    )
  }

  if ((somenteEquipe && !ehEquipe) || (somenteAdmin && !ehAdmin)) {
    return (
      <Vazio
        icone="cadeado"
        titulo="Área restrita"
        descricao="Esta seção é exclusiva da diretoria da associação."
      />
    )
  }

  return <>{children}</>
}
