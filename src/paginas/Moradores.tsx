import { useMemo, useState } from 'react'
import { useAuth } from '../contextos/AuthContexto'
import { useAviso } from '../contextos/AvisoContexto'
import { useAtraso, useConsulta } from '../lib/hooks'
import { mensagemErro, supabase } from '../lib/supabase'
import {
  baixarCsv,
  dataBr,
  iniciais,
  mascaraCep,
  mascaraCpf,
  mascaraTelefone,
  semAcento,
} from '../lib/formato'
import { PAPEIS } from '../lib/constantes'
import type { PapelUsuario, Perfil } from '../lib/tipos'
import { Icone } from '../componentes/Icone'
import {
  Alternador,
  Area,
  Botao,
  Campo,
  Cartao,
  Esqueleto,
  Modal,
  Paginacao,
  Selecao,
  Selo,
  TituloPagina,
  Vazio,
} from '../componentes/ui'

const POR_PAGINA = 15

export default function Moradores() {
  const { ehAdmin, perfil: meuPerfil } = useAuth()
  const aviso = useAviso()

  const [busca, setBusca] = useState('')
  const [papel, setPapel] = useState<'todos' | PapelUsuario>('todos')
  const [situacao, setSituacao] = useState<'todos' | 'ativos' | 'inativos'>('ativos')
  const [pagina, setPagina] = useState(1)
  const [editando, setEditando] = useState<Perfil | null>(null)
  const [salvando, setSalvando] = useState(false)
  const buscaAdiada = useAtraso(busca)

  const { dados, carregando, recarregar } = useConsulta<Perfil[]>(async () => {
    const { data, error } = await supabase.from('perfis').select('*').order('nome').limit(1000)
    if (error) throw new Error(mensagemErro(error))
    return (data ?? []) as Perfil[]
  }, [])

  const filtrados = useMemo(() => {
    let lista = dados ?? []
    if (papel !== 'todos') lista = lista.filter((p) => p.papel === papel)
    if (situacao !== 'todos') lista = lista.filter((p) => p.ativo === (situacao === 'ativos'))

    const termo = semAcento(buscaAdiada.trim())
    if (termo) {
      lista = lista.filter((p) =>
        [p.nome, p.email ?? '', p.cpf ?? '', p.telefone ?? '', p.rua ?? '']
          .map(semAcento)
          .some((c) => c.includes(termo)),
      )
    }
    return lista
  }, [dados, papel, situacao, buscaAdiada])

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / POR_PAGINA))
  const paginaAtual = Math.min(pagina, totalPaginas)
  const visiveis = filtrados.slice((paginaAtual - 1) * POR_PAGINA, paginaAtual * POR_PAGINA)

  async function salvar() {
    if (!editando) return
    setSalvando(true)
    try {
      const registro: Partial<Perfil> = {
        nome: editando.nome.trim(),
        telefone: editando.telefone,
        cpf: editando.cpf || null,
        rua: editando.rua,
        numero: editando.numero,
        quadra: editando.quadra,
        lote: editando.lote,
        complemento: editando.complemento,
        cep: editando.cep,
        observacoes: editando.observacoes,
      }
      // Papel e situação só podem ser alterados por administradores.
      if (ehAdmin) {
        registro.papel = editando.papel
        registro.ativo = editando.ativo
      }

      const { error } = await supabase.from('perfis').update(registro).eq('id', editando.id)
      if (error) throw new Error(mensagemErro(error))
      aviso.sucesso('Cadastro atualizado.')
      setEditando(null)
      recarregar()
    } catch (e) {
      aviso.erro(e instanceof Error ? e.message : 'Não foi possível salvar o cadastro.')
    } finally {
      setSalvando(false)
    }
  }

  const exportar = () =>
    baixarCsv(
      `moradores-${new Date().toISOString().slice(0, 10)}`,
      filtrados.map((p) => ({
        Nome: p.nome,
        'E-mail': p.email ?? '',
        CPF: p.cpf ?? '',
        Telefone: p.telefone ?? '',
        Endereço: [p.rua, p.numero].filter(Boolean).join(', '),
        Quadra: p.quadra ?? '',
        Lote: p.lote ?? '',
        Perfil: PAPEIS[p.papel].texto,
        Situação: p.ativo ? 'Ativo' : 'Inativo',
        'Associado desde': dataBr(p.data_associacao),
      })),
    )

  return (
    <div>
      <TituloPagina
        titulo="Moradores"
        descricao="Cadastro dos associados da Fortaleza Alta."
        acao={
          filtrados.length > 0 ? (
            <Botao variante="secundario" icone="baixar" onClick={exportar}>
              Exportar
            </Botao>
          ) : undefined
        }
      />

      <Cartao className="sem-impressao mb-4 p-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <Campo
            placeholder="Buscar por nome, e-mail ou CPF"
            icone="busca"
            value={busca}
            onChange={(e) => {
              setBusca(e.target.value)
              setPagina(1)
            }}
            aria-label="Buscar morador"
          />
          <Selecao
            value={papel}
            onChange={(e) => {
              setPapel(e.target.value as typeof papel)
              setPagina(1)
            }}
            aria-label="Filtrar por perfil"
          >
            <option value="todos">Todos os perfis</option>
            {(Object.keys(PAPEIS) as PapelUsuario[]).map((p) => (
              <option key={p} value={p}>
                {PAPEIS[p].texto}
              </option>
            ))}
          </Selecao>
          <Selecao
            value={situacao}
            onChange={(e) => {
              setSituacao(e.target.value as typeof situacao)
              setPagina(1)
            }}
            aria-label="Filtrar por situação"
          >
            <option value="ativos">Somente ativos</option>
            <option value="inativos">Somente inativos</option>
            <option value="todos">Todos</option>
          </Selecao>
        </div>
        <p className="texto-suave mt-3 text-sm">
          {filtrados.length} {filtrados.length === 1 ? 'morador' : 'moradores'}
        </p>
      </Cartao>

      <Cartao>
        {carregando ? (
          <Esqueleto linhas={6} />
        ) : visiveis.length === 0 ? (
          <Vazio icone="moradores" titulo="Nenhum morador encontrado" />
        ) : (
          <>
            <ul className="divide-y" style={{ borderColor: 'var(--borda)' }}>
              {visiveis.map((p) => (
                <li key={p.id} className="flex flex-wrap items-center gap-4 px-5 py-3.5">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-mata-700 text-sm font-bold text-white">
                    {iniciais(p.nome)}
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">{p.nome}</p>
                      {p.papel !== 'morador' && <Selo rotulo={PAPEIS[p.papel]} />}
                      {!p.ativo && (
                        <span className="selo bg-rose-50 text-rose-800 ring-rose-600/20 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-400/30">
                          Inativo
                        </span>
                      )}
                    </div>
                    <p className="texto-suave mt-0.5 flex flex-wrap gap-x-4 gap-y-0.5 text-sm">
                      {p.email && (
                        <span className="inline-flex items-center gap-1.5">
                          <Icone nome="email" className="h-3.5 w-3.5" />
                          {p.email}
                        </span>
                      )}
                      {p.telefone && (
                        <span className="inline-flex items-center gap-1.5">
                          <Icone nome="telefone" className="h-3.5 w-3.5" />
                          {p.telefone}
                        </span>
                      )}
                      {p.rua && (
                        <span className="inline-flex items-center gap-1.5">
                          <Icone nome="local" className="h-3.5 w-3.5" />
                          {[p.rua, p.numero].filter(Boolean).join(', ')}
                        </span>
                      )}
                    </p>
                  </div>

                  <Botao
                    variante="secundario"
                    tamanho="pequeno"
                    icone="editar"
                    className="sem-impressao"
                    onClick={() => setEditando(p)}
                  >
                    Editar
                  </Botao>
                </li>
              ))}
            </ul>
            <Paginacao
              pagina={paginaAtual}
              totalPaginas={totalPaginas}
              aoMudar={setPagina}
              totalItens={filtrados.length}
            />
          </>
        )}
      </Cartao>

      <Modal
        aberto={!!editando}
        aoFechar={() => setEditando(null)}
        titulo="Editar cadastro"
        largura="max-w-2xl"
        rodape={
          <>
            <Botao variante="secundario" onClick={() => setEditando(null)}>
              Cancelar
            </Botao>
            <Botao onClick={salvar} carregando={salvando}>
              Salvar
            </Botao>
          </>
        }
      >
        {editando && (
          <div className="space-y-4">
            <Campo
              rotulo="Nome completo"
              value={editando.nome}
              onChange={(e) => setEditando({ ...editando, nome: e.target.value })}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Campo
                rotulo="Telefone"
                value={editando.telefone ?? ''}
                onChange={(e) =>
                  setEditando({ ...editando, telefone: mascaraTelefone(e.target.value) })
                }
              />
              <Campo
                rotulo="CPF"
                value={editando.cpf ?? ''}
                onChange={(e) => setEditando({ ...editando, cpf: mascaraCpf(e.target.value) })}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-[1fr_6rem]">
              <Campo
                rotulo="Rua"
                value={editando.rua ?? ''}
                onChange={(e) => setEditando({ ...editando, rua: e.target.value })}
              />
              <Campo
                rotulo="Número"
                value={editando.numero ?? ''}
                onChange={(e) => setEditando({ ...editando, numero: e.target.value })}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <Campo
                rotulo="Quadra"
                value={editando.quadra ?? ''}
                onChange={(e) => setEditando({ ...editando, quadra: e.target.value })}
              />
              <Campo
                rotulo="Lote"
                value={editando.lote ?? ''}
                onChange={(e) => setEditando({ ...editando, lote: e.target.value })}
              />
              <Campo
                rotulo="CEP"
                value={editando.cep ?? ''}
                onChange={(e) => setEditando({ ...editando, cep: mascaraCep(e.target.value) })}
              />
            </div>
            <Campo
              rotulo="Complemento"
              value={editando.complemento ?? ''}
              onChange={(e) => setEditando({ ...editando, complemento: e.target.value })}
            />
            <Area
              rotulo="Observações internas"
              rows={2}
              value={editando.observacoes ?? ''}
              onChange={(e) => setEditando({ ...editando, observacoes: e.target.value })}
            />

            {ehAdmin ? (
              <div className="space-y-4 border-t pt-4" style={{ borderColor: 'var(--borda)' }}>
                <Selecao
                  rotulo="Perfil de acesso"
                  value={editando.papel}
                  disabled={editando.id === meuPerfil?.id}
                  onChange={(e) =>
                    setEditando({ ...editando, papel: e.target.value as PapelUsuario })
                  }
                >
                  {(Object.keys(PAPEIS) as PapelUsuario[]).map((p) => (
                    <option key={p} value={p}>
                      {PAPEIS[p].texto}
                    </option>
                  ))}
                </Selecao>
                {editando.id === meuPerfil?.id && (
                  <p className="texto-suave text-sm">
                    Você não pode alterar o próprio perfil de acesso.
                  </p>
                )}
                <Alternador
                  rotulo="Cadastro ativo"
                  descricao="Cadastros inativos não conseguem acessar a plataforma."
                  marcado={editando.ativo}
                  desabilitado={editando.id === meuPerfil?.id}
                  aoMudar={(v) => setEditando({ ...editando, ativo: v })}
                />
              </div>
            ) : (
              <p className="texto-suave border-t pt-4 text-sm" style={{ borderColor: 'var(--borda)' }}>
                Somente administradores podem alterar o perfil de acesso e ativar ou desativar
                cadastros.
              </p>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
