# Comunidade Fortaleza Alta

Plataforma de Gestão de Atendimento e Serviços da **Associação de Moradores da Fortaleza Alta** — Projeto de Extensão UNIASSELVI 2026.02.

Aplicativo web **PWA instalável** (funciona no celular como um app, em tela cheia e com acesso offline aos dados já carregados), com banco de dados real no **Supabase**.

---

## Funcionalidades

| Módulo | Morador | Diretoria / Admin |
|---|---|---|
| **Painel** | Resumo dos seus pedidos, agendamentos e mensalidades | Indicadores da associação e gráficos de atendimento |
| **Atendimentos** | Abre pedidos com protocolo (`AFA-2026-00001`), acompanha a linha do tempo, conversa com a diretoria e avalia o atendimento | Vê todos os pedidos, filtra, muda a situação, define responsável, escreve notas internas e exporta CSV |
| **Serviços** | Consulta o catálogo e agenda (declaração de residência, vistoria, poda…) | Cadastra, edita e desativa serviços |
| **Agendamentos** | Acompanha e cancela os seus | Confirma, marca como realizado ou cancela |
| **Espaços e reservas** | Reserva salão, quadra, sala de reuniões e churrasqueira | Confirma ou recusa; o sistema **bloqueia horários sobrepostos** |
| **Mensalidades** | Consulta o que está pago e o que está em aberto | Gera o mês para todos os ativos, dá baixa, marca atrasos e exporta |
| **Comunicados** | Lê os avisos da diretoria | Publica, fixa no topo ou guarda como rascunho |
| **Moradores** | — | Cadastro completo, busca, exportação; o admin promove ou desativa contas |
| **Relatórios** | — | Indicadores por período, satisfação, tempo médio, impressão e CSV |
| **Configurações** | — | Dados da associação, valor e vencimento da mensalidade, categorias e prazos |

Também: tema claro/escuro, layout para celular com navegação inferior, aviso de “sem conexão”, convite para instalar o app e atalhos na tela inicial.

## Tecnologias

- **React 18 + TypeScript + Vite**
- **Tailwind CSS**
- **Supabase** — PostgreSQL, autenticação e políticas de segurança (RLS)
- **vite-plugin-pwa / Workbox** — manifesto, service worker e cache offline

## Como executar

Requisitos: Node.js 20 ou superior.

```bash
npm install
```

```bash
npm run dev
```

Acesse `http://localhost:5173`. As chaves do Supabase já estão no arquivo `.env` (são chaves **publicáveis**, feitas para ficar no navegador; quem protege os dados são as políticas de RLS do banco).

Para gerar a versão de produção:

```bash
npm run build
```

### Primeiro acesso

1. Abra o aplicativo e clique em **Criar cadastro**.
2. **O primeiro cadastro do sistema vira Administrador automaticamente.** Os seguintes entram como Morador.
3. Em **Moradores**, o administrador pode promover outras pessoas para **Diretoria**.

## Publicação (GitHub Pages)

O workflow `.github/workflows/deploy.yml` publica o site a cada push na branch `main`.

1. No GitHub: **Settings → Pages → Source: GitHub Actions**.
2. Faça um push na `main`. O endereço será `https://<usuario>.github.io/<repositorio>/`.
3. No Supabase: **Authentication → URL Configuration**, coloque esse endereço em **Site URL** e em **Redirect URLs**. Sem isso, os links de confirmação de e-mail e de recuperação de senha apontam para `localhost`.

## Publicação (Vercel)

O arquivo `vercel.json` já traz a configuração necessária: importe o repositório no Vercel e mantenha o preset **Vite**. A regra de `rewrites` faz as rotas do aplicativo (`/solicitacoes`, `/servicos`…) abrirem o `index.html`; sem ela o Vercel devolve 404 ao recarregar a página ou abrir um link direto.

Lembre-se de incluir o endereço do Vercel também em **Redirect URLs** no Supabase.

## E-mails de cadastro (limite do Supabase)

O servidor de e-mail que vem com o Supabase envia **poucos e-mails por hora** (apenas para testes). Passando disso, cadastros e recuperações de senha falham com "limite de e-mails atingido". Há duas saídas, ambas no painel do Supabase:

- **Desligar a confirmação de e-mail:** *Authentication → Sign In / Providers → Email → Confirm email* (desligado). O cadastro deixa de enviar e-mail; a recuperação de senha continua enviando.
- **Usar um servidor de e-mail próprio (SMTP):** *Authentication → Emails → SMTP Settings* (por exemplo Resend, Brevo ou Gmail com senha de app) e, depois, aumentar o limite em *Authentication → Rate Limits*.

## Banco de dados

As migrações ficam em `supabase/migrations/` e já estão aplicadas no projeto Supabase.

| Tabela | Conteúdo |
|---|---|
| `perfis` | Moradores e equipe (ligada ao `auth.users`) |
| `categorias_servico` | Categorias de atendimento e prazo em dias |
| `solicitacoes` | Pedidos de atendimento, com protocolo automático |
| `solicitacao_interacoes` | Linha do tempo: mensagens, notas internas e mudanças de situação |
| `servicos` / `agendamentos` | Catálogo de serviços e horários marcados |
| `espacos` / `reservas` | Espaços comunitários e suas reservas |
| `mensalidades` | Contribuições mensais |
| `comunicados` | Avisos da diretoria |
| `configuracoes` | Dados da associação (registro único) |

**Automações no banco:** criação do perfil ao se cadastrar, protocolo sequencial, prazo calculado pela categoria, registro automático de cada mudança de situação, bloqueio de reservas sobrepostas, geração das mensalidades do mês e indicadores do painel em uma única consulta.

**Segurança (RLS):** cada morador só vê os próprios pedidos, agendamentos, reservas e mensalidades; notas internas só aparecem para a diretoria; ninguém consegue se promover a administrador nem abrir pedidos em nome de outra pessoa.

## Estrutura

```
src/
  componentes/   Layout, ícones, gráficos e componentes de interface
  contextos/     Autenticação, tema e avisos
  lib/           Cliente Supabase, tipos, formatação (R$, datas, CPF) e constantes
  paginas/       Uma página por módulo
supabase/migrations/   Esquema do banco, gatilhos, RLS e dados iniciais
public/                Ícones do aplicativo
```
