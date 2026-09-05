"use client";

import { useState } from "react";

/** Copia a URL atual — que já carrega o recorte — para compartilhar ou guardar. */
export function CopiarLink({ rotulo = "Copiar link deste recorte" }: { rotulo?: string }) {
  const [copiado, setCopiado] = useState(false);
  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopiado(true);
      window.setTimeout(() => setCopiado(false), 2400);
    } catch {
      /* Sem permissão de área de transferência: a barra de endereço continua lá. */
    }
  };
  return (
    <button
      type="button"
      onClick={copiar}
      className="border-border-strong text-fg-2 hover:text-fg hover:border-fg-3 h-8 rounded-md border px-3 text-xs transition-colors"
    >
      {copiado ? "Link copiado" : rotulo}
    </button>
  );
}
