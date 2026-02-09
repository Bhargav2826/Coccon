import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import OpenAI from "openai";
import dotenv from "dotenv";
import { Readable } from "stream";

dotenv.config();

const ELEVENLABS_API_KEY = "sk_d8abc633369001d7818136b66ac74a56ea8296ee7f4a3c96";
const OPENAI_API_KEY = "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";

const elevenlabs = new ElevenLabsClient({
    apiKey: ELEVENLABS_API_KEY,
});

const openai = new OpenAI({
    apiKey: OPENAI_API_KEY,
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

        // 1. TRANSLATE
        let translatedText = text;
        if (targetLanguage !== "English") {
            try {
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
                console.log(`🌐 Translation Success: "${translatedText}"`);
            } catch (openAiErr) {
                console.error("❌ OpenAI Error:", openAiErr.message);
                return res.status(500).json({ error: "Translation failed", detail: openAiErr.message });
            }
        }

        const voiceId = VOICE_MAPPING[targetLanguage] || "pNInz6obpgDQGcFmaJgB";

        try {
            console.log(`🎙️ ElevenLabs: Using Voice ${voiceId}`);

            const audioStream = await elevenlabs.textToSpeech.convert(voiceId, {
                text: translatedText,
                model_id: "eleven_multilingual_v2", // More stable for multilingual
                output_format: "mp3_44100_128",
            });

            res.setHeader("Content-Type", "audio/mpeg");
            res.setHeader("Transfer-Encoding", "chunked");

            // Convert Web Stream or Async Iterable to Node Stream and pipe
            Readable.from(audioStream).pipe(res);

            console.log("✅ TTS Audio Stream Sent Successfully");

        } catch (elevenLabsErr) {
            console.error("❌ ElevenLabs SDK Error:", elevenLabsErr.message);
            // Return JSON even on stream error
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
