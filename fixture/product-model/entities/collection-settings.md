---
singleton: true
---

# Collection Settings

The environment's one set of collection settings: which Feeds the worker keeps collected and how
often, how the worker collects, what a new Feed starts with, and the bounds every retrieval stays
within. Every environment starts with the default each setting states, and an Administrator
changes them in Collection's settings.

## Information kept

- **Check interval** — how often the worker looks for due collection and due Editions; defaults to 5 minutes
- **Scheduled collection** — which Feeds the worker keeps collected on its own: Off; Feeds Briefs read; or Every Feed, every enabled, active official Feed as well as every Feed a Brief reads; defaults to Feeds Briefs read
- **Refresh interval** — how long after its last complete collection a Feed scheduled collection covers is requested again; defaults to 60 minutes
- **Feeds at once per worker** — how many Feeds each worker collects at the same time, never two from one site at once; defaults to 2
- **Worker contact interval** — how often each worker reports that it is alive; defaults to 15 seconds
- **Reconcile interval** — how often the worker settles Collection Items the queue and the Product disagree on; defaults to 60 seconds
- **Queue polling interval** — how often an idle worker asks the queue for the next Feed; defaults to 2 seconds
- **Shutdown grace** — how long a stopping worker waits for its attempts in flight, interrupted at once, to save what they collected and record themselves for retry; defaults to 45 seconds
- **New-feed lookback days** — the lookback a newly registered Feed starts with; defaults to 30 days
- **New-feed articles per retrieval** — the Articles per retrieval a newly registered Feed starts with; defaults to 100
- **New-feed full text** — whether a newly registered Feed starts with full text; defaults to On
- **New-feed collection enabled** — whether a newly registered Feed starts collected; defaults to On
- **Most articles per retrieval** — the most Articles any Feed may keep from one Retrieval; defaults to 500
- **Longest lookback** — the most days of history any Feed may ask for; defaults to 365 days
- **Largest response** — the biggest page or feed collection reads; defaults to 2 MB
- **Request time limit** — how long one request may take; defaults to 15 seconds
- **Attempt time limit** — how long one collection attempt may take; defaults to 300 seconds
- **Most redirects** — how many redirects one request follows, each checked for a public address; defaults to 5
- **Attempts per item** — how many times one Feed is tried in a Collection Batch; defaults to 3
- **Longest retry-after followed** — the longest a publisher may ask collection to wait before the attempt fails instead; defaults to 30 minutes
- **Full-text tries** — how many times an Article's full text, or its image, is tried; defaults to 5
- **Collected-recently window** — a Feed put in a Brief is not requested again when collected within it; defaults to 15 minutes
- **Stopped-publishing threshold** — a Feed with nothing newer than this is shown as having stopped publishing; defaults to 21 days
- **Entries read per feed** — the most entries read from one feed document; defaults to 5000
- **Article text kept** — the most text kept for one Article; defaults to 100,000 characters
- **Full-text minimum** — extracted text shorter than this is not taken as the full text; defaults to 200 characters
- **Image minimum size** — an Article's image is kept only at least this size; defaults to 400 by 225 pixels
- **Save chunk** — how many Articles collection saves together in one write; defaults to 10
- **Longest retry wait** — the latest a retry is scheduled, whatever the publisher asks; defaults to 1 day, and it is never shorter than the Longest retry-after followed
- **Full-text retry start** — the first wait before a failed page or image is tried again, doubling each time; defaults to 5 minutes
- **Full-text retry cap** — the longest that doubling wait grows; defaults to 1 day, and it is never shorter than the Full-text retry start
- **First retry delay** — the wait before the queue retries a failed attempt; defaults to 30 seconds
- **Longest retry delay** — the longest that queue wait grows to; defaults to 600 seconds, and it is never shorter than the First retry delay
- **Job expiry** — an attempt not finished by then is given up by the queue; defaults to 360 seconds, and it is always longer than the Attempt time limit
- **Job heartbeat** — how often a running attempt tells the queue it is alive; defaults to 30 seconds, and it is always shorter than the Job expiry
- **Waiting jobs kept** — how long a queue job that has not run is kept before the queue drops it; defaults to 14 days
- **Finished jobs kept** — how long a finished queue job stays listed before it is deleted; defaults to 30 days
- **Awaiting recovery after** — a running Collection Item with no progress this long is shown as awaiting recovery; defaults to 2 minutes
- **Worker unresponsive after** — a worker silent this long is shown as unresponsive; defaults to 60 seconds, and it is always longer than the Worker contact interval
- **Collection page refresh** — how often an open Collection page reads its counters, Feeds and queue again; defaults to 10 seconds
- **Collection history refresh** — how often History and an open Collection Batch are read again while a Batch is running; defaults to 5 seconds
- **Sources refresh** — how often the Sources page is read again while a Feed it shows is being collected; defaults to 3 seconds
- **Throughput window** — how many hours Collection's Feeds finished per hour covers; defaults to 24 hours
- **Recent failures window** — how far back Collection counts Feeds that failed; defaults to 24 hours
- **Open Feeds shown** — the most open Feeds Needs attention lists; defaults to 200
- **Failing Feeds shown** — the most Feeds Failing Feeds lists; defaults to 50
- **Stopped-publishing Feeds shown** — the most Feeds that stopped publishing Failing Feeds lists; defaults to 50
- **Queue warnings shown** — the most queue warnings, and schema problems, the Queue tab lists; defaults to 20
- **Queue disagreements shown** — the most disagreements between the queue and Collection Items the Queue tab lists; defaults to 50
- **Catalog updates shown** — the most Catalog Updates Sources lists; defaults to 20
- **Workers shown** — the most running workers Collection lists; defaults to 5
