# Tiny World Builder - Next.js Version

This is the Next.js version of Tiny World Builder.

## Setup

### 1. Install Dependencies
```bash
cd next-version
npm install
```

### 2. Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Edit `.env.local` and add your credentials:
- Clerk keys (from https://dashboard.clerk.com)
- Database URL (TiDB MySQL)

### 3. Development
```bash
npm run dev
# Open http://localhost:3000
```

### 4. Build for Production
```bash
npm run build
npm start
```

## Project Structure

```
next-version/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Root layout with Clerk
│   └── page.tsx           # Home page
├── public/                # Static files
├── api/                   # API routes
├── package.json
├── next.config.js
└── .env.example
```

## Features (To Be Implemented)

- [ ] Clerk authentication
- [ ] World builder UI (Three.js)
- [ ] Database persistence
- [ ] Build history versioning
- [ ] Multi-device sync
- [ ] User preferences

## Deployment

See the main README for Vercel deployment instructions.

## Notes

- This is a fresh Next.js project
- Original app code will be migrated incrementally
- Clerk integration is pre-configured
- Database API routes will be added next

## Status

**Current**: Foundation setup complete, ready for Vercel deployment
**Next**: Deploy to Vercel, then migrate app code
