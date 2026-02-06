import { Server } from "socket.io";
import http from "http";
import express from "express";
import { createClient, LiveTranscriptionEvents } from "@deepgram/sdk";
import axios from "axios";
import Call from "../models/Call.js";
import User from "../models/User.js";
import Room from "../models/Room.js";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: [
            "http://localhost:5173",
            "https://cocoon-t68f.onrender.com"
        ],
        methods: ["GET", "POST"]
    },
});

const userSocketMap = {}; // {userId: socketId}
const transcriptionServices = {}; // {socketId: deepgramConnection}

export const getReceiverSocketId = (receiverId) => {
    return userSocketMap[receiverId];
};

const deepgramApiKey = process.env.DEEPGRAM_API_KEY;
if (!deepgramApiKey) {
    console.error("❌ CRITICAL: DEEPGRAM_API_KEY is missing in .env");
} else {
    // console.log("✅ Deepgram API Key loaded (starts with " + deepgramApiKey.substring(0, 4) + "...)");
}

const deepgram = createClient(deepgramApiKey);

io.on("connection", async (socket) => {
    // console.log("A user connected", socket.id);

    const userId = socket.handshake.query.userId;
    if (userId) {
        userSocketMap[userId] = socket.id;

        // Check if this student has any ongoing classroom calls to join
        try {
            const studentRooms = await Room.find({ members: userId });
            for (const room of studentRooms) {
                const activeCall = await Call.findOne({
                    roomId: { $regex: `^faculty-${room._id}-` },
                    status: 'ongoing'
                });

                if (activeCall) {
                    const faculty = await User.findById(room.faculty);
                    socket.emit("call:incoming", {
                        recipientId: userId,
                        callId: activeCall.roomId,
                        type: activeCall.type || "video",
                        callerInfo: {
                            id: faculty?._id,
                            name: faculty?.fullName,
                            profilePic: faculty?.profilePic
                        },
                        isClassroomCall: true,
                        roomName: room.roomName
                    });
                }
            }
        } catch (err) {
            console.error("Error checking for active calls on connection:", err);
        }
    }

    // Used to store active users (optional)
    io.emit("getOnlineUsers", Object.keys(userSocketMap));

    // Debug Ping
    socket.on("ping-test", () => {
        console.log("🏓 Ping received from", socket.id);
        socket.emit("pong-test");
    });

    // --- Call Signaling Events ---
    socket.on("call:start", async (data) => {
        // data: { recipientId, callId, type, callerInfo }
        const receiverSocketId = getReceiverSocketId(data.recipientId);

        // Create Call record in DB
        try {
            // First, mark any existing 'ongoing' calls for this room as ended 
            // (in case a previous session didn't close properly)
            // But only if it's NOT the same call we are starting
            await Call.updateMany(
                { roomId: { $ne: data.callId }, status: 'ongoing' }, // This might be too broad, maybe scope to participants
                { status: 'ended', endedAt: new Date() }
            );

            // Check if call record already exists (e.g. created by controller)
            const existingCall = await Call.findOne({ roomId: data.callId });

            if (!existingCall) {
                // Fetch receiver name
                let receiverName = data.recipientId === null ? "Room Members" : "Unknown";
                if (data.recipientId) {
                    const receiver = await User.findById(data.recipientId);
                    if (receiver) receiverName = receiver.fullName;
                }

                const participants = [data.callerInfo.id];
                if (data.recipientId) participants.push(data.recipientId);

                await Call.create({
                    roomId: data.callId,
                    participants: participants,
                    callerName: data.callerInfo.name,
                    receiverName: receiverName,
                    type: data.type || "video",
                    status: 'ongoing',
                    startedAt: new Date(),
                    summary: "",
                    safetyAlert: {
                        type: "safe",
                        message: ""
                    },
                    sentiment: "neutral",
                    specificIssues: [],
                    transcripts: []
                });
                console.log("📝 New separate Call record created:", data.callId);
            } else {
                console.log("📝 Call record already exists, skipping creation:", data.callId);
            }
        } catch (err) {
            console.error("Error creating call record:", err);
        }

        if (receiverSocketId) {
            io.to(receiverSocketId).emit("call:incoming", data);
        } else if (data.recipientId === null && data.callId.startsWith('faculty-')) {
            console.log(`🏫 Classroom call started: ${data.callId}`);
        } else {
            console.log(`User ${data.recipientId} is offline or not connected.`);
        }
    });

    socket.on("call:rejected", (data) => {
        const callerSocketId = getReceiverSocketId(data.callerId);
        if (callerSocketId) {
            io.to(callerSocketId).emit("call:rejected");
        }
    });

    // --- Interactive Whiteboard Events ---
    socket.on("whiteboard:draw", (data) => {
        // data: { callId, x0, y0, x1, y1, color, lineWidth }
        if (data.callId) {
            socket.to(data.callId).emit("whiteboard:draw", data);
        }
    });

    socket.on("whiteboard:clear", (data) => {
        if (data.callId) {
            socket.to(data.callId).emit("whiteboard:clear");
        }
    });

    // --- In-Call Quiz Events ---
    socket.on("quiz:start", (data) => {
        // data: { callId, question, options, id }
        if (data.callId) {
            socket.to(data.callId).emit("quiz:start", data);
        }
    });

    socket.on("quiz:answer", (data) => {
        // data: { callId, quizId, answer, userId, userName }
        if (data.callId) {
            socket.to(data.callId).emit("quiz:answer", data);
        }
    });

    // --- Transcription Streaming ---
    socket.on("join-call-room", async (data) => {
        console.log("!!! SOCKET EVENT: join-call-room received !!!");
        console.log("- Call ID:", data.callId);
        console.log("- User ID:", userId);
        console.log("- Mimetype:", data.mimetype);

        socket.activeCallId = data.callId;
        socket.join(data.callId); // Join the socket room for this call session

        // Add joiner to participants list if they aren't already there
        if (userId && data.callId) {
            try {
                await Call.findOneAndUpdate(
                    { roomId: data.callId, status: 'ongoing' },
                    { $addToSet: { participants: userId } }
                );
            } catch (err) {
                console.error("Error adding participant on join:", err);
            }
        }

        if (!transcriptionServices[socket.id]) {
            try {
                console.log("📡 Opening Deepgram connection for", socket.id);

                const connection = deepgram.listen.live({
                    model: "nova-2",
                    smart_format: true,
                    diarize: true, // Enable diarization for better accuracy, even though we use per-socket streams
                    // language: "en-US", // Default is English, can be customized
                    interim_results: false, // Only get final transcripts to reduce DB writes
                });

                connection.on(LiveTranscriptionEvents.Open, () => {
                    console.log("✅ Deepgram Connection OPEN for", socket.id);
                    socket.emit("transcription-active");
                });

                // Add a backup listener for 'open' if constant doesn't work
                connection.on('open', () => {
                    console.log("✅ Deepgram Connection OPEN (fallback event) for", socket.id);
                    socket.emit("transcription-active");
                });

                connection.on(LiveTranscriptionEvents.Transcript, async (dgData) => {
                    const transcript = dgData.channel.alternatives[0].transcript;

                    if (transcript && transcript.trim().length > 0) {
                        console.log(`🔍 Received from Deepgram (final:${dgData.is_final}): "${transcript}"`);

                        // Emit real-time transcript for basic subtitles even before translation
                        if (socket.activeCallId) {
                            io.to(socket.activeCallId).emit("call:subtitle", {
                                userId,
                                text: transcript,
                                isFinal: dgData.is_final
                            });
                        }
                    }

                    if (transcript && dgData.is_final && transcript.trim().length > 0) {
                        // Translation Logic for Classroom Calls
                        if (socket.activeCallId && socket.activeCallId.startsWith('faculty-') && process.env.SARVAM_API_KEY) {
                            try {
                                const translationPrompt = {
                                    model: "sarvam-m",
                                    messages: [
                                        {
                                            role: "system",
                                            content: "Translate the following classroom transcript from English to Gujarati. Provide ONLY the translated text in one line. If it's already in Gujarati, translate to English."
                                        },
                                        {
                                            role: "user",
                                            content: transcript
                                        }
                                    ],
                                    temperature: 0.1
                                };

                                const sarvamRes = await axios.post(
                                    "https://api.sarvam.ai/v1/chat/completions",
                                    translationPrompt,
                                    {
                                        headers: {
                                            "api-subscription-key": process.env.SARVAM_API_KEY,
                                            "Content-Type": "application/json"
                                        },
                                        timeout: 5000
                                    }
                                );

                                const translatedText = sarvamRes.data?.choices[0]?.message?.content;
                                if (translatedText) {
                                    console.log(`🌐 Translated: "${translatedText}"`);
                                    io.to(socket.activeCallId).emit("call:subtitle", {
                                        userId,
                                        text: transcript,
                                        translatedText: translatedText,
                                        isFinal: true
                                    });
                                }
                            } catch (transErr) {
                                console.error("❌ Translation Failed:", transErr.message);
                            }
                        }

                        if (!userId) {
                            console.error(`❌ CRITICAL: Missing userId for socket ${socket.id}. Cannot attribute transcript.`);
                            return;
                        }
                        console.log(`💾 Attempting to save transcript for Call: ${socket.activeCallId} from User: ${userId}`);
                        try {
                            if (socket.activeCallId) {
                                // STRATEGY 1: Try to find the ongoing call first
                                let updatedCall = await Call.findOneAndUpdate(
                                    { roomId: socket.activeCallId, status: 'ongoing' },
                                    {
                                        $push: {
                                            transcripts: {
                                                sender: userId,
                                                text: transcript,
                                                timestamp: new Date()
                                            }
                                        },
                                        $addToSet: { participants: userId }
                                    },
                                    { new: true }
                                );

                                // STRATEGY 2: Fallback - if no ongoing call, try to append to the most recent call for this room
                                if (!updatedCall) {
                                    console.warn(`⚠️ No 'ongoing' call for ${socket.activeCallId}, trying fallback to latest record...`);
                                    const latestCall = await Call.findOne({ roomId: socket.activeCallId }).sort({ createdAt: -1 });
                                    if (latestCall) {
                                        updatedCall = await Call.findByIdAndUpdate(
                                            latestCall._id,
                                            {
                                                $push: {
                                                    transcripts: {
                                                        sender: userId,
                                                        text: transcript,
                                                        timestamp: new Date()
                                                    }
                                                },
                                                $addToSet: { participants: userId }
                                            },
                                            { new: true }
                                        );
                                        console.log(`✅ Appended to latest call record (ID: ${latestCall._id})`);
                                    }
                                }

                                // STRATEGY 3: Last resort - create a new call record if none exists
                                if (!updatedCall) {
                                    console.warn(`⚠️ No call record found at all for ${socket.activeCallId}. Creating emergency backup record...`);
                                    try {
                                        const newCall = await Call.create({
                                            roomId: socket.activeCallId,
                                            participants: [userId],
                                            callerName: "Unknown",
                                            receiverName: "Unknown",
                                            type: "video",
                                            status: 'ongoing',
                                            startedAt: new Date(),
                                            transcripts: [{
                                                sender: userId,
                                                text: transcript,
                                                timestamp: new Date()
                                            }],
                                            summary: "",
                                            safetyAlert: { type: "safe", message: "" },
                                            sentiment: "neutral",
                                            specificIssues: []
                                        });
                                        console.log(`🆘 Emergency call record created (ID: ${newCall._id})`);
                                        updatedCall = newCall;
                                    } catch (createErr) {
                                        console.error(`❌ Failed to create emergency call record:`, createErr);
                                    }
                                }

                                if (updatedCall) {
                                    console.log(`✅ DB SAVED [${socket.activeCallId}] [${userId}]: "${transcript.substring(0, 30)}..." (Status: ${updatedCall.status}, Total transcripts: ${updatedCall.transcripts.length})`);
                                } else {
                                    console.error(`❌ CRITICAL: All fallback strategies failed. Transcript LOST: "${transcript}"`);
                                }

                            } else {
                                console.warn(`⚠️ SKIPPING SAVE: callId=${socket.activeCallId}, userId=${userId}`);
                            }
                        } catch (err) {
                            console.error("❌ DB EXCEPTION during save:", err);
                        }
                    }
                });

                connection.on(LiveTranscriptionEvents.Close, () => {
                    console.log("🌚 Deepgram Connection CLOSED for", socket.id);
                    delete transcriptionServices[socket.id];
                });

                connection.on('close', () => {
                    console.log("🌚 Deepgram Connection CLOSED (fallback) for", socket.id);
                    delete transcriptionServices[socket.id];
                });

                connection.on(LiveTranscriptionEvents.Error, (err) => {
                    console.error("❌ Deepgram Error:", err);
                });

                transcriptionServices[socket.id] = connection;
                console.log("✨ Transcription service ACTIVE for socket", socket.id);

            } catch (err) {
                console.error("❌ Failed to setup Deepgram:", err);
            }
        } else {
            console.log(`ℹ️ Socket ${socket.id} already has active transcription service.`);
            socket.emit("transcription-active");
        }
    });

    socket.on("audio-stream", (data) => {
        // data: raw audio buffer
        const service = transcriptionServices[socket.id];
        if (service && service.getReadyState() === 1) { // 1 = OPEN
            service.send(data);
        } else {
            if (!socket.warnedDeepgram) {
                socket.warnedDeepgram = true;
            }
        }
    });

    socket.on("call:ended", async (data) => {
        // data: { callId }
        // End the call record
        try {
            await Call.findOneAndUpdate(
                { roomId: data.callId, status: 'ongoing' },
                { status: 'ended', endedAt: new Date() }
            );
            console.log("🏁 Call marked as ended:", data.callId);

            // Clean up deepgram
            const service = transcriptionServices[socket.id];
            if (service) {
                service.finish();
                delete transcriptionServices[socket.id];
            }
        } catch (err) {
            console.error("Error ending call:", err);
        }
    });

    socket.on("disconnect", async () => {
        console.log("A user disconnected", socket.id);

        // If user was in a call, mark it as ended ONLY if it's NOT a classroom call
        // Classroom calls should only be ended explicitly
        if (socket.activeCallId && !socket.activeCallId.startsWith('faculty-')) {
            try {
                await Call.findOneAndUpdate(
                    { roomId: socket.activeCallId, status: 'ongoing' },
                    { status: 'ended', endedAt: new Date() }
                );
                console.log("🏁 Call auto-ended on disconnect:", socket.activeCallId);
            } catch (err) {
                console.error("Error auto-ending call:", err);
            }
        }

        if (userId) delete userSocketMap[userId];

        // Cleanup Deepgram
        const service = transcriptionServices[socket.id];
        if (service) {
            service.finish();
            delete transcriptionServices[socket.id];
        }

        io.emit("getOnlineUsers", Object.keys(userSocketMap));
    });
});

export { io, app, server };
