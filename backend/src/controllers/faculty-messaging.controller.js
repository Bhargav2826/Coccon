import Room from "../models/Room.js";
import User from "../models/User.js";
import Call from "../models/Call.js";
import GroupChat from "../models/GroupChat.js";
import GroupMessage from "../models/GroupMessage.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

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

    // Check if Stream Chat is properly configured (used for signaling/history if needed, though we moved away from chat)
    // We'll keep the streamServerClient check if it's used for video tokens or other things later, 
    // but here it was used to send messages. Since we are removing chat, we might want to skip the message part.
    // However, the original code used it. I'll keep the core video logic.

    // Verify the room exists and faculty owns it
    const room = await Room.findById(roomId).populate("members", "fullName email");
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    if (room.faculty.toString() !== facultyId.toString()) {
      return res.status(403).json({ message: "You can only start video calls for your own rooms" });
    }

    // Generate a unique call ID for this faculty video call
    const timestamp = Date.now();
    const callId = `faculty-${room._id}-${timestamp}`;

    // Create the video call record in the DB immediately
    try {
      // End any existing ongoing calls for this faculty room
      await Call.updateMany(
        { roomId: { $regex: `^faculty-${room._id}-` }, status: 'ongoing' },
        { status: 'ended', endedAt: new Date() }
      );

      // Create new call record
      await Call.create({
        roomId: callId,
        participants: [facultyId],
        callerName: req.user.fullName,
        receiverName: `${room.roomName} Members`,
        type: "video",
        status: 'ongoing',
        startedAt: new Date(),
        summary: "",
        safetyAlert: { type: "safe", message: "" },
        sentiment: "neutral",
        specificIssues: [],
        transcripts: []
      });
      console.log("📝 Initial Call record created for room:", room.roomName);
    } catch (err) {
      console.error("Error creating initial call record:", err);
    }

    // Create the video call URL
    const callUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/call/${callId}`;

    console.log("🎥 Generated call details:", {
      callId,
      callUrl,
      roomName: room.roomName
    });

    // Send to all room members via Socket.io for real-time ring/popup
    const results = [];
    for (const member of room.members) {
      if (member._id.toString() === facultyId.toString()) continue;

      try {
        const receiverSocketId = getReceiverSocketId(member._id.toString());
        if (receiverSocketId) {
          console.log(`📡 Emitting call:incoming to member via socket: ${member.fullName}`);
          io.to(receiverSocketId).emit("call:incoming", {
            recipientId: member._id.toString(),
            callId: callId,
            type: "video",
            callerInfo: {
              id: facultyId.toString(),
              name: req.user.fullName,
              profilePic: req.user.profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(req.user.fullName)}&background=random`
            },
            isClassroomCall: true,
            roomName: room.roomName
          });
        }

        results.push({
          _id: member._id,
          fullName: member.fullName,
          email: member.email,
          status: "sent"
        });
      } catch (error) {
        console.error(`❌ Failed to notify ${member.fullName}:`, error);
        results.push({
          _id: member._id,
          fullName: member.fullName,
          status: "failed",
          error: error.message
        });
      }
    }

    // NEW: Send a message to the classroom group chat with the join link
    if (room.linkedGroup) {
      try {
        const joinLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/call/${callId}`;
        const newMessage = new GroupMessage({
          group: room.linkedGroup,
          sender: facultyId,
          text: `📞 Started a Video Call: ${callTitle}`,
          callLink: joinLink
        });

        await newMessage.save();

        // Populate sender info for frontend display
        await newMessage.populate("sender", "fullName profilePic");

        // Update last message in GroupChat
        await GroupChat.findByIdAndUpdate(room.linkedGroup, {
          lastMessage: newMessage._id,
        });

        // Notify group members via socket about the new message
        // We can reuse the room.members list since group members are the same
        for (const member of room.members) {
          const receiverSocketId = getReceiverSocketId(member._id.toString());
          if (receiverSocketId) {
            io.to(receiverSocketId).emit("newGroupMessage", newMessage);
          }
        }
        // Also notify the sender (faculty)
        const senderSocketId = getReceiverSocketId(facultyId.toString());
        if (senderSocketId) {
          io.to(senderSocketId).emit("newGroupMessage", newMessage);
        }

        console.log("✅ Call link message sent to group chat");
      } catch (msgError) {
        console.error("❌ Failed to send call link message to group:", msgError);
      }
    }

    res.status(200).json({
      success: true,
      message: "Video call started and members notified",
      callId: callId,
      callUrl: callUrl,
      results: results,
      totalSent: results.filter(r => r.status === "sent").length,
      totalFailed: results.filter(r => r.status === "failed").length
    });

  } catch (error) {
    console.log("❌ Error in startFacultyVideoCall controller:", error.message);
    res.status(500).json({
      message: "Internal Server Error",
      error: error.message
    });
  }
}
