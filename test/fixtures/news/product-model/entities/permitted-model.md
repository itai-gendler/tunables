
# Permitted Model

A language model Run Configs may choose for writing or for Screening, with the reasoning efforts it
takes and what it costs. Every environment starts with two, both Available: GPT-OSS 20B and GPT-OSS
120B through Groq, each taking low, medium and high effort.

## Information kept

- **Model id** — the provider's name for it, fixed once added
- **Label** — what administration calls it
- **Note** — what it is used for
- **Efforts** — the reasoning efforts it takes, or none when it takes no effort
- **Input rate** — what a million input tokens cost, in dollars
- **Cached input rate** — what a million cached input tokens cost, in dollars
- **Output rate** — what a million output tokens cost, in dollars
- **Context window** — the most tokens one call to it may hold, from which a writer call's cost is reserved; GPT-OSS takes 131,072

## States

### Available

Run Configs may choose it.

### Retired

No Run Config may choose it. Runs it already served keep their recorded cost.
