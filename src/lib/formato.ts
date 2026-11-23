/** Funções de formatação e validação para o padrão brasileiro. */

export const moeda = (valor: number | null | undefined): string =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(valor ?? 0))

export const numero = (valor: number | null | undefined): string =>
  new Intl.NumberFormat('pt-BR').format(Number(valor ?? 0))

/** Converte "2026-03-15" ou ISO completo em Date respeitando o fuso local. */
function paraData(valor: string | Date | null | undefined): Date | null {
  if (!valor) return null
  if (valor instanceof Date) return valor
  const somenteData = /^\d{4}-\d{2}-\d{2}$/.test(valor)
  const data = somenteData ? new Date(`${valor}T12:00:00`) : new Date(valor)
  return Number.isNaN(data.getTime()) ? null : data
}

export const dataBr = (valor: string | Date | null | undefined): string => {
  const d = paraData(valor)
  return d ? d.toLocaleDateString('pt-BR') : '—'
}

export const dataHoraBr = (valor: string | Date | null | undefined): string => {
  const d = paraData(valor)
  return d
    ? d.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—'
}

export const horaBr = (valor: string | null | undefined): string =>
  valor ? valor.slice(0, 5) : '—'

export const mesReferencia = (valor: string | null | undefined): string => {
  const d = paraData(valor)
  if (!d) return '—'
  const texto = d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

/** "há 3 dias", "em 2 horas" */
export function tempoRelativo(valor: string | Date | null | undefined): string {
  const d = paraData(valor)
  if (!d) return '—'
  const diff = d.getTime() - Date.now()
  const rtf = new Intl.RelativeTimeFormat('pt-BR', { numeric: 'auto' })
  const unidades: [Intl.RelativeTimeFormatUnit, number][] = [
    ['year', 1000 * 60 * 60 * 24 * 365],
    ['month', 1000 * 60 * 60 * 24 * 30],
    ['day', 1000 * 60 * 60 * 24],
    ['hour', 1000 * 60 * 60],
    ['minute', 1000 * 60],
  ]
  for (const [unidade, ms] of unidades) {
    if (Math.abs(diff) >= ms) return rtf.format(Math.round(diff / ms), unidade)
  }
  return 'agora mesmo'
}

export const diasAte = (valor: string | null | undefined): number | null => {
  const d = paraData(valor)
  if (!d) return null
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  d.setHours(0, 0, 0, 0)
  return Math.round((d.getTime() - hoje.getTime()) / 86_400_000)
}

/** Data de hoje em "YYYY-MM-DD" (fuso local, serve para inputs date). */
export const hojeIso = (): string => {
  const d = new Date()
  const mes = String(d.getMonth() + 1).padStart(2, '0')
  const dia = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mes}-${dia}`
}

export const iniciais = (nome: string | null | undefined): string =>
  (nome ?? '?')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p.charAt(0).toUpperCase())
    .join('')

// ---------------------------------------------------------------
// Máscaras
// ---------------------------------------------------------------

const digitos = (v: string) => v.replace(/\D/g, '')

export function mascaraCpf(valor: string): string {
  const d = digitos(valor).slice(0, 11)
  return d
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

export function mascaraTelefone(valor: string): string {
  const d = digitos(valor).slice(0, 11)
  if (d.length <= 10) {
    return d.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d)/, '$1-$2')
  }
  return d.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2')
}

export function mascaraCep(valor: string): string {
  return digitos(valor).slice(0, 8).replace(/(\d{5})(\d)/, '$1-$2')
}

/** Validação de CPF pelos dígitos verificadores. */
export function cpfValido(valor: string): boolean {
  const cpf = digitos(valor)
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false
  const calcula = (ate: number) => {
    let soma = 0
    for (let i = 0; i < ate; i++) soma += Number(cpf[i]) * (ate + 1 - i)
    const resto = (soma * 10) % 11
    return resto === 10 ? 0 : resto
  }
  return calcula(9) === Number(cpf[9]) && calcula(10) === Number(cpf[10])
}

export const emailValido = (valor: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(valor.trim())

/** Remove acentos para buscas que ignoram acentuação. */
export const semAcento = (texto: string): string =>
  texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()

/** Exporta uma lista de objetos como CSV compatível com Excel pt-BR. */
export function baixarCsv(nomeArquivo: string, linhas: Record<string, unknown>[]): void {
  if (linhas.length === 0) return
  const colunas = Object.keys(linhas[0])
  const escapar = (v: unknown) => {
    const texto = v === null || v === undefined ? '' : String(v)
    return `"${texto.replace(/"/g, '""')}"`
  }
  const csv = [
    colunas.map(escapar).join(';'),
    ...linhas.map((linha) => colunas.map((c) => escapar(linha[c])).join(';')),
  ].join('\r\n')

  const blob = new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = nomeArquivo.endsWith('.csv') ? nomeArquivo : `${nomeArquivo}.csv`
  link.click()
  URL.revokeObjectURL(url)
}
