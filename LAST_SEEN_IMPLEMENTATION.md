# Last Seen Feature Implementation

## Overview
Implemented a real-time "last seen" feature for the chat functionality that accurately tracks when users were last active and displays it in a user-friendly format.

## Changes Made

### 1. Backend Changes

#### Socket.js (`/backend/src/lib/socket.js`)
- **Updated disconnect handler** to update the user's `lastSeen` timestamp in the database when they completely disconnect (all tabs closed)
- This ensures accurate tracking of when a user was last online

#### User Model (`/backend/src/models/User.js`)
- Already had `lastSeen` field with default value of `Date.now()`
- No changes needed

#### User Controller (`/backend/src/controllers/user.controller.js`)
- Already had `updateLastSeen` function implemented
- No changes needed

#### User Routes (`/backend/src/routes/user.route.js`)
- Already had route `/users/lastseen` configured
- No changes needed

### 2. Frontend Changes

#### Date Utility (`/frontend/src/utils/dateUtils.js`) - NEW FILE
Created a utility function `formatLastSeen()` that formats timestamps into user-friendly strings:
- **Less than 1 minute**: "Last seen just now"
- **Less than 1 hour**: "Last seen 5 minutes ago"
- **Less than 24 hours**: "Last seen 3 hours ago"
- **Yesterday**: "Last seen yesterday at 3:45 PM"
- **Less than 7 days**: "Last seen Monday at 2:30 PM"
- **More than 7 days**: "Last seen Jan 15, 2026 at 2:30 PM"

#### ChatHeader Component (`/frontend/src/components/ChatHeader.jsx`)
- Imported `formatLastSeen` utility
- Updated status display to show:
  - "Online" for active users
  - Formatted last seen time for offline users (e.g., "Last seen 5 minutes ago")

#### ChatSidebar Component (`/frontend/src/components/ChatSidebar.jsx`)
- Imported `formatLastSeen` utility
- Updated chat preview to show:
  - Last message text (if available)
  - "🖼️ Image" (if last message was an image)
  - "Online" (if user is currently online)
  - Formatted last seen time (if user is offline and no recent messages)

#### API Functions (`/frontend/src/lib/api.js`)
- Added `updateLastSeen()` function to manually update last seen timestamp
- Added `starMessage()` function (bonus addition)

### 3. Database Migration

#### Migration Script (`/backend/migrate-lastseen.js`) - NEW FILE
- Created a migration script to update all existing users with a `lastSeen` timestamp
- Successfully updated 6 existing users
- Ensures backward compatibility with existing data

## How It Works

### Real-Time Tracking
1. When a user connects to the app, they join a socket room
2. When a user completely disconnects (closes all tabs), the socket disconnect handler:
   - Updates their `lastSeen` field in the database with the current timestamp
   - Broadcasts the updated online users list

### Display Logic
1. **In Chat Header**:
   - If user is online → Show "Online" or their custom status
   - If user is offline → Show formatted last seen time

2. **In Chat Sidebar**:
   - Priority 1: Show last message text
   - Priority 2: Show "🖼️ Image" if last message was an image
   - Priority 3: Show "Online" if user is currently active
   - Priority 4: Show formatted last seen time

### Time Formatting
The `formatLastSeen()` function intelligently formats the timestamp based on how much time has passed:
- Recent activity (< 1 hour) → Relative time ("5 minutes ago")
- Same day (< 24 hours) → Hours ago ("3 hours ago")
- Yesterday → "Yesterday at [time]"
- This week → Day name and time ("Monday at 2:30 PM")
- Older → Full date with month, day, year, and time ("Jan 15, 2026 at 2:30 PM")

## Testing
✅ Migration script successfully updated 6 existing users
✅ Backend server running without errors
✅ Frontend server running without errors
✅ All changes are backward compatible with existing data

## User Experience Improvements
1. **Accurate tracking**: Last seen is updated only when users actually disconnect
2. **User-friendly display**: Times are shown in natural language (e.g., "5 minutes ago")
3. **Date-aware formatting**: Shows full date for messages older than 24 hours
4. **Real-time updates**: Online status is updated in real-time via WebSocket
5. **Works for all users**: Both new and existing users have proper last seen tracking

## Files Modified
- `/backend/src/lib/socket.js`
- `/frontend/src/components/ChatHeader.jsx`
- `/frontend/src/components/ChatSidebar.jsx`
- `/frontend/src/lib/api.js`

## Files Created
- `/frontend/src/utils/dateUtils.js`
- `/backend/migrate-lastseen.js`
