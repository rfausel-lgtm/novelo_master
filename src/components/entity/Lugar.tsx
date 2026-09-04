import type { Place } from "@/lib/schema";
import { PLACE_KIND_LABEL, PLACE_PRECISION_LABEL } from "@/lib/schema";

/**
 * Bloco "onde fica". Escolhi link em vez de mapa embutido por três razões: a CSP do site permite
 * imagens só da própria origem, então qualquer provedor de tiles exigiria afrouxá-la e faria o
 * leitor ser rastreado por terceiro; um mapa embutido precisa de chave paga; e o que o leitor quer
 * nesse ponto é ver o lugar de verdade, o que o Google Earth faz melhor do que um quadrado estático.
 */
function urlGoogleEarth(p: Place): string {
  /* Distância da câmera conforme a precisão: não adianta mergulhar num ponto que é o município. */
  const distancia = p.precision === "city" ? 12000 : p.precision === "approximate" ? 2500 : 700;
  return `https://earth.google.com/web/@${p.lat},${p.lon},0a,${distancia}d,35y,0h,45t,0r`;
}

function urlGoogleMaps(p: Place): string {
  const zoom = p.precision === "city" ? 12 : p.precision === "approximate" ? 15 : 18;
  return `https://www.google.com/maps/@?api=1&map_action=map&center=${p.lat},${p.lon}&zoom=${zoom}&basemap=satellite`;
}

export function Lugar({ place, fontes }: { place: Place; fontes?: React.ReactNode }) {
  return (
    <div className="border-border bg-bg-2/50 rounded-md border p-3">
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span className="text-fg text-sm font-medium">{place.name}</span>
        <span className="text-fg-3 text-xs">{PLACE_KIND_LABEL[place.kind]}</span>
      </div>

      <p className="text-fg-3 mt-1 font-mono text-xs">
        {place.lat.toFixed(5)}, {place.lon.toFixed(5)}{" "}
        <span className="font-sans">· {PLACE_PRECISION_LABEL[place.precision]}</span>
      </p>

      {place.note && <p className="text-fg-2 mt-1.5 text-xs leading-relaxed">{place.note}</p>}

      <div className="mt-3 flex flex-wrap gap-2">
        <a
          href={urlGoogleEarth(place)}
          target="_blank"
          rel="noreferrer noopener"
          className="border-border-strong text-fg-2 hover:text-fg hover:border-fg-3 inline-flex h-8 items-center rounded-md border px-3 text-xs transition-colors"
        >
          Ver no Google Earth
        </a>
        <a
          href={urlGoogleMaps(place)}
          target="_blank"
          rel="noreferrer noopener"
          className="border-border-strong text-fg-2 hover:text-fg hover:border-fg-3 inline-flex h-8 items-center rounded-md border px-3 text-xs transition-colors"
        >
          Ver no Google Maps
        </a>
      </div>

      {fontes && <div className="text-fg-3 mt-2 text-xs">{fontes}</div>}
    </div>
  );
}
