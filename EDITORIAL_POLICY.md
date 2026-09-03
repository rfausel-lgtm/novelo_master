# Política editorial do Novelo Master

Este documento descreve o fluxo pelo qual todo registro passa antes de ser publicado, o vocabulário permitido e vedado, o tratamento do contraditório, de dados pessoais, de fotos, de correções e de pedidos de remoção. Ele aplica a [METHODOLOGY.md](METHODOLOGY.md) ao trabalho diário. Os campos citados estão descritos em [DATA_SCHEMA.md](DATA_SCHEMA.md); a captura de fontes está em [OSINT_GUIDELINES.md](OSINT_GUIDELINES.md).

## 1. O gauntlet editorial

Nenhum registro chega a `review_status: published` sem passar pelas cinco etapas abaixo. Cada etapa tem um papel definido e um resultado registrado nos dados. Uma mesma pessoa pode exercer mais de um papel, mas nunca o de Adversarial Reviewer sobre registro que ela própria criou.

### Etapa 1: OSINT Investigator

Localiza, lê e captura as fontes. Cria os registros `Source`, `Document` e `Evidence` e propõe os registros derivados (pessoas, organizações, eventos, relações, transações) em `review_status: draft`.

Verifica:

- A fonte foi efetivamente aberta e lida por inteiro (não só a manchete).
- `url`, `retrieved_at`, `publisher`, `publication_date` e `source_type` preenchidos; `archive_url` quando disponível.
- Para documentos: emissor, data, referência (número de processo, ofício, protocolo) e localização do trecho relevante (`locator`, `excerpt`).
- Cada proposição extraída foi separada em fato, alegação ou inferência antes de virar `Evidence`.
- Homônimos descartados (ver [OSINT_GUIDELINES.md](OSINT_GUIDELINES.md#8-armadilhas)).

### Etapa 2: Source Verifier

Confere cada fonte de forma independente e preenche o bloco `verification` do registro `Source`.

Verifica:

- `url_reachable`: a URL abre e mostra o conteúdo esperado, ou o `archive_url` o preserva.
- `content_matches_summary`: o conteúdo da fonte sustenta o `summary` da fonte e a `proposition` das evidências que apontam para ela. Se não sustentar, a evidência volta para a etapa 1.
- A fonte é a original, não republicação. Republicações são registradas como fonte adicional apenas quando acrescentam apuração própria.
- `source_type` correto. Uma reportagem que reproduz decisão judicial é `press`, não `official_court`; a decisão em si, se acessível, é registrada como `Document` com sua própria fonte.
- Data de publicação distinta da data do fato.

Fonte sem `verification` gera aviso no lint e, se publicada, é bloqueada no lint estrito.

### Etapa 3: Investigative Journalist

Escreve e revisa os textos (`summary`, `description`, `why_in_novelo`, `label`, `proposition`, `statement`) e a estrutura (tipos, datas, participantes, direção).

Verifica:

- O texto diz apenas o que a evidência ligada sustenta; classe de evidência coerente com a melhor evidência ligada.
- Vocabulário conforme a seção 3 deste documento.
- `why_in_novelo` conforme a seção 4.
- Datas com precisão declarada (`date_precision`) quando não se sabe o dia.
- Relação com proposição concreta; nada de "aparecem juntos".
- Contraditório (`cited_position`) pesquisado e registrado conforme a seção 5.

### Etapa 4: Legal/Defamation Reviewer

Revisa o registro sob a ótica de imputação indevida, dados pessoais e direito de resposta.

Verifica:

- Nenhuma imputação de crime, fraude ou ilícito sem documento que a sustente na classe correspondente. Denúncia recebida é alegação, não condenação; condenação em primeira instância é fato quanto à existência da condenação, com registro do recurso quando houver.
- Nenhum dado pessoal vedado (seção 6).
- Fotos com metadados completos e licença compatível (seção 7).
- `cited_position` presente; se o citado negou, a negativa está visível e ligada à fonte.
- Registro cujo suporte é apenas alegação ou inferência não está com status `verified`.
- O texto suportaria leitura por advogado do citado sem revelar afirmação que o corpus não demonstra.

### Etapa 5: Adversarial Reviewer

Tenta derrubar o registro. Para `Claim`, preenche `adversarial_review` (`attempted_refutation`, `outcome`). Para os demais registros, sua conclusão é anotada em `reviewer` e `reviewed_at` e, se necessário, nos `open_questions` da entidade.

Verifica:

- Existe leitura alternativa dos mesmos documentos? Se sim, ela está registrada (`alternative_explanation` em `cited_position`, ou `limits` no claim).
- As fontes de classe C são de fato independentes?
- O documento de classe D demonstra a proposição ou apenas a menciona?
- A inferência de classe I está com o limite escrito e o limite é honesto?
- O que mudaria se o citado estiver dizendo a verdade? Isso está refletido no status?

Resultados possíveis: `stands` (publica), `weakened` (rebaixa classe ou confiança e publica), `disputed` (publica com status `disputed`), `refuted` (não publica, ou publica como `refuted` se o registro já existia).

### Publicação

Após as cinco etapas, `review_status` muda para `published`, com `reviewer` e `reviewed_at` preenchidos. O pull request de dados só é mesclado com `npm run data:lint` passando (sem erros e sem avisos em registros publicados) e com a revisão registrada.

## 2. Quando usar `disputed` e `unverified`

- `unverified` é o padrão de todo registro novo e o status permanente de alegações (A) e inferências (I). Não é um estado provisório a ser eliminado; é a descrição honesta do que se sabe.
- `disputed` aplica-se quando há dúvida material: o citado nega com fundamento, há decisão judicial ou documento em sentido contrário, ou duas fontes confiáveis se contradizem em ponto essencial (data, participante, valor). O registro permanece visível com a contestação ao lado.
- Dúvida material nunca é resolvida por votação de fontes nem por prestígio do veículo. Resolve-se por documento ou permanece `disputed`.

## 3. Vocabulário

### Imputações vedadas

Não se escreve, em texto próprio do Novelo, que alguém é "criminoso", "corrupto", "fraudador", "bandido", que "lavou dinheiro", "pagou propina", "comprou a decisão", integra "quadrilha" ou "esquema criminoso", nem qualquer equivalente, salvo quando o termo aparece dentro de citação atribuída ("a denúncia descreve o que chama de esquema criminoso") ou em transcrição de decisão judicial identificada. O lint emite aviso para esses termos quando não há qualificador de atribuição na mesma frase ou parágrafo; o aviso é um lembrete, não uma autorização: a presença de "segundo" no texto não torna aceitável uma imputação que a fonte não faz.

Também são vedados: adjetivos de juízo ("suspeito", "polêmico", "controverso" como qualificativo de pessoa), verbos que pressupõem intenção não documentada ("manobrou", "articulou para", "tentou blindar"), ironia e insinuação.

### Qualificadores obrigatórios

Toda proposição de classe A é introduzida por atribuição explícita: "segundo", "conforme", "de acordo com", "afirmou", "alega", "sustenta", "a denúncia aponta", "o relatório registra". A atribuição nomeia quem afirmou e, quando possível, onde e quando.

Toda proposição de classe I é acompanhada do limite: o que os documentos permitem afirmar e o que não permitem.

### Frases-modelo para incerteza

- "Não há evidência pública disponível no corpus que demonstre quem iniciou este contato."
- "O documento registra a reunião; não registra o conteúdo tratado."
- "A relação está documentada até [data]; não há registro posterior no corpus."
- "A alegação foi feita por [autor] em [documento]; não foi localizado documento que a confirme ou refute."
- "O intervalo entre os dois atos é de [n] dias. O corpus não contém documento que ligue um ao outro."
- "[Nome] negou a versão em nota de [data]; a negativa está registrada na posição do citado."
- "O valor consta do relatório como estimativa; não há comprovante no corpus."

### Termos preferidos

| Evitar                                     | Preferir                                                                               |
| ------------------------------------------ | -------------------------------------------------------------------------------------- |
| "ligado a", "próximo de" (sem especificar) | o tipo concreto: "sócio de", "advogado de", "nomeado por", "participou de reunião com" |
| "envolvido em"                             | "citado em", "parte em", "investigado em", conforme o documento                        |
| "esquema"                                  | "operação", "arranjo", "conjunto de transações", ou o termo do documento entre aspas   |
| "revelou"                                  | "registrou", "relatou", "publicou"                                                     |
| "confirmou" (para alegação)                | "afirmou", "reiterou"                                                                  |

## 4. "Por que está no Novelo?"

O campo `why_in_novelo` é uma frase, factual e neutra, que qualquer visitante lê ao passar o mouse sobre o nó. Regras:

- Uma frase. Sem adjetivos de juízo. Sem imputação.
- Responde com o papel documentado: cargo, ato, participação, citação.
- Cita a natureza do documento quando o papel decorre de alegação: "Citado na denúncia da PGR de [data] como suposto intermediário" é aceitável; "Intermediário do esquema" não é.
- Não é resumo biográfico; para isso existe `summary`.

Exemplos aceitáveis:

- "Controlador do Banco Master no período investigado, segundo registros societários."
- "Relator do processo [número] no STF."
- "Sócio da empresa [nome], que celebrou contrato com o banco em 2024, conforme documento societário e contrato juntados aos autos."
- "Citado em relatório da PF como remetente de mensagens extraídas do aparelho de [nome]."

## 5. Contraditório obrigatório e `cited_position`

Antes de publicar pessoa ou organização, o Investigative Journalist procura a posição do citado sobre os fatos registrados: nota pública, entrevista, manifestação nos autos, resposta a veículo de imprensa, publicação própria. O que for localizado é registrado em `cited_position` com `kind`, `summary`, `date` e `source_ids`.

Tipos (`kind`):

- `denial`: negativa expressa.
- `clarification`: esclarecimento que não nega, mas contextualiza.
- `public_note`: nota oficial sobre o tema.
- `version`: a versão dos fatos apresentada pelo citado.
- `alternative_explanation`: explicação alternativa para o mesmo documento ou evento.
- `no_response`: o citado foi procurado (por veículo identificado ou pelo Novelo) e não respondeu. Registrar quem procurou, quando e por qual meio, no `summary`.
- `not_located`: nenhuma manifestação foi encontrada após busca. Registrar no `summary` onde se buscou ("busca em notas públicas, entrevistas e manifestações nos autos até [data] não localizou posição").

Regras:

- Lista vazia é exibida como "posição não localizada", mas gera aviso no lint. Prefira registrar `not_located` com a descrição da busca, o que documenta a diligência.
- Posição registrada em fonte de terceiro (jornal que reproduz a nota) aponta para essa fonte. Posição na publicação própria do citado aponta para fonte `self_published`.
- A posição sobre um fato específico vai no `cited_position` do registro correspondente (relação, evento, transação), não só no da pessoa.
- Uma negativa não apaga a evidência; convive com ela. Se a negativa vier com documento que refute a proposição, o status muda para `disputed` ou `refuted`.
- O Novelo não procura pessoas por telefone ou endereço pessoal. Contatos são feitos por canais institucionais ou públicos (assessoria, escritório, e-mail profissional publicado).

## 6. Dados pessoais

O Novelo publica o que é de interesse público e já público. Não publica:

- Telefone pessoal, e-mail pessoal, endereço residencial, placa de veículo, dados bancários, CPF, RG, passaporte, dados de saúde, orientação sexual, religião, filiação sindical, dados biométricos ou genéticos, dados de menores.
- Endereço de imóvel, ainda que conste de matrícula pública, salvo quando o imóvel é ele mesmo objeto do caso (por exemplo, bem sequestrado por decisão judicial), e mesmo assim sem número de apartamento ou detalhes de acesso.
- Conteúdo de mensagens privadas além do trecho estritamente necessário para a proposição, e apenas quando o trecho já foi tornado público em documento oficial.
- Fotos de familiares, residências ou situações privadas.

CNPJ é dado público de pessoa jurídica e pode ser registrado. Nome completo de pessoa física é registrado quando consta de documento público relevante. Cargos, empresas e datas de exercício são de interesse público.

Quando um dado dessa lista é encontrado no corpus, aplica-se o procedimento da seção 9 e o dado é removido do histórico se necessário (ver [SECURITY.md](SECURITY.md#dado-pessoal-indevido)).

## 7. Fotos

Toda foto tem `source`, `author`, `license`, `original_url`, `retrieved_at` e `alt` (obrigatórios no schema). Ordem de preferência:

1. Foto oficial de órgão público (Câmara, Senado, STF, tribunais, governos) com licença declarada.
2. Wikimedia Commons, com licença Creative Commons ou domínio público, atribuição completa.
3. Material institucional da própria organização (site oficial, relatório anual) com uso permitido para fins informativos.
4. Sem foto adequada: avatar neutro gerado pela interface. Nunca recortar foto de reportagem, rede social ou material sem licença.

Não se usa foto que mostre a pessoa em situação privada, em custódia (algemas, viatura), com familiares ou menores, ou que tenha sido tirada em residência.

## 8. Correções e retratações

- Correção de campo (data, grafia, referência): editar o registro, atualizar `updated_at`, descrever em `Revision.corrections`.
- Correção de classificação (rebaixar D para A, por exemplo): editar, registrar na revisão, e reavaliar status.
- Refutação: `status: refuted`, com a evidência que refutou ligada. O registro fica visível como refutado.
- Retratação: `review_status: retracted`. O registro sai do build. Motivo registrado em `Revision.corrections` e no [CHANGELOG.md](CHANGELOG.md). Aplica-se a registros que violaram critérios de inclusão, fontes inválidas, dados pessoais indevidos ou erro de identificação (homônimo).
- Toda correção material gera entrada em `data/revisions/` e aparece em `/atualizacoes`. Correções de grafia sem efeito no sentido podem ser agrupadas na revisão seguinte.

## 9. Pedidos de remoção e de resposta

Qualquer pessoa citada, seu representante ou qualquer visitante pode:

- Pedir correção de dado: issue "Correção de dado" (`.github/ISSUE_TEMPLATE/data-correction.yml`), com o registro afetado, o que está errado e a fonte que demonstra o erro.
- Exercer direito de resposta: mesma issue, indicando o registro e a posição a registrar, com fonte pública ou nota que o Novelo publicará como `cited_position` de tipo `public_note`, `denial`, `clarification` ou `version`, atribuída ao remetente.
- Pedir remoção de dado pessoal indevido: não abrir issue pública com o dado. Usar o canal descrito em [SECURITY.md](SECURITY.md#dado-pessoal-indevido).

Procedimento:

1. O pedido é registrado e respondido em até 15 dias com uma das saídas: correção aplicada, posição registrada, remoção aplicada, ou manutenção fundamentada com indicação das fontes.
2. Pedido de remoção de registro que atende aos critérios de inclusão e tem suporte documental não resulta em remoção; resulta em registro da posição do citado e, havendo contestação fundamentada, em status `disputed`.
3. Pedido de remoção de registro sem suporte suficiente, com erro de identificação ou com dado pessoal vedado resulta em correção ou retratação.
4. Decisão judicial que determine remoção é cumprida e registrada no changelog com a referência do processo, sem reprodução do conteúdo removido.
5. Ninguém que tenha criado o registro decide sozinho sobre o pedido referente a ele.
