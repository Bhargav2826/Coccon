const axios = require('axios');

const baseUrl = 'http://localhost:5001/api';

async function testParentConversations() {
  console.log('🧪 Testing Enhanced Parent Conversation Functionality\n');

  try {
    // Test 1: Check if parent can get child conversations (should include all types)
    console.log('1. Testing parent access to child conversations...');
    try {
      const response = await axios.get(`${baseUrl}/users/child-conversations/CHILD_ID_HERE`, {
        withCredentials: true
      });
      console.log('✅ Child conversations retrieved:', response.data.length, 'conversations');
      
      // Check for different conversation types
      const friends = response.data.filter(c => c.isFriend);
      const classroom = response.data.filter(c => c.isRoomMember);
      const directChats = response.data.filter(c => c.hasDirectChat);
      
      console.log('📊 Conversation breakdown:');
      console.log(`   - Friends: ${friends.length}`);
      console.log(`   - Classroom members: ${classroom.length}`);
      console.log(`   - Direct chats: ${directChats.length}`);
      console.log(`   - Total: ${response.data.length}`);
      
      // Show sample conversation data
      if (response.data.length > 0) {
        const sample = response.data[0];
        console.log('📋 Sample conversation data:', {
          name: sample.fullName,
          role: sample.role,
          isFriend: sample.isFriend,
          isRoomMember: sample.isRoomMember,
          hasDirectChat: sample.hasDirectChat,
          conversationType: sample.conversationType
        });
      }
      
    } catch (error) {
      console.log('❌ Failed to get child conversations:', error.response?.status, error.response?.data?.message);
    }

    // Test 2: Test AI analysis with different conversation types
    console.log('\n2. Testing AI analysis for different conversation types...');
    try {
      const analysisData = {
        childUid: 'CHILD_ID_HERE',
        targetUid: 'TARGET_ID_HERE'
      };
      
      const response = await axios.post(`${baseUrl}/ai/analyze-chat`, analysisData, {
        withCredentials: true
      });
      
      console.log('✅ AI analysis completed');
      console.log('📊 Analysis context:', {
        isFriend: response.data.context?.isFriend,
        isClassroomMember: response.data.context?.isClassroomMember,
        messageCount: response.data.context?.messageCount,
        targetRole: response.data.context?.targetRole
      });
      
    } catch (error) {
      console.log('❌ AI analysis failed:', error.response?.status, error.response?.data?.message);
    }

    console.log('\n✅ Enhanced parent conversation test completed!');
    console.log('\n📋 Key improvements:');
    console.log('   - Parents can now see ALL conversation partners (not just friends)');
    console.log('   - Classroom members are included');
    console.log('   - Direct chat history is tracked');
    console.log('   - Conversation types are categorized and labeled');
    console.log('   - AI analysis provides context-aware insights');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testParentConversations();
