import type { ScopePath } from '../../src/index.js'
import type { AccessTarget } from '../../src/server/index.js'

/**
 * Who Tasklane says is signed in, and what each may change: staff tune
 * everything, a workspace's owner its own values, and each member their own
 * settings in their workspace. A real app reads this from its session.
 */
export interface Person {
  id: string
  name: string
  staff?: boolean
  workspace: string
  owner?: boolean
}

export const people: Record<string, Person> = {
  sam: { id: 'sam', name: 'Sam', staff: true, workspace: 'acme' },
  olivia: { id: 'olivia', name: 'Olivia', workspace: 'acme', owner: true },
  dana: { id: 'dana', name: 'Dana', workspace: 'acme' }
}

/** The scope a person's own settings live at. */
export const scopeOf = (person: Person): ScopePath => ({ workspace: person.workspace, user: person.id })

/** Whether a person may read and change settings at a scope. Rule `the-host-decides-who-changes-each-scope`. */
export function mayUse(person: Person | undefined, target: AccessTarget): boolean {
  if (!person) return false
  if (person.staff) return true
  // Everyone signed in reads the description, so their own settings screen can show.
  if (target.kind === 'description') return true
  if (target.kind !== 'group' || target.scope?.workspace !== person.workspace) return false
  return target.scope.user ? target.scope.user === person.id : Boolean(person.owner)
}
