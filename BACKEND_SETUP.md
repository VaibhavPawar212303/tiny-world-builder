# TinyWorld Backend Setup Guide

## Overview

This backend provides persistent storage for worlds using TiDB MySQL, replacing the Netlify Functions that were removed.

**Features:**
- Cloud-based world persistence
- Build history and versioning
- User preferences storage
- Clerk authentication integration
- API for world saves, loads, and sharing

## Prerequisites

- Node.js 16+
- TiDB MySQL database (provided connection string)
- Clerk authentication setup
- Environment variables configured

## Setup Instructions

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment Variables

Create `backend/.env` file with your credentials:

```bash
cp backend/.env.example backend/.env
```

Fill in with your actual values:

```env
DB_HOST=gateway01.ap-northeast-1.prod.aws.tidbcloud.com
DB_PORT=4000
DB_USER=root
DB_PASSWORD=K0ZRGIGoA4frKTNY
DB_NAME=world

CLERK_SECRET_KEY=sk_test_eKW55AQmSfVRd3v0S55CWWu04CgPTNlNlMMKiclct3

PORT=3001
NODE_ENV=development
```

### 3. Initialize Database Schema

The database schema is defined in `db/schema.sql`. Run it on your TiDB instance:

```bash
# Using mysql client:
mysql -h gateway01.ap-northeast-1.prod.aws.tidbcloud.com -P 4000 -u root -p < db/schema.sql

# Or import via your TiDB console
```

### 4. Start Backend Server

```bash
# Development
npm run dev

# Production
npm start
```

Server runs on `http://localhost:3001`

## API Endpoints

### Authentication

All endpoints require a Clerk JWT token in the `Authorization: Bearer <token>` header.

### Users

**POST /api/users/sync**
- Synchronize user profile with Clerk
- Request: `{ email, username, displayName, avatarUrl }`
- Response: `{ success: true, userId }`

### Worlds

**GET /api/worlds**
- Get all worlds for the user
- Response: Array of worlds with metadata

**GET /api/worlds/:id**
- Get specific world with state
- Response: World object with full state

**POST /api/worlds**
- Create or update world
- Request: `{ id?, title, description, state }`
- Response: `{ success: true, id }`

**DELETE /api/worlds/:id**
- Soft delete a world
- Response: `{ success: true }`

### Build History

**GET /api/worlds/:worldId/builds**
- Get version history
- Response: Array of builds (last 50)

**POST /api/worlds/:worldId/builds**
- Create build snapshot
- Request: `{ title, description, state, changeSummary? }`
- Response: `{ success: true, buildId }`

**POST /api/worlds/:worldId/builds/:buildId/restore**
- Restore world to previous build
- Response: `{ success: true }`

### Preferences

**GET /api/preferences**
- Get user preferences
- Response: Preferences object

**PUT /api/preferences**
- Save user preferences
- Request: Any object
- Response: `{ success: true }`

## Client Integration

### Using TinyWorldAPI Client

```javascript
// Initialize client
const api = new TinyWorldAPI(
  'http://localhost:3001',  // backend URL
  async () => {
    // Function to get Clerk auth token
    const auth = window.TinyWorldAuth;
    if (!auth) return null;
    // Get token from Clerk via getUser() method
    return sessionStorage.getItem('clerk-token');
  }
);

// Save world
await api.saveWorld(
  worldId,
  'My World',
  'Description',
  worldState
);

// Get worlds
const worlds = await api.getWorlds();

// Create build (save version)
await api.createBuild(worldId, 'Major Update', '', state, 'Built new house');

// Get build history
const builds = await api.getBuilds(worldId);

// Restore to previous build
await api.restoreBuild(worldId, buildId);
```

## Database Schema

### Tables

1. **users** - User accounts linked to Clerk
2. **worlds** - Saved worlds with current state
3. **builds** - Version history for worlds
4. **changes** - Detailed changelog (optional)
5. **shares** - Public sharing links
6. **assets** - User asset library
7. **preferences** - User preferences

## Deployment

### Vercel (Recommended)

1. Create new Vercel project
2. Set environment variables
3. Deploy backend to Vercel serverless

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY backend/ ./
RUN npm ci
CMD ["npm", "start"]
```

### VPS/Self-Hosted

```bash
# Install PM2
npm install -g pm2

# Start server
pm2 start backend/index.js --name "tinyworld-backend"

# Set environment variables
export DB_HOST=...
export DB_PASSWORD=...
```

## Monitoring & Troubleshooting

### Check Health

```bash
curl http://localhost:3001/health
```

### View Logs

```bash
npm run dev  # Shows all logs
```

### Common Issues

**Connection timeout**
- Verify DB credentials
- Check network firewall
- Ensure TiDB instance is running

**Token verification failed**
- Verify CLERK_SECRET_KEY is correct
- Check token isn't expired
- Ensure Clerk is properly configured

**Database lock**
- Check for long-running queries
- Restart backend server

## Performance

- Database connection pooling: 10 connections
- JSON body limit: 50MB (for large world states)
- Typical response time: <100ms

## Security

- JWT token validation on all endpoints
- User isolation (users only access their own data)
- Soft deletes (data not permanently removed)
- Input validation via JSON schema
- CORS enabled for frontend origin

## Future Enhancements

- [ ] Real-time collaboration via WebSockets
- [ ] Automatic backups
- [ ] World sharing with permissions
- [ ] Asset versioning and tagging
- [ ] Search and filtering
- [ ] Rate limiting
- [ ] Audit logging
