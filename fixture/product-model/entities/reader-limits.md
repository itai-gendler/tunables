---
singleton: true
---

# Reader Limits

The environment's one set of limits on what each reader keeps and how often they may ask for work
the product pays for. Every environment starts with the default each limit states, and an
Administrator changes them in Readers' limits. Lowering a limit keeps what readers already have
above it; only new additions past it are refused.

## Information kept

- **Briefs per reader** — how many Briefs one reader keeps; defaults to 12
- **Feeds per brief** — how many Feeds one Brief reads; defaults to 40
- **Examples per brief** — how many Should be in and Not for me marks one Brief keeps; defaults to 30
- **About me length** — the most characters About me holds; defaults to 1500
- **Brief name length** — the most characters a Brief's name holds; defaults to 60
- **Promise length** — the most characters a Brief's What it keeps you on top of holds; defaults to 1200
- **Leave out length** — the most characters a Brief's Leave out holds; defaults to 600
- **New daily brief stories** — the At most a new daily Brief starts with; defaults to 5
- **New weekly brief stories** — the At most a new weekly Brief starts with; defaults to 8
- **Site checks an hour** — how many site addresses one reader may check in any hour, counted by the web as it runs, so a restart starts the count again; defaults to 30
- **Site checks at once** — how many site checks one reader may have running together; defaults to 2
- **Screenings an hour** — how many of one reader's Screening Runs, for Tests and Brief Runs together, may start in any hour before a further Test that needs screening is refused; a requested or scheduled Edition is never refused by it; defaults to 40
- **Test overlap window** — a Test that needs screening is refused while another of the reader's Screening Runs started this recently is still queued or running; defaults to 5 minutes
