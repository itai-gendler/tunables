/** Who the playground says is signed in: Sam on Tasklane's staff, Olivia who owns Acme, or Dana, a member of Acme. */
export type Who = 'staff' | 'owner' | 'member'

export function usePlaygroundWho() {
  return useCookie<Who>('playground-who', { default: () => 'staff' })
}

/** Where each person lands, and the only pages they open: staff the administration, the others their own page. */
export function homeOf(who: Who): string {
  return who === 'owner' ? '/workspace' : who === 'member' ? '/me' : '/admin/limits'
}

export function opens(who: Who, path: string): boolean {
  return who === 'staff' ? path.startsWith('/admin/') : path === homeOf(who)
}
