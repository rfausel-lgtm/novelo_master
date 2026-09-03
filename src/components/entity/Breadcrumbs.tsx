import Link from "next/link";

export interface Crumb {
  href?: string;
  label: string;
}

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Você está em" className="text-fg-3 mb-6 text-xs">
      <ol className="flex flex-wrap items-center gap-1.5">
        <li>
          <Link href="/" className="hover:text-fg">
            Início
          </Link>
        </li>
        {items.map((c, i) => (
          <li key={`${c.label}-${i}`} className="flex items-center gap-1.5">
            <span aria-hidden="true">/</span>
            {c.href ? (
              <Link href={c.href} className="hover:text-fg">
                {c.label}
              </Link>
            ) : (
              <span className="text-fg-2" aria-current="page">
                {c.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
