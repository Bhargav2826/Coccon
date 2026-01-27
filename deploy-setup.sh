#!/bin/bash

# Streamify Deployment Setup Script
# This script helps prepare your project for deployment on Render

echo "🚀 Streamify Deployment Setup"
echo "=============================="

# Check if we're in the right directory
if [ ! -f "backend/package.json" ] || [ ! -f "frontend/package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

echo "✅ Project structure verified"

# Create .env files if they don't exist
if [ ! -f "backend/.env" ]; then
    echo "📝 Creating backend .env file..."
    cp backend/env.example backend/.env
    echo "⚠️  Please edit backend/.env with your actual credentials"
else
    echo "✅ Backend .env file already exists"
fi

# Check if frontend .env exists
if [ ! -f "frontend/.env" ]; then
    echo "📝 Creating frontend .env file..."
    cat > frontend/.env << EOF
VITE_API_BASE_URL=http://localhost:5001/api
VITE_STREAM_API_KEY=your-stream-api-key-here
EOF
    echo "⚠️  Please edit frontend/.env with your actual credentials"
else
    echo "✅ Frontend .env file already exists"
fi

# Install dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install
cd ..

echo "📦 Installing frontend dependencies..."
cd frontend
npm install
cd ..

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit backend/.env with your MongoDB, Stream, and Cloudinary credentials"
echo "2. Edit frontend/.env with your Stream API key"
echo "3. Test locally:"
echo "   - Backend: cd backend && npm run dev"
echo "   - Frontend: cd frontend && npm run dev"
echo "4. Deploy to Render using the guide in DEPLOYMENT_GUIDE.md"
echo ""
echo "📚 For detailed deployment instructions, see DEPLOYMENT_GUIDE.md"
