import { queryCollection } from '@nuxt/content/nitro'

const STATIC_PATHS = ['/', '/changelog', '/privacy']

export default defineEventHandler(async (event) => {
  const docs = await queryCollection(event, 'docs').select('path').all()
  const paths = [...STATIC_PATHS, ...docs.map(doc => doc.path)]

  const urls = paths
    .map(path => `  <url>\n    <loc>${new URL(path, SITE_ORIGIN).href}</loc>\n  </url>`)
    .join('\n')

  setHeader(event, 'content-type', 'application/xml')
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`
})
