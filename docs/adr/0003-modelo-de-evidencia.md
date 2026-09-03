# ADR-0003 — Evidência como elemento fundamental do modelo

**Data:** 2026-09-03 · **Status:** aceito

## Decisão
- `Evidence` é um registro próprio: uma proposição concreta + classificação D/C/A/I + documento(s)/fonte(s).
- `Relationship`, `Event`, `PublicAct`, `Transaction` e `Claim` apontam para `evidence_ids` e/ou `source_ids`.
- O lint (`scripts/lib/lint.ts`) bloqueia o build quando uma relação não tem suporte e não está
  explicitamente classificada como inferência (I); bloqueia `status: verified` para A/I; exige
  documento primário para D, duas fontes para C, `attributed_to` para A e `inference_basis` para I.
- `Company` e `PublicBody` são subtipos de `Organization` (`org_type`), para reduzir superfície de schema
  sem perder a distinção nos filtros.

## Consequências
- Nunca existe aresta "porque aparecem na mesma reportagem": a aresta tem `label`, `description` e suporte.
- O modo "somente fontes oficiais" e "somente fatos documentados" são derivações diretas dos dados
  (`official` = alguma fonte com `source_type` oficial; `documented` = classe D ou C).
