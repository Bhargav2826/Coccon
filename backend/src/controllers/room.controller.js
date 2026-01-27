import Room from "../models/Room.js";
import User from "../models/User.js";
import Message from "../models/Message.js";

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

    // Populate faculty details
    await newRoom.populate("faculty", "fullName email");

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

    const rooms = await Room.find({ faculty: facultyId })
      .populate("faculty", "fullName email")
      .populate("members", "fullName email role")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      rooms,
    });
  } catch (error) {
    console.log("Error in getFacultyRooms controller", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function getStudentRooms(req, res) {
  try {
    const userId = req.user._id;

    const rooms = await Room.find({ members: userId })
      .populate("faculty", "fullName email")
      .populate("members", "fullName email role")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      rooms,
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

    // Delete all messages associated with this room
    await Message.deleteMany({ roomId: roomId });

    // Delete the room
    await Room.findByIdAndDelete(roomId);

    res.status(200).json({
      success: true,
      message: "Room and all associated messages deleted successfully"
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

    // Delete all the rooms
    await Room.deleteMany({
      _id: { $in: roomIds },
      faculty: facultyId
    });

    // Delete all messages associated with these rooms
    await Message.deleteMany({ roomId: { $in: roomIds } });

    res.status(200).json({
      success: true,
      message: `${rooms.length} room${rooms.length > 1 ? 's' : ''} and all associated messages deleted successfully`,
      deletedCount: rooms.length
    });
  } catch (error) {
    console.log("Error in deleteRooms controller", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}
