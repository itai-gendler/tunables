# Deployment

tunables.dev is served by Cloudflare Pages, set up the same way as pdd-kit.dev.

## How a change goes live

- The Site workflow (`.github/workflows/site.yml`) generates the site and runs
  its tests on every push and pull request that touches it.
- A push to `main` deploys `.output/public` to the Pages project `tunables` as
  production; a pull request from this repository gets a preview deployment.
- Both use the repository secrets `CLOUDFLARE_API_TOKEN` (a token with
  Account › Cloudflare Pages › Edit) and `CLOUDFLARE_ACCOUNT_ID`. Without the
  token, the deploy steps skip with a warning.
- The version in the header comes from `../package.json` at build time, so the
  site shows a new version as soon as its release commit reaches `main`, a few
  minutes before npm publishes it.

## Cloudflare setup

- The Pages project `tunables` has production branch `main` and no Git
  provider: CI uploads the built files. Its default address is
  `tunables.pages.dev`.
- Only the apex, `tunables.dev`, is a custom domain of the project. Its DNS
  record is a proxied CNAME to `tunables.pages.dev`.
- `www.tunables.dev` is a proxied AAAA record to `100::` (no origin), and a
  Redirect Rule sends it with a 301 to `https://tunables.dev` with the path and
  query kept.
- The domain is registered with Cloudflare, in the same account.

## Pitfalls

- `wrangler pages project create` run in this repository creates a Worker, not
  a Pages project. Create a Pages project through the dashboard or the API
  (`POST /accounts/{account}/pages/projects`).
- A Pages custom domain added through the API does not create its DNS record;
  add the record in the dashboard.
- `wrangler login` grants Pages and Workers but only reads zones, so it cannot
  change DNS records or Redirect Rules.
