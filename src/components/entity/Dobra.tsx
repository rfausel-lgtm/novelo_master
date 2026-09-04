"use client";

import { Children, useState, type ReactNode } from "react";

/**
 * Mostra os primeiros itens de uma lista longa e guarda o resto atrás de um botão. Um dossiê com
 * 165 evidências em fluxo contínuo não é auditável: é rolagem.
 */
export function Dobra({
  itens,
  inicial = 15,
  rotulo,
  className = "",
}: {
  itens: ReactNode;
  inicial?: number;
  /** Plural do que está sendo dobrado, para o texto do botão: "evidências", "fontes". */
  rotulo: string;
  className?: string;
}) {
  const lista = Children.toArray(itens);
  const [aberto, setAberto] = useState(false);
  const restantes = lista.length - inicial;

  return (
    <>
      <ul className={className}>{aberto ? lista : lista.slice(0, inicial)}</ul>
      {restantes > 0 && (
        <button
          type="button"
          onClick={() => setAberto((v) => !v)}
          className="border-border-strong text-fg-2 hover:text-fg hover:border-fg-3 mt-3 rounded-md border px-3 py-1.5 text-xs transition-colors"
          aria-expanded={aberto}
        >
          {aberto ? "Mostrar menos" : `Mostrar as ${restantes} ${rotulo} restantes`}
        </button>
      )}
    </>
  );
}
