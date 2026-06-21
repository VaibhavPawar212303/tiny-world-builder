-- Users table
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(255) PRIMARY KEY DEFAULT (UUID()),
  clerk_id VARCHAR(255) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  avatar_url VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY (clerk_id)
);

-- Worlds table (saved worlds/projects)
CREATE TABLE IF NOT EXISTS worlds (
  id VARCHAR(255) PRIMARY KEY,
  clerk_id VARCHAR(255) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  state JSON,
  version INT DEFAULT 1,
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (clerk_id) REFERENCES users(clerk_id),
  KEY (clerk_id),
  KEY (created_at)
);

-- Builds table (version history)
CREATE TABLE IF NOT EXISTS builds (
  id VARCHAR(255) PRIMARY KEY,
  world_id VARCHAR(255) NOT NULL,
  clerk_id VARCHAR(255) NOT NULL,
  title VARCHAR(255),
  description TEXT,
  state JSON,
  change_summary TEXT,
  version INT,
  parent_build_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (world_id) REFERENCES worlds(id),
  FOREIGN KEY (clerk_id) REFERENCES users(clerk_id),
  KEY (world_id),
  KEY (clerk_id)
);

-- Changes table (detailed changelog)
CREATE TABLE IF NOT EXISTS changes (
  id VARCHAR(255) PRIMARY KEY DEFAULT (UUID()),
  build_id VARCHAR(255) NOT NULL,
  world_id VARCHAR(255) NOT NULL,
  clerk_id VARCHAR(255) NOT NULL,
  change_type VARCHAR(50),
  data JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (build_id) REFERENCES builds(id),
  FOREIGN KEY (world_id) REFERENCES worlds(id),
  FOREIGN KEY (clerk_id) REFERENCES users(clerk_id),
  KEY (world_id),
  KEY (build_id)
);

-- Assets table (user asset library)
CREATE TABLE IF NOT EXISTS assets (
  id VARCHAR(255) PRIMARY KEY DEFAULT (UUID()),
  clerk_id VARCHAR(255) NOT NULL,
  asset_type VARCHAR(50),
  name VARCHAR(255),
  data JSON,
  thumbnail_url VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (clerk_id) REFERENCES users(clerk_id),
  KEY (clerk_id),
  KEY (asset_type)
);

-- Preferences table (user settings)
CREATE TABLE IF NOT EXISTS preferences (
  id VARCHAR(255) PRIMARY KEY DEFAULT (UUID()),
  clerk_id VARCHAR(255) NOT NULL UNIQUE,
  data JSON,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (clerk_id) REFERENCES users(clerk_id),
  KEY (clerk_id)
);
