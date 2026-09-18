# Auditoria noturna do acervo

Uma rotina que roda toda madrugada, relê o acervo e manda para o editor o que parece errado. Este
documento descreve a parte que vive no repositório: os scripts, o contrato da revisão por IA e o que
a instalação na máquina que hospeda a rotina vai precisar.

## O que ela NÃO faz

Está primeiro porque é a parte que não se dobra.

- **Não corrige.** Nenhuma etapa escreve em `data/`. Nem a determinística, nem a de IA.
- **Não commita, não abre PR, não publica.** O produto é um relatório, e só.
- **Não vai para issue de repositório.** O repositório é público e um achado de dado pessoal
  publicado em issue é o próprio dado pessoal publicado. A saída vai para o Telegram do editor e
  para um arquivo de relatório fora do repositório.
- **Não decide.** Achado é hipótese para uma pessoa conferir, nunca veredito.

## As duas camadas

### 1. Determinística — `npm run auditoria`

Sem IA, portanto sem alucinação possível. Carrega o acervo uma vez e roda tudo sobre ele.

| Conferência            | O que procura                                                                                                                                                                                                                                                                            |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `lint-erro/aviso/info` | O lint editorial que já existe (`scripts/lib/lint.ts`), reaproveitado em processo — inclusive as regras de ligação: mesmo par com a mesma `start_date`, relação e transação do mesmo par no mesmo ano sem `transaction_ids`, cargo sem relação, entidade isolada sem `isolation_reason`. |
| `integridade`          | Órfãos no sentido inverso, que o lint não olha: fonte, documento e evidência que existem e ninguém cita. E `affected_ids` de revisão apontando para id inexistente — o lint não percorre `data/revisions/`.                                                                              |
| `datas`                | Data futura, data anterior a 1900, fim antes do início (inclusive em cargos), captura anterior à publicação da fonte. Data parcial é tratada como intervalo.                                                                                                                             |
| `duplicidade`          | Nome com uma palavra trocada por outra quase igual, duas fontes com a mesma URL, dois documentos com a mesma URL ou o mesmo `sha256`, relação repetida sem data.                                                                                                                         |
| `link-rot`             | `HEAD` (com queda para `GET`) nas URLs de `data/sources`. Classifica 404/410 como morte, 401/403/429 como **bloqueio**, 5xx e ausência de resposta como indisponibilidade.                                                                                                               |
| `dados-pessoais`       | CPF (com dígito verificador), RG em contexto, CEP junto de unidade, telefone, e-mail, data de nascimento, termo de saúde, menção a menor.                                                                                                                                                |
| `verificacao`          | `scan:secrets`, `vitest run` e `build`, cada um como subprocesso, com o código de saída conferido.                                                                                                                                                                                       |

**O valor do dado pessoal nunca sai.** O achado traz arquivo, linha e o tipo, com uma máscara fixa
(`NNN.NNN.NNN-NN`) montada só com constantes do próprio código. Nenhum achado dessa categoria contém
dígito, e é assim que o teste prova a regra. Quem localiza o dado é o editor, abrindo o arquivo.

**A saída é ordenada e estável.** Mesma entrada, mesmos achados, mesmos ids, na mesma ordem — o `id`
de cada achado é o hash de categoria, arquivo, linha, registro e mensagem. É o que permite à rotina
comparar com a noite anterior e avisar só o que é novo.

**O código de saída é 0 mesmo havendo achados.** Achado não é falha da ferramenta; quem decide o que
fazer com ele é a rotina. Código diferente de 0 significa que a auditoria em si quebrou.

### 2. Revisão por IA — prompts em [`docs/auditoria/`](auditoria/)

Duas passadas, em arquivos versionados:

- [`PROMPT_REVISAO.md`](auditoria/PROMPT_REVISAO.md) — o revisor confere cada afirmação contra as
  fontes **citadas no próprio registro** e procura afirmação sem lastro, classificação D/C/A/I
  incompatível, ligação sem lastro, atribuição de crime, exagero editorial e dado pessoal. Cada
  achado precisa de id do registro, fonte e um trecho literal curto: achado sem citação verificável
  é descartado por construção.
- [`PROMPT_VERIFICACAO.md`](auditoria/PROMPT_VERIFICACAO.md) — o verificador adversarial recebe cada
  achado **isolado** e tenta derrubá-lo, relendo registro e fonte. Devolve `CONFIRMADO`, `DUVIDOSO`
  ou `DESCARTADO`. Só os dois primeiros chegam ao editor.

Os prompts estão no repositório porque prompt improvisado no shell não aparece em diff, e mudança de
comportamento da revisão precisa passar por commit como qualquer outra regra.

### Escopo da noite — `npm run auditoria:selecao`

O que mudou nas últimas 24 h (por `git log` em `data/`) mais uma amostra rotativa do acervo antigo,
até o teto de **60 registros**. O ponteiro da amostra é gravado **fora do repositório**, no caminho
passado em `--estado`: ele muda toda noite e não é fato do acervo. A cada execução o ponteiro anda;
em algumas semanas o acervo inteiro passou.

**Um terço do teto é reservado à amostra rotativa.** Sem a reserva ela seria letra morta: um lote
publicado à noite toca dezenas de registros, o que mudou nas últimas 24 h encheria o teto sozinho, o
ponteiro nunca andaria e o acervo antigo nunca mais seria lido. Quando não há o que mudou, a amostra
fica com o teto inteiro. Com o acervo de hoje e o teto de 60, a volta completa leva algo em torno de
três meses; aumentar o teto ou a reserva é o botão para encurtá-la.

Revisões (`data/revisions/`) ficam de fora da seleção: são a prosa do lote, e não têm fonte própria
contra a qual conferir.

A etapa de IA tem teto de **45 minutos**. Estourado o teto, ela entrega o que revisou — o que ficou
de fora volta para a fila da noite seguinte, porque o ponteiro só avança sobre o que foi entregue.

## Como rodar à mão

```bash
# relatório completo, legível
npm run auditoria

# JSON, sem rede e sem os subprocessos: é o modo do CI e do teste
npm run auditoria -- --json --sem-rede --sem-verificacoes

# como a rotina roda, com cache de link e arquivo de saída
npm run auditoria -- --json --estado ~/novelo-auditoria/links.json --saida ~/novelo-auditoria/relatorio.json

# o que a IA revisaria hoje (sem consumir a fila)
npm run auditoria:selecao -- --json

# o que a rotina roda: consome a fila e grava o ponteiro
npm run auditoria:selecao -- --estado ~/novelo-auditoria/estado.json --escrever-estado --json
```

Flags de `npm run auditoria`:

| Flag                 | Efeito                                                                                                        |
| -------------------- | ------------------------------------------------------------------------------------------------------------- |
| `--json`             | JSON no stdout, e só ele. Sem a flag, sai um resumo legível.                                                  |
| `--saida <arquivo>`  | Grava o JSON no arquivo.                                                                                      |
| `--sem-rede`         | Pula o link rot. **É a única chamada externa da camada determinística**, e com esta flag ela não faz nenhuma. |
| `--sem-verificacoes` | Pula `scan:secrets`, `vitest` e `build`.                                                                      |
| `--estado <arquivo>` | Cache do link rot. Sem ele, toda URL é reconferida em toda execução.                                          |
| `--limite-links <n>` | Teto de URLs conferidas por execução (padrão 400).                                                            |

Flags de `npm run auditoria:selecao`: `--teto <n>` (padrão 60), `--horas <n>` (padrão 24),
`--estado <arquivo>`, `--escrever-estado`, `--json`.

## O que a instalação na máquina que hospeda a rotina precisa saber

O repositório exige Node >= 24. A máquina que hospeda a rotina roda uma versão anterior, e por isso
a rotina roda em contêiner `node:24`, com o repositório clonado dentro dele.

Sequência de uma noite:

1. `git fetch && git checkout main && git reset --hard origin/main` — a auditoria lê a `main`
   publicada, não uma cópia de trabalho.
2. `npm ci`
3. `npm run auditoria -- --json --estado "$NOVELO_AUDITORIA_CACHE_LINKS" --saida "$NOVELO_AUDITORIA_RELATORIO"`
4. `npm run auditoria:selecao -- --estado "$NOVELO_AUDITORIA_ESTADO" --escrever-estado --json`
5. A etapa de IA, com os prompts de `docs/auditoria/` preenchidos, em modo headless, com teto de
   45 minutos.
6. Comparar os achados com os da noite anterior pelo campo `id` e mandar ao Telegram o que é novo.

Variáveis de ambiente esperadas, **por nome** (os valores ficam na máquina, nunca no repositório):

| Nome                           | Para quê                                                          |
| ------------------------------ | ----------------------------------------------------------------- |
| `NOVELO_AUDITORIA_ESTADO`      | Caminho do ponteiro da amostra rotativa.                          |
| `NOVELO_AUDITORIA_CACHE_LINKS` | Caminho do cache do link rot.                                     |
| `NOVELO_AUDITORIA_RELATORIO`   | Caminho do relatório da noite.                                    |
| `NOVELO_AUDITORIA_ANTERIOR`    | Caminho do relatório da noite anterior, para o diff.              |
| `TELEGRAM_BOT_TOKEN`           | Credencial do bot que entrega o relatório.                        |
| `TELEGRAM_CHAT_ID`             | Destino da mensagem.                                              |
| `ANTHROPIC_API_KEY`            | Credencial da etapa de IA, se ela não usar sessão já autenticada. |

Três pontos que a instalação não pode inverter:

- **O volume do repositório é montado somente para leitura** na etapa de IA. A garantia de que nada
  é escrito em `data/` não deve depender só do prompt.
- **Nada é publicado.** Nem issue, nem PR, nem post. O relatório vai para o Telegram e para o arquivo.
- **Falha da rotina não é falha do acervo.** Se a auditoria quebrar, o site continua no ar e os lotes
  continuam sendo publicados. A rotina nunca entra no caminho da publicação.
