import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";
import { z } from "zod";
import { COLLECTIONS, type CollectionName, type Corpus } from "../../src/lib/schema";

export interface LoadIssue {
  level: "error" | "warning";
  file: string;
  message: string;
  /** Falso quando o registro ainda não está publicado (avisos não bloqueiam em modo estrito). */
  published?: boolean;
}

export interface LoadResult {
  corpus: Corpus;
  issues: LoadIssue[];
}

const COLLECTION_TO_CORPUS: Record<CollectionName, keyof Omit<Corpus, "built_at">> = {
  people: "people",
  organizations: "organizations",
  events: "events",
  relationships: "relationships",
  claims: "claims",
  sources: "sources",
  documents: "documents",
  "public-acts": "public_acts",
  transactions: "transactions",
  evidence: "evidence",
  sequences: "sequences",
  revisions: "revisions",
};

export interface LoadOptions {
  dataDir: string;
  includeDrafts: boolean;
}

function listYaml(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".yaml") || f.endsWith(".yml"))
    .sort()
    .map((f) => path.join(dir, f));
}

function formatZodError(err: z.ZodError): string {
  return err.issues
    .map((i) => `${i.path.length ? i.path.join(".") : "<root>"}: ${i.message}`)
    .join("; ");
}

/**
 * Lê /data, valida cada arquivo pelo schema da coleção e devolve o corpus.
 * Cada arquivo YAML contém exatamente UM registro; o nome do arquivo deve ser `<id>.yaml`.
 */
export function loadCorpus(opts: LoadOptions): LoadResult {
  const issues: LoadIssue[] = [];
  const corpus: Corpus = {
    built_at: new Date().toISOString(),
    people: [],
    organizations: [],
    events: [],
    relationships: [],
    claims: [],
    sources: [],
    documents: [],
    public_acts: [],
    transactions: [],
    evidence: [],
    sequences: [],
    revisions: [],
  };

  const seenIds = new Map<string, string>();

  for (const collection of Object.keys(COLLECTIONS) as CollectionName[]) {
    const schema = COLLECTIONS[collection];
    const dir = path.join(opts.dataDir, collection);
    for (const file of listYaml(dir)) {
      const rel = path.relative(opts.dataDir, file).replace(/\\/g, "/");
      let raw: unknown;
      try {
        raw = YAML.parse(fs.readFileSync(file, "utf8"));
      } catch (e) {
        issues.push({ level: "error", file: rel, message: `YAML inválido: ${(e as Error).message}` });
        continue;
      }
      const parsed = schema.safeParse(raw);
      if (!parsed.success) {
        issues.push({ level: "error", file: rel, message: formatZodError(parsed.error) });
        continue;
      }
      const record = parsed.data;
      const expected = path.basename(file).replace(/\.ya?ml$/, "");
      if (record.id !== expected) {
        issues.push({
          level: "error",
          file: rel,
          message: `id "${record.id}" difere do nome do arquivo "${expected}"`,
        });
        continue;
      }
      if (seenIds.has(record.id)) {
        issues.push({
          level: "error",
          file: rel,
          message: `id duplicado "${record.id}" (já em ${seenIds.get(record.id)})`,
        });
        continue;
      }
      seenIds.set(record.id, rel);

      const reviewStatus = "review_status" in record ? record.review_status : "published";
      if (reviewStatus === "retracted") continue;
      if (reviewStatus !== "published" && !opts.includeDrafts) {
        issues.push({
          level: "warning",
          file: rel,
          message: `review_status=${reviewStatus}: excluído do build público`,
          published: false,
        });
        continue;
      }

      const key = COLLECTION_TO_CORPUS[collection];
      (corpus[key] as unknown[]).push(record);
    }
  }

  return { corpus, issues };
}
