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
} from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';

// Users table - Clerk-linked user profiles
export const users = mysqlTable(
  'users',
  {
    id: varchar('id', { length: 255 }).primaryKey(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    username: varchar('username', { length: 255 }),
    displayName: varchar('display_name', { length: 255 }),
    avatarUrl: text('avatar_url'),
    createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
    updatedAt: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP`).onUpdateNow(),
  },
  (table) => ({
    emailIdx: index('idx_email').on(table.email),
    createdIdx: index('idx_created').on(table.createdAt),
  })
);

// Worlds table - Saved worlds/projects
export const worlds = mysqlTable(
  'worlds',
  {
    id: varchar('id', { length: 36 }).primaryKey(),
    userId: varchar('user_id', { length: 255 }).notNull(),
    title: varchar('title', { length: 255 }).notNull(),
    description: text('description'),
    state: json('state').notNull(),
    version: int('version').default(1),
    isPublic: boolean('is_public').default(false),
    shareId: varchar('share_id', { length: 36 }).unique(),
    createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
    updatedAt: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP`).onUpdateNow(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => ({
    userIdx: index('idx_user').on(table.userId),
    createdIdx: index('idx_created').on(table.createdAt),
    shareIdx: index('idx_share').on(table.shareId),
    publicIdx: index('idx_public').on(table.isPublic),
    userCreatedIdx: index('idx_worlds_user_created').on(table.userId, table.createdAt),
  })
);

// Builds table - Version history snapshots
export const builds = mysqlTable(
  'builds',
  {
    id: varchar('id', { length: 36 }).primaryKey(),
    worldId: varchar('world_id', { length: 36 }).notNull(),
    userId: varchar('user_id', { length: 255 }).notNull(),
    title: varchar('title', { length: 255 }),
    description: text('description'),
    state: json('state').notNull(),
    changeSummary: text('change_summary'),
    version: int('version').notNull(),
    parentBuildId: varchar('parent_build_id', { length: 36 }),
    createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    worldIdx: index('idx_world').on(table.worldId),
    userIdx: index('idx_user').on(table.userId),
    createdIdx: index('idx_created').on(table.createdAt),
    worldVersionIdx: index('idx_builds_world_version').on(table.worldId, table.version),
  })
);

// Changes table - Detailed changelog
export const changes = mysqlTable(
  'changes',
  {
    id: varchar('id', { length: 36 }).primaryKey(),
    buildId: varchar('build_id', { length: 36 }),
    worldId: varchar('world_id', { length: 36 }).notNull(),
    userId: varchar('user_id', { length: 255 }).notNull(),
    changeType: varchar('change_type', { length: 50 }),
    data: json('data'),
    createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    worldIdx: index('idx_world').on(table.worldId),
    buildIdx: index('idx_build').on(table.buildId),
    worldCreatedIdx: index('idx_changes_world_created').on(table.worldId, table.createdAt),
  })
);

// Shares table - World sharing
export const shares = mysqlTable(
  'shares',
  {
    id: varchar('id', { length: 36 }).primaryKey(),
    worldId: varchar('world_id', { length: 36 }).notNull(),
    userId: varchar('user_id', { length: 255 }).notNull(),
    shareId: varchar('share_id', { length: 36 }).notNull().unique(),
    shareUrl: varchar('share_url', { length: 500 }),
    viewCount: int('view_count').default(0),
    createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
    expiresAt: timestamp('expires_at'),
  },
  (table) => ({
    shareIdIdx: index('idx_share_id').on(table.shareId),
    worldIdx: index('idx_world').on(table.worldId),
  })
);

// Assets table - User asset library
export const assets = mysqlTable(
  'assets',
  {
    id: varchar('id', { length: 36 }).primaryKey(),
    userId: varchar('user_id', { length: 255 }).notNull(),
    assetType: varchar('asset_type', { length: 50 }),
    name: varchar('name', { length: 255 }).notNull(),
    data: json('data'),
    thumbnailUrl: text('thumbnail_url'),
    createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    userIdx: index('idx_user').on(table.userId),
    typeIdx: index('idx_type').on(table.assetType),
  })
);

// Preferences table - User settings
export const preferences = mysqlTable(
  'preferences',
  {
    id: varchar('id', { length: 36 }).primaryKey(),
    userId: varchar('user_id', { length: 255 }).notNull().unique(),
    data: json('data'),
    updatedAt: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP`).onUpdateNow(),
  },
  (table) => ({
    userIdx: index('idx_user').on(table.userId),
  })
);
