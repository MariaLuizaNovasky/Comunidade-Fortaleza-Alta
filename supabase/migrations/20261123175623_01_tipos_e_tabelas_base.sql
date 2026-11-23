-- ============================================================
-- Associacao de Moradores da Fortaleza Alta
-- Plataforma de Gestao de Atendimento e Servicos
-- Migracao 01: tipos enumerados e tabelas base
-- ============================================================

create type public.papel_usuario as enum ('admin', 'diretoria', 'morador');

create type public.status_solicitacao as enum (
  'aberta', 'em_analise', 'em_andamento', 'aguardando_morador', 'concluida', 'cancelada'
);

create type public.prioridade_solicitacao as enum ('baixa', 'media', 'alta', 'urgente');

create type public.status_agendamento as enum ('pendente', 'confirmado', 'realizado', 'cancelado');

create type public.status_reserva as enum ('pendente', 'confirmada', 'cancelada', 'concluida');

create type public.status_mensalidade as enum ('pendente', 'paga', 'atrasada', 'isenta');

-- ------------------------------------------------------------
-- Perfis (dados dos moradores, vinculados ao auth.users)
-- ------------------------------------------------------------
create table public.perfis (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text not null,
  email text,
  cpf text unique,
  telefone text,
  papel public.papel_usuario not null default 'morador',
  rua text,
  numero text,
  quadra text,
  lote text,
  complemento text,
  bairro text default 'Fortaleza Alta',
  cidade text default 'Blumenau',
  uf text default 'SC',
  cep text,
  data_associacao date default current_date,
  ativo boolean not null default true,
  observacoes text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

comment on table public.perfis is 'Moradores associados e equipe da associacao';

-- ------------------------------------------------------------
-- Categorias de servico / atendimento
-- ------------------------------------------------------------
create table public.categorias_servico (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  descricao text,
  icone text default 'wrench',
  cor text default '#1d4ed8',
  prazo_dias integer not null default 7,
  ativo boolean not null default true,
  criado_em timestamptz not null default now()
);

comment on table public.categorias_servico is 'Categorias de atendimento (iluminacao, limpeza, seguranca, etc.)';

-- ------------------------------------------------------------
-- Solicitacoes de atendimento (chamados)
-- ------------------------------------------------------------
create sequence public.seq_protocolo_solicitacao start 1;

create table public.solicitacoes (
  id uuid primary key default gen_random_uuid(),
  protocolo text not null unique
    default 'AFA-' || to_char(now(), 'YYYY') || '-'
            || lpad(nextval('public.seq_protocolo_solicitacao')::text, 5, '0'),
  morador_id uuid not null references public.perfis(id) on delete cascade,
  categoria_id uuid references public.categorias_servico(id) on delete set null,
  titulo text not null,
  descricao text not null,
  status public.status_solicitacao not null default 'aberta',
  prioridade public.prioridade_solicitacao not null default 'media',
  local_ocorrencia text,
  responsavel_id uuid references public.perfis(id) on delete set null,
  prazo_atendimento date,
  avaliacao integer check (avaliacao between 1 and 5),
  avaliacao_comentario text,
  concluida_em timestamptz,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

comment on table public.solicitacoes is 'Chamados de atendimento abertos pelos moradores';

create index idx_solicitacoes_morador on public.solicitacoes(morador_id);
create index idx_solicitacoes_status on public.solicitacoes(status);
create index idx_solicitacoes_criado on public.solicitacoes(criado_em desc);

-- ------------------------------------------------------------
-- Historico / mensagens de uma solicitacao
-- ------------------------------------------------------------
create table public.solicitacao_interacoes (
  id uuid primary key default gen_random_uuid(),
  solicitacao_id uuid not null references public.solicitacoes(id) on delete cascade,
  autor_id uuid references public.perfis(id) on delete set null,
  mensagem text not null,
  status_anterior public.status_solicitacao,
  status_novo public.status_solicitacao,
  interna boolean not null default false,
  criado_em timestamptz not null default now()
);

comment on table public.solicitacao_interacoes is 'Linha do tempo de cada chamado';

create index idx_interacoes_solicitacao on public.solicitacao_interacoes(solicitacao_id, criado_em);

-- ------------------------------------------------------------
-- Servicos oferecidos pela associacao
-- ------------------------------------------------------------
create table public.servicos (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  descricao text,
  categoria_id uuid references public.categorias_servico(id) on delete set null,
  valor numeric(10,2) not null default 0,
  duracao_minutos integer not null default 60,
  requer_agendamento boolean not null default true,
  ativo boolean not null default true,
  criado_em timestamptz not null default now()
);

comment on table public.servicos is 'Catalogo de servicos da associacao';

-- ------------------------------------------------------------
-- Agendamentos de servicos
-- ------------------------------------------------------------
create table public.agendamentos (
  id uuid primary key default gen_random_uuid(),
  servico_id uuid not null references public.servicos(id) on delete cascade,
  morador_id uuid not null references public.perfis(id) on delete cascade,
  data_hora timestamptz not null,
  status public.status_agendamento not null default 'pendente',
  observacoes text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index idx_agendamentos_morador on public.agendamentos(morador_id);
create index idx_agendamentos_data on public.agendamentos(data_hora);

-- ------------------------------------------------------------
-- Espacos comunitarios e reservas
-- ------------------------------------------------------------
create table public.espacos (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  descricao text,
  capacidade integer not null default 0,
  valor_locacao numeric(10,2) not null default 0,
  regras text,
  ativo boolean not null default true,
  criado_em timestamptz not null default now()
);

create table public.reservas (
  id uuid primary key default gen_random_uuid(),
  espaco_id uuid not null references public.espacos(id) on delete cascade,
  morador_id uuid not null references public.perfis(id) on delete cascade,
  data date not null,
  hora_inicio time not null,
  hora_fim time not null,
  finalidade text,
  numero_convidados integer default 0,
  valor numeric(10,2) not null default 0,
  status public.status_reserva not null default 'pendente',
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  constraint reserva_horario_valido check (hora_fim > hora_inicio)
);

create index idx_reservas_espaco_data on public.reservas(espaco_id, data);
create index idx_reservas_morador on public.reservas(morador_id);

-- ------------------------------------------------------------
-- Mensalidades / contribuicoes
-- ------------------------------------------------------------
create table public.mensalidades (
  id uuid primary key default gen_random_uuid(),
  morador_id uuid not null references public.perfis(id) on delete cascade,
  referencia date not null,
  valor numeric(10,2) not null,
  vencimento date not null,
  status public.status_mensalidade not null default 'pendente',
  pago_em date,
  forma_pagamento text,
  observacoes text,
  criado_em timestamptz not null default now(),
  unique (morador_id, referencia)
);

create index idx_mensalidades_morador on public.mensalidades(morador_id);
create index idx_mensalidades_status on public.mensalidades(status);

-- ------------------------------------------------------------
-- Comunicados / avisos
-- ------------------------------------------------------------
create table public.comunicados (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  conteudo text not null,
  autor_id uuid references public.perfis(id) on delete set null,
  categoria text default 'geral',
  fixado boolean not null default false,
  publicado boolean not null default true,
  publicado_em timestamptz not null default now(),
  criado_em timestamptz not null default now()
);

create index idx_comunicados_publicado on public.comunicados(publicado, publicado_em desc);

-- ------------------------------------------------------------
-- Configuracoes da associacao (registro unico)
-- ------------------------------------------------------------
create table public.configuracoes (
  id boolean primary key default true,
  nome_associacao text not null default 'Associacao de Moradores da Fortaleza Alta',
  cnpj text,
  endereco text,
  telefone text,
  email text,
  valor_mensalidade numeric(10,2) not null default 30.00,
  dia_vencimento integer not null default 10,
  horario_atendimento text,
  atualizado_em timestamptz not null default now(),
  constraint configuracoes_registro_unico check (id)
);
