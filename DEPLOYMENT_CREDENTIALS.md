# Deployment Credentials Guide

Before running the deployment script, gather these credentials:

## 1. TiDB MySQL Credentials

From your TiDB Cloud connection string (you provided earlier):
```
mysql://sC5aTifmN57gWAj.root:K0ZRGIGoA4frKTNY@gateway01.ap-northeast-1.prod.aws.tidbcloud.com:4000/world
```

Extract these values:
- **DB_HOST** = `gateway01.ap-northeast-1.prod.aws.tidbcloud.com`
- **DB_PORT** = `4000`
- **DB_USER** = `root`
- **DB_PASSWORD** = `K0ZRGIGoA4frKTNY` (or your actual password)
- **DB_NAME** = `world`

Or log into TiDB Cloud Console:
1. Go to https://tidbcloud.com
2. Select your cluster
3. Click "Connect"
4. Copy the connection info

## 2. Clerk Authentication Keys

From your Clerk Dashboard:
1. Go to https://dashboard.clerk.com
2. Select your application
3. Go to **API Keys** in the sidebar
4. Copy these:
   - **CLERK_SECRET_KEY** (starts with `sk_test_`)
   - **NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY** (starts with `pk_test_`)

You provided these earlier:
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = pk_test_Y2hhcm1lZC1yZWRiaXJkLTIzLmNsZXJrLmFjY291bnRzLmRldiQ
CLERK_SECRET_KEY = sk_test_eKW55AQmSfVRd3v0S55CWWu04CgPTNlNlMMKiclct3
```

## 3. Vercel Account

You need a Vercel account:
1. Go to https://vercel.com
2. Sign up (free)
3. You'll authenticate when deployment script runs

## How to Run Deployment

```bash
cd /path/to/tiny-world-builder

# Make script executable (first time only)
chmod +x deploy-vercel.sh

# Run deployment
./deploy-vercel.sh
```

The script will:
1. ✅ Install Vercel CLI
2. ✅ Create api/.env file
3. 📝 **Open editor** - Paste your credentials here
4. 🔐 Open browser to Vercel login
5. ✅ Automatically configure environment variables
6. 🏗️ Build frontend
7. 🚀 Deploy to Vercel

## After Deployment

Once deployment completes:

### Initialize Database

```bash
# Option 1: Via TiDB Cloud Console
1. Go to https://tidbcloud.com
2. Select your cluster
3. Open "SQL Editor"
4. Paste contents of db/schema.sql
5. Execute

# Option 2: Via Command Line
mysql -h gateway01.ap-northeast-1.prod.aws.tidbcloud.com \
  -u root -p < db/schema.sql

(Enter password: K0ZRGIGoA4frKTNY)
```

### Test API

```bash
# Replace with your actual Vercel domain
curl https://your-project.vercel.app/api/health

# Should return:
# {"status":"ok","database":"connected"}
```

### Visit Your App

```
https://your-project.vercel.app/tiny-world-builder
```

## Troubleshooting

**Deployment script not running?**
```bash
chmod +x deploy-vercel.sh
./deploy-vercel.sh
```

**Need to re-authenticate with Vercel?**
```bash
vercel logout
./deploy-vercel.sh
```

**Want to update environment variables later?**
```bash
vercel env add KEY VALUE production staging development
vercel --prod  # redeploy
```

**Check Vercel logs:**
```bash
vercel logs
```

**View deployment history:**
```bash
vercel list
```

## Security Notes

⚠️ **Don't commit api/.env to Git**
- Already in .gitignore
- Contains sensitive passwords
- Only set in Vercel dashboard

✅ **Environment variables in Vercel are:**
- Encrypted
- Never logged
- Isolated per environment (production/staging/development)
- Only used at runtime

## Questions?

For issues:
- Check VERCEL_DEPLOYMENT.md for detailed guide
- Check BACKEND_SETUP.md for backend info
- Check Vercel logs: `vercel logs`
