import Link from "next/link";
import type { Relationship } from "@/lib/schema";
import { RELATIONSHIP_FAMILY, RELATIONSHIP_FAMILY_LABEL, RELATIONSHIP_TYPE_LABEL } from "@/lib/schema";
import { entityHref, entityName, getEvidence } from "@/lib/data";
import { sourcesByIds } from "@/lib/pages";
import { formatPartialDate } from "@/lib/format";
import { EvidenceBadge, StatusBadge, Pill } from "./badges";
import { SourceList } from "./SourceList";
import { CitedPositionBlock } from "./CitedPosition";

const FAMILY_COLOR: Record<string, string> = {
  institutional: "var(--rel-institutional)",
  financial: "var(--rel-financial)",
  political: "var(--rel-political)",
  social: "var(--rel-social)",
  professional: "var(--rel-professional)",
  corporate: "var(--rel-corporate)",
  allegation: "var(--rel-allegation)",
};

/** Card de relação com a ordem obrigatória: por quê / fontes / força / posição. */
export function RelationshipCard({ rel, perspectiveId, open = false }: { rel: Relationship; perspectiveId?: string; open?: boolean }) {
  const otherId = perspectiveId ? (rel.from_id === perspectiveId ? rel.to_id : rel.from_id) : null;
  const family = RELATIONSHIP_FAMILY[rel.relationship_type];
  const sourceIds = new Set(rel.source_ids);
  rel.evidence_ids.forEach((id) => getEvidence(id)?.source_ids.forEach((s) => sourceIds.add(s)));
  const sources = sourcesByIds([...sourceIds]);
  const evidences = rel.evidence_ids.map(getEvidence).filter((e): e is NonNullable<typeof e> => !!e);

  return (
    <details open={open} className="border-border bg-bg-2/50 group/rel rounded-md border">
      <summary className="flex cursor-pointer flex-wrap items-center gap-2 px-3 py-2 text-sm">
        {/* Sem marcador, o conteúdo mais valioso do dossiê ficava atrás de um clique sem pista. */}
        <span aria-hidden="true" className="text-fg-3 shrink-0 transition-transform group-open/rel:rotate-90">
          ›
        </span>
        <span aria-hidden="true" className="h-2 w-2 rounded-full" style={{ background: FAMILY_COLOR[family] }} />
        {otherId ? (
          <Link href={entityHref(otherId)} className="text-fg hover:text-accent font-medium underline-offset-2 hover:underline">
            {entityName(otherId)}
          </Link>
        ) : (
          <span className="text-fg font-medium">
            <Link href={entityHref(rel.from_id)} className="hover:text-accent">
              {entityName(rel.from_id)}
            </Link>{" "}
            {rel.directed ? "→" : "↔"}{" "}
            <Link href={entityHref(rel.to_id)} className="hover:text-accent">
              {entityName(rel.to_id)}
            </Link>
          </span>
        )}
        <span className="text-fg-2">· {rel.label}</span>
        <EvidenceBadge cls={rel.evidence_class} />
        <StatusBadge status={rel.status} />
        {rel.start_date && <span className="text-fg-3 text-xs">desde {formatPartialDate(rel.start_date)}</span>}
      </summary>
      <div className="border-border space-y-4 border-t px-3 py-3 text-sm">
        <div className="text-fg-3 flex flex-wrap gap-2 text-xs">
          <Pill color={FAMILY_COLOR[family]}>{RELATIONSHIP_FAMILY_LABEL[family]}</Pill>
          <Pill>{RELATIONSHIP_TYPE_LABEL[rel.relationship_type]}</Pill>
          {/*
            O mesmo campo aparecia como "0,8" aqui e "75%" no card do grafo, sem escala declarada
            em lugar nenhum. Um formato só, e o title diz o que o número é e o que não é.
          */}
          <Pill title="Confiança do revisor no registro desta relação, de 0 a 100%. Não é probabilidade nem medida estatística; a força probatória está na classe de evidência.">
            confiança {Math.round(rel.confidence * 100)}%
          </Pill>
          {rel.via_id && (
            <Pill>
              via{" "}
              <Link href={entityHref(rel.via_id)} className="text-fg hover:text-accent">
                {entityName(rel.via_id)}
              </Link>
            </Pill>
          )}
          {rel.end_date && <Pill>até {formatPartialDate(rel.end_date)}</Pill>}
        </div>
        <div>
          <h4 className="text-fg-3 mb-1 text-[11px] font-semibold tracking-[0.14em] uppercase">Por que estes nós estão conectados?</h4>
          <p className="text-fg-2">{rel.description}</p>
          {rel.event_ids.length > 0 && (
            <p className="text-fg-3 mt-1 text-xs">
              Eventos:{" "}
              {rel.event_ids.map((id, i) => (
                <span key={id}>
                  {i > 0 && ", "}
                  <Link href={`/eventos/${id}`} className="hover:text-accent underline-offset-2 hover:underline">
                    {entityName(id)}
                  </Link>
                </span>
              ))}
            </p>
          )}
        </div>
        <div>
          <h4 className="text-fg-3 mb-1 text-[11px] font-semibold tracking-[0.14em] uppercase">Fontes</h4>
          <SourceList sources={sources} emptyText="Sem fonte direta (inferência a partir dos eventos ligados)." />
        </div>
        <div>
          <h4 className="text-fg-3 mb-1 text-[11px] font-semibold tracking-[0.14em] uppercase">Força da evidência</h4>
          <EvidenceBadge cls={rel.evidence_class} explain />
          {evidences.length > 0 && (
            <ul className="mt-2 space-y-1">
              {evidences.map((e) => (
                <li key={e.id} className="text-fg-2 flex flex-wrap items-start gap-2 text-xs">
                  <EvidenceBadge cls={e.classification} />
                  <span>{e.proposition}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <h4 className="text-fg-3 mb-1 text-[11px] font-semibold tracking-[0.14em] uppercase">Posição dos envolvidos</h4>
          <CitedPositionBlock positions={rel.cited_position} title="Posição dos envolvidos" />
        </div>
      </div>
    </details>
  );
}
