import "dotenv/config";

console.log('🔍 Checking Environment Variables...\n');

const requiredVars = [
  'JWT_SECRET_KEY',
  'STREAM_API_KEY', 
  'STREAM_API_SECRET',
  'MONGODB_URI'
];

const optionalVars = [
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
  'PORT'
];

console.log('📋 Required Variables:');
let allRequiredSet = true;

requiredVars.forEach(varName => {
  const value = process.env[varName];
  const isSet = !!value;
  const status = isSet ? '✅' : '❌';
  console.log(`  ${status} ${varName}: ${isSet ? 'Set' : 'Missing'}`);
  if (!isSet) allRequiredSet = false;
});

console.log('\n📋 Optional Variables:');
optionalVars.forEach(varName => {
  const value = process.env[varName];
  const isSet = !!value;
  const status = isSet ? '✅' : '⚠️';
  console.log(`  ${status} ${varName}: ${isSet ? 'Set' : 'Not set'}`);
});

console.log('\n📊 Summary:');
if (allRequiredSet) {
  console.log('✅ All required environment variables are set!');
  console.log('🎉 Faculty messaging should work correctly.');
} else {
  console.log('❌ Some required environment variables are missing.');
  console.log('🔧 Please set the missing variables in your .env file.');
  console.log('📖 See FACULTY_MESSAGING_TROUBLESHOOTING.md for details.');
}

console.log('\n🔍 Current Configuration:');
console.log(`  Port: ${process.env.PORT || '5001 (default)'}`);
console.log(`  Node Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`  Database: ${process.env.MONGODB_URI ? 'Configured' : 'Not configured'}`);
console.log(`  Stream Chat: ${process.env.STREAM_API_KEY && process.env.STREAM_API_SECRET ? 'Configured' : 'Not configured'}`);
console.log(`  Cloudinary: ${process.env.CLOUDINARY_CLOUD_NAME ? 'Configured' : 'Not configured'}`);
