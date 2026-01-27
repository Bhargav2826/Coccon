
import { AccessToken } from "livekit-server-sdk";

export async function getLiveKitToken(req, res) {
    try {
        const { roomName, username } = req.body;

        if (!roomName || !username) {
            return res.status(400).json({ error: "Missing required params" });
        }

        const apiKey = process.env.LIVEKIT_API_KEY;
        const apiSecret = process.env.LIVEKIT_API_SECRET;
        const wsUrl = process.env.LIVEKIT_URL;

        if (!apiKey || !apiSecret || !wsUrl) {
            return res.status(500).json({ error: "Server misconfigured" });
        }

        const at = new AccessToken(apiKey, apiSecret, { identity: username });
        at.addGrant({ roomJoin: true, room: roomName });

        const token = await at.toJwt();

        res.json({ token, url: wsUrl });
    } catch (error) {
        console.error("Error generating LiveKit token:", error);
        res.status(500).json({ error: "Failed to generate token" });
    }
}
