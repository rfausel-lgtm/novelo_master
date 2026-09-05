"use client";

import { useEffect, useId, useRef } from "react";
import { useUrlState } from "@/lib/url-state";
import { CopiarLink } from "./CopiarLink";

/**
 * Filtro por nome nos índices. Com 114 pessoas e 80 organizações agrupadas por categoria, achar
 * alguém pelo nome exigia rolar ou recorrer ao Ctrl+F do navegador.
 *
 * Filtra o DOM já renderizado no servidor, em vez de receber a lista inteira como prop: o índice
 * continua sendo HTML estático e indexável, e a lista não é duplicada no bundle. O termo vive na
 * URL (`?q=`), então o link reproduz o recorte e voltar de um dossiê não o perde. O contador é
 * escrito direto no DOM, junto do filtro, para não virar estado atualizado dentro de efeito.
 */
function normalizar(valor: string): string {
  return valor
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

export function FiltroIndice({ alvo, rotulo }: { alvo: string; rotulo: string }) {
  const id = useId();
  const { params, gravar } = useUrlState();
  const busca = params.get("q") ?? "";
  const contadorRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const raiz = document.getElementById(alvo);
    if (!raiz) return;
    const termo = normalizar(busca);

    let visiveis = 0;
    for (const item of raiz.querySelectorAll<HTMLElement>("[data-nome]")) {
      const combina = !termo || normalizar(item.dataset.nome ?? "").includes(termo);
      item.hidden = !combina;
      if (combina) visiveis++;
    }
    /* Esconde a categoria que ficou sem ninguém e corrige o contador dela. */
    for (const secao of raiz.querySelectorAll<HTMLElement>("section[data-categoria]")) {
      const restou = secao.querySelectorAll<HTMLElement>("[data-nome]:not([hidden])").length;
      secao.hidden = restou === 0;
      const contador = secao.querySelector<HTMLElement>("[data-contador]");
      if (contador)
        contador.textContent = String(
          termo ? restou : secao.querySelectorAll("[data-nome]").length,
        );
    }
    if (contadorRef.current)
      contadorRef.current.textContent = !termo
        ? ""
        : visiveis === 0
          ? "nenhum resultado"
          : `${visiveis} resultado(s)`;
  }, [alvo, busca]);

  return (
    <div className="mb-6">
      <label htmlFor={id} className="text-fg-3 mb-1 block text-xs">
        {rotulo}
      </label>
      <div className="flex flex-wrap items-center gap-3">
        <input
          id={id}
          type="search"
          value={busca}
          onChange={(e) => gravar({ q: e.target.value || null })}
          placeholder="nome ou parte dele"
          className="border-border-strong bg-bg-2 text-fg placeholder:text-fg-3 focus:border-accent h-9 w-full max-w-xs rounded-md border px-2 text-sm outline-none"
        />
        <span ref={contadorRef} className="text-fg-3 text-xs tabular-nums" aria-live="polite" />
        {busca && <CopiarLink />}
      </div>
    </div>
  );
}
