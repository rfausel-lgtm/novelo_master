/**
 * Tamanho de cada dossiê em texto, em bytes, gravado pelo build (scripts/build-data.ts).
 *
 * A página anuncia o tamanho antes de o leitor copiar: os dossiês vão de 3 KB a mais de 300 KB, e
 * mandar alguém colar 300 KB num chat sem avisar é armadilha. Server-only, como o resto de lib/data.
 */
import tamanhos from "@/generated/dossies.json";

const POR_ID = tamanhos as Record<string, number>;

export const tamanhoDossie = (id: string): number => POR_ID[id] ?? 0;
