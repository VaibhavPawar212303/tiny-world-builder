#!/bin/bash

# Deployment Checker - Monitor Vercel deployment and CSP update
# Polls the Vercel URL to check if the updated CSP has been deployed

URL="https://tiny-world-builder-seven.vercel.app/tiny-world-builder.html"
MAX_ATTEMPTS=60
ATTEMPT=0
CHECKED_CSP=false

echo "🚀 Monitoring Vercel deployment..."
echo "URL: $URL"
echo "Checking for CSP with Clerk CDN allowance..."
echo ""

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
  ATTEMPT=$((ATTEMPT + 1))

  echo "[Attempt $ATTEMPT/$MAX_ATTEMPTS] Fetching headers..."

  # Get response headers
  RESPONSE=$(curl -s -I "$URL" 2>&1)

  # Check if we got a response
  if echo "$RESPONSE" | grep -q "HTTP"; then
    # Extract CSP header
    CSP=$(echo "$RESPONSE" | grep -i "content-security-policy" | head -1)

    if [ -n "$CSP" ]; then
      CHECKED_CSP=true

      # Check if CSP contains clerk.com
      if echo "$CSP" | grep -q "cdn.clerk.com"; then
        echo "✅ SUCCESS! Vercel has deployed with updated CSP"
        echo ""
        echo "CSP Header:"
        echo "$CSP" | sed 's/^/  /'
        echo ""
        echo "🎉 Clerk.js can now load! Refresh your browser."
        exit 0
      else
        echo "⏳ CSP found but Clerk CDN not yet added (old CSP still deployed)"
      fi
    else
      echo "⏳ CSP header not found in response"
    fi
  else
    echo "⏳ Cannot reach Vercel URL yet"
  fi

  if [ $ATTEMPT -lt $MAX_ATTEMPTS ]; then
    REMAINING=$((MAX_ATTEMPTS - ATTEMPT))
    echo "   Retrying in 10 seconds... ($REMAINING attempts remaining)"
    sleep 10
  fi
done

echo ""
echo "❌ Deployment check timed out after $(($MAX_ATTEMPTS * 10))s"
echo "Try one of the following:"
echo "1. Manual redeploy: https://vercel.com/dashboard"
echo "2. Force redeploy by pushing a new commit"
echo "3. Check deployment status: https://vercel.com/[project]/deployments"
