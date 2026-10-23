/**
 * tunables: runtime settings with guardrails, for the app you already run.
 *
 * Declare each setting once, with its kind, unit and default; store values in
 * the app's own database; change them only through checked saves that record
 * a revision. See https://tunables.dev/docs.
 */
export {
  number,
  range,
  size,
  toggle,
  choice,
  choices,
  text,
  pick,
  fieldLabel,
  formatValue,
  fieldSchema
} from './model/kinds.js'
export type {
  Field,
  Fields,
  FieldInfo,
  FieldValue,
  ValuesOf,
  Choice,
  NumberField,
  RangeField,
  SizeField,
  ToggleField,
  ChoiceField,
  ChoicesField,
  TextField,
  PickField
} from './model/kinds.js'
export { BUILT_IN_UNITS, formatAmount } from './model/units.js'
export type { Unit, BuiltInUnit } from './model/units.js'
export {
  defineGroup,
  definePresets,
  defineCatalog,
  defineEffects,
  defaultsOf,
  toProblems
} from './model/definitions.js'
export type {
  Problem,
  RuleResult,
  GroupDefinition,
  PresetsDefinition,
  CatalogDefinition,
  Effect,
  Effects,
  Preset,
  CatalogEntry,
  CatalogState,
  SettingsView,
  CatalogView,
  AnyGroup,
  AnyPresets,
  AnyCatalog,
  GroupValues,
  PresetValues,
  PresetSlot,
  CatalogValues
} from './model/definitions.js'
export { defineEnvironment, renderEnvExample, env, EnvironmentError } from './model/environment.js'
export type { Environment, EnvironmentValues, DeploymentValue } from './model/environment.js'
export { explain } from './model/explanations.js'
export type { Explanations, EntityExplanations, FactExplanation } from './model/explanations.js'
export {
  createTunables,
  TunablesError,
  TunablesMissing,
  TunablesInvalid,
  TunablesUnknown
} from './engine/tunables.js'
export type {
  Tunables,
  AnyTunables,
  PresetsApi,
  CatalogApi,
  TunablesOptions,
  Actor,
  ChangeOptions,
  Outcome,
  GroupEntry,
  SyncReport,
  Guard,
  GuardArgs,
  NotesProvider,
  UsesProvider
} from './engine/tunables.js'
export type { Description, GroupDescription, PresetsDescription, CatalogDescription, FieldDescription } from './engine/describe.js'
export { memoryStore } from './engine/memory-store.js'
export type {
  TunablesStore,
  StoreSession,
  StoredGroup,
  StoredRecord,
  Revision,
  RevisionTarget,
  NewRevision,
  Change,
  Assignment,
  RevisionQuery
} from './engine/store.js'
