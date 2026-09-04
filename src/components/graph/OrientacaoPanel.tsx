"use client";

import { useState, useSyncExternalStore } from "react";
import { Legend } from "./Legend";
import { PanelShell } from "./ui";

const CHAVE = "novelo-orientacao-vista";

const INSTRUCOES = [
  ["Clique num nó", "abre o card com o resumo, as conexões e as fontes."],
  ["Clique duas vezes", "abre o dossiê completo daquela entidade."],
  ["Arraste um nó", "reposiciona sem alterar o dado; “Restaurar” desfaz."],
];

/**
 * Estado inicial do grafo. Antes o painel nascia vazio: o leitor recebia o emaranhado, uma barra de
 * ferramentas e nenhuma pista de que a cor e a forma das linhas carregam significado — a legenda
 * existia, mas atrás de um botão terciário.
 */
export function OrientacaoPanel({
  atalhos,
  onEscolher,
  onFechar,
}: {
  atalhos: { id: string; label: string }[];
  onEscolher: (id: string) => void;
  onFechar: () => void;
}) {
  /*
   * A decisão vive fora do React (localStorage) e só pode ser lida no cliente: no servidor o
   * snapshot é "não visto", o que faz o painel aparecer para quem chega pela primeira vez.
   */
  const [dispensadoAgora, setDispensadoAgora] = useState(false);
  const jaVisto = useSyncExternalStore(
    () => () => {},
    () => {
      try {
        return localStorage.getItem(CHAVE) === "1";
      } catch {
        return false;
      }
    },
    () => false,
  );

  const dispensar = () => {
    try {
      localStorage.setItem(CHAVE, "1");
    } catch {
      /* sem armazenamento: volta a aparecer na próxima visita */
    }
    setDispensadoAgora(true);
    onFechar();
  };

  if (jaVisto || dispensadoAgora) return null;

  return (
    <PanelShell title="Como ler este mapa" onClose={dispensar}>
      <p className="text-fg-2 text-[13px] leading-relaxed">
        Cada linha é uma relação documentada entre duas entidades. A <strong>cor</strong> diz a
        natureza da relação; a <strong>forma da linha</strong> diz a força da evidência.
      </p>

      <dl className="mt-3 space-y-1.5">
        {INSTRUCOES.map(([acao, efeito]) => (
          <div key={acao} className="flex gap-2 text-[12.5px]">
            <dt className="text-fg shrink-0 font-medium">{acao}</dt>
            <dd className="text-fg-3">{efeito}</dd>
          </div>
        ))}
      </dl>

      {atalhos.length > 0 && (
        <>
          <p className="text-fg-3 mt-4 text-[11px] tracking-[0.14em] uppercase">Comece por</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {atalhos.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => onEscolher(a.id)}
                className="border-border-strong text-fg-2 hover:text-fg hover:border-fg-3 rounded-md border px-2.5 py-1 text-xs transition-colors"
              >
                {a.label}
              </button>
            ))}
          </div>
        </>
      )}

      <div className="border-border mt-4 border-t pt-3">
        <Legend compact />
      </div>
    </PanelShell>
  );
}
