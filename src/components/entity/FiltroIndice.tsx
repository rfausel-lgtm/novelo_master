"use client";

import { useId, useState } from "react";

/**
 * Filtro por nome nos índices. Com 100 pessoas e 69 organizações agrupadas por categoria, achar
 * alguém pelo nome exigia rolar ou recorrer ao Ctrl+F do navegador.
 *
 * Filtra o DOM já renderizado no servidor, em vez de receber a lista inteira como prop: o índice
 * continua sendo HTML estático e indexável, e a lista não é duplicada no bundle. O trabalho acontece
 * no próprio evento de digitação, não num efeito.
 */
export function FiltroIndice({ alvo, rotulo }: { alvo: string; rotulo: string }) {
  const id = useId();
  const [busca, setBusca] = useState("");
  const [achados, setAchados] = useState<number | null>(null);

  const filtrar = (valor: string) => {
    setBusca(valor);
    const raiz = document.getElementById(alvo);
    if (!raiz) return;
    const termo = valor
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "");

    let visiveis = 0;
    for (const item of raiz.querySelectorAll<HTMLElement>("[data-nome]")) {
      const nome = (item.dataset.nome ?? "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "");
      const combina = !termo || nome.includes(termo);
      item.hidden = !combina;
      if (combina) visiveis++;
    }
    /* Esconde a categoria que ficou sem ninguém e corrige o contador dela. */
    for (const secao of raiz.querySelectorAll<HTMLElement>("section[data-categoria]")) {
      const restou = secao.querySelectorAll<HTMLElement>("[data-nome]:not([hidden])").length;
      secao.hidden = restou === 0;
      const contador = secao.querySelector<HTMLElement>("[data-contador]");
      if (contador) contador.textContent = String(termo ? restou : secao.querySelectorAll("[data-nome]").length);
    }
    setAchados(termo ? visiveis : null);
  };

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
          onChange={(e) => filtrar(e.target.value)}
          placeholder="nome ou parte dele"
          className="border-border-strong bg-bg-2 text-fg placeholder:text-fg-3 focus:border-accent h-9 w-full max-w-xs rounded-md border px-2 text-sm outline-none"
        />
        {achados !== null && (
          <span className="text-fg-3 text-xs tabular-nums" aria-live="polite">
            {achados === 0 ? "nenhum resultado" : `${achados} resultado(s)`}
          </span>
        )}
      </div>
    </div>
  );
}
