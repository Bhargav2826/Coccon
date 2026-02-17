import Room from "../models/Room.js";
import User from "../models/User.js";
import Call from "../models/Call.js";
import GroupChat from "../models/GroupChat.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

// Generate a unique invite code
const generateInviteCode = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Check if invite code already exists
const isInviteCodeUnique = async (inviteCode) => {
  const existingRoom = await Room.findOne({ inviteCode });
  return !existingRoom;
};

export async function createRoom(req, res) {
  try {
    const { roomName } = req.body;
    const facultyId = req.user._id;

    // Generate a unique invite code
    let inviteCode;
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 10;

    while (!isUnique && attempts < maxAttempts) {
      inviteCode = generateInviteCode();
      isUnique = await isInviteCodeUnique(inviteCode);
      attempts++;
    }

    if (!isUnique) {
      return res.status(500).json({ message: "Failed to generate unique invite code" });
    }

    const newRoom = await Room.create({
      roomName,
      faculty: facultyId,
      inviteCode,
      members: [facultyId], // Faculty is automatically a member
    });

    // Create a corresponding group chat for the classroom
    const newGroup = await GroupChat.create({
      name: roomName,
      description: `Official classroom group for ${roomName}`,
      groupPic: `https://ui-avatars.com/api/?name=${encodeURIComponent(roomName)}&background=random`,
      admin: facultyId,
      members: [facultyId],
      type: 'classroom',
    });

    // Notify all members (faculty)
    newGroup.members.forEach(memberId => {
      const socketId = getReceiverSocketId(memberId);
      if (socketId) io.to(socketId).emit("newGroup", newGroup);
    });

    // Link the group to the room
    newRoom.linkedGroup = newGroup._id;
    await newRoom.save();

    // Populate faculty details
    await newRoom.populate("faculty", "fullName email");

    // Include the linked group in the response
    await newRoom.populate("linkedGroup");

    res.status(201).json({
      success: true,
      message: "Room created successfully",
      room: newRoom,
    });
  } catch (error) {
    console.log("Error in createRoom controller", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function joinRoom(req, res) {
  try {
    const { inviteCode } = req.body;
    const userId = req.user._id;

    // Find room by invite code
    const room = await Room.findOne({ inviteCode });
    if (!room) {
      return res.status(404).json({ message: "Invalid invite code" });
    }

    // Check if user is already a member
    if (room.members.includes(userId)) {
      return res.status(400).json({ message: "You are already a member of this room" });
    }

    // Add user to room members
    room.members.push(userId);
    await room.save();

    // Check if the room has a linked group chat
    if (room.linkedGroup) {
      // Add user to the linked group chat
      const linkedGroup = await GroupChat.findById(room.linkedGroup);
      if (linkedGroup && !linkedGroup.members.includes(userId)) {
        linkedGroup.members.push(userId);
        await linkedGroup.save();

        // Notify the user who joined so the group appears in their chat list immediately
        const socketId = getReceiverSocketId(userId);
        if (socketId) io.to(socketId).emit("newGroup", linkedGroup);
      }
    } else {
      // Create a linked group chat if it doesn't exist (Self-healing for existing classrooms)
      const newGroup = await GroupChat.create({
        name: room.roomName,
        description: `Official classroom group for ${room.roomName}`,
        groupPic: `https://ui-avatars.com/api/?name=${encodeURIComponent(room.roomName)}&background=random`,
        admin: room.faculty._id || room.faculty, // Handle if populated or not
        members: [room.faculty._id || room.faculty, userId],
        type: 'classroom',
      });
      room.linkedGroup = newGroup._id;
      await room.save();

      // Notify all members
      newGroup.members.forEach(memberId => {
        const socketId = getReceiverSocketId(memberId);
        if (socketId) io.to(socketId).emit("newGroup", newGroup);
      });
    }

    // Populate room details
    await room.populate("faculty", "fullName email");
    await room.populate("members", "fullName email role");

    res.status(200).json({
      success: true,
      message: "Successfully joined the room",
      room,
    });
  } catch (error) {
    console.log("Error in joinRoom controller", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function getFacultyRooms(req, res) {
  try {
    const facultyId = req.user._id;

    // WISE SHIELD: Auto-cleanup stale calls that have been 'ongoing' for too long (> 4 hours)
    // This prevents ghost calls from appearing on the dashboard
    const staleThreshold = new Date(Date.now() - 4 * 60 * 60 * 1000);
    await Call.updateMany(
      { status: 'ongoing', startedAt: { $lt: staleThreshold } },
      { status: 'ended', endedAt: new Date() }
    );

    const rooms = await Room.find({ faculty: facultyId })
      .populate("faculty", "fullName email")
      .populate("members", "fullName email role")
      .sort({ createdAt: -1 });

    // SELF-HEALING: Ensure all rooms have a linked group chat
    for (const room of rooms) {
      if (!room.linkedGroup) {
        // Create the missing group chat
        const newGroup = await GroupChat.create({
          name: room.roomName,
          description: `Official classroom group for ${room.roomName}`,
          groupPic: `https://ui-avatars.com/api/?name=${encodeURIComponent(room.roomName)}&background=random`,
          admin: facultyId,
          members: [facultyId, ...room.members.map(m => m._id)],
          type: 'classroom',
        });

        // Notify all members
        newGroup.members.forEach(memberId => {
          const socketId = getReceiverSocketId(memberId);
          if (socketId) io.to(socketId).emit("newGroup", newGroup);
        });

        room.linkedGroup = newGroup._id;
        await room.save();
      }
    }

    // For each room, check if there's an ongoing faculty call
    const roomsWithCallStatus = await Promise.all(rooms.map(async (room) => {
      const activeCall = await Call.findOne({
        roomId: { $regex: `^faculty-${room._id}-` },
        status: 'ongoing'
      });

      return {
        ...room.toObject(),
        activeCall: activeCall ? {
          callId: activeCall.roomId,
          startedAt: activeCall.startedAt
        } : null
      };
    }));

    res.status(200).json({
      success: true,
      rooms: roomsWithCallStatus,
    });
  } catch (error) {
    console.log("Error in getFacultyRooms controller", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function getStudentRooms(req, res) {
  try {
    const userId = req.user._id;

    // WISE SHIELD: Auto-cleanup stale calls for students as well
    const staleThreshold = new Date(Date.now() - 4 * 60 * 60 * 1000);
    await Call.updateMany(
      { status: 'ongoing', startedAt: { $lt: staleThreshold } },
      { status: 'ended', endedAt: new Date() }
    );

    const rooms = await Room.find({ members: userId })
      .populate("faculty", "fullName email")
      .populate("members", "fullName email role")
      .sort({ createdAt: -1 });

    // SELF-HEALING: Ensure joined rooms have a linked group chat
    for (const room of rooms) {
      if (!room.linkedGroup) {
        // Create the missing group chat (using room.faculty as admin)
        const facultyId = room.faculty._id || room.faculty;
        const newGroup = await GroupChat.create({
          name: room.roomName,
          description: `Official classroom group for ${room.roomName}`,
          groupPic: `https://ui-avatars.com/api/?name=${encodeURIComponent(room.roomName)}&background=random`,
          admin: facultyId,
          members: [facultyId, ...room.members.map(m => m._id)],
          type: 'classroom',
        });

        // Notify all members
        newGroup.members.forEach(memberId => {
          const socketId = getReceiverSocketId(memberId);
          if (socketId) io.to(socketId).emit("newGroup", newGroup);
        });

        room.linkedGroup = newGroup._id;
        await room.save();
      }
    }

    // For each room, check if there's an ongoing faculty call
    const roomsWithCallStatus = await Promise.all(rooms.map(async (room) => {
      const activeCall = await Call.findOne({
        roomId: { $regex: `^faculty-${room._id}-` },
        status: 'ongoing'
      });

      return {
        ...room.toObject(),
        activeCall: activeCall ? {
          callId: activeCall.roomId,
          startedAt: activeCall.startedAt
        } : null
      };
    }));

    res.status(200).json({
      success: true,
      rooms: roomsWithCallStatus,
    });
  } catch (error) {
    console.log("Error in getStudentRooms controller", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function getRoomMembers(req, res) {
  try {
    const { roomId } = req.params;
    const userId = req.user._id;

    // Find the room and verify user is a member
    const room = await Room.findById(roomId)
      .populate("faculty", "fullName email profilePic role")
      .populate("members", "fullName email profilePic role");

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    // Check if user is a member of this room
    const isMember = room.members.some(member => member._id.toString() === userId.toString()) ||
      room.faculty._id.toString() === userId.toString();

    if (!isMember) {
      return res.status(403).json({ message: "You are not a member of this room" });
    }

    // Return all members including faculty
    // Filter out faculty from members array to avoid duplication
    const membersWithoutFaculty = room.members.filter(member =>
      member._id.toString() !== room.faculty._id.toString()
    );

    const allMembers = [
      {
        ...room.faculty.toObject(),
        isFaculty: true
      },
      ...membersWithoutFaculty.map(member => ({
        ...member.toObject(),
        isFaculty: false
      }))
    ];

    res.status(200).json({
      success: true,
      members: allMembers,
      roomName: room.roomName
    });
  } catch (error) {
    console.log("Error in getRoomMembers controller", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function deleteRoom(req, res) {
  try {
    const { roomId } = req.params;
    const facultyId = req.user._id;

    // Find the room
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    // Check if the user is the faculty who created this room
    if (room.faculty.toString() !== facultyId.toString()) {
      return res.status(403).json({ message: "You can only delete rooms that you created" });
    }


    // Delete the associated group chat if it exists
    if (room.linkedGroup) {
      await GroupChat.findByIdAndDelete(room.linkedGroup);
    }

    // Delete the room
    await Room.findByIdAndDelete(roomId);

    res.status(200).json({
      success: true,
      message: "Room deleted successfully"
    });
  } catch (error) {
    console.log("Error in deleteRoom controller", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function deleteRooms(req, res) {
  try {
    const { roomIds } = req.body;
    const facultyId = req.user._id;

    // Validate roomIds array
    if (!Array.isArray(roomIds) || roomIds.length === 0) {
      return res.status(400).json({ message: "Please provide an array of room IDs to delete" });
    }

    // Validate each roomId is a valid MongoDB ObjectId
    const mongoose = await import("mongoose");
    const invalidIds = roomIds.filter(id => !mongoose.Types.ObjectId.isValid(id));
    if (invalidIds.length > 0) {
      return res.status(400).json({
        message: "Invalid room ID format",
        invalidIds
      });
    }

    // Find all rooms that belong to this faculty
    const rooms = await Room.find({
      _id: { $in: roomIds },
      faculty: facultyId
    });

    if (rooms.length === 0) {
      return res.status(404).json({ message: "No rooms found to delete" });
    }

    // Check if all requested rooms belong to this faculty
    const foundRoomIds = rooms.map(room => room._id.toString());
    const notFoundIds = roomIds.filter(id => !foundRoomIds.includes(id));

    if (notFoundIds.length > 0) {
      return res.status(403).json({
        message: "You can only delete rooms that you created",
        notFoundIds
      });
    }

    // Find linked groups and delete them
    const groupIdsToDelete = rooms
      .filter(room => room.linkedGroup)
      .map(room => room.linkedGroup);

    if (groupIdsToDelete.length > 0) {
      await GroupChat.deleteMany({
        _id: { $in: groupIdsToDelete }
      });
    }

    // Delete all the rooms
    await Room.deleteMany({
      _id: { $in: roomIds },
      faculty: facultyId
    });


    res.status(200).json({
      success: true,
      message: `${rooms.length} room${rooms.length > 1 ? 's' : ''} deleted successfully`,
      deletedCount: rooms.length
    });
  } catch (error) {
    console.log("Error in deleteRooms controller", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}
