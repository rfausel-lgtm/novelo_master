import type { ReactNode } from "react";

/** Seção com âncora e título h2 (ou h3 quando aninhada). */
export function Section({
  id,
  title,
  count,
  children,
  level = 2,
  description,
}: {
  id: string;
  title: string;
  count?: number;
  children: ReactNode;
  level?: 2 | 3;
  description?: ReactNode;
}) {
  const Heading = level === 3 ? "h3" : "h2";
  /*
   * A razão h2/corpo era 1,125: catorze títulos que mal se destacavam do texto que os segue, com
   * py-6 uniforme e sem régua. Título maior e uma linha separando as seções dão o respiro.
   */
  return (
    <section
      id={id}
      aria-labelledby={`${id}-titulo`}
      className="border-border scroll-mt-20 border-t pt-8 pb-6 first:border-t-0 first:pt-0"
    >
      <Heading
        id={`${id}-titulo`}
        className={`text-fg flex items-baseline gap-2 ${level === 3 ? "text-base font-semibold" : "text-[1.375rem] leading-snug font-semibold tracking-[-0.01em]"}`}
      >
        <a href={`#${id}`} className="hover:text-accent">
          {title}
        </a>
        {typeof count === "number" ? (
          <span className="text-fg-3 font-mono text-xs font-normal" aria-label={`${count} itens`}>
            {count}
          </span>
        ) : null}
      </Heading>
      {description ? <p className="text-fg-3 mt-1 text-xs">{description}</p> : null}
      <div className="mt-3">{children}</div>
    </section>
  );
}

/** Sumário lateral/topo com âncoras das seções. */
export function SectionNav({ items }: { items: { id: string; label: string }[] }) {
  return (
    <nav aria-label="Seções desta página" className="border-border mb-6 border-y py-3">
      <ul className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs">
        {items.map((i) => (
          <li key={i.id}>
            <a href={`#${i.id}`} className="text-fg-3 hover:text-fg">
              {i.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <p className="text-fg-3 text-sm italic">{children}</p>;
}
