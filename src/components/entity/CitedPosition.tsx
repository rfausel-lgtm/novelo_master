import type { CitedPosition } from "@/lib/schema";
import { CITED_POSITION_LABEL } from "@/lib/schema";
import { formatPartialDate } from "@/lib/format";
import { entityHref, entityName, getSource } from "@/lib/data";
import Link from "next/link";

/** Bloco "Posição do citado" / "Posição dos envolvidos": nunca omitido, mesmo vazio. */
export function CitedPositionBlock({ positions, title = "Posição do citado" }: { positions: CitedPosition[]; title?: string }) {
  if (positions.length === 0) {
    return <p className="text-fg-3 text-sm italic">Posição não localizada no corpus até a última atualização.</p>;
  }
  return (
    <ul className="space-y-3 text-sm" aria-label={title}>
      {positions.map((p, i) => (
        <li key={i} className="border-border bg-bg-2/60 rounded border p-3">
          <div className="text-fg-3 mb-1 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-fg-2 font-medium">{CITED_POSITION_LABEL[p.kind]}</span>
            {(p.by_id || p.by) && (
              <span>
                por{" "}
                {p.by_id ? (
                  <Link href={entityHref(p.by_id)} className="text-fg hover:text-accent underline-offset-2 hover:underline">
                    {entityName(p.by_id)}
                  </Link>
                ) : (
                  p.by
                )}
              </span>
            )}
            {p.date && <span>· {formatPartialDate(p.date)}</span>}
          </div>
          <p className="text-fg-2">{p.summary}</p>
          {p.source_ids.length > 0 && (
            <p className="text-fg-3 mt-1 text-xs">
              Fontes:{" "}
              {p.source_ids.map((id, j) => {
                const s = getSource(id);
                return (
                  <span key={id}>
                    {j > 0 && ", "}
                    <Link href={`/fontes/${id}`} className="hover:text-accent underline-offset-2 hover:underline">
                      {s?.publisher ?? id}
                    </Link>
                  </span>
                );
              })}
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}

export function OpenQuestions({ questions }: { questions: string[] }) {
  if (questions.length === 0) return <p className="text-fg-3 text-sm italic">Nenhuma lacuna registrada pela equipe editorial.</p>;
  return (
    <ul className="text-fg-2 list-disc space-y-1 pl-5 text-sm">
      {questions.map((q, i) => (
        <li key={i}>{q}</li>
      ))}
    </ul>
  );
}
