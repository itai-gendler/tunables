import type {
  Assignment,
  NewRevision,
  Revision,
  RevisionQuery,
  RevisionTarget,
  StoreSession,
  StoredGroup,
  StoredRecord,
  TunablesStore
} from './store.js'

interface State {
  groups: Map<string, StoredGroup>
  revisions: Revision[]
  records: Map<string, StoredRecord>
  assignments: Map<string, Assignment>
  nextRevision: number
}

const clone = <T>(value: T): T => structuredClone(value)
const recordKey = (collection: string, id: string) => `${collection}\u0000${id}`
const groupKey = (id: string, scope: string) => `${id}\u0000${scope}`
const assignmentKey = (collection: string, subject: string, slot: string) => `${collection}\u0000${subject}\u0000${slot}`
const sameTarget = (a: RevisionTarget, b: RevisionTarget) => a.kind === b.kind && a.name === b.name && (a.id ?? null) === (b.id ?? null)

function copyState(state: State): State {
  return {
    groups: new Map([...state.groups].map(([key, value]) => [key, clone(value)])),
    revisions: state.revisions.map(clone),
    records: new Map([...state.records].map(([key, value]) => [key, clone(value)])),
    assignments: new Map([...state.assignments].map(([key, value]) => [key, clone(value)])),
    nextRevision: state.nextRevision
  }
}

function sessionOver(state: () => State, lock: (mode: 'shared' | 'exclusive') => Promise<void>, now: () => Date): StoreSession {
  return {
    lock,
    async readGroups(ids, scope = '') {
      const all = [...state().groups.values()].filter(group => group.scope === scope)
      return clone(ids ? all.filter(group => ids.includes(group.id)) : all)
    },
    async readScopes(id) {
      return clone([...state().groups.values()].filter(group => group.id === id && group.scope !== '')
        .sort((a, b) => a.scope.localeCompare(b.scope)))
    },
    async writeGroup(group) {
      state().groups.set(groupKey(group.id, group.scope), clone(group))
    },
    async deleteGroup(id, scope) {
      state().groups.delete(groupKey(id, scope))
    },
    async appendRevision(revision: NewRevision) {
      const current = state()
      const stored: Revision = { ...clone(revision), id: String(current.nextRevision++), at: now().toISOString() }
      current.revisions.push(stored)
      return clone(stored)
    },
    async listRevisions(target: RevisionTarget, query: RevisionQuery) {
      const before = query.before === undefined ? Infinity : Number(query.before)
      return clone(state().revisions
        .filter(revision => sameTarget(revision.target, target) && Number(revision.id) < before)
        .sort((a, b) => Number(b.id) - Number(a.id))
        .slice(0, query.limit))
    },
    async getRevision(id) {
      const found = state().revisions.find(revision => revision.id === id)
      return found ? clone(found) : undefined
    },
    async listRecords(collection) {
      return clone([...state().records.values()].filter(record => record.collection === collection)
        .sort((a, b) => a.id.localeCompare(b.id)))
    },
    async putRecord(record) {
      const key = recordKey(record.collection, record.id)
      const existing = state().records.get(key)
      const stamp = now().toISOString()
      state().records.set(key, { ...clone(record), createdAt: existing?.createdAt ?? stamp, updatedAt: stamp })
    },
    async deleteRecord(collection, id) {
      state().records.delete(recordKey(collection, id))
    },
    async listAssignments(collection, filter = {}) {
      return clone([...state().assignments.values()].filter(assignment =>
        assignment.collection === collection
        && (filter.subject === undefined || assignment.subject === filter.subject)
        && (filter.recordId === undefined || assignment.recordId === filter.recordId)))
    },
    async putAssignment(assignment) {
      state().assignments.set(assignmentKey(assignment.collection, assignment.subject, assignment.slot), clone(assignment))
    },
    async deleteAssignment(collection, subject, slot) {
      state().assignments.delete(assignmentKey(collection, subject, slot))
    }
  }
}

/**
 * A store that keeps everything in this process, for tests, the playground and
 * trying tunables out. Transactions are serialized and roll back on error, so
 * it behaves as a database would for one process.
 */
export function memoryStore(options: { now?: () => Date } = {}): TunablesStore & { reset(): void } {
  const now = options.now ?? (() => new Date())
  let committed: State = { groups: new Map(), revisions: [], records: new Map(), assignments: new Map(), nextRevision: 1 }
  let queue: Promise<unknown> = Promise.resolve()

  const outside = sessionOver(() => committed, async () => {}, now)

  return {
    ...outside,
    async transaction(work) {
      const run = queue.then(async () => {
        const draft = copyState(committed)
        const result = await work(sessionOver(() => draft, async () => {}, now))
        committed = draft
        return result
      })
      queue = run.catch(() => undefined)
      return run
    },
    within() {
      return outside
    },
    reset() {
      committed = { groups: new Map(), revisions: [], records: new Map(), assignments: new Map(), nextRevision: 1 }
    }
  }
}
