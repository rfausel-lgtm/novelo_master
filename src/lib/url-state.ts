"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Estado de filtro na URL, sem servidor e sem perder o HTML estático.
 *
 * `useSearchParams` do Next faria a subárvore ser renderizada só no cliente na exportação estática:
 * a cronologia e os índices sumiriam do HTML — justamente o conteúdo indexável. Aqui a URL é lida
 * como fonte externa via useSyncExternalStore: o servidor enxerga uma busca vazia e renderiza tudo,
 * o cliente hidrata igual, e só então aplica o recorte que veio no link.
 *
 * `history.replaceState` não dispara evento; quem grava avisa os assinantes desta aba.
 */
const assinantes = new Set<() => void>();

function assinar(cb: () => void) {
  assinantes.add(cb);
  window.addEventListener("popstate", cb);
  return () => {
    assinantes.delete(cb);
    window.removeEventListener("popstate", cb);
  };
}
const noCliente = () => window.location.search;
const noServidor = () => "";

export function useUrlState() {
  const search = useSyncExternalStore(assinar, noCliente, noServidor);
  const params = new URLSearchParams(search);
  const gravar = useCallback((patch: Record<string, string | null>) => {
    const url = new URL(window.location.href);
    for (const [k, v] of Object.entries(patch)) {
      if (v) url.searchParams.set(k, v);
      else url.searchParams.delete(k);
    }
    const proximo = url.pathname + url.search + url.hash;
    const atual = window.location.pathname + window.location.search + window.location.hash;
    if (proximo === atual) return;
    window.history.replaceState(window.history.state, "", proximo);
    for (const cb of assinantes) cb();
  }, []);
  return { params, gravar };
}

/**
 * Lista de valores permitidos, na URL. Ausente = todos; "-" = nenhum — sem o sentinela, desmarcar
 * tudo cairia no padrão e mostraria tudo. Valor desconhecido é descartado.
 */
export function listaDaUrl<T extends string>(param: string | null, todos: readonly T[]): Set<T> {
  if (param === null) return new Set(todos);
  if (param === "-") return new Set();
  const validos = new Set<string>(todos);
  return new Set(param.split(",").filter((v): v is T => validos.has(v)));
}

export function listaParaUrl<T extends string>(
  escolhidos: ReadonlySet<T>,
  todos: readonly T[],
): string | null {
  if (escolhidos.size === todos.length) return null;
  if (escolhidos.size === 0) return "-";
  return todos.filter((t) => escolhidos.has(t)).join(",");
}
