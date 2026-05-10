#!/bin/bash
PROJECT_ID="cakrana-app"
REGION="asia-southeast2"
IMAGE="$REGION-docker.pkg.dev/$PROJECT_ID/cakrana-repo/wifi-frontend"
BACKEND_URL="https://wifi-backend-978253671723.asia-southeast2.run.app"  # ← ganti dengan URL backend setelah deploy

echo "🔨 Building frontend image..."
docker build \
  --build-arg NEXT_PUBLIC_API_URL=$BACKEND_URL \
  -t $IMAGE .

echo "📤 Pushing to Artifact Registry..."
gcloud auth configure-docker $REGION-docker.pkg.dev
docker push $IMAGE

echo "🚀 Deploying to Cloud Run..."
gcloud run deploy wifi-frontend \
  --image=$IMAGE \
  --platform=managed \
  --region=$REGION \
  --port=3000 \
  --allow-unauthenticated \
  --set-env-vars="NEXT_PUBLIC_API_URL=$BACKEND_URL,NODE_ENV=production" \
  --memory=512Mi \
  --cpu=1 \
  --min-instances=0 \
  --max-instances=3

echo "✅ Frontend deployed!"
gcloud run services describe wifi-frontend --region=$REGION --format="value(status.url)"