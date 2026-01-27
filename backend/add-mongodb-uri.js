import fs from 'fs';
import path from 'path';

console.log('🔧 Adding MONGODB_URI to .env file...\n');

const envPath = path.join(process.cwd(), '.env');

try {
  if (fs.existsSync(envPath)) {
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    // Check if MONGODB_URI already exists
    if (envContent.includes('MONGODB_URI=')) {
      console.log('✅ MONGODB_URI already exists in .env file');
    } else {
      // Add MONGODB_URI at the beginning
      const mongoUriLine = 'MONGODB_URI=mongodb://localhost:27017/streamify\n';
      envContent = mongoUriLine + envContent;
      
      fs.writeFileSync(envPath, envContent);
      console.log('✅ MONGODB_URI added to .env file');
      console.log('📝 Please update the MONGODB_URI value with your actual MongoDB connection string');
    }
    
    console.log('\n📋 Your .env file should now contain:');
    console.log('   MONGODB_URI=mongodb://localhost:27017/streamify');
    console.log('   JWT_SECRET_KEY=your_jwt_secret_key');
    console.log('   STREAM_API_KEY=your_stream_api_key');
    console.log('   STREAM_API_SECRET=your_stream_api_secret');
    
  } else {
    console.log('❌ .env file not found');
    console.log('📝 Please create a .env file with the required variables');
  }
  
} catch (error) {
  console.error('❌ Error updating .env file:', error.message);
}
