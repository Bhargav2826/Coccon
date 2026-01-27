import mongoose from "mongoose";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

async function testMongoDBConnection() {
  try {
    console.log('🧪 Testing MongoDB Connection...\n');
    
    console.log('1. Environment variables:');
    console.log('   MONGODB_URI length:', process.env.MONGODB_URI ? process.env.MONGODB_URI.length : 'Not set');
    console.log('   MONGODB_URI starts with:', process.env.MONGODB_URI ? process.env.MONGODB_URI.substring(0, 20) + '...' : 'Not set');
    
    if (!process.env.MONGODB_URI) {
      console.log('❌ MONGODB_URI is not set in environment variables');
      return;
    }
    
    console.log('\n2. Testing connection...');
    
    // Test connection with minimal options
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    console.log('✅ MongoDB Connected successfully!');
    console.log('   Host:', conn.connection.host);
    console.log('   Database:', conn.connection.name);
    console.log('   Ready State:', conn.connection.readyState);
    
    // Test if we can perform a simple operation
    console.log('\n3. Testing database operations...');
    
    // List collections to verify we can access the database
    const collections = await conn.connection.db.listCollections().toArray();
    console.log('✅ Database operations working');
    console.log('   Collections found:', collections.length);
    
    // Close the connection
    await mongoose.connection.close();
    console.log('\n✅ Connection closed successfully');
    
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    console.error('   Error details:', error);
    
    // Provide suggestions based on common errors
    if (error.message.includes('buffermaxentries')) {
      console.log('\n💡 Suggestion: Remove bufferMaxEntries from connection options');
    } else if (error.message.includes('authentication')) {
      console.log('\n💡 Suggestion: Check username/password in connection string');
    } else if (error.message.includes('network')) {
      console.log('\n💡 Suggestion: Check network connectivity and firewall settings');
    } else if (error.message.includes('invalid')) {
      console.log('\n💡 Suggestion: Check connection string format');
    }
  }
}

testMongoDBConnection();
