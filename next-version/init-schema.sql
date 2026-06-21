-- Users table
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(255) PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  username VARCHAR(255),
  display_name VARCHAR(255),
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_email (email),
  KEY idx_created (created_at)
);

-- Worlds table
CREATE TABLE IF NOT EXISTS worlds (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  state JSON NOT NULL,
  version INT DEFAULT 1,
  is_public BOOLEAN DEFAULT FALSE,
  share_id VARCHAR(36) UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP,
  KEY idx_user (user_id),
  KEY idx_created (created_at),
  KEY idx_share (share_id),
  KEY idx_public (is_public),
  KEY idx_worlds_user_created (user_id, created_at),
  CONSTRAINT fk_worlds_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Builds table
CREATE TABLE IF NOT EXISTS builds (
  id VARCHAR(36) PRIMARY KEY,
  world_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(255) NOT NULL,
  title VARCHAR(255),
  description TEXT,
  state JSON NOT NULL,
  change_summary TEXT,
  version INT NOT NULL,
  parent_build_id VARCHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY idx_world (world_id),
  KEY idx_user (user_id),
  KEY idx_created (created_at),
  KEY idx_builds_world_version (world_id, version),
  CONSTRAINT fk_builds_world FOREIGN KEY (world_id) REFERENCES worlds(id) ON DELETE CASCADE,
  CONSTRAINT fk_builds_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Changes table
CREATE TABLE IF NOT EXISTS changes (
  id VARCHAR(36) PRIMARY KEY,
  build_id VARCHAR(36),
  world_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(255) NOT NULL,
  change_type VARCHAR(50),
  data JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY idx_world (world_id),
  KEY idx_build (build_id),
  KEY idx_changes_world_created (world_id, created_at),
  CONSTRAINT fk_changes_world FOREIGN KEY (world_id) REFERENCES worlds(id) ON DELETE CASCADE,
  CONSTRAINT fk_changes_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Shares table
CREATE TABLE IF NOT EXISTS shares (
  id VARCHAR(36) PRIMARY KEY,
  world_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(255) NOT NULL,
  share_id VARCHAR(36) NOT NULL UNIQUE,
  share_url VARCHAR(500),
  view_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP,
  KEY idx_share_id (share_id),
  KEY idx_world (world_id),
  CONSTRAINT fk_shares_world FOREIGN KEY (world_id) REFERENCES worlds(id) ON DELETE CASCADE,
  CONSTRAINT fk_shares_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Assets table
CREATE TABLE IF NOT EXISTS assets (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  asset_type VARCHAR(50),
  name VARCHAR(255) NOT NULL,
  data JSON,
  thumbnail_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY idx_user (user_id),
  KEY idx_type (asset_type),
  CONSTRAINT fk_assets_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Preferences table
CREATE TABLE IF NOT EXISTS preferences (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL UNIQUE,
  data JSON,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_user (user_id),
  CONSTRAINT fk_preferences_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
