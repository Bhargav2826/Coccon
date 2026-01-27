import fs from 'fs';
import path from 'path';

console.log('🔧 Creating .env file with correct variable names...\n');

const envContent = `# Database Configuration
MONGODB_URI=mongodb://localhost:27017/streamify

# JWT Configuration (Required for authentication)
JWT_SECRET_KEY=your_jwt_secret_key_here

# Stream Chat Configuration (Required for faculty messaging)
STREAM_API_KEY=your_stream_api_key_here
STREAM_API_SECRET=your_stream_api_secret_here

# Server Configuration
PORT=5001
NODE_ENV=development

# Optional: Cloudinary for file uploads
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
`;

const envPath = path.join(process.cwd(), '.env');

try {
  // Check if .env file already exists
  if (fs.existsSync(envPath)) {
    console.log('⚠️  .env file already exists!');
    console.log('📝 Please update your existing .env file with these variable names:');
    console.log('\n🔧 Required changes:');
    console.log('   MONGO_URI → MONGODB_URI');
    console.log('   STEAM_API_KEY → STREAM_API_KEY');
    console.log('   STEAM_API_SECRET → STREAM_API_SECRET');
    console.log('\n📋 Correct variable names:');
    console.log('   MONGODB_URI=your_mongodb_connection_string');
    console.log('   JWT_SECRET_KEY=your_jwt_secret_key');
    console.log('   STREAM_API_KEY=your_stream_api_key');
    console.log('   STREAM_API_SECRET=your_stream_api_secret');
  } else {
    fs.writeFileSync(envPath, envContent);
    console.log('✅ .env file created successfully!');
    console.log('📝 Please update the values with your actual credentials:');
    console.log('\n1. Replace MONGODB_URI with your MongoDB connection string');
    console.log('2. Replace JWT_SECRET_KEY with a secure random string');
    console.log('3. Replace STREAM_API_KEY with your Stream Chat API key');
    console.log('4. Replace STREAM_API_SECRET with your Stream Chat API secret');
  }
  
  console.log('\n🔍 Next steps:');
  console.log('1. Update the .env file with your actual values');
  console.log('2. Restart the server: npm run dev');
  console.log('3. Test environment: node check-environment.js');
  
} catch (error) {
  console.error('❌ Error creating .env file:', error.message);
}
