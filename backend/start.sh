#!/bin/bash

# Production startup script for Render deployment

echo "🚀 Starting Streamify Backend..."

# Check if required environment variables are set
if [ -z "$MONGODB_URI" ]; then
    echo "❌ Error: MONGODB_URI is not set"
    exit 1
fi

if [ -z "$JWT_SECRET_KEY" ]; then
    echo "❌ Error: JWT_SECRET_KEY is not set"
    exit 1
fi

if [ -z "$STREAM_API_KEY" ] || [ -z "$STREAM_API_SECRET" ]; then
    echo "❌ Error: Stream Chat credentials are not set"
    exit 1
fi

if [ -z "$CLOUDINARY_CLOUD_NAME" ] || [ -z "$CLOUDINARY_API_KEY" ] || [ -z "$CLOUDINARY_API_SECRET" ]; then
    echo "❌ Error: Cloudinary credentials are not set"
    exit 1
fi

# Set default values for optional variables
export NODE_ENV=${NODE_ENV:-production}
export PORT=${PORT:-10000}

echo "✅ Environment variables validated"
echo "🌍 Environment: $NODE_ENV"
echo "🔌 Port: $PORT"
echo "🔗 Frontend URL: ${FRONTEND_URL:-'Not set'}"

# Check if node_modules exists, if not install dependencies
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Start the application
echo "🎯 Starting Node.js application..."
exec node src/server.js
