#!/bin/bash

echo "🚀 Starting deployment process..."

# Build frontend
echo "📦 Building frontend..."
cd ../frontend
npm install
npm run build

# Check if build was successful
if [ ! -d "dist" ]; then
    echo "❌ Frontend build failed - dist directory not found"
    exit 1
fi

echo "✅ Frontend build completed successfully"

# Go back to backend
cd ../backend

echo "🔧 Backend is ready for deployment"
echo "📋 Next steps:"
echo "1. Commit and push your changes to your repository"
echo "2. Render will automatically deploy if autoDeploy is enabled"
echo "3. Or manually trigger deployment from Render dashboard"
echo ""
echo "🔍 To verify deployment:"
echo "- Check Render logs for build success"
echo "- Test API endpoints: https://your-app.onrender.com/api/health"
echo "- Test frontend: https://your-app.onrender.com/"
