/**
 * Card de lote: a arte padrão, gerada do próprio acervo.
 *
 * Não há modelo de imagem aqui. O card é tipografia sobre um emaranhado de nós e arestas — o
 * novelo que dá nome ao site — desenhado a partir de uma semente derivada do `Revision.id`. Mesmo
 * id, mesmo desenho, sempre: a arte é função do dado, não de uma execução que pode não se repetir.
 *
 * Por que isto existe. A ilustração do Codex depende de uma automação local que varre a cada dez
 * minutos, de um `gh` que responde 401 no ambiente isolado dela e de um workflow para chegar à
 * `main`. Cada elo já falhou. O card não tem elo nenhum: nasce do YAML da revisão em segundos, no
 * mesmo push que publica o lote, e vale para 100% das revisões. A ilustração continua possível e
 * passa a ser melhoria opcional — mesmo nome de arquivo, ela sobrescreve o card.
 *
 * E o card não afirma nada sobre o mundo: repete o título que o acervo já aprovou. A ressalva
 * "ilustração gerada por IA" existe porque a arte do Codex é uma CENA; aqui não há cena.
 *
 * Este módulo é puro de propósito — geometria e texto saem daqui, o navegador só desenha. É o que
 * torna o determinismo testável sem abrir Chromium.
 */

export const LARGURA = 1280;
export const ALTURA = 720;

/** Cores das famílias de relação do site (globals.css), para o emaranhado falar a mesma língua. */
const CORES = ["#4c8dff", "#4dbf91", "#e69b45", "#a77bf3", "#3ec9c9", "#c9a04c"] as const;

const MESES = [
  "JAN",
  "FEV",
  "MAR",
  "ABR",
  "MAI",
  "JUN",
  "JUL",
  "AGO",
  "SET",
  "OUT",
  "NOV",
  "DEZ",
] as const;

/**
 * Gerador determinístico: FNV-1a para a semente, xorshift32 para a sequência.
 *
 * `Math.random()` daria um card diferente a cada execução, e aí o arquivo no repositório deixaria de
 * ser reproduzível a partir do id — regerar viraria um diff gratuito em toda revisão.
 */
export function geradorDe(semente: string): () => number {
  let h = 2166136261;
  for (let i = 0; i < semente.length; i++) {
    h ^= semente.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  // xorshift32 não pode partir de zero, que é ponto fixo dele.
  let estado = h >>> 0 || 1;
  return () => {
    estado ^= estado << 13;
    estado ^= estado >>> 17;
    estado ^= estado << 5;
    estado >>>= 0;
    return estado / 4294967296;
  };
}

export type No = { x: number; y: number; r: number; destaque: boolean };
export type Aresta = {
  ax: number;
  ay: number;
  cx: number;
  cy: number;
  bx: number;
  by: number;
  cor: string;
  opacidade: number;
  largura: number;
};
export type Desenho = { nos: No[]; arestas: Aresta[] };

/**
 * O emaranhado, à direita do quadro. O texto ocupa a esquerda, então o miolo do novelo fica em x≈960
 * e o véu do template escurece o que passa para o lado do título.
 */
export function desenhoDe(revisionId: string): Desenho {
  const rnd = geradorDe(revisionId);
  const CX = 960;
  const CY = 360;

  const nos: No[] = [];
  for (let i = 0; i < 78; i++) {
    const ang = rnd() * Math.PI * 2;
    // Expoente < 1 adensa o centro: distribuição uniforme em raio deixaria o miolo vazio.
    const raio = 40 + Math.pow(rnd(), 0.62) * 330;
    nos.push({
      x: CX + Math.cos(ang) * raio * 1.18,
      y: CY + Math.sin(ang) * raio * 0.92,
      r: 1.6 + rnd() * 3.4,
      destaque: rnd() > 0.78,
    });
  }

  const arestas: Aresta[] = [];
  for (let i = 0; i < 165; i++) {
    const a = nos[Math.floor(rnd() * nos.length)];
    const b = nos[Math.floor(rnd() * nos.length)];
    if (a === b) continue;
    arestas.push({
      ax: a.x,
      ay: a.y,
      // O ponto de controle fora do eixo é o que faz a linha virar fio enrolado, e não teia.
      cx: (a.x + b.x) / 2 + (rnd() - 0.5) * 190,
      cy: (a.y + b.y) / 2 + (rnd() - 0.5) * 190,
      bx: b.x,
      by: b.y,
      cor: CORES[Math.floor(rnd() * CORES.length)],
      opacidade: 0.1 + rnd() * 0.22,
      largura: 0.7 + rnd() * 1.5,
    });
  }

  return { nos, arestas };
}

/** `2026-09-11` → `11 SET 2026`. Data parcial (`2026-09`, `2026`) cai para o que houver. */
export function dataExtensa(data: string): string {
  const [ano, mes, dia] = data.split("-");
  if (dia && mes) return `${dia} ${MESES[Number(mes) - 1] ?? ""} ${ano}`.trim();
  if (mes) return `${MESES[Number(mes) - 1] ?? ""} ${ano}`.trim();
  return ano ?? "";
}

/** Lote com sufixo de letra incluído: `75b` não é o lote 75. */
export function loteDe(revisionId: string): string | null {
  const achado = /-lote-(\d+[a-z]?)(?:-|$)/.exec(revisionId);
  return achado ? achado[1] : null;
}

/**
 * `title` é opcional no schema de revisão: 17 das 241 revisões do acervo não têm um. Aí a manchete
 * sai da primeira frase do `summary`, que nessas revisões é justamente a linha de abertura do lote.
 * O corte é na primeira pontuação final seguida de espaço, e não no primeiro ponto: número de
 * processo e data abreviada estão cheios de pontos que não terminam frase.
 */
export function mancheteDoResumo(resumo: string): string {
  const normalizado = resumo.replace(/\s+/g, " ").trim();
  const fim = /[.!?](?=\s[A-ZÁÂÃÀÉÊÍÓÔÕÚÇ])/.exec(normalizado);
  const frase = fim ? normalizado.slice(0, fim.index) : normalizado;
  return frase.length > 150 ? `${frase.slice(0, 147).trimEnd()}…` : frase;
}

/** `Lote 216 — `, `Lote 216: `, `Lote 75b - ` — as três formas que o acervo usa. */
const PREFIXO_DE_LOTE = /^(lote\s+\d+[a-z]?)\s*(?:—|–|-|:)\s*/i;

/**
 * Reparte o título editorial em sobrelinha e manchete.
 *
 * Os títulos do acervo vêm como `Lote 216 — não foi habeas corpus: ...`. Repetir "Lote 216" na
 * manchete depois de já o anunciar na sobrelinha gasta a maior tipografia do card com o que a linha
 * de cima já disse. Título sem esse prefixo (os saneamentos, por exemplo) vai inteiro para a
 * manchete, e a sobrelinha se vira com o lote do id.
 */
export function repartirTitulo(
  titulo: string,
  revisionId: string,
  data: string,
): { eyebrow: string; manchete: string } {
  const achado = PREFIXO_DE_LOTE.exec(titulo);
  const manchete = (achado ? titulo.slice(achado[0].length) : titulo).trim();
  const lote = loteDe(revisionId);
  const rotuloDoLote = achado
    ? achado[1].replace(/\s+/, " ").toUpperCase()
    : lote
      ? `LOTE ${lote}`
      : "";
  const quando = dataExtensa(data);

  return {
    eyebrow: [rotuloDoLote, quando].filter(Boolean).join(" · "),
    manchete,
  };
}

const escapar = (texto: string): string =>
  texto.replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );

/**
 * Corpo do título em função do comprimento: manchete longa em 62 px estouraria os três terços de
 * altura reservados a ela e empurraria a régua para fora do quadro.
 */
export function corpoDoTitulo(manchete: string): number {
  if (manchete.length <= 52) return 62;
  if (manchete.length <= 84) return 54;
  if (manchete.length <= 120) return 46;
  return 40;
}

/**
 * A página que o Chromium desenha. Recebe a geometria pronta: nada de aleatório roda no navegador,
 * então o mesmo id produz o mesmo pixel em qualquer máquina.
 */
export function htmlDoCard(params: {
  eyebrow: string;
  manchete: string;
  desenho: Desenho;
}): string {
  const { eyebrow, manchete, desenho } = params;
  return `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;600&display=swap" rel="stylesheet">
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  html,body{width:${LARGURA}px;height:${ALTURA}px;overflow:hidden}
  body{background:#090c11;font-family:"IBM Plex Sans",system-ui,sans-serif;position:relative}
  canvas{position:absolute;inset:0}
  .veu{position:absolute;inset:0;background:linear-gradient(100deg,#090c11 0%,#090c11 40%,rgba(9,12,17,.86) 60%,rgba(9,12,17,.35) 100%)}
  .quadro{position:absolute;inset:0;padding:72px 80px;display:flex;flex-direction:column;justify-content:center;gap:26px}
  .eyebrow{font-family:"IBM Plex Mono",ui-monospace,monospace;font-size:20px;letter-spacing:.28em;text-transform:uppercase;color:#4c8dff}
  .titulo{font-size:${corpoDoTitulo(manchete)}px;line-height:1.12;font-weight:600;color:#f4f6f8;letter-spacing:-.02em;max-width:790px;text-wrap:balance}
  .regua{width:104px;height:3px;background:#4c8dff}
  .rodape{position:absolute;left:80px;bottom:64px;display:flex;align-items:baseline;gap:16px}
  .marca{font-family:"IBM Plex Mono",ui-monospace,monospace;font-size:21px;font-weight:500;letter-spacing:.22em;text-transform:uppercase;color:#f4f6f8}
  .dominio{font-family:"IBM Plex Mono",ui-monospace,monospace;font-size:15px;color:#848e9b;letter-spacing:.06em}
</style></head><body>
<canvas id="c" width="${LARGURA}" height="${ALTURA}"></canvas>
<div class="veu"></div>
<div class="quadro">
  <p class="eyebrow">${escapar(eyebrow)}</p>
  <h1 class="titulo">${escapar(manchete)}</h1>
  <div class="regua"></div>
</div>
<div class="rodape">
  <span class="marca">O Novelo Master</span>
  <span class="dominio">acervo investigativo · novelo-master.fausel.adv.br</span>
</div>
<script>
const d = ${JSON.stringify(desenho)};
const g = document.getElementById("c").getContext("2d");
g.lineCap = "round";
for (const a of d.arestas) {
  g.beginPath(); g.moveTo(a.ax, a.ay); g.quadraticCurveTo(a.cx, a.cy, a.bx, a.by);
  g.strokeStyle = a.cor; g.globalAlpha = a.opacidade; g.lineWidth = a.largura; g.stroke();
}
for (const n of d.nos) {
  g.beginPath(); g.arc(n.x, n.y, n.r, 0, Math.PI * 2);
  g.fillStyle = n.destaque ? "#4c8dff" : "#c6d0dc"; g.globalAlpha = 0.55; g.fill();
}
</script></body></html>`;
}
