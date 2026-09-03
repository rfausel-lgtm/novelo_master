import { describe, it, expect } from "vitest";
import { RelationshipSchema, SourceSchema, PhotoSchema, IdSchema, PartialDateSchema } from "@/lib/schema";

describe("schemas", () => {
  it("ids devem ser kebab-case ascii", () => {
    expect(IdSchema.safeParse("daniel-vorcaro").success).toBe(true);
    expect(IdSchema.safeParse("Daniel Vorcaro").success).toBe(false);
    expect(IdSchema.safeParse("são-paulo").success).toBe(false);
  });

  it("datas parciais aceitam YYYY, YYYY-MM e YYYY-MM-DD", () => {
    expect(PartialDateSchema.safeParse("2024").success).toBe(true);
    expect(PartialDateSchema.safeParse("2024-08").success).toBe(true);
    expect(PartialDateSchema.safeParse("2024-08-13").success).toBe(true);
    expect(PartialDateSchema.safeParse("13/08/2024").success).toBe(false);
  });

  it("relação exige description, label, evidence_class e confidence", () => {
    const r = RelationshipSchema.safeParse({
      id: "rel-a-b-x",
      kind: "relationship",
      from_id: "a",
      to_id: "b",
      relationship_type: "political",
      label: "x",
      created_at: "2026-09-01",
      updated_at: "2026-09-01",
    });
    expect(r.success).toBe(false);
  });

  it("fonte exige url válida e retrieved_at", () => {
    const s = SourceSchema.safeParse({
      id: "src-x",
      kind: "source",
      title: "t",
      publisher: "p",
      url: "not a url",
      source_type: "press",
      created_at: "2026-09-01",
      updated_at: "2026-09-01",
    });
    expect(s.success).toBe(false);
  });

  it("foto exige licença, autor, origem e data de captura", () => {
    expect(PhotoSchema.safeParse({ path: "/x.webp", alt: "x" }).success).toBe(false);
    expect(
      PhotoSchema.safeParse({
        path: "/x.webp",
        alt: "x",
        source: "Wikimedia Commons",
        author: "Autor",
        license: "CC BY-SA 4.0",
        original_url: "https://commons.wikimedia.org/x",
        retrieved_at: "2026-09-01",
      }).success,
    ).toBe(true);
  });
});
