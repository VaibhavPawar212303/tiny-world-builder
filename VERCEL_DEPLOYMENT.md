# Vercel Deployment Guide

This guide explains how to deploy TinyWorld Builder to Vercel with backend API support.

## Architecture

```
Vercel
├── Frontend (dist/)
│   ├── HTML files
│   ├── Scripts
│   └── Assets
├── API Functions (api/)
│   ├── /api/health
│   ├── /api/users/sync
│   ├── /api/worlds
│   ├── /api/worlds/[id]
│   ├── /api/worlds/[id]/builds
│   ├── /api/worlds/[id]/builds/[buildId]/restore
│   └── /api/preferences
└── Database
    └── TiDB MySQL (external)
```

## Setup Steps

### 1. Connect Vercel Project

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Or link existing project
vercel link
```

### 2. Set Environment Variables in Vercel Dashboard

Go to **Project Settings → Environment Variables** and add:

```
DB_HOST=gateway01.ap-northeast-1.prod.aws.tidbcloud.com
DB_PORT=4000
DB_USER=root
DB_PASSWORD=<your_tidb_password>
DB_NAME=world

NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_<your_key>
CLERK_SECRET_KEY=sk_test_<your_key>
```

**Important:** TiDB connection string format:
```
Connection: mysql://sC5aTifmN57gWAj.root:K0ZRGIGoA4frKTNY@gateway01.ap-northeast-1.prod.aws.tidbcloud.com:4000/world
```

Extract:
- Host: `gateway01.ap-northeast-1.prod.aws.tidbcloud.com`
- Port: `4000`
- User: `root` (or custom user from TiDB)
- Password: (from your TiDB credentials)
- Database: `world`

### 3. Initialize Database

1. Go to TiDB Cloud Console
2. Open SQL Editor or connect via MySQL client
3. Run `db/schema.sql` to create tables

Or via command line:
```bash
mysql -h gateway01.ap-northeast-1.prod.aws.tidbcloud.com \
  -u root \
  -p \
  < db/schema.sql
```

### 4. Deploy

```bash
# Deploy all changes
vercel

# Or deploy production
vercel --prod
```

## Verification

After deployment, test the endpoints:

```bash
# Health check
curl https://your-vercel-domain.com/api/health

# Test with authentication
curl -H "Authorization: Bearer <token>" \
  https://your-vercel-domain.com/api/worlds
```

## API Endpoints

All endpoints are now hosted on your Vercel domain:

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/health` | Health check |
| POST | `/api/users/sync` | Sync user profile |
| GET | `/api/worlds` | List user's worlds |
| POST | `/api/worlds` | Create new world |
| GET | `/api/worlds/:id` | Get world |
| PUT | `/api/worlds/:id` | Update world |
| DELETE | `/api/worlds/:id` | Delete world |
| GET | `/api/worlds/:id/builds` | List builds |
| POST | `/api/worlds/:id/builds` | Create build |
| POST | `/api/worlds/:id/builds/:buildId/restore` | Restore build |
| GET | `/api/preferences` | Get preferences |
| PUT | `/api/preferences` | Update preferences |

## Frontend Configuration

The frontend automatically detects the API base URL:

```javascript
// In scripts/backend-init.js
const BACKEND_URL = window.location.origin; // Uses same domain
```

So all API calls go to `https://your-vercel-domain.com/api/...`

## File Structure

```
api/
├── lib/
│   ├── db.js         # Database utilities
│   └── auth.js       # Authentication helpers
├── health.js         # Health check endpoint
├── preferences.js    # User preferences
├── users/
│   └── sync.js       # User sync endpoint
└── worlds/
    ├── index.js      # List/create worlds
    ├── [id].js       # Get/update/delete world
    └── [id]/
        └── builds.js # Build history
            └── [buildId]/
                └── restore.js # Restore build
```

## Environment Variables in Vercel

### Database Configuration
- `DB_HOST` - TiDB host (required)
- `DB_PORT` - TiDB port, default 4000 (optional)
- `DB_USER` - TiDB username (required)
- `DB_PASSWORD` - TiDB password (required)
- `DB_NAME` - Database name, default "world" (optional)

### Authentication
- `CLERK_SECRET_KEY` - Clerk secret key (required)
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Clerk public key (required)

## Debugging

### Check Vercel Logs
```bash
vercel logs
```

### Common Issues

**Database Connection Failed**
- Verify TiDB is running
- Check credentials in Environment Variables
- Ensure IP whitelist includes Vercel IPs (or allow all)

**401 Unauthorized**
- Check CLERK_SECRET_KEY is correct
- Verify token is being sent in Authorization header
- Check token hasn't expired

**API Returning 404**
- Check vercel.json rewrites are correct
- Verify /api directory exists
- Check function files have `.js` extension

**CORS Errors**
- All API functions have `Access-Control-Allow-Origin: *`
- Preflight OPTIONS requests are handled
- Check browser DevTools Network tab

## Performance

- Serverless functions scale automatically
- Cold start: ~1-2 seconds first request
- Warm: <100ms typical response
- Database: TiDB handles concurrent connections
- Caching: Vercel Edge caching can be configured

## Security

✅ JWT token verification via Clerk  
✅ User data isolation (can only access own data)  
✅ CORS enabled for frontend domain  
✅ No sensitive data in URLs  
✅ Password hashing in database  

## Rollback

To rollback to previous deployment:

```bash
vercel list                # View deployments
vercel promote <url>       # Make a previous deployment live
```

## Support

For issues:
1. Check Vercel logs: `vercel logs`
2. Check TiDB connectivity
3. Verify environment variables
4. Check browser console for frontend errors

For Vercel help: https://vercel.com/docs
For TiDB help: https://tidb.com/support
