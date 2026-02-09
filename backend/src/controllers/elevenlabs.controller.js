import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import axios from "axios";
import dotenv from "dotenv";
import { Readable } from "stream";

dotenv.config();

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const SARVAM_API_KEY = process.env.SARVAM_API_KEY;

const elevenlabs = new ElevenLabsClient({
    apiKey: ELEVENLABS_API_KEY,
});

// Voice mapping for popular Indian languages
const VOICE_MAPPING = {
    "Hindi": "pNInz6obpgDQGcFmaJgB",
    "Marathi": "pNInz6obpgDQGcFmaJgB",
    "Gujarati": "pNInz6obpgDQGcFmaJgB",
    "Tamil": "pNInz6obpgDQGcFmaJgB",
    "Telugu": "pNInz6obpgDQGcFmaJgB",
    "Kannada": "pNInz6obpgDQGcFmaJgB",
    "Bengali": "pNInz6obpgDQGcFmaJgB",
    "Malayalam": "pNInz6obpgDQGcFmaJgB",
    "Punjabi": "pNInz6obpgDQGcFmaJgB",
    "English": "pNInz6obpgDQGcFmaJgB"
};

export const generateTTS = async (req, res) => {
    try {
        const { text, targetLanguage } = req.body;

        if (!text) {
            return res.status(400).json({ error: "Text is required" });
        }

        console.log(`🚀 TTS Pipeline Started: "${text.substring(0, 30)}..." in ${targetLanguage}`);

        // 1. TRANSLATION (Sarvam AI)
        let translatedText = text;
        if (targetLanguage !== "English") {
            try {
                const translationResponse = await axios.post(
                    "https://api.sarvam.ai/v1/chat/completions",
                    {
                        model: "sarvam-m",
                        messages: [
                            {
                                role: "system",
                                content: `Translate text to ${targetLanguage}. ONLY return translated text.`
                            },
                            { role: "user", content: text }
                        ],
                        temperature: 0.1
                    },
                    {
                        headers: {
                            "api-subscription-key": SARVAM_API_KEY,
                            "Content-Type": "application/json"
                        }
                    }
                );
                translatedText = translationResponse.data.choices[0].message.content;
                console.log(`🌐 Translation Success: "${translatedText}"`);
            } catch (transErr) {
                console.warn("⚠️ Translation failed, using original text:", transErr.message);
            }
        }

        // 2. SPEECH GENERATION (ElevenLabs with Sarvam fallback)
        const voiceId = VOICE_MAPPING[targetLanguage] || "pNInz6obpgDQGcFmaJgB";

        try {
            console.log(`🎙️ Attempting ElevenLabs TTS...`);
            const audioStream = await elevenlabs.textToSpeech.convert(voiceId, {
                text: translatedText,
                model_id: "eleven_turbo_v2_5",
                output_format: "mp3_44100_128",
            });

            res.setHeader("Content-Type", "audio/mpeg");
            return Readable.from(audioStream).pipe(res);

        } catch (elevenErr) {
            console.error("❌ ElevenLabs Failed:", elevenErr.message);

            // AUTOMATIC RESILIENT FALLBACK: Use Sarvam TTS if ElevenLabs fails (e.g. 401 permissions)
            if (SARVAM_API_KEY) {
                console.log("♻️ Falling back to Sarvam TTS for continuity...");
                try {
                    const sarvamTTSRes = await axios.post(
                        "https://api.sarvam.ai/v1/text-to-speech",
                        {
                            inputs: [translatedText],
                            target_language_code: "hi-IN", // Default to Hindi if language mapping is complex
                            speaker: "meera",
                            speech_sample_rate: 16000,
                            enable_preprocessing: true,
                            model: "bulbul:v1"
                        },
                        {
                            headers: {
                                "api-subscription-key": SARVAM_API_KEY,
                                "Content-Type": "application/json"
                            }
                        }
                    );

                    if (sarvamTTSRes.data.audios && sarvamTTSRes.data.audios[0]) {
                        const audioBuffer = Buffer.from(sarvamTTSRes.data.audios[0], 'base64');
                        res.setHeader("Content-Type", "audio/wav");
                        return res.send(audioBuffer);
                    }
                } catch (sarvamTTSErr) {
                    console.error("❌ Sarvam TTS Fallback also failed:", sarvamTTSErr.message);
                }
            }

            return res.status(500).json({ error: "Speech generation failed", detail: elevenErr.message });
        }

    } catch (error) {
        console.error("❌ Final TTS Failure:", error);
        res.status(500).json({ error: "Internal Server Error", detail: error.message });
    }
};
