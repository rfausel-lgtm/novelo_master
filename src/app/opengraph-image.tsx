/**
 * Imagem de compartilhamento (WhatsApp, X, LinkedIn). Gerada no build, então os números
 * vêm do corpus e envelhecem junto com ele.
 */
import { ImageResponse } from "next/og";
import { stats } from "@/lib/data";
import { SITE } from "@/lib/site";

export const dynamic = "force-static";
export const alt = "O Novelo Master: mapa público de relações do caso Banco Master";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const CATEGORIAS = [
  { cor: "#f4f6f8", rotulo: "pessoas" },
  { cor: "#4c8dff", rotulo: "empresas e órgãos" },
  { cor: "#4dbf91", rotulo: "instituições financeiras" },
  { cor: "#c9a04c", rotulo: "eventos" },
  { cor: "#bfa6e8", rotulo: "atos públicos" },
];

export default function Image() {
  const numero = (n: number) => n.toLocaleString("pt-BR");
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#090c11",
          color: "#f4f6f8",
          padding: "72px 72px 64px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          <div
            style={{
              display: "flex",
              fontSize: 26,
              letterSpacing: 8,
              color: "#aab3bf",
              textTransform: "uppercase",
            }}
          >
            O Novelo Master
          </div>
          {/* satori ignora <br>: cada linha precisa ser seu próprio bloco. */}
          <div style={{ display: "flex", flexDirection: "column", fontSize: 64, fontWeight: 600 }}>
            <div style={{ display: "flex" }}>Quem se conecta a quem</div>
            <div style={{ display: "flex", marginTop: 6 }}>no caso Banco Master</div>
          </div>
          <div style={{ display: "flex", fontSize: 28, color: "#aab3bf", maxWidth: 900 }}>
            Cada relação aponta para a fonte que a sustenta.
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
          <div style={{ display: "flex", gap: 26 }}>
            {CATEGORIAS.map((c) => (
              <div key={c.rotulo} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{ width: 18, height: 18, borderRadius: 9, background: c.cor, display: "flex" }}
                />
                <div style={{ display: "flex", fontSize: 20, color: "#aab3bf" }}>{c.rotulo}</div>
              </div>
            ))}
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
              borderTop: "1px solid #232b36",
              paddingTop: 26,
              fontSize: 24,
            }}
          >
            <div style={{ display: "flex", color: "#aab3bf" }}>
              {numero(stats.people)} pessoas · {numero(stats.organizations)} organizações ·{" "}
              {numero(stats.events)} eventos · {numero(stats.official_sources)} fontes oficiais
            </div>
            <div style={{ display: "flex", color: "#4c8dff" }}>
              {SITE.url.replace(/^https?:\/\//, "")}
            </div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
