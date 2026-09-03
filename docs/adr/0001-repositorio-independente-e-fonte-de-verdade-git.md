# ADR-0001 — Repositório independente e Git como fonte de verdade editorial

**Data:** 2026-09-03 · **Status:** aceito

## Contexto
O projeto nasce dentro do workspace `C:\modulojus`, que é um monorepo privado com ~30 projetos e
material sensível. O Novelo Master será público.

## Decisão
1. `novelo_Master/` é um repositório Git próprio (`git init`), sem submódulo nem histórico herdado.
2. `/data` (YAML, um registro por arquivo) é a fonte de verdade editorial da V1. O histórico Git
   é a trilha de auditoria: cada mudança de dado passa por PR, validação e revisão.
3. Nenhum arquivo do monorepo é referenciado; nada é copiado sem revisão.

## Consequências
- Sem banco em runtime. Migração para PostgreSQL/Supabase é possível sem quebrar o schema
  (os schemas Zod são a fonte para gerar DDL futuramente).
- O monorepo verá `novelo_Master/` como diretório não rastreado; não deve ser adicionado lá.
