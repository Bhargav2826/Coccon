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

// High-quality Multilingual Voice IDs for ElevenLabs
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

// Language codes for Sarvam AI fallback
const SARVAM_LANG_MAPPING = {
    "Hindi": "hi-IN",
    "Marathi": "mr-IN",
    "Gujarati": "gu-IN",
    "Tamil": "ta-IN",
    "Telugu": "te-IN",
    "Kannada": "kn-IN",
    "Bengali": "bn-IN",
    "Malayalam": "ml-IN",
    "Punjabi": "pa-IN"
};

export const generateTTS = async (req, res) => {
    try {
        const { text, targetLanguage } = req.body;

        if (!text) {
            return res.status(400).json({ error: "Text is required" });
        }

        console.log(`🚀 ElevenLabs TTS Request: "${text.substring(0, 30)}..." -> [${targetLanguage}]`);

        // 1. Translation Step (Using Sarvam AI for accurate Indian translations)
        let translatedText = text;
        if (targetLanguage !== "English") {
            try {
                const translationResponse = await axios.post(
                    "https://api.sarvam.ai/v1/chat/completions",
                    {
                        model: "sarvam-m",
                        messages: [
                            { role: "system", content: `Translate text ONLY to ${targetLanguage}.` },
                            { role: "user", content: text }
                        ],
                        temperature: 0.1
                    },
                    {
                        headers: { "api-subscription-key": SARVAM_API_KEY, "Content-Type": "application/json" }
                    }
                );
                translatedText = translationResponse.data.choices[0].message.content;
                console.log(`🌐 Translated: ${translatedText}`);
            } catch (transErr) {
                console.warn("⚠️ Translation failed, using original text.");
            }
        }

        // 2. Primary Voice Path: ElevenLabs (High Quality)
        try {
            console.log(`🎙️ Attempting ElevenLabs (Model: Multilingual v2)...`);
            const audioStream = await elevenlabs.textToSpeech.convert(VOICE_MAPPING[targetLanguage] || "pNInz6obpgDQGcFmaJgB", {
                text: translatedText,
                model_id: "eleven_multilingual_v2", // Best for Indian Languages
                output_format: "mp3_44100_128",
            });

            res.setHeader("Content-Type", "audio/mpeg");
            return Readable.from(audioStream).pipe(res);

        } catch (elevenErr) {
            console.error("❌ ElevenLabs Failed:", elevenErr.message);

            // 3. Fallback Voice Path: Sarvam AI (Reliability)
            if (SARVAM_API_KEY) {
                const langCode = SARVAM_LANG_MAPPING[targetLanguage] || "hi-IN";
                console.log(`♻️ Resilient Fallback: Using Sarvam AI TTS [${langCode}]`);
                try {
                    const sarvamRes = await axios.post(
                        "https://api.sarvam.ai/v1/text-to-speech",
                        {
                            inputs: [translatedText],
                            target_language_code: langCode,
                            speaker: "meera",
                            speech_sample_rate: 16000,
                            enable_preprocessing: true,
                            model: "bulbul:v1"
                        },
                        {
                            headers: { "api-subscription-key": SARVAM_API_KEY, "Content-Type": "application/json" }
                        }
                    );

                    if (sarvamRes.data.audios && sarvamRes.data.audios[0]) {
                        const audioBuffer = Buffer.from(sarvamRes.data.audios[0], 'base64');
                        res.setHeader("Content-Type", "audio/wav");
                        return res.send(audioBuffer);
                    }
                } catch (sarErr) {
                    console.error("❌ All TTS Providers Failed.");
                }
            }

            return res.status(500).json({ error: "TTS failed", detail: elevenErr.message });
        }

    } catch (error) {
        console.error("❌ Fatal Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};
