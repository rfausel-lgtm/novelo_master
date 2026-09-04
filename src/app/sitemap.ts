import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";
import { allDocuments, allEvents, allOrganizations, allPeople, allPublicActs, allSources, corpus } from "@/lib/data";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = SITE.url.replace(/\/$/, "");
  const built = new Date(corpus.built_at);
  const fixed = ["", "/grafo", "/cronologia", "/coincidencias", "/pessoas", "/organizacoes", "/eventos", "/atos", "/documentos", "/fontes", "/atualizacoes", "/metodologia", "/politica-editorial", "/sobre", "/perguntar", "/rede"];
  const entries: MetadataRoute.Sitemap = fixed.map((p) => ({ url: `${base}${p}/`, lastModified: built, changeFrequency: "weekly", priority: p === "" ? 1 : 0.7 }));
  const add = (prefix: string, items: { id: string; updated_at?: string }[]) =>
    items.forEach((i) => entries.push({ url: `${base}${prefix}/${i.id}/`, lastModified: i.updated_at ? new Date(i.updated_at) : built, changeFrequency: "weekly", priority: 0.6 }));
  add("/pessoas", allPeople());
  add("/organizacoes", allOrganizations());
  add("/eventos", allEvents());
  add("/atos", allPublicActs());
  add("/documentos", allDocuments());
  add("/fontes", allSources());
  return entries;
}
