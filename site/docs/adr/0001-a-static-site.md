# ADR-0001: A static site in the tunables repository

Status: accepted, 2026-10-23.

read_when: adding anything that would need a server, a database, an account
or a request-time decision; or wondering why the site lives in this
repository.

## Decision

- **No server.** `nuxt generate` writes every page and the sitemap at build
  time. Nothing on the site runs per request.
- **No accounts.** No sign-in, settings, mailing list or anything behind them.
- **Docs and changelog are read from the checkout**, not fetched, so a change
  and the page that shows it land in one pull request. The docs are also
  shipped in the npm package and read on GitHub, so they are authored as plain
  Markdown with relative `.md` links, and the site adapts to them.
- **Its own theme.** tunables publishes no theme: its screens take the host
  app's Nuxt UI theme. The site's palette and type live in `site/` only.
- **Cookie-free page-view statistics only**, from Cloudflare Web Analytics on
  the Pages project if enabled there, not in this code. No other tracker and no
  cookie, so no consent notice.
- **Hosting.** Cloudflare Pages (project `tunables`) serves the output, deployed
  from GitHub Actions after the checks pass, with a preview URL per pull
  request. Response headers live in `public/_headers`.

## Why

A library whose site needs a server reads as a service, and tunables' whole
point is that it is not one. One maintainer also cannot keep a server healthy
beside the library.

## Consequences

- Static hosts serve `changelog.html` at `/changelog`, so the site emits pages
  that way and every link uses the slashless URL.
- Anything that needs a request-time decision does not belong on this site.
