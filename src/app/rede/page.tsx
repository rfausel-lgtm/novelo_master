import type { Metadata } from "next";
import Link from "next/link";
import { allOrganizations, allPeople, allRelationships, entityHref, entityName, relationshipsOf } from "@/lib/data";
import { pageMetadata } from "@/lib/pages";
import { RELATIONSHIP_TYPE_LABEL, PERSON_CATEGORY_LABEL, ORG_TYPE_LABEL } from "@/lib/labels";
import { formatPartialDate } from "@/lib/format";
import { PageShell, PageTitle } from "@/components/entity/PageShell";
import { Section } from "@/components/entity/Section";
import { EvidenceBadge, StatusBadge } from "@/components/entity/badges";

export const metadata: Metadata = pageMetadata({
  title: "Rede em tabela",
  description: "Alternativa textual e acessível ao grafo: todos os nós e todas as relações do corpus em tabelas.",
  path: "/rede",
});

export default function RedePage() {
  const rels = [...allRelationships()].sort((a, b) => entityName(a.from_id).localeCompare(entityName(b.from_id), "pt-BR"));
  const nodes = [
    ...allPeople().map((p) => ({ id: p.id, name: p.name, kind: "Pessoa", sub: PERSON_CATEGORY_LABEL[p.category] })),
    ...allOrganizations().map((o) => ({ id: o.id, name: o.name, kind: "Organização", sub: ORG_TYPE_LABEL[o.org_type] })),
  ];
  return (
    <PageShell>
      <PageTitle eyebrow="Acessibilidade" title="Rede em tabela" lede="Alternativa textual ao grafo. As mesmas pessoas, organizações e relações, em tabelas navegáveis por teclado e leitores de tela." />
      <Section id="relacoes" title="Relações" count={rels.length}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">Relações do corpus</caption>
            <thead className="text-fg-3 text-xs uppercase">
              <tr className="border-border border-b">
                <th scope="col" className="py-2 pr-3">De</th>
                <th scope="col" className="py-2 pr-3">Para</th>
                <th scope="col" className="py-2 pr-3">Tipo</th>
                <th scope="col" className="py-2 pr-3">Rótulo</th>
                <th scope="col" className="py-2 pr-3">Evidência</th>
                <th scope="col" className="py-2 pr-3">Status</th>
                <th scope="col" className="py-2 pr-3">Desde</th>
                <th scope="col" className="py-2">Fontes</th>
              </tr>
            </thead>
            <tbody className="divide-border divide-y">
              {rels.map((r) => (
                <tr key={r.id}>
                  <td className="py-2 pr-3">
                    <Link href={entityHref(r.from_id)} className="text-fg hover:text-accent">
                      {entityName(r.from_id)}
                    </Link>
                  </td>
                  <td className="py-2 pr-3">
                    <Link href={entityHref(r.to_id)} className="text-fg hover:text-accent">
                      {entityName(r.to_id)}
                    </Link>
                  </td>
                  <td className="text-fg-2 py-2 pr-3 text-xs">{RELATIONSHIP_TYPE_LABEL[r.relationship_type]}</td>
                  <td className="text-fg-2 py-2 pr-3 text-xs">{r.label}</td>
                  <td className="py-2 pr-3">
                    <EvidenceBadge cls={r.evidence_class} />
                  </td>
                  <td className="py-2 pr-3">
                    <StatusBadge status={r.status} />
                  </td>
                  <td className="text-fg-3 py-2 pr-3 font-mono text-xs whitespace-nowrap">{r.start_date ? formatPartialDate(r.start_date) : ""}</td>
                  <td className="text-fg-3 py-2 text-xs tabular-nums">{r.source_ids.length + r.evidence_ids.length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
      <Section id="nos" title="Nós" count={nodes.length}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">Pessoas e organizações</caption>
            <thead className="text-fg-3 text-xs uppercase">
              <tr className="border-border border-b">
                <th scope="col" className="py-2 pr-3">Nome</th>
                <th scope="col" className="py-2 pr-3">Tipo</th>
                <th scope="col" className="py-2 pr-3">Categoria</th>
                <th scope="col" className="py-2">Relações</th>
              </tr>
            </thead>
            <tbody className="divide-border divide-y">
              {nodes.map((n) => (
                <tr key={n.id}>
                  <td className="py-2 pr-3">
                    <Link href={entityHref(n.id)} className="text-fg hover:text-accent">
                      {n.name}
                    </Link>
                  </td>
                  <td className="text-fg-2 py-2 pr-3 text-xs">{n.kind}</td>
                  <td className="text-fg-2 py-2 pr-3 text-xs">{n.sub}</td>
                  <td className="text-fg-3 py-2 text-xs tabular-nums">{relationshipsOf(n.id).length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
    </PageShell>
  );
}
