#!/usr/bin/env bash
set -e

# Maximum number of deployment attempts
MAX_RETRIES=3
COUNT=0

# Optional timeout for Vercel CLI (in seconds)
# You can set VERCEL_TIMEOUT environment variable before running this script
VERCEL_TIMEOUT=${VERCEL_TIMEOUT:-600}

while [ $COUNT -lt $MAX_RETRIES ]; do
  echo "Deploy attempt $((COUNT+1)) / $MAX_RETRIES..."
  # Use npx vercel to ensure CLI is available
  if npx vercel --prod --yes --cwd . --timeout $VERCEL_TIMEOUT; then
    echo "Deployment succeeded."
    exit 0
  else
    echo "Deployment failed. Retrying..."
    COUNT=$((COUNT+1))
    sleep 5
  fi
done

echo "All deployment attempts failed."
exit 1
