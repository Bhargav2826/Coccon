import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const ELEVENLABS_API_KEY = "sk_d8abc633369001d7818136b66ac74a56ea8296ee7f4a3c96";

const elevenlabs = new ElevenLabsClient({
    apiKey: ELEVENLABS_API_KEY,
});

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// Voice mapping for popular Indian languages
const VOICE_MAPPING = {
    "Hindi": "pNInz6obpgDQGcFmaJgB", // Example: Adam (replace with better Indian voice ID if known)
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

        // 1. TRANSLATE (If target is not English)
        let translatedText = text;
        if (targetLanguage !== "English") {
            const translationResponse = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [
                    {
                        role: "system",
                        content: `Translate the following text to ${targetLanguage}. Return ONLY the translated text, nothing else.`,
                    },
                    { role: "user", content: text },
                ],
                temperature: 0.1,
            });
            translatedText = translationResponse.choices[0].message.content;
            console.log(`🌐 Translated: "${text}" -> "${translatedText}"`);
        }

        const voiceId = VOICE_MAPPING[targetLanguage] || "pNInz6obpgDQGcFmaJgB";

        console.log(`🎙️ Generating TTS for [${targetLanguage}]: "${translatedText.substring(0, 30)}..." using Voice: ${voiceId}`);

        // 2. GENERATE AUDIO
        const audio = await elevenlabs.textToSpeech.convert(voiceId, {
            text: translatedText,
            model_id: "eleven_turbo_v2_5", // Using Turbo v2.5 for lowest latency
            output_format: "mp3_44100_128",
        });

        res.setHeader("Content-Type", "audio/mpeg");
        audio.pipe(res);
    } catch (error) {
        console.error("❌ ElevenLabs TTS Error:", error);
        res.status(500).json({ error: "Failed to generate speech" });
    }
};
