import {
  choice,
  defineCatalog,
  defineEffects,
  defineGroup,
  definePresets,
  number,
  pick,
  text,
  toggle
} from '../../src/index.js'

/**
 * Tasklane: a todo app with workspaces and the people in them, as tunables
 * holds its settings. Staff tune the system and the plans; a workspace owner
 * sets their workspace's own values within what its plan allows; each person
 * sets their own preferences. The docs, the playground and the scoped tests use
 * it.
 */

export const effects = defineEffects({
  members: { label: 'What everyone in the workspace sees', icon: 'i-lucide-users' },
  person: { label: 'Only this person', icon: 'i-lucide-user' },
  storage: { label: 'Storage the workspace uses', icon: 'i-lucide-hard-drive' },
  cost: { label: 'AI cost', warn: true, icon: 'i-lucide-coins' }
})

/** The places a setting can take its own value, broadest first. */
export const scopes = ['workspace', 'user'] as const

export const limits = defineGroup({
  id: 'limits',
  title: 'Limits',
  description: 'How much a workspace may hold and use. A workspace takes its plan\'s limits, and its owner may lower them for the workspace, never raise them.',
  place: { label: 'Admin › Limits', href: '/admin/limits' },
  fields: {
    maxProjects: number({ label: 'Projects', unit: 'count', default: 3, max: 10000, affects: ['members'], override: { workspace: 'at-most' }, help: 'The most projects a workspace may have open at once.' }),
    maxTasksPerProject: number({ label: 'Tasks per project', unit: 'count', default: 200, max: 100000, affects: ['members'], override: { workspace: 'at-most' }, help: 'The most open tasks one project may hold.' }),
    attachmentMb: number({ label: 'Attachment size', unit: 'megabytes', default: 10, max: 2048, affects: ['storage'], override: { workspace: 'at-most' }, help: 'The largest file a task may carry.' }),
    aiSuggestionsPerDay: number({ label: 'AI suggestions a day', unit: 'count', default: 20, min: 0, max: 10000, affects: ['cost'], override: { workspace: 'at-most', user: 'at-most' }, help: 'How many times a day one person may ask for task suggestions. Zero turns them off.' })
  }
})

export const workspace = defineGroup({
  id: 'workspace',
  title: 'Workspace',
  description: 'How a workspace works for everyone in it. Its owner sets these for the workspace; each person may set their own view and week.',
  place: { label: 'Workspace settings', href: '/workspace' },
  fields: {
    defaultView: choice({ label: 'Default view', options: [{ value: 'list', label: 'List' }, { value: 'board', label: 'Board' }, { value: 'calendar', label: 'Calendar' }], default: 'list', affects: ['members'], override: ['workspace', 'user'], help: 'How a project opens.' }),
    weekStartsOn: number({ label: 'Week starts on', unit: 'weekday', default: 1, affects: ['members'], override: ['workspace', 'user'], help: 'The first day of the week in calendars and due dates.' }),
    dueSoonDays: number({ label: 'Due soon', unit: 'days', default: 2, max: 30, affects: ['members'], override: ['workspace', 'user'], help: 'How many days before its due date a task shows as due soon.' }),
    reminderHour: number({ label: 'Reminder time', unit: 'hour', default: 9, affects: ['person'], override: ['user'], help: 'When the daily reminder of due tasks is sent.' }),
    archiveAfterDays: number({ label: 'Archive done tasks after', unit: 'days', default: 30, max: 365, affects: ['members'], override: ['workspace'], help: 'How long a done task stays in its project before it is archived.' }),
    guestAccess: toggle({ label: 'Guests', default: false, affects: ['members'], override: ['workspace'], help: 'Whether people outside the workspace may be invited to one project.' }),
    suggestionModel: pick({ label: 'Suggestion model', catalog: 'models', default: 'small', affects: ['cost'], help: 'The model that drafts task suggestions.' })
  },
  rules: values => values.dueSoonDays > values.archiveAfterDays
    ? [{ key: 'dueSoonDays', message: 'Due soon may not be longer than the time before done tasks are archived.' }]
    : [],
  confirm: (next, previous) => next.guestAccess && !previous.guestAccess
    ? 'Guests will see every task in the project they are invited to, including its comments and attachments.'
    : undefined
})

export const plans = definePresets({
  id: 'plans',
  title: 'Plans',
  singular: 'Plan',
  description: 'What a workspace may hold on each plan. A workspace takes the plan it is on, or the default plan, between the system limits and its own.',
  place: { label: 'Admin › Plans', href: '/admin/plans' },
  slots: ['plan'],
  layer: { group: 'limits', scope: 'workspace' },
  fields: {
    maxProjects: number({ label: 'Projects', unit: 'count', default: 3, max: 10000 }),
    maxTasksPerProject: number({ label: 'Tasks per project', unit: 'count', default: 200, max: 100000 }),
    attachmentMb: number({ label: 'Attachment size', unit: 'megabytes', default: 10, max: 2048 }),
    aiSuggestionsPerDay: number({ label: 'AI suggestions a day', unit: 'count', default: 20, min: 0, max: 10000 })
  },
  seed: [
    { key: 'free', slot: 'plan', label: 'Free', values: { maxProjects: 3, maxTasksPerProject: 200, attachmentMb: 10, aiSuggestionsPerDay: 5 } },
    { key: 'pro', slot: 'plan', label: 'Pro', values: { maxProjects: 50, maxTasksPerProject: 5000, attachmentMb: 100, aiSuggestionsPerDay: 100 } },
    { key: 'team', slot: 'plan', label: 'Team', values: { maxProjects: 500, maxTasksPerProject: 20000, attachmentMb: 500, aiSuggestionsPerDay: 500 } }
  ]
})

export const models = defineCatalog({
  id: 'models',
  title: 'Models',
  singular: 'Model',
  description: 'The models that may draft task suggestions. A retired model stays readable until nothing picks it.',
  place: { label: 'Admin › Models', href: '/admin/models' },
  idLabel: 'Model id',
  labelField: 'label',
  fields: {
    label: text({ label: 'Label', default: '', optional: false, maxLength: 80 }),
    centsPerSuggestion: number({ label: 'Cost a suggestion', unit: 'count', default: 1, affects: ['cost'], help: 'What one suggestion costs, in cents.' })
  },
  seed: [
    { id: 'small', values: { label: 'Small and quick', centsPerSuggestion: 1 } },
    { id: 'large', values: { label: 'Large and careful', centsPerSuggestion: 5 } }
  ]
})

export const groups = [limits, workspace] as const
export const presets = [plans] as const
export const catalogs = [models] as const

/** How a scope reads to a person: Tasklane names its workspaces and people. */
export const names: Record<string, string> = {
  'workspace:acme': 'Acme',
  'workspace:hobby': 'Hobby club',
  'user:dana': 'Dana',
  'user:lee': 'Lee'
}
export const scopeLabel = (scope: string, id: string) => names[`${scope}:${id}`] ?? `${scope.charAt(0).toUpperCase()}${scope.slice(1)} ${id}`
