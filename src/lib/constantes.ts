import type {
  PapelUsuario,
  PrioridadeSolicitacao,
  StatusAgendamento,
  StatusMensalidade,
  StatusReserva,
  StatusSolicitacao,
} from './tipos'

export interface Rotulo {
  texto: string
  classe: string
  ponto: string
}

export const STATUS_SOLICITACAO: Record<StatusSolicitacao, Rotulo> = {
  aberta: {
    texto: 'Aberta',
    classe: 'bg-sky-50 text-sky-800 ring-sky-600/20 dark:bg-sky-500/10 dark:text-sky-300 dark:ring-sky-400/30',
    ponto: 'bg-sky-500',
  },
  em_analise: {
    texto: 'Em análise',
    classe: 'bg-violet-50 text-violet-800 ring-violet-600/20 dark:bg-violet-500/10 dark:text-violet-300 dark:ring-violet-400/30',
    ponto: 'bg-violet-500',
  },
  em_andamento: {
    texto: 'Em andamento',
    classe: 'bg-terra-50 text-terra-800 ring-terra-600/20 dark:bg-terra-400/10 dark:text-terra-200 dark:ring-terra-400/30',
    ponto: 'bg-terra-500',
  },
  aguardando_morador: {
    texto: 'Aguardando morador',
    classe: 'bg-amber-50 text-amber-800 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-400/30',
    ponto: 'bg-amber-500',
  },
  concluida: {
    texto: 'Concluída',
    classe: 'bg-mata-50 text-mata-800 ring-mata-600/20 dark:bg-mata-400/10 dark:text-mata-200 dark:ring-mata-400/30',
    ponto: 'bg-mata-600',
  },
  cancelada: {
    texto: 'Cancelada',
    classe: 'bg-slate-100 text-slate-700 ring-slate-500/20 dark:bg-slate-500/10 dark:text-slate-300 dark:ring-slate-400/30',
    ponto: 'bg-slate-400',
  },
}

export const PRIORIDADES: Record<PrioridadeSolicitacao, Rotulo> = {
  baixa: {
    texto: 'Baixa',
    classe: 'bg-slate-100 text-slate-700 ring-slate-500/20 dark:bg-slate-500/10 dark:text-slate-300 dark:ring-slate-400/30',
    ponto: 'bg-slate-400',
  },
  media: {
    texto: 'Média',
    classe: 'bg-sky-50 text-sky-800 ring-sky-600/20 dark:bg-sky-500/10 dark:text-sky-300 dark:ring-sky-400/30',
    ponto: 'bg-sky-500',
  },
  alta: {
    texto: 'Alta',
    classe: 'bg-orange-50 text-orange-800 ring-orange-600/20 dark:bg-orange-500/10 dark:text-orange-300 dark:ring-orange-400/30',
    ponto: 'bg-orange-500',
  },
  urgente: {
    texto: 'Urgente',
    classe: 'bg-rose-50 text-rose-800 ring-rose-600/20 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-400/30',
    ponto: 'bg-rose-500',
  },
}

export const STATUS_AGENDAMENTO: Record<StatusAgendamento, Rotulo> = {
  pendente: {
    texto: 'Pendente',
    classe: 'bg-amber-50 text-amber-800 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-400/30',
    ponto: 'bg-amber-500',
  },
  confirmado: {
    texto: 'Confirmado',
    classe: 'bg-mata-50 text-mata-800 ring-mata-600/20 dark:bg-mata-400/10 dark:text-mata-200 dark:ring-mata-400/30',
    ponto: 'bg-mata-600',
  },
  realizado: {
    texto: 'Realizado',
    classe: 'bg-sky-50 text-sky-800 ring-sky-600/20 dark:bg-sky-500/10 dark:text-sky-300 dark:ring-sky-400/30',
    ponto: 'bg-sky-500',
  },
  cancelado: {
    texto: 'Cancelado',
    classe: 'bg-slate-100 text-slate-700 ring-slate-500/20 dark:bg-slate-500/10 dark:text-slate-300 dark:ring-slate-400/30',
    ponto: 'bg-slate-400',
  },
}

export const STATUS_RESERVA: Record<StatusReserva, Rotulo> = {
  pendente: STATUS_AGENDAMENTO.pendente,
  confirmada: { ...STATUS_AGENDAMENTO.confirmado, texto: 'Confirmada' },
  concluida: { ...STATUS_AGENDAMENTO.realizado, texto: 'Concluída' },
  cancelada: { ...STATUS_AGENDAMENTO.cancelado, texto: 'Cancelada' },
}

export const STATUS_MENSALIDADE: Record<StatusMensalidade, Rotulo> = {
  pendente: STATUS_AGENDAMENTO.pendente,
  paga: { ...STATUS_AGENDAMENTO.confirmado, texto: 'Paga' },
  atrasada: {
    texto: 'Atrasada',
    classe: 'bg-rose-50 text-rose-800 ring-rose-600/20 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-400/30',
    ponto: 'bg-rose-500',
  },
  isenta: {
    texto: 'Isenta',
    classe: 'bg-slate-100 text-slate-700 ring-slate-500/20 dark:bg-slate-500/10 dark:text-slate-300 dark:ring-slate-400/30',
    ponto: 'bg-slate-400',
  },
}

export const PAPEIS: Record<PapelUsuario, Rotulo> = {
  admin: {
    texto: 'Administrador',
    classe: 'bg-mata-700 text-white ring-mata-700/20',
    ponto: 'bg-white',
  },
  diretoria: {
    texto: 'Diretoria',
    classe: 'bg-terra-100 text-terra-800 ring-terra-600/20 dark:bg-terra-400/10 dark:text-terra-200 dark:ring-terra-400/30',
    ponto: 'bg-terra-500',
  },
  morador: {
    texto: 'Morador',
    classe: 'bg-slate-100 text-slate-700 ring-slate-500/20 dark:bg-slate-500/10 dark:text-slate-300 dark:ring-slate-400/30',
    ponto: 'bg-slate-400',
  },
}

/** Fluxo permitido de mudança de status pela equipe. */
export const PROXIMOS_STATUS: Record<StatusSolicitacao, StatusSolicitacao[]> = {
  aberta: ['em_analise', 'em_andamento', 'cancelada'],
  em_analise: ['em_andamento', 'aguardando_morador', 'concluida', 'cancelada'],
  em_andamento: ['aguardando_morador', 'concluida', 'cancelada'],
  aguardando_morador: ['em_andamento', 'concluida', 'cancelada'],
  concluida: ['em_andamento'],
  cancelada: ['aberta'],
}

export const STATUS_ABERTOS: StatusSolicitacao[] = [
  'aberta',
  'em_analise',
  'em_andamento',
  'aguardando_morador',
]

export const CATEGORIAS_COMUNICADO = [
  { valor: 'geral', texto: 'Geral' },
  { valor: 'aviso', texto: 'Aviso' },
  { valor: 'evento', texto: 'Evento' },
  { valor: 'obra', texto: 'Obras e serviços' },
  { valor: 'assembleia', texto: 'Assembleia' },
  { valor: 'urgente', texto: 'Urgente' },
]

export const FORMAS_PAGAMENTO = ['Dinheiro', 'PIX', 'Transferência', 'Cartão', 'Boleto']

/** Cores usadas nos gráficos do painel. */
export const CORES_GRAFICO = ['#115e4a', '#dfa036', '#2a8068', '#6366f1', '#0ea5e9', '#ef4444', '#8b5cf6', '#64748b']
