import { createClient } from '@supabase/supabase-js'
import type { Database } from './tipos'

const url = import.meta.env.VITE_SUPABASE_URL
const chave = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !chave) {
  throw new Error(
    'Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env antes de iniciar a aplicação.',
  )
}

export const supabase = createClient<Database>(url, chave, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'fortaleza-alta-sessao',
  },
})

/** Traduz os erros mais comuns do Supabase para português. */
export function mensagemErro(erro: unknown): string {
  const bruto =
    typeof erro === 'string'
      ? erro
      : erro instanceof Error
        ? erro.message
        : ((erro as { message?: string } | null)?.message ?? 'Erro desconhecido')

  const mapa: Record<string, string> = {
    'Invalid login credentials': 'E-mail ou senha incorretos.',
    'Email not confirmed': 'Confirme seu e-mail antes de entrar.',
    'User already registered': 'Já existe uma conta com este e-mail.',
    'Password should be at least 6 characters':
      'A senha deve ter no mínimo 6 caracteres.',
    'For security purposes, you can only request this after 60 seconds':
      'Aguarde um minuto antes de tentar novamente.',
    'Failed to fetch': 'Sem conexão com o servidor. Verifique sua internet.',
    'Email rate limit exceeded':
      'Muitas tentativas em pouco tempo. Tente novamente mais tarde.',
  }

  for (const [chaveErro, traducao] of Object.entries(mapa)) {
    if (bruto.includes(chaveErro)) return traducao
  }
  if (bruto.includes('duplicate key') && bruto.includes('cpf')) {
    return 'Este CPF já está cadastrado.'
  }
  if (bruto.includes('duplicate key')) return 'Este registro já existe.'
  if (bruto.includes('violates row-level security')) {
    return 'Você não tem permissão para realizar esta ação.'
  }
  return bruto
}
