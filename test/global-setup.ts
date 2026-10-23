import { execFileSync } from 'node:child_process'

/** Build `dist/` once, so suites that spawn the CLI never race a rebuild. */
export default function setup(): void {
  if (process.env.TUNABLES_SKIP_BUILD) return
  execFileSync('pnpm', ['exec', 'tsdown', '--log-level', 'warn'], { stdio: 'inherit' })
}
