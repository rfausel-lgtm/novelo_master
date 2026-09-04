"use client";

import { useEffect, useState } from "react";

/**
 * Sumário do dossiê. Numa página de dezenas de milhares de pixels, uma tira de links que some nos
 * primeiros 700px de rolagem não é mapa. Aqui ela gruda e marca onde o leitor está; no celular vira
 * um recolhível, porque em 375px a tira quebrava em cinco linhas de alvos minúsculos.
 */
export function SectionNavSticky({ items }: { items: { id: string; label: string }[] }) {
  const [ativo, setAtivo] = useState<string | null>(null);

  useEffect(() => {
    const secoes = items
      .map((i) => document.getElementById(i.id))
      .filter((el): el is HTMLElement => !!el);
    if (secoes.length === 0) return;

    /* A seção ativa é a última que já cruzou a faixa superior da janela. */
    const observador = new IntersectionObserver(
      (entradas) => {
        for (const e of entradas) {
          if (e.isIntersecting) setAtivo(e.target.id);
        }
      },
      { rootMargin: "-72px 0px -75% 0px", threshold: 0 },
    );
    secoes.forEach((s) => observador.observe(s));
    return () => observador.disconnect();
  }, [items]);

  const links = (
    <ul className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs lg:flex-col lg:gap-x-0 lg:gap-y-1">
      {items.map((i) => (
        <li key={i.id}>
          <a
            href={`#${i.id}`}
            aria-current={ativo === i.id ? "true" : undefined}
            className={`hover:text-fg lg:border-border lg:block lg:border-l lg:py-0.5 lg:pl-3 ${
              ativo === i.id ? "text-fg lg:border-accent font-medium" : "text-fg-3"
            }`}
          >
            {i.label}
          </a>
        </li>
      ))}
    </ul>
  );

  return (
    <>
      {/* Até lg: recolhível, fora do caminho. */}
      <details className="border-border mb-6 border-y py-2 lg:hidden">
        <summary className="text-fg-2 cursor-pointer list-none py-1 text-xs">
          Ir para a seção
          <span className="text-fg-3"> ({items.length})</span>
        </summary>
        <div className="mt-2">{links}</div>
      </details>

      {/* A partir de lg: coluna própria no grid, grudada no topo. */}
      <nav aria-label="Seções desta página" className="hidden lg:block">
        <div className="sticky top-20">{links}</div>
      </nav>
    </>
  );
}
