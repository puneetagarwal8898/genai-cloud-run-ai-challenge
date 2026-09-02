#!/usr/bin/env bash
set -e

# Setup IAM Roles for Cloud Build and Cloud Run
PROJECT_ID="$(gcloud config get-value project)"
PROJECT_NUM="$(gcloud projects describe "${PROJECT_ID}" --format="value(projectNumber)")"
COMPUTE_SA="${PROJECT_NUM}-compute@developer.gserviceaccount.com"

echo "=================================================="
echo "🔧 Configuring IAM permissions for Project: ${PROJECT_ID}"
echo "👤 Service Account: ${COMPUTE_SA}"
echo "=================================================="

# 1. Grant Storage Admin (allows reading uploaded source code)
echo "📦 Granting Storage Admin role..."
gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
  --member="serviceAccount:${COMPUTE_SA}" \
  --role="roles/storage.admin"

# 2. Grant Artifact Registry Writer (allows saving built container images)
echo "🐳 Granting Artifact Registry Writer role..."
gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
  --member="serviceAccount:${COMPUTE_SA}" \
  --role="roles/artifactregistry.writer"

# 3. Grant Cloud Build Builder role
echo "🔨 Granting Cloud Build Builder role..."
gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
  --member="serviceAccount:${COMPUTE_SA}" \
  --role="roles/cloudbuild.builds.builder"

# 4. Grant Logging Log Writer (allows streaming build logs)
echo "📝 Granting Logging Log Writer role..."
gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
  --member="serviceAccount:${COMPUTE_SA}" \
  --role="roles/logging.logWriter"

# 5. Grant Secret Manager Secret Accessor (allows reading GEMINI_API_KEY)
echo "🔐 Granting Secret Manager Accessor role..."
gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
  --member="serviceAccount:${COMPUTE_SA}" \
  --role="roles/secretmanager.secretAccessor"

echo "=================================================="
echo "✅ All IAM roles successfully configured!"
echo "👉 Now run: ./deploy.sh"
echo "=================================================="
