import { useState } from 'react'
import { useAuth } from '../contextos/AuthContexto'
import { useAviso } from '../contextos/AvisoContexto'
import { useConsulta } from '../lib/hooks'
import { mensagemErro, supabase } from '../lib/supabase'
import { dataBr, tempoRelativo } from '../lib/formato'
import { CATEGORIAS_COMUNICADO } from '../lib/constantes'
import type { Comunicado, ComunicadoComAutor } from '../lib/tipos'
import { Icone } from '../componentes/Icone'
import {
  Alternador,
  Area,
  Botao,
  Campo,
  Cartao,
  Confirmacao,
  Esqueleto,
  Modal,
  Selecao,
  TituloPagina,
  Vazio,
} from '../componentes/ui'

const CORES_CATEGORIA: Record<string, string> = {
  geral: 'bg-slate-100 text-slate-700 dark:bg-slate-500/10 dark:text-slate-300',
  aviso: 'bg-sky-50 text-sky-800 dark:bg-sky-500/10 dark:text-sky-300',
  evento: 'bg-mata-50 text-mata-800 dark:bg-mata-400/10 dark:text-mata-200',
  obra: 'bg-terra-50 text-terra-800 dark:bg-terra-400/10 dark:text-terra-200',
  assembleia: 'bg-violet-50 text-violet-800 dark:bg-violet-500/10 dark:text-violet-300',
  urgente: 'bg-rose-50 text-rose-800 dark:bg-rose-500/10 dark:text-rose-300',
}

export default function Comunicados() {
  const { perfil, ehEquipe } = useAuth()
  const aviso = useAviso()

  const [editando, setEditando] = useState<Partial<Comunicado> | null>(null)
  const [excluindo, setExcluindo] = useState<ComunicadoComAutor | null>(null)
  const [salvando, setSalvando] = useState(false)

  const { dados, carregando, recarregar } = useConsulta<ComunicadoComAutor[]>(async () => {
    let consulta = supabase
      .from('comunicados')
      .select('*, autor:perfis(id,nome)')
      .order('fixado', { ascending: false })
      .order('publicado_em', { ascending: false })
      .limit(100)
    if (!ehEquipe) consulta = consulta.eq('publicado', true)
    const { data, error } = await consulta
    if (error) throw new Error(mensagemErro(error))
    return (data ?? []) as unknown as ComunicadoComAutor[]
  }, [ehEquipe])

  async function salvar() {
    if (!editando?.titulo?.trim() || !editando?.conteudo?.trim()) {
      aviso.erro('Preencha o título e o conteúdo do comunicado.')
      return
    }
    setSalvando(true)
    try {
      const registro = {
        titulo: editando.titulo.trim(),
        conteudo: editando.conteudo.trim(),
        categoria: editando.categoria ?? 'geral',
        fixado: editando.fixado ?? false,
        publicado: editando.publicado ?? true,
        autor_id: perfil?.id ?? null,
      }
      const { error } = editando.id
        ? await supabase.from('comunicados').update(registro).eq('id', editando.id)
        : await supabase.from('comunicados').insert(registro)
      if (error) throw new Error(mensagemErro(error))
      aviso.sucesso(editando.id ? 'Comunicado atualizado.' : 'Comunicado publicado.')
      setEditando(null)
      recarregar()
    } catch (e) {
      aviso.erro(e instanceof Error ? e.message : 'Não foi possível salvar o comunicado.')
    } finally {
      setSalvando(false)
    }
  }

  async function excluir() {
    if (!excluindo) return
    setSalvando(true)
    try {
      const { error } = await supabase.from('comunicados').delete().eq('id', excluindo.id)
      if (error) throw new Error(mensagemErro(error))
      aviso.sucesso('Comunicado removido.')
      setExcluindo(null)
      recarregar()
    } catch (e) {
      aviso.erro(e instanceof Error ? e.message : 'Não foi possível remover.')
    } finally {
      setSalvando(false)
    }
  }

  const rotuloCategoria = (valor: string | null) =>
    CATEGORIAS_COMUNICADO.find((c) => c.valor === valor)?.texto ?? 'Geral'

  return (
    <div className="mx-auto max-w-3xl">
      <TituloPagina
        titulo="Comunicados"
        descricao="Avisos, convocações e novidades publicadas pela diretoria da associação."
        acao={
          ehEquipe ? (
            <Botao
              icone="mais"
              onClick={() =>
                setEditando({
                  titulo: '',
                  conteudo: '',
                  categoria: 'geral',
                  fixado: false,
                  publicado: true,
                })
              }
            >
              Novo comunicado
            </Botao>
          ) : undefined
        }
      />

      {carregando ? (
        <Cartao>
          <Esqueleto linhas={4} />
        </Cartao>
      ) : (dados ?? []).length === 0 ? (
        <Cartao>
          <Vazio
            icone="comunicado"
            titulo="Nenhum comunicado publicado"
            descricao="Quando a diretoria publicar um aviso, ele aparece aqui."
          />
        </Cartao>
      ) : (
        <div className="space-y-4">
          {(dados ?? []).map((c) => (
            <Cartao
              key={c.id}
              className={`p-5 ${c.fixado ? 'ring-2 ring-terra-300 dark:ring-terra-700' : ''}`}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`selo ring-0 ${CORES_CATEGORIA[c.categoria ?? 'geral'] ?? CORES_CATEGORIA.geral}`}
                >
                  {rotuloCategoria(c.categoria)}
                </span>
                {c.fixado && (
                  <span className="selo bg-terra-100 text-terra-800 ring-terra-600/20 dark:bg-terra-400/10 dark:text-terra-200 dark:ring-terra-400/30">
                    <Icone nome="fixado" className="h-3 w-3" />
                    Fixado
                  </span>
                )}
                {!c.publicado && (
                  <span className="selo bg-slate-100 text-slate-700 ring-slate-500/20 dark:bg-slate-500/10 dark:text-slate-300 dark:ring-slate-400/30">
                    Rascunho
                  </span>
                )}
                <span className="texto-suave ml-auto text-xs">
                  {dataBr(c.publicado_em)} · {tempoRelativo(c.publicado_em)}
                </span>
              </div>

              <h2 className="mt-3 text-lg font-bold">{c.titulo}</h2>
              <p className="mt-2 whitespace-pre-wrap text-[15px] leading-relaxed">{c.conteudo}</p>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <p className="texto-suave text-sm">
                  {c.autor ? `Publicado por ${c.autor.nome}` : 'Diretoria da associação'}
                </p>
                {ehEquipe && (
                  <div className="sem-impressao flex gap-2">
                    <Botao
                      variante="secundario"
                      tamanho="pequeno"
                      icone="editar"
                      onClick={() => setEditando(c)}
                    >
                      Editar
                    </Botao>
                    <Botao
                      variante="fantasma"
                      tamanho="pequeno"
                      icone="lixeira"
                      onClick={() => setExcluindo(c)}
                      aria-label={`Remover ${c.titulo}`}
                    />
                  </div>
                )}
              </div>
            </Cartao>
          ))}
        </div>
      )}

      <Modal
        aberto={!!editando}
        aoFechar={() => setEditando(null)}
        titulo={editando?.id ? 'Editar comunicado' : 'Novo comunicado'}
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
              rotulo="Título"
              required
              maxLength={140}
              value={editando.titulo ?? ''}
              onChange={(e) => setEditando({ ...editando, titulo: e.target.value })}
            />
            <Selecao
              rotulo="Categoria"
              value={editando.categoria ?? 'geral'}
              onChange={(e) => setEditando({ ...editando, categoria: e.target.value })}
            >
              {CATEGORIAS_COMUNICADO.map((c) => (
                <option key={c.valor} value={c.valor}>
                  {c.texto}
                </option>
              ))}
            </Selecao>
            <Area
              rotulo="Conteúdo"
              required
              rows={8}
              value={editando.conteudo ?? ''}
              onChange={(e) => setEditando({ ...editando, conteudo: e.target.value })}
            />
            <Alternador
              rotulo="Fixar no topo"
              descricao="Comunicados fixados aparecem antes dos demais."
              marcado={editando.fixado ?? false}
              aoMudar={(v) => setEditando({ ...editando, fixado: v })}
            />
            <Alternador
              rotulo="Publicado"
              descricao="Desmarque para guardar como rascunho."
              marcado={editando.publicado ?? true}
              aoMudar={(v) => setEditando({ ...editando, publicado: v })}
            />
          </div>
        )}
      </Modal>

      <Confirmacao
        aberto={!!excluindo}
        titulo="Remover comunicado"
        mensagem={`Deseja remover "${excluindo?.titulo}"? Esta ação não pode ser desfeita.`}
        textoConfirmar="Remover"
        perigo
        carregando={salvando}
        aoConfirmar={excluir}
        aoCancelar={() => setExcluindo(null)}
      />
    </div>
  )
}
