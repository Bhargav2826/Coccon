import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import axios from "axios";
import dotenv from "dotenv";
import { Readable } from "stream";

dotenv.config();

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || "sk_d8abc633369001d7818136b66ac74a56ea8296ee7f4a3c96";
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
};

export const generateTTS = async (req, res) => {
    try {
        const { text, targetLanguage } = req.body;

        if (!text) {
            return res.status(400).json({ error: "Text is required" });
        }

        console.log(`🚀 TTS REQUEST: "${text.substring(0, 30)}..." lang=${targetLanguage}`);

        // 1. TRANSLATE (Using Sarvam as fallback/primary if OpenAI fails)
        let translatedText = text;
        if (targetLanguage !== "English" && targetLanguage !== "English") {
            try {
                console.log(`🌐 Translating to ${targetLanguage} using Sarvam AI...`);
                // Switch to Sarvam for translation to avoid OpenAI key issues
                const translationResponse = await axios.post(
                    "https://api.sarvam.ai/v1/chat/completions",
                    {
                        model: "sarvam-m",
                        messages: [
                            {
                                role: "system",
                                content: `Translate text to ${targetLanguage}. ONLY return translated text. Original: ${text}`
                            },
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
                console.log(`🌐 Translation Success (Sarvam): "${translatedText}"`);
            } catch (sarvamErr) {
                console.error("❌ Sarvam Translation Error:", sarvamErr.message);
                // If Sarvam fails, we'll just use the original text as a last resort
                console.log("⚠️ Falling back to original text for TTS.");
            }
        }

        const voiceId = VOICE_MAPPING[targetLanguage] || "pNInz6obpgDQGcFmaJgB";

        try {
            console.log(`🎙️ ElevenLabs: Using Voice ${voiceId}`);

            const audioStream = await elevenlabs.textToSpeech.convert(voiceId, {
                text: translatedText,
                model_id: "eleven_multilingual_v2",
                output_format: "mp3_44100_128",
            });

            res.setHeader("Content-Type", "audio/mpeg");
            res.setHeader("Transfer-Encoding", "chunked");

            Readable.from(audioStream).pipe(res);

            console.log("✅ TTS Audio Stream Sent Successfully");

        } catch (elevenLabsErr) {
            console.error("❌ ElevenLabs SDK Error:", elevenLabsErr.message);
            if (!res.headersSent) {
                return res.status(500).json({ error: "Speech generation failed", detail: elevenLabsErr.message });
            } else {
                res.end();
            }
        }

    } catch (error) {
        console.error("❌ Fatal Controller Error:", error);
        res.status(500).json({ error: "Internal Server Error", detail: error.message });
    }
};
