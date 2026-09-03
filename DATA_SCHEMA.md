# Esquema de dados do Novelo Master

Documentação legível dos schemas Zod em `src/lib/schema/` (`common.ts`, `entities.ts`, `index.ts`), do carregador (`scripts/lib/load.ts`) e do lint editorial (`scripts/lib/lint.ts`). Em caso de divergência, o código prevalece e este documento deve ser corrigido. As regras editoriais que motivam cada campo estão em [METHODOLOGY.md](METHODOLOGY.md) e [EDITORIAL_POLICY.md](EDITORIAL_POLICY.md); as convenções de id e a captura de fontes, em [OSINT_GUIDELINES.md](OSINT_GUIDELINES.md).

## Princípios

- Um registro por arquivo, em YAML, em `data/<coleção>/<id>.yaml` (`.yml` também é aceito). O `id` do registro deve ser igual ao nome do arquivo.
- Ids são globais: o mesmo id não pode existir em duas coleções.
- Só registros com `review_status: published` entram no build público. `draft` e `in_review` são ignorados (com aviso) salvo `--include-drafts`; `retracted` é sempre ignorado, em silêncio.
- Campos com valor padrão (`default`) podem ser omitidos no YAML.
- Valores que o YAML converteria em número ou booleano devem ir entre aspas quando o campo é string: `sha256` composto só de dígitos, `reference` numérico (`"2024"`), `cnpj` (o formato com pontos e barra já é lido como string), `true`/`false` em texto livre. O carregador usa o schema core do YAML 1.2, então datas `YYYY-MM-DD` sem aspas são lidas como string.

## Tipos comuns (`common.ts`)

| Tipo          | Regra                                                                        |
| ------------- | ---------------------------------------------------------------------------- |
| Id            | kebab-case ASCII: `^[a-z0-9]+(?:-[a-z0-9]+)*$`                               |
| PartialDate   | `YYYY`, `YYYY-MM` ou `YYYY-MM-DD`                                            |
| DatePrecision | `day`, `month`, `year`, `approximate`                                        |
| EvidenceClass | `D` (documental direto), `C` (corroborado), `A` (alegação), `I` (inferência) |
| FactStatus    | `verified`, `disputed`, `unverified`, `refuted`                              |
| ReviewStatus  | `draft`, `in_review`, `published`, `retracted`                               |
| Confidence    | número entre 0 e 1                                                           |
| URL           | string com URL válida (`z.string().url()`)                                   |

### ReviewTrail (mesclado em todos os registros, exceto `Revision`)

| Campo         | Tipo         | Obrigatório          | Descrição                   |
| ------------- | ------------ | -------------------- | --------------------------- |
| review_status | ReviewStatus | não (padrão `draft`) | Estado no fluxo editorial   |
| reviewer      | string       | não                  | Quem concluiu a revisão     |
| reviewed_at   | PartialDate  | não                  | Data da revisão             |
| created_at    | PartialDate  | sim                  | Data de criação do registro |
| updated_at    | PartialDate  | sim                  | Data da última alteração    |

### CitedPosition (posição do citado)

| Campo      | Tipo        | Obrigatório       | Descrição                                                                                                    |
| ---------- | ----------- | ----------------- | ------------------------------------------------------------------------------------------------------------ |
| date       | PartialDate | não               | Data da manifestação                                                                                         |
| by_id      | Id          | não               | Entidade que se manifestou                                                                                   |
| by         | string      | não               | Nome de quem se manifestou, quando não há registro                                                           |
| kind       | enum        | sim               | `denial`, `clarification`, `public_note`, `version`, `alternative_explanation`, `no_response`, `not_located` |
| summary    | string      | sim               | Resumo da posição, ou descrição da busca/tentativa de contato                                                |
| source_ids | Id[]        | não (padrão `[]`) | Fontes da manifestação                                                                                       |

### Photo

| Campo        | Tipo        | Obrigatório | Descrição                                             |
| ------------ | ----------- | ----------- | ----------------------------------------------------- |
| path         | string      | sim         | Caminho do arquivo no repositório                     |
| source       | string      | sim         | Origem (órgão, Wikimedia Commons, site institucional) |
| author       | string      | sim         | Autor ou crédito                                      |
| license      | string      | sim         | Licença (por exemplo `CC BY 4.0`, `domínio público`)  |
| original_url | URL         | sim         | URL original da imagem                                |
| retrieved_at | PartialDate | sim         | Data da obtenção                                      |
| alt          | string      | sim         | Texto alternativo                                     |

## Coleções

### `sources` (Source)

| Campo            | Tipo        | Obrigatório          | Descrição                                                                                                                                                                |
| ---------------- | ----------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| id               | Id          | sim                  | Convenção `src-<publisher>-YYYY-MM-DD-slug`                                                                                                                              |
| kind             | `source`    | sim                  | Literal                                                                                                                                                                  |
| title            | string      | sim                  | Título exato                                                                                                                                                             |
| publisher        | string      | sim                  | Órgão ou veículo                                                                                                                                                         |
| author           | string      | não                  | Autor                                                                                                                                                                    |
| publication_date | PartialDate | não                  | Data de publicação da fonte                                                                                                                                              |
| retrieved_at     | PartialDate | sim                  | Data em que a fonte foi aberta                                                                                                                                           |
| url              | URL         | sim                  | URL aberta                                                                                                                                                               |
| archive_url      | URL         | não                  | Cópia arquivada (Wayback Machine)                                                                                                                                        |
| source_type      | SourceType  | sim                  | Ver enum abaixo                                                                                                                                                          |
| language         | string      | não (padrão `pt-BR`) | Idioma                                                                                                                                                                   |
| summary          | string      | não                  | O que a fonte diz                                                                                                                                                        |
| notes            | string      | não                  | Restrições, republicação, observações                                                                                                                                    |
| verification     | objeto      | não                  | `checked_at` (PartialDate), `checked_by` (string), `url_reachable` (bool), `content_matches_summary` (bool), `notes` (string, opcional). Preenchido pelo Source Verifier |

SourceType: `official_court`, `official_police`, `official_prosecutor`, `official_legislative`, `official_regulator`, `official_gazette`, `official_government`, `corporate_registry`, `official_other`, `press`, `wire`, `academic`, `encyclopedic`, `self_published`, `social_media`, `blog`, `other`. Os nove primeiros compõem `OFFICIAL_SOURCE_TYPES` (modo "somente fontes oficiais").

### `documents` (Document)

| Campo              | Tipo          | Obrigatório          | Descrição                                                    |
| ------------------ | ------------- | -------------------- | ------------------------------------------------------------ |
| id                 | Id            | sim                  | Convenção `doc-YYYY-MM-DD-slug`                              |
| kind               | `document`    | sim                  | Literal                                                      |
| title              | string        | sim                  | Título                                                       |
| doc_type           | DocumentType  | sim                  | Ver enum abaixo                                              |
| date               | PartialDate   | não                  | Data do documento                                            |
| date_precision     | DatePrecision | não                  | Precisão da data                                             |
| issuer_id          | Id            | não                  | Emissor, quando existe como entidade (pessoa ou organização) |
| issuer             | string        | não                  | Emissor em texto livre                                       |
| reference          | string        | não                  | Número de processo, protocolo, ofício                        |
| url                | URL           | não                  | URL do documento                                             |
| source_ids         | Id[]          | não (padrão `[]`)    | Fontes pelas quais o documento foi obtido                    |
| raw_path           | string        | não                  | Caminho relativo em `raw/`                                   |
| sha256             | string        | não                  | Hash SHA-256 do arquivo (64 hex)                             |
| summary            | string        | sim                  | O que o documento contém                                     |
| excerpt            | string        | não                  | Trecho literal curto                                         |
| is_official        | boolean       | não (padrão `false`) | Emitido por órgão oficial                                    |
| related_entity_ids | Id[]          | não (padrão `[]`)    | Pessoas e organizações mencionadas                           |
| tags               | string[]      | não (padrão `[]`)    | Etiquetas                                                    |

DocumentType: `judicial_decision`, `judicial_filing`, `official_report`, `forensic_extract`, `contract`, `corporate_record`, `gazette_entry`, `legislative_act`, `administrative_act`, `regulatory_record`, `letter`, `public_statement`, `testimony`, `press_article`, `other`.

### `evidence` (Evidence)

| Campo            | Tipo          | Obrigatório       | Descrição                                            |
| ---------------- | ------------- | ----------------- | ---------------------------------------------------- |
| id               | Id            | sim               | Convenção `ev-<slug>`                                |
| kind             | `evidence`    | sim               | Literal                                              |
| classification   | EvidenceClass | sim               | D, C, A ou I                                         |
| proposition      | string        | sim               | A proposição sustentada, em uma frase                |
| document_ids     | Id[]          | não (padrão `[]`) | Documentos que sustentam                             |
| source_ids       | Id[]          | não (padrão `[]`) | Fontes que sustentam                                 |
| excerpt          | string        | não               | Trecho literal curto                                 |
| locator          | string        | não               | Página, parágrafo, item                              |
| attributed_to_id | Id            | não               | Quem alegou (classe A), quando é entidade registrada |
| attributed_to    | string        | não               | Quem alegou (classe A), texto livre                  |
| inference_basis  | string        | não               | Raciocínio e limites (classe I)                      |
| date             | PartialDate   | não               | Data da proposição                                   |
| notes            | string        | não               | Observações                                          |

### `people` (Person)

| Campo          | Tipo            | Obrigatório       | Descrição                                                                                        |
| -------------- | --------------- | ----------------- | ------------------------------------------------------------------------------------------------ |
| id             | Id              | sim               | Nome completo em kebab                                                                           |
| kind           | `person`        | sim               | Literal                                                                                          |
| name           | string          | sim               | Nome usual                                                                                       |
| full_name      | string          | não               | Nome completo                                                                                    |
| aliases        | string[]        | não (padrão `[]`) | Outras grafias e apelidos públicos                                                               |
| category       | PersonCategory  | sim               | Ver enum abaixo                                                                                  |
| role           | string          | sim               | Cargo ou função principal no período relevante                                                   |
| positions      | Position[]      | não (padrão `[]`) | `title` (obrigatório), `organization_id`, `organization`, `start_date`, `end_date`, `source_ids` |
| summary        | string          | sim               | Resumo factual                                                                                   |
| why_in_novelo  | string          | sim               | Uma frase factual e neutra                                                                       |
| photo          | Photo           | não               | Foto com metadados completos                                                                     |
| cited_position | CitedPosition[] | não (padrão `[]`) | Contraditório                                                                                    |
| open_questions | string[]        | não (padrão `[]`) | Lacunas                                                                                          |
| tags           | string[]        | não (padrão `[]`) | Etiquetas                                                                                        |
| source_ids     | Id[]            | não (padrão `[]`) | Fontes do registro                                                                               |
| external_ids   | objeto          | não               | `wikidata` (string), `wikipedia_pt` (URL)                                                        |

PersonCategory: `banker`, `businessperson`, `politician`, `judge`, `prosecutor`, `police`, `lawyer`, `public_official`, `executive`, `journalist`, `family`, `other`.

### `organizations` (Organization)

| Campo          | Tipo            | Obrigatório       | Descrição                        |
| -------------- | --------------- | ----------------- | -------------------------------- |
| id             | Id              | sim               | Nome em kebab                    |
| kind           | `organization`  | sim               | Literal                          |
| name           | string          | sim               | Nome usual                       |
| full_name      | string          | não               | Razão social ou nome completo    |
| aliases        | string[]        | não (padrão `[]`) | Outras denominações              |
| org_type       | OrgType         | sim               | Ver enum abaixo                  |
| cnpj           | string          | não               | Formato `00.000.000/0000-00`     |
| jurisdiction   | string          | não               | Estado, país, foro               |
| summary        | string          | sim               | Resumo factual                   |
| why_in_novelo  | string          | sim               | Uma frase factual e neutra       |
| photo          | Photo           | não               | Logotipo ou imagem com metadados |
| cited_position | CitedPosition[] | não (padrão `[]`) | Contraditório                    |
| open_questions | string[]        | não (padrão `[]`) | Lacunas                          |
| tags           | string[]        | não (padrão `[]`) | Etiquetas                        |
| source_ids     | Id[]            | não (padrão `[]`) | Fontes do registro               |
| external_ids   | objeto          | não               | `wikidata`, `wikipedia_pt`       |

OrgType: `company`, `financial_institution`, `public_body`, `court`, `party`, `fund`, `law_firm`, `media`, `association`, `other`. Empresas e órgãos públicos são subtipos de Organization ([ADR-0003](docs/adr/0003-modelo-de-evidencia.md)). No grafo, `company`, `fund` e `law_firm` são exibidos como "Empresa"; `public_body` e `court`, como "Órgão público".

### `events` (Event)

| Campo           | Tipo            | Obrigatório               | Descrição                            |
| --------------- | --------------- | ------------------------- | ------------------------------------ |
| id              | Id              | sim                       | Convenção `evt-YYYY-MM-DD-slug`      |
| kind            | `event`         | sim                       | Literal                              |
| title           | string          | sim                       | Título                               |
| event_type      | EventType       | sim                       | Ver enum abaixo                      |
| date            | PartialDate     | sim                       | Data do fato                         |
| date_precision  | DatePrecision   | não (padrão `day`)        | Precisão                             |
| end_date        | PartialDate     | não                       | Data final                           |
| location        | string          | não                       | Local                                |
| participant_ids | Id[]            | não (padrão `[]`)         | Pessoas e organizações participantes |
| description     | string          | sim                       | Descrição factual                    |
| evidence_class  | EvidenceClass   | sim                       | Classe                               |
| status          | FactStatus      | não (padrão `unverified`) | Status                               |
| evidence_ids    | Id[]            | não (padrão `[]`)         | Evidências                           |
| source_ids      | Id[]            | não (padrão `[]`)         | Fontes                               |
| document_ids    | Id[]            | não (padrão `[]`)         | Documentos                           |
| public_act_ids  | Id[]            | não (padrão `[]`)         | Atos públicos relacionados           |
| cited_position  | CitedPosition[] | não (padrão `[]`)         | Contraditório sobre o evento         |
| tags            | string[]        | não (padrão `[]`)         | Etiquetas                            |

EventType: `meeting`, `communication`, `travel`, `payment`, `transaction`, `corporate_act`, `public_act`, `judicial_decision`, `investigation_step`, `regulatory_act`, `publication`, `statement`, `appointment`, `social_event`, `other`.

### `public-acts` (PublicAct)

| Campo          | Tipo          | Obrigatório               | Descrição                                                              |
| -------------- | ------------- | ------------------------- | ---------------------------------------------------------------------- |
| id             | Id            | sim                       | Convenção `ato-YYYY-MM-DD-slug`                                        |
| kind           | `public_act`  | sim                       | Literal                                                                |
| title          | string        | sim                       | Título                                                                 |
| act_type       | PublicActType | sim                       | `legislative`, `judicial`, `administrative`, `regulatory`, `executive` |
| date           | PartialDate   | sim                       | Data do ato                                                            |
| date_precision | DatePrecision | não (padrão `day`)        | Precisão                                                               |
| issuer_id      | Id            | não                       | Órgão ou pessoa emissora (entidade)                                    |
| issuer         | string        | não                       | Emissor em texto livre                                                 |
| actor_ids      | Id[]          | não (padrão `[]`)         | Quem praticou, assinou ou relatou                                      |
| affected_ids   | Id[]          | não (padrão `[]`)         | Entidades afetadas segundo os documentos                               |
| description    | string        | sim                       | Descrição factual                                                      |
| reference      | string        | não                       | Número, protocolo                                                      |
| url            | URL           | não                       | URL do ato                                                             |
| evidence_class | EvidenceClass | sim                       | Classe                                                                 |
| status         | FactStatus    | não (padrão `unverified`) | Status                                                                 |
| evidence_ids   | Id[]          | não (padrão `[]`)         | Evidências                                                             |
| source_ids     | Id[]          | não (padrão `[]`)         | Fontes                                                                 |
| document_ids   | Id[]          | não (padrão `[]`)         | Documentos                                                             |
| tags           | string[]      | não (padrão `[]`)         | Etiquetas                                                              |

### `transactions` (Transaction)

| Campo                                             | Tipo            | Obrigatório               | Descrição                                                                                             |
| ------------------------------------------------- | --------------- | ------------------------- | ----------------------------------------------------------------------------------------------------- |
| id                                                | Id              | sim                       | Convenção `tx-YYYY-MM-DD-slug`                                                                        |
| kind                                              | `transaction`   | sim                       | Literal                                                                                               |
| title                                             | string          | sim                       | Título                                                                                                |
| transaction_type                                  | TransactionType | sim                       | `payment`, `loan`, `acquisition`, `investment`, `donation`, `fee`, `guarantee`, `asset_sale`, `other` |
| from_id                                           | Id              | sim                       | Origem (pessoa ou organização)                                                                        |
| to_id                                             | Id              | sim                       | Destino (pessoa ou organização)                                                                       |
| amount                                            | número >= 0     | não                       | Valor                                                                                                 |
| currency                                          | string          | não (padrão `BRL`)        | Moeda                                                                                                 |
| amount_text                                       | string          | não                       | Valor em texto, quando aproximado ("cerca de R$ 2 milhões")                                           |
| date                                              | PartialDate     | sim                       | Data                                                                                                  |
| date_precision                                    | DatePrecision   | não (padrão `day`)        | Precisão                                                                                              |
| description                                       | string          | sim                       | Descrição factual                                                                                     |
| evidence_class                                    | EvidenceClass   | sim                       | Classe                                                                                                |
| status                                            | FactStatus      | não (padrão `unverified`) | Status                                                                                                |
| evidence_ids, source_ids, document_ids, event_ids | Id[]            | não (padrão `[]`)         | Suporte e eventos ligados                                                                             |
| cited_position                                    | CitedPosition[] | não (padrão `[]`)         | Contraditório                                                                                         |
| tags                                              | string[]        | não (padrão `[]`)         | Etiquetas                                                                                             |

No grafo, transações viram arestas dirigidas da família `financial` entre `from_id` e `to_id`.

### `relationships` (Relationship)

| Campo                                                              | Tipo             | Obrigatório               | Descrição                                 |
| ------------------------------------------------------------------ | ---------------- | ------------------------- | ----------------------------------------- |
| id                                                                 | Id               | sim                       | Convenção `rel-<from>-<to>-<tipo>`        |
| kind                                                               | `relationship`   | sim                       | Literal                                   |
| from_id                                                            | Id               | sim                       | Entidade de origem                        |
| to_id                                                              | Id               | sim                       | Entidade de destino                       |
| relationship_type                                                  | RelationshipType | sim                       | Ver enum abaixo                           |
| directed                                                           | boolean          | não (padrão `false`)      | Relação dirigida                          |
| label                                                              | string           | sim                       | Rótulo curto da aresta                    |
| start_date                                                         | PartialDate      | não                       | Início                                    |
| end_date                                                           | PartialDate      | não                       | Fim                                       |
| via_id                                                             | Id               | não                       | Intermediário                             |
| description                                                        | string           | sim                       | "Por que estes nós estão conectados?"     |
| evidence_class                                                     | EvidenceClass    | sim                       | Classe                                    |
| confidence                                                         | 0..1             | sim                       | Confiança                                 |
| status                                                             | FactStatus       | não (padrão `unverified`) | Status                                    |
| event_ids, evidence_ids, source_ids, document_ids, transaction_ids | Id[]             | não (padrão `[]`)         | Suporte                                   |
| cited_position                                                     | CitedPosition[]  | não (padrão `[]`)         | Posição dos envolvidos sobre esta relação |
| tags                                                               | string[]         | não (padrão `[]`)         | Etiquetas                                 |

RelationshipType e família (a cor da aresta deriva da família):

| Tipo                                     | Família       |
| ---------------------------------------- | ------------- |
| personal_social, familial, communication | social        |
| professional, shared_event, intermediary | professional  |
| political                                | political     |
| institutional                            | institutional |
| financial, commercial, contractual       | financial     |
| corporate                                | corporate     |
| investigative_allegation                 | allegation    |

### `claims` (Claim)

| Campo                               | Tipo            | Obrigatório       | Descrição                                                                                                  |
| ----------------------------------- | --------------- | ----------------- | ---------------------------------------------------------------------------------------------------------- |
| id                                  | Id              | sim               | Convenção `claim-<slug>`                                                                                   |
| kind                                | `claim`         | sim               | Literal                                                                                                    |
| statement                           | string          | sim               | A proposição sob análise                                                                                   |
| classification                      | EvidenceClass   | sim               | Classe                                                                                                     |
| status                              | FactStatus      | sim               | Status (sem padrão)                                                                                        |
| claimant_id                         | Id              | não               | Quem sustenta (entidade)                                                                                   |
| claimant                            | string          | não               | Quem sustenta (texto)                                                                                      |
| date                                | PartialDate     | não               | Data                                                                                                       |
| related_entity_ids                  | Id[]            | não (padrão `[]`) | Entidades envolvidas                                                                                       |
| event_ids, evidence_ids, source_ids | Id[]            | não (padrão `[]`) | Suporte                                                                                                    |
| limits                              | string          | não               | O que os documentos não permitem afirmar                                                                   |
| counter_position                    | CitedPosition[] | não (padrão `[]`) | Contraposição                                                                                              |
| adversarial_review                  | objeto          | não               | `reviewed_at`, `reviewer`, `attempted_refutation`, `outcome` (`stands`, `weakened`, `disputed`, `refuted`) |
| tags                                | string[]        | não (padrão `[]`) | Etiquetas                                                                                                  |

### `sequences` (TemporalSequence)

| Campo                    | Tipo                | Obrigatório       | Descrição                                    |
| ------------------------ | ------------------- | ----------------- | -------------------------------------------- |
| id                       | Id                  | sim               | Convenção `seq-<slug>`                       |
| kind                     | `temporal_sequence` | sim               | Literal                                      |
| title                    | string              | sim               | Título                                       |
| step_ids                 | Id[] (mínimo 2)     | sim               | Eventos e atos públicos em ordem cronológica |
| temporal_proximity       | enum                | sim               | `high`, `medium`, `low`                      |
| documentary_link         | enum                | sim               | `present`, `absent`, `partial`               |
| causality_proven         | boolean             | sim               | Só `true` com `documentary_link: present`    |
| description              | string              | sim               | Descrição                                    |
| limits                   | string              | sim               | O que não se conclui                         |
| source_ids, evidence_ids | Id[]                | não (padrão `[]`) | Suporte                                      |
| tags                     | string[]            | não (padrão `[]`) | Etiquetas                                    |

### `revisions` (Revision)

Sem ReviewTrail; sempre entra no build.

| Campo                 | Tipo         | Obrigatório        | Descrição                                                                                           |
| --------------------- | ------------ | ------------------ | --------------------------------------------------------------------------------------------------- |
| id                    | Id           | sim                | Convenção `rev-YYYY-MM-DD-slug`                                                                     |
| kind                  | `revision`   | sim                | Literal                                                                                             |
| date                  | PartialDate  | sim                | Data da revisão                                                                                     |
| summary               | string       | sim                | Resumo público                                                                                      |
| added                 | objeto       | não (padrão zeros) | Contagens: `people`, `organizations`, `events`, `documents`, `relationships`, `sources`, `evidence` |
| updated_relationships | inteiro >= 0 | não (padrão 0)     | Relações alteradas                                                                                  |
| corrections           | string[]     | não (padrão `[]`)  | Correções e retratações descritas                                                                   |
| author                | string       | não                | Autor                                                                                               |

## Regras do lint

O carregador (`load.ts`) e o lint (`lint.ts`) produzem dois níveis: erro e aviso. Erros bloqueiam `data:build`, `data:validate` e `data:lint`. Avisos nunca bloqueiam `data:build` nem `data:validate`; em `data:lint` (modo estrito, usado na integração contínua) bloqueiam apenas quando o registro afetado está em `review_status: published`. Rascunhos (`draft`, `in_review`) podem ter avisos pendentes sem derrubar a CI.

### Erros do carregador

- YAML inválido.
- Registro que não passa no schema Zod da coleção.
- `id` diferente do nome do arquivo.
- `id` duplicado em qualquer coleção.

### Erros do lint

Referências:

- Qualquer id referenciado que não exista.
- Referência a tipo errado. Campos com tipo restrito: `source_ids` (source), `document_ids` (document), `evidence_ids` (evidence), `event_ids` (event), `public_act_ids` (public_act), `transaction_ids` (transaction), `step_ids` (event ou public_act), `positions.organization_id` (organization) e, restritos a pessoa ou organização: `participant_ids`, `actor_ids`, `affected_ids`, `related_entity_ids`, `from_id`, `to_id`, `via_id`, `issuer_id`, `cited_position[].by_id`, `counter_position[].by_id`. `cited_position[].source_ids` e `counter_position[].source_ids` devem apontar para source. `attributed_to_id` e `claimant_id` aceitam qualquer tipo.

Regras comuns a eventos, atos públicos, transações, relações e claims (`checkClassAndStatus`):

- `status: verified` com classe A ou I.
- `evidence_class` (ou `classification`, em claims) superior à melhor classe entre as evidências ligadas (ordem D > C > A > I).
- Classe I sem ao menos uma evidência ligada de classe I com `inference_basis`. Não existe inferência sem raciocínio escrito em um registro `Evidence`.

Documentos:

- Sem `url`, sem `raw_path` e sem `source_ids` (não rastreável).

Evidências:

- Sem `document_ids` nem `source_ids`, salvo classe I.
- Classe D sem `document_ids`.
- Classe C com menos de dois itens somando `source_ids` e `document_ids`.
- Classe A sem `attributed_to` nem `attributed_to_id`.
- Classe I sem `inference_basis`.

Eventos, atos públicos e transações:

- Sem `evidence_ids`, sem `source_ids` e sem `document_ids`, salvo classe I (que, pela regra comum, precisa de evidência I ligada).
- Transação com `from_id` igual a `to_id`.

Relações:

- `from_id` igual a `to_id`.
- Sem `evidence_ids`, `source_ids` e `document_ids`, e não classificada como I.
- Classe I sem suporte e sem `event_ids`.
- Classe D sem documento primário ligado: nenhum `document_ids` na relação e nenhuma evidência ligada com `document_ids`. Fonte oficial sozinha não basta.
- Classe C com menos de duas fontes independentes: soma das fontes distintas (diretas e via evidências ligadas) mais `document_ids` diretos menor que dois. A independência entre as fontes é avaliada pelo revisor; o lint só conta.

Claims:

- Sem `evidence_ids` nem `source_ids`.

Sequências:

- `causality_proven: true` com `documentary_link` diferente de `present`.

### Avisos do lint

- Prefixo de id fora da convenção: `evt-` (events), `ato-` (public-acts), `src-` (sources), `doc-` (documents), `ev-` (evidence), `rel-` (relationships), `tx-` (transactions), `claim-` (claims), `seq-` (sequences). Pessoas, organizações e revisões não têm prefixo verificado.
- Fonte sem bloco `verification`.
- Fonte de tipo `social_media` ou `blog`.
- Pessoa ou organização sem `cited_position`.
- Claim sem `counter_position`.
- Claim publicado sem `adversarial_review`.
- Termo imputativo (`criminoso`, `corrupto`, `bandido`, `quadrilha`, `fraudador`, `ladrão`, `propina`, `lavou dinheiro`, `comprou o ministro`, `comprou a decisão`, `mensalão`, `esquema criminoso`) sem qualificador de atribuição no mesmo texto (`segundo`, `conforme`, `de acordo com`, `alega`, `afirma`, `aponta`, `sustenta`, `acusa`, `denúncia`, `suspeita`, `investiga`, `hipótese`, `nega`, `supost-`, `presum-`, `teria`, e flexões), nos campos `proposition`, `summary`, `why_in_novelo`, `description`, `label`, `statement`. O lint é heurístico: um qualificador em qualquer ponto do texto suprime o aviso, e o revisor humano continua responsável.
- Relação `investigative_allegation` classificada como D (confirmar se o documento prova o fato ou só registra a alegação).
- Relação `intermediary` sem `via_id`.
- Relação sem `start_date` e sem `event_ids` (não terá data própria na máquina do tempo).
- Registro `draft` ou `in_review` excluído do build quando não se usa `--include-drafts` (aviso do carregador, nunca bloqueante).

O que o lint não verifica: independência real entre fontes de classe C, veracidade do conteúdo, coerência entre `is_official` do documento e o tipo da fonte, e a qualidade do `inference_basis`. Isso é trabalho do gauntlet ([EDITORIAL_POLICY.md](EDITORIAL_POLICY.md#1-o-gauntlet-editorial)). O conjunto `OFFICIAL_SOURCE_TYPES` não influencia o lint; ele alimenta apenas a flag `official` das arestas no build do grafo.

## Comandos

| Comando                                     | O que faz                                                                                                                                                                                                                        | Bloqueia em    |
| ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- |
| `npm run data:validate`                     | Carrega e valida `data/`, roda o lint, não gera arquivos. Exclui rascunhos (com aviso)                                                                                                                                           | erros          |
| `npm run data:validate -- --include-drafts` | O mesmo, incluindo `draft` e `in_review`                                                                                                                                                                                         | erros          |
| `npm run data:lint` | `validate-data.ts --strict`: inclui rascunhos; avisos bloqueiam apenas em registros `published`. É o comando da integração contínua e do PR de dados | erros e avisos em registros publicados |
| `npm run data:build`                        | Compila `data/` em `src/generated/corpus.json`, `src/generated/stats.json` e `public/data/graph.json` (com layout ForceAtlas2 determinístico). Aceita `-- --include-drafts` (ou `NOVELO_INCLUDE_DRAFTS=true`) e `-- --no-layout` | erros          |
| `npm run check`                             | `typecheck`, `lint` (ESLint), `data:lint` e `test` em sequência                                                                                                                                                                  | qualquer falha |

`npm run dev` e `npm run build` executam `data:build` antes do Next.

## Layout de diretórios

```
data/                  fonte de verdade editorial (YAML, um registro por arquivo)
  people/              <id>.yaml
  organizations/
  events/
  public-acts/
  transactions/
  relationships/
  claims/
  sources/
  documents/
  evidence/
  sequences/
  revisions/
raw/                   capturas brutas: metadados, hashes e descrições. PDF, ZIP, MP4 e HTML
                       são ignorados pelo Git (.gitignore); registrar sha256 no Document
processed/             extrações intermediárias (texto, tabelas, entidades) derivadas de raw/,
                       usadas para preparar registros; não são fonte de verdade
python/                reservado a scripts auxiliares de extração e triagem
src/generated/         corpus.json e stats.json, gerados no build (ignorados pelo Git)
public/data/           graph.json, gerado no build (ignorado pelo Git)
src/lib/schema/        schemas Zod (fonte do modelo)
scripts/               build-data.ts, validate-data.ts, scan-secrets.ts, synth-stress.ts
scripts/lib/           load.ts, lint.ts, graph.ts, report.ts
docs/adr/              decisões de arquitetura
```

## Nota sobre migração futura para PostgreSQL/Supabase

A V1 não tem banco em runtime ([ADR-0001](docs/adr/0001-repositorio-independente-e-fonte-de-verdade-git.md), [ADR-0002](docs/adr/0002-next-static-export.md)). Se o corpus crescer além do que o site estático comporta, ou se surgir necessidade de busca server-side, o caminho previsto é:

- Os schemas Zod são a fonte para gerar o DDL. Cada coleção vira uma tabela; campos `*_ids` viram tabelas de junção; `cited_position`, `positions`, `verification` e `adversarial_review` viram tabelas filhas ou colunas JSONB.
- Os ids kebab-case permanecem como chaves naturais, preservando URLs e histórico.
- O ReviewTrail vira colunas e o histórico Git continua como trilha de auditoria do período estático; a partir da migração, um log de revisões no banco assume esse papel.
- O lint continua sendo executado sobre uma exportação YAML ou diretamente sobre o banco antes de cada publicação; as regras não mudam.
- Enquanto a migração não ocorre, nenhum código deve depender de banco.
