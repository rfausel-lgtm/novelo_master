# Estado da pesquisa — auditoria estrutural do grafo (2026-09-19)

Feita a pedido de Rafael Fausel, depois do ciclo dos lotes 328 a 337 (publicação dos 8 processos novos do
STF). Complementa `ESTADO_DA_PESQUISA_2026-09-15.md`, que continua valendo para o que não é revisitado
aqui. Hipóteses que envolvem pessoas identificáveis e ainda não têm fonte ficam fora deste arquivo, que é
público.

## 1. Correção de diagnóstico — quatro suspeitas descartadas

Uma medição própria do corpus (286 pessoas, 211 organizações, 622 relações, 909 perguntas abertas)
levantou quatro suspeitas de inconsistência estrutural. As quatro foram verificadas contra o comportamento
real do lint (`npm run data:lint -- --strict`, que já passava limpo antes de qualquer edição) e contra a
leitura direta dos registros — não contra intuição editorial. Três eram falsas, uma parcialmente:

- **53 relações classe D com status "unverified"**: parecia contradição (D deveria implicar fato
  verificado). Não é. `evidence_class: D` responde só se existe documento primário ligado — e todas as 53
  têm (decisões do STF, representações da PF, RIF do COAF). `status: unverified` responde se o FATO já foi
  confirmado além do que o próprio documento alega — e a maioria registra explicitamente que é leitura da
  PF sobre um chat ou uma decisão sem juízo de mérito ("não há decisão de mérito", "a interpretação é da
  PF"). Documento primário relatando uma alegação ainda não julgada é exatamente D + unverified. Nenhuma
  das 53 foi alterada.
- **65 relações classe A sem `evidence_ids` formal**: pareciam incompletas. O schema não exige um registro
  de evidência separado quando `source_ids` ou `document_ids` já sustentam a relação diretamente — só exige
  ALGUMA das três. Amostragem confirmou: todas têm `source_ids`. Nenhuma alterada.
- **5 eventos "sem evidência"**: erro do meu próprio script de verificação ad hoc, que checava só
  `evidence_ids` e ignorava `source_ids` — a medição original (mais cuidadosa) já apontava corretamente
  zero eventos sem nenhum lastro. Nenhum alterado.
- **3 arestas/verbetes aparentemente ausentes**: dois já existiam. Augusto Lima × PKL One está modelado
  como duas alegações do BRB (BRB→Augusto Lima, BRB→PKL One), não como aresta direta entre os dois —
  desenho mais cauteloso, já que nenhum documento liga os dois diretamente, só a petição do BRB liga cada
  um a ela. A sociedade "Monteiro, Rusu, Cameirão e Bercht" do levantamento do ND Mais (lote 329) já tinha
  verbete, sob o id `monteiro-sociedade-de-advogados`. Só o terceiro item era real (seção 2).

**Lição:** medir grau, classe e presença de campos não substitui ler o lint de verdade nem o registro
individual. Refazer essa auditoria noutra frente do acervo deve partir do código (`scripts/lib/lint.ts`),
não de heurística.

## 2. Achado real: Garigham Amarante Pinto e Nara Brum

Citados pela PF e pela decisão de Flávio Dino de 10/07/2026 (Operação Transparência) como coexecutores,
ao lado de Mariângela Fialek, do esquema de emendas parlamentares de Valdemar Costa Neto — mesma base
documental que já sustentava o verbete dela — mas sem verbete próprio. Item já estava na lista de
pendentes do estado de 15/09 (seção 4, item "Operação Transparência"). Publicado no lote 338: dois
verbetes novos, duas relações de alegação com Valdemar Costa Neto, e os dois passam a constar como
participantes do evento de bloqueio dos R$ 119,2 milhões.

## 3. Anonimização das fotos de Trancoso (decisão de Rafael, 19/09/2026)

Os dois verbetes de particulares sem qualquer alegação de irregularidade contra elas — criados no lote 235
só para registrar a autoria involuntária das fotos de Instagram que a PF usou para localizar a casa de
veraneio de Felipe Cançado Vorcaro em Trancoso — foram removidos. Eram nós isolados (grau zero), sem
nenhuma relação de grafo. O fato passa a constar só por iniciais (C.R.S.S. e K.R.O.V.) no verbete de
Felipe Cançado Vorcaro e no documento da identificação. Publicado no lote 338.

## 4. Fila real remanescente — não descartada pela seção 1

- **30 pessoas de grau ≥4 com `cited_position` só `not_located`**: essa é fila de contraditório de
  verdade — busca dirigida por manifestação pública, não checagem estrutural. Topo por grau: Guilherme
  Henrique Sodré Martins (9), Mariângela Fialek (7), Alberto Félix Oliveira, Alessandro Vieira, André
  Kruschewsky Lima, Antônio Carlos Freixo Júnior, Clécio Luís, David Henrique Alves, Jair Bolsonaro,
  Natália Vorcaro Zettel, Paula Vouguinha (6 cada). Não iniciada nesta sessão.
- **975 pares de menção sem relação**: fila de consolidação de sempre, por lote, nunca em massa — regra já
  registrada em 15/09 e reconfirmada aqui.

## 5. Frentes investigativas (sem alteração desde 15/09, ver aquele arquivo para detalhe completo)

BRB × Master (lacuna: nenhuma ocorrência de "TCDF" no acervo, apesar de o tribunal de contas do DF
fiscalizar o BRB); honorários do Master e dação em pagamento das participações societárias (QSA ainda não
verificado); cemitérios/ADPF 1.196; rede religiosa; Credcesta/PKL One/Augusto Lima (edital e contrato do
Decreto 18.353 nunca obtidos); Amapá/Alcolumbre; Rioprevidência/Castro; Sefer/Botelho (PAS CVM e Apelação
TRF3 paradas, consulta de movimentação é barata).

## 6. Pet 15.719/DF (fluxo do Credcesta retido pelo BRB)

Desceu à Justiça Federal de 1º grau em 14/04/2026, fora do peticionamento no STF. Por decisão de Rafael
Fausel (19/09/2026), a equipe passa a acompanhar — sem, por ora, tratamento equivalente ao dos processos
no STF (sem peticionamento eletrônico direto; acompanhamento por consulta processual pública).

## 7. Calendário a acompanhar

- ADPF 1.196: resposta da Prefeitura/SP Regula em 25/09/2026, da CVM em 30/09/2026.
- Vista de Gilmar Mendes sobre o afastamento de Andrei Rodrigues (prazo regimental ~08/12/2026).
- Vista de Flávio Dino na Pet 16.662 (prazo até ~16/12/2026, pode devolver antes).
- Relatório final da PF sobre Fabiano Zettel, previsto para o fim de setembro de 2026.

## 8. Pendente, não iniciado

Pedidos LAI (SDE-BA sobre o edital/contrato do Decreto 18.353; MPS sobre o Parecer 146/2024; Amprev sobre
as atas de 2021) e certidão ao TRE-AP sobre a prestação de contas de Alcolumbre — Rafael pediu para
postergar em 19/09/2026. Ficam redigidos só quando ele sinalizar.
