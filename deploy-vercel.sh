#!/bin/bash
set -e

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║         TinyWorld Builder - Vercel Deployment Script          ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Step 1: Install Vercel CLI if not present
echo "📦 Checking Vercel CLI..."
if ! command -v vercel &> /dev/null; then
    echo "   Installing Vercel CLI..."
    npm install -g vercel
    echo "   ✓ Vercel CLI installed"
else
    echo "   ✓ Vercel CLI already installed"
fi

# Step 2: Check if .env exists or create it
echo ""
echo "🔑 Setting up environment variables..."
if [ ! -f "api/.env" ]; then
    echo "   Creating api/.env from template..."
    cp api/.env.example api/.env
    echo ""
    echo "   📝 Please edit api/.env with your credentials:"
    echo "      - DB_HOST, DB_USER, DB_PASSWORD, DB_NAME"
    echo "      - CLERK_SECRET_KEY, NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY"
    echo ""
    echo "   Opening api/.env in editor..."
    ${EDITOR:-nano} api/.env
else
    echo "   ✓ api/.env already exists"
fi

# Step 3: Verify required env vars
echo ""
echo "✓ Environment variables configured"

# Step 4: Login to Vercel
echo ""
echo "🔐 Authenticating with Vercel..."
echo "   A browser window will open to log in to your Vercel account"
echo ""
vercel login

# Step 5: Link project
echo ""
echo "🔗 Linking Vercel project..."
if [ ! -d ".vercel" ]; then
    echo "   First time setup - creating new Vercel project"
    vercel link
else
    echo "   ✓ Project already linked"
fi

# Step 6: Set environment variables in Vercel
echo ""
echo "⚙️  Setting environment variables in Vercel..."
echo "   Reading from api/.env..."

# Read env file and set in Vercel
while IFS='=' read -r key value; do
    # Skip comments and empty lines
    [[ "$key" =~ ^#.* ]] && continue
    [[ -z "$key" ]] && continue

    # Trim whitespace
    key=$(echo "$key" | xargs)
    value=$(echo "$value" | xargs)

    if [ -n "$key" ] && [ -n "$value" ]; then
        echo "   Setting $key..."
        vercel env add "$key" "$value" production staging development 2>/dev/null || true
    fi
done < api/.env

echo "   ✓ Environment variables configured"

# Step 7: Build frontend
echo ""
echo "🏗️  Building frontend..."
if [ -f "publish.sh" ]; then
    ./publish.sh
    echo "   ✓ Frontend built to dist/"
else
    echo "   ⚠️  publish.sh not found, skipping build"
fi

# Step 8: Deploy to Vercel
echo ""
echo "🚀 Deploying to Vercel..."
echo "   This may take 1-2 minutes..."
echo ""
vercel --prod

# Step 9: Get deployment URL
echo ""
echo "✅ Deployment complete!"
echo ""
echo "🎉 Your app is now live!"
echo ""
echo "Next steps:"
echo "1. Initialize TiDB database:"
echo "   mysql -h <your-tidb-host> -u root -p < db/schema.sql"
echo ""
echo "2. Test API health:"
echo "   curl https://<your-vercel-domain>/api/health"
echo ""
echo "3. Visit your app:"
echo "   https://<your-vercel-domain>/tiny-world-builder"
echo ""
