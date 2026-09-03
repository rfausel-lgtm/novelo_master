# Briefing comum aos investigadores OSINT (O Novelo Master)

Leia integralmente antes de criar qualquer arquivo em /data.

## Princípio
Mostre a evidência. Mostre a conexão. Mostre a cronologia. Deixe a conclusão para o visitante.
Estar no mapa não implica ilicitude. Alegação não é fato. Proximidade não é influência.
Coincidência temporal não é causalidade. NUNCA invente fonte, página, mensagem ou conexão.

## Ferramentas
- Descobrir: WebSearch (funciona). WebFetch NÃO funciona para gov.br/stf/bcb (403/geo).
- Ler página: `python python/novelo_osint/fetch.py "<url>" [--grep TERMO] [--max-chars N]`
  (curl local com IP brasileiro; funciona em noticias.stf.jus.br, portal.stf.jus.br, CNN, G1, Folha,
  Estadão, Poder360, Metrópoles, Agência Pública, Intercept, JOTA, Senado/Câmara, in.gov.br).
  Salva a captura em processed/captures/ (ignorado no git) e imprime texto limpo.
- Páginas gov.br/pf e agenciabrasil/agenciagov estão restritas (período eleitoral). Use o
  Internet Archive: `https://web.archive.org/web/2025id_/<url>` (ou 2026id_) e registre em
  `archive_url`, mantendo `url` original. Só registre uma fonte se leu o texto (original ou archive).
- Paywall (O Globo, Folha, Valor, Estadão): tente o archive; se não conseguir ler, NÃO use como fonte.
  Procure a mesma informação em veículo acessível ou em fonte oficial.
- PDF: fetch.py extrai texto de PDFs (pypdf).
- Wikipedia: só como índice/pista (source_type `encyclopedic`), nunca como suporte de relação/evento.

## Regras de dados (ver src/lib/schema/entities.ts e scripts/lib/lint.ts — leia ambos)
- Um registro por arquivo: data/<coleção>/<id>.yaml, `id` == nome do arquivo, kebab-case ascii.
- IDs: pessoas `nome-completo-usual` (ex.: alexandre-de-moraes); organizações `nome` (ex.: banco-btg-pactual);
  eventos `evt-YYYY-MM-DD-slug` (ou evt-YYYY-MM-slug); atos `ato-YYYY-MM-DD-slug`; fontes
  `src-<veiculo>-YYYY-MM-DD-slug`; documentos `doc-YYYY-MM-DD-slug`; evidências `ev-<slug>`;
  relações `rel-<from>-<to>-<tipo>`; transações `tx-YYYY-MM-DD-slug`; claims `claim-<slug>`;
  sequências `seq-<slug>`.
- Toda fonte: title, publisher, publication_date, retrieved_at=2026-09-03, url, source_type, summary,
  verification {checked_at, checked_by: "<seu papel>", url_reachable, content_matches_summary}.
- Classes: D exige document_ids (documento primário: decisão, nota oficial, ata, contrato, DOU;
  uma comunicação oficial do STF/PF/BC conta como documento `public_statement` is_official=true);
  C exige ≥2 fontes independentes; A exige attributed_to/attributed_to_id (quem alegou); I exige inference_basis.
- Reportagem que diz "segundo a PF, X" sustenta a evidência "a PF afirma X" (classe A, attributed_to
  policia-federal), NÃO "X aconteceu". Se a reportagem cita documento oficial que você não leu, classe A/C.
- Relação: label curto, description = "por que estes nós estão conectados" factual, evidence_class coerente
  com as evidências ligadas, status verified só para D/C. Nunca crie aresta só porque duas pessoas
  aparecem na mesma reportagem: precisa de proposição concreta (reunião X, contrato Y, cargo Z).
- Toda pessoa/organização: summary neutro, why_in_novelo (UMA frase factual), cited_position (negativa,
  nota, versão; se não achou, kind: not_located com summary), open_questions (o que não se sabe),
  source_ids. Sem foto (deixe `photo` ausente). Sem telefone, endereço residencial, CPF, dados de familiares
  menores ou qualquer dado sensível sem interesse público claro.
- Vocabulário: "segundo", "conforme", "teria", "supostamente", "sob investigação". Nunca "criminoso",
  "corrupto", "propina" sem atribuição explícita. Nunca afirme crime como fato.
- review_status: published (você é a única etapa nesta rodada; o Red Team revisa depois), reviewer: seu papel,
  reviewed_at/created_at/updated_at = 2026-09-03.
- Sem fotos, sem downloads binários (exceto PDF oficial via fetch.py, que fica fora do git).

## Coordenação (vários agentes escrevem em /data ao mesmo tempo)
- Você SÓ cria arquivos novos. Se um arquivo já existe (ex.: data/people/daniel-vorcaro.yaml), NÃO edite:
  escreva o acréscimo proposto (novos source_ids, cited_position, positions, open_questions) em
  raw/osint/<seu-cluster>/patches.md, indicando o id e o bloco YAML a acrescentar.
- Verifique existência com `ls data/<coleção>/<id>.yaml` antes de criar. Se outro cluster já criou a pessoa
  que você precisa, referencie o id existente e mande patch se necessário.
- IDs do núcleo compartilhado (existem, referencie livremente): daniel-vorcaro, andre-mendonca, ciro-nogueira,
  felipe-cancado-vorcaro, fabiano-zettel, paulo-henrique-costa, dias-toffoli, gilmar-mendes, luiz-fux,
  nunes-marques, banco-master, banco-de-brasilia-brb, banco-central-do-brasil, policia-federal,
  supremo-tribunal-federal, fundo-garantidor-de-creditos, senado-federal, progressistas-pp,
  ministerio-publico-federal; eventos evt-2025-11-18-operacao-compliance-zero-1a-fase,
  evt-2025-11-18-liquidacao-extrajudicial-banco-master, evt-2026-03-04-compliance-zero-prisao-preventiva-stf,
  evt-2026-03-20-segunda-turma-mantem-prisao-vorcaro, evt-2026-03-toffoli-declara-suspeicao-caso-master,
  evt-2026-04-16-compliance-zero-prisao-ex-presidente-brb, evt-2026-05-07-compliance-zero-fase-ciro-nogueira;
  fontes src-stf-2026-03-04-prisao-preventiva-vorcaro, src-stf-2026-03-20-segunda-turma-mantem-prisao,
  src-stf-2026-04-16-prisao-ex-presidente-brb, src-stf-2026-05-07-nova-fase-ciro-nogueira,
  src-pf-2025-11-18-compliance-zero, src-bcb-2025-11-ata-comef-63, src-cnn-2026-03-04-relembre-crise-master.
- Não referencie ids que outro cluster esteja criando nesta rodada (não existem ainda); descreva em patches.md.
- Ao final: `npm run data:validate` deve terminar com 0 erros (avisos são aceitáveis, mas revise-os).
  Corrija até passar. Não rode git commit.
- Entregue também raw/osint/<seu-cluster>/RELATORIO.md: o que pesquisou, o que não encontrou, fontes que
  não conseguiu abrir, dúvidas para o Red Team, e a lista de ids criados.

## Meta por cluster
Qualidade acima de quantidade. Alvo razoável: 8 a 15 pessoas/organizações novas, 10 a 25 eventos/atos,
20 a 40 fontes, 15 a 30 relações, evidências correspondentes, 2 a 5 claims com limits, 1 a 3 sequências
temporais (seq-*) quando houver sequência evento→ato público relevante, sempre com causality_proven: false
salvo prova documental.
