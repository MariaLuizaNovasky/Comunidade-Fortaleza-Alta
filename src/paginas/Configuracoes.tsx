import { useEffect, useState } from 'react'
import { useAviso } from '../contextos/AvisoContexto'
import { useConsulta } from '../lib/hooks'
import { mensagemErro, supabase } from '../lib/supabase'
import { mascaraTelefone } from '../lib/formato'
import type { CategoriaServico, Configuracoes as Config } from '../lib/tipos'
import {
  Alternador,
  Area,
  Botao,
  Campo,
  Cartao,
  Carregando,
  Confirmacao,
  Modal,
  TituloPagina,
} from '../componentes/ui'

export default function Configuracoes() {
  const aviso = useAviso()
  const [form, setForm] = useState<Config | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [editandoCategoria, setEditandoCategoria] = useState<Partial<CategoriaServico> | null>(null)
  const [excluindoCategoria, setExcluindoCategoria] = useState<CategoriaServico | null>(null)

  const { dados, carregando } = useConsulta<Config | null>(async () => {
    const { data, error } = await supabase.from('configuracoes').select('*').maybeSingle()
    if (error) throw new Error(mensagemErro(error))
    return data as Config | null
  }, [])

  const { dados: categorias, recarregar: recarregarCategorias } = useConsulta<CategoriaServico[]>(
    async () => {
      const { data, error } = await supabase.from('categorias_servico').select('*').order('nome')
      if (error) throw new Error(mensagemErro(error))
      return (data ?? []) as CategoriaServico[]
    },
    [],
  )

  useEffect(() => {
    if (dados) setForm(dados)
  }, [dados])

  async function salvar() {
    if (!form) return
    setSalvando(true)
    try {
      const { error } = await supabase
        .from('configuracoes')
        .update({
          nome_associacao: form.nome_associacao.trim(),
          cnpj: form.cnpj,
          endereco: form.endereco,
          telefone: form.telefone,
          email: form.email,
          valor_mensalidade: Number(form.valor_mensalidade),
          dia_vencimento: Number(form.dia_vencimento),
          horario_atendimento: form.horario_atendimento,
        })
        .eq('id', true)
      if (error) throw new Error(mensagemErro(error))
      aviso.sucesso('Configurações salvas.')
    } catch (e) {
      aviso.erro(e instanceof Error ? e.message : 'Não foi possível salvar.')
    } finally {
      setSalvando(false)
    }
  }

  async function salvarCategoria() {
    if (!editandoCategoria?.nome?.trim()) {
      aviso.erro('Informe o nome da categoria.')
      return
    }
    setSalvando(true)
    try {
      const registro = {
        nome: editandoCategoria.nome.trim(),
        descricao: editandoCategoria.descricao?.trim() || null,
        cor: editandoCategoria.cor ?? '#1d4ed8',
        prazo_dias: Number(editandoCategoria.prazo_dias ?? 7),
        ativo: editandoCategoria.ativo ?? true,
        icone: editandoCategoria.icone ?? 'wrench',
      }
      const { error } = editandoCategoria.id
        ? await supabase
            .from('categorias_servico')
            .update(registro)
            .eq('id', editandoCategoria.id)
        : await supabase.from('categorias_servico').insert(registro)
      if (error) throw new Error(mensagemErro(error))
      aviso.sucesso('Categoria salva.')
      setEditandoCategoria(null)
      recarregarCategorias()
    } catch (e) {
      aviso.erro(e instanceof Error ? e.message : 'Não foi possível salvar a categoria.')
    } finally {
      setSalvando(false)
    }
  }

  async function excluirCategoria() {
    if (!excluindoCategoria) return
    setSalvando(true)
    try {
      const { error } = await supabase
        .from('categorias_servico')
        .delete()
        .eq('id', excluindoCategoria.id)
      if (error) throw new Error(mensagemErro(error))
      aviso.sucesso('Categoria removida.')
      setExcluindoCategoria(null)
      recarregarCategorias()
    } catch (e) {
      aviso.erro(e instanceof Error ? e.message : 'Não foi possível remover.')
    } finally {
      setSalvando(false)
    }
  }

  if (carregando || !form) return <Carregando texto="Carregando configurações…" />

  return (
    <div className="mx-auto max-w-3xl">
      <TituloPagina
        titulo="Configurações"
        descricao="Dados da associação, valores e categorias de atendimento."
      />

      <Cartao className="space-y-4 p-5 sm:p-6">
        <h2 className="font-semibold">Dados da associação</h2>

        <Campo
          rotulo="Nome da associação"
          value={form.nome_associacao}
          onChange={(e) => setForm({ ...form, nome_associacao: e.target.value })}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo
            rotulo="CNPJ"
            value={form.cnpj ?? ''}
            onChange={(e) => setForm({ ...form, cnpj: e.target.value })}
          />
          <Campo
            rotulo="Telefone"
            value={form.telefone ?? ''}
            onChange={(e) => setForm({ ...form, telefone: mascaraTelefone(e.target.value) })}
          />
        </div>
        <Campo
          rotulo="E-mail de contato"
          type="email"
          value={form.email ?? ''}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <Area
          rotulo="Endereço da sede"
          rows={2}
          value={form.endereco ?? ''}
          onChange={(e) => setForm({ ...form, endereco: e.target.value })}
        />
        <Campo
          rotulo="Horário de atendimento"
          placeholder="Segunda a sexta, das 14h às 18h"
          value={form.horario_atendimento ?? ''}
          onChange={(e) => setForm({ ...form, horario_atendimento: e.target.value })}
        />

        <div className="border-t pt-4" style={{ borderColor: 'var(--borda)' }}>
          <h2 className="mb-4 font-semibold">Mensalidade</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo
              rotulo="Valor mensal (R$)"
              type="number"
              min={0}
              step="0.01"
              value={String(form.valor_mensalidade)}
              onChange={(e) => setForm({ ...form, valor_mensalidade: Number(e.target.value) })}
            />
            <Campo
              rotulo="Dia do vencimento"
              type="number"
              min={1}
              max={28}
              value={String(form.dia_vencimento)}
              dica="Usado ao gerar as mensalidades do mês."
              onChange={(e) => setForm({ ...form, dia_vencimento: Number(e.target.value) })}
            />
          </div>
        </div>

        <div className="flex justify-end border-t pt-4" style={{ borderColor: 'var(--borda)' }}>
          <Botao onClick={salvar} carregando={salvando}>
            Salvar configurações
          </Botao>
        </div>
      </Cartao>

      <Cartao className="mt-4">
        <div
          className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4"
          style={{ borderColor: 'var(--borda)' }}
        >
          <div>
            <h2 className="font-semibold">Categorias de atendimento</h2>
            <p className="texto-suave mt-0.5 text-sm">
              Cada categoria define o prazo esperado de atendimento.
            </p>
          </div>
          <Botao
            tamanho="pequeno"
            icone="mais"
            onClick={() =>
              setEditandoCategoria({ nome: '', descricao: '', prazo_dias: 7, cor: '#1d4ed8', ativo: true })
            }
          >
            Nova
          </Botao>
        </div>

        <ul className="divide-y" style={{ borderColor: 'var(--borda)' }}>
          {(categorias ?? []).map((c) => (
            <li key={c.id} className="flex flex-wrap items-center gap-3 px-5 py-3.5">
              <span
                className="h-4 w-4 shrink-0 rounded-full ring-2 ring-white/40"
                style={{ background: c.cor ?? '#64748b' }}
              />
              <div className="min-w-0 flex-1">
                <p className="font-semibold">
                  {c.nome}
                  {!c.ativo && <span className="texto-suave font-normal"> · inativa</span>}
                </p>
                <p className="texto-suave text-sm">
                  Prazo de {c.prazo_dias} {c.prazo_dias === 1 ? 'dia' : 'dias'}
                  {c.descricao ? ` · ${c.descricao}` : ''}
                </p>
              </div>
              <div className="flex gap-2">
                <Botao
                  variante="secundario"
                  tamanho="pequeno"
                  icone="editar"
                  onClick={() => setEditandoCategoria(c)}
                >
                  Editar
                </Botao>
                <Botao
                  variante="fantasma"
                  tamanho="pequeno"
                  icone="lixeira"
                  onClick={() => setExcluindoCategoria(c)}
                  aria-label={`Remover ${c.nome}`}
                />
              </div>
            </li>
          ))}
        </ul>
      </Cartao>

      <Modal
        aberto={!!editandoCategoria}
        aoFechar={() => setEditandoCategoria(null)}
        titulo={editandoCategoria?.id ? 'Editar categoria' : 'Nova categoria'}
        rodape={
          <>
            <Botao variante="secundario" onClick={() => setEditandoCategoria(null)}>
              Cancelar
            </Botao>
            <Botao onClick={salvarCategoria} carregando={salvando}>
              Salvar
            </Botao>
          </>
        }
      >
        {editandoCategoria && (
          <div className="space-y-4">
            <Campo
              rotulo="Nome"
              required
              value={editandoCategoria.nome ?? ''}
              onChange={(e) => setEditandoCategoria({ ...editandoCategoria, nome: e.target.value })}
            />
            <Area
              rotulo="Descrição"
              rows={2}
              value={editandoCategoria.descricao ?? ''}
              onChange={(e) =>
                setEditandoCategoria({ ...editandoCategoria, descricao: e.target.value })
              }
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Campo
                rotulo="Prazo (dias)"
                type="number"
                min={1}
                max={365}
                value={String(editandoCategoria.prazo_dias ?? 7)}
                onChange={(e) =>
                  setEditandoCategoria({
                    ...editandoCategoria,
                    prazo_dias: Number(e.target.value),
                  })
                }
              />
              <Campo
                rotulo="Cor de identificação"
                type="color"
                className="[&_input]:h-[46px] [&_input]:cursor-pointer [&_input]:p-1"
                value={editandoCategoria.cor ?? '#1d4ed8'}
                onChange={(e) => setEditandoCategoria({ ...editandoCategoria, cor: e.target.value })}
              />
            </div>
            <Alternador
              rotulo="Categoria ativa"
              marcado={editandoCategoria.ativo ?? true}
              aoMudar={(v) => setEditandoCategoria({ ...editandoCategoria, ativo: v })}
            />
          </div>
        )}
      </Modal>

      <Confirmacao
        aberto={!!excluindoCategoria}
        titulo="Remover categoria"
        mensagem={`Remover "${excluindoCategoria?.nome}"? Os atendimentos já registrados ficarão sem categoria.`}
        textoConfirmar="Remover"
        perigo
        carregando={salvando}
        aoConfirmar={excluirCategoria}
        aoCancelar={() => setExcluindoCategoria(null)}
      />
    </div>
  )
}
