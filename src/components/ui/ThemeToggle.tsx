"use client";

import { useEffect, useSyncExternalStore } from "react";

type Escolha = "system" | "light" | "dark";

const CHAVE = "novelo-tema";

const OPCOES: { valor: Escolha; rotulo: string; titulo: string }[] = [
  { valor: "system", rotulo: "Auto", titulo: "Seguir o tema do sistema" },
  { valor: "light", rotulo: "Claro", titulo: "Tema claro" },
  { valor: "dark", rotulo: "Escuro", titulo: "Tema escuro" },
];

function aplicar(escolha: Escolha) {
  const raiz = document.documentElement;
  const doSistema = window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  const efetivo = escolha === "system" ? doSistema : escolha;
  raiz.setAttribute("data-theme", efetivo);
  raiz.style.colorScheme = efetivo;
  if (escolha === "system") {
    raiz.removeAttribute("data-theme-source");
    try {
      localStorage.removeItem(CHAVE);
    } catch {
      /* modo privado: a escolha vale só para esta aba */
    }
  } else {
    raiz.setAttribute("data-theme-source", "user");
    try {
      localStorage.setItem(CHAVE, escolha);
    } catch {
      /* idem */
    }
  }
  /*
   * O `media` do <meta name="theme-color"> segue o sistema operacional, não a escolha feita
   * aqui. Sem reescrever o meta, a barra do navegador ficaria clara com o site no escuro.
   */
  document.querySelectorAll('meta[name="theme-color"]').forEach((m) => m.remove());
  const meta = document.createElement("meta");
  meta.name = "theme-color";
  meta.content = efetivo === "light" ? "#F4F6F9" : "#090C11";
  document.head.appendChild(meta);
}

function assinar(aoMudar: () => void) {
  const observador = new MutationObserver(aoMudar);
  observador.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme", "data-theme-source"],
  });
  return () => observador.disconnect();
}

function ler(): Escolha {
  const raiz = document.documentElement;
  if (raiz.getAttribute("data-theme-source") !== "user") return "system";
  return raiz.getAttribute("data-theme") === "light" ? "light" : "dark";
}

export function ThemeToggle({ className = "" }: { className?: string }) {
  /*
   * A escolha mora no DOM (o script inline do layout já a escreveu antes do primeiro paint).
   * Ler dali via useSyncExternalStore evita tanto o mismatch de hidratação quanto um setState
   * dentro de efeito.
   */
  const escolha = useSyncExternalStore(assinar, ler, () => "system" as Escolha);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: light)");
    const aoMudarSistema = () => {
      if (document.documentElement.getAttribute("data-theme-source") !== "user") aplicar("system");
    };
    mq.addEventListener("change", aoMudarSistema);
    return () => mq.removeEventListener("change", aoMudarSistema);
  }, []);

  return (
    <div
      role="radiogroup"
      aria-label="Tema da página"
      className={`border-border-strong flex items-center rounded-md border p-0.5 ${className}`}
    >
      {OPCOES.map((o) => {
        const ativo = escolha === o.valor;
        return (
          <button
            key={o.valor}
            type="button"
            role="radio"
            aria-checked={ativo}
            title={o.titulo}
            onClick={() => aplicar(o.valor)}
            className={`rounded px-2 py-1 text-xs transition-colors ${
              ativo ? "bg-bg-3 text-fg" : "text-fg-3 hover:text-fg"
            }`}
          >
            {o.rotulo}
          </button>
        );
      })}
    </div>
  );
}
