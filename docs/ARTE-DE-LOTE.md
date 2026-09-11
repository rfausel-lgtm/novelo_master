# Arte de divulgação de lote

Contrato fechado na [issue #34](https://github.com/rfausel-lgtm/novelo_master/issues/34), em revisão adversarial entre Code (Claude) e Codex. Vale para toda arte que apareça em `/atualizacoes`.

## O contrato

1. Cada revisão tem **zero ou uma** arte. Quando existir, o único nome válido é `public/social/<Revision.id>.webp`. Não há sufixos, slugs ou artes adicionais.
2. `public/social/` contém **somente** artes canônicas em WebP. Iterações substituídas, PNGs-fonte e arquivos fora do contrato não moram lá.
3. `/atualizacoes` exibe a arte canônica **no topo da revisão correspondente, antes do texto do lote**, com `alt` de arte de divulgação gerada por IA e a legenda "Ilustração gerada por IA" entre a imagem e o texto — o leitor lê a legenda no instante em que passa da ilustração para o que o acervo afirma. **A ausência de arte é normal**, não é lacuna, e a lista não reserva espaço para ela: o item simplesmente começa pela data.
4. A arte não é evidência, não entra em `photo` nem em `source_ids`, e não sustenta alegação. Texto embutido no pixel **não prevalece** sobre `data/`; divergindo os dois, corrige-se ou remove-se a arte.
5. Toda arte é WebP válido, **estático**, com largura máxima de **1280 px**.
6. `npm run social:add` é o fluxo de inclusão e produz exclusivamente o arquivo canônico. `npm run social:check` falha para nome ou extensão inválidos, revisão inexistente, WebP inválido, largura acima do limite, animação, ou qualquer arquivo não canônico na pasta.
7. **A liberação é automática sob autorização editorial continuada.** O agente que gera a imagem
   também a inspeciona, registra o checklist no PR e só o mescla depois de todas as verificações
   obrigatórias. Incerteza sobre qualquer vedação é falha: a arte não é publicada e o editor é
   avisado. Ver [EDITORIAL_POLICY.md](../EDITORIAL_POLICY.md), seção 7.1.

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

Depois: faça a inspeção visual e registre o checklist da seção 7.1, commite, abra o PR, espere todas
as verificações obrigatórias e mescle. O site publica a arte no próximo build da `main`.

## Detecção de lotes novos

O detector usado pela automação local exige um marco inicial explícito:

```bash
npm run social:pending -- --since-lot 200 --limit 5 --json
```

Ele compara os `Revision.id` em `data/revisions/` com os WebPs canônicos já presentes em
`public/social/`. A presença de `<Revision.id>.webp` é o estado durável de conclusão; se uma execução
falhar antes de publicar a arte, a revisão continua pendente para a próxima tentativa. O comando não
cria nem altera arquivos e se recusa a rodar sem `--since-lot`, para uma configuração incorreta nunca
importar automaticamente o histórico inteiro.

O detector não enxerga arte que ainda está apenas em branch. Por isso o executor deve, antes de
gerar, procurar branch ou PR aberto que mencione o mesmo `Revision.id`; se encontrar, preserva esse
trabalho e não cria uma segunda imagem concorrente.

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

O que é verificável por máquina — formato, largura, animação, nome canônico, vínculo com revisão
existente — é responsabilidade do `social:check`. O restante exige inspeção visual do agente. O PR
registra as duas verificações, e nenhuma substitui a outra. Se a inspeção não puder concluir com
segurança que todos os itens estão conformes, o fluxo falha fechado e pede intervenção humana.
