#!/usr/bin/env bash
set -e

# ReflectAI Sanctuary - Fast Redeploy Script for Google Cloud Run
# Usage: ./deploy.sh [REGION]

REGION="${1:-asia-south1}"
SERVICE_NAME="reflectai"

echo "=================================================="
echo "🚀 Deploying ${SERVICE_NAME} to Google Cloud Run"
echo "📍 Region: ${REGION}"
echo "=================================================="

# 1. Pull latest git changes if in a git repository
if [ -d ".git" ]; then
  echo "📥 Pulling latest updates from GitHub..."
  git pull origin main || true
fi

# 2. Deploy to Cloud Run preserving existing environment variables and secrets
# Note: By default, gcloud run deploy keeps all previously configured secrets and env vars!
echo "🔨 Building container and updating Cloud Run service..."
gcloud run deploy "${SERVICE_NAME}" \
  --source . \
  --platform managed \
  --region "${REGION}" \
  --allow-unauthenticated \
  --port 3000

# 3. Re-apply verification label
gcloud run services update "${SERVICE_NAME}" \
  --update-labels=dev-tutorial=cloud-run-ai-challenge \
  --region "${REGION}"

echo "=================================================="
echo "✅ Deployment complete!"
echo "🌐 Service URL:"
gcloud run services describe "${SERVICE_NAME}" --platform managed --region "${REGION}" --format="value(status.url)"
echo "=================================================="
