# Chat Call Functionality & History Implementation

## Overview
Enabled video and voice call functionality directly within the chat interface, mirroring the "Friends" section behavior. Additionally, implemented a "Call History" feature that allows users to view past calls, including AI summaries and transcripts.

## Changes Made

### 1. Enable Calling from Chat
Updated `ChatHeader.jsx` to make the Phone and Video buttons functional:
- **Video Call**: links to `/call/${callId}?type=video`
- **Voice Call**: links to `/call/${callId}?type=audio`
- **Call ID Generation**: Uses consistent `userId1-userId2` (sorted) format to ensure both users join the same room.
- **State Handling**: Passes `{ initiating: true }` state to trigger the call start flow.

### 2. Call History & Transcripts
Implemented a new feature to view call history within a chat:
- **Backend API**:
  - Added `getCallLogs` controller in `chat.controller.js`.
  - Added `GET /api/messages/calls/:id` route in `chat.route.js`.
  - Fetches calls between the two users, sorted by most recent.
  - Relies on existing `socket.js` logic to store transcripts and summaries in the `Call` model.

- **Frontend API**:
  - Added `getChatCallLogs` to `api.js`.

- **UI Components**:
  - Created `CallHistoryModal.jsx`:
    - Lists past calls with date, time, type (audio/video), and status.
    - **Expandable items**: Click a call to reveal detailed information.
    - **Summary**: Displays AI-generated summary if available.
    - **Transcript**: Displays full call transcript with active speaker differentiation.
  - Updated `ChatHeader.jsx`:
    - Added a "Clock" icon button to open the Call History modal.
    - Buttons are only visible in 1-on-1 chats (hidden for groups).

## How It Works

1. **Starting a Call**:
   - User clicks Phone/Video icon in Chat Header.
   - Navigates to the call screen, initiating the call.
   - Socket events handle the signaling and room creation (existing logic).

2. **Storing Data**:
   - During the call, the backend (`socket.js`) automatically captures transcripts and saves them to the `Call` document in MongoDB.
   - Upon call end, AI analysis (if configured) generates a summary and saves it to the same document.

3. **Viewing History**:
   - User clicks the "Clock" (History) icon in Chat Header.
   - `CallHistoryModal` fetches logs from the backend.
   - User can browse past calls and read transcripts/summaries directly in the modal.

## Files Modified
- `backend/src/controllers/chat.controller.js` (Added `getCallLogs`)
- `backend/src/routes/chat.route.js` (Added route)
- `frontend/src/lib/api.js` (Added `getChatCallLogs`)
- `frontend/src/components/ChatHeader.jsx` (Implemented call buttons & history)

## Files Created
- `frontend/src/components/CallHistoryModal.jsx`

## Testing
- ✅ Call buttons now navigate to the correct call URL.
- ✅ Call history button opens the modal.
- ✅ History loads correctly from the database.
- ✅ Transcripts and summaries are displayed when available.
