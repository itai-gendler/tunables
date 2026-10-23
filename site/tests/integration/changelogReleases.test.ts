import { describe, expect, it } from 'vitest'
import { changelogReleases } from '../../app/utils/changelogReleases'

type Node = Parameters<typeof changelogReleases>[0][number]
const h2 = (id: string, ...children: Node[]): Node => ['h2', { id }, ...children]
const p = (text: string): Node => ['p', {}, text]

describe('changelogReleases', () => {
  it('shows Unreleased while it holds entries, then each dated release', () => {
    const releases = changelogReleases([
      h2('unreleased', ['span', {}, 'Unreleased']),
      p('Next'),
      h2('010---2026-11-02', ['a', { href: 'https://github.com/itai-gendler/tunables/releases/tag/v0.1.0' }, '0.1.0'], ' - 2026-11-02'),
      p('First')
    ])
    expect(releases.map(release => [release.slug, release.title, release.date, release.to])).toEqual([
      ['unreleased', 'Unreleased', undefined, undefined],
      ['v0-1-0', 'v0.1.0', '2026-11-02', 'https://github.com/itai-gendler/tunables/releases/tag/v0.1.0']
    ])
  })

  it('reads a bracketed label and drops headings with no entries', () => {
    const releases = changelogReleases([h2('unreleased', '[Unreleased]'), h2('020---2026-12-01', '[0.2.0] - 2026-12-01'), p('Second')])
    expect(releases.map(release => release.title)).toEqual(['v0.2.0'])
  })
})
