import Room from "../models/Room.js";
import User from "../models/User.js";
import Message from "../models/Message.js";
import { streamServerClient } from "../lib/stream.js";
import cloudinary from "cloudinary";

// Send message to all room members or specific user
export async function sendRoomMessage(req, res) {
  try {
    console.log("📨 Faculty message request:", {
      body: req.body,
      user: req.user._id,
      userRole: req.user.role,
      headers: req.headers
    });

    
    const { roomId, message, messageType = "text", targetUserId = null } = req.body;
    const facultyId = req.user._id;

    // Verify the room exists and faculty owns it
    const room = await Room.findById(roomId).populate("members", "fullName email");
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    if (room.faculty.toString() !== facultyId.toString()) {
      return res.status(403).json({ message: "You can only send messages to your own rooms" });
    }

    // If targetUserId is provided, send to specific user only
    if (targetUserId) {
      const targetUser = await User.findById(targetUserId);
      if (!targetUser) {
        return res.status(404).json({ message: "Target user not found" });
      }

      // Create direct message channel with target user
      const channelId = [facultyId.toString(), targetUserId].sort().join("-");
      console.log("🔍 Creating channel with ID:", channelId);
      
      const channel = streamServerClient.channel("messaging", channelId, {
        members: [facultyId.toString(), targetUserId],
        created_by_id: facultyId.toString()
      });

      console.log("🔍 Sending message to Stream Chat...");
      const streamMessage = await channel.sendMessage({
        text: message,
        user_id: facultyId.toString()
      });
      console.log("🔍 Message sent to Stream Chat successfully");

      // Save to local database for AI analysis
      const newMessage = new Message({
        sender: facultyId,
        recipient: targetUserId,
        content: message,
        messageType: messageType,
        roomId: roomId,
        streamMessageId: streamMessage.message.id
      });
      await newMessage.save();

      return res.status(200).json({
        success: true,
        message: "Message sent to user successfully",
        targetUser: {
          _id: targetUser._id,
          fullName: targetUser.fullName,
          email: targetUser.email
        }
      });
    }

    // Send to all room members
    const results = [];
    console.log("🔍 Sending to", room.members.length, "room members");
    
    // Check if Stream Chat is properly configured
    if (!process.env.STREAM_API_KEY || !process.env.STREAM_API_SECRET) {
      console.warn("⚠️ Stream Chat API credentials are missing - proceeding with local storage only");
    }
    
    for (const member of room.members) {
      if (member._id.toString() === facultyId.toString()) continue; // Skip self

      try {
        console.log("🔍 Sending message to member:", member.fullName);
        
        let streamMessageId = null;
        
        // Try to send via Stream Chat if available
        if (streamServerClient) {
          try {
            // Ensure users exist in Stream Chat before creating channels
            await streamServerClient.upsertUsers([
              {
                id: facultyId.toString(),
                name: req.user.fullName || 'Faculty Member'
              },
              {
                id: member._id.toString(),
                name: member.fullName || 'Student'
              }
            ]);
            console.log("🔍 Users upserted in Stream Chat");
            
            // Create direct message channel with each member
            const channelId = [facultyId.toString(), member._id.toString()].sort().join("-");
            console.log("🔍 Channel ID:", channelId);
            
            const channel = streamServerClient.channel("messaging", channelId, {
              members: [facultyId.toString(), member._id.toString()],
              created_by_id: facultyId.toString()
            });

            // Create the channel first
            await channel.create();
            console.log("🔍 Channel created successfully");

            console.log("🔍 Sending message...");
            const streamMessage = await channel.sendMessage({
              text: message,
              user_id: facultyId.toString()
            });
            console.log("🔍 Message sent to Stream Chat successfully");
            streamMessageId = streamMessage.message.id;
          } catch (streamError) {
            console.log("⚠️ Stream Chat failed for message, saving locally only:", streamError.message);
          }
        } else {
          console.log("⚠️ Stream Chat not available, saving message locally only");
        }

        // Save to local database for AI analysis
        const newMessage = new Message({
          sender: facultyId,
          recipient: member._id,
          content: message,
          messageType: messageType,
          roomId: roomId,
          streamMessageId: streamMessageId
        });
        await newMessage.save();

        results.push({
          _id: member._id,
          fullName: member.fullName,
          email: member.email,
          status: "sent"
        });
      } catch (error) {
        console.error(`❌ Failed to send message to ${member.fullName}:`, error);
        console.error("❌ Error details:", {
          message: error.message,
          stack: error.stack,
          memberId: member._id,
          facultyId: facultyId
        });
        
        results.push({
          _id: member._id,
          fullName: member.fullName,
          email: member.email,
          status: "failed",
          error: error.message
        });
      }
    }

    res.status(200).json({
      success: true,
      message: "Room message sent",
      results: results,
      totalSent: results.filter(r => r.status === "sent").length,
      totalFailed: results.filter(r => r.status === "failed").length
    });

  } catch (error) {
    console.log("Error in sendRoomMessage controller", error.message);
    console.log("Error stack:", error.stack);
    res.status(500).json({ 
      message: "Internal Server Error",
      error: error.message 
    });
  }
}

// Send file (image/document) to room members
export async function sendRoomFile(req, res) {
  console.log('🔍 sendRoomFile called');
  console.log('🔍 Request body:', req.body);
  console.log('🔍 Request file:', req.file);
  console.log('🔍 Request user:', req.user);
  console.log('🔍 Request headers:', req.headers);
  console.log('🔍 Request cookies:', req.cookies);
  console.log('🔍 Request authorization:', req.headers.authorization);
  
  // Set a timeout for the entire operation
  const timeout = setTimeout(() => {
    console.log('❌ File upload timeout - operation took too long');
    if (!res.headersSent) {
      res.status(408).json({ message: "Request timeout - file upload took too long" });
    }
  }, 25000); // 25 second timeout

  try {
    console.log('🔍 sendRoomFile called with:', {
      body: req.body,
      file: req.file ? {
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        hasPath: !!req.file.path,
        hasBuffer: !!req.file.buffer
      } : null,
      user: req.user._id
    });

    const { roomId, targetUserId = null } = req.body;
    const facultyId = req.user._id;
    
    // Check if file was uploaded
    if (!req.file) {
      console.log('❌ No file uploaded');
      return res.status(400).json({ message: "No file uploaded" });
    }

    // Handle file upload to Cloudinary
    let fileUrl;
    try {
      if (req.file.buffer) {
        console.log('🔍 File received in memory, uploading to Cloudinary...');
        
        // Upload to Cloudinary manually
        const uploadResult = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.v2.uploader.upload_stream(
            {
              folder: "faculty-messages",
              resource_type: req.file.mimetype.startsWith('image/') ? 'image' : 'raw',
              transformation: req.file.mimetype.startsWith('image/') ? [
                { width: 1000, height: 1000, crop: "limit" },
                { quality: "auto" }
              ] : undefined
            },
            (error, result) => {
              if (error) {
                console.error('❌ Cloudinary upload error:', error);
                reject(error);
              } else {
                console.log('✅ Cloudinary upload successful:', result);
                resolve(result);
              }
            }
          );
          
          uploadStream.end(req.file.buffer);
        });
        
        fileUrl = uploadResult.secure_url;
        console.log('🔍 File uploaded to Cloudinary:', fileUrl);
      } else {
        console.error('❌ No file buffer found');
        return res.status(400).json({ message: "Invalid file data" });
      }
    } catch (error) {
      console.error('❌ Error uploading file to Cloudinary:', error);
      return res.status(400).json({ message: "Error uploading file: " + error.message });
    }
    
    const fileName = req.file.originalname;
    const fileType = req.file.mimetype.startsWith('image/') ? 'image' : 'file';

    // Verify the room exists and faculty owns it
    const room = await Room.findById(roomId).populate("members", "fullName email");
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    if (room.faculty.toString() !== facultyId.toString()) {
      return res.status(403).json({ message: "You can only send files to your own rooms" });
    }

    // If targetUserId is provided, send to specific user only
    if (targetUserId) {
      const targetUser = await User.findById(targetUserId);
      if (!targetUser) {
        return res.status(404).json({ message: "Target user not found" });
      }

      let streamMessageId = null;
      
      // Try to send via Stream Chat if available
      if (streamServerClient) {
        try {
          const channelId = [facultyId.toString(), targetUserId].sort().join("-");
          const channel = streamServerClient.channel("messaging", channelId, {
            members: [facultyId.toString(), targetUserId],
            created_by_id: facultyId.toString()
          });

          await channel.create();
          const streamMessage = await channel.sendMessage({
            text: `📎 ${fileName}`,
            attachments: [{
              type: fileType === "image" ? "image" : "file",
              asset_url: fileUrl,
              title: fileName
            }],
            user_id: facultyId.toString()
          });
          streamMessageId = streamMessage.message.id;
        } catch (streamError) {
          console.log("⚠️ Stream Chat failed for file upload, saving locally only:", streamError.message);
        }
      } else {
        console.log("⚠️ Stream Chat not available, saving file locally only");
      }

      // Save to local database for AI analysis
      const newMessage = new Message({
        sender: facultyId,
        recipient: targetUserId,
        content: `📎 ${fileName}`,
        messageType: "file",
        roomId: roomId,
        fileUrl: fileUrl,
        fileName: fileName,
        streamMessageId: streamMessageId
      });
      await newMessage.save();

      return res.status(200).json({
        success: true,
        message: "File sent to user successfully",
        targetUser: {
          _id: targetUser._id,
          fullName: targetUser.fullName,
          email: targetUser.email
        }
      });
    }

    // Send to all room members
    const results = [];
    for (const member of room.members) {
      if (member._id.toString() === facultyId.toString()) continue;

      try {
        const channelId = [facultyId.toString(), member._id.toString()].sort().join("-");
        const channel = streamServerClient.channel("messaging", channelId, {
          members: [facultyId.toString(), member._id.toString()],
          created_by_id: facultyId.toString()
        });

        let streamMessageId = null;
        try {
          await channel.create();
          const streamMessage = await channel.sendMessage({
            text: `📎 ${fileName}`,
            attachments: [{
              type: fileType === "image" ? "image" : "file",
              asset_url: fileUrl,
              title: fileName
            }],
            user_id: facultyId.toString()
          });
          streamMessageId = streamMessage.message.id;
        } catch (streamError) {
          console.log(`⚠️ Stream Chat failed for ${member.fullName}, saving locally only:`, streamError.message);
        }

        // Save to local database for AI analysis
        const newMessage = new Message({
          sender: facultyId,
          recipient: member._id,
          content: `📎 ${fileName}`,
          messageType: "file",
          roomId: roomId,
          fileUrl: fileUrl,
          fileName: fileName,
          streamMessageId: streamMessageId
        });
        await newMessage.save();

        results.push({
          _id: member._id,
          fullName: member.fullName,
          email: member.email,
          status: "sent"
        });
      } catch (error) {
        console.error(`Failed to send file to ${member.fullName}:`, error);
        results.push({
          _id: member._id,
          fullName: member.fullName,
          email: member.email,
          status: "failed",
          error: error.message
        });
      }
    }

    console.log('✅ File upload completed successfully');
    clearTimeout(timeout); // Clear the timeout since we're done
    res.status(200).json({
      success: true,
      message: "File sent to room members",
      results: results,
      totalSent: results.filter(r => r.status === "sent").length,
      totalFailed: results.filter(r => r.status === "failed").length
    });

  } catch (error) {
    console.error("❌ Error in sendRoomFile controller", error.message);
    console.error("Error stack:", error.stack);
    clearTimeout(timeout); // Clear the timeout on error
    if (!res.headersSent) {
      res.status(500).json({ 
        message: "Internal Server Error",
        error: error.message 
      });
    }
  }
}

// Send video call link to room members
export async function sendVideoCallLink(req, res) {
  try {
    const { roomId, callUrl, callTitle = "Video Call", targetUserId = null } = req.body;
    const facultyId = req.user._id;

    // Verify the room exists and faculty owns it
    const room = await Room.findById(roomId).populate("members", "fullName email");
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    if (room.faculty.toString() !== facultyId.toString()) {
      return res.status(403).json({ message: "You can only send video call links to your own rooms" });
    }

    const videoCallMessage = `🎥 ${callTitle}\n\nJoin the video call: ${callUrl}`;

    // If targetUserId is provided, send to specific user only
    if (targetUserId) {
      const targetUser = await User.findById(targetUserId);
      if (!targetUser) {
        return res.status(404).json({ message: "Target user not found" });
      }

      const channelId = [facultyId.toString(), targetUserId].sort().join("-");
      const channel = streamServerClient.channel("messaging", channelId, {
        members: [facultyId.toString(), targetUserId],
        created_by_id: facultyId.toString()
      });

      await channel.create();
      const streamMessage = await channel.sendMessage({
        text: videoCallMessage,
        user_id: facultyId.toString()
      });

      // Save to local database for AI analysis
      const newMessage = new Message({
        sender: facultyId,
        recipient: targetUserId,
        content: videoCallMessage,
        messageType: "text",
        roomId: roomId,
        streamMessageId: streamMessage.message.id
      });
      await newMessage.save();

      return res.status(200).json({
        success: true,
        message: "Video call link sent to user successfully",
        targetUser: {
          _id: targetUser._id,
          fullName: targetUser.fullName,
          email: targetUser.email
        }
      });
    }

    // Send to all room members
    const results = [];
    for (const member of room.members) {
      if (member._id.toString() === facultyId.toString()) continue;

      try {
        const channelId = [facultyId.toString(), member._id.toString()].sort().join("-");
        const channel = streamServerClient.channel("messaging", channelId, {
          members: [facultyId.toString(), member._id.toString()],
          created_by_id: facultyId.toString()
        });

        await channel.create();
        const streamMessage = await channel.sendMessage({
          text: videoCallMessage,
          user_id: facultyId.toString()
        });

        // Save to local database for AI analysis
        const newMessage = new Message({
          sender: facultyId,
          recipient: member._id,
          content: videoCallMessage,
          messageType: "text",
          roomId: roomId,
          streamMessageId: streamMessage.message.id
        });
        await newMessage.save();

        results.push({
          _id: member._id,
          fullName: member.fullName,
          email: member.email,
          status: "sent"
        });
      } catch (error) {
        console.error(`Failed to send video call link to ${member.fullName}:`, error);
        results.push({
          _id: member._id,
          fullName: member.fullName,
          email: member.email,
          status: "failed",
          error: error.message
        });
      }
    }

    res.status(200).json({
      success: true,
      message: "Video call link sent to room members",
      results: results,
      totalSent: results.filter(r => r.status === "sent").length,
      totalFailed: results.filter(r => r.status === "failed").length
    });

  } catch (error) {
    console.log("Error in sendVideoCallLink controller", error.message);
    console.log("Error stack:", error.stack);
    res.status(500).json({ 
      message: "Internal Server Error",
      error: error.message 
    });
  }
}

// Start faculty video call and send link to classroom members
export async function startFacultyVideoCall(req, res) {
  try {
    const { roomId, callTitle = "Faculty Video Call", targetUserId = null } = req.body;
    const facultyId = req.user._id;

    console.log("🎥 Starting faculty video call:", {
      roomId,
      callTitle,
      targetUserId,
      facultyId: facultyId.toString()
    });

    // Check if Stream Chat is properly configured
    if (!process.env.STREAM_API_KEY || !process.env.STREAM_API_SECRET) {
      console.error("❌ Stream Chat API credentials are missing");
      return res.status(500).json({ 
        message: "Video call service is not properly configured. Please contact support." 
      });
    }

    // Verify the room exists and faculty owns it
    const room = await Room.findById(roomId).populate("members", "fullName email");
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    if (room.faculty.toString() !== facultyId.toString()) {
      return res.status(403).json({ message: "You can only start video calls for your own rooms" });
    }

    // Generate a unique call ID for this faculty video call
    // Use a more descriptive format that includes room name and timestamp
    const timestamp = Date.now();
    const roomNameSlug = room.roomName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase().substring(0, 20);
    const callId = `faculty-${roomNameSlug}-${timestamp}`;
    
    // Create the video call URL
    const callUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/call/${callId}`;
    
    const videoCallMessage = `🎥 ${callTitle}\n\nI've started a video call. Join me here: ${callUrl}`;

    console.log("🎥 Generated call details:", {
      callId,
      callUrl,
      roomName: room.roomName
    });

    // If targetUserId is provided, send to specific user only
    if (targetUserId) {
      const targetUser = await User.findById(targetUserId);
      if (!targetUser) {
        return res.status(404).json({ message: "Target user not found" });
      }

      try {
        const channelId = [facultyId.toString(), targetUserId].sort().join("-");
        const channel = streamServerClient.channel("messaging", channelId, {
          members: [facultyId.toString(), targetUserId],
          created_by_id: facultyId.toString()
        });

        await channel.create();
        const streamMessage = await channel.sendMessage({
          text: videoCallMessage,
          user_id: facultyId.toString()
        });

        // Save to local database for AI analysis
        const newMessage = new Message({
          sender: facultyId,
          recipient: targetUserId,
          content: videoCallMessage,
          messageType: "text",
          roomId: roomId,
          streamMessageId: streamMessage.message.id
        });
        await newMessage.save();

        console.log("✅ Video call link sent to specific user:", targetUser.fullName);

        return res.status(200).json({
          success: true,
          message: "Video call started and link sent to user successfully",
          callId: callId,
          callUrl: callUrl,
          targetUser: {
            _id: targetUser._id,
            fullName: targetUser.fullName,
            email: targetUser.email
          }
        });
      } catch (error) {
        console.error("❌ Error sending video call to specific user:", error);
        return res.status(500).json({ 
          message: "Failed to send video call link to user",
          error: error.message 
        });
      }
    }

    // Send to all room members
    const results = [];
    console.log("🎥 Sending video call to", room.members.length, "room members");
    
    for (const member of room.members) {
      if (member._id.toString() === facultyId.toString()) continue;

      try {
        const channelId = [facultyId.toString(), member._id.toString()].sort().join("-");
        const channel = streamServerClient.channel("messaging", channelId, {
          members: [facultyId.toString(), member._id.toString()],
          created_by_id: facultyId.toString()
        });

        await channel.create();
        const streamMessage = await channel.sendMessage({
          text: videoCallMessage,
          user_id: facultyId.toString()
        });

        // Save to local database for AI analysis
        const newMessage = new Message({
          sender: facultyId,
          recipient: member._id,
          content: videoCallMessage,
          messageType: "text",
          roomId: roomId,
          streamMessageId: streamMessage.message.id
        });
        await newMessage.save();

        results.push({
          _id: member._id,
          fullName: member.fullName,
          email: member.email,
          status: "sent"
        });

        console.log("✅ Video call link sent to:", member.fullName);
      } catch (error) {
        console.error(`❌ Failed to send video call link to ${member.fullName}:`, error);
        results.push({
          _id: member._id,
          fullName: member.fullName,
          email: member.email,
          status: "failed",
          error: error.message
        });
      }
    }

    const totalSent = results.filter(r => r.status === "sent").length;
    const totalFailed = results.filter(r => r.status === "failed").length;

    console.log("🎥 Video call summary:", {
      totalSent,
      totalFailed,
      callId,
      roomName: room.roomName
    });

    // Add a small delay to ensure the video call is properly initialized
    await new Promise(resolve => setTimeout(resolve, 1000));

    res.status(200).json({
      success: true,
      message: "Video call started and link sent to room members",
      callId: callId,
      callUrl: callUrl,
      results: results,
      totalSent: totalSent,
      totalFailed: totalFailed
    });

  } catch (error) {
    console.log("❌ Error in startFacultyVideoCall controller:", error.message);
    console.log("Error stack:", error.stack);
    res.status(500).json({ 
      message: "Internal Server Error",
      error: error.message 
    });
  }
}

// Get faculty messages for a student
export async function getStudentFacultyMessages(req, res) {
  try {
    // Ensure user is authenticated
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: "User not authenticated" });
    }
    
    const studentId = req.user._id;
    
    console.log("🔍 getStudentFacultyMessages - studentId:", studentId);
    console.log("🔍 getStudentFacultyMessages - user:", req.user);
    
    // Get all rooms where the student is a member
    const studentRooms = await Room.find({ 
      members: studentId 
    }).populate("faculty", "fullName email");
    
    console.log("🔍 getStudentFacultyMessages - studentRooms:", studentRooms.length);
    console.log("🔍 getStudentFacultyMessages - first room:", studentRooms[0]);
    
    if (studentRooms.length === 0) {
      return res.status(200).json({
        success: true,
        messages: [],
        rooms: []
      });
    }
    
    // Filter out rooms that don't have faculty or have invalid faculty
    const validRooms = studentRooms.filter(room => room.faculty && room.faculty._id);
    
    console.log("🔍 getStudentFacultyMessages - validRooms:", validRooms.length);
    console.log("🔍 getStudentFacultyMessages - validRooms faculty:", validRooms.map(r => ({ roomName: r.roomName, faculty: r.faculty?.fullName })));
    
    if (validRooms.length === 0) {
      return res.status(200).json({
        success: true,
        messages: [],
        rooms: studentRooms
      });
    }
    
    // Get faculty IDs from valid rooms
    const facultyIds = validRooms.map(room => room.faculty._id);
    
    console.log("🔍 getStudentFacultyMessages - facultyIds:", facultyIds);
    
    // Get messages sent to this student by faculty
    const messages = await Message.find({
      recipient: studentId,
      sender: { $in: facultyIds }
    })
    .populate("sender", "fullName email")
    .populate("roomId", "roomName")
    .sort({ createdAt: -1 })
    .limit(50);
    
    console.log("🔍 getStudentFacultyMessages - messages found:", messages.length);
    
    // Transform messages to include file information if present
    const transformedMessages = messages.map(message => {
      const messageObj = message.toObject();
      
      // Check if content contains file information
      if (messageObj.content.includes("📎")) {
        // Extract file information from content
        const fileMatch = messageObj.content.match(/📎 (.+)/);
        if (fileMatch) {
          messageObj.fileName = fileMatch[1];
          // For now, we'll use a placeholder URL since files are stored in Stream
          messageObj.fileUrl = "#"; // This would need to be updated with actual file URLs
        }
      }
      
      return messageObj;
    });
    
    res.status(200).json({
      success: true,
      messages: transformedMessages,
      rooms: studentRooms
    });
    
  } catch (error) {
    console.log("Error in getStudentFacultyMessages controller", error.message);
    console.log("Error stack:", error.stack);
    res.status(500).json({ 
      message: "Internal Server Error",
      error: error.message 
    });
  }
}

// Get messages for a specific room (for faculty and students)
export async function getRoomMessages(req, res) {
  try {
    const { roomId } = req.params;
    const userId = req.user._id;
    
    // Verify the room exists and user is a member
    const room = await Room.findById(roomId)
      .populate("faculty", "fullName email")
      .populate("members", "fullName email");
    
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }
    
    // Check if user is faculty or member
    const isFaculty = room.faculty._id.toString() === userId.toString();
    const isMember = room.members.some(member => member._id.toString() === userId.toString());
    
    if (!isFaculty && !isMember) {
      return res.status(403).json({ message: "Access denied" });
    }
    
    // Get messages for this room
    const messages = await Message.find({
      roomId: roomId,
      $or: [
        { recipient: userId },
        { sender: userId },
        { targetUserId: null } // Messages sent to all members
      ]
    })
    .populate("sender", "fullName email")
    .populate("recipient", "fullName email")
    .sort({ createdAt: -1 })
    .limit(100);
    
    res.status(200).json({
      success: true,
      messages: messages,
      room: room
    });
    
  } catch (error) {
    console.log("Error in getRoomMessages controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

// Mark message as read
export async function markMessageAsRead(req, res) {
  try {
    const { messageId } = req.params;
    const studentId = req.user._id;
    
    console.log("🔍 markMessageAsRead - messageId:", messageId);
    console.log("🔍 markMessageAsRead - studentId:", studentId);
    
    // Find the message and verify it belongs to this student
    const message = await Message.findById(messageId);
    
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }
    
    // Verify the message is for this student
    if (message.recipient.toString() !== studentId.toString()) {
      return res.status(403).json({ message: "Access denied" });
    }
    
    // Mark message as read
    message.isRead = true;
    message.readAt = new Date();
    await message.save();
    
    console.log("✅ Message marked as read:", messageId);
    
    res.status(200).json({
      success: true,
      message: "Message marked as read",
      messageId: messageId
    });
    
  } catch (error) {
    console.log("Error in markMessageAsRead controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}
