"use client";

import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { hrefDaPagina } from "@/lib/atualizacoes";

/**
 * Salto direto para uma página.
 *
 * Com 21 páginas a barra numerada já resolve quase tudo, mas ir de 3 para 17 custa dois saltos e uma
 * conferida. Aqui se digita o número e pronto.
 *
 * É o único componente de cliente desta página. Ele importa apenas `hrefDaPagina`, de um módulo puro
 * — se importasse de `@/lib/data`, o acervo inteiro viajaria no pacote do navegador.
 *
 * Sem JavaScript o campo não faz nada, e é por isso que ele acompanha a barra numerada em vez de
 * substituí-la: a navegação por links continua inteira para quem não executa script.
 */
export function PularParaPagina({ atual, total }: { atual: number; total: number }) {
  const router = useRouter();
  const id = useId();
  const [valor, setValor] = useState("");

  function ir(evento: React.FormEvent) {
    evento.preventDefault();
    const n = Number.parseInt(valor, 10);
    if (!Number.isFinite(n)) return;
    /*
     * Na prática o `max` do campo já barra o número fora de faixa: o navegador recusa o envio e
     * mostra a própria mensagem, e este `onSubmit` nem roda — conferido com `checkValidity()`. O
     * limite aqui é a segunda tranca, para o caso de o envio chegar por outro caminho.
     */
    const destino = Math.min(Math.max(n, 1), total);
    if (destino !== atual) router.push(hrefDaPagina(destino));
    setValor("");
  }

  return (
    <form onSubmit={ir} className="mt-3 flex items-center justify-center gap-2 text-xs">
      <label htmlFor={id} className="text-fg-3">
        Ir para a página
      </label>
      <input
        id={id}
        name="pagina"
        type="number"
        min={1}
        max={total}
        inputMode="numeric"
        value={valor}
        onChange={(e) => setValor(e.target.value)}
        placeholder={String(atual)}
        aria-label={`Número da página, de 1 a ${total}`}
        className="border-border bg-bg text-fg focus-visible:outline-accent h-9 w-16 rounded-md border px-2 text-center tabular-nums"
      />
      <span className="text-fg-3">de {total}</span>
      <button
        type="submit"
        className="border-border text-fg-2 hover:border-fg-3 hover:text-fg focus-visible:outline-accent h-9 rounded-md border px-3 transition-colors"
      >
        Ir
      </button>
    </form>
  );
}
