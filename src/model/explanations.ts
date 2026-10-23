/**
 * Explanations of fields, in the words of the Product Model's own description of
 * each fact. `tunables explain` generates them from product-model/entities, so a
 * field explains itself where it is set without anyone retyping the model.
 */
export interface FactExplanation {
  text: string
  /** The default as the model states it, such as "12" or "06:00". */
  default: string | null
}

export interface EntityExplanations {
  title: string
  facts: Record<string, FactExplanation>
}

export type Explanations = Readonly<Record<string, EntityExplanations>>

export function explain(explanations: Explanations | undefined, entity: string | undefined, fact: string | undefined): FactExplanation | undefined {
  if (!explanations || !entity || !fact) return undefined
  return explanations[entity]?.facts[fact]
}
