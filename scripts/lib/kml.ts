/**
 * KML do corpus: um Placemark por lugar geolocalizado. Serve a quem quer abrir o caso inteiro no
 * Google Earth ou no QGIS, em vez de um lugar por vez pelo link do dossiê.
 *
 * Formato KML e não KMZ de propósito: KMZ é apenas o KML zipado, abre nos mesmos programas, e o
 * texto puro pode ser lido, versionado e conferido linha a linha — que é a premissa do projeto.
 */
import type { Corpus } from "@/lib/schema";
import { PLACE_KIND_LABEL, PLACE_PRECISION_LABEL } from "@/lib/schema";
import { SITE } from "@/lib/site";

function escapar(texto: string): string {
  return texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function construirKml(corpus: Corpus): { texto: string; lugares: number } {
  const base = SITE.url.replace(/\/$/, "");

  const entradas = [
    ...corpus.events
      .filter((e) => e.review_status === "published" && e.place)
      .map((e) => ({ place: e.place!, titulo: e.title, url: `${base}/eventos/${e.id}/`, quando: e.date })),
    ...corpus.organizations
      .filter((o) => o.review_status === "published" && o.place)
      .map((o) => ({ place: o.place!, titulo: o.name, url: `${base}/organizacoes/${o.id}/`, quando: undefined })),
  ];

  const marcadores = entradas
    .map(({ place, titulo, url, quando }) => {
      const descricao = [
        place.name,
        `${PLACE_KIND_LABEL[place.kind]} · ${PLACE_PRECISION_LABEL[place.precision]}`,
        place.note ?? "",
        quando ? `Data: ${quando}` : "",
        `Registro: ${url}`,
      ]
        .filter(Boolean)
        .join("\n");
      return [
        "    <Placemark>",
        `      <name>${escapar(titulo)}</name>`,
        `      <description>${escapar(descricao)}</description>`,
        `      <Point><coordinates>${place.lon},${place.lat},0</coordinates></Point>`,
        "    </Placemark>",
      ].join("\n");
    })
    .join("\n");

  const texto = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<kml xmlns="http://www.opengis.net/kml/2.2">',
    "  <Document>",
    `    <name>${escapar(SITE.name)}</name>`,
    `    <description>${escapar(`Lugares geolocalizados do corpus. Cada marcador aponta para o registro que o sustenta em ${base}.`)}</description>`,
    marcadores,
    "  </Document>",
    "</kml>",
    "",
  ]
    .filter((l) => l !== "")
    .join("\n");

  return { texto, lugares: entradas.length };
}
