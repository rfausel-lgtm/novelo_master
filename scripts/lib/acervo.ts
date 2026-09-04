/**
 * Acervo em texto: o corpus inteiro num arquivo que um assistente consegue ler de uma vez.
 *
 * Existe porque uma extensão de navegador lê a PÁGINA ABERTA, não o site. Sem um artefato único, o
 * leitor que pede "analise o acervo" recebe uma resposta baseada em uma página só — ou, pior, no que
 * o modelo acha que sabe sobre o caso. Aqui ele recebe o corpus com a classe de evidência e a fonte
 * coladas em cada afirmação, que é a única forma de a resposta herdar o rigor do site.
 *
 * O cabeçalho de instruções não é enfeite: é a parte que impede o assistente de inventar conexão que
 * o corpus não afirma.
 */
import type { Corpus } from "@/lib/schema";
import { RELATIONSHIP_FAMILY } from "@/lib/schema";
import { SITE } from "@/lib/site";

const SEP = "|";

function limpa(texto: string | undefined, max = 320): string {
  if (!texto) return "";
  const s = texto.replace(/\s+/g, " ").trim();
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}

function cabecalho(corpus: Corpus, base: string): string {
  return [
    `# ${SITE.name} — acervo em texto`,
    "",
    `Corpus completo do caso Banco Master, gerado em ${corpus.built_at}.`,
    `Site: ${base} · Cada registro abaixo tem página própria em ${base}/<tipo>/<id>/`,
    "",
    "## Como responder a partir deste arquivo",
    "",
    "1. Responda SOMENTE com o que está escrito aqui. Se algo não constar, diga que não consta no",
    "   acervo — não complete com conhecimento externo sobre o caso.",
    "2. Toda afirmação carrega uma CLASSE DE EVIDÊNCIA. Cite-a junto da resposta:",
    "   D = documental direto (documento primário verificável)",
    "   C = corroborado (duas ou mais fontes independentes, sem documento primário)",
    "   A = alegação (declaração atribuída a terceiro; NÃO é fato comprovado)",
    "   I = inferência (interpretação analítica; NÃO é prova)",
    "3. Nunca converta A ou I em fato. Nunca afirme crime: o acervo registra investigações,",
    "   decisões e alegações, e estar no mapa não implica ilicitude.",
    "4. Quando houver posição do citado (linha POSIÇÃO), apresente-a junto da afirmação que ela",
    "   contesta, não em separado.",
    "5. Ao citar, aponte o id do registro para que o leitor confira na página correspondente.",
    "",
    "## Formato",
    "",
    "Campos separados por barra vertical. Primeira letra indica o tipo:",
    "PESSOA, ORG, EVENTO, ATO, RELAÇÃO, TRANSAÇÃO, ALEGAÇÃO, SEQUÊNCIA, POSIÇÃO.",
    "",
  ].join("\n");
}

export function construirAcervo(corpus: Corpus): { texto: string; registros: number } {
  const base = SITE.url.replace(/\/$/, "");
  const publicado = <T extends { review_status?: string }>(x: T) => x.review_status === "published";
  const linhas: string[] = [cabecalho(corpus, base)];
  let registros = 0;

  const nome = new Map<string, string>();
  for (const p of corpus.people) nome.set(p.id, p.name);
  for (const o of corpus.organizations) nome.set(o.id, o.name);
  for (const e of corpus.events) nome.set(e.id, e.title);
  for (const a of corpus.public_acts) nome.set(a.id, a.title);

  const oficiais = new Set(
    corpus.sources.filter((s) => s.source_type.startsWith("official")).map((s) => s.id),
  );
  const fonteResumo = (ids: string[]) => {
    const of = ids.filter((i) => oficiais.has(i)).length;
    return `${ids.length} fonte(s)${of ? `, ${of} oficial(is)` : ""}`;
  };

  linhas.push("\n## PESSOAS\n");
  for (const p of corpus.people.filter(publicado)) {
    registros++;
    linhas.push(
      ["PESSOA", p.id, p.name, limpa(p.role, 120), limpa(p.why_in_novelo)].join(SEP),
    );
    for (const c of p.cited_position ?? [])
      if (c.kind !== "not_located")
        linhas.push(["POSIÇÃO", p.id, c.kind, limpa(c.summary, 260)].join(SEP));
  }

  linhas.push("\n## ORGANIZAÇÕES\n");
  for (const o of corpus.organizations.filter(publicado)) {
    registros++;
    linhas.push(["ORG", o.id, o.name, o.org_type, limpa(o.why_in_novelo)].join(SEP));
    for (const c of o.cited_position ?? [])
      if (c.kind !== "not_located")
        linhas.push(["POSIÇÃO", o.id, c.kind, limpa(c.summary, 260)].join(SEP));
  }

  linhas.push("\n## EVENTOS (ordem cronológica)\n");
  const eventos = [...corpus.events.filter(publicado)].sort((a, b) => a.date.localeCompare(b.date));
  for (const e of eventos) {
    registros++;
    linhas.push(
      [
        "EVENTO",
        e.id,
        e.date,
        e.evidence_class,
        limpa(e.title, 160),
        limpa(e.description, 360),
        `participantes: ${e.participant_ids.map((i) => nome.get(i) ?? i).join("; ")}`,
        fonteResumo(e.source_ids),
      ].join(SEP),
    );
    for (const c of e.cited_position ?? [])
      if (c.kind !== "not_located")
        linhas.push(["POSIÇÃO", e.id, c.kind, limpa(c.summary, 260)].join(SEP));
  }

  linhas.push("\n## ATOS PÚBLICOS\n");
  for (const a of corpus.public_acts.filter(publicado)) {
    registros++;
    linhas.push(
      ["ATO", a.id, a.date ?? "", a.evidence_class, limpa(a.title, 160), limpa(a.description, 300)].join(
        SEP,
      ),
    );
  }

  linhas.push("\n## RELAÇÕES\n");
  for (const r of corpus.relationships.filter(publicado)) {
    registros++;
    linhas.push(
      [
        "RELAÇÃO",
        r.id,
        r.evidence_class,
        `${nome.get(r.from_id) ?? r.from_id} ${r.directed ? "->" : "--"} ${nome.get(r.to_id) ?? r.to_id}`,
        RELATIONSHIP_FAMILY[r.relationship_type],
        r.label,
        r.start_date ?? "sem data",
        limpa(r.description, 320),
        fonteResumo(r.source_ids),
      ].join(SEP),
    );
    for (const c of r.cited_position ?? [])
      if (c.kind !== "not_located")
        linhas.push(["POSIÇÃO", r.id, c.kind, limpa(c.summary, 260)].join(SEP));
  }

  linhas.push("\n## TRANSAÇÕES\n");
  for (const t of corpus.transactions.filter(publicado)) {
    registros++;
    linhas.push(
      [
        "TRANSAÇÃO",
        t.id,
        t.date,
        t.evidence_class,
        `${nome.get(t.from_id) ?? t.from_id} -> ${nome.get(t.to_id) ?? t.to_id}`,
        t.amount_text ?? (t.amount ? `${t.amount} ${t.currency}` : ""),
        limpa(t.description, 300),
      ].join(SEP),
    );
  }

  linhas.push("\n## ALEGAÇÕES SOB ANÁLISE (nunca tratar como fato)\n");
  for (const c of corpus.claims.filter(publicado)) {
    registros++;
    linhas.push(
      [
        "ALEGAÇÃO",
        c.id,
        c.classification,
        c.status,
        `quem sustenta: ${c.claimant ?? c.claimant_id ?? "não identificado"}`,
        limpa(c.statement, 340),
        `limites: ${limpa(c.limits, 240) || "não declarados"}`,
      ].join(SEP),
    );
    for (const cp of c.counter_position ?? [])
      if (cp.kind !== "not_located")
        linhas.push(["POSIÇÃO", c.id, cp.kind, limpa(cp.summary, 260)].join(SEP));
  }

  linhas.push("\n## SEQUÊNCIAS TEMPORAIS (proximidade não é causa)\n");
  for (const s of corpus.sequences.filter(publicado)) {
    registros++;
    linhas.push(
      [
        "SEQUÊNCIA",
        s.id,
        limpa(s.title, 160),
        `causalidade comprovada: ${s.causality_proven ? "sim" : "não"}`,
        `nexo documental: ${s.documentary_link}`,
        limpa(s.description, 300),
        `limites: ${limpa(s.limits, 260)}`,
      ].join(SEP),
    );
  }

  linhas.push(
    [
      "",
      "## O que este arquivo não traz",
      "",
      "Documentos, fontes e evidências individuais ficam nas páginas do site:",
      `${base}/documentos/ · ${base}/fontes/ · e a camada probatória do grafo em ${base}/data/graph-evidence.json`,
      `O grafo completo, com posições e categorias, está em ${base}/data/graph.json`,
      "",
    ].join("\n"),
  );

  return { texto: linhas.join("\n"), registros };
}

/** Índice para assistentes, na convenção llms.txt. */
export function construirLlmsTxt(corpus: Corpus): string {
  const base = SITE.url.replace(/\/$/, "");
  const n = (v: number) => v.toLocaleString("pt-BR");
  return [
    `# ${SITE.name}`,
    "",
    `> ${SITE.description}`,
    "",
    `Corpus de ${n(corpus.people.length)} pessoas, ${n(corpus.organizations.length)} organizações,`,
    `${n(corpus.events.length)} eventos e ${n(corpus.relationships.length)} relações, cada uma com`,
    "classe de evidência declarada (D documental, C corroborado, A alegação, I inferência) e fonte.",
    "",
    "## Antes de responder sobre este site",
    "",
    "- Use o acervo em texto abaixo em vez de responder de memória sobre o caso.",
    "- Cite sempre a classe de evidência. A e I não são fatos comprovados.",
    "- Não afirme crime: o acervo registra investigações, decisões e alegações.",
    "- A posição do citado, quando existir, vai junto da afirmação que ela contesta.",
    "",
    "## Acervo",
    "",
    `- [Acervo em texto](${base}/acervo.txt): o corpus inteiro num arquivo, com classe e fonte por registro`,
    `- [Grafo em JSON](${base}/data/graph.json): nós, arestas, categorias e posições`,
    `- [Camada probatória](${base}/data/graph-evidence.json): documentos, fontes, claims e evidências`,
    `- [Lugares em KML](${base}/data/novelo.kml): pontos geolocalizados do caso`,
    "",
    "## Como o corpus é feito",
    "",
    `- [Metodologia](${base}/metodologia/)`,
    `- [Política editorial](${base}/politica-editorial/)`,
    `- [Sobre e contato](${base}/sobre/)`,
    `- [Histórico de atualizações](${base}/atualizacoes/)`,
    "",
  ].join("\n");
}
