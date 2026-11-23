import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contextos/AuthContexto'
import { useAviso } from '../contextos/AvisoContexto'
import { useTema } from '../contextos/TemaContexto'
import { dataBr, iniciais, mascaraCep, mascaraCpf, mascaraTelefone } from '../lib/formato'
import { PAPEIS } from '../lib/constantes'
import type { Perfil } from '../lib/tipos'
import { Icone } from '../componentes/Icone'
import { Alternador, Botao, Campo, Cartao, Carregando, Selo, TituloPagina } from '../componentes/ui'

export default function MeuPerfil() {
  const { perfil, atualizarPerfil, definirNovaSenha, sair } = useAuth()
  const { tema, alternarTema } = useTema()
  const aviso = useAviso()
  const navegar = useNavigate()

  const [form, setForm] = useState<Perfil | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [senha, setSenha] = useState('')
  const [confirmacao, setConfirmacao] = useState('')
  const [trocandoSenha, setTrocandoSenha] = useState(false)

  useEffect(() => {
    if (perfil) setForm(perfil)
  }, [perfil])

  if (!form) return <Carregando />

  async function salvar() {
    if (!form) return
    if (form.nome.trim().length < 3) {
      aviso.erro('Informe seu nome completo.')
      return
    }
    setSalvando(true)
    try {
      await atualizarPerfil({
        nome: form.nome.trim(),
        telefone: form.telefone,
        cpf: form.cpf || null,
        rua: form.rua,
        numero: form.numero,
        quadra: form.quadra,
        lote: form.lote,
        complemento: form.complemento,
        cep: form.cep,
      })
      aviso.sucesso('Dados atualizados.')
    } catch (e) {
      aviso.erro(e instanceof Error ? e.message : 'Não foi possível salvar.')
    } finally {
      setSalvando(false)
    }
  }

  async function trocarSenha() {
    if (senha.length < 6) {
      aviso.erro('A nova senha deve ter no mínimo 6 caracteres.')
      return
    }
    if (senha !== confirmacao) {
      aviso.erro('As senhas não conferem.')
      return
    }
    setTrocandoSenha(true)
    try {
      await definirNovaSenha(senha)
      setSenha('')
      setConfirmacao('')
      aviso.sucesso('Senha alterada com sucesso.')
    } catch (e) {
      aviso.erro(e instanceof Error ? e.message : 'Não foi possível alterar a senha.')
    } finally {
      setTrocandoSenha(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <TituloPagina titulo="Meu perfil" descricao="Seus dados cadastrais na associação." />

      <Cartao className="mb-4 flex flex-wrap items-center gap-4 p-5">
        <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-mata-700 text-xl font-bold text-white">
          {iniciais(form.nome)}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-bold">{form.nome}</h2>
            <Selo rotulo={PAPEIS[form.papel]} />
          </div>
          <p className="texto-suave mt-1 text-sm">{form.email}</p>
          <p className="texto-suave text-sm">
            Associado desde {dataBr(form.data_associacao)}
          </p>
        </div>
      </Cartao>

      <Cartao className="space-y-4 p-5 sm:p-6">
        <h2 className="font-semibold">Dados pessoais</h2>

        <Campo
          rotulo="Nome completo"
          value={form.nome}
          onChange={(e) => setForm({ ...form, nome: e.target.value })}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo
            rotulo="Telefone"
            type="tel"
            value={form.telefone ?? ''}
            onChange={(e) => setForm({ ...form, telefone: mascaraTelefone(e.target.value) })}
          />
          <Campo
            rotulo="CPF"
            value={form.cpf ?? ''}
            onChange={(e) => setForm({ ...form, cpf: mascaraCpf(e.target.value) })}
          />
        </div>
        <Campo rotulo="E-mail" value={form.email ?? ''} disabled dica="O e-mail de acesso não pode ser alterado aqui." />

        <div className="border-t pt-4" style={{ borderColor: 'var(--borda)' }}>
          <h2 className="mb-4 font-semibold">Endereço no bairro</h2>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-[1fr_6rem]">
              <Campo
                rotulo="Rua"
                value={form.rua ?? ''}
                onChange={(e) => setForm({ ...form, rua: e.target.value })}
              />
              <Campo
                rotulo="Número"
                value={form.numero ?? ''}
                onChange={(e) => setForm({ ...form, numero: e.target.value })}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <Campo
                rotulo="Quadra"
                value={form.quadra ?? ''}
                onChange={(e) => setForm({ ...form, quadra: e.target.value })}
              />
              <Campo
                rotulo="Lote"
                value={form.lote ?? ''}
                onChange={(e) => setForm({ ...form, lote: e.target.value })}
              />
              <Campo
                rotulo="CEP"
                value={form.cep ?? ''}
                onChange={(e) => setForm({ ...form, cep: mascaraCep(e.target.value) })}
              />
            </div>
            <Campo
              rotulo="Complemento"
              value={form.complemento ?? ''}
              onChange={(e) => setForm({ ...form, complemento: e.target.value })}
            />
          </div>
        </div>

        <div className="flex justify-end border-t pt-4" style={{ borderColor: 'var(--borda)' }}>
          <Botao onClick={salvar} carregando={salvando}>
            Salvar alterações
          </Botao>
        </div>
      </Cartao>

      <Cartao className="mt-4 space-y-4 p-5 sm:p-6">
        <h2 className="font-semibold">Alterar senha</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo
            rotulo="Nova senha"
            type="password"
            autoComplete="new-password"
            placeholder="Mínimo de 6 caracteres"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
          />
          <Campo
            rotulo="Confirme a nova senha"
            type="password"
            autoComplete="new-password"
            value={confirmacao}
            onChange={(e) => setConfirmacao(e.target.value)}
          />
        </div>
        <div className="flex justify-end">
          <Botao
            variante="secundario"
            icone="cadeado"
            onClick={trocarSenha}
            carregando={trocandoSenha}
            disabled={!senha || !confirmacao}
          >
            Alterar senha
          </Botao>
        </div>
      </Cartao>

      <Cartao className="mt-4 space-y-4 p-5 sm:p-6">
        <h2 className="font-semibold">Preferências do aplicativo</h2>
        <Alternador
          rotulo="Tema escuro"
          descricao="Reduz o brilho da tela em ambientes com pouca luz."
          marcado={tema === 'escuro'}
          aoMudar={alternarTema}
        />
        <div className="texto-suave flex items-start gap-2.5 rounded-xl bg-mata-500/5 px-4 py-3 text-sm">
          <Icone nome="instalar" className="mt-0.5 h-[18px] w-[18px] shrink-0" />
          <span>
            Este site pode ser instalado como aplicativo. No celular, use a opção
            “Adicionar à tela de início” do navegador; no computador, o ícone de instalação
            na barra de endereços.
          </span>
        </div>
      </Cartao>

      <div className="mt-4 flex justify-center">
        <Botao
          variante="fantasma"
          icone="sair"
          className="text-rose-600 dark:text-rose-400"
          onClick={async () => {
            await sair()
            navegar('/entrar', { replace: true })
          }}
        >
          Sair da conta
        </Botao>
      </div>
    </div>
  )
}
