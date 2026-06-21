# Tiny World Builder — Development Setup

This guide will help you set up the complete development environment for Tiny World Builder.

## Architecture

The application consists of two separate services:

1. **Frontend Dev Server** (port 3000)
   - Serves the landing page, editor, and static assets
   - File: `tools/dev-server.js`
   - Auto-reloads when files change

2. **Backend API Server** (port 3001)
   - Express.js application
   - Handles authentication, database operations
   - File: `backend/index.js`
   - Requires Node.js 16+

## Prerequisites

- Node.js 18+ 
- npm or yarn
- Clerk authentication account (https://clerk.com)
- Database (TiDB Cloud, MySQL, or similar)

## Installation

```bash
# Clone the repository
git clone https://github.com/VaibhavPawar212303/tiny-world-builder.git
cd tiny-world-builder

# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..
```

## Configuration

### 1. Create `.env.local` from the template

```bash
cp .env.example .env.local
```

### 2. Add Clerk Credentials

Get these from [Clerk Dashboard](https://dashboard.clerk.com):

```env
CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
CLERK_SECRET_KEY=sk_test_your_key_here
```

### 3. (Optional) Add Database Credentials

If you have a database set up:

```env
# Option A: Full connection string (recommended)
DATABASE_URL=mysql://user:password@host:port/database

# Option B: Individual variables
DB_HOST=localhost
DB_PORT=4000
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=tinyworld
```

## Running the Application

### Option 1: Quick Start (Single Command)

```bash
bash dev-setup.sh
```

This will:
- Check configuration
- Start the frontend dev server (port 3000)
- Start the backend API server (port 3001)
- Print access URLs

### Option 2: Manual Start (Two Terminals)

**Terminal 1 - Frontend:**
```bash
npm run dev
```

**Terminal 2 - Backend:**
```bash
cd backend
npm start
```

### Option 3: Development with Auto-Reload (Backend)

**Terminal 1 - Frontend:**
```bash
npm run dev
```

**Terminal 2 - Backend (with nodemon):**
```bash
cd backend
npm run dev
```

## Testing the Setup

Once both servers are running:

```bash
# Frontend is available at:
curl http://localhost:3000/

# API Health check:
curl http://localhost:3001/api/health

# Test profile endpoint (requires auth):
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3001/api/profile
```

## Common Issues

### "Port 3000 is already in use"

```bash
# Find and kill the process
lsof -i :3000
kill -9 PID_HERE

# Or use a different port
npm run dev -- 3002
```

### "Cannot find module 'express'"

Backend dependencies not installed:
```bash
cd backend && npm install && cd ..
```

### "Clerk credentials not found"

Set up `.env.local` with your Clerk credentials:
- Get `CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` from https://dashboard.clerk.com
- Paste them into `.env.local`

### "Database connection refused"

Verify database credentials in `.env.local`:
```bash
# Test connection
mysql -h $DB_HOST -u $DB_USER -p$DB_PASSWORD -e "USE $DB_NAME; SHOW TABLES;"
```

## Project Structure

```
tiny-world-builder/
├── index.html                 # Landing page
├── tiny-world-builder.html    # Main editor
├── worlds.html               # Worlds list page
├── styles/                   # CSS stylesheets
├── engine/                   # Three.js 3D engine code
├── vendor/                   # Third-party libraries (Three.js, etc.)
├── api/                      # Node.js backend APIs
├── backend/                  # Express.js application
│   ├── index.js             # Main server file
│   └── package.json
├── tools/
│   └── dev-server.js        # Frontend dev server
├── .env.example             # Environment template
└── package.json
```

## Frontend Pages

- **Landing Page:** http://localhost:3000/
- **Editor:** http://localhost:3000/tiny-world-builder
- **Worlds List:** http://localhost:3000/worlds
- **Documentation:** http://localhost:3000/docs.html

## Backend API Endpoints

```
POST   /api/users/sync                    # Sync user with database
GET    /api/worlds                        # List user's worlds
POST   /api/worlds                        # Create a new world
GET    /api/worlds/:id                    # Get world details
PUT    /api/worlds/:id                    # Update world
DELETE /api/worlds/:id                    # Delete world
GET    /api/worlds/share/:shareId         # Get shared world
POST   /api/profile                       # Get user profile
PUT    /api/profile                       # Update user profile
GET    /api/health                        # Health check
```

## Development Workflow

1. **Edit HTML/CSS/JS** → Frontend auto-reloads
2. **Edit backend code** → Restart backend or use `npm run dev` for auto-reload
3. **Add features** → Test in browser, check console logs
4. **Debug** → Use browser DevTools and backend logs

## Deployment

For production deployment, see:
- **Vercel** (frontend): VERCEL_DEPLOYMENT.md
- **Backend Hosting**: BACKEND_SETUP.md

## Troubleshooting

Run diagnostics:
```bash
# Check Node.js version
node --version

# Check npm packages installed
npm list

# Check backend packages
cd backend && npm list && cd ..

# Test API connectivity
curl -v http://localhost:3001/api/health
```

## Support

- GitHub Issues: https://github.com/VaibhavPawar212303/tiny-world-builder/issues
- Clerk Support: https://dashboard.clerk.com
- Three.js Docs: https://threejs.org/docs
