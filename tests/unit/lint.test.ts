import { describe, it, expect } from "vitest";
import { lintCorpus } from "../../scripts/lib/lint";
import type { Corpus } from "../../src/lib/schema";
import { minimalCorpus } from "./fixtures";

const errors = (c: ReturnType<typeof minimalCorpus>) =>
  lintCorpus(c)
    .filter((i) => i.level === "error")
    .map((i) => `${i.file}: ${i.message}`);

describe("lint editorial", () => {
  it("corpus mínimo válido não tem erros", () => {
    expect(errors(minimalCorpus())).toEqual([]);
  });

  it("bloqueia referência a id inexistente", () => {
    const c = minimalCorpus();
    c.relationships[0].evidence_ids = ["ev-nao-existe"];
    expect(errors(c).some((e) => e.includes("inexistente"))).toBe(true);
  });

  it("bloqueia relação sem suporte que não seja inferência", () => {
    const c = minimalCorpus();
    const r = c.relationships[1];
    r.evidence_ids = [];
    r.source_ids = [];
    expect(errors(c).some((e) => e.includes("sem evidence_ids/source_ids"))).toBe(true);
  });

  it("aceita inferência quando há evidência I com inference_basis", () => {
    const c = minimalCorpus();
    c.evidence.push({
      id: "ev-i",
      kind: "evidence",
      classification: "I",
      proposition: "Intervalo de dez dias entre encontro e ato.",
      document_ids: [],
      source_ids: [],
      inference_basis: "O intervalo é fato; o nexo causal não se conclui.",
      review_status: "published",
      created_at: "2026-09-01",
      updated_at: "2026-09-01",
    });
    const r = c.relationships[1];
    r.evidence_class = "I";
    r.evidence_ids = ["ev-i"];
    r.source_ids = [];
    r.event_ids = ["evt-2025-11-18-teste"];
    expect(errors(c)).toEqual([]);
  });

  it("bloqueia inferência sem evidência I com raciocínio explícito", () => {
    const c = minimalCorpus();
    const r = c.relationships[1];
    r.evidence_class = "I";
    r.evidence_ids = [];
    r.source_ids = [];
    r.event_ids = ["evt-2025-11-18-teste"];
    expect(errors(c).some((e) => e.includes("classe I exige"))).toBe(true);
  });

  it("bloqueia ato público verified com classe A", () => {
    const c = minimalCorpus();
    c.public_acts.push({
      id: "ato-2026-01-01-teste",
      kind: "public_act",
      title: "Ato",
      act_type: "judicial",
      date: "2026-01-01",
      date_precision: "day",
      actor_ids: ["pessoa-b"],
      affected_ids: [],
      description: "d",
      evidence_class: "A",
      status: "verified",
      evidence_ids: ["ev-a"],
      source_ids: [],
      document_ids: [],
      tags: [],
      review_status: "published",
      created_at: "2026-09-01",
      updated_at: "2026-09-01",
    });
    expect(
      errors(c).some((e) => e.includes("public-acts") && e.includes("verified incompatível")),
    ).toBe(true);
  });

  it("avisa sobre prefixo de id fora da convenção", () => {
    const c = minimalCorpus();
    c.events[0].id = "2025-11-18-sem-prefixo";
    const warnings = lintCorpus(c).filter((i) => i.level === "warning");
    expect(warnings.some((w) => w.message.includes("prefixo"))).toBe(true);
  });

  it("bloqueia status verified para alegação ou inferência", () => {
    const c = minimalCorpus();
    c.relationships[1].status = "verified";
    expect(errors(c).some((e) => e.includes("verified incompatível"))).toBe(true);
  });

  it("bloqueia classe D sem documento primário", () => {
    const c = minimalCorpus();
    c.evidence[0].document_ids = [];
    expect(errors(c).some((e) => e.includes("classe D exige"))).toBe(true);
  });

  it("bloqueia classe C com uma única fonte", () => {
    const c = minimalCorpus();
    c.evidence[1].classification = "C";
    expect(errors(c).some((e) => e.includes("classe C exige"))).toBe(true);
  });

  it("bloqueia alegação sem atribuição", () => {
    const c = minimalCorpus();
    delete c.evidence[1].attributed_to;
    expect(errors(c).some((e) => e.includes("classe A exige"))).toBe(true);
  });

  it("bloqueia evidence_class da relação acima da melhor evidência ligada", () => {
    const c = minimalCorpus();
    c.relationships[1].evidence_class = "D";
    c.relationships[1].status = "unverified";
    expect(errors(c).some((e) => e.includes("superior à melhor evidência"))).toBe(true);
  });

  it("avisa sobre termo imputativo sem qualificador", () => {
    const c = minimalCorpus();
    c.relationships[0].description = "Ele é corrupto.";
    const warnings = lintCorpus(c).filter((i) => i.level === "warning");
    expect(warnings.some((w) => w.message.includes("imputativo"))).toBe(true);
  });

  it("não avisa quando o termo vem qualificado como alegação", () => {
    const c = minimalCorpus();
    c.relationships[0].description = "Segundo a PF, haveria pagamento de propina.";
    const warnings = lintCorpus(c).filter(
      (i) => i.level === "warning" && i.message.includes("imputativo"),
    );
    expect(warnings).toEqual([]);
  });

  it("bloqueia sequência com causalidade comprovada sem nexo documental", () => {
    const c = minimalCorpus();
    c.sequences.push({
      id: "seq-teste",
      kind: "temporal_sequence",
      title: "Seq",
      step_ids: ["evt-2025-11-18-teste", "evt-2025-11-18-teste"],
      temporal_proximity: "high",
      documentary_link: "absent",
      causality_proven: true,
      description: "d",
      limits: "l",
      source_ids: [],
      evidence_ids: [],
      tags: [],
      review_status: "published",
      created_at: "2026-09-01",
      updated_at: "2026-09-01",
    });
    expect(errors(c).some((e) => e.includes("causality_proven"))).toBe(true);
  });
});

describe("duplicação de entidade", () => {
  const pessoa = (id: string, name: string, extra: Record<string, unknown> = {}) => ({
    id,
    kind: "person" as const,
    name,
    aliases: [] as string[],
    distinct_from: [] as string[],
    category: "other" as const,
    role: "Papel",
    positions: [],
    summary: "Resumo.",
    why_in_novelo: "Frase.",
    cited_position: [],
    open_questions: [],
    tags: [],
    source_ids: [],
    review_status: "published" as const,
    created_at: "2026-09-09",
    updated_at: "2026-09-09",
    ...extra,
  });
  const comPessoas = (...pessoas: ReturnType<typeof pessoa>[]) =>
    ({ ...minimalCorpus(), people: pessoas }) as unknown as Corpus;

  it("bloqueia rótulo idêntico entre dois registros", () => {
    const issues = lintCorpus(
      comPessoas(pessoa("a", "Fulano de Tal"), pessoa("b", "fulano de tal")),
    );
    expect(issues.some((i) => i.level === "error" && /rótulo idêntico/.test(i.message))).toBe(true);
  });

  /* Foi o caso Sefer/Foco DTVM: os nomes não se parecem, o alias é que coincide. */
  it("pega colisão entre nome de um e alias do outro", () => {
    const issues = lintCorpus(
      comPessoas(
        pessoa("a", "Empresa X"),
        pessoa("b", "Nome Diferente", { aliases: ["Empresa X"] }),
      ),
    );
    expect(issues.some((i) => i.level === "error" && /rótulo idêntico/.test(i.message))).toBe(true);
  });

  /* Caso Felipe/Freixo: similaridade de texto não pega, tokens contidos pegam. */
  it("avisa quando os tokens de um nome estão contidos no outro, e o aviso bloqueia", () => {
    const issues = lintCorpus(
      comPessoas(pessoa("a", "Antonio Freixo"), pessoa("b", "Antônio Carlos Freixo Júnior")),
    );
    const aviso = issues.find((i) => /possível duplicata/.test(i.message));
    expect(aviso?.level).toBe("warning");
    /* `published !== false` é o que faz o modo estrito barrar. */
    expect(aviso?.published).not.toBe(false);
  });

  it("não bloqueia quando os dois lados ainda são rascunho", () => {
    const rascunho = { review_status: "draft" as const };
    const issues = lintCorpus(
      comPessoas(
        pessoa("a", "Antonio Freixo", rascunho),
        pessoa("b", "Antônio Carlos Freixo Júnior", rascunho),
      ),
    );
    expect(issues.find((i) => /possível duplicata/.test(i.message))?.published).toBe(false);
  });

  /* Caso Kevin x Nunes Marques: pai e filho, indistinguíveis por regra lexical. */
  it("silencia o par quando um dos lados declara distinct_from", () => {
    const issues = lintCorpus(
      comPessoas(
        pessoa("filho", "Kevin Nunes Marques", { distinct_from: ["pai"] }),
        pessoa("pai", "Nunes Marques"),
      ),
    );
    expect(issues.some((i) => /duplicata|rótulo idêntico/.test(i.message))).toBe(false);
  });

  it("não confunde pessoa com organização de nome parecido", () => {
    const corpus = {
      ...minimalCorpus(),
      people: [pessoa("p", "Viviane Barci de Moraes")],
    } as unknown as Corpus;
    expect(lintCorpus(corpus).some((i) => /duplicata|rótulo idêntico/.test(i.message))).toBe(false);
  });
});

/*
 * Blog e rede social: a regra pergunta como a fonte é usada, não se ela existe.
 *
 * A versão anterior avisava no registro da própria fonte, e por isso deixou o modo estrito vermelho
 * por dias — as duas fontes do ainvestigacao.com sustentam apenas evidências de Inferência, que é
 * exatamente o uso que a política prescreve, e nenhum trabalho editorial apagava o aviso.
 */
describe("fonte de pista (blog/rede social)", () => {
  const comBlog = (classificacao: "D" | "C" | "A" | "I") => {
    const c = minimalCorpus();
    c.sources.push({
      id: "src-blog",
      kind: "source",
      title: "Post",
      publisher: "A Investigação",
      retrieved_at: "2026-09-01",
      url: "https://blog.example/x",
      source_type: "blog",
      language: "pt-BR",
      verification: {
        checked_at: "2026-09-01",
        checked_by: "teste",
        url_reachable: true,
        content_matches_summary: true,
      },
      review_status: "published",
      created_at: "2026-09-01",
      updated_at: "2026-09-01",
    } as unknown as Corpus["sources"][number]);
    c.evidence.push({
      id: "ev-blog",
      kind: "evidence",
      classification: classificacao,
      proposition: "Proposição sustentada pelo post.",
      document_ids: classificacao === "D" ? ["doc-1"] : [],
      source_ids: classificacao === "C" ? ["src-blog", "src-oficial"] : ["src-blog"],
      attributed_to: classificacao === "A" ? "David Ágape" : undefined,
      inference_basis:
        classificacao === "I" ? "O post é a pista; o nexo não se conclui." : undefined,
      review_status: "published",
      created_at: "2026-09-01",
      updated_at: "2026-09-01",
    } as unknown as Corpus["evidence"][number]);
    return c;
  };

  const avisoDePista = (c: Corpus) =>
    lintCorpus(c).filter(
      (i) => i.level === "warning" && /como pista, não como prova/.test(i.message),
    );

  it("avisa quando um blog sustenta evidência documental", () => {
    expect(avisoDePista(comBlog("D"))).toHaveLength(1);
  });

  it("avisa quando um blog entra na corroboração", () => {
    expect(avisoDePista(comBlog("C"))).toHaveLength(1);
  });

  it("cala quando o blog sustenta uma alegação: é o uso que a política manda", () => {
    expect(avisoDePista(comBlog("A"))).toEqual([]);
  });

  it("cala quando o blog sustenta uma inferência: o caso do ainvestigacao.com", () => {
    expect(avisoDePista(comBlog("I"))).toEqual([]);
  });

  it("não avisa nada só por a fonte de blog existir no acervo", () => {
    const c = comBlog("I");
    c.evidence = c.evidence.filter((e) => e.id !== "ev-blog");
    expect(lintCorpus(c).filter((i) => i.level === "warning" && /blog/.test(i.message))).toEqual(
      [],
    );
  });
});
