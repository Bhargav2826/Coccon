import Message from "../models/Message.js";
import User from "../models/User.js";
import { streamServerClient } from "../lib/stream.js";
import { createClient } from "@deepgram/sdk";
import axios from "axios";
import Call from "../models/Call.js";

export async function analyzeChat(req, res) {
  try {
    const { childUid, targetUid, startDate, endDate } = req.body;
    const parentId = req.user._id;

    console.log('🔍 AI Analysis Request:', {
      childUid,
      targetUid,
      parentId: parentId.toString(),
      startDate,
      endDate
    });

    // 1. Verify parent-child relationship
    const parent = await User.findById(parentId).select("children");
    if (!parent || !parent.children.includes(childUid)) {
      return res.status(403).json({
        message: "You can only analyze conversations of your linked children"
      });
    }

    const child = await User.findById(childUid);
    const targetUser = await User.findById(targetUid);
    if (!child || !targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // 2. Fetch messages from Stream Chat
    const channelId = [childUid.toString(), targetUid.toString()].sort().join("-");
    const channel = streamServerClient.channel("messaging", channelId);

    let messages = [];
    try {
      const queryRes = await channel.query({ state: true, messages: { limit: 300 } });
      let streamMessages = queryRes?.messages || [];

      // Filter by date if provided
      if (startDate || endDate) {
        const start = startDate ? new Date(startDate) : new Date(0);
        const end = endDate ? new Date(endDate) : new Date();
        end.setHours(23, 59, 59, 999);

        streamMessages = streamMessages.filter(m => {
          const createdAt = new Date(m.created_at || m.createdAt);
          return createdAt >= start && createdAt <= end;
        });
      }
      messages = streamMessages;
    } catch (err) {
      console.log("⚠️ Stream query failed, falling back to Mongo:", err.message);
      const query = {
        $or: [
          { sender: childUid, recipient: targetUid },
          { sender: targetUid, recipient: childUid }
        ]
      };

      if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate);
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          query.createdAt.$lte = end;
        }
      }

      messages = await Message.find(query)
        .populate("sender", "fullName role")
        .populate("recipient", "fullName role")
        .sort({ createdAt: 1 }).limit(300);
    }

    if (!messages || messages.length === 0) {
      return res.status(200).json({
        success: true,
        summary: "No recent messages found.",
        alert: { type: "safe", message: "No communication recorded." }
      });
    }

    // 3. Format Transcript
    const transcript = messages
      .filter(m => m.text?.trim() || m.content?.trim())
      .map(m => {
        const senderId = m.user?.id || m.sender?._id || m.sender;
        const senderName = senderId?.toString() === childUid.toString() ? child.fullName : targetUser.fullName;
        return `${senderName}: ${m.text || m.content}`;
      }).join("\n");

    console.log('📝 TRANSCRIPT:', transcript);

    // 4. DEEPGRAM PRIMARY ANALYSIS (Summary, Sentiment, Intents)
    const deepgram = createClient(process.env.DEEPGRAM_API_KEY);
    let deepgramSummary = "";
    let sentiment = "neutral";
    let intentDetected = [];

    try {
      const dgResult = await deepgram.read.analyzeText(
        { text: transcript },
        { summarize: "v2", sentiment: true, intent: true, topics: true }
      );
      const data = dgResult.result || dgResult;
      deepgramSummary = data.results?.summary?.short || data.results?.summary?.text || "";
      sentiment = data.results?.sentiment?.average?.sentiment || "neutral";
      intentDetected = data.results?.intents?.segments?.flatMap(s => s.intents.map(i => i.intent)) || [];
      console.log('✅ Deepgram Analysis Finished');
    } catch (dgErr) {
      console.error("❌ Deepgram Error:", dgErr.message);
    }

    // 5. SARVAM AI ANALYSIS (Summary + Safety Alert)
    let safetyAlert = { type: "safe", message: "No immediate concerns detected based on current communication patterns." };
    let finalSummary = deepgramSummary;
    let specificIssues = [];

    try {
      const sarvamResponse = await axios.post(
        "https://api.sarvam.ai/v1/chat/completions",
        {
          model: "sarvam-m",  // Correct model name from Sarvam docs
          messages: [
            {
              role: "system",
              content: `You are a child safety expert analyzing conversations for parents. 
              Analyze the transcript and provide a DETAILED assessment:
              
              1. **Summary**: Describe what happened in the conversation
              2. **Specific Issues**: List EXACT inappropriate words/phrases used (quote them directly)
              3. **Safety Level**: Classify as safe/warning/danger
              4. **Language Detection**: Identify if profanity is in English, Hindi, or other languages
              
              Output ONLY valid JSON in this exact format:
              {
                "summary": "Detailed description including WHO said WHAT",
                "specific_issues": ["exact quote 1", "exact quote 2"],
                "safety": {
                  "type": "safe"|"warning"|"danger",
                  "message": "Detailed explanation mentioning specific words and their severity"
                }
              }
              
              Be explicit about profanity - parents need to know exactly what was said.
              Focus on: profanity (English/Hindi/regional), cyberbullying, grooming, sharing personal info.`
            },
            {
              role: "user",
              content: `Child Name: ${child.fullName}\nTarget: ${targetUser.fullName} (${targetUser.role})\n\nExisting Summary: ${deepgramSummary}\n\nFull Transcript:\n${transcript}`
            }
          ],
          temperature: 0.3
        },
        {
          headers: {
            "api-subscription-key": process.env.SARVAM_API_KEY,
            "Content-Type": "application/json",
          },
          timeout: 15000
        }
      );

      console.log('📊 Sarvam AI Response:', JSON.stringify(sarvamResponse.data, null, 2));

      const responseContent = sarvamResponse.data.choices[0].message.content;
      const aiData = JSON.parse(responseContent);
      finalSummary = aiData.summary || finalSummary;
      safetyAlert = aiData.safety || safetyAlert;
      specificIssues = aiData.specific_issues || [];
      console.log('✅ Sarvam AI Analysis Finished');

    } catch (sarvamErr) {
      console.warn("⚠️ Sarvam AI Unavailable - Running Advanced Heuristic Fallback");
      console.error("Sarvam Error:", sarvamErr.message);
      if (sarvamErr.response) {
        console.error("Sarvam Response Data:", JSON.stringify(sarvamErr.response.data, null, 2));
        console.error("Sarvam Response Status:", sarvamErr.response.status);
      }

      // FALLBACK HEURISTIC MONITORING
      const lowerTranscript = transcript.toLowerCase();

      // Simplified profanity detection - catches root words and common variations
      const profanityRoots = [
        'fuc', 'fuk', 'fck', 'funk', 'funck',  // catches fuck, fucker, funcker, fucking, etc.
        'bitch', 'btch', 'b1tch',
        'shit', 'sh1t', 'sht',
        'dick', 'd1ck', 'dik',
        'pussy', 'puss', 'pus1',
        'cock', 'cok', 'c0ck',
        'asshole', 'assh', 'a$$',
        'porn', 'p0rn', 'pr0n',
        'whore', 'slut', 'cunt',
        'damn', 'hell', 'bastard'
      ];

      // Level 1: Extreme Danger (Grooming, Violence, Sex, Profanity)
      const dangerKeywords = [
        "sex", "naked", "nude", "kill", "die", "suicide", "drug", "smoke",
        "vagina", "penis", "address", "meet me", "home alone", "don't tell anyone", "our secret",
        "private call", "show me", "send photo", "send pic", "send nudes"
      ];

      // Level 2: Warning (Bullying, Rudeness, Contact Info)
      const warningKeywords = [
        "stupid", "idiot", "dumb", "ugly", "hate you", "shut up", "loser", "jerk", "phone number",
        "snapchat", "instagram", "discord", "where are you", "what are you wearing", "boring",
        "retard", "moron", "pathetic"
      ];

      // Check profanity roots (catches variations)
      const foundProfanity = profanityRoots.filter(root => lowerTranscript.includes(root));

      // Check exact danger keywords
      const foundDangerKeywords = dangerKeywords.filter(word => lowerTranscript.includes(word));

      // Check warning keywords
      const foundWarning = warningKeywords.filter(word => lowerTranscript.includes(word));

      // Combine profanity and danger keywords
      const foundDanger = [...foundProfanity, ...foundDangerKeywords];

      console.log('🚨 DANGER KEYWORDS FOUND:', foundDanger);
      console.log('⚠️ WARNING KEYWORDS FOUND:', foundWarning);
      console.log('📄 Current finalSummary before override:', finalSummary);

      // CRITICAL: Override summary when danger/warning detected (don't rely on Deepgram's generic summary)
      if (foundDanger.length > 0) {
        safetyAlert = {
          type: "danger",
          message: `HIGH RISK: Inappropriate content or predatory patterns detected. Keywords flagged: ${foundDanger.slice(0, 3).join(", ")}.`
        };
        finalSummary = `ALERT: ${child.fullName} used inappropriate language including profanity ("${foundDanger.slice(0, 2).join('", "')}")${targetUser.role === 'faculty' ? ' when communicating with their teacher' : ' in this conversation'}. The conversation also included: "${transcript.split('\n').find(line => foundDanger.some(word => line.toLowerCase().includes(word)))?.substring(0, 100)}..." Immediate parent review is strongly recommended.`;
        console.log('🔴 DANGER SUMMARY GENERATED:', finalSummary);
      } else if (foundWarning.length > 0) {
        safetyAlert = {
          type: "warning",
          message: `CAUTION: Potential cyberbullying or sharing of personal social media detected. Flags: ${foundWarning.slice(0, 3).join(", ")}.`
        };
        finalSummary = `This chat contains concerning language or behavior patterns. Detected flags: ${foundWarning.slice(0, 3).join(", ")}. While not immediately dangerous, parent attention is recommended.`;
      } else if (!finalSummary) {
        // Only use generic fallbacks if no summary exists AND no flags detected
        if (transcript.includes("http") || transcript.includes("call")) {
          finalSummary = `${child.fullName} and ${targetUser.fullName} discussed sharing links or joining a video session.`;
        } else {
          finalSummary = `${child.fullName} and ${targetUser.fullName} exchanged a brief text-based conversation.`;
        }
      }
    }

    res.status(200).json({
      success: true,
      summary: finalSummary || "Summary unavailable.",
      alert: safetyAlert,
      specific_issues: specificIssues,  // List of exact inappropriate phrases
      meta: {
        sentiment,
        intents: [...new Set(intentDetected)],
        messageCount: messages.length,
        childName: child.fullName,
        targetName: targetUser.fullName
      }
    });

  } catch (error) {
    console.error("Critical error in analyzeChat:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

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
      .populate("transcripts.sender", "fullName");

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
      .populate("transcripts.sender", "fullName");

    res.status(200).json(calls);
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
      const specificCall = await Call.findById(callId).populate("transcripts.sender", "fullName");
      if (specificCall) calls = [specificCall];
    } else {
      // Fallback to recent calls logic if no specific callId
      const query = { participants: { $all: [childUid, targetUid] } };
      const { callType } = req.body;
      if (callType) query.type = callType;

      calls = await Call.find(query)
        .sort({ startedAt: -1 })
        .limit(5)
        .populate("transcripts.sender", "fullName");
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

      const aiData = JSON.parse(sarvamResponse.data.choices[0].message.content);
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
