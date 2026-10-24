/**
 * The storage contract. tunables keeps four things, and any database that can
 * hold them, in a transaction, behind a lock, can store tunables:
 *
 * - a group's values, one row per group;
 * - revisions, appended and never changed;
 * - records, the presets and catalog entries, as JSON by collection and id;
 * - assignments of presets to subjects.
 *
 * Postgres implements it in `tunables/postgres`; `memoryStore` implements it in
 * memory for tests and the playground. spec/storage.md is the contract.
 */

export interface StoredGroup {
  id: string
  /**
   * Where in the chain of scopes the row sits: `''` for the system, which holds
   * every field, or a scope key such as `workspace=w1;user=u7`, which holds only
   * the fields overridden there. See spec/scopes.md.
   */
  scope: string
  values: Record<string, unknown>
  updatedAt: string | null
  updatedBy: string | null
}

/** What a revision is about: a group, a preset, a catalog entry or an assignment. */
export interface RevisionTarget {
  kind: 'group' | 'preset' | 'catalog' | 'assignment'
  /** The group, preset set or catalog id. */
  name: string
  /** The preset key, entry id or assigned subject. Absent for a group. */
  id?: string
}

export interface Change {
  key: string
  from: unknown
  to: unknown
}

export interface Revision {
  /** Increasing: a later revision has a larger id. */
  id: string
  target: RevisionTarget
  actor: string | null
  reason: string | null
  changes: Change[]
  /** The whole of the target after the change, so it can be restored. Null when it was removed. */
  snapshot: unknown
  at: string
}

export type NewRevision = Omit<Revision, 'id' | 'at'>

export interface StoredRecord {
  collection: string
  id: string
  data: Record<string, unknown>
  createdAt: string | null
  updatedAt: string | null
}

export interface Assignment {
  collection: string
  subject: string
  slot: string
  recordId: string
}

export interface RevisionQuery {
  limit: number
  /** Only revisions older than this id. */
  before?: string
}

/** One unit of work: reads and writes that commit together. */
export interface StoreSession {
  /**
   * Hold the tunables lock until the transaction ends. Exclusive for a change to
   * tunables; shared for a host write that depends on them, so a limit cannot be
   * lowered under it.
   */
  lock(mode: 'shared' | 'exclusive'): Promise<void>
  /** Rows at one scope, the system's by default. */
  readGroups(ids?: readonly string[], scope?: string): Promise<StoredGroup[]>
  /** Every scoped row of a group (not the system row), in key order. */
  readScopes(id: string): Promise<StoredGroup[]>
  writeGroup(group: StoredGroup): Promise<void>
  /** Remove a scoped row once it overrides nothing. */
  deleteGroup(id: string, scope: string): Promise<void>
  appendRevision(revision: NewRevision): Promise<Revision>
  listRevisions(target: RevisionTarget, query: RevisionQuery): Promise<Revision[]>
  getRevision(id: string): Promise<Revision | undefined>
  listRecords(collection: string): Promise<StoredRecord[]>
  putRecord(record: Omit<StoredRecord, 'createdAt' | 'updatedAt'>): Promise<void>
  deleteRecord(collection: string, id: string): Promise<void>
  listAssignments(collection: string, filter?: { subject?: string, recordId?: string }): Promise<Assignment[]>
  putAssignment(assignment: Assignment): Promise<void>
  deleteAssignment(collection: string, subject: string, slot: string): Promise<void>
}

export interface TunablesStore extends StoreSession {
  /** Run `work` in one transaction: everything it writes commits together or not at all. */
  transaction<T>(work: (session: StoreSession) => Promise<T>): Promise<T>
  /**
   * The same store inside a transaction the host app already has open, so a
   * host write and a tunables read or lock commit together. Each adapter says
   * what `host` is: for Postgres, the transaction's client.
   */
  within?(host: unknown): StoreSession
}
