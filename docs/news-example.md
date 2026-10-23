---
title: news as tunables
description: A complete, real app's settings as tunables — three groups, Run Configs as presets, permitted models as a catalog, a guard, notes, deployment values and a Product Model.
group: Reference
order: 25
---

# news as tunables

tunables was extracted from **news**, an app that collects articles from Feeds
and has a model write each reader a briefing, called an Edition, on a daily or
weekly cadence. Its settings are the repository's fixture:
[`fixture/news.ts`](https://github.com/itai-gendler/tunables/blob/main/fixture/news.ts)
holds the definitions and
[`fixture/tunables.config.ts`](https://github.com/itai-gendler/tunables/blob/main/fixture/tunables.config.ts)
the config. The tests, the playground and the CLI checks all run against it,
so it is the proof that tunables fits the app it came from. This page walks
through it.

| What | Holds |
| --- | --- |
| Collection Settings | 19 settings: how the worker collects Feeds, and the bounds every retrieval stays within |
| Run Settings | 17 settings: the limits every Run stays within, scheduled Editions, Screening and the editorial lengths |
| Reader Limits | 6 settings: what each reader keeps, and how often they may ask |
| Run Configs | Presets for the `daily` and `weekly` slots, 15 fields each |
| Models | A catalog of permitted models, 7 fields each |
| Environment | 5 deployment values |

## Units and effects

news prices models per million tokens, which no built-in unit says, so it
declares its own. Its effects name what a change reaches: readers, cost,
worker load, the Run Configs checked against a limit.

```ts
export const units = {
  'dollars-per-million': { label: 'dollars per million tokens', format: (value: number) => `$${value} per million tokens` }
} satisfies Record<string, Unit>

export const effects = defineEffects({
  readers: { label: 'What readers get', icon: 'i-lucide-users' },
  cost: { label: 'Model cost', warn: true, icon: 'i-lucide-coins' },
  runConfigs: { label: 'Run Configs checked against it', icon: 'i-lucide-sliders-horizontal' },
  rescreen: { label: 'Saved Screening judgments are redone', warn: true, icon: 'i-lucide-refresh-cw' },
  load: { label: 'Worker, database or publisher load', icon: 'i-lucide-gauge' }
  // and three more
})
```

## Collection Settings

The worker's settings, in five sections, edited on the Feeds screens
(`place: { label: 'Feeds › Settings', href: '/admin/feeds/settings' }`). Every
field names the Product Model fact it is, so none carries its own `help`:

```ts
checkIntervalMinutes: number({ fact: 'Check interval', unit: 'minutes', default: 5, section: WORKER, affects: ['load', 'readers'] }),
scheduledCollection: choice({
  fact: 'Scheduled collection',
  options: [{ value: 'off', label: 'Off' }, { value: 'brief-feeds', label: 'Feeds Briefs read' }, { value: 'every-feed', label: 'Every Feed' }],
  default: 'brief-feeds',
  section: WORKER,
  affects: ['load', 'readers']
}),
largestResponseMegabytes: number({ fact: 'Largest response', unit: 'megabytes', default: 2, integer: false, section: BOUNDS, affects: ['readers', 'load'] }),
imageMinimum: size({ fact: 'Image minimum size', default: { width: 400, height: 225 }, section: READING, affects: ['readers'] }),
```

Its `rules` keep the queue's timings in order and the new-Feed defaults inside
the bounds:

```ts
rules: (values) => {
  const problems: string[] = []
  if (!(values.jobExpirySeconds > values.attemptSeconds)) problems.push('Job expiry must be longer than Attempt time limit.')
  if (!(values.jobHeartbeatSeconds < values.jobExpirySeconds)) problems.push('Job heartbeat must be shorter than Job expiry.')
  if (values.newFeedMaxArticles > values.maxArticlesPerRetrieval) problems.push('New-feed articles per retrieval may not exceed the Most articles per retrieval.')
  return problems
}
```

### A guard and a note

Each Feed news keeps has its own article count and lookback. Lowering a bound
below a Feed's would strand it, so a guard refuses the change and names the
Feed:

```ts
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
```

The guard takes a function that reads the Feeds, given the save's `host`, so
the app passes its database and the tests pass a list. A notes provider says,
under *Scheduled collection*, what *Every Feed* would mean right now: *"Every
Feed would collect 2 official Feeds."*

## Run Settings

The limits every Run Config and Run stay within, edited under Run Configs. It
uses a `range` for the editorial lengths, the `hour` unit for the latest hour a
scheduled Edition may be written, and `dollars` with `integer: false` for
budgets:

```ts
budgetLimitUsd: number({ fact: 'Budget limit', unit: 'dollars', integer: false, default: 25, section: LIMITS, affects: ['cost', 'runConfigs'] }),
storyLimit: number({ fact: 'Story limit', unit: 'count', default: 24, section: LIMITS, affects: ['readers', 'layout', 'runConfigs'] }),
latestWriteHour: number({ fact: 'Latest write hour', unit: 'hour', default: 23, section: SCHEDULED, affects: ['readers'] }),
storySummaryLength: range({ fact: 'Story summary length', unit: 'characters', default: { min: 40, max: 360 }, section: POLICY, affects: ['readers', 'layout'] }),
```

Its `rules` keep the Story limit within what an Edition's layout holds, and its
`confirm` asks before a change that redoes paid work:

```ts
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
```

## Reader Limits

The simplest group: six counts, in two sections, with no rules. Its
description carries a promise the app keeps in its own code: lowering a limit
keeps what readers already have, and refuses only new additions past it.

## Models: a catalog

The language models Run Configs may choose. An entry is named by its `label`
and identified by its provider's model id; its efforts may be empty, for a
model that takes none:

```ts
export const models = defineCatalog({
  id: 'models',
  title: 'Models',
  singular: 'Model',
  entity: 'permitted-model',
  idLabel: 'Model id',
  labelField: 'label',
  fields: {
    label: text({ fact: 'Label', default: '', optional: false, maxLength: 80 }),
    note: text({ fact: 'Note', default: '', maxLength: 300, multiline: true }),
    efforts: choices({ fact: 'Efforts', options: [...EFFORTS], default: [...EFFORTS], minimum: 0 }),
    inputRate: number({ fact: 'Input rate', unit: 'dollars-per-million', integer: false, default: 0.15, affects: ['cost'] }),
    // cachedInputRate, outputRate, contextWindowTokens
  },
  seed: [
    { id: 'openai/gpt-oss-20b', values: { label: 'GPT-OSS 20B (Groq)', /* … */ } },
    { id: 'openai/gpt-oss-120b', values: { label: 'GPT-OSS 120B (Groq)', /* … */ } }
  ]
})
```

Both seeded Run Configs screen with GPT-OSS 20B, so retiring it is refused:
*"GPT-OSS 20B (Groq) is in use by Run Config "Daily brief", Run Config "Weekly
brief"; move them to another model first."*

## Run Configs: presets

How Briefs of one cadence are run: the Product section says what an Edition is,
the Cost sections what its writing and its Screening may spend. Each reader
follows the default for their cadence or is assigned one.

```ts
export const runConfigs = definePresets({
  id: 'run-configs',
  title: 'Run Configs',
  singular: 'Run Config',
  entity: 'run-config',
  slots: ['daily', 'weekly'],
  fields: {
    lookbackHours: number({ fact: 'Window', unit: 'hours', default: 24, section: PRODUCT, affects: ['readers'] }),
    scheduleHour: number({ fact: 'Hour', unit: 'hour', default: 6, section: PRODUCT, affects: ['readers'] }),
    maxStories: number({ fact: 'Story ceiling', unit: 'count', default: 10, section: PRODUCT, affects: ['readers'] }),
    model: pick({ fact: 'Model', catalog: 'models', default: 'openai/gpt-oss-120b', section: COST, affects: ['cost'] }),
    effort: choice({ fact: 'Effort', options: EFFORT_CHOICES, default: 'high', section: COST, affects: ['cost'] }),
    maxBudgetUsd: number({ fact: 'Budget', unit: 'dollars', integer: false, default: 0.1, section: COST, affects: ['cost'] }),
    screeningModel: pick({ fact: 'Screening model', catalog: 'models', default: 'openai/gpt-oss-20b', section: SCREENING_COST, affects: ['cost'] })
    // and eight more
  },
  // rules, within and seed below
})
```

- **`rules`** read the picked model from the catalog and refuse an effort it
  does not take: *"GPT-OSS 120B (Groq) does not take effort "none"."*
- **`within`** holds each of eight values under its Run Settings limit, so a
  limit can never drop below a Run Config: *"Run Config "Weekly brief": its
  Story ceiling, 15, is above the Story limit of 12."*
- **`seed`** creates *Daily brief* and *Weekly brief*, each with its own
  framing; the weekly one looks back 168 hours, is written on Mondays, holds
  up to 15 Stories and may spend more on Screening.

## Deployment values

What news's deployment sets, and nobody tunes while it runs:

```ts
export const environment = defineEnvironment({
  DATABASE_URL: env.string({ description: 'The Postgres the app and tunables share.', section: 'Infrastructure' }),
  NEWS_LOCK_SCHEDULER: env.integer({ default: 7101, description: 'Advisory lock id the scheduler holds while it ticks.', section: 'Mechanics' }),
  NEWS_QUERY_BATCH: env.integer({ default: 500, description: 'Rows written per statement when a batch is saved.', section: 'Mechanics' }),
  NEWS_KEPT_ERROR_CHARACTERS: env.integer({ default: 2000, description: 'How much of an error message is kept on a failed item.', section: 'Mechanics' }),
  NEWS_LOG_LEVEL: env.choice({ options: ['debug', 'info', 'warn', 'error'], default: 'info', description: 'How much the server and worker log.', section: 'Mechanics' })
})
```

`tunables env` writes the fixture's `env.example` from it.

## The Product Model

news describes itself in a [pdd-kit](https://pdd-kit.dev) Product Model. Each
group, preset set and catalog names its Entity (`entity: 'run-settings'`), and
each field the fact it is (`fact: 'Budget limit'`). The Entity keeps the fact
in its own words:

```md
- **Budget limit** — the most any Run may spend; defaults to 25 dollars
```

`tunables explain` turns those lines into `explanations.ts`, which the app
passes to `createTunables`, so the question mark beside *Budget limit* reads
*"The most any Run may spend."* `tunables check` confirms that every fact
exists and that every default agrees: if someone set `budgetLimitUsd` to 20 in
code, the check would fail until the model agreed.

## The config, and the playground

The fixture's config lists the definitions for the offline commands, and its
`connect` returns news's tunables, with the guard and the notes, over Postgres
when `TUNABLES_FIXTURE_DATABASE_URL` is set and in memory otherwise.

The repository's `playground` is a Nuxt app that embeds the screens the way
news does: tunables nested in its own oRPC router, the layer's components on
news's administration pages, and an Administrator and a reader to switch
between. From a checkout:

```bash
pnpm install
pnpm --filter @tunables/playground dev
```
