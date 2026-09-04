import Link from "next/link";
import type { Person, Organization } from "@/lib/schema";
import { PERSON_CATEGORY_LABEL, ORG_TYPE_LABEL } from "@/lib/schema";
import { initials } from "@/lib/format";
import { Pill } from "./badges";

export function Avatar({ entity, size = 64 }: { entity: Person | Organization; size?: number }) {
  /* Organização sem logo virava um quadrado cinza vazio, que se lê como imagem quebrada. */
  const label = initials(entity.name);
  const isOrg = entity.kind === "organization";
  if (entity.photo) {
    return (
      <figure className="shrink-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={entity.photo.path}
          alt={entity.photo.alt}
          width={size}
          height={size}
          className={`border-border border ${isOrg ? "bg-bg-2 rounded-md object-contain p-1" : "rounded-full object-cover"}`}
        />
        <figcaption className="text-fg-3 mt-1 max-w-[7rem] text-[10px] leading-tight sm:max-w-[12rem]">
          {entity.photo.author} · {entity.photo.license} ·{" "}
          <a href={entity.photo.original_url} rel="noopener noreferrer" className="underline">
            {entity.photo.source}
          </a>
        </figcaption>
      </figure>
    );
  }
  return (
    <div
      aria-hidden="true"
      className="border-border bg-bg-3 text-fg-2 flex shrink-0 items-center justify-center rounded-full border font-semibold"
      style={{ width: size, height: size, fontSize: size / 3 }}
    >
      {label}
    </div>
  );
}

export function EntityHeader({ entity, counts }: { entity: Person | Organization; counts: { label: string; value: number }[] }) {
  const subtype = entity.kind === "person" ? PERSON_CATEGORY_LABEL[entity.category] : ORG_TYPE_LABEL[entity.org_type];
  /*
   * No celular a coluna empurrava o nome para ~370px do topo, porque o crédito da foto (correto e
   * necessário) separava a imagem do título. Lado a lado abaixo de sm, com a foto menor.
   */
  return (
    <header className="mb-6 flex flex-row items-start gap-4 sm:gap-5">
      <div className="shrink-0">
        <Avatar entity={entity} size={72} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-fg-3 font-mono text-[11px] tracking-[0.2em] uppercase">{entity.kind === "person" ? "Pessoa" : "Organização"} · {subtype}</p>
        <h1 className="text-fg mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">{entity.name}</h1>
        {entity.full_name && entity.full_name !== entity.name && <p className="text-fg-2 text-sm">{entity.full_name}</p>}
        {entity.kind === "person" && <p className="text-fg-2 mt-1 text-sm">{entity.role}</p>}
        {entity.aliases.length > 0 && <p className="text-fg-3 mt-1 text-xs">Também: {entity.aliases.join(", ")}</p>}
        <div className="mt-3 flex flex-wrap gap-2">
          {counts.map((c) => (
            <Pill key={c.label}>
              <span className="text-fg font-semibold tabular-nums">{c.value}</span> {c.label}
            </Pill>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href={`/grafo?n=${entity.id}`} className="bg-accent text-bg hover:bg-accent/90 inline-flex h-9 items-center rounded-md px-3 text-sm font-medium">
            Ver no grafo
          </Link>
          <a href="#fontes" className="border-border text-fg-2 hover:text-fg inline-flex h-9 items-center rounded-md border px-3 text-sm">
            Fontes
          </a>
          <a href="#posicao" className="border-border text-fg-2 hover:text-fg inline-flex h-9 items-center rounded-md border px-3 text-sm">
            Posição do citado
          </a>
        </div>
      </div>
    </header>
  );
}
