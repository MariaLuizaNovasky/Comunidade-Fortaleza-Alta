-- ============================================================
-- Migracao 04: dados iniciais
-- ============================================================

insert into public.configuracoes (id, endereco, telefone, email, valor_mensalidade, dia_vencimento, horario_atendimento)
values (
  true,
  'Rua Principal, s/n - Fortaleza Alta, Blumenau/SC',
  '(47) 3333-0000',
  'contato@fortalezaalta.org.br',
  30.00,
  10,
  'Segunda a sexta, das 14h as 18h'
) on conflict (id) do nothing;

insert into public.categorias_servico (nome, descricao, icone, cor, prazo_dias) values
  ('Iluminacao Publica', 'Lampadas queimadas, postes danificados e falta de iluminacao nas vias.', 'lamp', '#f59e0b', 5),
  ('Limpeza e Residuos', 'Coleta de entulho, limpeza de terrenos e pontos de lixo irregular.', 'trash', '#10b981', 7),
  ('Vias e Pavimentacao', 'Buracos, calcadas danificadas, sinalizacao e drenagem.', 'road', '#6366f1', 15),
  ('Agua e Esgoto', 'Vazamentos, falta de agua e problemas na rede de esgoto.', 'drop', '#0ea5e9', 3),
  ('Seguranca', 'Ocorrencias de seguranca, vandalismo e solicitacao de rondas.', 'shield', '#ef4444', 2),
  ('Areas Verdes', 'Poda de arvores, capina e manutencao de pracas.', 'tree', '#22c55e', 10),
  ('Documentos e Declaracoes', 'Declaracoes de residencia, atestados e segunda via de documentos.', 'doc', '#8b5cf6', 3),
  ('Outros Assuntos', 'Demandas que nao se encaixam nas demais categorias.', 'wrench', '#64748b', 10)
on conflict (nome) do nothing;

insert into public.servicos (nome, descricao, categoria_id, valor, duracao_minutos, requer_agendamento)
select v.nome, v.descricao, c.id, v.valor, v.duracao, v.agenda
from (values
  ('Declaracao de Residencia', 'Emissao de declaracao de residencia assinada pela diretoria.', 'Documentos e Declaracoes', 0.00, 20, true),
  ('Atendimento com a Diretoria', 'Conversa presencial com um membro da diretoria da associacao.', 'Outros Assuntos', 0.00, 30, true),
  ('Vistoria Tecnica no Local', 'Visita de um responsavel para avaliar a demanda informada.', 'Vias e Pavimentacao', 0.00, 60, true),
  ('Retirada de Entulho', 'Agendamento da retirada de entulho e materiais volumosos.', 'Limpeza e Residuos', 50.00, 90, true),
  ('Poda de Arvore', 'Servico de poda em area comum ou calcada, mediante avaliacao.', 'Areas Verdes', 80.00, 120, true),
  ('Orientacao Juridica Comunitaria', 'Plantao mensal de orientacao juridica gratuita aos associados.', 'Outros Assuntos', 0.00, 40, true)
) as v(nome, descricao, categoria, valor, duracao, agenda)
left join public.categorias_servico c on c.nome = v.categoria;

insert into public.espacos (nome, descricao, capacidade, valor_locacao, regras) values
  ('Salao de Festas', 'Salao coberto com cozinha, banheiros e mesas para eventos.', 120, 250.00,
   'Reserva com no minimo 7 dias de antecedencia. Devolver o espaco limpo. Som permitido ate as 23h.'),
  ('Quadra Poliesportiva', 'Quadra de concreto para futsal, volei e basquete.', 40, 0.00,
   'Uso gratuito para associados. Horarios de 1 hora. Nao e permitido o uso de travas de metal.'),
  ('Sala de Reunioes', 'Sala com projetor e 20 cadeiras para reunioes e cursos.', 20, 0.00,
   'Disponivel para reunioes comunitarias e cursos. Solicitar com 3 dias de antecedencia.'),
  ('Churrasqueira Comunitaria', 'Area com duas churrasqueiras, pia e mesas externas.', 30, 80.00,
   'Levar o proprio carvao. Limpeza da area e responsabilidade do solicitante.')
on conflict do nothing;

insert into public.comunicados (titulo, conteudo, categoria, fixado) values
  ('Bem-vindo a plataforma da Associacao',
   E'A Associacao de Moradores da Fortaleza Alta agora tem um canal digital de atendimento.\n\nPor aqui voce pode abrir solicitacoes, acompanhar o andamento de cada pedido pelo numero de protocolo, agendar servicos, reservar os espacos comunitarios e consultar suas mensalidades.\n\nQualquer duvida, procure a diretoria no horario de atendimento.',
   'geral', true),
  ('Horario de atendimento da sede',
   E'A sede da associacao atende de segunda a sexta, das 14h as 18h.\n\nSolicitacoes abertas pela plataforma sao analisadas em ate 2 dias uteis, e o prazo de conclusao varia conforme a categoria do atendimento.',
   'aviso', false),
  ('Mutirao de limpeza das areas comuns',
   E'Vamos realizar um mutirao de limpeza nas areas comuns do bairro.\n\nQuem puder ajudar, traga luvas, enxada e rastelo. A concentracao sera na quadra poliesportiva. Apos o mutirao havera um cafe comunitario.',
   'evento', false);
