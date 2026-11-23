-- ============================================================
-- Migracao 07: acentuacao correta nos textos dos dados iniciais
-- ============================================================

update public.configuracoes set
  nome_associacao = 'Associação de Moradores da Fortaleza Alta',
  endereco = 'Rua Principal, s/n - Fortaleza Alta, Blumenau/SC',
  horario_atendimento = 'Segunda a sexta, das 14h às 18h'
where id;

alter table public.configuracoes
  alter column nome_associacao set default 'Associação de Moradores da Fortaleza Alta';

update public.categorias_servico c set nome = v.nome, descricao = v.descricao
from (values
  ('Iluminacao Publica', 'Iluminação Pública', 'Lâmpadas queimadas, postes danificados e falta de iluminação nas vias.'),
  ('Limpeza e Residuos', 'Limpeza e Resíduos', 'Coleta de entulho, limpeza de terrenos e pontos de lixo irregular.'),
  ('Vias e Pavimentacao', 'Vias e Pavimentação', 'Buracos, calçadas danificadas, sinalização e drenagem.'),
  ('Agua e Esgoto', 'Água e Esgoto', 'Vazamentos, falta de água e problemas na rede de esgoto.'),
  ('Seguranca', 'Segurança', 'Ocorrências de segurança, vandalismo e solicitação de rondas.'),
  ('Areas Verdes', 'Áreas Verdes', 'Poda de árvores, capina e manutenção de praças.'),
  ('Documentos e Declaracoes', 'Documentos e Declarações', 'Declarações de residência, atestados e segunda via de documentos.'),
  ('Outros Assuntos', 'Outros Assuntos', 'Demandas que não se encaixam nas demais categorias.')
) as v(antigo, nome, descricao)
where c.nome = v.antigo;

update public.servicos s set nome = v.nome, descricao = v.descricao
from (values
  ('Declaracao de Residencia', 'Declaração de Residência', 'Emissão de declaração de residência assinada pela diretoria.'),
  ('Atendimento com a Diretoria', 'Atendimento com a Diretoria', 'Conversa presencial com um membro da diretoria da associação.'),
  ('Vistoria Tecnica no Local', 'Vistoria Técnica no Local', 'Visita de um responsável para avaliar a demanda informada.'),
  ('Retirada de Entulho', 'Retirada de Entulho', 'Agendamento da retirada de entulho e materiais volumosos.'),
  ('Poda de Arvore', 'Poda de Árvore', 'Serviço de poda em área comum ou calçada, mediante avaliação.'),
  ('Orientacao Juridica Comunitaria', 'Orientação Jurídica Comunitária', 'Plantão mensal de orientação jurídica gratuita aos associados.')
) as v(antigo, nome, descricao)
where s.nome = v.antigo;

update public.espacos e set nome = v.nome, descricao = v.descricao, regras = v.regras
from (values
  ('Salao de Festas', 'Salão de Festas', 'Salão coberto com cozinha, banheiros e mesas para eventos.',
   'Reserva com no mínimo 7 dias de antecedência. Devolver o espaço limpo. Som permitido até as 23h.'),
  ('Quadra Poliesportiva', 'Quadra Poliesportiva', 'Quadra de concreto para futsal, vôlei e basquete.',
   'Uso gratuito para associados. Horários de 1 hora. Não é permitido o uso de travas de metal.'),
  ('Sala de Reunioes', 'Sala de Reuniões', 'Sala com projetor e 20 cadeiras para reuniões e cursos.',
   'Disponível para reuniões comunitárias e cursos. Solicitar com 3 dias de antecedência.'),
  ('Churrasqueira Comunitaria', 'Churrasqueira Comunitária', 'Área com duas churrasqueiras, pia e mesas externas.',
   'Levar o próprio carvão. A limpeza da área é responsabilidade do solicitante.')
) as v(antigo, nome, descricao, regras)
where e.nome = v.antigo;

update public.comunicados set
  titulo = 'Bem-vindo à plataforma da Associação',
  conteudo = E'A Associação de Moradores da Fortaleza Alta agora tem um canal digital de atendimento.\n\nPor aqui você pode abrir solicitações, acompanhar o andamento de cada pedido pelo número de protocolo, agendar serviços, reservar os espaços comunitários e consultar suas mensalidades.\n\nQualquer dúvida, procure a diretoria no horário de atendimento.'
where titulo = 'Bem-vindo a plataforma da Associacao';

update public.comunicados set
  titulo = 'Horário de atendimento da sede',
  conteudo = E'A sede da associação atende de segunda a sexta, das 14h às 18h.\n\nSolicitações abertas pela plataforma são analisadas em até 2 dias úteis, e o prazo de conclusão varia conforme a categoria do atendimento.'
where titulo = 'Horario de atendimento da sede';

update public.comunicados set
  titulo = 'Mutirão de limpeza das áreas comuns',
  conteudo = E'Vamos realizar um mutirão de limpeza nas áreas comuns do bairro.\n\nQuem puder ajudar, traga luvas, enxada e rastelo. A concentração será na quadra poliesportiva. Após o mutirão haverá um café comunitário.'
where titulo = 'Mutirao de limpeza das areas comuns';

create or replace function public.fn_validar_reserva()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_conflitos integer;
begin
  if new.status = 'cancelada' then
    return new;
  end if;

  select count(*) into v_conflitos
  from public.reservas r
  where r.espaco_id = new.espaco_id
    and r.data = new.data
    and r.status in ('pendente', 'confirmada', 'concluida')
    and r.id is distinct from new.id
    and r.hora_inicio < new.hora_fim
    and r.hora_fim > new.hora_inicio;

  if v_conflitos > 0 then
    raise exception 'Já existe uma reserva para este espaço no horário informado.';
  end if;

  return new;
end;
$$;

revoke all on function public.fn_validar_reserva() from public, anon, authenticated;
