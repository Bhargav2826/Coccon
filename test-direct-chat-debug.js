const axios = require('axios');

const baseUrl = 'http://localhost:5001/api';

async function testDirectChatDetection() {
  console.log('🔍 Testing Direct Chat Detection\n');

  try {
    // Test 1: Check if we can get child conversations
    console.log('1. Testing child conversations endpoint...');
    try {
      const response = await axios.get(`${baseUrl}/users/child-conversations/CHILD_ID_HERE`, {
        withCredentials: true
      });
      
      console.log('✅ Child conversations retrieved:', response.data.length, 'conversations');
      
      // Analyze the data structure
      if (response.data.length > 0) {
        console.log('\n📋 Sample conversation data:');
        response.data.forEach((conversation, index) => {
          console.log(`\n${index + 1}. ${conversation.fullName} (${conversation.role}):`);
          console.log(`   - isFriend: ${conversation.isFriend}`);
          console.log(`   - isRoomMember: ${conversation.isRoomMember}`);
          console.log(`   - hasDirectChat: ${conversation.hasDirectChat}`);
          console.log(`   - conversationType: [${conversation.conversationType.join(', ')}]`);
        });
        
        // Count different types
        const friends = response.data.filter(c => c.isFriend);
        const classroom = response.data.filter(c => c.isRoomMember);
        const directChats = response.data.filter(c => c.hasDirectChat);
        
        console.log('\n📊 Conversation breakdown:');
        console.log(`   - Friends: ${friends.length}`);
        console.log(`   - Classroom members: ${classroom.length}`);
        console.log(`   - Direct chats: ${directChats.length}`);
        console.log(`   - Total: ${response.data.length}`);
        
        // Check for classroom members with direct chats
        const classroomWithDirectChats = response.data.filter(c => c.isRoomMember && c.hasDirectChat);
        console.log(`   - Classroom members with direct chats: ${classroomWithDirectChats.length}`);
        
        // Check for users who are NOT friends but have direct chats
        const nonFriendDirectChats = response.data.filter(c => !c.isFriend && c.hasDirectChat);
        console.log(`   - Non-friend direct chats: ${nonFriendDirectChats.length}`);
        
      } else {
        console.log('❌ No conversations found');
      }
      
    } catch (error) {
      console.log('❌ Failed to get child conversations:', error.response?.status, error.response?.data?.message);
    }

    // Test 2: Check message database directly
    console.log('\n2. Testing message database...');
    try {
      // This would require a direct database query, but we can check if messages exist
      console.log('💡 To debug further, check if messages exist in the database for the child');
      console.log('💡 The issue might be that messages are not being stored properly');
      
    } catch (error) {
      console.log('❌ Database check failed:', error.message);
    }

    console.log('\n🔧 Debugging Steps:');
    console.log('1. Check if messages are being stored in the database');
    console.log('2. Verify the Message model is working correctly');
    console.log('3. Check if the aggregation query is finding messages');
    console.log('4. Verify the hasDirectChat property is being set correctly');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testDirectChatDetection();
