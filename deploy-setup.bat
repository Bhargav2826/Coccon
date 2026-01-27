@echo off
REM Streamify Deployment Setup Script for Windows
REM This script helps prepare your project for deployment on Render

echo 🚀 Streamify Deployment Setup
echo ==============================

REM Check if we're in the right directory
if not exist "backend\package.json" (
    echo ❌ Error: Please run this script from the project root directory
    pause
    exit /b 1
)

if not exist "frontend\package.json" (
    echo ❌ Error: Please run this script from the project root directory
    pause
    exit /b 1
)

echo ✅ Project structure verified

REM Create .env files if they don't exist
if not exist "backend\.env" (
    echo 📝 Creating backend .env file...
    copy "backend\env.example" "backend\.env"
    echo ⚠️  Please edit backend\.env with your actual credentials
) else (
    echo ✅ Backend .env file already exists
)

REM Check if frontend .env exists
if not exist "frontend\.env" (
    echo 📝 Creating frontend .env file...
    (
        echo VITE_API_BASE_URL=http://localhost:5001/api
        echo VITE_STREAM_API_KEY=your-stream-api-key-here
    ) > frontend\.env
    echo ⚠️  Please edit frontend\.env with your actual credentials
) else (
    echo ✅ Frontend .env file already exists
)

REM Install dependencies
echo 📦 Installing backend dependencies...
cd backend
call npm install
cd ..

echo 📦 Installing frontend dependencies...
cd frontend
call npm install
cd ..

echo.
echo 🎉 Setup complete!
echo.
echo Next steps:
echo 1. Edit backend\.env with your MongoDB, Stream, and Cloudinary credentials
echo 2. Edit frontend\.env with your Stream API key
echo 3. Test locally:
echo    - Backend: cd backend ^&^& npm run dev
echo    - Frontend: cd frontend ^&^& npm run dev
echo 4. Deploy to Render using the guide in DEPLOYMENT_GUIDE.md
echo.
echo 📚 For detailed deployment instructions, see DEPLOYMENT_GUIDE.md
pause
