/** Ícones em SVG inline (sem dependência externa), traçado de 1.6px. */
export type NomeIcone =
  | 'painel' | 'chamado' | 'servico' | 'agenda' | 'espaco' | 'financeiro'
  | 'comunicado' | 'moradores' | 'relatorio' | 'config' | 'perfil' | 'sair'
  | 'mais' | 'busca' | 'filtro' | 'voltar' | 'menu' | 'fechar' | 'sol' | 'lua'
  | 'baixar' | 'instalar' | 'offline' | 'enviar' | 'estrela' | 'calendario'
  | 'relogio' | 'local' | 'telefone' | 'check' | 'alerta' | 'lixeira'
  | 'editar' | 'protocolo' | 'pessoas' | 'dinheiro' | 'fixado' | 'cadeado'
  | 'email' | 'olho' | 'olho-fechado' | 'atualizar' | 'relogio-area'

const CAMINHOS: Record<NomeIcone, string> = {
  painel: 'M4 13h7V4H4v9Zm0 7h7v-5H4v5Zm9 0h7v-9h-7v9Zm0-16v5h7V4h-7Z',
  chamado: 'M8 10h8M8 14h5M21 12a8.5 8.5 0 0 1-12.3 7.6L3 21l1.4-5.7A8.5 8.5 0 1 1 21 12Z',
  servico: 'M14.7 6.3a4 4 0 0 1 5.3 5l-2.6-.9-1.6 1.6.9 2.6a4 4 0 0 1-5-5.3l-6 6a2 2 0 0 1-2.9-2.9l6-6a4 4 0 0 1 5.9-.1Z',
  agenda: 'M8 2v4m8-4v4M3 10h18M5 6h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z',
  espaco: 'M3 21h18M5 21V8l7-5 7 5v13M9 21v-6h6v6',
  financeiro: 'M12 2v20M17 6.5C17 4.6 14.8 3.5 12 3.5S7 4.6 7 6.5s2.2 3 5 3.5 5 1.6 5 3.5-2.2 3-5 3-5-1.1-5-3',
  comunicado: 'M3 11v2a2 2 0 0 0 2 2h2l5 4V5L7 9H5a2 2 0 0 0-2 2Zm14.5-4a7 7 0 0 1 0 10M20 4a11 11 0 0 1 0 16',
  moradores: 'M16 20v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 10a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm13 10v-2a4 4 0 0 0-3-3.9M16 2.1a4 4 0 0 1 0 7.8',
  relatorio: 'M7 16v-5m5 5V7m5 9v-3M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z',
  config: 'M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm8.4-2.1.1-1.4-.1-1.4 1.8-1.4-1.8-3.1-2.2.7a7.6 7.6 0 0 0-2.4-1.4L15.4 2h-3.6l-.4 2.3a7.6 7.6 0 0 0-2.4 1.4l-2.2-.7-1.8 3.1 1.8 1.4-.1 1.4.1 1.4-1.8 1.4 1.8 3.1 2.2-.7a7.6 7.6 0 0 0 2.4 1.4l.4 2.3h3.6l.4-2.3a7.6 7.6 0 0 0 2.4-1.4l2.2.7 1.8-3.1-1.8-1.4Z',
  perfil: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z',
  sair: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4m7 14 5-5-5-5m5 5H9',
  mais: 'M12 5v14M5 12h14',
  busca: 'm21 21-4.3-4.3M17 11a6 6 0 1 1-12 0 6 6 0 0 1 12 0Z',
  filtro: 'M3 5h18l-7 8v6l-4 2v-8L3 5Z',
  voltar: 'M19 12H5m7 7-7-7 7-7',
  menu: 'M4 6h16M4 12h16M4 18h16',
  fechar: 'M6 6l12 12M18 6 6 18',
  sol: 'M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0-14v2m0 18v-2M5.6 5.6 7 7m10 10 1.4 1.4M3 12h2m14 0h2M5.6 18.4 7 17M17 7l1.4-1.4',
  lua: 'M21 13.2A9 9 0 1 1 10.8 3a7 7 0 0 0 10.2 10.2Z',
  baixar: 'M12 3v12m0 0 4.5-4.5M12 15l-4.5-4.5M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2',
  instalar: 'M12 3v10m0 0 4-4m-4 4-4-4M7 17h10M5 21h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2Z',
  offline: 'M3 3l18 18M8.5 16.4a5 5 0 0 1 7 0M5 13a10 10 0 0 1 4-2.4M2 9a15 15 0 0 1 5-3.2m5-.7a15 15 0 0 1 10 3.9m-3 4a10 10 0 0 0-2.4-1.6M12 20h.01',
  enviar: 'm22 2-7 20-4-9-9-4 20-7Z',
  estrela: 'm12 3 2.8 5.7 6.2.9-4.5 4.4 1 6.2-5.5-2.9-5.5 2.9 1-6.2L3 9.6l6.2-.9L12 3Z',
  calendario: 'M8 2v4m8-4v4M3 10h18M5 6h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z',
  relogio: 'M12 7v5l3 2m6-2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
  local: 'M12 21s7-6.3 7-11a7 7 0 1 0-14 0c0 4.7 7 11 7 11Zm0-8.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z',
  telefone: 'M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z',
  check: 'm5 13 4 4L19 7',
  alerta: 'M12 9v4m0 4h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z',
  lixeira: 'M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M10 11v6m4-6v6',
  editar: 'M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z',
  protocolo: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Zm0 0v6h6M9 13h6m-6 4h6',
  pessoas: 'M17 20v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9.5 10a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm12.5 10v-2a4 4 0 0 0-3-3.9',
  dinheiro: 'M2 7h20v10H2zM12 14.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM6 7v10M18 7v10',
  fixado: 'M12 17v5M9 3h6l-1 6 3.5 3.5V15H6.5v-2.5L10 9 9 3Z',
  cadeado: 'M7 11V7a5 5 0 0 1 10 0v4M5 11h14a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1Z',
  email: 'm3 7 8.2 5.5a1.5 1.5 0 0 0 1.6 0L21 7M5 5h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z',
  olho: 'M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Zm10 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
  'olho-fechado': 'M3 3l18 18M10.6 10.6a3 3 0 0 0 4.2 4.2M9.4 5.3A9.9 9.9 0 0 1 12 5c6.4 0 10 7 10 7a17.4 17.4 0 0 1-3.2 4.2M6.2 6.6A17.2 17.2 0 0 0 2 12s3.6 7 10 7a9.8 9.8 0 0 0 3.6-.7',
  atualizar: 'M21 12a9 9 0 1 1-2.6-6.4M21 3v6h-6',
  'relogio-area': 'M12 7v5l3 2m6-2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
}

interface Props {
  nome: NomeIcone
  className?: string
  preenchido?: boolean
}

export function Icone({ nome, className = 'h-5 w-5', preenchido = false }: Props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={preenchido ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <path d={CAMINHOS[nome]} />
    </svg>
  )
}
