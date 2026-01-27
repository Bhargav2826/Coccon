import { generateStreamToken } from "../lib/stream.js";
import Message from "../models/Message.js";
import crypto from "crypto";

export async function getStreamToken(req, res) {
  try {
    const token = generateStreamToken(req.user.id);

    res.status(200).json({ token });
  } catch (error) {
    console.log("Error in getStreamToken controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

// Webhook endpoint to receive messages from Stream Chat
export async function streamWebhook(req, res) {
  try {
    // Verify webhook signature (optional but recommended for security)
    const signature = req.headers['x-signature'];
    const body = JSON.stringify(req.body);
    
    // You can add signature verification here if needed
    // const expectedSignature = crypto
    //   .createHmac('sha256', process.env.STREAM_WEBHOOK_SECRET)
    //   .update(body)
    //   .digest('hex');
    
    // if (signature !== expectedSignature) {
    //   return res.status(401).json({ message: 'Invalid signature' });
    // }

    const { type, channel, message, user } = req.body;

    // Only process new messages
    if (type === 'message.new' && message && channel) {
      console.log('📨 Received new message from Stream:', {
        messageId: message.id,
        sender: message.user?.id,
        channelId: channel.id,
        content: message.text
      });

      // Extract user IDs from channel ID (format: "user1-user2")
      const userIds = channel.id.split('-');
      if (userIds.length !== 2) {
        console.log('❌ Invalid channel ID format:', channel.id);
        return res.status(400).json({ message: 'Invalid channel ID format' });
      }

      const [user1Id, user2Id] = userIds;
      const senderId = message.user?.id;
      const recipientId = senderId === user1Id ? user2Id : user1Id;

      // Save message to our local database
      const newMessage = new Message({
        sender: senderId,
        recipient: recipientId,
        content: message.text || '',
        messageType: 'text',
        streamMessageId: message.id,
        roomId: channel.data?.roomId || null, // If it's a room chat
      });

      await newMessage.save();
      console.log('✅ Message saved to local database:', newMessage._id);
    }

    res.status(200).json({ message: 'Webhook processed successfully' });
  } catch (error) {
    console.error('❌ Error processing Stream webhook:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}
