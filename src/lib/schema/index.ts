export * from "./common";
export * from "./entities";

import { z } from "zod";
import {
  PersonSchema,
  OrganizationSchema,
  EventSchema,
  RelationshipSchema,
  ClaimSchema,
  SourceSchema,
  DocumentSchema,
  PublicActSchema,
  TransactionSchema,
  EvidenceSchema,
  TemporalSequenceSchema,
  RevisionSchema,
  type Person,
  type Organization,
  type Event,
  type Relationship,
  type Claim,
  type Source,
  type Document,
  type PublicAct,
  type Transaction,
  type Evidence,
  type TemporalSequence,
  type Revision,
} from "./entities";

/** Mapa diretório em /data → schema. */
export const COLLECTIONS = {
  people: PersonSchema,
  organizations: OrganizationSchema,
  events: EventSchema,
  relationships: RelationshipSchema,
  claims: ClaimSchema,
  sources: SourceSchema,
  documents: DocumentSchema,
  "public-acts": PublicActSchema,
  transactions: TransactionSchema,
  evidence: EvidenceSchema,
  sequences: TemporalSequenceSchema,
  revisions: RevisionSchema,
} as const;

export type CollectionName = keyof typeof COLLECTIONS;

export const AnyRecordSchema = z.discriminatedUnion("kind", [
  PersonSchema,
  OrganizationSchema,
  EventSchema,
  RelationshipSchema,
  ClaimSchema,
  SourceSchema,
  DocumentSchema,
  PublicActSchema,
  TransactionSchema,
  EvidenceSchema,
  TemporalSequenceSchema,
  RevisionSchema,
]);
export type AnyRecord = z.infer<typeof AnyRecordSchema>;

/** Corpus compilado (saída de scripts/build-data.ts → src/generated/corpus.json). */
export interface Corpus {
  built_at: string;
  people: Person[];
  organizations: Organization[];
  events: Event[];
  relationships: Relationship[];
  claims: Claim[];
  sources: Source[];
  documents: Document[];
  public_acts: PublicAct[];
  transactions: Transaction[];
  evidence: Evidence[];
  sequences: TemporalSequence[];
  revisions: Revision[];
}

export type EntityRecord = Person | Organization;
export type NodeRecord = Person | Organization | Event | PublicAct;
