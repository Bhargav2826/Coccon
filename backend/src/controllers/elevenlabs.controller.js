import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import OpenAI from "openai";
import dotenv from "dotenv";

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

        console.log(`🚀 Starting TTS Process for: "${text.substring(0, 30)}..." in ${targetLanguage}`);

        // 1. TRANSLATE (If target is not English)
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
                console.log(`🌐 Translated: "${text}" -> "${translatedText}"`);
            } catch (openAiErr) {
                console.error("❌ OpenAI Translation Error:", openAiErr);
                return res.status(500).json({ error: "Translation failed", detail: openAiErr.message });
            }
        }

        const voiceId = VOICE_MAPPING[targetLanguage] || "pNInz6obpgDQGcFmaJgB";

        try {
            console.log(`🎙️ Generating TTS using Voice: ${voiceId}`);
            // 2. GENERATE AUDIO
            const audio = await elevenlabs.textToSpeech.convert(voiceId, {
                text: translatedText,
                model_id: "eleven_turbo_v2_5",
                output_format: "mp3_44100_128",
            });

            res.setHeader("Content-Type", "audio/mpeg");

            // Check if it's a pipeable stream (Node.js) or a Web Stream
            if (audio.pipe) {
                audio.pipe(res);
            } else {
                // If it's a Web Stream or Buffer, we need to handle it accordingly
                // For the latest SDK it should be pipeable, but let's be safe
                const chunks = [];
                for await (const chunk of audio) {
                    res.write(chunk);
                }
                res.end();
            }
        } catch (elevenLabsErr) {
            console.error("❌ ElevenLabs Generation Error:", elevenLabsErr);
            return res.status(500).json({ error: "Speech generation failed", detail: elevenLabsErr.message });
        }

    } catch (error) {
        console.error("❌ General TTS Controller Error:", error);
        res.status(500).json({ error: "Failed to process speech Request", detail: error.message });
    }
};
