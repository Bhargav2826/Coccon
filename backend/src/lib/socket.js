import { Server } from "socket.io";
import http from "http";
import express from "express";
import { createClient, LiveTranscriptionEvents } from "@deepgram/sdk";
import Call from "../models/Call.js";
import User from "../models/User.js";

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

io.on("connection", (socket) => {
    // console.log("A user connected", socket.id);

    const userId = socket.handshake.query.userId;
    if (userId) userSocketMap[userId] = socket.id;

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
            await Call.updateMany(
                { roomId: data.callId, status: 'ongoing' },
                { status: 'ended', endedAt: new Date() }
            );

            // Fetch receiver name
            let receiverName = "Unknown";
            const receiver = await User.findById(data.recipientId);
            if (receiver) receiverName = receiver.fullName;

            await Call.create({
                roomId: data.callId,
                participants: [data.callerInfo.id, data.recipientId],
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
        } catch (err) {
            console.error("Error creating call record:", err);
        }

        if (receiverSocketId) {
            io.to(receiverSocketId).emit("call:incoming", data);
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

    // --- Transcription Streaming ---
    socket.on("join-call-room", async (data) => {
        console.log("!!! SOCKET EVENT: join-call-room received !!!");
        console.log("- Call ID:", data.callId);
        console.log("- User ID:", userId);
        console.log("- Mimetype:", data.mimetype);

        socket.activeCallId = data.callId;

        if (!transcriptionServices[socket.id]) {
            try {
                console.log("📡 Opening Deepgram connection for", socket.id);

                const connection = deepgram.listen.live({
                    model: "nova-2",
                    smart_format: true,
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
                    }

                    if (transcript && dgData.is_final && transcript.trim().length > 0) {
                        console.log(`💾 Attempting to save transcript for Call: ${socket.activeCallId}`);
                        try {
                            if (socket.activeCallId && userId) {
                                // Try to find the ongoing call first
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

                                // Fallback: if no ongoing call, try to append to the most recent call for this room
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
                                    }
                                }

                                if (updatedCall) {
                                    console.log(`✅ DB SAVED [${socket.activeCallId}] [${userId}]: "${transcript.substring(0, 30)}..." (Status: ${updatedCall.status})`);
                                } else {
                                    console.error(`❌ DB ERROR: No call record found whatsoever for roomId: ${socket.activeCallId}. Transcript lost.`);
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
            // Log every 50th chunk to verify flow without spamming (Commented out for production)
            // if (!socket.chunkCount) socket.chunkCount = 0;
            // socket.chunkCount++;
            // if (socket.chunkCount % 50 === 0 || socket.chunkCount === 1) {
            //      console.log(`🎤 Audio chunks received from ${socket.id} (Count: ${socket.chunkCount})`);
            // }

            service.send(data);
        } else {
            if (!socket.warnedDeepgram) {
                // console.warn(`⚠️ Received audio but Deepgram service not ready for ${socket.id}`);
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

        // If user was in a call, mark it as ended
        if (socket.activeCallId) {
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
