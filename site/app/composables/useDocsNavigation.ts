import type { ContentNavigationItem } from '@nuxt/content'

interface DocsNavigationDoc {
  path: string
  title: string
  description: string
  group: string
}

// Cluster the docs into sidebar groups by their `group` frontmatter, keeping
// `order`: a group appears where its first page does.
function groupNavigation(docs: DocsNavigationDoc[]): ContentNavigationItem[] {
  const items: ContentNavigationItem[] = []
  const groups = new Map<string, ContentNavigationItem>()

  for (const doc of docs) {
    const leaf: ContentNavigationItem = { title: doc.title, path: doc.path, exact: true }
    let group = groups.get(doc.group)
    if (!group) {
      group = { title: doc.group, path: doc.path, defaultOpen: true, children: [] }
      groups.set(doc.group, group)
      items.push(group)
    }
    group.children!.push(leaf)
  }

  return items
}

export async function useDocsNavigation() {
  const { data: docs } = await useAsyncData('docs-sections', () =>
    queryCollection('docs').order('order', 'ASC').select('path', 'title', 'description', 'group').all())

  const navigation = computed<ContentNavigationItem[]>(() => groupNavigation(docs.value ?? []))

  return { navigation, docs }
}
