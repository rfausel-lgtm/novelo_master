type Variant = "timeline" | "sources" | "methodology";

const VARIANT_CLASS: Record<Variant, string> = {
  timeline: "novelo-banner-timeline",
  sources: "novelo-banner-sources",
  methodology: "novelo-banner-methodology",
};

/** Faixa editorial ilustrada: identifica a seção sem competir com a tabela ou o texto abaixo. */
export function SectionBanner({ variant }: { variant: Variant }) {
  return (
    <div
      aria-hidden="true"
      className={`border-border mb-8 h-28 w-full rounded-lg border sm:h-36 ${VARIANT_CLASS[variant]}`}
    />
  );
}
