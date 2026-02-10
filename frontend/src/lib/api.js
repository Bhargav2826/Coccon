import { axiosInstance } from "./axios";

export const signup = async (signupData) => {
  const response = await axiosInstance.post("/auth/signup", signupData);
  return response.data;
};

export const login = async (loginData) => {
  const response = await axiosInstance.post("/auth/login", loginData);
  return response.data;
};
export const logout = async () => {
  const response = await axiosInstance.post("/auth/logout");
  return response.data;
};

export const getAuthUser = async () => {
  try {
    const res = await axiosInstance.get("/auth/me");
    return res.data;
  } catch (error) {
    console.log("Error in getAuthUser:", error);
    return null;
  }
};

export const completeOnboarding = async (userData) => {
  const response = await axiosInstance.post("/auth/onboarding", userData);
  return response.data;
};

export async function getUserFriends() {
  const response = await axiosInstance.get("/users/friends");
  return response.data;
}

export async function getRecommendedUsers() {
  const response = await axiosInstance.get("/users");
  return response.data;
}

export async function getOutgoingFriendReqs() {
  const response = await axiosInstance.get("/users/outgoing-friend-requests");
  return response.data;
}

export async function sendFriendRequest(userId) {
  const response = await axiosInstance.post(`/users/friend-request/${userId}`);
  return response.data;
}

export async function getFriendRequests() {
  const response = await axiosInstance.get("/users/friend-requests");
  return response.data;
}

export async function acceptFriendRequest(requestId) {
  const response = await axiosInstance.put(`/users/friend-request/${requestId}/accept`);
  return response.data;
}

export async function rejectFriendRequest(requestId) {
  const response = await axiosInstance.put(`/users/friend-request/${requestId}/reject`);
  return response.data;
}

export async function removeFriend(friendId) {
  const response = await axiosInstance.delete(`/users/friends/${friendId}`);
  return response.data;
}


export async function getFriendRequestsCount() {
  const response = await axiosInstance.get("/users/friend-requests/count");
  return response.data;
}

// Room Management API functions
export async function getFacultyRooms() {
  const response = await axiosInstance.get("/rooms/my-rooms");
  return response.data.rooms; // Return the rooms array, not the entire response
}

export async function createRoom(roomData) {
  const response = await axiosInstance.post("/rooms/create", roomData);
  return response.data; // This returns { success: true, message: "...", room: {...} }
}

export async function joinRoom(inviteCode) {
  const response = await axiosInstance.post("/rooms/join", { inviteCode });
  return response.data;
}

export async function getStudentRooms() {
  const response = await axiosInstance.get("/rooms/joined-rooms");
  return response.data.rooms;
}

export async function getRoomMembers(roomId) {
  const response = await axiosInstance.get(`/rooms/${roomId}/members`);
  return response.data;
}

// Delete room functions
export async function deleteRoom(roomId) {
  const response = await axiosInstance.delete(`/rooms/${roomId}`);
  return response.data;
}

export async function deleteRooms(roomIds) {
  const response = await axiosInstance.delete("/rooms/bulk-delete", {
    data: { roomIds }
  });
  return response.data;
}

// Parent Dashboard API functions
export async function getMyChildren() {
  const response = await axiosInstance.get("/users/children");
  return response.data;
}

export async function linkChildToParent(childEmail) {
  const response = await axiosInstance.post("/users/link-child", { childEmail });
  return response.data;
}

export async function getChildConversations(childId) {
  const response = await axiosInstance.get(`/users/children/${childId}/conversations`);
  return response.data;
}


export async function analyzeCall(analysisData) {
  const response = await axiosInstance.post("/ai/analyze-call", analysisData);
  return response.data;
}

export async function analyzeChat(analysisData) {
  const response = await axiosInstance.post("/ai/analyze-chat", analysisData);
  return response.data;
}

export const getCallHistory = async (childUid, targetUid, callType, limit = 20, sort = 'desc', startDate = '', endDate = '') => {
  const response = await axiosInstance.get(`/ai/calls/${childUid}/${targetUid}?type=${callType}&limit=${limit}&sort=${sort}&startDate=${startDate}&endDate=${endDate}`);
  return response.data;
};

export const getChatHistory = async (childUid, targetUid, limit = 50, sort = 'desc', startDate = '', endDate = '') => {
  const response = await axiosInstance.get(`/ai/chats/${childUid}/${targetUid}?limit=${limit}&sort=${sort}&startDate=${startDate}&endDate=${endDate}`);
  return response.data;
};

export const getChatSessions = async (childUid, targetUid) => {
  const response = await axiosInstance.get(`/ai/chats/sessions/${childUid}/${targetUid}`);
  return response.data;
};

export async function getChildCalls(childUid, type) {
  const response = await axiosInstance.get(`/ai/child-calls/${childUid}${type ? `?type=${type}` : ''}`);
  return response.data;
}

// Secure linking system API functions
export async function generateLinkCode() {
  const response = await axiosInstance.post("/users/generate-link-code");
  return response.data;
}

export async function useLinkCode(code) {
  const response = await axiosInstance.post("/users/use-link-code", { code });
  return response.data;
}

export async function getLinkedAccounts() {
  const response = await axiosInstance.get("/users/linked-accounts");
  return response.data;
}



export async function startFacultyVideoCall(callData) {
  const response = await axiosInstance.post("/faculty-messaging/start-video-call", callData, {
    headers: {
      'Content-Type': 'application/json',
    },
  });
  return response.data;
}


// Theme management API functions
export async function getTheme() {
  const response = await axiosInstance.get("/users/theme");
  return response.data;
}

export async function updateTheme(theme) {
  const response = await axiosInstance.put("/users/theme", { theme });
  return response.data;
}

// LiveKit API function
export async function getLiveKitToken(roomName, username) {
  const response = await axiosInstance.post("/livekit/token", { roomName, username });
  return response.data;
}

export async function checkServerHealth() {
  const response = await axiosInstance.get("/health");
  return response.data;
}

// Chat API functions
export async function getUsersForSidebar() {
  const response = await axiosInstance.get("/messages/users");
  return response.data;
}

export async function getMessages(userId) {
  const response = await axiosInstance.get(`/messages/${userId}`);
  return response.data;
}

export async function sendMessage(userId, messageData) {
  const response = await axiosInstance.post(`/messages/send/${userId}`, messageData);
  return response.data;
}
