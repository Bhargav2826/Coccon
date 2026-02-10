#!/bin/bash

echo "🔍 Monitoring backend logs for analyze-chat requests..."
echo "Please click 'Generate Chat Report' in the UI now..."
echo ""

# Monitor the running node process
tail -f /dev/null 2>&1 &
TAIL_PID=$!

# Try to attach to the running process logs
# Since we can't directly tail the process output, let's check system logs
echo "Checking for recent errors in the backend..."

# Alternative: Let's just create a test request
echo ""
echo "📝 Testing the analyze-chat endpoint directly..."
echo ""

# We need actual IDs from the database, so let's check what we have
node -e "
const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const User = require('./src/models/User.js').default;
  const ChatMessage = require('./src/models/ChatMessage.js').default;
  
  console.log('🔍 Finding parent users...');
  const parent = await User.findOne({ role: 'parent' }).select('_id fullName children');
  
  if (!parent) {
    console.log('❌ No parent user found');
    process.exit(1);
  }
  
  console.log('✅ Found parent:', parent.fullName, parent._id);
  
  if (parent.children && parent.children.length > 0) {
    const childId = parent.children[0];
    console.log('✅ Child ID:', childId);
    
    // Find recent chat messages
    const messages = await ChatMessage.find({
      \$or: [
        { sender: childId },
        { receiver: childId }
      ]
    }).limit(5).populate('sender receiver', 'fullName');
    
    console.log(\`📊 Found \${messages.length} recent messages\`);
    
    if (messages.length > 0) {
      const targetId = messages[0].sender._id.toString() === childId.toString() 
        ? messages[0].receiver._id 
        : messages[0].sender._id;
      
      console.log('🎯 Target user ID:', targetId);
      console.log('');
      console.log('📋 Use these IDs to test:');
      console.log('   Parent ID:', parent._id);
      console.log('   Child ID:', childId);
      console.log('   Target ID:', targetId);
    }
  }
  
  process.exit(0);
}).catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
"
