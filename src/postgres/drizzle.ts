import { bigserial, index, jsonb, pgSchema, primaryKey, text, timestamp } from 'drizzle-orm/pg-core'

/**
 * tunables' tables as Drizzle definitions, so an app that generates its
 * migrations with drizzle-kit includes them in its own. They match
 * `tunablesSql` exactly; spec/storage.md is the contract both follow.
 *
 * Pass the schema your app keeps them in, and export the result from your
 * Drizzle schema file.
 */
export function tunablesTables(schemaName = 'tunables') {
  const schema = pgSchema(schemaName)
  const groups = schema.table('tunables_groups', {
    id: text('id').primaryKey(),
    values: jsonb('values').notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }),
    updatedBy: text('updated_by')
  })
  const revisions = schema.table('tunables_revisions', {
    id: bigserial('id', { mode: 'bigint' }).primaryKey(),
    targetKind: text('target_kind').notNull(),
    targetName: text('target_name').notNull(),
    targetId: text('target_id').notNull().default(''),
    actor: text('actor'),
    reason: text('reason'),
    changes: jsonb('changes').notNull(),
    snapshot: jsonb('snapshot'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
  }, table => [index('tunables_revisions_target_idx').on(table.targetKind, table.targetName, table.targetId, table.id.desc())])
  const records = schema.table('tunables_records', {
    collection: text('collection').notNull(),
    id: text('id').notNull(),
    data: jsonb('data').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  }, table => [primaryKey({ columns: [table.collection, table.id] })])
  const assignments = schema.table('tunables_assignments', {
    collection: text('collection').notNull(),
    subject: text('subject').notNull(),
    slot: text('slot').notNull(),
    recordId: text('record_id').notNull()
  }, table => [
    primaryKey({ columns: [table.collection, table.subject, table.slot] }),
    index('tunables_assignments_record_idx').on(table.collection, table.recordId)
  ])
  return { schema, groups, revisions, records, assignments }
}
