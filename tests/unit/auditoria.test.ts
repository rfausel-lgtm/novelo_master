import { describe, it, expect } from "vitest";
import { minimalCorpus } from "./fixtures";
import { verificarIntegridade } from "../../scripts/lib/auditoria/integridade";
import { limiteInferior, limiteSuperior, verificarDatas } from "../../scripts/lib/auditoria/datas";
import {
  distanciaEdicao,
  normalizarUrl,
  palavraTrocada,
  verificarDuplicidade,
} from "../../scripts/lib/auditoria/duplicidade";
import { ordenarAchados, novoAchado } from "../../scripts/lib/auditoria/tipos";
import {
  arquivosAlterados,
  estadoVazio,
  selecionar,
  type RegistroSelecionado,
} from "../../scripts/lib/auditoria/selecao";

const HOJE = "2026-09-17";
const mensagens = (achados: { mensagem: string }[]) => achados.map((a) => a.mensagem);

describe("auditoria — integridade referencial e órfãos", () => {
  it("o corpus mínimo não tem órfão", () => {
    expect(verificarIntegridade(minimalCorpus())).toEqual([]);
  });

  it("acusa fonte que nenhum registro cita", () => {
    const c = minimalCorpus();
    c.sources.push({ ...c.sources[0], id: "src-ninguem-cita" });
    const achados = verificarIntegridade(c);
    expect(achados).toHaveLength(1);
    expect(achados[0]).toMatchObject({
      categoria: "integridade",
      gravidade: "baixa",
      arquivo: "data/sources/src-ninguem-cita.yaml",
      registro: "src-ninguem-cita",
    });
  });

  it("acusa evidência órfã com gravidade maior que a de fonte órfã", () => {
    const c = minimalCorpus();
    c.evidence.push({ ...c.evidence[0], id: "ev-orfa" });
    const achados = verificarIntegridade(c);
    expect(achados).toHaveLength(1);
    expect(achados[0]).toMatchObject({ registro: "ev-orfa", gravidade: "media" });
  });

  it("enxerga citação em campo aninhado (cited_position.source_ids)", () => {
    const c = minimalCorpus();
    c.sources.push({ ...c.sources[0], id: "src-so-no-contraditorio" });
    c.people[0].cited_position = [
      { kind: "denial", summary: "Negou.", source_ids: ["src-so-no-contraditorio"] },
    ];
    expect(verificarIntegridade(c)).toEqual([]);
  });

  it("acusa affected_ids de revisão apontando para id inexistente — o lint não olha revisões", () => {
    const c = minimalCorpus();
    c.revisions.push({
      id: "rev-2026-09-17-lote-1",
      kind: "revision",
      date: "2026-09-17",
      summary: "Lote de teste.",
      added: {
        people: 0,
        organizations: 0,
        events: 0,
        documents: 0,
        relationships: 0,
        sources: 0,
        evidence: 0,
      },
      updated_relationships: 0,
      corrections: [],
      affected_ids: ["pessoa-a", "pessoa-que-nao-existe"],
    });
    const achados = verificarIntegridade(c);
    expect(mensagens(achados).join()).toContain("pessoa-que-nao-existe");
    expect(achados[0].gravidade).toBe("media");
  });
});

describe("auditoria — datas impossíveis", () => {
  it("o corpus mínimo não tem data impossível", () => {
    expect(verificarDatas(minimalCorpus(), HOJE)).toEqual([]);
  });

  it("data parcial vira intervalo nos dois extremos", () => {
    expect(limiteInferior("2024")).toBe("2024-01-01");
    expect(limiteSuperior("2024")).toBe("2024-12-31");
    expect(limiteSuperior("2024-02")).toBe("2024-02-29");
    expect(limiteSuperior("2023-02")).toBe("2023-02-28");
  });

  it("acusa data futura", () => {
    const c = minimalCorpus();
    c.events[0].date = "2027-01-15";
    expect(mensagens(verificarDatas(c, HOJE)).join()).toContain("é futura");
  });

  it("não acusa data parcial que ainda pode estar no passado", () => {
    const c = minimalCorpus();
    c.events[0].date = "2026";
    expect(verificarDatas(c, HOJE)).toEqual([]);
  });

  it("acusa fim anterior ao início, com gravidade alta", () => {
    const c = minimalCorpus();
    c.relationships[1].start_date = "2025-06-01";
    c.relationships[1].end_date = "2024-01-01";
    const achado = verificarDatas(c, HOJE).find((a) => a.mensagem.includes("anterior ao início"));
    expect(achado?.gravidade).toBe("alta");
  });

  it("não acusa start_date mais preciso que o end_date do mesmo ano", () => {
    const c = minimalCorpus();
    c.relationships[1].start_date = "2024-05";
    c.relationships[1].end_date = "2024";
    expect(verificarDatas(c, HOJE)).toEqual([]);
  });

  it("acusa captura anterior à publicação da fonte", () => {
    const c = minimalCorpus();
    c.sources[0].publication_date = "2026-09-08";
    c.sources[0].retrieved_at = "2026-09-06";
    expect(mensagens(verificarDatas(c, HOJE)).join()).toContain("retrieved_at");
  });

  it("acusa data anterior ao marco plausível", () => {
    const c = minimalCorpus();
    c.events[0].date = "1804-02-11";
    expect(mensagens(verificarDatas(c, HOJE)).join()).toContain("anterior a 1900");
  });

  it("acusa cargo com fim antes do início", () => {
    const c = minimalCorpus();
    c.people[0].positions = [
      {
        title: "Diretor",
        organization_id: "org-x",
        start_date: "2020",
        end_date: "2018",
        source_ids: [],
      },
    ];
    expect(mensagens(verificarDatas(c, HOJE)).join()).toContain("positions[0]");
  });
});

describe("auditoria — duplicidade provável", () => {
  it("o corpus mínimo não tem duplicidade", () => {
    expect(verificarDuplicidade(minimalCorpus())).toEqual([]);
  });

  it("normaliza a URL antes de comparar", () => {
    expect(normalizarUrl("https://www.Jornal.com/materia/?utm_source=x#topo")).toBe(
      normalizarUrl("http://jornal.com/materia"),
    );
  });

  it("acusa duas fontes com a mesma URL", () => {
    const c = minimalCorpus();
    c.sources.push({
      ...c.sources[1],
      id: "src-imprensa-de-novo",
      url: "https://www.jornal.example/x/",
    });
    const achados = verificarDuplicidade(c);
    expect(achados).toHaveLength(1);
    expect(achados[0]).toMatchObject({ registro: "src-imprensa-de-novo", gravidade: "media" });
  });

  it("acusa dois documentos com o mesmo sha256", () => {
    const c = minimalCorpus();
    const sha = "a".repeat(64);
    c.documents[0].sha256 = sha;
    c.documents.push({ ...c.documents[0], id: "doc-2", sha256: sha });
    expect(mensagens(verificarDuplicidade(c)).join()).toContain("sha256 idêntico");
  });

  it("acusa nome quase idêntico — erro de digitação que o lint não pega", () => {
    const c = minimalCorpus();
    c.people.push({ ...c.people[0], id: "daniel-vorcato", name: "Daniel Vorcato", source_ids: [] });
    c.people[0].name = "Daniel Vorcaro";
    expect(mensagens(verificarDuplicidade(c)).join()).toContain("nome quase idêntico");
  });

  it("cala quando distinct_from declara que são registros diferentes", () => {
    const c = minimalCorpus();
    c.people.push({ ...c.people[0], id: "daniel-vorcato", name: "Daniel Vorcato", source_ids: [] });
    c.people[0].name = "Daniel Vorcaro";
    c.people[0].distinct_from = ["daniel-vorcato"];
    expect(verificarDuplicidade(c)).toEqual([]);
  });

  it("não repete o que o lint já diz: rótulo idêntico e tokens contidos ficam de fora", () => {
    const c = minimalCorpus();
    c.people.push({ ...c.people[0], id: "outra-pessoa-a", name: "Pessoa A", source_ids: [] });
    expect(verificarDuplicidade(c)).toEqual([]);
  });

  it("palavra curta fica de fora: nela uma letra é o que distingue quem é quem", () => {
    /* "Pessoa A" e "Pessoa B" estão a uma letra de distância e são duas pessoas. */
    expect(distanciaEdicao("pessoa a", "pessoa b")).toBe(1);
    expect(palavraTrocada(["pessoa", "a"], ["pessoa", "b"])).toBeUndefined();
    expect(palavraTrocada(["jose", "silva"], ["joao", "silva"])).toBeUndefined();
    expect(palavraTrocada(["daniel", "vorcaro"], ["daniel", "vorcato"])).toMatchObject({
      distancia: 1,
    });
    /* Duas palavras diferentes não são erro de digitação. */
    expect(palavraTrocada(["banco", "master"], ["bando", "muster"])).toBeUndefined();
    expect(verificarDuplicidade(minimalCorpus())).toEqual([]);
  });

  it("acusa relação repetida sem data — o lint só compara start_date", () => {
    const c = minimalCorpus();
    c.relationships.push({ ...c.relationships[0], id: "rel-pessoa-a-org-x-corporate-2" });
    expect(mensagens(verificarDuplicidade(c)).join()).toContain("nenhuma data");
  });
});

describe("auditoria — saída estável", () => {
  it("o id do achado é função do conteúdo, e a ordem é total", () => {
    const a = novoAchado({
      categoria: "datas",
      gravidade: "media",
      arquivo: "data/x.yaml",
      mensagem: "m",
    });
    const b = novoAchado({
      categoria: "datas",
      gravidade: "media",
      arquivo: "data/x.yaml",
      mensagem: "m",
    });
    expect(a.id).toBe(b.id);

    const desordenados = [
      novoAchado({ categoria: "zzz", gravidade: "baixa", arquivo: "data/b.yaml", mensagem: "1" }),
      novoAchado({ categoria: "aaa", gravidade: "alta", arquivo: "data/a.yaml", mensagem: "2" }),
      novoAchado({ categoria: "aaa", gravidade: "media", arquivo: "data/a.yaml", mensagem: "3" }),
    ];
    const ordem = ordenarAchados(desordenados).map((a) => a.gravidade);
    expect(ordem).toEqual(["alta", "media", "baixa"]);
    expect(ordenarAchados(desordenados)).toEqual(ordenarAchados([...desordenados].reverse()));
  });
});

describe("auditoria — seleção da noite", () => {
  const acervo = (n: number): RegistroSelecionado[] =>
    Array.from({ length: n }, (_, i) => ({
      id: `p-${i}`,
      colecao: "people",
      arquivo: `data/people/p-${i}.yaml`,
      motivo: "amostra-rotativa" as const,
    }));

  it("lê os caminhos de data/ da saída do git log e ignora o resto", () => {
    const saida = [
      "",
      "data/people/a.yaml",
      "src/app/page.tsx",
      "data/sources/b.yaml",
      "data/people/a.yaml",
    ].join("\n");
    expect(arquivosAlterados(saida)).toEqual(["data/people/a.yaml", "data/sources/b.yaml"]);
  });

  it("o alterado entra primeiro e a amostra completa o teto", () => {
    const { registros } = selecionar({
      todos: acervo(10),
      alterados: ["data/people/p-7.yaml"],
      estado: estadoVazio(),
      teto: 3,
    });
    expect(registros.map((r) => r.arquivo)).toEqual([
      "data/people/p-7.yaml",
      "data/people/p-0.yaml",
      "data/people/p-1.yaml",
    ]);
    expect(registros[0].motivo).toBe("alterado-nas-ultimas-24h");
    expect(registros[1].motivo).toBe("amostra-rotativa");
  });

  it("a amostra tem fatia reservada: um lote grande não a expulsa da noite", () => {
    const todos = acervo(100);
    const { registros, estado } = selecionar({
      todos,
      alterados: todos.slice(50).map((r) => r.arquivo),
      estado: estadoVazio(),
      teto: 60,
    });
    expect(registros).toHaveLength(60);
    const daAmostra = registros.filter((r) => r.motivo === "amostra-rotativa");
    expect(daAmostra.length).toBeGreaterThanOrEqual(20);
    /* E o ponteiro andou: sem isso o acervo antigo nunca mais seria lido. */
    expect(estado.cursor).not.toBeNull();
  });

  it("nenhum registro entra duas vezes na mesma noite", () => {
    const { registros } = selecionar({
      todos: acervo(4),
      alterados: ["data/people/p-1.yaml"],
      estado: estadoVazio(),
      teto: 4,
    });
    expect(new Set(registros.map((r) => r.arquivo)).size).toBe(registros.length);
  });

  it("a amostra retoma de onde parou e dá a volta no acervo", () => {
    const todos = acervo(5);
    let estado = estadoVazio();
    const vistos: string[] = [];
    for (let noite = 0; noite < 3; noite++) {
      const r = selecionar({ todos, alterados: [], estado, teto: 2 });
      vistos.push(...r.registros.map((x) => x.arquivo));
      estado = r.estado;
    }
    expect(vistos).toEqual([
      "data/people/p-0.yaml",
      "data/people/p-1.yaml",
      "data/people/p-2.yaml",
      "data/people/p-3.yaml",
      "data/people/p-4.yaml",
      "data/people/p-0.yaml",
    ]);
    expect(estado.voltas).toBe(1);
  });

  it("respeita o teto mesmo quando tudo mudou", () => {
    const todos = acervo(100);
    const { registros } = selecionar({
      todos,
      alterados: todos.map((r) => r.arquivo),
      estado: estadoVazio(),
      teto: 60,
    });
    expect(registros).toHaveLength(60);
    expect(registros.every((r) => r.motivo === "alterado-nas-ultimas-24h")).toBe(true);
  });

  it("acervo menor que o teto: o que mudou volta e ocupa a reserva não usada", () => {
    const todos = acervo(5);
    const { registros } = selecionar({
      todos,
      alterados: todos.map((r) => r.arquivo),
      estado: estadoVazio(),
      teto: 60,
    });
    expect(registros).toHaveLength(5);
  });
});
