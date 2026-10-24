---
singleton: true
---

# Run Settings

The environment's one set of Run settings: the limits every Run Config and every Run stay within,
when scheduled Editions are written, how Screening and the writer work, and the editorial Policy's
lengths. Every environment starts with the default each setting states, and an Administrator changes
them in Run Configs' settings.

## Information kept

- **Budget limit** — the most any Run may spend; defaults to 25 dollars
- **Turns limit** — the most model turns any Run may take; defaults to 400
- **Wall time limit** — the longest any Run may take; defaults to 2700 seconds
- **Story limit** — the most Stories any Edition may hold; defaults to 24, and it is never more than Sections per edition times Stories per section
- **Screening budget limit** — the most any Screening may spend; defaults to 25 dollars
- **Screening calls limit** — the most model calls any Screening may make; defaults to 400
- **Screening wall time limit** — the longest any Screening may take; defaults to 2700 seconds
- **Articles screened** — the most Articles one Screening reads; defaults to 1500
- **Articles screened per feed** — the most Articles one Screening reads from any one Feed; defaults to 300, and it is never more than Articles screened
- **Longest window** — the most hours a Run Config's Window may cover; defaults to 744 hours
- **Silent run limit** — a Run that stops reporting this long is closed as interrupted; defaults to 20 minutes
- **Run heartbeat failures** — a Brief Run or Screening Run that cannot confirm its own state this many times in a row stops; defaults to 30
- **Scheduled editions** — whether the scheduler writes each Brief's Edition on its Run Config's day and hour; defaults to On
- **Editions per check** — the most scheduled Editions started at one check; defaults to 20
- **Collection wait** — how long a due scheduled Edition waits for its Feeds' collection before it is written from what has been collected; defaults to 2 hours
- **Latest write hour** — a waiting scheduled Edition is never written past this hour of the reader's day; defaults to 23:00
- **Articles per screening call** — how many Articles one Screening model call judges; defaults to 60
- **Screening calls at once** — how many model calls one Screening makes together; defaults to 3
- **Screening output tokens** — the most one Screening call may answer with; defaults to 8192
- **Description screened** — how much of the start of each Article's Text Screening reads, its full text where one was fetched; defaults to 280 characters, and changing it redoes saved Screening judgments
- **Shortlist size** — the most lead Articles the writer is handed; defaults to 24
- **Shortlist per story** — how many leads the writer is handed for each Story an Edition may hold; defaults to 3
- **Writer attempts** — how many drafts the writer may return for one Edition: the first, then repairs of a rejected one; defaults to 2
- **Writer output tokens** — the most an Edition draft may run to; defaults to 16,384
- **Articles in the packet** — the most Articles the writer reads; defaults to 80
- **Article text in the packet** — the most of each Article's text the writer reads; defaults to 6000 characters
- **Shortest article text in the packet** — each Article keeps at least this much text when the packet is tight; defaults to 500 characters, and it is never more than Article text in the packet
- **Writer input size** — the most the whole packet sent to the writer may hold; defaults to 100 KB
- **Earlier coverage** — how much of the Brief's earlier Stories the writer is shown; defaults to 12 KB, and it is always smaller than the Writer input size
- **Repair notes** — how much of a rejected draft's problems is sent back to the writer to repair; defaults to 10 KB
- **Story summary length** — how long each Story's account of what happened is; defaults to 40 to 360 characters
- **Why-it-matters length** — how long each Story's line on why it matters is; defaults to 20 to 240 characters
- **Story title length** — how long each Story's title is; defaults to 10 to 160 characters
- **Section title length** — how long each Section's title is; defaults to 3 to 80 characters
- **Sections per edition** — the most Sections one Edition holds; defaults to 6
- **Stories per section** — the most Stories one Section holds; defaults to 4
- **Citations per story** — the most passages one Story cites; defaults to 5
- **Nothing-to-report length** — how long the writer's note is when nothing cleared the bar; defaults to 20 to 500 characters
- **Cited passage** — how much text around each citation the writer and the draft check work with; defaults to 500 characters
- **Screening reason length** — the most words Screening gives for why it left an Article out; defaults to 12 words
- **Run progress refresh** — how often a reader's Map, Brief or New Brief, while in view, asks again how its Briefs' Editions are going, so one in progress moves on and one the schedule starts shows up; defaults to 4 seconds
- **Finished Edition shown** — how long the Map keeps showing a Brief's Edition that finished; defaults to 6 hours
- **Runs page refresh** — how often administration's Runs and an open Run are read again while one is active; defaults to 5 seconds
- **Failed Runs window** — how far back Overview counts Runs that failed; defaults to 24 hours
- **Recent Editions window** — how far back Overview counts Editions written; defaults to 7 days
