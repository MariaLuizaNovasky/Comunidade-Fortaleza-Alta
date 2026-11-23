/**
 * Tipagem do banco de dados (Supabase / PostgreSQL).
 * Espelha as migrações em `supabase/migrations`.
 */

export type Json = string | number | boolean | null | { [k: string]: Json | undefined } | Json[]

export type PapelUsuario = 'admin' | 'diretoria' | 'morador'
export type StatusSolicitacao =
  | 'aberta'
  | 'em_analise'
  | 'em_andamento'
  | 'aguardando_morador'
  | 'concluida'
  | 'cancelada'
export type PrioridadeSolicitacao = 'baixa' | 'media' | 'alta' | 'urgente'
export type StatusAgendamento = 'pendente' | 'confirmado' | 'realizado' | 'cancelado'
export type StatusReserva = 'pendente' | 'confirmada' | 'cancelada' | 'concluida'
export type StatusMensalidade = 'pendente' | 'paga' | 'atrasada' | 'isenta'

export interface Perfil {
  id: string
  nome: string
  email: string | null
  cpf: string | null
  telefone: string | null
  papel: PapelUsuario
  rua: string | null
  numero: string | null
  quadra: string | null
  lote: string | null
  complemento: string | null
  bairro: string | null
  cidade: string | null
  uf: string | null
  cep: string | null
  data_associacao: string | null
  ativo: boolean
  observacoes: string | null
  criado_em: string
  atualizado_em: string
}

export interface CategoriaServico {
  id: string
  nome: string
  descricao: string | null
  icone: string | null
  cor: string | null
  prazo_dias: number
  ativo: boolean
  criado_em: string
}

export interface Solicitacao {
  id: string
  protocolo: string
  morador_id: string
  categoria_id: string | null
  titulo: string
  descricao: string
  status: StatusSolicitacao
  prioridade: PrioridadeSolicitacao
  local_ocorrencia: string | null
  responsavel_id: string | null
  prazo_atendimento: string | null
  avaliacao: number | null
  avaliacao_comentario: string | null
  concluida_em: string | null
  criado_em: string
  atualizado_em: string
}

export interface SolicitacaoInteracao {
  id: string
  solicitacao_id: string
  autor_id: string | null
  mensagem: string
  status_anterior: StatusSolicitacao | null
  status_novo: StatusSolicitacao | null
  interna: boolean
  criado_em: string
}

export interface Servico {
  id: string
  nome: string
  descricao: string | null
  categoria_id: string | null
  valor: number
  duracao_minutos: number
  requer_agendamento: boolean
  ativo: boolean
  criado_em: string
}

export interface Agendamento {
  id: string
  servico_id: string
  morador_id: string
  data_hora: string
  status: StatusAgendamento
  observacoes: string | null
  criado_em: string
  atualizado_em: string
}

export interface Espaco {
  id: string
  nome: string
  descricao: string | null
  capacidade: number
  valor_locacao: number
  regras: string | null
  ativo: boolean
  criado_em: string
}

export interface Reserva {
  id: string
  espaco_id: string
  morador_id: string
  data: string
  hora_inicio: string
  hora_fim: string
  finalidade: string | null
  numero_convidados: number | null
  valor: number
  status: StatusReserva
  criado_em: string
  atualizado_em: string
}

export interface Mensalidade {
  id: string
  morador_id: string
  referencia: string
  valor: number
  vencimento: string
  status: StatusMensalidade
  pago_em: string | null
  forma_pagamento: string | null
  observacoes: string | null
  criado_em: string
}

export interface Comunicado {
  id: string
  titulo: string
  conteudo: string
  autor_id: string | null
  categoria: string | null
  fixado: boolean
  publicado: boolean
  publicado_em: string
  criado_em: string
}

export interface Configuracoes {
  id: boolean
  nome_associacao: string
  cnpj: string | null
  endereco: string | null
  telefone: string | null
  email: string | null
  valor_mensalidade: number
  dia_vencimento: number
  horario_atendimento: string | null
  atualizado_em: string
}

/** Linhas com relacionamentos carregados via `select(...)` aninhado. */
export type SolicitacaoComRelacoes = Solicitacao & {
  categoria: Pick<CategoriaServico, 'id' | 'nome' | 'cor'> | null
  morador: Pick<Perfil, 'id' | 'nome' | 'telefone' | 'rua' | 'numero'> | null
  responsavel: Pick<Perfil, 'id' | 'nome'> | null
}

export type InteracaoComAutor = SolicitacaoInteracao & {
  autor: Pick<Perfil, 'id' | 'nome' | 'papel'> | null
}

export type AgendamentoComRelacoes = Agendamento & {
  servico: Pick<Servico, 'id' | 'nome' | 'valor' | 'duracao_minutos'> | null
  morador: Pick<Perfil, 'id' | 'nome' | 'telefone'> | null
}

export type ReservaComRelacoes = Reserva & {
  espaco: Pick<Espaco, 'id' | 'nome' | 'valor_locacao' | 'capacidade'> | null
  morador: Pick<Perfil, 'id' | 'nome' | 'telefone'> | null
}

export type MensalidadeComMorador = Mensalidade & {
  morador: Pick<Perfil, 'id' | 'nome' | 'rua' | 'numero'> | null
}

export type ComunicadoComAutor = Comunicado & {
  autor: Pick<Perfil, 'id' | 'nome'> | null
}

/** Retorno da função `fn_indicadores_painel()`. */
export interface IndicadoresEquipe {
  equipe: true
  moradores_ativos: number
  solicitacoes_abertas: number
  solicitacoes_atrasadas: number
  solicitacoes_mes: number
  concluidas_mes: number
  agendamentos_proximos: number
  reservas_pendentes: number
  inadimplentes: number
  recebido_mes: number
  a_receber: number
  tempo_medio_dias: number
  por_status: Partial<Record<StatusSolicitacao, number>>
  por_categoria: { nome: string; total: number }[]
  por_mes: { mes: string; total: number }[]
}

export interface IndicadoresMorador {
  equipe: false
  minhas_solicitacoes: number
  minhas_abertas: number
  minhas_concluidas: number
  meus_agendamentos: number
  minhas_reservas: number
  mensalidades_pendentes: number
  valor_devido: number
}

export type Indicadores = IndicadoresEquipe | IndicadoresMorador

type Tabela<L, I = Partial<L>, U = Partial<L>> = { Row: L; Insert: I; Update: U; Relationships: [] }

export interface Database {
  public: {
    Tables: {
      perfis: Tabela<Perfil, Omit<Perfil, 'criado_em' | 'atualizado_em'>>
      categorias_servico: Tabela<CategoriaServico, Omit<CategoriaServico, 'id' | 'criado_em'>>
      solicitacoes: Tabela<
        Solicitacao,
        Omit<Solicitacao, 'id' | 'protocolo' | 'criado_em' | 'atualizado_em'> & {
          protocolo?: string
        }
      >
      solicitacao_interacoes: Tabela<
        SolicitacaoInteracao,
        Omit<SolicitacaoInteracao, 'id' | 'criado_em'>
      >
      servicos: Tabela<Servico, Omit<Servico, 'id' | 'criado_em'>>
      agendamentos: Tabela<Agendamento, Omit<Agendamento, 'id' | 'criado_em' | 'atualizado_em'>>
      espacos: Tabela<Espaco, Omit<Espaco, 'id' | 'criado_em'>>
      reservas: Tabela<Reserva, Omit<Reserva, 'id' | 'criado_em' | 'atualizado_em'>>
      mensalidades: Tabela<Mensalidade, Omit<Mensalidade, 'id' | 'criado_em'>>
      comunicados: Tabela<Comunicado, Omit<Comunicado, 'id' | 'criado_em'>>
      configuracoes: Tabela<Configuracoes, Configuracoes>
    }
    Views: Record<string, never>
    Functions: {
      fn_indicadores_painel: { Args: Record<string, never>; Returns: Json }
      fn_gerar_mensalidades: { Args: { p_referencia: string }; Returns: number }
      fn_atualizar_mensalidades_atrasadas: { Args: Record<string, never>; Returns: number }
      fn_papel_atual: { Args: Record<string, never>; Returns: PapelUsuario }
      fn_e_equipe: { Args: Record<string, never>; Returns: boolean }
      fn_e_admin: { Args: Record<string, never>; Returns: boolean }
    }
    Enums: {
      papel_usuario: PapelUsuario
      status_solicitacao: StatusSolicitacao
      prioridade_solicitacao: PrioridadeSolicitacao
      status_agendamento: StatusAgendamento
      status_reserva: StatusReserva
      status_mensalidade: StatusMensalidade
    }
    CompositeTypes: Record<string, never>
  }
}
