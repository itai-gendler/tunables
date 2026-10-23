---
domain: definitions
references:
  - kind: code
    role: implementation
    target: src/model/environment.ts#defineEnvironment
---

# Deployment value

A value a deployment sets in its environment and nobody tunes while the app
runs, such as a lock id or a batch size. It is declared beside the settings, read
and checked from the environment when the app starts, and listed in
`.env.example`.

## Information kept

- **Name** — the environment variable it is read from
- **Kind** — a whole number, a number, a text, on or off, or one of a list
- **Description** — what it is for, written above it in `.env.example`
- **Default** — what it is when the environment does not set it; none when it must be set
- **Allowed values** — the least and most it may be, or the values it may be one of
- **Section** — the part of `.env.example` it is listed under
