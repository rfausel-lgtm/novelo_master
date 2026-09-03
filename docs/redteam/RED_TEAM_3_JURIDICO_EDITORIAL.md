# Red Team 3: jurídico e editorial

**Data:** 2026-09-03 · **Executor:** orquestrador (ver nota de método em RED_TEAM_1_ENGENHARIA.md).

## Roteiro aplicado

1. Lint editorial estrito (`npm run data:lint`) sobre 377 registros: 0 erros; 32 avisos, todos do
   tipo "relação institucional sem data" (não afetam linguagem).
2. Varredura por vocabulário imputativo (`propina`, `corrup*`, `lavagem`, `organização criminosa`,
   `máfia`, `fraud*`) em todos os campos de texto, exigindo qualificador de atribuição na mesma passagem.
3. Leitura de todos os `why_in_novelo`, `summary`, `description` de relações e `statement` de claims.
4. Conferência de que toda relação de tipo `investigative_allegation` está em classe A, com status
   `unverified` ou `disputed`, e traz `cited_position` ou `not_located` explícito.
5. Conferência de dados pessoais: nenhum telefone, endereço residencial, CPF, dado de saúde ou de
   menores; nomes de familiares aparecem apenas quando são investigados ou signatários de documento
   público (Henrique e Felipe Vorcaro, Viviane Barci de Moraes).

## Achados

| # | Registro | Severidade | Problema | Correção |
|---|----------|------------|----------|----------|
| 1 | 11 pessoas com alegações graves | alta | Contraditório ausente ("não localizada") apesar de negativas e versões públicas disponíveis. | FIXED (lote 5): negativas de Ciro Nogueira, Toffoli, Kassab, Cezinha; versões de Temer, Mendonça, Rueda, Motta, Galípolo, Alcolumbre, Lewandowski. |
| 2 | rel-banco-master-brb-commercial | média | Descrição dizia que o BRB "adquiriu carteiras... supostamente irregulares"; a compra é fato documentado, a irregularidade é alegação. Redação mantinha o qualificador, mas a classe D e o status `verified` podiam ser lidos como verificação da irregularidade. | FIXED na redação: explicitado que "a irregularidade é objeto de investigação, não de julgamento definitivo". |
| 3 | evt-2025-11-17-mensagens-visualizacao-unica-contato-moraes | média | Evento de classe D (o relatório documenta o envio ao contato salvo) poderia ser lido como prova de que o ministro recebeu as mensagens. | FIXED: status `disputed`, negativa do gabinete e de Viviane no próprio evento, e descrição separando "contato salvo com o nome" de "titularidade da linha". |
| 4 | claim-vorcaro-manteve-contatos-com-moraes | média | Claim sensível sobre ministro do STF. | Mantido como A/`disputed`, com `limits` explícitos (não demonstra titularidade da linha nem ato do ministro; PF não investigou magistrados) e revisão adversarial registrada. |
| 5 | rel-daniel-vorcaro-hugo-motta-allegation, rel-daniel-vorcaro-andre-esteves-allegation | média | Relatos unilaterais de Vorcaro a terceiros (namorada) usados como base de aresta. | Mantidos apenas como A com confiança baixa (0,45), descrição "relato unilateral" e negativa do BTG; sem eles o grafo esconderia menções amplamente noticiadas. |
| 6 | descrições que citam "organização criminosa", "máfia", "corrupção" | baixa | Termos aparecem em 14 registros. | Verificado um a um: todos entre aspas ou atribuídos a decisão judicial, PF, PGR ou CPI ("segundo o relator", "a PF aponta", "podem caracterizar, em tese"). Nenhuma imputação em voz própria. |
| 7 | pessoas.category = "family" | baixa | Henrique e Felipe Vorcaro estão como `businessperson`, não `family`. | ACCEPTED: são investigados por atos próprios; o parentesco está nas relações `familial`. |
| 8 | Fotos | baixa | Nenhuma pessoa tem fotografia; avatar neutro por iniciais. | ACCEPTED para a V1; `PhotoSchema` exige licença/autor/origem; pendência de ingestão via Wikimedia Commons. |

## O que está bem

- Nenhum `why_in_novelo` contém imputação; todos descrevem o motivo documental da presença.
- Todas as 13 relações de alegação investigativa estão em classe A; nenhuma tem `status: verified`.
- Todas as sequências temporais declaram `causality_proven: false` e listam o que não se conclui.
- Os documentos primários mais sensíveis (relatório da PF, contrato) foram tornados públicos por decisão
  judicial e são citados com localizador; o corpus não reproduz dados pessoais deles.
- O rodapé, a home, os cards de aresta e o modo "somente fatos documentados" reforçam que estar no mapa não implica ilicitude.
