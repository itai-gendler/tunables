/**
 * The home page's words, in one place, so they can be reviewed without reading
 * a template. Every example is real: the refusals are the messages tunables
 * gives for Tasklane, the example todo app (`examples/tasklane/tunables.ts` in
 * the repository), except a guard's, which is the app's own words; every code
 * sample uses the published API. See docs/brand.md for the voice.
 */

export interface HomeLink {
  label: string
  to: string
}

export interface ProblemItem {
  title: string
  note: string
  icon: string
}

export interface Step {
  title: string
  text: string
  /** The file the snippet belongs in, shown above it. */
  file: string
  code: string
  more: HomeLink
}

export interface Guardrail {
  title: string
  text: string
  /** The option or call that declares it. */
  api: string
  /** What tunables answers, word for word. */
  answer: string
  /** `refused` reads as a problem, `asks` as a confirmation, `kept` as a record. */
  tone: 'refused' | 'asks' | 'kept'
}

export interface Skill {
  name: string
  text: string
}

export interface Attachment {
  title: string
  text: string
  icon: string
  detail: string
}

export const homeContent = {
  hero: {
    eyebrow: 'Open-source TypeScript library',
    title: 'Runtime settings with guardrails, for the app you already run.',
    description: 'Declare each setting once. tunables keeps its value in your Postgres, lets each workspace and person set its own within their plan, puts it on a screen inside your app, checks every change as a whole, and records who changed what, and why.',
    install: 'npm i tunables',
    installCopyLabel: 'Copy the install command',
    primary: { label: 'Read the quickstart', to: '/docs/quickstart' },
    secondary: { label: 'How it works', to: '/docs' }
  },

  /**
   * The hero's panel: Tasklane's Pro plan, a layer of its Limits, and the check
   * a save of it runs. Acme and Hobby club are on Pro and each keeps fewer
   * Projects than the plan allows; the message is the one tunables returns when
   * a broader value would leave an override above it.
   */
  demo: {
    group: 'Pro plan',
    section: 'What a workspace on Pro may hold',
    field: 'Projects',
    help: 'The most projects a workspace may have open at once.',
    min: 1,
    max: 60,
    initial: 50,
    defaultValue: 50,
    affects: ['What everyone in the workspace sees'],
    /** Workspaces on Pro that keep their own, lower Projects. */
    overrides: [
      { label: 'Acme', value: 20 },
      { label: 'Hobby club', value: 35 }
    ],
    caption: 'Tasklane\'s Pro plan, with the check a save of it runs. Turn Projects down past what a workspace keeps.'
  },

  problem: {
    id: 'problem',
    title: 'Where your settings live today',
    description: 'A value someone needs to change while the app runs ends up in one of four places. None of them knows what else the value bounds.',
    more: { label: 'Why one home', to: '/docs' },
    items: [
      { title: 'Constants in code', note: 'Changing one is a deploy, and nobody outside engineering can see it.', icon: 'i-lucide-braces' },
      { title: 'Environment variables', note: 'Read at boot, set per deployment, and invisible to the people who decide them.', icon: 'i-lucide-terminal' },
      { title: 'One-off admin forms', note: 'Each checks its own fields, if any, and none checks the rest.', icon: 'i-lucide-panels-top-left' },
      { title: 'A key–value table', note: 'A name and a blob: no unit, no default, no explanation.', icon: 'i-lucide-table' }
    ] satisfies ProblemItem[],
    consequences: [
      { title: 'No history', text: 'Nobody can say who changed a value, what it was before, or why it moved.' },
      { title: 'Silent breakage', text: 'Lower a limit and whatever was configured above it keeps running over it, until something fails somewhere else.' },
      { title: 'Two homes', text: 'A value read from the environment and also from the database needs a precedence rule nobody remembers.' }
    ]
  },

  how: {
    id: 'how-it-works',
    title: 'How it works',
    description: 'Four steps take a value from a constant to a knob on a panel, with every turn recorded.',
    more: { label: 'Quickstart', to: '/docs/quickstart' },
    steps: [
      {
        title: 'Declare it once',
        text: 'Each setting states its kind, unit, default, explanation, what changing it affects and where a workspace or person may set its own. Its check, its stored seed, its API schema and its form input all follow from that one declaration.',
        file: 'settings.ts',
        code: `import { defineGroup, number } from 'tunables'

export const limits = defineGroup({
  id: 'limits',
  title: 'Limits',
  fields: {
    maxProjects: number({
      label: 'Projects',
      unit: 'count',
      default: 3,
      // A workspace may lower it, never raise it.
      override: { workspace: 'at-most' },
      help: 'The most projects a workspace may have open at once.'
    })
  }
})`,
        more: { label: 'Settings and groups', to: '/docs/settings-and-groups' }
      },
      {
        title: 'Store it in your Postgres',
        text: 'Four tables in a schema of your database, written through the client you already have. Code reads typed values; boot never waits on the database.',
        file: 'server/tunables.ts',
        code: `import { createTunables } from 'tunables'
import { fromPg, postgresStore } from 'tunables/postgres'

export const tunables = createTunables({
  store: postgresStore(fromPg(pool)),
  groups: [limits],
  scopes: ['workspace', 'user']
})

const { maxProjects } = await tunables.get('limits', {
  scope: { workspace: 'acme' }
})`,
        more: { label: 'Storage', to: '/docs/storage' }
      },
      {
        title: 'Embed the screens',
        text: 'Mount one handler in your server, extend the Nuxt layer, and put a form where the setting matters: for your staff, or for one workspace\'s owner. The screens take your Nuxt UI theme.',
        file: 'pages/workspace/limits.vue',
        code: `<template>
  <TunablesGroupForm group="limits" :scope="{ workspace: 'acme' }" />
</template>`,
        more: { label: 'The Nuxt layer', to: '/docs/nuxt-layer' }
      },
      {
        title: 'Change it safely',
        text: 'From the screen or the terminal, a change goes through the same checks and becomes a revision you can read and restore.',
        file: 'terminal',
        code: `$ npx tunables set limits maxProjects=20 --scope workspace=acme --reason "Acme asked for fewer"
Saved as revision 14.

$ npx tunables history limits --scope workspace=acme --limit 1
#14  2026-10-23T09:12:44.021Z  ada (terminal)  “Acme asked for fewer”
    maxProjects: null → 20`,
        more: { label: 'History and restore', to: '/docs/history-and-restore' }
      }
    ] satisfies Step[]
  },

  guardrails: {
    id: 'guardrails',
    title: 'Guardrails, in plain words',
    description: 'A save is checked whole before anything is written. When it is refused, it says why in the setting\'s own words, and nothing changes.',
    more: { label: 'Checks and guards', to: '/docs/checks-and-guards' },
    items: [
      {
        title: 'Each scope sets its own, within',
        text: 'Each workspace and person sets its own values, only for the fields declared for them, and never past what they inherit from the plan.',
        api: 'override',
        answer: 'Projects may be at most 50 for Acme, the value it inherits.',
        tone: 'refused'
      },
      {
        title: 'Rules across settings',
        text: 'Settings that bound one another are checked together on every save, at every scope.',
        api: 'rules',
        answer: 'Due soon may not be longer than the time before done tasks are archived.',
        tone: 'refused'
      },
      {
        title: 'Guards for what you keep',
        text: 'Your own records that depend on a setting are checked against the new value, in your own words.',
        api: 'guards',
        answer: 'Acme has 42 projects open, more than the 30 this change allows.',
        tone: 'refused'
      },
      {
        title: 'Entries in use stay available',
        text: 'A catalog entry something still picks cannot be retired from under it.',
        api: 'catalog().retire',
        answer: 'Small and quick is in use by Workspace › Suggestion model; move them to another model first.',
        tone: 'refused'
      },
      {
        title: 'Confirmations for changes with consequences',
        text: 'A change with consequences is saved only when it is sent again, confirmed.',
        api: 'confirm',
        answer: 'Guests will see every task in the project they are invited to, including its comments and attachments.',
        tone: 'asks'
      },
      {
        title: 'Restore through the same checks',
        text: 'Every change is a revision with each value before and after. Restoring one is a save like any other.',
        api: 'restore',
        answer: 'Restored revision 9. The import is done.',
        tone: 'kept'
      }
    ] satisfies Guardrail[]
  },

  agents: {
    id: 'agents',
    title: 'Built for coding agents',
    description: 'Three agent skills and a CLI let a coding agent adopt tunables, define settings the right way and verify that every value has one home, through the same checks a person gets.',
    more: { label: 'Skills', to: '/docs/skills' },
    install: 'npx tunables install',
    skills: [
      { name: 'tunables-adopt', text: 'Brings tunables into an app that has none: inventories every value, gives each one home, and wires it once you approve.' },
      { name: 'tunables-define', text: 'Adds or changes one setting with its kind, unit, default and checks, and says what happens to stored values.' },
      { name: 'tunables-verify', text: 'Reports every value still hard-coded, kept in two homes or unguarded, and fixes only what you choose.' }
    ] satisfies Skill[],
    commands: [
      { command: 'tunables check', text: 'Definitions, .env.example and the Product Model agree, without a database.' },
      { command: 'tunables explain', text: 'Writes each field\'s explanation from the Product Model.' },
      { command: 'tunables set … --reason', text: 'Changes values through the same checks as the screens.' }
    ],
    pdd: {
      text: 'Field explanations come from a pdd-kit Product Model, and `tunables check` fails when a default disagrees with the one the model states.',
      link: { label: 'pdd-kit.dev', to: 'https://pdd-kit.dev' }
    }
  },

  attaches: {
    id: 'attaches',
    title: 'It attaches. It is not a service.',
    description: 'There is nothing to deploy beside your app and no account to create. tunables runs in your process, against your database, behind your sign-in.',
    more: { label: 'Server and access', to: '/docs/server' },
    items: [
      {
        title: 'Your server',
        text: 'One fetch handler mounts in Nitro, Hono, Bun or Deno. Express middleware and an oRPC router cover the rest.',
        icon: 'i-lucide-server',
        detail: 'createHandler · tunablesMiddleware · tunablesRouter'
      },
      {
        title: 'Your database',
        text: 'Four tables in a schema of your Postgres, through node-postgres or postgres.js. Changes can join your own transactions.',
        icon: 'i-lucide-database',
        detail: 'postgresStore · migrate · within · hold'
      },
      {
        title: 'Your sign-in',
        text: 'tunables has no users or roles. You say who is asking and whether they may, on every request.',
        icon: 'i-lucide-key-round',
        detail: 'actor · authorize · refusal'
      }
    ] satisfies Attachment[]
  },

  close: {
    title: 'Put your first setting on a panel.',
    description: 'The quickstart takes one group from a constant to a screen with a history, in your own app.',
    action: { label: 'Read the quickstart', to: '/docs/quickstart' }
  }
}
