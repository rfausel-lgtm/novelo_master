# Arte de divulgação de lote

Contrato fechado na [issue #34](https://github.com/rfausel-lgtm/novelo_master/issues/34), em revisão adversarial entre Code (Claude) e Codex. Vale para toda arte que apareça em `/atualizacoes`.

## O contrato

1. Cada revisão tem **zero ou uma** arte. Quando existir, o único nome válido é `public/social/<Revision.id>.webp`. Não há sufixos, slugs ou artes adicionais.
2. `public/social/` contém **somente** artes canônicas em WebP. Iterações substituídas, PNGs-fonte e arquivos fora do contrato não moram lá.
3. `/atualizacoes` exibe a arte canônica junto da revisão correspondente, com `alt` de arte de divulgação gerada por IA e a legenda "Ilustração gerada por IA". **A ausência de arte é normal**, não é lacuna, e a lista não reserva espaço para ela.
4. A arte não é evidência, não entra em `photo` nem em `source_ids`, e não sustenta alegação. Texto embutido no pixel **não prevalece** sobre `data/`; divergindo os dois, corrige-se ou remove-se a arte.
5. Toda arte é WebP válido, **estático**, com largura máxima de **1280 px**.
6. `npm run social:add` é o fluxo de inclusão e produz exclusivamente o arquivo canônico. `npm run social:check` falha para nome ou extensão inválidos, revisão inexistente, WebP inválido, largura acima do limite, animação, ou qualquer arquivo não canônico na pasta.
7. Toda publicação exige **autorização editorial humana**. Ela pode ser específica para uma arte ou continuada para o fluxo de geração, desde que registrada no repositório. Sob autorização continuada, o agente que gera pode executar a publicação direta após `social:check`; ele não decide sozinho nem afasta as vedações da seção 7.1 da [EDITORIAL_POLICY.md](../EDITORIAL_POLICY.md).

## Por que a chave é o `Revision.id`, e não o número do lote

Número de lote não identifica revisão neste acervo:

```
lote-83, lote-84, lote-85, lote-86 → duas revisões distintas cada
lote-75b, lote-77b, lote-83b, lote-85b → quatro revisões com sufixo de letra
```

Chavear por número publicaria a mesma arte em duas revisões diferentes, e faria a arte do `lote-75` aparecer também no `lote-75b`. O id da revisão é único por construção e é o nome do arquivo em `data/revisions/`, o que também permite detectar arte órfã sem depender do `corpus.json` nem da ordem do build.

## Como publicar uma arte

```bash
npm run social:add -- caminho/da/arte.webp 165
```

O segundo argumento é o número do lote **ou** o `Revision.id` completo. O comando resolve o alvo contra `data/revisions/`, converte para WebP ≤1280 px se necessário, valida, e grava já com o nome canônico. Ninguém digita o nome do arquivo.

Quando o número tem mais de uma revisão, ele **falha e lista as candidatas**:

```
$ npm run social:add -- arte.webp 83
o lote 83 tem 2 revisões. Passe o Revision.id completo:
  rev-2026-09-05-lote-83-achados-negativos-e-homonimia
  rev-2026-09-05-lote-83-autos-de-itaguai
```

Nunca infere, aproxima ou corrige um id digitado: id desconhecido é erro.

Depois: rode `npm run social:check`. Sem autorização continuada, submeta a arte à conferência humana; com autorização continuada registrada, o agente pode commitar e publicar diretamente, registrando a autorização no commit ou PR.

## Especificação de geração

Para pedir a arte a um modelo. `<Revision.id>` e o título saem de `data/revisions/`.

```text
ARTE DE DIVULGAÇÃO — revisão: <Revision.id>
Tema editorial: <título da revisão, sem acrescentar nada>

Criar card editorial simbólico, sóbrio e não fotorrealista, em composição
horizontal adequada a até 1280 px de largura. Pode usar formas abstratas,
silhuetas genéricas, tipografia e elementos cenográficos estilizados.

Incluir apenas texto editorial aprovado para o lote e a marca do site.
A arte é decorativa: não acrescenta fatos, pessoas, documentos ou alegações.

Proibido:
- rosto ou pessoa real identificável;
- retrato fotorrealista;
- simular documento, decisão, processo, print, fotografia jornalística
  ou cena de fato específica;
- alegação factual nova, número que não esteja na revisão, ou linguagem
  conclusiva que exceda os dados;
- animação.

Saída: WebP estático, largura <= 1280 px.
```

O que é verificável por máquina — formato, largura, animação, nome canônico, vínculo com revisão existente — é responsabilidade do `social:check`. O restante permanece sob responsabilidade editorial humana, exercida por conferência específica ou autorização continuada registrada.
