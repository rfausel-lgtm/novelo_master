import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";
import {
  allDocuments,
  allEvents,
  allOrganizations,
  allPeople,
  allPublicActs,
  allSources,
  allRevisions,
  corpus,
} from "@/lib/data";
import { totalDePaginas } from "@/lib/atualizacoes";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = SITE.url.replace(/\/$/, "");
  const built = new Date(corpus.built_at);
  const fixed = [
    "",
    "/grafo",
    "/cronologia",
    "/coincidencias",
    "/pessoas",
    "/organizacoes",
    "/eventos",
    "/atos",
    "/documentos",
    "/fontes",
    "/atualizacoes",
    "/metodologia",
    "/politica-editorial",
    "/sobre",
    "/imprensa",
    "/perguntar",
    "/rede",
  ];
  const entries: MetadataRoute.Sitemap = fixed.map((p) => ({
    url: `${base}${p}/`,
    lastModified: built,
    changeFrequency: "weekly",
    priority: p === "" ? 1 : 0.7,
  }));
  const add = (prefix: string, items: { id: string; updated_at?: string }[]) =>
    items.forEach((i) =>
      entries.push({
        url: `${base}${prefix}/${i.id}/`,
        lastModified: i.updated_at ? new Date(i.updated_at) : built,
        changeFrequency: "weekly",
        priority: 0.6,
      }),
    );
  add("/pessoas", allPeople());
  add("/organizacoes", allOrganizations());
  add("/eventos", allEvents());
  add("/atos", allPublicActs());
  add("/documentos", allDocuments());
  add("/fontes", allSources());
  // As páginas 2..N de /atualizacoes: sem isso, o buscador só conhece as dez últimas revisões.
  for (let p = 2; p <= totalDePaginas(allRevisions().length); p++) {
    entries.push({
      url: `${base}/atualizacoes/pagina/${p}/`,
      lastModified: built,
      changeFrequency: "weekly",
      priority: 0.4,
    });
  }
  return entries;
}
