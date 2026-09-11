import fs from "node:fs";
import path from "node:path";

/**
 * Artes de divulgação dos lotes, em `public/social/`.
 *
 * Contrato fechado na issue #34 e escrito em docs/ARTE-DE-LOTE.md: cada revisão tem zero ou uma
 * arte, e o único nome válido é `<Revision.id>.webp`.
 *
 * A chave é o id INTEIRO da revisão, nunca o número do lote. Número de lote não identifica revisão
 * neste acervo: `lote-83`, `lote-84`, `lote-85` e `lote-86` têm duas revisões cada, e existem
 * `lote-75b`, `lote-77b`, `lote-83b` e `lote-85b`. Chavear por número publicaria a mesma arte em
 * duas revisões diferentes e faria `lote-75` aparecer também em `lote-75b`.
 *
 * A arte NÃO é registro do caso. Não entra em `source_ids`, não é evidência, e não usa o campo
 * `photo` — que existe para foto de terceiro, com licença e procedência. Ver EDITORIAL_POLICY.md,
 * seção 7.1.
 */

export type Ilustracao = { src: string; width: number; height: number };

const DIR = path.join(process.cwd(), "public", "social");

/**
 * O único nome de arquivo publicável: o id da revisão, tal como ele é — segmentos alfanuméricos
 * minúsculos separados por hífen simples — e extensão `.webp` minúscula. Hífen duplo é recusado
 * aqui, e não só pela checagem de órfã, porque `<id>--<slug>` foi a forma cogitada para artes
 * adicionais e descartada: uma revisão tem no máximo uma arte.
 */
export const NOME_CANONICO = /^(rev-(?:[a-z0-9]+-)*[a-z0-9]+)\.webp$/;

export class ArteInvalida extends Error {}

/**
 * Largura, altura e animação, percorrendo os chunks do contêiner RIFF.
 *
 * O export estático não tem otimizador de imagem, então as dimensões precisam ir explícitas no
 * `<img>` para não haver salto de layout — e lê-las aqui evita tanto uma dependência nova quanto um
 * manifesto que poderia dessincronizar dos arquivos.
 *
 * Percorrer os chunks, em vez de confiar em offsets fixos, é o que permite (a) achar o `VP8 `/`VP8L`
 * dentro de um `VP8X` e (b) detectar animação por `ANIM`/`ANMF` presentes, e não só pela flag —
 * arte animada escaparia da conferência humana nos quadros seguintes ao primeiro.
 */
export function lerWebp(buf: Buffer): { width: number; height: number; animado: boolean } {
  if (buf.length < 12 || buf.toString("ascii", 0, 4) !== "RIFF" || buf.toString("ascii", 8, 12) !== "WEBP") {
    throw new ArteInvalida("não é um contêiner WebP (RIFF/WEBP ausente)");
  }
  const declarado = buf.readUInt32LE(4) + 8;
  const fim = Math.min(declarado, buf.length);
  if (declarado > buf.length) throw new ArteInvalida("tamanho RIFF maior que o arquivo");

  let dimensoes: { width: number; height: number } | undefined;
  let animado = false;

  let pos = 12;
  while (pos + 8 <= fim) {
    const tipo = buf.toString("ascii", pos, pos + 4);
    const tamanho = buf.readUInt32LE(pos + 4);
    const corpo = pos + 8;
    if (corpo + tamanho > fim) throw new ArteInvalida(`chunk ${tipo} ultrapassa o fim do arquivo`);

    if (tipo === "ANIM" || tipo === "ANMF") animado = true;
    if (tipo === "VP8X" && tamanho >= 10) {
      if ((buf.readUInt8(corpo) & 0x02) !== 0) animado = true;
      dimensoes ??= {
        width: buf.readUIntLE(corpo + 4, 3) + 1,
        height: buf.readUIntLE(corpo + 7, 3) + 1,
      };
    }
    if (tipo === "VP8 " && tamanho >= 10) {
      dimensoes = {
        width: buf.readUInt16LE(corpo + 6) & 0x3fff,
        height: buf.readUInt16LE(corpo + 8) & 0x3fff,
      };
    }
    if (tipo === "VP8L" && tamanho >= 5) {
      const bits = buf.readUInt32LE(corpo + 1);
      dimensoes = { width: (bits & 0x3fff) + 1, height: ((bits >>> 14) & 0x3fff) + 1 };
    }
    pos = corpo + tamanho + (tamanho % 2); // chunks têm padding para tamanho par
  }

  if (!dimensoes) throw new ArteInvalida("nenhum chunk de imagem (VP8/VP8L/VP8X) encontrado");
  if (dimensoes.width < 1 || dimensoes.height < 1) throw new ArteInvalida("dimensão inválida");
  return { ...dimensoes, animado };
}

export const LARGURA_MAXIMA = 1280;

/** `Revision.id` → arte publicável. Revisão sem arte é o estado normal, não lacuna. */
export function artesPorRevisao(): Map<string, Ilustracao> {
  const mapa = new Map<string, Ilustracao>();
  if (!fs.existsSync(DIR)) return mapa;
  for (const arquivo of fs.readdirSync(DIR).sort()) {
    const achado = NOME_CANONICO.exec(arquivo);
    if (!achado) continue;
    const { width, height } = lerWebp(fs.readFileSync(path.join(DIR, arquivo)));
    mapa.set(achado[1], { src: `/social/${arquivo}`, width, height });
  }
  return mapa;
}
