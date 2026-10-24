import { execFile } from 'node:child_process'
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

export const root = resolve(import.meta.dirname, '..')
const cli = join(root, 'dist/cli.js')

/** Run the built CLI; resolves with its exit code and output, never rejects on a failing exit. */
export function tunables(args: string[], options: { cwd?: string, env?: Record<string, string | undefined> } = {}): Promise<{ code: number, stdout: string, stderr: string }> {
  return new Promise((done) => {
    execFile(process.execPath, [cli, ...args], {
      cwd: options.cwd ?? root,
      env: { ...process.env, TUNABLES_NO_UPDATE_CHECK: '1', CI: '1', ...options.env }
    }, (error, stdout, stderr) => {
      done({ code: error ? (typeof error.code === 'number' ? error.code : 1) : 0, stdout, stderr })
    })
  })
}

/**
 * A copy of the news fixture in a directory of its own under the root, with
 * its `src` imports adjusted; removed by the returned function.
 */
export function fixtureCopy(): { directory: string, remove: () => void } {
  const parent = mkdtempSync(join(root, '.tmp-cli-'))
  const directory = join(parent, 'fixture')
  cpSync(join(root, 'test/fixtures/news'), directory, { recursive: true })
  // The copy sits one level shallower, so its imports reach src/ one level less far up.
  for (const file of ['news.ts', 'tunables.config.ts', 'explanations.ts']) {
    const path = join(directory, file)
    writeFileSync(path, readFileSync(path, 'utf8').replaceAll("'../../../src/", "'../../src/"))
  }
  return { directory, remove: () => rmSync(parent, { recursive: true, force: true }) }
}
