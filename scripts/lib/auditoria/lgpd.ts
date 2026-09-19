import { novoAchado, type Achado, type Gravidade } from "./tipos";

/**
 * Varredura de dado pessoal (EDITORIAL_POLICY.md §6).
 *
 * ## O contrato de saída, que é a parte que importa
 *
 * O repositório é PÚBLICO. Um achado de LGPD que carregasse o valor encontrado publicaria, no
 * relatório, exatamente o dado que acusa estar publicado no acervo — e o relatório circula por
 * Telegram e fica em arquivo. Por isso:
 *
 *  - `mensagem` e `evidencia_mascarada` são montadas SÓ com constantes deste módulo. Nada do texto
 *    casado é copiado para elas, nem em pedaço, nem em hash.
 *  - Consequência verificável, e é assim que o teste a prova: **nenhum achado desta categoria
 *    contém dígito** na mensagem ou na evidência mascarada. O que localiza o dado é `arquivo` +
 *    `linha`, que o editor abre no repositório dele.
 *  - O `id` do achado também não deriva do valor: ele sai de arquivo, linha e tipo.
 *
 * ## Falso positivo
 *
 * CNPJ é dado público e aparece no acervo o tempo todo; número de processo no padrão CNJ e hash
 * sha256 são sequências longas de dígito. Nenhum dos três pode virar "CPF encontrado". Daí as duas
 * defesas: dígito verificador do CPF e guarda de vizinhança (o casamento é descartado quando
 * encosta em letra, dígito, `/`, `=`, `?`, `&` ou `-`, que é a assinatura de hash, URL, parâmetro e
 * número formatado maior).
 */

export type TipoDeDadoPessoal =
  | "cpf"
  | "rg"
  | "cep-com-unidade"
  | "telefone"
  | "email-pessoal"
  | "email-institucional"
  | "email-em-url"
  | "data-de-nascimento"
  | "dado-de-saude"
  | "mencao-a-menor";

/** Máscara fixa por tipo. Nenhuma delas é derivada do texto encontrado, e nenhuma tem dígito. */
const MASCARA: Record<TipoDeDadoPessoal, string> = {
  cpf: "NNN.NNN.NNN-NN",
  rg: "RG NN.NNN.NNN-N",
  "cep-com-unidade": "CEP NNNNN-NNN junto de número de unidade",
  telefone: "(NN) NNNNN-NNNN",
  "email-pessoal": "nome@dominio",
  "email-institucional": "caixa-geral@dominio",
  "email-em-url": "https://…/algo@dominio/…",
  "data-de-nascimento": "DD/MM/AAAA junto de termo de nascimento",
  "dado-de-saude": "termo de saúde",
  "mencao-a-menor": "termo de menoridade",
};

const DESCRICAO: Record<TipoDeDadoPessoal, string> = {
  cpf: "CPF (dígito verificador confere)",
  rg: "número de RG em contexto de documento de identidade",
  "cep-com-unidade": "CEP acompanhado de número de apartamento, bloco ou unidade",
  telefone: "telefone, possivelmente pessoal",
  "email-pessoal": "e-mail que parece de pessoa física",
  "email-institucional": "e-mail de caixa institucional (permitido; listado para conferência)",
  "email-em-url":
    "endereço dentro de uma URL: quase sempre é caminho de arquivo, mas às vezes é o login de quem publicou",
  "data-de-nascimento": "data de nascimento",
  "dado-de-saude": "possível dado de saúde",
  "mencao-a-menor": "possível menção a pessoa menor de idade",
};

const GRAVIDADE: Record<TipoDeDadoPessoal, Gravidade> = {
  cpf: "alta",
  rg: "alta",
  "cep-com-unidade": "alta",
  telefone: "alta",
  "email-pessoal": "alta",
  "email-institucional": "baixa",
  "email-em-url": "baixa",
  "data-de-nascimento": "media",
  "dado-de-saude": "media",
  "mencao-a-menor": "media",
};

/** Caixas de contato que a política admite: institucional, não pessoal. */
const CAIXA_INSTITUCIONAL = new Set([
  /* Caixas de setor de empresa: julgadas não pessoais no saneamento de 17/09/2026. */
  "contabilidade",
  "contabil",
  "financeiro",
  "juridico",
  "fiscal",
  "rh",
  "comercial",
  "vendas",
  "adm",
  "administrativo",
  "contato",
  "imprensa",
  "assessoria",
  "atendimento",
  "sac",
  "ouvidoria",
  "comunicacao",
  "comunicação",
  "redacao",
  "redação",
  "faleconosco",
  "secretaria",
  "info",
  "suporte",
  "noreply",
  "no-reply",
  "gabinete",
  "presidencia",
  "juridico",
  "adm",
  "administrativo",
  "cartorio",
  "protocolo",
]);

/**
 * Domínios do próprio Novelo. O endereço de contato do site é publicado de propósito, e acusá-lo
 * toda noite treinaria o editor a ignorar a categoria inteira.
 */
const DOMINIO_DO_PROJETO = /(^|\.)fausel\.adv\.br$/i;

const TERMOS_SAUDE = [
  "diagnóstico",
  "diagnostico",
  "prontuário",
  "prontuario",
  "laudo médico",
  "laudo medico",
  "internação",
  "internacao",
  "internado",
  "quimioterapia",
  "câncer",
  "cancer",
  "hiv",
  "soropositivo",
  "transtorno bipolar",
  "esquizofrenia",
  "depressão",
  "depressao",
  "dependência química",
  "dependencia quimica",
  "cirurgia",
  "doença",
  "doenca",
];

const TERMOS_MENOR = [
  "menor de idade",
  "menores de idade",
  "filho menor",
  "filha menor",
  "adolescente",
  "criança",
  "crianca",
  "aluno menor",
  "estatuto da criança",
  "estatuto da crianca",
];

/**
 * Termo isolado, não pedaço de palavra.
 *
 * `\b` do JavaScript é ASCII e quebra dentro de "doença"; a fronteira aqui é "não ter letra ao
 * lado", com a classe unicode. Sem isso, "hiv" casa dentro de "archive" — e o acervo, cheio de
 * `web.archive.org`, produzia noventa e nove achados de dado de saúde que eram o Internet Archive.
 */
function termoIsolado(termos: string[]): RegExp {
  const alternativas = termos.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
  return new RegExp(`(?<!\\p{L})(?:${alternativas})(?!\\p{L})`, "iu");
}

const RE_SAUDE = termoIsolado(TERMOS_SAUDE);
const RE_MENOR = termoIsolado(TERMOS_MENOR);

const CONTEXTO_TELEFONE = /\b(telefone|fone|celular|whatsapp|contato|tel\.)/i;
const CONTEXTO_UNIDADE = /\b(apto|apart|apartamento|ap\.|bloco|conjunto|torre|unidade)\b/i;
const CONTEXTO_NASCIMENTO = /(nascid[oa]|data de nascimento|nasceu em|dt\.?\s*nasc)/i;
const CONTEXTO_RG = /(\bRG\b|registro geral|carteira de identidade)/i;

/** Intervalo de anos: "2024-2026" tem a forma de telefone e não é um. */
const ANO_A_ANO = /^(?:19|20)\d{2}-(?:19|20)\d{2}$/;

/** Caracteres que, encostados no casamento, denunciam hash, URL, parâmetro ou número maior. */
const VIZINHO_PROIBIDO = /[0-9A-Za-z_/=?&-]/;

function vizinhancaLimpa(linha: string, inicio: number, fim: number): boolean {
  const antes = inicio > 0 ? linha[inicio - 1] : "";
  const depois = fim < linha.length ? linha[fim] : "";
  return !VIZINHO_PROIBIDO.test(antes) && !VIZINHO_PROIBIDO.test(depois);
}

/** Dígito verificador do CPF. Rejeita também as sequências de dígito repetido, que passam na conta. */
export function cpfValido(digitos: string): boolean {
  if (!/^\d{11}$/.test(digitos)) return false;
  if (/^(\d)\1{10}$/.test(digitos)) return false;
  const calcular = (ate: number) => {
    let soma = 0;
    for (let i = 0; i < ate; i++) soma += Number(digitos[i]) * (ate + 1 - i);
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };
  return calcular(9) === Number(digitos[9]) && calcular(10) === Number(digitos[10]);
}

interface Ocorrencia {
  tipo: TipoDeDadoPessoal;
  linha: number;
}

/** Ocorrências de uma linha. Devolve tipo e nada mais: o valor nunca sai desta função. */
export function ocorrenciasNaLinha(linha: string): TipoDeDadoPessoal[] {
  const tipos = new Set<TipoDeDadoPessoal>();

  /* CPF: formato com máscara ou onze dígitos soltos, sempre com DV conferido. */
  for (const m of linha.matchAll(/\d{3}\.\d{3}\.\d{3}-\d{2}|\d{11}/g)) {
    const inicio = m.index ?? 0;
    if (!vizinhancaLimpa(linha, inicio, inicio + m[0].length)) continue;
    if (cpfValido(m[0].replace(/\D/g, ""))) tipos.add("cpf");
  }

  /* RG: só em contexto — o número sozinho não tem formato nem DV que o identifique. */
  if (CONTEXTO_RG.test(linha) && /\d[\d.]{5,12}[\dXx]\b/.test(linha)) tipos.add("rg");

  /* CEP só é vedado junto do número da unidade; sozinho, é município. */
  if (CONTEXTO_UNIDADE.test(linha)) {
    for (const m of linha.matchAll(/\d{5}-\d{3}/g)) {
      const inicio = m.index ?? 0;
      if (vizinhancaLimpa(linha, inicio, inicio + m[0].length)) tipos.add("cep-com-unidade");
    }
  }

  /* Telefone: o formato com DDD entre parênteses basta; sem ele, exige contexto. */
  for (const m of linha.matchAll(/\(\d{2}\)\s?9?\d{4}[-\s]?\d{4}/g)) {
    const inicio = m.index ?? 0;
    if (vizinhancaLimpa(linha, inicio, inicio + m[0].length)) tipos.add("telefone");
  }
  if (CONTEXTO_TELEFONE.test(linha)) {
    for (const m of linha.matchAll(/\d{4,5}-\d{4}/g)) {
      const inicio = m.index ?? 0;
      /* "(2024-2026)" é intervalo de anos, e a palavra "contato" na mesma frase não o torna telefone. */
      if (ANO_A_ANO.test(m[0])) continue;
      if (vizinhancaLimpa(linha, inicio, inicio + m[0].length)) tipos.add("telefone");
    }
  }

  /*
   * E-mail: institucional é permitido, e entra só como baixa para o editor conferir.
   *
   * O casamento dentro de uma URL é rebaixado, e não descartado. Caminho de repositório de arquivos
   * com "@" no meio (`/uploads/algo@outro/ATA.pdf`) quase sempre é só caminho — mas a URL oficial de
   * uma ata da Amprev, já conhecida do editor, traz o LOGIN da servidora que publicou o arquivo.
   * Descartar em silêncio esconderia justamente o caso que motivou a checagem.
   */
  const trechosDeUrl = [...linha.matchAll(/https?:\/\/\S+/g)].map((m) => [
    m.index ?? 0,
    (m.index ?? 0) + m[0].length,
  ]);
  for (const m of linha.matchAll(/[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+/g)) {
    const inicio = m.index ?? 0;
    if (trechosDeUrl.some(([a, b]) => inicio >= a && inicio < b)) {
      tipos.add("email-em-url");
      continue;
    }
    const [local, dominio] = m[0].toLowerCase().split("@");
    const raiz = local.split(/[.+_-]/)[0];
    const institucional =
      DOMINIO_DO_PROJETO.test(dominio) ||
      CAIXA_INSTITUCIONAL.has(local) ||
      CAIXA_INSTITUCIONAL.has(raiz);
    tipos.add(institucional ? "email-institucional" : "email-pessoal");
  }

  /* Data de nascimento: a data sozinha é inócua; o que a torna dado pessoal é o contexto. */
  if (
    CONTEXTO_NASCIMENTO.test(linha) &&
    /\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4}|\d{4}-\d{2}-\d{2}/.test(linha)
  ) {
    tipos.add("data-de-nascimento");
  }

  if (RE_SAUDE.test(linha)) tipos.add("dado-de-saude");
  if (RE_MENOR.test(linha)) tipos.add("mencao-a-menor");

  return [...tipos];
}

/** Varre um conteúdo inteiro e devolve os achados, já mascarados. */
export function varrerConteudo(conteudo: string, arquivo: string): Achado[] {
  const ocorrencias: Ocorrencia[] = [];
  conteudo.split(/\r?\n/).forEach((linha, i) => {
    for (const tipo of ocorrenciasNaLinha(linha)) ocorrencias.push({ tipo, linha: i + 1 });
  });

  return ocorrencias.map(({ tipo, linha }) =>
    novoAchado({
      categoria: "dados-pessoais",
      gravidade: GRAVIDADE[tipo],
      arquivo,
      linha,
      mensagem: `${DESCRICAO[tipo]} — valor omitido por política; abra o arquivo na linha indicada`,
      evidencia_mascarada: MASCARA[tipo],
    }),
  );
}
