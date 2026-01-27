// Script to sync existing messages from Stream Chat to local MongoDB
// Run with: node sync-stream-messages.js

import mongoose from "mongoose";
import { StreamChat } from "stream-chat";
import Message from "./src/models/Message.js";
import User from "./src/models/User.js";
import "dotenv/config";

const syncStreamMessages = async () => {
  try {
    // Connect to database
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      console.error("❌ MONGO_URI environment variable is missing");
      return;
    }
    await mongoose.connect(mongoUri);
    console.log("✅ Connected to MongoDB");

    // Initialize Stream client
    const apiKey = process.env.STEAM_API_KEY;
    const apiSecret = process.env.STEAM_API_SECRET;
    
    if (!apiKey || !apiSecret) {
      console.error("❌ Stream API key or Secret is missing");
      return;
    }

    const streamClient = StreamChat.getInstance(apiKey, apiSecret);
    console.log("✅ Connected to Stream Chat");

    // Get all users from our database
    const users = await User.find();
    console.log(`📋 Found ${users.length} users in database`);

    let totalMessagesSynced = 0;

    // For each user, get their channels and sync messages
    for (const user of users) {
      try {
        console.log(`\n🔄 Syncing messages for user: ${user.fullName} (${user._id})`);
        
        // Get user's channels from Stream
        const channels = await streamClient.queryChannels({
          members: { $in: [user._id.toString()] }
        });

        console.log(`📨 Found ${channels.length} channels for ${user.fullName}`);

                 for (const channel of channels) {
           try {
             // Get messages from this channel using the correct Stream API
             const messages = await streamClient.getMessagesByChannelId(channel.type, channel.id, {
               limit: 100
             });
             
             console.log(`📝 Channel ${channel.id}: Found ${messages.messages.length} messages`);

             for (const streamMessage of messages.messages) {
              // Skip if message already exists in our database
              const existingMessage = await Message.findOne({
                streamMessageId: streamMessage.id
              });

              if (existingMessage) {
                console.log(`⏭️ Message ${streamMessage.id} already exists, skipping`);
                continue;
              }

              // Extract user IDs from channel ID
              const userIds = channel.id.split('-');
              if (userIds.length !== 2) {
                console.log(`❌ Invalid channel ID format: ${channel.id}`);
                continue;
              }

              const [user1Id, user2Id] = userIds;
              const senderId = streamMessage.user?.id;
              const recipientId = senderId === user1Id ? user2Id : user1Id;

              // Create new message in our database
              const newMessage = new Message({
                sender: senderId,
                recipient: recipientId,
                content: streamMessage.text || '',
                messageType: 'text',
                streamMessageId: streamMessage.id,
                roomId: channel.data?.roomId || null,
                createdAt: streamMessage.created_at,
                updatedAt: streamMessage.updated_at
              });

              await newMessage.save();
              totalMessagesSynced++;
              console.log(`✅ Synced message: ${streamMessage.id}`);
            }
          } catch (channelError) {
            console.error(`❌ Error syncing channel ${channel.id}:`, channelError.message);
          }
        }
      } catch (userError) {
        console.error(`❌ Error syncing user ${user.fullName}:`, userError.message);
      }
    }

    console.log(`\n🎉 Sync completed! Total messages synced: ${totalMessagesSynced}`);
    
  } catch (error) {
    console.error("❌ Error in sync:", error);
  } finally {
    await mongoose.disconnect();
    console.log("👋 Disconnected from MongoDB");
    process.exit(0);
  }
};

// Run the sync
syncStreamMessages();
