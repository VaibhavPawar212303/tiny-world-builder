# Phase 2: Client Integration - Complete

## Overview

Phase 2 integrates the backend API with the frontend application, enabling:
- Cloud persistence of worlds
- Build history and version control
- Multi-device synchronization
- Automatic session continuation

## Architecture

```
Frontend (Browser)
├── tiny-world-builder.html
├── vendor/tinyworld-api-client.js    ← API wrapper
├── scripts/backend-init.js            ← Initialization & auth
├── scripts/build-history-ui.js        ← Version control UI
└── engine/world/29-persistence-api.js ← Updated to sync with backend
       ↓
Backend (Node.js/Express)
├── backend/index.js                   ← API server
└── db/schema.sql                      ← Database schema
       ↓
TiDB MySQL
├── users
├── worlds                             ← Current world state
├── builds                             ← Version history
├── changes                            ← Detailed changelog
└── shares, assets, preferences
```

## Components Added

### 1. API Client (`vendor/tinyworld-api-client.js`)

JavaScript class that wraps backend API calls:

```javascript
const api = new TinyWorldAPI(baseUrl, getAuthToken);

// User management
api.syncUser(email, username, displayName, avatarUrl);

// Worlds
api.getWorlds();
api.getWorld(id);
api.saveWorld(id, title, description, state);
api.deleteWorld(id);

// Build history
api.getBuilds(worldId);
api.createBuild(worldId, title, description, state, changeSummary);
api.restoreBuild(worldId, buildId);

// Preferences
api.getPreferences();
api.savePreferences(data);
```

### 2. Backend Initialization (`scripts/backend-init.js`)

- Waits for Clerk auth to be ready
- Initializes TinyWorldAPI client
- Syncs user profile with backend
- Checks backend health
- Sets `window.tinyWorldBackendReady` flag

### 3. Build History UI (`scripts/build-history-ui.js`)

New UI panel for version control:
- List of all build versions
- Quick restore functionality
- Manual save button
- Creation timestamp and summaries
- Responsive panel that slides in from right

**Access:** Button in top-right of builder, or accessible via `window.buildHistoryUI`

### 4. Persistence Integration (`engine/world/29-persistence-api.js`)

Updated `saveState()` function:
1. Saves to localStorage (fallback)
2. If backend available, syncs to database
3. Maintains backward compatibility
4. Error handling (fails gracefully if backend unavailable)

## Data Flow

### On World Save

```
User edits world
     ↓
saveState() called (800ms debounce)
     ↓
Save to localStorage
     ↓
Backend available?
     ├─ YES → POST /api/worlds (async, non-blocking)
     └─ NO → Continue with localStorage only
```

### On Build History Access

```
User clicks "Build History"
     ↓
buildHistoryUI.open()
     ↓
GET /api/worlds/:id/builds
     ↓
Display list of versions
     ↓
User clicks version
     ↓
POST /api/worlds/:id/builds/:buildId/restore
     ↓
location.reload()
```

### On App Launch

```
Page loads
     ↓
backend-init.js runs
     ↓
Wait for Clerk auth
     ↓
Initialize TinyWorldAPI
     ↓
Sync user profile
     ↓
Check backend health
     ↓
build-history-ui.js initializes
     ↓
Ready for world save/load
```

## Authentication Flow

1. User logs in with Clerk (via tinyworld-auth.js)
2. Clerk stores JWT token
3. backend-init.js retrieves token from sessionStorage/localStorage
4. TinyWorldAPI includes token in all API requests
5. Backend verifies token and syncs user profile
6. All subsequent requests authenticated via Bearer token

## Fallback Behavior

If backend is unavailable:
- ✅ localStorage works as before
- ✅ Saves continue locally
- ❌ No cloud sync
- ❌ No build history
- ✅ User is warned in console

To test fallback, uncomment in `backend-init.js`:
```javascript
// window.tinyWorldBackendReady = false; // Force fallback
```

## Configuration

### Development

Backend URL: `http://localhost:3001`
(Detected automatically if on localhost)

### Production

Update `backend-init.js`:
```javascript
const BACKEND_URL = 'https://your-backend.com';
```

Or use environment variable during build:
```javascript
const BACKEND_URL = window.location.origin; // Same origin
```

## Testing

### Manual Testing

1. **Verify backend connection:**
   ```javascript
   // In browser console
   window.tinyWorldAPI.healthCheck().then(console.log);
   ```

2. **Check user sync:**
   ```javascript
   // Should see user synced message in console
   ```

3. **Save a world:**
   - Edit world
   - Wait 800ms (debounce)
   - Check browser console for sync confirmation

4. **Create a build:**
   - Click "Build History" button
   - Click "Save Build"
   - Enter title
   - Verify build appears in list

5. **Restore a build:**
   - Make changes to world
   - Open Build History
   - Click an older version
   - Confirm restore
   - Page reloads with restored state

### Automated Testing

```bash
# Test backend
curl http://localhost:3001/health

# Test API with token
curl -H "Authorization: Bearer <token>" \
  http://localhost:3001/api/worlds
```

## Troubleshooting

### Backend Not Connecting

**Check:**
1. Backend server running: `curl http://localhost:3001/health`
2. Network requests in DevTools
3. Browser console for errors
4. CORS headers (should be enabled)

### Builds Not Saving

**Check:**
1. User authenticated (check sessionStorage for token)
2. Backend health
3. Database connection
4. Network tab in DevTools

### User Not Syncing

**Check:**
1. Clerk auth working
2. Email available to backend-init.js
3. Database users table exists

## Performance

- **Save debounce:** 800ms (batches rapid changes)
- **API timeout:** 30s per request
- **Build history:** Shows last 50 versions
- **Offline:** Works fine, syncs when backend available

## Security

- All API calls require Bearer token
- Tokens verified via Clerk JWT
- User can only access their own data
- No sensitive data in URLs
- CORS restricted to frontend origin

## Future Enhancements

- [ ] Real-time collaboration via WebSockets
- [ ] Build diff viewer (show what changed)
- [ ] Auto-save builds at intervals
- [ ] Build tags and annotations
- [ ] Automatic backups
- [ ] World sharing with permissions
- [ ] Undo/redo within session
