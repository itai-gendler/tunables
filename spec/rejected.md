# Rejected options

Options costed and turned down, so they are not proposed again without new
reasons.

## Layered precedence between file, environment and database

A value read from a file unless the database overrides it unless the
environment pins it. An earlier configuration SDK rebuilt its precedence twice
and stored where each value came from inside the value. tunables gives each
value one home instead: a setting in the database, or a deployment value in the
environment, never both. There is nothing to order.

## Storing defaults in the database

The first version of this design in news stored each group's defaults beside
its values, inserted from a JSON file, with the default also written as prose
in the Product Model and nothing checking they agreed. The definition is now
the one home of a default; `sync` seeds from it, reset returns to it, and
`tunables check` holds the model's prose to it.

## Restarting the process to apply a change

Exiting so an orchestrator restarts the app made tests fight the runtime and
dropped work in flight. Changes apply on the next read; workers keep the last
good values while the database is away.

## A separate configuration service

A service with its own users, roles and storage would duplicate the host's
sign-in and database and become something else to run. tunables attaches to
the app's server, database and sign-in.

## One package per adapter

`@tunables/postgres`, `@tunables/nuxt` and so on would each need a name, a
version and a release. One package with subpath exports and optional peers
gives the same separation: a CLI-only install pulls no framework.
