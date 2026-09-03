# Diretrizes de pesquisa em fontes abertas (OSINT)

Este documento orienta quem pesquisa e registra fontes para O Novelo Master. Ele operacionaliza a hierarquia de fontes e a classificação de evidência da [METHODOLOGY.md](METHODOLOGY.md) e alimenta a primeira etapa do gauntlet descrito em [EDITORIAL_POLICY.md](EDITORIAL_POLICY.md). Os campos citados estão em [DATA_SCHEMA.md](DATA_SCHEMA.md).

## 1. Duas regras que não têm exceção

1. Nunca inventar fonte, página, mensagem, documento ou conexão. Se não existe documento, não existe registro. Se existe suspeita sem documento, existe no máximo uma `open_question` na entidade.
2. Só registrar URL que você efetivamente abriu e leu. Não registrar URL copiada de citação, de rodapé de reportagem, de resultado de busca ou de resposta de ferramenta de IA sem tê-la aberto e conferido o conteúdo. Se a URL não abre, buscar cópia no Wayback Machine; se também não houver, não registrar.

## 2. Fontes prioritárias

Consultar sempre a fonte primária antes da secundária. Quando uma reportagem cita documento, a tarefa é localizar o documento.

### Judiciário

| Órgão           | Portal                                                                                        | O que buscar                                                                              |
| --------------- | --------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| STF             | https://portal.stf.jus.br (consulta processual, peças públicas) e https://noticias.stf.jus.br | Decisões, despachos, peças com sigilo levantado, notícias oficiais com número do processo |
| STJ             | https://www.stj.jus.br (consulta processual e jurisprudência)                                 | Decisões, acórdãos, notícias oficiais                                                     |
| Justiça Federal | portais dos TRFs e seções judiciárias (PJe, e-Proc)                                           | Decisões de primeira instância, autos públicos                                            |
| CNJ             | https://www.cnj.jus.br                                                                        | Consulta unificada (DataJud) para localizar processos por parte                           |

Regra: o número do processo (formato CNJ) vai em `reference` do `Document`. Decisão publicada em portal oficial é `official_court`; a mesma decisão reproduzida por veículo de imprensa é `press`.

### Investigação e acusação

| Órgão                            | Portal                |
| -------------------------------- | --------------------- |
| Polícia Federal                  | https://www.gov.br/pf |
| Ministério Público Federal e PGR | https://www.mpf.mp.br |
| Ministérios Públicos estaduais   | portais próprios      |

Relatórios, representações e denúncias só são acessíveis quando juntados a processo público ou divulgados pelo órgão. Reportagem que descreve relatório sigiloso é fonte da alegação de que o relatório existe e diz X (classe A ou C), não fonte do relatório.

### Legislativo

| Órgão                | Portal                                                                             |
| -------------------- | ---------------------------------------------------------------------------------- |
| Câmara dos Deputados | https://www.camara.leg.br (Agência Câmara, notas taquigráficas, proposições, CPIs) |
| Senado Federal       | https://www.senado.leg.br (Agência Senado, notas taquigráficas, proposições, CPIs) |

Depoimentos em CPI são `testimony`, classe A quanto ao conteúdo declarado; a ata é `official_legislative`.

### Reguladores e controle

| Órgão         | Portal                                                                                          |
| ------------- | ----------------------------------------------------------------------------------------------- |
| Banco Central | https://www.bcb.gov.br (normas, decisões de liquidação, sistema de informações de instituições) |
| CVM           | https://www.cvm.gov.br (processos sancionadores, fatos relevantes, registros)                   |
| TCU           | https://www.tcu.gov.br (acórdãos, relatórios)                                                   |
| CGU           | https://www.gov.br/cgu                                                                          |

### Registros e publicações oficiais

| Fonte                                   | Portal                                                                 |
| --------------------------------------- | ---------------------------------------------------------------------- |
| Diário Oficial da União                 | https://www.in.gov.br                                                  |
| Receita Federal (consulta CNPJ)         | https://www.gov.br/receitafederal                                      |
| Juntas comerciais                       | portal de cada estado (por exemplo, JUCESP, JUCEMG, JUCERJA) e Redesim |
| Diários oficiais estaduais e municipais | portais próprios                                                       |

### Agências oficiais de notícias

Agência Brasil (https://agenciabrasil.ebc.com.br), Agência Câmara e Agência Senado são `wire` e frequentemente linkam o documento primário. Preferi-las a portais que só reproduzem o conteúdo.

### Imprensa

Veículos com apuração própria, política de correção pública e assinatura de repórter. Registrar como `press`. Quando a matéria é de agência (Reuters, AFP, Estadão Conteúdo, Folhapress) republicada por outro portal, registrar a agência como `publisher` e a URL original quando localizável.

### Pistas

Wikipedia (`encyclopedic`), blogs e redes sociais de terceiros (`blog`, `social_media`) servem para localizar documentos. Não sustentam registro sozinhos e geram aviso no lint. Publicação da própria pessoa ou organização (site, perfil oficial, nota) é `self_published` e vale para o que ela disse e para `cited_position`.

## 3. Como capturar uma fonte

Para cada fonte aberta, registrar em `data/sources/<id>.yaml`:

| Campo              | Como preencher                                                                                                                                                                       |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `title`            | Título exato da página ou documento. Sem editorializar.                                                                                                                              |
| `publisher`        | Órgão ou veículo responsável. Para decisões: o tribunal. Para agência republicada: a agência.                                                                                        |
| `author`           | Repórter, relator, autor institucional. Opcional quando não identificado.                                                                                                            |
| `publication_date` | Data em que a fonte foi publicada. Não confundir com a data do fato.                                                                                                                 |
| `retrieved_at`     | Data em que você abriu a fonte. Obrigatório.                                                                                                                                         |
| `url`              | A URL aberta. Sem parâmetros de rastreamento (`utm_*`, `fbclid`).                                                                                                                    |
| `archive_url`      | Cópia em https://web.archive.org. Se não houver, criar uma (Save Page Now) e registrar a URL resultante. Quando a página é dinâmica e não arquiva, deixar vazio e anotar em `notes`. |
| `source_type`      | Conforme a seção 2. Na dúvida entre oficial e imprensa, imprensa.                                                                                                                    |
| `language`         | `pt-BR` por padrão.                                                                                                                                                                  |
| `summary`          | Uma ou duas frases sobre o que a fonte diz, sem interpretação.                                                                                                                       |
| `notes`            | Restrições de acesso, paywall, trechos que exigem login, indicação de republicação.                                                                                                  |

Capturar também, em `raw/`, os metadados da captura (ver [DATA_SCHEMA.md](DATA_SCHEMA.md#layout-de-diretórios)). Arquivos volumosos (PDF, ZIP, vídeo, HTML) não são versionados; registra-se `sha256` do arquivo no `Document` para que outra pessoa possa conferir a cópia obtida.

## 4. Como preencher `verification`

O bloco `verification` é preenchido pelo Source Verifier, que não deve ser a pessoa que registrou a fonte:

```yaml
verification:
  checked_at: 2026-09-03
  checked_by: nome-ou-handle-do-verificador
  url_reachable: true
  content_matches_summary: true
  notes: "Conferido contra archive_url; página exige rolagem para carregar o trecho citado."
```

- `url_reachable: false` só é aceitável com `archive_url` alcançável; do contrário, a fonte volta para a etapa 1.
- `content_matches_summary: false` bloqueia a publicação de toda evidência que aponte para a fonte até que o `summary` ou a evidência sejam corrigidos.
- `checked_by` identifica uma pessoa. Ferramentas de IA podem ajudar a localizar o trecho, mas não assinam a verificação.

## 5. Extrair de reportagem: fato, alegação e inferência

Ao ler uma reportagem, separar cada frase relevante em uma das três categorias antes de criar qualquer registro:

1. A reportagem cita documento identificável (decisão, relatório, contrato, ata) e reproduz seu conteúdo. Localizar o documento. Se localizado: `Document` + `Evidence` de classe D apontando para o documento; a reportagem entra como fonte secundária. Se não localizado: `Evidence` de classe C (se houver segunda fonte independente) ou A (atribuída ao veículo ou à autoridade que ele cita).
2. A reportagem atribui afirmação a alguém nomeado ("o procurador afirmou", "o advogado disse"). `Evidence` de classe A com `attributed_to` igual ao declarante. A reportagem é a fonte de que a declaração foi feita.
3. A reportagem atribui afirmação a fontes anônimas ("segundo pessoas próximas", "fontes ouvidas pela reportagem"). `Evidence` de classe A com `attributed_to` igual ao veículo. Nunca C, mesmo que outro veículo repita a mesma informação anônima.
4. A reportagem conclui ou interpreta ("a sequência sugere que", "o encontro teria motivado"). Não é fato nem alegação de terceiro sobre fato; é inferência do veículo. Só entra como `Evidence` de classe I se o Novelo, por sua conta, refizer o raciocínio a partir de fatos documentados e escrever `inference_basis`. Do contrário, não entra.

Em todos os casos, a `proposition` da evidência descreve exatamente o que a fonte sustenta. "Segundo reportagem de [veículo] de [data], [autoridade] afirmou que a reunião ocorreu" é uma proposição de classe A. "A reunião ocorreu" só é proposição de classe D com o documento ligado.

## 6. Convenções de identificadores

Todo `id` é kebab-case ASCII (`^[a-z0-9]+(?:-[a-z0-9]+)*$`), sem acentos, sem pontos, sem sublinhado, e o nome do arquivo é `<id>.yaml`. Os prefixos abaixo são convenção editorial (o lint não os exige, mas a revisão sim):

| Coleção       | Padrão                                                     | Exemplo                                               |
| ------------- | ---------------------------------------------------------- | ----------------------------------------------------- |
| people        | nome completo em kebab, sem títulos                        | `maria-aparecida-souza`                               |
| organizations | nome usual em kebab, sem tipo societário quando redundante | `banco-master`, `jucemg`                              |
| events        | `evt-YYYY-MM-DD-slug`                                      | `evt-2024-03-12-reuniao-sede`                         |
| public-acts   | `ato-YYYY-MM-DD-slug`                                      | `ato-2024-03-21-portaria-nomeacao`                    |
| sources       | `src-<publisher>-YYYY-MM-DD-slug`                          | `src-agencia-brasil-2024-03-22-nomeacao`              |
| documents     | `doc-YYYY-MM-DD-slug`                                      | `doc-2024-03-12-alteracao-contratual`                 |
| evidence      | `ev-<slug>`                                                | `ev-socio-empresa-exemplo-2024`                       |
| relationships | `rel-<from>-<to>-<tipo>`                                   | `rel-maria-aparecida-souza-empresa-exemplo-corporate` |
| transactions  | `tx-YYYY-MM-DD-slug`                                       | `tx-2024-05-02-pagamento-honorarios`                  |
| claims        | `claim-<slug>`                                             | `claim-reuniao-motivou-portaria`                      |
| sequences     | `seq-<slug>`                                               | `seq-reuniao-portaria-2024`                           |
| revisions     | `rev-YYYY-MM-DD-slug`                                      | `rev-2026-09-03-carga-inicial`                        |

Datas nos ids usam a data do fato (evento, ato, documento, transação) ou a data de publicação (fonte). Quando só se conhece o mês ou o ano, usar `YYYY-MM` ou `YYYY` no id e declarar `date_precision`.

Homônimos: se dois registros de pessoas distintas resultariam no mesmo id, acrescentar um qualificador estável (`-2`, ou a profissão), e registrar `full_name` e `aliases` em ambos.

## 7. Checklist antes de abrir PR de dados

- [ ] Abri e li cada URL registrada; nenhuma veio de citação indireta.
- [ ] Toda fonte tem `retrieved_at`, `source_type` e, quando possível, `archive_url`.
- [ ] Todo documento tem `url`, `raw_path` ou `source_ids` (rastreabilidade) e, se possível, `reference` e `sha256`.
- [ ] Cada evidência tem uma única proposição, na classe correta, com `document_ids` (D), duas fontes independentes (C), `attributed_to` (A) ou `inference_basis` (I).
- [ ] Nenhuma relação existe só porque dois nomes aparecem juntos; cada uma tem `label`, `description` e suporte.
- [ ] Classe da relação não supera a melhor evidência ligada.
- [ ] Nenhum registro de classe A ou I está com `status: verified`.
- [ ] Toda pessoa e organização tem `why_in_novelo` em uma frase neutra e `cited_position` (ainda que `not_located` com descrição da busca).
- [ ] Nenhum dado pessoal vedado ([EDITORIAL_POLICY.md](EDITORIAL_POLICY.md#6-dados-pessoais)).
- [ ] Fotos com `source`, `author`, `license`, `original_url`, `retrieved_at`, `alt`.
- [ ] Homônimos verificados (CPF parcial, cargo, empresa, cidade, data de nascimento quando pública) e descartados.
- [ ] Data de publicação e data do fato distinguidas; `date_precision` declarada quando não se sabe o dia.
- [ ] `npm run data:validate` sem erros; `npm run data:lint` sem erros nem avisos nos registros que serão publicados.
- [ ] Nenhum segredo, token ou arquivo `.env` no diff.
- [ ] O PR descreve fonte, data, classificação e justificativa (modelo em `.github/PULL_REQUEST_TEMPLATE.md`).

## 8. Armadilhas

- Homônimos. Nomes comuns têm muitos portadores. Confirmar identidade por dado público distintivo (cargo, empresa, CNPJ ligado, cidade). Na dúvida, não registrar.
- Data de publicação versus data do fato. A reportagem de 22/03 sobre a reunião de 12/03 tem `publication_date: 2024-03-22`; o evento tem `date: 2024-03-12`. Trocar as duas corrompe a máquina do tempo e as sequências temporais.
- Republicação. Vinte portais com o mesmo texto de agência são uma fonte, não vinte. Registrar a agência e a URL original.
- Manchete versus corpo. Manchetes resumem e por vezes afirmam mais do que o corpo sustenta. A proposição sai do corpo, e preferencialmente do documento que o corpo cita.
- Tradução. Fonte em outro idioma: registrar `language`, manter `title` original e traduzir só o `summary`, indicando que é tradução.
- Fontes anônimas. "Segundo fontes" limita a classe a A, com `attributed_to` igual ao veículo. Repetição em outro veículo não eleva a C.
- Documento que menciona versus documento que demonstra. Uma decisão que transcreve a denúncia não demonstra os fatos denunciados; demonstra o conteúdo da denúncia. Uma ata que registra presença demonstra presença, não o que foi discutido.
- Página alterada. Portais corrigem e apagam matérias. `archive_url` registrado no dia da captura protege contra isso.
- Documento sigiloso vazado. Só entra se juntado a autos públicos ou divulgado pelo órgão; reportagem que o descreve é fonte de alegação.
- Ferramentas de IA. Podem sugerir URLs, números de processo e citações que não existem. Tudo é conferido na origem antes de virar registro.

## 9. Exemplo completo mínimo

Exemplo ilustrativo com identidades, URLs e fatos fictícios, apenas para mostrar a estrutura. Não copiar para `data/`. Os seis arquivos abaixo formam um conjunto coerente com o schema e com o lint: a pessoa, a organização, a fonte (registro societário), o documento (alteração contratual), a evidência (classe D) e a relação societária.

`data/people/ana-exemplo-silva.yaml`

```yaml
id: ana-exemplo-silva
kind: person
name: Ana Exemplo Silva
category: businessperson
role: Sócia-administradora da Empresa Exemplo Ltda.
summary: Sócia-administradora da Empresa Exemplo Ltda. desde março de 2024, conforme alteração contratual registrada na junta comercial.
why_in_novelo: Sócia-administradora de empresa que figura em contrato juntado aos autos do caso, conforme registro societário.
positions:
  - title: Sócia-administradora
    organization_id: empresa-exemplo-ltda
    start_date: 2024-03-12
    source_ids: [src-junta-exemplo-2024-03-12-alteracao-contratual]
cited_position:
  - kind: not_located
    summary: Busca em notas públicas, entrevistas e manifestações nos autos até 2026-09-03 não localizou posição da citada sobre os registros do Novelo.
    date: 2026-09-03
source_ids: [src-junta-exemplo-2024-03-12-alteracao-contratual]
review_status: published
reviewer: revisor-exemplo
reviewed_at: 2026-09-03
created_at: 2026-09-01
updated_at: 2026-09-03
```

`data/organizations/empresa-exemplo-ltda.yaml`

```yaml
id: empresa-exemplo-ltda
kind: organization
name: Empresa Exemplo Ltda.
org_type: company
cnpj: 00.000.000/0001-00
jurisdiction: Minas Gerais
summary: Sociedade limitada constituída em 2019, com sede em Belo Horizonte, segundo registro na junta comercial.
why_in_novelo: Parte em contrato de prestação de serviços juntado aos autos do caso.
cited_position:
  - kind: not_located
    summary: Nenhuma nota ou manifestação pública da empresa foi localizada até 2026-09-03.
    date: 2026-09-03
source_ids: [src-junta-exemplo-2024-03-12-alteracao-contratual]
review_status: published
reviewer: revisor-exemplo
reviewed_at: 2026-09-03
created_at: 2026-09-01
updated_at: 2026-09-03
```

`data/sources/src-junta-exemplo-2024-03-12-alteracao-contratual.yaml`

```yaml
id: src-junta-exemplo-2024-03-12-alteracao-contratual
kind: source
title: Certidão de inteiro teor - Empresa Exemplo Ltda. - 4a alteração contratual
publisher: Junta Comercial do Estado Exemplo
publication_date: 2024-03-12
retrieved_at: 2026-09-01
url: https://example.org/junta/certidao/000000000
archive_url: https://web.archive.org/web/20260901000000/https://example.org/junta/certidao/000000000
source_type: corporate_registry
language: pt-BR
summary: Certidão de inteiro teor com a 4a alteração contratual, que registra o ingresso de Ana Exemplo Silva como sócia-administradora.
verification:
  checked_at: 2026-09-02
  checked_by: verificador-exemplo
  url_reachable: true
  content_matches_summary: true
  notes: Conferido o quadro societário na página 3 da certidão.
review_status: published
reviewer: revisor-exemplo
reviewed_at: 2026-09-03
created_at: 2026-09-01
updated_at: 2026-09-03
```

`data/documents/doc-2024-03-12-alteracao-contratual-empresa-exemplo.yaml`

```yaml
id: doc-2024-03-12-alteracao-contratual-empresa-exemplo
kind: document
title: 4a alteração do contrato social da Empresa Exemplo Ltda.
doc_type: corporate_record
date: 2024-03-12
date_precision: day
issuer_id: empresa-exemplo-ltda
reference: NIRE 00000000000 / protocolo 24-000.000-0
url: https://example.org/junta/certidao/000000000
source_ids: [src-junta-exemplo-2024-03-12-alteracao-contratual]
raw_path: raw/junta-exemplo/2024-03-12-alteracao-contratual.meta.yaml
sha256: "0000000000000000000000000000000000000000000000000000000000000000"
summary: Alteração contratual que admite Ana Exemplo Silva como sócia-administradora com 50% das quotas.
excerpt: "Cláusula 2a: ingressa na sociedade a sócia Ana Exemplo Silva, que passa a exercer a administração."
is_official: true
related_entity_ids: [ana-exemplo-silva, empresa-exemplo-ltda]
review_status: published
reviewer: revisor-exemplo
reviewed_at: 2026-09-03
created_at: 2026-09-01
updated_at: 2026-09-03
```

`data/evidence/ev-ana-exemplo-silva-socia-empresa-exemplo.yaml`

```yaml
id: ev-ana-exemplo-silva-socia-empresa-exemplo
kind: evidence
classification: D
proposition: Ana Exemplo Silva ingressou como sócia-administradora da Empresa Exemplo Ltda. em 12 de março de 2024.
document_ids: [doc-2024-03-12-alteracao-contratual-empresa-exemplo]
source_ids: [src-junta-exemplo-2024-03-12-alteracao-contratual]
locator: Certidão de inteiro teor, p. 3, cláusula 2a
excerpt: "ingressa na sociedade a sócia Ana Exemplo Silva"
date: 2024-03-12
review_status: published
reviewer: revisor-exemplo
reviewed_at: 2026-09-03
created_at: 2026-09-01
updated_at: 2026-09-03
```

`data/relationships/rel-ana-exemplo-silva-empresa-exemplo-ltda-corporate.yaml`

```yaml
id: rel-ana-exemplo-silva-empresa-exemplo-ltda-corporate
kind: relationship
from_id: ana-exemplo-silva
to_id: empresa-exemplo-ltda
relationship_type: corporate
directed: true
label: sócia-administradora
start_date: 2024-03-12
description: Ana Exemplo Silva é sócia-administradora da Empresa Exemplo Ltda. desde 12 de março de 2024, conforme a 4a alteração contratual registrada na junta comercial.
evidence_class: D
confidence: 0.95
status: verified
evidence_ids: [ev-ana-exemplo-silva-socia-empresa-exemplo]
document_ids: [doc-2024-03-12-alteracao-contratual-empresa-exemplo]
source_ids: [src-junta-exemplo-2024-03-12-alteracao-contratual]
cited_position: []
review_status: published
reviewer: revisor-exemplo
reviewed_at: 2026-09-03
created_at: 2026-09-01
updated_at: 2026-09-03
```

O que o lint verifica nesse conjunto: todos os ids referenciados existem; a evidência D tem documento; a relação D tem documento ligado; a classe da relação (D) não supera a da evidência (D); `status: verified` é compatível com D; fonte tem `verification`; pessoa e organização têm `cited_position`; a relação tem `start_date`. Um registro de classe A no lugar desse teria `attributed_to` na evidência, `status: unverified` na relação e a proposição redigida como "Segundo [fonte], ...".
