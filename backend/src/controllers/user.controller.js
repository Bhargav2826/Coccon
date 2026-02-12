import User from "../models/User.js";
import FriendRequest from "../models/FriendRequest.js";

export async function getRecommendedUsers(req, res) {
  try {
    const currentUserId = req.user.id;
    const currentUser = req.user;

    const recommendedUsers = await User.find({
      $and: [
        { _id: { $ne: currentUserId } }, //exclude current user
        { _id: { $nin: currentUser.friends } }, // exclude current user's friends
        { isOnboarded: true },
      ],
    });
    res.status(200).json(recommendedUsers);
  } catch (error) {
    console.error("Error in getRecommendedUsers controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function getUserById(req, res) {
  try {
    const { id } = req.params;
    const user = await User.findById(id).select("fullName profilePic role nativeLanguage learningLanguage");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error("Error in getUserById controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function getMyFriends(req, res) {
  try {
    const user = await User.findById(req.user.id)
      .select("friends")
      .populate("friends", "fullName profilePic nativeLanguage learningLanguage");

    res.status(200).json(user.friends);
  } catch (error) {
    console.error("Error in getMyFriends controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function sendFriendRequest(req, res) {
  try {
    const myId = req.user.id;
    const { id: recipientId } = req.params;

    // prevent sending req to yourself
    if (myId === recipientId) {
      return res.status(400).json({ message: "You can't send friend request to yourself" });
    }

    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ message: "Recipient not found" });
    }

    // check if user is already friends
    if (recipient.friends.includes(myId)) {
      return res.status(400).json({ message: "You are already friends with this user" });
    }

    // check if a req already exists
    const existingRequest = await FriendRequest.findOne({
      $or: [
        { sender: myId, recipient: recipientId },
        { sender: recipientId, recipient: myId },
      ],
    });

    if (existingRequest) {
      return res
        .status(400)
        .json({ message: "A friend request already exists between you and this user" });
    }

    const friendRequest = await FriendRequest.create({
      sender: myId,
      recipient: recipientId,
    });

    res.status(201).json(friendRequest);
  } catch (error) {
    console.error("Error in sendFriendRequest controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function acceptFriendRequest(req, res) {
  try {
    const { id: requestId } = req.params;

    const friendRequest = await FriendRequest.findById(requestId);

    if (!friendRequest) {
      return res.status(404).json({ message: "Friend request not found" });
    }

    // Verify the current user is the recipient
    if (friendRequest.recipient.toString() !== req.user.id) {
      return res.status(403).json({ message: "You are not authorized to accept this request" });
    }

    friendRequest.status = "accepted";
    await friendRequest.save();

    // add each user to the other's friends array
    // $addToSet: adds elements to an array only if they do not already exist.
    await User.findByIdAndUpdate(friendRequest.sender, {
      $addToSet: { friends: friendRequest.recipient },
    });

    await User.findByIdAndUpdate(friendRequest.recipient, {
      $addToSet: { friends: friendRequest.sender },
    });

    res.status(200).json({ message: "Friend request accepted" });
  } catch (error) {
    console.log("Error in acceptFriendRequest controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function rejectFriendRequest(req, res) {
  try {
    const { id: requestId } = req.params;

    const friendRequest = await FriendRequest.findById(requestId);

    if (!friendRequest) {
      return res.status(404).json({ message: "Friend request not found" });
    }

    // Verify the current user is the recipient
    if (friendRequest.recipient.toString() !== req.user.id) {
      return res.status(403).json({ message: "You are not authorized to reject this request" });
    }

    await FriendRequest.findByIdAndDelete(requestId);

    res.status(200).json({ message: "Friend request rejected" });
  } catch (error) {
    console.log("Error in rejectFriendRequest controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function removeFriend(req, res) {
  try {
    const { id: friendId } = req.params;
    const currentUserId = req.user.id;

    // Verify the friend exists
    const friend = await User.findById(friendId);
    if (!friend) {
      return res.status(404).json({ message: "Friend not found" });
    }

    // Verify they are actually friends
    const currentUser = await User.findById(currentUserId);
    if (!currentUser.friends.includes(friendId)) {
      return res.status(400).json({ message: "This user is not your friend" });
    }

    // Remove friend from both users' friends arrays
    await User.findByIdAndUpdate(currentUserId, {
      $pull: { friends: friendId },
    });

    await User.findByIdAndUpdate(friendId, {
      $pull: { friends: currentUserId },
    });

    res.status(200).json({
      success: true,
      message: "Friend removed successfully"
    });
  } catch (error) {
    console.log("Error in removeFriend controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function getFriendRequests(req, res) {
  try {
    const incomingReqs = await FriendRequest.find({
      recipient: req.user.id,
      status: "pending",
    }).populate("sender", "fullName profilePic nativeLanguage learningLanguage");

    const acceptedReqs = await FriendRequest.find({
      sender: req.user.id,
      status: "accepted",
    }).populate("recipient", "fullName profilePic");

    res.status(200).json({ incomingReqs, acceptedReqs });
  } catch (error) {
    console.log("Error in getPendingFriendRequests controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function getOutgoingFriendReqs(req, res) {
  try {
    const outgoingRequests = await FriendRequest.find({
      sender: req.user.id,
      status: "pending",
    }).populate("recipient", "fullName profilePic nativeLanguage learningLanguage");

    res.status(200).json(outgoingRequests);
  } catch (error) {
    console.log("Error in getOutgoingFriendReqs controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}
export async function getFriendRequestsCount(req, res) {
  try {
    const count = await FriendRequest.countDocuments({
      recipient: req.user.id,
      status: "pending",
    });
    res.status(200).json({ count });
  } catch (error) {
    console.log("Error in getFriendRequestsCount controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

// Parent-child relationship functions
export async function getMyChildren(req, res) {
  try {
    const user = await User.findById(req.user.id)
      .select("children")
      .populate("children", "fullName profilePic role email");

    res.status(200).json(user.children || []);
  } catch (error) {
    console.error("Error in getMyChildren controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function linkChildToParent(req, res) {
  try {
    const { childEmail } = req.body;
    const parentId = req.user.id;

    // Verify the requesting user is a parent
    if (req.user.role !== "parent") {
      return res.status(403).json({ message: "Only parents can link children" });
    }

    // Find the child by email
    const child = await User.findOne({ email: childEmail, role: "student" });
    if (!child) {
      return res.status(404).json({ message: "Student not found with this email" });
    }

    // Check if child is already linked to a parent
    if (child.parent) {
      return res.status(400).json({ message: "This child is already linked to a parent" });
    }

    // Link child to parent
    await User.findByIdAndUpdate(child._id, { parent: parentId });
    await User.findByIdAndUpdate(parentId, { $addToSet: { children: child._id } });

    res.status(200).json({ message: "Child linked successfully", child });
  } catch (error) {
    console.error("Error in linkChildToParent controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function getChildConversations(req, res) {
  try {
    const { childId } = req.params;
    const parentId = req.user.id;

    console.log('🔍 Parent requesting child conversations:', {
      childId,
      parentId: parentId.toString(),
      parentRole: req.user.role
    });

    // Verify the requesting user is a parent
    if (req.user.role !== "parent") {
      return res.status(403).json({ message: "Only parents can view child conversations" });
    }

    // Verify the child belongs to this parent
    const parent = await User.findById(parentId).select("children");
    if (!parent.children.includes(childId)) {
      return res.status(403).json({ message: "You can only view conversations of your linked children" });
    }

    // Get ALL conversation partners for the child, not just friends
    // This includes: friends, classroom members, and any other users they've chatted with

    // 1. Get child's friends
    const child = await User.findById(childId)
      .select("friends")
      .populate("friends", "fullName profilePic role email");

    const friends = child.friends || [];
    console.log('👥 Child friends found:', friends.length);

    // 2. Get child's joined rooms (classrooms)
    const Room = (await import("../models/Room.js")).default;
    const joinedRooms = await Room.find({
      members: childId
    }).populate("members", "fullName profilePic role email");

    console.log('🏫 Child joined rooms:', joinedRooms.length);

    // 3. Get all unique conversation partners from rooms
    const roomMembers = new Set();
    joinedRooms.forEach(room => {
      room.members.forEach(member => {
        if (member._id.toString() !== childId) {
          roomMembers.add(member._id.toString());
        }
      });
    });

    // 4. Combined conversation partners (friends and room members)
    const allPartnerIds = new Set([
      ...friends.map(friend => friend._id.toString()),
      ...roomMembers
    ]);

    console.log('📊 Total unique conversation partners:', allPartnerIds.size);

    // 7. Fetch all conversation partners' details
    const allPartners = await User.find({
      _id: { $in: Array.from(allPartnerIds) }
    }).select("fullName profilePic role email");

    // 8. Categorize conversation partners
    const categorizedPartners = allPartners.map(partner => {
      const partnerId = partner._id.toString();
      const isFriend = friends.some(friend => friend._id.toString() === partnerId);
      const isRoomMember = roomMembers.has(partnerId);
      let conversationType = [];
      if (isFriend) conversationType.push("friend");
      if (isRoomMember) conversationType.push("classroom");

      return {
        ...partner.toObject(),
        conversationType,
        isFriend,
        isRoomMember,
        hasDirectChat: false
      };
    });

    // Sort by name for better UX
    categorizedPartners.sort((a, b) => a.fullName.localeCompare(b.fullName));

    console.log('✅ Returning conversation partners:', categorizedPartners.length);

    res.status(200).json(categorizedPartners);
  } catch (error) {
    console.error("Error in getChildConversations controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

// Secure linking system functions
export async function generateLinkCode(req, res) {
  try {
    const parentId = req.user.id;

    // Verify the requesting user is a parent
    if (req.user.role !== "parent") {
      return res.status(403).json({ message: "Only parents can generate link codes" });
    }

    // Generate a unique 6-digit code
    const generateCode = () => {
      return Math.floor(100000 + Math.random() * 900000).toString();
    };

    // Check if code already exists and generate a new one if needed
    let linkCode;
    let existingParent;
    let attempts = 0;
    const maxAttempts = 10;

    do {
      linkCode = generateCode();
      existingParent = await User.findOne({
        linkCode,
        linkCodeExpires: { $gt: new Date() }
      });
      attempts++;
    } while (existingParent && attempts < maxAttempts);

    if (existingParent) {
      return res.status(500).json({ message: "Failed to generate unique link code" });
    }

    // Set expiration time (10 minutes from now)
    const linkCodeExpires = new Date(Date.now() + 10 * 60 * 1000);

    // Save the code to the parent's account
    await User.findByIdAndUpdate(parentId, {
      linkCode,
      linkCodeExpires,
    });

    res.status(200).json({
      success: true,
      message: "Link code generated successfully",
      linkCode,
      expiresAt: linkCodeExpires,
    });
  } catch (error) {
    console.error("Error in generateLinkCode controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function useLinkCode(req, res) {
  try {
    const { code } = req.body;
    const studentId = req.user.id;

    // Verify the requesting user is a student
    if (req.user.role !== "student") {
      return res.status(403).json({ message: "Only students can use link codes" });
    }

    // Find parent with the active link code
    const parent = await User.findOne({
      linkCode: code,
      linkCodeExpires: { $gt: new Date() },
      role: "parent",
    });

    if (!parent) {
      return res.status(404).json({ message: "Invalid or expired link code" });
    }

    // Check if student is already linked to a parent
    const student = await User.findById(studentId);
    if (student.parent) {
      return res.status(400).json({ message: "You are already linked to a parent" });
    }

    // Check if parent already has this student as a child
    if (parent.children.includes(studentId)) {
      return res.status(400).json({ message: "You are already linked to this parent" });
    }

    // Establish two-way link
    await User.findByIdAndUpdate(studentId, {
      parent: parent._id,
      $addToSet: { linkedAccounts: parent._id },
    });

    await User.findByIdAndUpdate(parent._id, {
      $addToSet: {
        children: studentId,
        linkedAccounts: studentId,
      },
      // Clear the used link code
      linkCode: null,
      linkCodeExpires: null,
    });

    // Get updated parent info for response
    const updatedParent = await User.findById(parent._id).select("fullName email");

    res.status(200).json({
      success: true,
      message: "Successfully linked to parent",
      parent: updatedParent,
    });
  } catch (error) {
    console.error("Error in useLinkCode controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function getLinkedAccounts(req, res) {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId)
      .select("linkedAccounts")
      .populate("linkedAccounts", "fullName email role profilePic");

    res.status(200).json(user.linkedAccounts || []);
  } catch (error) {
    console.error("Error in getLinkedAccounts controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function updateTheme(req, res) {
  try {
    const { theme } = req.body;
    const userId = req.user.id;

    // Validate theme - accept all available DaisyUI themes
    const validThemes = [
      'light', 'dark', 'night', 'cupcake', 'forest', 'bumblebee', 'emerald',
      'corporate', 'synthwave', 'retro', 'cyberpunk', 'valentine', 'halloween',
      'garden', 'aqua', 'lofi', 'pastel', 'fantasy', 'wireframe', 'black',
      'luxury', 'dracula', 'cmyk', 'autumn', 'business', 'acid', 'lemonade',
      'coffee', 'winter', 'dim', 'nord', 'sunset'
    ];

    if (!validThemes.includes(theme)) {
      return res.status(400).json({
        message: `Invalid theme. Must be one of: ${validThemes.join(', ')}`
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { theme },
      { new: true, runValidators: true }
    ).select('theme');

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ theme: user.theme });
  } catch (error) {
    console.error("Error in updateTheme controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function getTheme(req, res) {
  try {
    const user = await User.findById(req.user.id).select('theme');

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ theme: user.theme });
  } catch (error) {
    console.error("Error in getTheme controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function updateStatus(req, res) {
  try {
    const { text, emoji } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { status: { text, emoji } },
      { new: true }
    ).select("status");
    res.status(200).json(user.status);
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function updateWallpaper(req, res) {
  try {
    const { userId: otherUserId, wallpaperUrl } = req.body;
    const user = await User.findById(req.user.id);
    user.chatWallpapers.set(otherUserId, wallpaperUrl);
    await user.save();
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function pinChat(req, res) {
  try {
    const { userId } = req.params;
    const user = await User.findById(req.user.id);
    const isPinned = user.pinnedChats.includes(userId);
    if (isPinned) {
      user.pinnedChats = user.pinnedChats.filter(id => id.toString() !== userId);
    } else {
      user.pinnedChats.push(userId);
    }
    await user.save();
    res.status(200).json({ isPinned: !isPinned });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function muteChat(req, res) {
  try {
    const { userId } = req.params;
    const user = await User.findById(req.user.id);
    const isMuted = user.mutedChats.includes(userId);
    if (isMuted) {
      user.mutedChats = user.mutedChats.filter(id => id.toString() !== userId);
    } else {
      user.mutedChats.push(userId);
    }
    await user.save();
    res.status(200).json({ isMuted: !isMuted });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function blockUser(req, res) {
  try {
    const { userId } = req.params;
    const user = await User.findById(req.user.id);
    const isBlocked = user.blockedUsers.includes(userId);
    if (isBlocked) {
      user.blockedUsers = user.blockedUsers.filter(id => id.toString() !== userId);
    } else {
      user.blockedUsers.push(userId);
    }
    await user.save();
    res.status(200).json({ isBlocked: !isBlocked });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function updateLastSeen(req, res) {
  try {
    await User.findByIdAndUpdate(req.user.id, { lastSeen: new Date() });
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
}
