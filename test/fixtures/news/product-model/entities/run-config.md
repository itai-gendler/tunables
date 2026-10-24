
# Run Config

A named, reusable definition of how Briefs of one cadence are run: what a Brief Run produces and
what its writing may spend, and what Screening may spend, whether in a Brief Run or in a Test.
Every environment starts with two, both defaults: Daily (a 24-hour Window, written at 06:00 every
day, at most 10 Stories) and Weekly (a 168-hour Window, written at 06:00 on Mondays, at most 15
Stories). Every value stays within the Run Settings, and its models are Available ones.

## Information kept

- **Key** — its stable name
- **Label** — what administration calls it
- **Slot** — Daily or Weekly; fixed once created
- **Default** — whether readers' Briefs of its slot run under it unless they are assigned another
- **Readers assigned** — how many readers are assigned it rather than their slot's default
- **Window** — the hours an Edition reports on, at most the Longest window
- **Hour** — the local hour its scheduled Editions are written at or after, 0 to 23
- **Day** — the weekday its scheduled Editions are written on, or every day; either slot may have either
- **Story ceiling** — the most Stories an Edition may hold, at most the Story limit
- **Framing** — the editorial instructions the writer is given
- **Model** — the writing model, an Available Model
- **Effort** — the writing model's reasoning effort, one its Model takes
- **Budget** — the most a Run may spend, at most the Budget limit
- **Turns** — the most model turns, at most the Turns limit
- **Wall time** — the longest a Run may take, at most the Wall time limit
- **Screening model** — the model Screening runs on, an Available Model
- **Screening effort** — Screening's reasoning effort, one its Model takes
- **Screening budget** — the most Screening may spend, at most the Screening budget limit
- **Screening calls** — the most model calls Screening may make, at most the Screening calls limit
- **Screening wall time** — the longest Screening may take, at most the Screening wall time limit
