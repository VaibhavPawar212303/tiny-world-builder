-- TinyWorld Builder Database Schema for TiDB MySQL
-- Tables for world persistence, build history, and user management

-- Users table (linked to Clerk authentication)
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(255) PRIMARY KEY COMMENT 'Clerk user ID',
  email VARCHAR(255) NOT NULL UNIQUE,
  username VARCHAR(255),
  display_name VARCHAR(255),
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_created (created_at)
) COMMENT='User accounts linked to Clerk';

-- Worlds table (main world data)
CREATE TABLE IF NOT EXISTS worlds (
  id VARCHAR(36) PRIMARY KEY COMMENT 'UUID for world',
  user_id VARCHAR(255) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  state JSON NOT NULL COMMENT 'World state: cells, islands, moorings, landscape',
  version INT DEFAULT 1,
  is_public BOOLEAN DEFAULT FALSE,
  share_id VARCHAR(36) UNIQUE COMMENT 'Public share URL ID',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL COMMENT 'Soft delete timestamp',
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user (user_id),
  INDEX idx_created (created_at),
  INDEX idx_share (share_id),
  INDEX idx_public (is_public)
) COMMENT='Saved worlds and their current state';

-- Builds table (version history)
CREATE TABLE IF NOT EXISTS builds (
  id VARCHAR(36) PRIMARY KEY COMMENT 'UUID for build',
  world_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(255) NOT NULL,
  title VARCHAR(255),
  description TEXT,
  state JSON NOT NULL COMMENT 'World state at this version',
  change_summary TEXT COMMENT 'What changed in this build',
  version INT NOT NULL,
  parent_build_id VARCHAR(36) COMMENT 'Previous build in chain',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (world_id) REFERENCES worlds(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_world (world_id),
  INDEX idx_user (user_id),
  INDEX idx_created (created_at),
  INDEX idx_version (world_id, version)
) COMMENT='Build history with version tracking';

-- Changes table (detailed change log)
CREATE TABLE IF NOT EXISTS changes (
  id VARCHAR(36) PRIMARY KEY COMMENT 'UUID for change',
  build_id VARCHAR(36),
  world_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(255) NOT NULL,
  change_type VARCHAR(50) COMMENT 'cell_placed, cell_removed, landscape_modified, etc',
  data JSON COMMENT 'Change details (coordinates, old value, new value)',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (build_id) REFERENCES builds(id) ON DELETE SET NULL,
  FOREIGN KEY (world_id) REFERENCES worlds(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_world (world_id),
  INDEX idx_build (build_id),
  INDEX idx_created (created_at)
) COMMENT='Detailed changelog for audit trail and undo/redo';

-- Shares table (world sharing)
CREATE TABLE IF NOT EXISTS shares (
  id VARCHAR(36) PRIMARY KEY COMMENT 'UUID for share record',
  world_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(255) NOT NULL,
  share_id VARCHAR(36) NOT NULL UNIQUE COMMENT 'Public share URL slug',
  share_url VARCHAR(500) COMMENT 'Full share URL',
  view_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NULL,
  FOREIGN KEY (world_id) REFERENCES worlds(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_share_id (share_id),
  INDEX idx_world (world_id)
) COMMENT='Public world sharing links';

-- Assets table (user asset library)
CREATE TABLE IF NOT EXISTS assets (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  asset_type VARCHAR(50) COMMENT 'model, texture, decoration, etc',
  name VARCHAR(255) NOT NULL,
  data JSON COMMENT 'Asset data/metadata',
  thumbnail_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user (user_id),
  INDEX idx_type (asset_type)
) COMMENT='User asset library';

-- Preferences table (user preferences)
CREATE TABLE IF NOT EXISTS preferences (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL UNIQUE,
  data JSON COMMENT 'User preferences and settings',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user (user_id)
) COMMENT='User preferences and settings';

-- Create indexes for common queries
CREATE INDEX idx_worlds_user_created ON worlds(user_id, created_at DESC);
CREATE INDEX idx_builds_world_version ON builds(world_id, version DESC);
CREATE INDEX idx_changes_world_created ON changes(world_id, created_at DESC);
