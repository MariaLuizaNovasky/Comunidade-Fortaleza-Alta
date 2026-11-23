import { useEffect, useState, type FormEvent } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contextos/AuthContexto'
import { useAviso } from '../contextos/AvisoContexto'
import { useTema } from '../contextos/TemaContexto'
import { Icone } from '../componentes/Icone'
import { Botao, Campo } from '../componentes/ui'
import { cpfValido, emailValido, mascaraCpf, mascaraTelefone } from '../lib/formato'

type Aba = 'entrar' | 'cadastrar' | 'recuperar'

const DESTAQUES = [
  { icone: 'chamado' as const, titulo: 'Atendimento com protocolo', texto: 'Abra um pedido e acompanhe cada etapa até a conclusão.' },
  { icone: 'agenda' as const, titulo: 'Serviços e espaços', texto: 'Agende atendimentos e reserve o salão, a quadra e a sala de reuniões.' },
  { icone: 'comunicado' as const, titulo: 'Avisos da diretoria', texto: 'Receba comunicados, convocações e novidades do bairro.' },
]

export default function Entrar() {
  const { sessao, entrar, cadastrar, recuperarSenha, definirNovaSenha } = useAuth()
  const aviso = useAviso()
  const { tema, alternarTema } = useTema()
  const local = useLocation()

  const [aba, setAba] = useState<Aba>('entrar')
  const [enviando, setEnviando] = useState(false)
  const [verSenha, setVerSenha] = useState(false)
  const [redefinindo, setRedefinindo] = useState(false)
  const [erros, setErros] = useState<Record<string, string>>({})

  const [form, setForm] = useState({
    nome: '',
    email: '',
    senha: '',
    confirmacao: '',
    telefone: '',
    cpf: '',
    rua: '',
    numero: '',
  })

  const definir = (campo: keyof typeof form, valor: string) =>
    setForm((f) => ({ ...f, [campo]: valor }))

  // Link de redefinição de senha enviado por e-mail
  useEffect(() => {
    const hash = window.location.hash
    if (hash.includes('type=recovery')) setRedefinindo(true)
  }, [])

  if (sessao && !redefinindo) {
    const destino = (local.state as { de?: string } | null)?.de ?? '/'
    return <Navigate to={destino} replace />
  }

  function validar(): boolean {
    const novos: Record<string, string> = {}

    if (redefinindo) {
      if (form.senha.length < 6) novos.senha = 'Use no mínimo 6 caracteres.'
      if (form.senha !== form.confirmacao) novos.confirmacao = 'As senhas não conferem.'
      setErros(novos)
      return Object.keys(novos).length === 0
    }

    if (!emailValido(form.email)) novos.email = 'Informe um e-mail válido.'

    if (aba !== 'recuperar' && form.senha.length < 6) {
      novos.senha = 'A senha deve ter no mínimo 6 caracteres.'
    }

    if (aba === 'cadastrar') {
      if (form.nome.trim().length < 3) novos.nome = 'Informe seu nome completo.'
      if (form.senha !== form.confirmacao) novos.confirmacao = 'As senhas não conferem.'
      if (form.cpf && !cpfValido(form.cpf)) novos.cpf = 'CPF inválido.'
    }

    setErros(novos)
    return Object.keys(novos).length === 0
  }

  async function enviar(e: FormEvent) {
    e.preventDefault()
    if (!validar()) return
    setEnviando(true)
    try {
      if (redefinindo) {
        await definirNovaSenha(form.senha)
        aviso.sucesso('Senha alterada com sucesso.')
        window.location.hash = ''
        setRedefinindo(false)
        return
      }

      if (aba === 'entrar') {
        await entrar(form.email, form.senha)
        aviso.sucesso('Bem-vindo de volta!')
      } else if (aba === 'cadastrar') {
        const { precisaConfirmar } = await cadastrar({
          nome: form.nome,
          email: form.email,
          senha: form.senha,
          telefone: form.telefone,
          cpf: form.cpf,
          rua: form.rua,
          numero: form.numero,
        })
        if (precisaConfirmar) {
          aviso.info('Cadastro criado! Confirme o e-mail enviado para ativar o acesso.')
          setAba('entrar')
        } else {
          aviso.sucesso('Cadastro concluído. Seja bem-vindo!')
        }
      } else {
        await recuperarSenha(form.email)
        aviso.info('Se o e-mail estiver cadastrado, enviaremos o link de recuperação.')
        setAba('entrar')
      }
    } catch (erro) {
      aviso.erro(erro instanceof Error ? erro.message : 'Não foi possível concluir a operação.')
    } finally {
      setEnviando(false)
    }
  }

  const titulo = redefinindo
    ? 'Defina a nova senha'
    : aba === 'entrar'
      ? 'Entrar na plataforma'
      : aba === 'cadastrar'
        ? 'Criar meu cadastro'
        : 'Recuperar o acesso'

  const descricao = redefinindo
    ? 'Escolha uma nova senha para acessar sua conta.'
    : aba === 'entrar'
      ? 'Informe seus dados para acessar os serviços da associação.'
      : aba === 'cadastrar'
        ? 'Moradores associados podem criar o acesso em poucos passos.'
        : 'Informe o e-mail cadastrado e enviaremos um link de redefinição.'

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      {/* Apresentação */}
      <section className="relative flex flex-col justify-between bg-mata-800 px-6 py-8 text-mata-50 lg:w-[46%] lg:px-12 lg:py-12">
        <div
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 15%, #459d83 0, transparent 45%), radial-gradient(circle at 85% 80%, #dfa036 0, transparent 40%)',
          }}
          aria-hidden="true"
        />
        <div className="relative">
          <div className="flex items-center gap-3">
            <img
              src={`${import.meta.env.BASE_URL}favicon.svg`}
              alt=""
              className="h-12 w-12 rounded-2xl"
            />
            <div className="leading-tight">
              <p className="text-lg font-bold">Fortaleza Alta</p>
              <p className="text-sm text-mata-200">Associação de Moradores</p>
            </div>
          </div>

          <h1 className="mt-10 max-w-md text-3xl font-bold leading-tight lg:mt-14 lg:text-[40px]">
            A gestão do nosso bairro na palma da mão
          </h1>
          <p className="mt-3 max-w-md text-mata-200">
            Plataforma de gestão de atendimento e serviços da Associação de Moradores da
            Fortaleza Alta.
          </p>

          <ul className="mt-9 space-y-4 lg:mt-12">
            {DESTAQUES.map((d) => (
              <li key={d.titulo} className="flex gap-3.5">
                <span className="mt-0.5 h-fit rounded-xl bg-mata-50/10 p-2.5">
                  <Icone nome={d.icone} className="h-5 w-5" />
                </span>
                <span>
                  <span className="block font-semibold">{d.titulo}</span>
                  <span className="block text-sm text-mata-200">{d.texto}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative mt-10 text-xs text-mata-300">
          Projeto de Extensão · UNIASSELVI 2026.02
        </p>
      </section>

      {/* Formulário */}
      <section className="flex flex-1 items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">{titulo}</h2>
              <p className="texto-suave mt-1 text-[15px]">{descricao}</p>
            </div>
            <button
              type="button"
              onClick={alternarTema}
              className="shrink-0 rounded-xl p-2 transition hover:bg-mata-500/10"
              aria-label={tema === 'claro' ? 'Ativar tema escuro' : 'Ativar tema claro'}
            >
              <Icone nome={tema === 'claro' ? 'lua' : 'sol'} />
            </button>
          </div>

          {!redefinindo && (
            <div
              className="superficie mb-6 grid grid-cols-2 gap-1 rounded-xl border p-1"
              role="tablist"
            >
              {(['entrar', 'cadastrar'] as const).map((valor) => (
                <button
                  key={valor}
                  type="button"
                  role="tab"
                  aria-selected={aba === valor}
                  onClick={() => {
                    setAba(valor)
                    setErros({})
                  }}
                  className={`rounded-lg py-2 text-sm font-semibold transition ${
                    aba === valor
                      ? 'bg-mata-700 text-white'
                      : 'texto-suave hover:bg-mata-500/10'
                  }`}
                >
                  {valor === 'entrar' ? 'Já sou cadastrado' : 'Criar cadastro'}
                </button>
              ))}
            </div>
          )}

          <form onSubmit={enviar} className="space-y-4" noValidate>
            {aba === 'cadastrar' && !redefinindo && (
              <Campo
                rotulo="Nome completo"
                required
                autoComplete="name"
                placeholder="Maria da Silva"
                value={form.nome}
                erro={erros.nome}
                onChange={(e) => definir('nome', e.target.value)}
              />
            )}

            {!redefinindo && (
              <Campo
                rotulo="E-mail"
                type="email"
                required
                icone="email"
                autoComplete="email"
                inputMode="email"
                placeholder="voce@email.com"
                value={form.email}
                erro={erros.email}
                onChange={(e) => definir('email', e.target.value)}
              />
            )}

            {aba !== 'recuperar' && (
              <div className="relative">
                <Campo
                  rotulo="Senha"
                  type={verSenha ? 'text' : 'password'}
                  required
                  autoComplete={aba === 'entrar' ? 'current-password' : 'new-password'}
                  placeholder="Mínimo de 6 caracteres"
                  value={form.senha}
                  erro={erros.senha}
                  onChange={(e) => definir('senha', e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setVerSenha((v) => !v)}
                  className="texto-suave absolute right-3 top-[38px] rounded-lg p-1 transition hover:bg-mata-500/10"
                  aria-label={verSenha ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  <Icone nome={verSenha ? 'olho-fechado' : 'olho'} className="h-[18px] w-[18px]" />
                </button>
              </div>
            )}

            {(aba === 'cadastrar' || redefinindo) && (
              <Campo
                rotulo="Confirme a senha"
                type={verSenha ? 'text' : 'password'}
                required
                autoComplete="new-password"
                value={form.confirmacao}
                erro={erros.confirmacao}
                onChange={(e) => definir('confirmacao', e.target.value)}
              />
            )}

            {aba === 'cadastrar' && !redefinindo && (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Campo
                    rotulo="Telefone"
                    type="tel"
                    inputMode="tel"
                    placeholder="(47) 90000-0000"
                    value={form.telefone}
                    onChange={(e) => definir('telefone', mascaraTelefone(e.target.value))}
                  />
                  <Campo
                    rotulo="CPF"
                    inputMode="numeric"
                    placeholder="000.000.000-00"
                    value={form.cpf}
                    erro={erros.cpf}
                    onChange={(e) => definir('cpf', mascaraCpf(e.target.value))}
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-[1fr_7rem]">
                  <Campo
                    rotulo="Rua"
                    placeholder="Rua das Palmeiras"
                    value={form.rua}
                    onChange={(e) => definir('rua', e.target.value)}
                  />
                  <Campo
                    rotulo="Número"
                    inputMode="numeric"
                    placeholder="123"
                    value={form.numero}
                    onChange={(e) => definir('numero', e.target.value)}
                  />
                </div>
              </>
            )}

            <Botao type="submit" blocoCompleto carregando={enviando}>
              {redefinindo
                ? 'Salvar nova senha'
                : aba === 'entrar'
                  ? 'Entrar'
                  : aba === 'cadastrar'
                    ? 'Criar cadastro'
                    : 'Enviar link de recuperação'}
            </Botao>
          </form>

          {!redefinindo && (
            <div className="mt-5 text-center text-sm">
              {aba === 'recuperar' ? (
                <button
                  type="button"
                  onClick={() => setAba('entrar')}
                  className="font-semibold text-mata-700 hover:underline dark:text-mata-300"
                >
                  Voltar para o acesso
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setAba('recuperar')}
                  className="font-semibold text-mata-700 hover:underline dark:text-mata-300"
                >
                  Esqueci minha senha
                </button>
              )}
            </div>
          )}

          <p className="texto-suave mt-8 text-center text-xs leading-relaxed">
            O primeiro cadastro criado no sistema recebe o perfil de administrador.
            Os demais entram como moradores e podem ser promovidos pela diretoria.
          </p>
        </div>
      </section>
    </div>
  )
}
