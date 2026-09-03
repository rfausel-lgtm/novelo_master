# Red Team 2: investigação

**Data:** 2026-09-03 · **Executor:** orquestrador (ver nota de método em RED_TEAM_1_ENGENHARIA.md).

## Roteiro aplicado

1. Auditoria de datas: extração automática de `datePublished`/`article:published_time` de todas as
   páginas capturadas em `processed/captures` e confronto com `publication_date` das fontes.
2. Releitura de cada fonte usada em evidências de classe D (comunicações do STF, nota da PF, ata do
   Comef, comunicados do FGC, registro da CLDF, relatório IPJ-A 3298613/2026, contrato Barci de Moraes,
   registro da PEC 65/2023 no Senado, Agência Senado) para conferir resumo e trechos.
3. Busca ativa por versões contrárias e negativas dos citados (13 buscas e 20 páginas lidas).
4. Verificação da coerência entre classe de evidência, tipo de fonte e status.

## Achados

| # | Registro | Severidade | Problema | Correção |
|---|----------|------------|----------|----------|
| 1 | 6 fontes (CNN, Brasil Paralelo) | média | `publication_date` estimada (mês) ou errada em um caso (CNN "Lula esteve com Vorcaro": 23 vs 26/01/2026). | FIXED: datas corrigidas a partir dos metadados das páginas. |
| 2 | rel-gilberto-kassab-psd-political | média | Relação institucional classificada como C com uma única fonte (lint bloqueou). | FIXED: reclassificada como A/unverified até haver segunda fonte. |
| 3 | evt-2024-12-04-reuniao-planalto-lula-vorcaro | média | Estava como C (imprensa) embora exista confirmação oficial: depoimento de Galípolo à CPI registrado pela Agência Senado. | FIXED: evidência D adicionada; evento reclassificado para D; versão de Galípolo registrada. |
| 4 | ciro-nogueira, dias-toffoli, gilberto-kassab, michel-temer, andre-mendonca, cezinha-de-madureira, antonio-rueda, hugo-motta, davi-alcolumbre, gabriel-galipolo, ricardo-lewandowski | alta | Registros de pessoas com alegações graves tinham `cited_position` "não localizada" embora existissem negativas ou versões públicas na imprensa. | FIXED: 11 posições registradas com fonte (lote 5). |
| 5 | evt-2025-11-17-prisao-vorcaro-guarulhos vs evt-2025-11-18-operacao-compliance-zero-1a-fase | baixa | Divergência de data entre a nota da PF (deflagração em 18/11) e a imprensa (prisão na noite de 17/11). | ACCEPTED: ambos os eventos existem com suas fontes e a divergência está descrita no texto. |
| 6 | evt-2025-09-bc-rejeita-compra-master-pelo-brb | baixa | Dia exato (03/09/2025) vem de apuração da imprensa; a decisão do BC não foi lida. | ACCEPTED: `date_precision: approximate` e limitação declarada na descrição. |
| 7 | src-brasilparalelo-2026-02-planalto-sem-registros | baixa | Veículo de opinião declarada usado como fonte. | ACCEPTED com nota na fonte: usado apenas para a transcrição da resposta via LAI e da entrevista de Lula ao UOL, ambas reproduzidas por outros veículos (CNN, Metrópoles). |
| 8 | ev-cnn-toffoli-relator-desde-2025-11-28 | baixa | Data da distribuição a Toffoli vem de imprensa (Metrópoles/Exame), sem registro oficial no corpus. | ACCEPTED: classe A com atribuição explícita; pendência registrada. |
| 9 | doc-2026-08-27-ipj-a-3298613-relatorio-pf-celular-vorcaro | baixa | Relatório de 218 páginas lido parcialmente (cabeçalho e passagens por termo). | ACCEPTED e declarado no próprio registro; as evidências D citam figuras/localizadores conferidos. |
| 10 | Cobertura | média | Personagens do seed ainda sem registro: Patrícia Abravanel, Robinson Faria, João Camargo, Airton Vieira, Rodrigo Pacheco; temas: Dark Horse (Flávio/Eduardo Bolsonaro), Tayayá/Toffoli, filho de Nunes Marques, Reag/Mansur, Will Bank/Pleno (atos do BC). | PENDENTE: material já capturado em `processed/captures` (Intercept, Metrópoles, Band, Gazeta, B3, Migalhas) aguarda triagem; listado no relatório final. |

## Fontes verificadas (amostra)

| Fonte | Resultado |
|-------|-----------|
| STF 04/03/2026, 20/03/2026, 16/04/2026, 07/05/2026, 14/05/2026, 26/05/2026, 16/06/2026, 14/01/2026, 06/03/2026, 12/03/2026 | confere (lidas integralmente) |
| PF 18/11/2025 (via Internet Archive) | confere; página original restrita no período eleitoral |
| Ata 63 do Comef (PDF) | confere (parágrafo 11) |
| FGC 17/01/2026 e 05/03/2026 (PDF) | confere; nota de rodapé cita os Atos do Presidente do BC |
| CLDF 19/08/2025 | confere (14 a 7, PL 1882/2025) |
| Senado PEC 65/2023 (matéria), Agência Senado 14/08/2024, 03/02/2026, 08/04/2026, 14/04/2026, 21/05/2026 | confere |
| IPJ-A 3298613/2026 (PDF, Poder360) | confere nas passagens citadas (Figuras 18, 19, 30, 150, 151; seções 6.1 e 6.2) |
| Contrato Barci de Moraes × Master (PDF) | cabeçalho confere; valores vêm do Poder360 |
| CNN, Poder360, Congresso em Foco, Migalhas, Gazeta do Povo, Metrópoles, Jornal de Brasília, Brasil de Fato, Reuters/Yahoo | conferem; datas ajustadas onde necessário |

## O que está bem

Nenhuma aresta foi criada por coaparição em reportagem; toda alegação da PF está atribuída e com status
`unverified` ou `disputed`; as duas sequências temporais e a terceira (BRB) declaram `causality_proven: false`
com limites explícitos; as fontes oficiais representam 21 de 58 e sustentam todas as evidências D.
