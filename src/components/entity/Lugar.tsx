import type { Place } from "@/lib/schema";
import { PLACE_KIND_LABEL, PLACE_PRECISION_LABEL } from "@/lib/schema";

/**
 * Bloco "onde fica", com minimapa estático.
 *
 * O mapa é gerado no repositório (python/novelo_osint/minimapas.py) a partir dos tiles do
 * OpenStreetMap e servido pela própria origem. Mapa embutido de provedor exigiria afrouxar a CSP,
 * que hoje só admite imagem da própria origem, e faria cada leitor de um dossiê ser requisitado por
 * um terceiro. Aqui o leitor não fala com ninguém além do site.
 */
function urlGoogleMaps(p: Place): string {
  const zoom = p.precision === "city" ? 12 : p.precision === "approximate" ? 15 : 18;
  return `https://www.google.com/maps/@?api=1&map_action=map&center=${p.lat},${p.lon}&zoom=${zoom}&basemap=satellite`;
}

export function Lugar({
  place,
  mapaId,
  fontes,
}: {
  place: Place;
  /** Id do registro: o minimapa é gravado como /mapas/<id>.png. */
  mapaId: string;
  fontes?: React.ReactNode;
}) {
  return (
    <figure className="border-border bg-bg-2/50 m-0 overflow-hidden rounded-md border">
      <div className="bg-bg-3 relative">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/mapas/${mapaId}.png`}
          alt={`Mapa de ${place.name}`}
          width={560}
          height={280}
          className="minimapa block h-auto w-full"
        />
        {/* O ponto fica no centro por construção: o mapa é recortado em torno da coordenada. */}
        <span
          aria-hidden="true"
          className="border-bg bg-accent absolute top-1/2 left-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 shadow-lg"
        />
        <span
          aria-hidden="true"
          className="border-accent/50 absolute top-1/2 left-1/2 h-9 w-9 -translate-x-1/2 -translate-y-1/2 rounded-full border"
        />
      </div>

      <figcaption className="p-3">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className="text-fg text-sm font-medium">{place.name}</span>
          <span className="text-fg-3 text-xs">{PLACE_KIND_LABEL[place.kind]}</span>
        </div>

        <p className="text-fg-3 mt-1 font-mono text-xs">
          {place.lat.toFixed(5)}, {place.lon.toFixed(5)}{" "}
          <span className="font-sans">· {PLACE_PRECISION_LABEL[place.precision]}</span>
        </p>

        {place.note && <p className="text-fg-2 mt-1.5 text-xs leading-relaxed">{place.note}</p>}

        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
          <a
            href={urlGoogleMaps(place)}
            target="_blank"
            rel="noreferrer noopener"
            className="border-border-strong text-fg-2 hover:text-fg hover:border-fg-3 inline-flex h-8 items-center rounded-md border px-3 text-xs transition-colors"
          >
            Abrir no Google Maps
          </a>
          <span className="text-fg-3 text-[11px]">
            Mapa ©{" "}
            <a
              href="https://www.openstreetmap.org/copyright"
              target="_blank"
              rel="noreferrer noopener"
              className="hover:text-fg underline underline-offset-2"
            >
              colaboradores do OpenStreetMap
            </a>
          </span>
        </div>

        {fontes && <div className="text-fg-3 mt-2 text-xs">{fontes}</div>}
      </figcaption>
    </figure>
  );
}
