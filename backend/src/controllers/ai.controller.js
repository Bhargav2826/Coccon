import User from "../models/User.js";
import { createClient } from "@deepgram/sdk";
import axios from "axios";
import Call from "../models/Call.js";
import ChatMessage from "../models/ChatMessage.js";

export async function getChildCalls(req, res) {
  try {
    const { childUid } = req.params;
    const { type } = req.query; // optional: audio/video
    const parentId = req.user._id;

    // Verify parent-child relationship
    const parent = await User.findById(parentId).select("children");
    if (!parent || !parent.children.includes(childUid)) {
      return res.status(403).json({ message: "Unauthorized access to child data" });
    }

    const query = { participants: childUid };
    if (type) query.type = type;

    const calls = await Call.find(query)
      .sort({ startedAt: -1 })
      .limit(50)
      .populate("transcripts.sender", "fullName role");

    res.status(200).json(calls);
  } catch (error) {
    console.error("Error in getChildCalls:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function getCallHistory(req, res) {
  try {
    const { childUid, targetUid } = req.params;
    const parentId = req.user._id;

    // Verify parent-child relationship
    const parent = await User.findById(parentId).select("children");
    if (!parent || !parent.children.includes(childUid)) {
      return res.status(403).json({ message: "Unauthorized access to child data" });
    }

    const { type, limit, sort, startDate, endDate } = req.query;
    const query = {
      participants: { $all: [childUid, targetUid] }
    };
    if (type) query.type = type;

    // Date range filtering
    if (startDate || endDate) {
      query.startedAt = {};
      if (startDate) query.startedAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.startedAt.$lte = end;
      }
    }

    const limitVal = parseInt(limit) || 20;
    const sortVal = sort === 'asc' ? 1 : -1;

    const calls = await Call.find(query)
      .sort({ startedAt: sortVal })
      .limit(limitVal)
      .populate("transcripts.sender", "fullName role");

    // Add detailed call metadata to each call
    const callsWithMetadata = await Promise.all(calls.map(async (call) => {
      const callObj = call.toObject();

      // Determine if this is a classroom call
      const isClassroomCall = call.roomId?.startsWith('faculty-') || call.receiverName === "Room Members";

      let callLabel = "";
      const Room = (await import("../models/Room.js")).default;

      if (isClassroomCall) {
        // Try to extract Room ID from faculty-ROOMID-timestamp
        const parts = call.roomId.split('-');
        if (parts.length >= 2 && parts[0] === 'faculty') {
          const roomId = parts[1];
          try {
            const room = await Room.findById(roomId).select("roomName");
            if (room) {
              callLabel = `CLASSROOM: ${room.roomName}`;
            } else {
              callLabel = "CLASSROOM CALL";
            }
          } catch (e) {
            callLabel = "CLASSROOM CALL";
          }
        } else {
          callLabel = "CLASSROOM CALL";
        }
      } else {
        // Get participant details to determine roles
        const participants = await User.find({ _id: { $in: call.participants } }).select("fullName role");

        if (participants.length >= 2) {
          const caller = participants.find(p => p._id.toString() === call.participants[0]?.toString());
          const receiver = participants.find(p => p._id.toString() === call.participants[1]?.toString());

          if (caller && receiver) {
            const callerRole = caller.role === 'faculty' ? 'FACULTY' : 'STUDENT';
            const receiverRole = receiver.role === 'faculty' ? 'FACULTY' : 'STUDENT';
            callLabel = `${callerRole}: ${caller.fullName} → ${receiverRole}: ${receiver.fullName}`;
          }
        }
      }

      return {
        ...callObj,
        callLabel: callLabel || "Call",
        category: isClassroomCall ? "Classroom Call" : "Direct Call"
      };
    }));

    res.status(200).json(callsWithMetadata);
  } catch (error) {
    console.error("Error in getCallHistory:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function analyzeCall(req, res) {
  try {
    const { childUid, targetUid, callId } = req.body;
    const parentId = req.user._id;

    console.log('🔍 AI Call Analysis Request:', { childUid, targetUid, callId, parentId: parentId.toString() });

    // 1. Verify parent-child relationship
    const parent = await User.findById(parentId).select("children");
    if (!parent || !parent.children.includes(childUid)) {
      return res.status(403).json({ message: "Unauthorized access to child data" });
    }

    const child = await User.findById(childUid);
    const targetUser = await User.findById(targetUid);
    if (!child || !targetUser) return res.status(404).json({ message: "User not found" });

    let calls = [];
    if (callId) {
      // Analyze one specific call
      const specificCall = await Call.findById(callId).populate("transcripts.sender", "fullName role");
      if (specificCall) calls = [specificCall];
    } else {
      // Fallback to recent calls logic if no specific callId
      const query = { participants: { $all: [childUid, targetUid] } };
      const { callType } = req.body;
      if (callType) query.type = callType;

      calls = await Call.find(query)
        .sort({ startedAt: -1 })
        .limit(5)
        .populate("transcripts.sender", "fullName role");
    }

    if (!calls || calls.length === 0) {
      return res.status(200).json({
        success: true,
        summary: `No call record found.`,
        alert: { type: "safe", message: "No call records found." }
      });
    }

    // Combine transcripts
    let transcriptToAnalyze = "";
    let hasActualTranscripts = false;

    calls.forEach(call => {
      if (call.transcripts && call.transcripts.length > 0) {
        hasActualTranscripts = true;
        const callDate = new Date(call.startedAt || call.createdAt).toLocaleDateString();
        const callTime = new Date(call.startedAt || call.createdAt).toLocaleTimeString();
        transcriptToAnalyze += `\n--- ${call.type || 'Video'} Call on ${callDate} at ${callTime} ---\n`;

        call.transcripts.forEach(t => {
          transcriptToAnalyze += `${t.sender?.fullName || "Participant"}: ${t.text}\n`;
        });
      }
    });

    if (!hasActualTranscripts) {
      console.log('ℹ️ No meaningful transcripts found after processing', calls.length, 'calls');
      return res.status(200).json({
        success: true,
        summary: "No spoken communication was recorded during this session.",
        alert: { type: "safe", message: "No conversation content available to analyze." }
      });
    }

    // AI Analysis using Sarvam
    let finalSummary = "";
    let safetyAlert = { type: "safe", message: "No immediate concerns." };
    let specificIssues = [];
    let sentiment = "neutral";

    try {
      const sarvamResponse = await axios.post(
        "https://api.sarvam.ai/v1/chat/completions",
        {
          model: "sarvam-m",
          messages: [
            {
              role: "system",
              content: `Detailed child safety analysis for VOICE/VIDEO CALLS.
                  The transcript may contain multiple languages. Provide the FINAL REPORT IN ENGLISH.
                  Analyze the call transcript between ${child.fullName} and ${targetUser.fullName}.
                  
                  Output JSON:
                  {
                    "summary": "...",
                    "specific_issues": ["..."],
                    "safety": { "type": "safe/warning/danger", "message": "..." },
                    "sentiment": "positive/neutral/negative"
                  }`
            },
            {
              role: "user",
              content: transcriptToAnalyze.substring(0, 4000)
            }
          ],
          temperature: 0.3
        },
        {
          headers: { "api-subscription-key": process.env.SARVAM_API_KEY, "Content-Type": "application/json" }
        }
      );

      const rawContent = sarvamResponse.data.choices[0].message.content;
      console.log("Sarvam Call Raw Response:", rawContent);

      let cleanContent = rawContent.replace(/```json\n?|\n?```/g, '').trim();
      const firstBrace = cleanContent.indexOf('{');
      const lastBrace = cleanContent.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1) {
        cleanContent = cleanContent.substring(firstBrace, lastBrace + 1);
      }

      const aiData = JSON.parse(cleanContent);
      finalSummary = aiData.summary;
      safetyAlert = aiData.safety;
      specificIssues = aiData.specific_issues;
      sentiment = aiData.sentiment || "neutral";

      // If it was a single call, save the summary back to the DB
      if (callId && calls[0]) {
        await Call.findByIdAndUpdate(callId, {
          summary: finalSummary,
          safetyAlert: safetyAlert,
          sentiment: sentiment,
          specificIssues: specificIssues
        });
      }

    } catch (err) {
      console.error("Sarvam Call Analysis failed:", err.message);
      finalSummary = "AI analysis failed. Please check transcripts.";
    }

    res.status(200).json({
      success: true,
      summary: finalSummary,
      alert: safetyAlert,
      specific_issues: specificIssues,
      meta: {
        sentiment,
        callCount: calls.length,
        childName: child.fullName,
        targetName: targetUser.fullName
      }
    });

  } catch (error) {
    console.error("Error in analyzeCall:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function getChatHistory(req, res) {
  try {
    const { childUid, targetUid } = req.params;
    const parentId = req.user._id;

    // Verify parent-child relationship
    const parent = await User.findById(parentId).select("children");
    if (!parent || !parent.children.includes(childUid)) {
      return res.status(403).json({ message: "Unauthorized access to child data" });
    }

    const { limit, sort, startDate, endDate } = req.query;
    const query = {
      $or: [
        { sender: childUid, receiver: targetUid },
        { sender: targetUid, receiver: childUid },
      ],
    };

    // Date range filtering
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    const limitVal = parseInt(limit) || 50;
    const sortVal = sort === 'asc' ? 1 : -1;

    const messages = await ChatMessage.find(query)
      .sort({ createdAt: sortVal })
      .limit(limitVal)
      .populate("sender", "fullName role profilePic");

    res.status(200).json(messages);
  } catch (error) {
    console.error("Error in getChatHistory:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function analyzeChat(req, res) {
  try {
    const { childUid, targetUid, date, callId } = req.body;
    const parentId = req.user._id;

    console.log("\n🔍 ===== ANALYZE CHAT REQUEST =====");
    console.log("Parent ID:", parentId);
    console.log("Child UID:", childUid);
    console.log("Target UID:", targetUid);
    console.log("Date:", date);
    console.log("Call ID:", callId);
    console.log("=====================================\n");

    // 1. Verify parent-child relationship
    const parent = await User.findById(parentId).select("children");
    if (!parent || !parent.children.includes(childUid)) {
      return res.status(403).json({ message: "Unauthorized access to child data" });
    }

    const child = await User.findById(childUid);
    const targetUser = await User.findById(targetUid);
    if (!child || !targetUser) return res.status(404).json({ message: "User not found" });

    // Date range filtering for analysis if provided
    let query = {
      $or: [
        { sender: childUid, receiver: targetUid },
        { sender: targetUid, receiver: childUid },
      ],
    };

    if (date) {
      // Ensure UTC boundaries for consistency with aggregation
      const startDate = new Date(date);
      startDate.setUTCHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setUTCHours(23, 59, 59, 999);

      console.log("📅 Date filter applied:");
      console.log("  Start:", startDate.toISOString());
      console.log("  End:", endDate.toISOString());

      query.createdAt = { $gte: startDate, $lte: endDate };
    }

    console.log("🔎 MongoDB Query:", JSON.stringify(query, null, 2));

    // Fetch messages
    let messagesQuery = ChatMessage.find(query).sort({ createdAt: -1 });

    // Only apply limit if no specific date (limit(0) in Mongoose returns no results)
    if (!date) {
      messagesQuery = messagesQuery.limit(100);
    }

    const messages = await messagesQuery.populate("sender", "fullName role");

    console.log(`📊 Found ${messages.length} messages for analysis (date: ${date || 'all'})`);

    if (!messages || messages.length === 0) {
      return res.status(200).json({
        success: true,
        summary: "No chat history found to analyze.",
        alert: { type: "safe", message: "No conversation content available." }
      });
    }

    // Combine messages for analysis
    let chatTranscript = "";
    messages.slice().reverse().forEach(m => {
      const time = new Date(m.createdAt).toLocaleString();
      chatTranscript += `[${time}] ${m.sender?.fullName || "Unknown"}: ${m.text || "[File Attachment]"}\n`;
    });

    console.log(`📝 Prepared transcript: ${chatTranscript.length} characters`);
    console.log(`🤖 Calling Sarvam AI for chat analysis...`);

    // AI Analysis
    let response;
    try {
      response = await axios.post(
        "https://api.sarvam.ai/v1/chat/completions",
        {
          model: "sarvam-m",
          messages: [
            {
              role: "system",
              content: `Detailed child safety analysis for TEXT CHAT.
                  The transcript may contain multiple languages. Provide the FINAL REPORT IN ENGLISH.
                  Analyze the chat between ${child.fullName} and ${targetUser.fullName}.
                  
                  Create a JSON object with the following fields:
                  - summary: A brief summary of the conversation.
                  - specific_issues: An array of strings listing any red flags.
                  - safety: An object with "type" (safe/warning/danger) and "message".
                  - sentiment: One of "positive", "neutral", "negative".

                  Output ONLY the JSON object. Do not include markdown formatting or backticks.`
            },
            {
              role: "user",
              content: chatTranscript.substring(Math.max(0, chatTranscript.length - 4000))
            }
          ],
          temperature: 0.3
        },
        {
          headers: { "api-subscription-key": process.env.SARVAM_API_KEY, "Content-Type": "application/json" }
        }
      ).catch(e => {
        if (e.response) {
          console.error("SARVAM API ERROR:", e.response.status, e.response.data);
        } else {
          console.error("SARVAM API ERROR:", e.message);
        }
        throw e;
      });

      const rawContent = response.data.choices[0].message.content;
      console.log("Sarvam Chat Raw Response:", rawContent); // Log raw response for debugging

      let cleanContent = rawContent.replace(/```json\n?|\n?```/g, '').trim();
      // Sometimes models add extra text before/after JSON
      const firstBrace = cleanContent.indexOf('{');
      const lastBrace = cleanContent.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1) {
        cleanContent = cleanContent.substring(firstBrace, lastBrace + 1);
      }

      const aiData = JSON.parse(cleanContent);

      // Save summary if date is provided
      if (date) {
        const startDate = new Date(date);
        startDate.setUTCHours(0, 0, 0, 0);
        const endDate = new Date(date);
        endDate.setUTCHours(23, 59, 59, 999);

        // Find existing text session or create new
        const existingSession = await Call.findOne({
          participants: { $all: [childUid, targetUid] },
          type: "chat",
          startedAt: { $gte: startDate, $lte: endDate }
        });

        if (existingSession) {
          existingSession.summary = aiData.summary;
          existingSession.safetyAlert = aiData.safety;
          existingSession.sentiment = aiData.sentiment;
          existingSession.specificIssues = aiData.specific_issues;
          await existingSession.save();
        } else {
          // Create new session record
          await Call.create({
            participants: [childUid, targetUid],
            type: "chat",
            startedAt: startDate, // Mark it as start of that day (UTC)
            endedAt: endDate,
            summary: aiData.summary,
            safetyAlert: aiData.safety,
            sentiment: aiData.sentiment,
            specificIssues: aiData.specific_issues,
            callerName: child.fullName, // Arbitrary assignment for chat
            receiverName: targetUser.fullName
          });
        }
      }

      res.status(200).json({
        success: true,
        ...aiData,
        meta: {
          messageCount: messages.length,
          childName: child.fullName,
          targetName: targetUser.fullName
        }
      });
    } catch (err) {
      console.error("❌ Sarvam Chat Analysis failed!");
      console.error("Status:", err.response?.status);
      console.error("Response Data:", JSON.stringify(err.response?.data || {}, null, 2));
      console.error("Error Message:", err.message);
      console.error("Stack Trace:", err.stack);

      // Fallback response if AI fails but we have messages
      if (messages.length > 0) {
        return res.status(200).json({
          success: false,
          summary: "AI Service temporarily unavailable. Please try again later.",
          alert: { type: "warning", message: "AI Analysis could not be completed." },
          specific_issues: [],
          meta: {
            messageCount: messages.length,
            errorDetails: err.response?.data || err.message
          }
        });
      }

      res.status(500).json({ message: "AI Analysis failed.", details: err.response?.data || err.message });
    }

  } catch (error) {
    console.error("Error in analyzeChat:", error);
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
}

export async function getChatSessions(req, res) {
  try {
    const { childUid, targetUid } = req.params;
    const parentId = req.user._id;

    // Verify parent-child relationship
    const parent = await User.findById(parentId).select("children");
    if (!parent || !parent.children.includes(childUid)) {
      return res.status(403).json({ message: "Unauthorized access to child data" });
    }

    const mongoose = (await import("mongoose")).default;
    const childObjectId = new mongoose.Types.ObjectId(childUid);
    const targetObjectId = new mongoose.Types.ObjectId(targetUid);

    // 1. Find all distinct dates with messages
    const activityPipeline = [
      {
        $match: {
          $or: [
            { sender: childObjectId, receiver: targetObjectId },
            { sender: targetObjectId, receiver: childObjectId }
          ]
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
          },
          lastMessageAt: { $max: "$createdAt" },
          messageCount: { $sum: 1 }
        }
      },
      { $sort: { _id: -1 } }
    ];

    const activeDates = await ChatMessage.aggregate(activityPipeline);

    // 2. Find existing Calls with type='chat'
    const existingSessions = await Call.find({
      participants: { $all: [childUid, targetUid] },
      type: "chat"
    });

    // 3. Merge
    const sessions = activeDates.map(dateGroup => {
      const dateStr = dateGroup._id;
      // Check if session exists for this date
      const sessionRecord = existingSessions.find(s => {
        const sDate = new Date(s.startedAt).toISOString().split('T')[0];
        return sDate === dateStr;
      });

      if (sessionRecord) {
        const sObj = sessionRecord.toObject();
        sObj.dateId = dateStr;
        return sObj;
      } else {
        // Create virtual session object
        return {
          _id: `chat-${dateStr}`, // Virtual ID
          virtual: true,
          dateId: dateStr, // Helper for frontend
          startedAt: dateGroup.lastMessageAt, // Use last message time for ordering
          type: "chat",
          status: "ended",
          callLabel: "Daily Chat Log",
          summary: null, // No analysis yet
          messageCount: dateGroup.messageCount
        };
      }
    });

    res.status(200).json(sessions);

  } catch (error) {
    console.error("Error in getChatSessions:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}
