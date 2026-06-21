import {
  mysqlTable,
  varchar,
  text,
  json,
  boolean,
  int,
  timestamp,
  uniqueIndex,
  index,
  primaryKey,
} from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';

// Users table - Clerk-linked user profiles
export const users = mysqlTable(
  'users',
  {
    id: varchar('id', { length: 255 }).primaryKey().default(sql`(UUID())`),
    clerkId: varchar('clerk_id', { length: 255 }).notNull().unique(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    firstName: varchar('first_name', { length: 255 }),
    lastName: varchar('last_name', { length: 255 }),
    avatarUrl: varchar('avatar_url', { length: 255 }),
    createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
    updatedAt: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP`).onUpdateNow(),
  },
  (table) => ({
    clerkIdIdx: index('idx_clerk_id').on(table.clerkId),
  })
);

// Worlds table - Saved worlds/projects
export const worlds = mysqlTable(
  'worlds',
  {
    id: varchar('id', { length: 255 }).primaryKey(),
    clerkId: varchar('clerk_id', { length: 255 }).notNull(),
    title: varchar('title', { length: 255 }).notNull(),
    description: text('description'),
    state: json('state'),
    version: int('version').default(1),
    isPublic: boolean('is_public').default(false),
    createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
    updatedAt: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP`).onUpdateNow(),
  },
  (table) => ({
    clerkIdIdx: index('idx_worlds_clerk_id').on(table.clerkId),
    createdAtIdx: index('idx_worlds_created_at').on(table.createdAt),
  })
);

// Builds table - Version history snapshots
export const builds = mysqlTable(
  'builds',
  {
    id: varchar('id', { length: 255 }).primaryKey(),
    worldId: varchar('world_id', { length: 255 }).notNull(),
    clerkId: varchar('clerk_id', { length: 255 }).notNull(),
    title: varchar('title', { length: 255 }),
    description: text('description'),
    state: json('state'),
    changeSummary: text('change_summary'),
    version: int('version'),
    parentBuildId: varchar('parent_build_id', { length: 255 }),
    createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    worldIdIdx: index('idx_builds_world_id').on(table.worldId),
    clerkIdIdx: index('idx_builds_clerk_id').on(table.clerkId),
  })
);

// Changes table - Detailed changelog
export const changes = mysqlTable(
  'changes',
  {
    id: varchar('id', { length: 255 }).primaryKey().default(sql`(UUID())`),
    buildId: varchar('build_id', { length: 255 }).notNull(),
    worldId: varchar('world_id', { length: 255 }).notNull(),
    clerkId: varchar('clerk_id', { length: 255 }).notNull(),
    changeType: varchar('change_type', { length: 50 }),
    data: json('data'),
    createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    worldIdIdx: index('idx_changes_world_id').on(table.worldId),
    buildIdIdx: index('idx_changes_build_id').on(table.buildId),
  })
);

// Assets table - User asset library
export const assets = mysqlTable(
  'assets',
  {
    id: varchar('id', { length: 255 }).primaryKey().default(sql`(UUID())`),
    clerkId: varchar('clerk_id', { length: 255 }).notNull(),
    assetType: varchar('asset_type', { length: 50 }),
    name: varchar('name', { length: 255 }),
    data: json('data'),
    thumbnailUrl: varchar('thumbnail_url', { length: 255 }),
    createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    clerkIdIdx: index('idx_assets_clerk_id').on(table.clerkId),
    typeIdx: index('idx_assets_type').on(table.assetType),
  })
);

// Preferences table - User settings
export const preferences = mysqlTable(
  'preferences',
  {
    id: varchar('id', { length: 255 }).primaryKey().default(sql`(UUID())`),
    clerkId: varchar('clerk_id', { length: 255 }).notNull().unique(),
    data: json('data'),
    updatedAt: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP`).onUpdateNow(),
  },
  (table) => ({
    clerkIdIdx: index('idx_preferences_clerk_id').on(table.clerkId),
  })
);
