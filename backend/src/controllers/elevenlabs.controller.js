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

// Voice mapping for popular Indian languages (for ElevenLabs)
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

// ISO codes for Sarvam AI
const SARVAM_LANG_MAPPING = {
    "Hindi": "hi-IN",
    "Marathi": "mr-IN",
    "Gujarati": "gu-IN",
    "Tamil": "ta-IN",
    "Telugu": "te-IN",
    "Kannada": "kn-IN",
    "Bengali": "bn-IN",
    "Malayalam": "ml-IN",
    "Punjabi": "pa-IN",
    "English": "en-IN"
};

export const generateTTS = async (req, res) => {
    try {
        const { text, targetLanguage } = req.body;

        if (!text) {
            return res.status(400).json({ error: "Text is required" });
        }

        console.log(`🚀 TTS Pipeline: "${text.substring(0, 30)}..." -> [${targetLanguage}]`);

        // 1. TRANSLATION (Skip if English/Source)
        let translatedText = text;
        if (targetLanguage !== "English") {
            try {
                const translationResponse = await axios.post(
                    "https://api.sarvam.ai/v1/chat/completions",
                    {
                        model: "sarvam-m",
                        messages: [
                            { role: "system", content: `Translate ONLY to ${targetLanguage}.` },
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
                console.warn("⚠️ Translation fallback to raw text:", transErr.message);
            }
        }

        // 2. VOICE GENERATION
        try {
            console.log(`🎙️ Attempting ElevenLabs...`);
            // ElevenLabs Multilingual v2 is best for Indian languages
            const audioStream = await elevenlabs.textToSpeech.convert(VOICE_MAPPING[targetLanguage] || "pNInz6obpgDQGcFmaJgB", {
                text: translatedText,
                model_id: "eleven_multilingual_v2",
                output_format: "mp3_44100_128",
            });

            res.setHeader("Content-Type", "audio/mpeg");
            return Readable.from(audioStream).pipe(res);

        } catch (elevenErr) {
            console.error("❌ ElevenLabs Failed:", elevenErr.message);

            // AUTOMATIC FAILOVER TO SARVAM AI
            const sarvamLangCode = SARVAM_LANG_MAPPING[targetLanguage] || "hi-IN";
            console.log(`♻️ Switching to Sarvam AI TTS [code: ${sarvamLangCode}] using Bulbul v3...`);

            try {
                // FIXED SARVAM BODY BASED ON DOCUMENTATION
                const sarvamTTSRes = await axios.post(
                    "https://api.sarvam.ai/text-to-speech",
                    {
                        text: translatedText,
                        target_language_code: sarvamLangCode,
                        speaker: "Shubh", // Shubh is the standard bulbul:v3 speaker
                        model: "bulbul:v3",
                        speech_sample_rate: 24000,
                        enable_preprocessing: true
                    },
                    {
                        headers: { "api-subscription-key": SARVAM_API_KEY, "Content-Type": "application/json" }
                    }
                );

                if (sarvamTTSRes.data && sarvamTTSRes.data.audios && sarvamTTSRes.data.audios[0]) {
                    const audioBuffer = Buffer.from(sarvamTTSRes.data.audios[0], 'base64');
                    res.setHeader("Content-Type", "audio/wav");
                    console.log("✅ Sarvam Fallback SUCCESS");
                    return res.send(audioBuffer);
                } else if (sarvamTTSRes.data && sarvamTTSRes.data.audio_content) {
                    const audioBuffer = Buffer.from(sarvamTTSRes.data.audio_content, 'base64');
                    res.setHeader("Content-Type", "audio/wav");
                    console.log("✅ Sarvam Fallback SUCCESS (content block)");
                    return res.send(audioBuffer);
                } else {
                    console.error("❌ Sarvam Response error - no audio field:", sarvamTTSRes.data);
                    throw new Error("No audio returned from Sarvam");
                }
            } catch (sarvamTTSErr) {
                console.error("❌ Sarvam Fallback FAILED:", sarvamTTSErr.response?.data || sarvamTTSErr.message);
                return res.status(500).json({
                    error: "All TTS providers failed",
                    detail: elevenErr.message,
                    sarvam_error: sarvamTTSErr.response?.data || sarvamTTSErr.message
                });
            }
        }

    } catch (error) {
        console.error("❌ Fatal TTS Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};
