import Link from "next/link";
import type { Person, Organization } from "@/lib/schema";
import { PERSON_CATEGORY_LABEL, ORG_TYPE_LABEL } from "@/lib/schema";
import { relationshipsOf, sourcesOf } from "@/lib/data";
import { officialCount } from "@/lib/pages";
import { Avatar } from "./EntityHeader";
import { Pill } from "./badges";
import { FiltroIndice } from "./FiltroIndice";

/** Índice de pessoas ou organizações, agrupado por categoria. */
export function AgentIndex({ entities, basePath }: { entities: (Person | Organization)[]; basePath: string }) {
  const groups = new Map<string, (Person | Organization)[]>();
  for (const e of entities) {
    const g = e.kind === "person" ? PERSON_CATEGORY_LABEL[e.category] : ORG_TYPE_LABEL[e.org_type];
    groups.set(g, [...(groups.get(g) ?? []), e]);
  }
  const ordered = [...groups.entries()].sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0], "pt-BR"));
  if (entities.length === 0) return <p className="text-fg-3 text-sm italic">Nenhum registro publicado ainda.</p>;
  const idLista = `indice-${basePath.replace(/\W+/g, "")}`;
  return (
    <div>
      <FiltroIndice alvo={idLista} rotulo="Filtrar por nome" />
      <div id={idLista} className="space-y-8">
      <nav aria-label="Categorias" className="flex flex-wrap gap-2 text-xs">
        {ordered.map(([g, list]) => (
          <a key={g} href={`#cat-${g.replace(/\W+/g, "-").toLowerCase()}`} className="border-border text-fg-2 hover:text-fg rounded border px-2 py-1">
            {g} <span className="text-fg-3 font-mono">{list.length}</span>
          </a>
        ))}
      </nav>
      {ordered.map(([g, list]) => (
        <section key={g} data-categoria={g} id={`cat-${g.replace(/\W+/g, "-").toLowerCase()}`} aria-labelledby={`h-${g}`}>
          <h2 id={`h-${g}`} className="text-fg mb-3 text-lg font-semibold tracking-tight">
            {g}{" "}
            <span data-contador className="text-fg-3 font-mono text-xs font-normal">
              {list.length}
            </span>
          </h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {list.map((e) => {
              const rels = relationshipsOf(e.id).length;
              const official = officialCount(sourcesOf(e.id));
              return (
                <li key={e.id} data-nome={e.name} className="border-border bg-bg-2/50 hover:border-fg-3 flex gap-3 rounded-md border p-3 transition-colors">
                  <Avatar entity={e} size={44} />
                  <div className="min-w-0 flex-1">
                    <Link href={`${basePath}/${e.id}`} className="text-fg hover:text-accent font-medium underline-offset-2 hover:underline">
                      {e.name}
                    </Link>
                    {e.kind === "person" && <p className="text-fg-3 truncate text-xs">{e.role}</p>}
                    <p className="text-fg-2 mt-1 line-clamp-2 text-xs">{e.why_in_novelo}</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <Pill>{rels} conexões</Pill>
                      <Pill>{official} fontes oficiais</Pill>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
      </div>
    </div>
  );
}
