"use client";

import Link from "next/link";
import { useState } from "react";

type Estado = "parado" | "copiando" | "copiado" | "erro";

const ROTULO: Record<Estado, string> = {
  parado: "Copiar dossiê",
  copiando: "Copiando…",
  copiado: "Copiado",
  erro: "Não deu para copiar — use Baixar",
};

/**
 * Leva o dossiê para o assistente do leitor sem depender de o assistente conseguir abrir uma URL —
 * num teste real, o ChatGPT não abriu e improvisou. O texto é o arquivo estático /dossies/<id>.txt,
 * gerado no build, para a página não carregar o dossiê duas vezes.
 */
export function CopiarDossie({ href, bytes }: { href: string; bytes: number }) {
  const [estado, setEstado] = useState<Estado>("parado");
  const kb = Math.round(bytes / 1024);

  const copiar = async () => {
    setEstado("copiando");
    try {
      const texto = fetch(href).then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.text();
      });
      /*
       * O Safari só aceita escrever na área de transferência dentro do gesto do usuário; depois de
       * um await a permissão já se foi. Entregar a Promise dentro do ClipboardItem preserva o gesto.
       */
      if (typeof ClipboardItem !== "undefined") {
        await navigator.clipboard.write([
          new ClipboardItem({
            "text/plain": texto.then((t) => new Blob([t], { type: "text/plain" })),
          }),
        ]);
      } else {
        await navigator.clipboard.writeText(await texto);
      }
      setEstado("copiado");
      window.setTimeout(() => setEstado("parado"), 2400);
    } catch {
      setEstado("erro");
    }
  };

  return (
    <div className="border-border bg-bg-2/50 mb-6 flex flex-wrap items-center gap-x-3 gap-y-2 rounded border px-3 py-2 text-xs">
      <span className="text-fg-3">Levar este dossiê para um assistente:</span>
      <button
        type="button"
        onClick={copiar}
        disabled={estado === "copiando"}
        className="border-border-strong text-fg-2 hover:text-fg hover:border-fg-3 h-8 rounded-md border px-3 transition-colors disabled:opacity-60"
      >
        {ROTULO[estado]}
      </button>
      <a
        href={href}
        download
        className="border-border-strong text-fg-2 hover:text-fg hover:border-fg-3 inline-flex h-8 items-center rounded-md border px-3 transition-colors"
      >
        Baixar .txt
      </a>
      <span className="text-fg-3 tabular-nums">
        {kb} KB
        {kb > 150 && <span className="text-fg-3"> — grande para colar de uma vez</span>}
      </span>
      <Link href="/perguntar" className="text-fg-3 hover:text-fg underline underline-offset-2">
        como usar
      </Link>
    </div>
  );
}
