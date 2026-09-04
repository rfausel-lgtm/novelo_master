/**
 * Imagem de compartilhamento (WhatsApp, X, LinkedIn). Gerada no build a partir do grafo real: o
 * desenho ao fundo é o próprio novelo, com as coordenadas do layout e as cores de família, não uma
 * ilustração genérica. Pensada para ler em miniatura — no WhatsApp o card sai com ~330px de largura,
 * então o que precisa sobreviver é a manchete.
 */
import { ImageResponse } from "next/og";
import graph from "../../public/data/graph.json";
import { stats } from "@/lib/data";

export const dynamic = "force-static";
export const alt = "O Novelo Master: mapa público de relações do caso Banco Master";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const COR_FAMILIA: Record<string, string> = {
  institutional: "#4c8dff",
  financial: "#4dbf91",
  political: "#e69b45",
  social: "#a77bf3",
  professional: "#9aa4b1",
  corporate: "#3ec9c9",
  allegation: "#c9a04c",
};

const COR_NO: Record<string, string> = {
  person: "#f4f6f8",
  company: "#4c8dff",
  party: "#e69b45",
  public_body: "#7fa9ff",
  financial_institution: "#4dbf91",
  organization_other: "#4c8dff",
  event: "#c9a04c",
  public_act: "#bfa6e8",
  transaction: "#4dbf91",
  document: "#b8c2cf",
  source: "#79b8ff",
  claim: "#e69b45",
  evidence: "#d7c67a",
};

interface No {
  id: string;
  x: number;
  y: number;
  size: number;
  category: string;
}
interface Aresta {
  source: string;
  target: string;
  family: string;
}

/** SVG do grafo real, normalizado para a caixa da imagem. Vai como data URI num <img>. */
function redeSvg(largura: number, altura: number, centroX: number): string {
  const nos = (graph.nodes as No[]).filter((n) => Number.isFinite(n.x) && Number.isFinite(n.y));
  const xs = nos.map((n) => n.x);
  const ys = nos.map((n) => n.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  /* Escala isotrópica: o mapa não pode aparecer esticado. */
  const escala = Math.min(largura / (maxX - minX), altura / (maxY - minY)) * 0.86;
  const deslocX = centroX - ((minX + maxX) / 2) * escala;
  const deslocY = (altura - (maxY - minY) * escala) / 2 - minY * escala;
  const px = (n: No) => n.x * escala + deslocX;
  const py = (n: No) => n.y * escala + deslocY;

  const porId = new Map(nos.map((n) => [n.id, n]));
  const arestas = (graph.edges as Aresta[])
    .map((e) => ({ a: porId.get(e.source), b: porId.get(e.target), f: e.family }))
    .filter((e): e is { a: No; b: No; f: string } => !!e.a && !!e.b);

  const linhas = arestas
    .map(
      (e) =>
        `<line x1="${px(e.a).toFixed(1)}" y1="${py(e.a).toFixed(1)}" x2="${px(e.b).toFixed(1)}" y2="${py(e.b).toFixed(1)}" stroke="${COR_FAMILIA[e.f] ?? "#9aa4b1"}" stroke-width="1.1" stroke-opacity="0.5"/>`,
    )
    .join("");

  const circulos = nos
    .map((n) => {
      const r = Math.max(2.4, Math.min(13, (n.size ?? 4) * 1.15));
      return `<circle cx="${px(n).toFixed(1)}" cy="${py(n).toFixed(1)}" r="${r.toFixed(1)}" fill="${COR_NO[n.category] ?? "#f4f6f8"}"/>`;
    })
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${largura}" height="${altura}" viewBox="0 0 ${largura} ${altura}"><rect width="${largura}" height="${altura}" fill="#090c11"/>${linhas}${circulos}</svg>`;
}

export default function Image() {
  const n = (v: number) => v.toLocaleString("pt-BR");
  const rede = `data:image/svg+xml;base64,${Buffer.from(redeSvg(size.width, size.height, size.width * 0.72)).toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          background: "#090c11",
          fontFamily: "sans-serif",
        }}
      >
        {/*
          O mapa de verdade, ocupando a imagem inteira. As regras de <img> do Next não se aplicam
          aqui: o satori rasteriza para PNG, não existe DOM nem next/image.
        */}
        {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
        <img src={rede} width={size.width} height={size.height} style={{ position: "absolute" }} />

        {/* Véu à esquerda: sem ele a manchete disputa com as arestas e some na miniatura. */}
        <div
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
            display: "flex",
            background:
              "linear-gradient(100deg, #090c11 0%, #090c11 42%, rgba(9,12,17,0.90) 56%, rgba(9,12,17,0.30) 78%, rgba(9,12,17,0.05) 100%)",
          }}
        />

        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: 780,
            height: "100%",
            padding: "58px 0 52px 68px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ display: "flex", width: 12, height: 12, borderRadius: 6, background: "#4c8dff" }} />
            <div
              style={{
                display: "flex",
                fontSize: 24,
                letterSpacing: 7,
                color: "#aab3bf",
                textTransform: "uppercase",
              }}
            >
              O Novelo Master
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            {/* nowrap por linha: satori quebraria no meio da frase e a manchete perderia o ritmo. */}
            <div style={{ display: "flex", fontSize: 74, fontWeight: 700, color: "#f4f6f8", lineHeight: 1.06, whiteSpace: "nowrap" }}>
              Quem se conecta
            </div>
            <div style={{ display: "flex", fontSize: 74, fontWeight: 700, color: "#f4f6f8", lineHeight: 1.06, whiteSpace: "nowrap" }}>
              a quem no caso
            </div>
            <div style={{ display: "flex", fontSize: 74, fontWeight: 700, color: "#4c8dff", lineHeight: 1.06, whiteSpace: "nowrap" }}>
              Banco Master
            </div>
            <div style={{ display: "flex", fontSize: 27, color: "#aab3bf", marginTop: 24, whiteSpace: "nowrap" }}>
              Cada conexão aponta para a fonte que a sustenta.
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 21 }}>
            <div style={{ display: "flex", color: "#f4f6f8", fontWeight: 600 }}>
              {n(graph.nodes.length)} nós · {n(graph.edges.length)} conexões
            </div>
            <div style={{ display: "flex", color: "#7b8592" }}>·</div>
            <div style={{ display: "flex", color: "#aab3bf" }}>
              {n(stats.official_sources)} fontes oficiais
            </div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
