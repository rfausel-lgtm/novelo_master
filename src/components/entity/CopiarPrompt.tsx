"use client";

import { useState } from "react";

/**
 * Bloco de prompt com botão de copiar. O prompt é a peça que faz a resposta do assistente herdar as
 * regras do site, então precisa chegar íntegro ao campo de conversa — pedir para o leitor selecionar
 * seis linhas à mão convida a perder justamente as instruções.
 */
export function CopiarPrompt({ texto }: { texto: string }) {
  const [copiado, setCopiado] = useState(false);

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      window.setTimeout(() => setCopiado(false), 2400);
    } catch {
      /* Sem permissão de área de transferência: o texto está à vista para seleção manual. */
    }
  };

  return (
    <div className="border-border-strong bg-bg-2 overflow-hidden rounded-md border">
      <div className="border-border flex items-center justify-between gap-3 border-b px-3 py-2">
        <span className="text-fg-3 font-mono text-[11px] tracking-[0.14em] uppercase">
          Prompt pronto
        </span>
        <button
          type="button"
          onClick={copiar}
          className="border-border-strong text-fg-2 hover:text-fg hover:border-fg-3 h-8 rounded-md border px-3 text-xs transition-colors"
        >
          {copiado ? "Copiado" : "Copiar"}
        </button>
      </div>
      <pre className="text-fg-2 max-h-72 overflow-auto px-3 py-3 text-xs leading-relaxed whitespace-pre-wrap">
        {texto}
      </pre>
    </div>
  );
}
