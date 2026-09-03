# Metodologia do Novelo Master

> Mostre a evidência. Mostre a conexão. Mostre a cronologia. Deixe a conclusão para o visitante.

Este documento descreve como O Novelo Master decide o que entra no mapa, como classifica o que sabe, de onde tira o que publica e o que se recusa a afirmar. É a referência normativa para todo o corpus em `data/`. As regras aqui descritas são aplicadas, na medida do possível, de forma automática pelo lint editorial (`scripts/lib/lint.ts`, documentado em [DATA_SCHEMA.md](DATA_SCHEMA.md)) e, no restante, pela revisão humana descrita em [EDITORIAL_POLICY.md](EDITORIAL_POLICY.md).

Documentos relacionados:

- [EDITORIAL_POLICY.md](EDITORIAL_POLICY.md): fluxo de revisão, vocabulário, contraditório, correções.
- [OSINT_GUIDELINES.md](OSINT_GUIDELINES.md): como pesquisar, capturar e registrar fontes.
- [DATA_SCHEMA.md](DATA_SCHEMA.md): campos, enums e regras do lint.
- [CONTRIBUTING.md](CONTRIBUTING.md): como propor dados e código.
- ADRs em [docs/adr/](docs/adr/README.md): decisões de arquitetura, em especial a [ADR-0003](docs/adr/0003-modelo-de-evidencia.md) (evidência como elemento fundamental).

## 1. O que o Novelo é e o que não é

O Novelo Master é um mapa público, rastreável e versionado das relações, eventos, atos públicos, documentos e fontes relacionados ao caso Banco Master. Ele organiza material que já é público; não produz revelações, não investiga por conta própria pessoas privadas e não substitui o processo judicial.

Consequências diretas:

- Estar no mapa não significa ter cometido irregularidade. Um nó existe porque um documento público relevante ao caso menciona aquela pessoa ou organização, e por nenhum outro motivo.
- Uma aresta (relação) existe porque há uma proposição concreta com suporte documental ou, quando explicitamente marcada como inferência, porque há eventos documentados que a fundamentam. Nunca porque dois nomes apareceram na mesma reportagem.
- O Novelo não conclui. Ele exibe a evidência, a classificação da evidência, a cronologia e a posição do citado. O visitante forma a própria opinião com o material à vista.

## 2. Critérios de inclusão

Uma pessoa ou organização entra no corpus quando, cumulativamente:

1. É mencionada em ao menos um documento público relevante ao caso (decisão judicial, relatório oficial, ato administrativo, registro societário, depoimento, reportagem de veículo reconhecido que cite documento identificável).
2. A menção tem papel no caso: a pessoa praticou um ato, participou de um evento, foi parte em transação, foi citada por autoridade ou por veículo jornalístico em razão de conduta relacionada ao caso, ou ocupa cargo cuja atuação é objeto do caso.
3. É possível escrever uma frase factual e neutra respondendo "Por que está no Novelo?" (campo `why_in_novelo`) sem recorrer a adjetivos ou imputações.

Não entra no corpus:

- Quem aparece por mera coincidência de nome (homônimo) ou por aparição incidental na mesma reportagem, evento social ou lista de convidados.
- Familiares, funcionários ou conhecidos sem papel próprio documentado no caso. A categoria `family` existe para quem tem papel documentado (por exemplo, sócio em pessoa jurídica citada), não para árvores genealógicas.
- Menores de idade, em qualquer hipótese.
- Pessoas cuja única ligação com o caso é ter sido citada em rede social ou blog de terceiros.

O mesmo critério vale para eventos, atos públicos e transações: só entram quando há documento ou fonte que os descreva com data, participantes e conteúdo suficientes para o registro.

## 3. Classificação de evidência: D, C, A, I

Toda relação, evento, ato público, transação e claim carrega uma classe de evidência (`evidence_class` ou `classification`). A classe descreve a natureza do suporte, não a importância do fato. O registro `Evidence` (uma proposição concreta ligada a documentos e fontes) é a unidade que recebe a classificação em primeiro lugar; os demais registros herdam ou apontam para ela.

### D: documental direto

Existe documento primário que demonstra a proposição. O documento está identificado (emissor, data, referência) e ligado ao registro por `document_ids`.

Exemplos de documentos que sustentam classe D:

- Decisão judicial (sentença, acórdão, decisão monocrática, despacho) publicada ou disponível nos autos públicos.
- Relatório oficial (Polícia Federal, Banco Central, CVM, TCU, CGU) tornado público ou juntado a processo público.
- Contrato autêntico, juntado a processo ou publicado por órgão competente.
- Mensagem ou registro extraído pericialmente e juntado aos autos (`forensic_extract`), com localização (página, item) no relatório.
- Documento societário: contrato social, ata, alteração contratual, ficha cadastral de junta comercial, cartão CNPJ.
- Publicação em Diário Oficial (nomeação, exoneração, portaria, resolução).

O que a classe D demonstra é exatamente o conteúdo do documento. Uma decisão judicial que recebe uma denúncia demonstra que a denúncia foi recebida, não que os fatos denunciados ocorreram. Um relatório de PF que transcreve uma mensagem demonstra que a mensagem existia no aparelho periciado, não que o que a mensagem diz é verdadeiro.

Regras automáticas: evidência D sem `document_ids` é erro. Relação D precisa de documento primário ligado (diretamente ou via evidência); fonte oficial sozinha não basta. Ver [DATA_SCHEMA.md](DATA_SCHEMA.md#regras-do-lint).

### C: corroborado

Não há documento primário acessível, mas a proposição é sustentada por duas ou mais fontes independentes e confiáveis (veículos jornalísticos reconhecidos, agências oficiais de notícias, órgãos distintos), que não derivam uma da outra.

Exemplos:

- Dois veículos concorrentes, com apuração própria, relatam a mesma reunião, com data e participantes coincidentes, sem que um cite o outro.
- Uma nota oficial de um órgão e uma reportagem independente descrevem o mesmo ato.

Não é corroboração: republicação da mesma matéria de agência em vários portais; reportagens que citam a mesma fonte anônima; veículos que se citam mutuamente. Independência é avaliada pelo revisor humano; o lint só exige a quantidade mínima (duas fontes ou documentos).

### A: alegação atribuída

Alguém afirmou algo, e o Novelo registra que a afirmação foi feita, por quem, quando e onde. A proposição registrada é a existência da alegação, não a veracidade do conteúdo.

O exemplo canônico: "X afirmou que Y fez Z" é diferente de "Y fez Z". Na classe A, a proposição da evidência é a primeira frase. O campo `attributed_to` (ou `attributed_to_id`) identifica X. Se um dia surgir documento que demonstre que Y fez Z, cria-se nova evidência de classe D; a alegação continua registrada como alegação.

São classe A, entre outros:

- Denúncia, representação, petição ou parecer (a peça prova que a alegação foi formalizada; não prova o fato alegado).
- Depoimento, delação, entrevista, nota pública.
- Reportagem que cita "fontes" anônimas ou "pessoas com conhecimento do assunto".
- Declaração de autoridade em coletiva ou audiência.

Regra automática: evidência A sem `attributed_to` é erro. Registro com classe A não pode ter status `verified`.

### I: inferência analítica

Não há documento nem alegação que enuncie a proposição; ela resulta de um raciocínio explícito sobre fatos documentados. A inferência é permitida apenas quando o raciocínio está escrito (`inference_basis`) e diz também o que não se conclui.

Exemplo: os documentos mostram que a reunião ocorreu em uma data e que o ato administrativo foi publicado dias depois. O intervalo temporal é fato (classe D, pelos dois documentos). Afirmar que a reunião motivou o ato é inferência (classe I) e deve vir acompanhada do limite: "Não há documento no corpus que ligue o conteúdo da reunião ao ato." Sequências desse tipo têm registro próprio (`TemporalSequence`) com os campos `documentary_link` e `causality_proven`.

Regras automáticas: evidência I sem `inference_basis` é erro. Todo registro de classe I (relação, evento, ato, transação ou claim) precisa ligar ao menos uma evidência de classe I com `inference_basis`. Registro com classe I não pode ter status `verified`. Sequência com `causality_proven: true` exige `documentary_link: present`.

### Coerência entre classes

Uma relação não pode reivindicar classe superior à melhor evidência ligada a ela (relação D apoiada só em evidência A é erro). Quando há dúvida entre duas classes, usa-se a inferior.

## 4. Fontes aceitas e hierarquia

O campo `source_type` classifica cada fonte. Os tipos abaixo, com prefixo `official_` ou `corporate_registry`, compõem o conjunto de fontes primárias oficiais usado no modo "somente fontes oficiais".

| Nível                    | Tipos                                                                                                                                                                                       | Exemplos                                                                                                                                                                                                                                                 |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Primárias oficiais       | `official_court`, `official_police`, `official_prosecutor`, `official_legislative`, `official_regulator`, `official_gazette`, `official_government`, `corporate_registry`, `official_other` | STF, STJ, TRFs, Justiça Federal, Polícia Federal, PGR e MPF, Câmara, Senado, Banco Central, CVM, TCU, CGU, Diário Oficial da União, juntas comerciais, Receita Federal (CNPJ), cartórios, atos administrativos, contratos autênticos juntados a processo |
| Secundárias reconhecidas | `press`, `wire`, `academic`                                                                                                                                                                 | Veículos jornalísticos com apuração própria e política de correção pública; agências (Agência Brasil, Agência Câmara, Agência Senado, Reuters, AFP); trabalhos acadêmicos revisados                                                                      |
| Pista                    | `encyclopedic`, `blog`, `social_media`, `other`                                                                                                                                             | Wikipedia, blogs, redes sociais. Servem para localizar documentos; não sustentam sozinhas nenhuma classe acima de A, e o lint emite aviso para `blog` e `social_media`                                                                                   |
| Publicação própria       | `self_published`                                                                                                                                                                            | Site, rede social ou nota da própria pessoa ou organização citada. Vale como fonte do que a pessoa disse (classe A com `attributed_to` igual ao autor) e para `cited_position`                                                                           |

Regras:

- Blog e rede social de terceiros valem apenas como pista. A exceção é a publicação da própria pessoa ou organização, que deve ser registrada como `self_published`.
- A hierarquia não é mecânica: uma fonte oficial pode conter erro e uma reportagem pode estar correta. A hierarquia define o ônus de verificação, não a verdade.
- Toda fonte tem `url`, `retrieved_at` e, sempre que possível, `archive_url` (Wayback Machine). Fonte sem bloco `verification` gera aviso e não passa no lint estrito.

## 5. Como as relações são criadas

Uma relação (`Relationship`) liga duas entidades (pessoa ou organização) por meio de:

1. Um tipo (`relationship_type`) de família definida: institucional, financeira ou comercial, política, social, profissional, societária ou alegação investigativa.
2. Um rótulo curto e factual (`label`): "sócio", "advogado de", "reunião documentada", "nomeado por".
3. Uma descrição que responde "Por que estes nós estão conectados?" com fatos, datas e referências.
4. Classe de evidência, grau de confiança e status.
5. Suporte: `evidence_ids`, `source_ids`, `document_ids`, `event_ids` ou `transaction_ids`.

Não existe relação sem proposição concreta. "Aparecem juntos na reportagem" não é proposição. "Participaram da reunião de 26/12/2023 no endereço X, conforme relatório Y" é.

Quando a relação passa por terceiro, usa-se `via_id` e o tipo `intermediary`. Quando a única ligação entre duas entidades é uma alegação de autoridade ou veículo, o tipo é `investigative_allegation`, a classe é A e a descrição diz quem alegou.

## 6. Fato, alegação e inferência

|            | O que é                                                     | Como se registra                                                   | Frase-modelo                                                                                       |
| ---------- | ----------------------------------------------------------- | ------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| Fato       | Proposição demonstrada por documento (D) ou corroborada (C) | Evidência D ou C; status pode ser `verified`                       | "O contrato foi assinado em 12/03/2024 (doc. X, p. 4)."                                            |
| Alegação   | Afirmação atribuída a alguém, não demonstrada por documento | Evidência A com `attributed_to`; status `unverified` ou `disputed` | "Segundo a denúncia da PGR, ..." / "O jornal Y afirmou, citando fontes não identificadas, que ..." |
| Inferência | Conclusão analítica sobre fatos documentados                | Evidência I com `inference_basis` e limites                        | "O intervalo de 9 dias entre a reunião e o ato é documentado; o nexo entre ambos não."             |

A distinção vale também na hora de extrair de reportagem: a reportagem é fonte de que a alegação foi feita; o documento que ela cita é a fonte do fato. Se o documento não foi localizado, o registro fica em A ou C, nunca em D.

## 7. Status factual

Independentemente da classe de evidência, cada registro tem um status:

- `verified`: revisado pelo gauntlet, com suporte documental (D ou C) e sem contestação material conhecida.
- `disputed`: há contestação relevante (negativa fundamentada, versão alternativa com suporte, decisão judicial divergente). O registro permanece publicado com a contestação à vista.
- `unverified`: ainda não verificado, ou alegação e inferência por natureza. É o padrão.
- `refuted`: documento ou decisão posterior demonstrou que a proposição é falsa. O registro permanece, marcado, para preservar a trilha.

O lint impede `verified` em registros de classe A ou I.

## 8. Direito de resposta e posição do citado

Toda pessoa e organização tem o campo `cited_position`, e o mesmo campo existe em relações, eventos e transações para posições sobre fatos específicos. O campo registra negativas, esclarecimentos, notas públicas, versões apresentadas e explicações alternativas, com fonte. Quando nenhuma posição foi localizada, registra-se `not_located`; quando o citado foi procurado e não respondeu, `no_response`.

Lista vazia é exibida na interface como "posição não localizada". O lint emite aviso para toda pessoa ou organização sem `cited_position`, e o lint estrito (usado na integração contínua) não aceita avisos em registros publicados. Na prática, nenhum agente é publicado sem registro do contraditório, ainda que o registro seja `not_located`.

Pedidos de resposta e de correção seguem o procedimento em [EDITORIAL_POLICY.md](EDITORIAL_POLICY.md#9-pedidos-de-remoção-e-de-resposta).

## 9. Política de correção

- Erro factual confirmado: o registro é corrigido no mesmo arquivo, a correção é descrita em `Revision.corrections`, e a mudança fica no histórico Git.
- Proposição refutada: status muda para `refuted`; o registro não é apagado.
- Registro que não deveria existir (violação dos critérios de inclusão, dado pessoal indevido, fonte inválida): `review_status: retracted`. Registros retratados saem do build público mas permanecem no repositório, salvo quando a permanência do texto em si for ilícita, caso em que o conteúdo é removido e a retratação registrada apenas no changelog.
- Toda correção material gera entrada em `data/revisions/` e é listada na página `/atualizacoes`.

## 10. Versionamento e trilha de auditoria

O diretório `data/` é a fonte de verdade editorial ([ADR-0001](docs/adr/0001-repositorio-independente-e-fonte-de-verdade-git.md)). Cada alteração de dado passa por pull request, validação automática e revisão. O histórico Git é a trilha de auditoria: para qualquer registro é possível saber quando entrou, quem revisou, o que mudou e por quê. Os registros `Revision` sintetizam essas mudanças para o público na página `/atualizacoes`.

Cada registro carrega `created_at`, `updated_at`, `review_status`, `reviewer` e `reviewed_at`. Só registros `published` entram no site.

## 11. Uso de inteligência artificial

Ferramentas de IA são usadas para pesquisa, triagem de documentos, extração de entidades e datas, classificação preliminar, deduplicação e redação de rascunhos. Nada disso é evidência.

Regras:

- Nenhuma afirmação produzida por IA entra no corpus sem fonte verificada por pessoa. O bloco `verification` de cada fonte identifica quem verificou (`checked_by`).
- IA não inventa fonte, página, mensagem ou conexão. Um registro cuja fonte não pode ser aberta e conferida é descartado.
- O lint impede a publicação de relação, evento, ato público ou transação sem `source_ids`, `evidence_ids` nem `document_ids`, salvo inferência explicitamente marcada como classe I e ligada a evidência I com fundamento escrito. Isso vale igualmente para dado produzido por pessoa ou por máquina.
- Classificações sugeridas por IA são rebaixadas em caso de dúvida.

## 12. Limitações

- O corpus é incompleto. O caso tem milhares de páginas e o Novelo cobre a parcela que foi lida, verificada e registrada.
- Há defasagem entre a publicação de um documento e sua inclusão.
- O Novelo depende de fontes públicas. Autos sigilosos, documentos não publicados e apurações em curso não estão aqui, e a ausência de um fato no mapa não indica que ele não ocorreu.
- Erros são possíveis: de leitura, de classificação, de digitação, de homonímia. A política de correção existe para isso, e qualquer pessoa pode abrir uma issue de correção.
- O grafo é uma representação. Centralidade, tamanho de nó e proximidade visual resultam de algoritmos de layout e contagem de arestas, não de juízo editorial.

## 13. Modos "somente fontes oficiais" e "somente fatos documentados"

Os dois modos são derivações diretas dos dados ([ADR-0003](docs/adr/0003-modelo-de-evidencia.md)):

- Somente fontes oficiais: exibe apenas arestas em que ao menos uma fonte ligada (diretamente ou via evidência) tem `source_type` do conjunto oficial (`OFFICIAL_SOURCE_TYPES`). A flag `official` de cada aresta é calculada no build.
- Somente fatos documentados: exibe apenas arestas de classe D ou C. A flag `documented` é calculada no build.

Os modos não julgam a qualidade de uma fonte específica; filtram por tipo e por classe. Um visitante que ative os dois filtros vê o subconjunto do mapa que se apoia em documento primário ou corroboração, proveniente de órgão oficial.

## 14. Representação visual

- Cor identifica a natureza da relação (família: institucional, financeira ou comercial, política, social, profissional, societária, alegação investigativa) e a categoria do nó (pessoa, empresa, partido, órgão público, instituição financeira, evento, ato público). Cor nunca codifica culpa, gravidade ou juízo. Vermelho, se usado na paleta, significa apenas a família que a legenda indicar; nunca é sinônimo de crime.
- Forma da aresta identifica a força da evidência, conforme [ADR-0004](docs/adr/0004-sigma-graphology.md): linha sólida para D, sólida de traço curto para C, tracejada para A, pontilhada para I. A legenda da interface é a referência final.
- Tamanho do nó deriva do grau (número de arestas), em escala logarítmica. Tamanho não indica importância nem responsabilidade.
- A máquina do tempo mostra o mapa em cada data. Uma aresta aparece a partir de `start_date` ou da data do primeiro evento ligado.

## 15. Regra final

Proximidade não é influência. Influência não é tráfico de influência. Alegação não é prova. Coincidência temporal não é causalidade. O Novelo mostra o que está documentado, mostra quem alegou o quê, mostra quando cada coisa aconteceu e mostra o que o citado disse a respeito. A conclusão é do visitante.
