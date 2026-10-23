import {
  choice,
  choices,
  defineCatalog,
  defineEffects,
  defineEnvironment,
  defineGroup,
  definePresets,
  env,
  number,
  pick,
  range,
  size,
  text,
  toggle,
  type Guard,
  type NotesProvider,
  type Unit
} from '../src/index.js'

/**
 * The fixture: news (imupdated) as tunables would hold it. Its three settings
 * groups, its Run Configs as presets and its permitted models as a catalog, with
 * the rules news enforces today. It is the verification that tunables fits the
 * app it was extracted from; tests, the playground and the CLI checks use it.
 */

/** news prices models per million tokens: a unit of the app's own. */
export const units = {
  'dollars-per-million': { label: 'dollars per million tokens', format: (value: number) => `$${value} per million tokens` }
} satisfies Record<string, Unit>

export const effects = defineEffects({
  readers: { label: 'What readers get', icon: 'i-lucide-users' },
  layout: { label: 'Reader screens must fit the maximum', icon: 'i-lucide-layout' },
  cost: { label: 'Model cost', warn: true, icon: 'i-lucide-coins' },
  runConfigs: { label: 'Run Configs checked against it', icon: 'i-lucide-sliders-horizontal' },
  rescreen: { label: 'Saved Screening judgments are redone', warn: true, icon: 'i-lucide-refresh-cw' },
  feeds: { label: 'Feed configurations checked against it', icon: 'i-lucide-rss' },
  load: { label: 'Worker, database or publisher load', icon: 'i-lucide-gauge' },
  admin: { label: 'Administration views only', icon: 'i-lucide-shield' }
})

const WORKER = 'Scheduled collection and the worker'
const NEW_FEEDS = 'What a new Feed starts with'
const BOUNDS = 'The bounds of a retrieval'
const READING = 'What a retrieval reads and keeps'
const QUEUE = 'Retries, the queue and recovery'

export const collection = defineGroup({
  id: 'collection',
  title: 'Collection Settings',
  description: 'Which Feeds the worker keeps collected and how often, how it collects, what a new Feed starts with, and the bounds every retrieval stays within.',
  entity: 'collection-settings',
  place: { label: 'Feeds › Settings', href: '/admin/feeds/settings' },
  fields: {
    checkIntervalMinutes: number({ fact: 'Check interval', unit: 'minutes', default: 5, section: WORKER, affects: ['load', 'readers'] }),
    scheduledCollection: choice({
      fact: 'Scheduled collection',
      options: [{ value: 'off', label: 'Off' }, { value: 'brief-feeds', label: 'Feeds Briefs read' }, { value: 'every-feed', label: 'Every Feed' }],
      default: 'brief-feeds',
      section: WORKER,
      affects: ['load', 'readers']
    }),
    refreshMinutes: number({ fact: 'Refresh interval', unit: 'minutes', default: 60, section: WORKER, affects: ['load', 'readers'] }),
    feedsAtOnce: number({ fact: 'Feeds at once per worker', unit: 'count', default: 2, section: WORKER, affects: ['load'] }),
    workerContactSeconds: number({ fact: 'Worker contact interval', unit: 'seconds', default: 15, section: WORKER, affects: ['load'] }),
    newFeedLookbackDays: number({ fact: 'New-feed lookback days', unit: 'days', default: 30, section: NEW_FEEDS, affects: ['readers'] }),
    newFeedMaxArticles: number({ fact: 'New-feed articles per retrieval', unit: 'count', default: 100, section: NEW_FEEDS, affects: ['readers'] }),
    newFeedFullText: toggle({ fact: 'New-feed full text', default: true, section: NEW_FEEDS, affects: ['readers', 'cost'] }),
    newFeedEnabled: toggle({ fact: 'New-feed collection enabled', default: true, section: NEW_FEEDS, affects: ['readers'] }),
    maxArticlesPerRetrieval: number({ fact: 'Most articles per retrieval', unit: 'count', default: 500, section: BOUNDS, affects: ['feeds', 'readers'] }),
    maxLookbackDays: number({ fact: 'Longest lookback', unit: 'days', default: 365, section: BOUNDS, affects: ['feeds', 'readers'] }),
    largestResponseMegabytes: number({ fact: 'Largest response', unit: 'megabytes', default: 2, integer: false, section: BOUNDS, affects: ['readers', 'load'] }),
    requestSeconds: number({ fact: 'Request time limit', unit: 'seconds', default: 15, section: BOUNDS, affects: ['readers', 'load'] }),
    attemptSeconds: number({ fact: 'Attempt time limit', unit: 'seconds', default: 300, section: BOUNDS, affects: ['readers', 'load'] }),
    articleTextCharacters: number({ fact: 'Article text kept', unit: 'characters', default: 100000, section: READING, affects: ['readers', 'cost'] }),
    imageMinimum: size({ fact: 'Image minimum size', default: { width: 400, height: 225 }, section: READING, affects: ['readers'] }),
    jobExpirySeconds: number({ fact: 'Job expiry', unit: 'seconds', default: 360, section: QUEUE, affects: ['load'] }),
    jobHeartbeatSeconds: number({ fact: 'Job heartbeat', unit: 'seconds', default: 30, section: QUEUE, affects: ['load'] }),
    workerUnresponsiveSeconds: number({ fact: 'Worker unresponsive after', unit: 'seconds', default: 60, section: QUEUE, affects: ['admin'] })
  },
  rules: (values) => {
    const problems: string[] = []
    if (!(values.jobExpirySeconds > values.attemptSeconds)) problems.push('Job expiry must be longer than Attempt time limit.')
    if (!(values.jobHeartbeatSeconds < values.jobExpirySeconds)) problems.push('Job heartbeat must be shorter than Job expiry.')
    if (!(values.workerUnresponsiveSeconds > values.workerContactSeconds)) problems.push('Worker unresponsive after must be longer than Worker contact interval.')
    if (values.newFeedLookbackDays > values.maxLookbackDays) problems.push('New-feed lookback days may not exceed the Longest lookback.')
    if (values.newFeedMaxArticles > values.maxArticlesPerRetrieval) problems.push('New-feed articles per retrieval may not exceed the Most articles per retrieval.')
    return problems
  }
})

const LIMITS = 'Limits every Run Config and Run stays within'
const SCHEDULED = 'Scheduled Editions'
const SCREENING = 'Screening'
const POLICY = 'Editorial Policy'

export const run = defineGroup({
  id: 'run',
  title: 'Run Settings',
  description: 'The limits every Run Config and every Run stay within, when scheduled Editions are written, how Screening works and the editorial Policy\'s lengths.',
  entity: 'run-settings',
  place: { label: 'Run Configs › Settings', href: '/admin/run-configs/settings' },
  fields: {
    budgetLimitUsd: number({ fact: 'Budget limit', unit: 'dollars', integer: false, default: 25, section: LIMITS, affects: ['cost', 'runConfigs'] }),
    turnsLimit: number({ fact: 'Turns limit', unit: 'count', default: 400, section: LIMITS, affects: ['cost', 'runConfigs'] }),
    wallTimeLimitSeconds: number({ fact: 'Wall time limit', unit: 'seconds', default: 2700, section: LIMITS, affects: ['cost', 'runConfigs'] }),
    storyLimit: number({ fact: 'Story limit', unit: 'count', default: 24, section: LIMITS, affects: ['readers', 'layout', 'runConfigs'] }),
    screeningBudgetLimitUsd: number({ fact: 'Screening budget limit', unit: 'dollars', integer: false, default: 25, section: LIMITS, affects: ['cost', 'runConfigs'] }),
    screeningCallsLimit: number({ fact: 'Screening calls limit', unit: 'count', default: 400, section: LIMITS, affects: ['cost', 'runConfigs'] }),
    screeningWallTimeLimitSeconds: number({ fact: 'Screening wall time limit', unit: 'seconds', default: 2700, section: LIMITS, affects: ['cost', 'runConfigs'] }),
    articlesScreened: number({ fact: 'Articles screened', unit: 'count', default: 1500, section: LIMITS, affects: ['cost', 'readers'] }),
    articlesScreenedPerFeed: number({ fact: 'Articles screened per feed', unit: 'count', default: 300, section: LIMITS, affects: ['cost', 'readers'] }),
    longestWindowHours: number({ fact: 'Longest window', unit: 'hours', default: 744, section: LIMITS, affects: ['runConfigs', 'readers'] }),
    scheduledEditions: toggle({ fact: 'Scheduled editions', default: true, section: SCHEDULED, affects: ['readers', 'cost'] }),
    latestWriteHour: number({ fact: 'Latest write hour', unit: 'hour', default: 23, section: SCHEDULED, affects: ['readers'] }),
    descriptionScreenedCharacters: number({ fact: 'Description screened', unit: 'characters', default: 280, section: SCREENING, affects: ['cost', 'readers', 'rescreen'] }),
    storySummaryLength: range({ fact: 'Story summary length', unit: 'characters', default: { min: 40, max: 360 }, section: POLICY, affects: ['readers', 'layout'] }),
    sectionsPerEdition: number({ fact: 'Sections per edition', unit: 'count', default: 6, section: POLICY, affects: ['readers', 'layout'] }),
    storiesPerSection: number({ fact: 'Stories per section', unit: 'count', default: 4, section: POLICY, affects: ['readers', 'layout'] }),
    screeningReasonWords: number({ fact: 'Screening reason length', unit: 'words', default: 12, section: POLICY, affects: ['readers', 'rescreen', 'cost'] })
  },
  rules: (values) => {
    const problems: string[] = []
    if (values.articlesScreenedPerFeed > values.articlesScreened) problems.push('Articles screened per feed may not exceed Articles screened.')
    if (values.storyLimit > values.sectionsPerEdition * values.storiesPerSection) problems.push('The Story limit may not exceed Sections per edition times Stories per section.')
    return problems
  },
  confirm: (next, previous) => {
    const redone = [
      next.screeningReasonWords !== previous.screeningReasonWords ? 'Screening reason length' : undefined,
      next.descriptionScreenedCharacters !== previous.descriptionScreenedCharacters ? 'Description screened' : undefined
    ].filter(Boolean)
    return redone.length
      ? `Changing ${redone.join(' and ')} redoes every saved Screening judgment the next time each Brief is screened, which costs model calls.`
      : undefined
  }
})

const KEEPS = 'What a reader keeps'
const PACE = 'How often a reader may ask'

export const readers = defineGroup({
  id: 'readers',
  title: 'Reader Limits',
  description: 'What each reader keeps and how often they may ask for work the product pays for. Lowering a limit keeps what readers already have.',
  entity: 'reader-limits',
  place: { label: 'Readers › Limits', href: '/admin/readers/limits' },
  fields: {
    briefsPerReader: number({ fact: 'Briefs per reader', unit: 'count', default: 12, section: KEEPS, affects: ['readers'] }),
    feedsPerBrief: number({ fact: 'Feeds per brief', unit: 'count', default: 40, section: KEEPS, affects: ['readers', 'cost'] }),
    examplesPerBrief: number({ fact: 'Examples per brief', unit: 'count', default: 30, section: KEEPS, affects: ['readers'] }),
    aboutMeCharacters: number({ fact: 'About me length', unit: 'characters', default: 1500, section: KEEPS, affects: ['readers', 'cost'] }),
    briefNameCharacters: number({ fact: 'Brief name length', unit: 'characters', default: 60, section: KEEPS, affects: ['readers', 'layout'] }),
    siteChecksPerHour: number({ fact: 'Site checks an hour', unit: 'count', default: 30, section: PACE, affects: ['readers', 'load'] })
  }
})

export const EFFORTS = ['low', 'medium', 'high'] as const

export const models = defineCatalog({
  id: 'models',
  title: 'Models',
  singular: 'Model',
  description: 'The language models Run Configs may choose for writing or for Screening, with the reasoning efforts each takes and what it costs.',
  entity: 'permitted-model',
  place: { label: 'Run Configs › Models', href: '/admin/run-configs/models' },
  idLabel: 'Model id',
  labelField: 'label',
  fields: {
    label: text({ fact: 'Label', default: '', optional: false, maxLength: 80 }),
    note: text({ fact: 'Note', default: '', maxLength: 300, multiline: true }),
    efforts: choices({ fact: 'Efforts', options: [...EFFORTS], default: [...EFFORTS], minimum: 0 }),
    inputRate: number({ fact: 'Input rate', unit: 'dollars-per-million', integer: false, default: 0.15, affects: ['cost'] }),
    cachedInputRate: number({ fact: 'Cached input rate', unit: 'dollars-per-million', integer: false, default: 0.075, affects: ['cost'] }),
    outputRate: number({ fact: 'Output rate', unit: 'dollars-per-million', integer: false, default: 0.6, affects: ['cost'] }),
    contextWindowTokens: number({ fact: 'Context window', unit: 'tokens', default: 131072, affects: ['cost'] })
  },
  seed: [
    { id: 'openai/gpt-oss-20b', values: { label: 'GPT-OSS 20B (Groq)', note: 'Screening and evidence-based Briefs through Groq.', efforts: ['low', 'medium', 'high'], inputRate: 0.075, cachedInputRate: 0.037, outputRate: 0.3, contextWindowTokens: 131072 } },
    { id: 'openai/gpt-oss-120b', values: { label: 'GPT-OSS 120B (Groq)', note: 'Screening and evidence-based Briefs through Groq.', efforts: ['low', 'medium', 'high'], inputRate: 0.15, cachedInputRate: 0.075, outputRate: 0.6, contextWindowTokens: 131072 } }
  ]
})

const PRODUCT = 'Product'
const COST = 'Cost'
const SCREENING_COST = 'Screening cost'
const EFFORT_CHOICES = [...EFFORTS, { value: 'none', label: 'No effort' }] as const
const DAYS = [
  { value: 'every-day', label: 'Every day' },
  ...['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'].map(day => ({ value: day, label: day.charAt(0).toUpperCase() + day.slice(1) }))
]

export const runConfigs = definePresets({
  id: 'run-configs',
  title: 'Run Configs',
  singular: 'Run Config',
  description: 'How Briefs of one cadence are run: what an Edition is (Product) and what its writing and its Screening may spend (Cost). Readers follow their cadence\'s default or are assigned one.',
  entity: 'run-config',
  place: { label: 'Run Configs', href: '/admin/run-configs' },
  slots: ['daily', 'weekly'],
  fields: {
    lookbackHours: number({ fact: 'Window', unit: 'hours', default: 24, section: PRODUCT, affects: ['readers'] }),
    scheduleHour: number({ fact: 'Hour', unit: 'hour', default: 6, section: PRODUCT, affects: ['readers'] }),
    scheduleDay: choice({ fact: 'Day', options: DAYS, default: 'every-day', section: PRODUCT, affects: ['readers'] }),
    maxStories: number({ fact: 'Story ceiling', unit: 'count', default: 10, section: PRODUCT, affects: ['readers'] }),
    instructions: text({ fact: 'Framing', default: '', maxLength: 4000, multiline: true, section: PRODUCT, affects: ['readers'] }),
    model: pick({ fact: 'Model', catalog: 'models', default: 'openai/gpt-oss-120b', section: COST, affects: ['cost'] }),
    effort: choice({ fact: 'Effort', options: EFFORT_CHOICES, default: 'high', section: COST, affects: ['cost'] }),
    maxBudgetUsd: number({ fact: 'Budget', unit: 'dollars', integer: false, default: 0.1, section: COST, affects: ['cost'] }),
    maxTurns: number({ fact: 'Turns', unit: 'count', default: 2, section: COST, affects: ['cost'] }),
    maxDurationSeconds: number({ fact: 'Wall time', unit: 'seconds', default: 180, section: COST, affects: ['cost'] }),
    screeningModel: pick({ fact: 'Screening model', catalog: 'models', default: 'openai/gpt-oss-20b', section: SCREENING_COST, affects: ['cost'] }),
    screeningEffort: choice({ fact: 'Screening effort', options: EFFORT_CHOICES, default: 'low', section: SCREENING_COST, affects: ['cost'] }),
    screeningMaxBudgetUsd: number({ fact: 'Screening budget', unit: 'dollars', integer: false, default: 0.15, section: SCREENING_COST, affects: ['cost'] }),
    screeningMaxCalls: number({ fact: 'Screening calls', unit: 'count', default: 30, section: SCREENING_COST, affects: ['cost'] }),
    screeningMaxDurationSeconds: number({ fact: 'Screening wall time', unit: 'seconds', default: 120, section: SCREENING_COST, affects: ['cost'] })
  },
  rules: (values, catalogs) => {
    const problems: { key: string, message: string }[] = []
    const takes = (key: 'effort' | 'screeningEffort', modelId: string) => {
      const model = catalogs.entry('models', modelId)
      if (!model) return
      const efforts = model.values.efforts as string[]
      const effort = values[key]
      if (efforts.length === 0 && effort !== 'none') problems.push({ key, message: `${String(model.values.label)} takes no effort; choose "No effort".` })
      if (efforts.length > 0 && !efforts.includes(effort)) problems.push({ key, message: `${String(model.values.label)} does not take effort "${effort}".` })
    }
    takes('effort', values.model)
    takes('screeningEffort', values.screeningModel)
    return problems
  },
  within: (values, settings) => {
    const limits = settings.get('run') as Record<string, number>
    const problems: string[] = []
    const money = (value: number) => `$${Number.isInteger(value) ? value : value.toFixed(2)}`
    if (values.maxBudgetUsd > limits.budgetLimitUsd!) problems.push(`its Budget, ${money(values.maxBudgetUsd)}, is above the Budget limit of ${money(limits.budgetLimitUsd!)}.`)
    if (values.maxTurns > limits.turnsLimit!) problems.push(`its Turns, ${values.maxTurns}, are above the Turns limit of ${limits.turnsLimit}.`)
    if (values.maxDurationSeconds > limits.wallTimeLimitSeconds!) problems.push(`its Wall time, ${values.maxDurationSeconds} seconds, is above the Wall time limit of ${limits.wallTimeLimitSeconds} seconds.`)
    if (values.maxStories > limits.storyLimit!) problems.push(`its Story ceiling, ${values.maxStories}, is above the Story limit of ${limits.storyLimit}.`)
    if (values.lookbackHours > limits.longestWindowHours!) problems.push(`its Window, ${values.lookbackHours} hours, is above the Longest window of ${limits.longestWindowHours} hours.`)
    if (values.screeningMaxBudgetUsd > limits.screeningBudgetLimitUsd!) problems.push(`its Screening budget, ${money(values.screeningMaxBudgetUsd)}, is above the Screening budget limit of ${money(limits.screeningBudgetLimitUsd!)}.`)
    if (values.screeningMaxCalls > limits.screeningCallsLimit!) problems.push(`its Screening calls, ${values.screeningMaxCalls}, are above the Screening calls limit of ${limits.screeningCallsLimit}.`)
    if (values.screeningMaxDurationSeconds > limits.screeningWallTimeLimitSeconds!) problems.push(`its Screening wall time, ${values.screeningMaxDurationSeconds} seconds, is above the Screening wall time limit of ${limits.screeningWallTimeLimitSeconds} seconds.`)
    return problems
  },
  seed: [
    {
      key: 'daily',
      slot: 'daily',
      label: 'Daily brief',
      values: { instructions: 'A daily Edition covers the last 24 hours. Select the few Articles in the screened shortlist that report something new since yesterday, not what has been true all week. Prior coverage is context only.' }
    },
    {
      key: 'weekly',
      slot: 'weekly',
      label: 'Weekly brief',
      values: {
        lookbackHours: 168,
        scheduleDay: 'monday',
        maxStories: 15,
        instructions: 'A weekly Edition covers the last seven days. Select the few most consequential arcs in the screened shortlist, each consolidated across the days it developed rather than repeated day by day. Prior dailies are context for continuity, not a substitute for current evidence.',
        screeningMaxBudgetUsd: 0.3,
        screeningMaxCalls: 60,
        screeningMaxDurationSeconds: 240
      }
    }
  ]
})

/** What news keeps that depends on the collection bounds: each Feed's own configuration. */
export interface FixtureFeed {
  name: string
  maxArticles: number
  lookbackDays: number
  official: boolean
}

/** Lowering a collection bound below a Feed's configuration is refused, naming the Feed. */
export function feedsAbove(feeds: (host: unknown) => Promise<readonly FixtureFeed[]> | readonly FixtureFeed[]): Guard {
  return async ({ next, host }) => {
    const problems: string[] = []
    for (const feed of await feeds(host)) {
      if (feed.maxArticles > Number(next.maxArticlesPerRetrieval)) problems.push(`Feed "${feed.name}" reads ${feed.maxArticles} articles, above the Most articles per retrieval of ${String(next.maxArticlesPerRetrieval)}.`)
      if (feed.lookbackDays > Number(next.maxLookbackDays)) problems.push(`Feed "${feed.name}" looks back ${feed.lookbackDays} days, above the Longest lookback of ${String(next.maxLookbackDays)}.`)
    }
    return problems
  }
}

/** What Every Feed means right now: how many official Feeds it would collect. */
export function collectionNotes(feeds: (host: unknown) => Promise<readonly FixtureFeed[]> | readonly FixtureFeed[]): NotesProvider {
  return async ({ host }) => {
    const official = (await feeds(host)).filter(feed => feed.official).length
    return { scheduledCollection: `Every Feed would collect ${official} official Feed${official === 1 ? '' : 's'}.` }
  }
}

/** news's mechanics: deployment values with defaults, never tuned while it runs. */
export const environment = defineEnvironment({
  DATABASE_URL: env.string({ description: 'The Postgres the app and tunables share.', section: 'Infrastructure' }),
  NEWS_LOCK_SCHEDULER: env.integer({ default: 7101, description: 'Advisory lock id the scheduler holds while it ticks.', section: 'Mechanics' }),
  NEWS_QUERY_BATCH: env.integer({ default: 500, description: 'Rows written per statement when a batch is saved.', section: 'Mechanics' }),
  NEWS_KEPT_ERROR_CHARACTERS: env.integer({ default: 2000, description: 'How much of an error message is kept on a failed item.', section: 'Mechanics' }),
  NEWS_LOG_LEVEL: env.choice({ options: ['debug', 'info', 'warn', 'error'], default: 'info', description: 'How much the server and worker log.', section: 'Mechanics' })
})

export const groups = [collection, run, readers] as const
export const presets = [runConfigs] as const
export const catalogs = [models] as const
