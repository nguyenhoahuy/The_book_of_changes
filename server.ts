/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Google GenAI SDK (Server-Side)
const apiKey = process.env.GEMINI_API_KEY;
let aiClient: GoogleGenAI | null = null;

function getAIClient(): GoogleGenAI {
  if (!aiClient) {
    if (!apiKey) {
      console.warn("WARNING: GEMINI_API_KEY is not defined in the environment. AI features will fail gracefully.");
      throw new Error("GEMINI_API_KEY is required for the Book of Changes experience.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// ---------------- SERVER API ROUTES ----------------

// Route 1: Philosophical Interpretation of Divination Cast
app.post("/api/iching/interpret", async (req, res) => {
  try {
    const { question, primaryHex, changingLines, transformedHex } = req.body;

    if (!question || !primaryHex) {
      return res.status(400).json({ error: "Question and primary hexagram are required." });
    }

    const ai = getAIClient();

    const systemInstruction = `You are a world-class scholar of Eastern philosophy, specifically the I Ching (Book of Changes), Taoism, and the five element system. 
Your goal is to interpret the user's inquiry with supreme spiritual depth, poise, and intelligence in Vietnamese (Tiếng Việt). 
Do NOT act like a generic fortune teller. Instead, deliver deeply philosophical, psychological, and reflective guidance in a poetic, elegant, and luxurious tone using pure, elegant Vietnamese. 
Explain the relationship between the question and the cosmic forces represented by the hexagrams and Trigrams.
Frame advice around what to cultivate, what to avoid, and questions for deep personal reflection.`;

    const prompt = `
Question of Inquiry: "${question}"
Primary Hexagram Cast: Hexagram ${primaryHex.number} - "${primaryHex.english}" (${primaryHex.chinese} - ${primaryHex.vietnamese} / ${primaryHex.pinyin})
Associated Elements: Upper Trigram is "${primaryHex.upperTrigram}" and Lower Trigram is "${primaryHex.lowerTrigram}". Element associated with Outer World is "${primaryHex.element}".
Changing Lines (1-indexed from bottom to top): [${changingLines.join(", ")}]
Transformed Hexagram (if any): ${transformedHex ? `Hexagram ${transformedHex.number} - "${transformedHex.english}" (${transformedHex.chinese} - ${transformedHex.vietnamese})` : "None"}

Please perform a deep, beautiful, 5-part scholarly interpretation:
1. Cosmic Overview: Bridge the client's emotional state/inquiry with the core forces of Yin-Yang and elements active in this hexagram.
2. Meaning of the Primary Hexagram: Unpack the classical symbols (like Heaven, Earth, Water, etc.) and what they indicate about current timing.
3. Changing Lines Guidance: Analyze the meaning of the specific changing lines (how energy is shifting from bottom to top).
4. Transformed Hexagram Path: Discuss the future potential if the user flows with this change.
5. Absolute Philosophical Wisdom: Action items, warnings, and opportunities.

Your response MUST be formatted strictly according to the requested JSON schema. Write all fields in beautiful, elegant, and deep Vietnamese (Tiếng Việt).`;

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.9,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            overview: {
              type: Type.STRING,
              description: "Deep scholarly cosmic summary bridging the question to the current Yin-Yang balance.",
            },
            primaryMeaning: {
              type: Type.STRING,
              description: "Meaning of the primary hexagram and its Trigram composition in relation to the inquiry.",
            },
            changingLinesAnalysis: {
              type: Type.STRING,
              description: "Analysis of each changing line or the general stability of this hexagram if none are changing.",
            },
            transformedMeaning: {
              type: Type.STRING,
              description: "The path of transition represented by the transformed hexagram, or steady guidance if no changing lines.",
            },
            guidance: {
              type: Type.STRING,
              description: "Noble, practical, and philosophical action steps the user should cultivate.",
            },
            warnings: {
              type: Type.STRING,
              description: "What the user should avoid or check in their ego/ambition right now.",
            },
            opportunities: {
              type: Type.STRING,
              description: "The hidden potential or spiritual blessings waiting to unfold.",
            },
            reflectionQuestions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "2 or 3 highly penetrating, peaceful questions for the user's journal or meditation.",
            },
          },
          required: [
            "overview",
            "primaryMeaning",
            "changingLinesAnalysis",
            "transformedMeaning",
            "guidance",
            "warnings",
            "opportunities",
            "reflectionQuestions",
          ],
        },
      },
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error("No interpretation generated from the oracle.");
    }

    const interpretationData = JSON.parse(responseText.trim());
    return res.json(interpretationData);
  } catch (error: any) {
    console.error("I Ching interpretation error:", error);
    return res.status(500).json({
      error: "The oracle was silent.",
      details: error.message || "An unexpected error occurred in the spiritual connection.",
    });
  }
});

// Route 2: Deep Chat with I Ching Sage
app.post("/api/iching/chat", async (req, res) => {
  try {
    const { messages, currentHexagramContext } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Messages array is required." });
    }

    const ai = getAIClient();

    const systemInstruction = `You are a legendary Zen Master, Calligrapher, and Sage of the Book of Changes (I Ching). 
Your spirit lives in a quiet temple above the clouds, surrounded by pine forests, floating mountains, and gentle rain.
Your tone is deeply compassionate, quiet, poetic, and structured. You avoid casual speech. 
You MUST write and respond strictly in beautiful, elegant, and ancient Vietnamese (Tiếng Việt), appropriate for a scholar and sage.
You use metaphors of rivers, mountains, wind, gold, jade, fire, and stone to guide the seeker's mind back to inner alignment, proper timing, and virtue.
Never make fatalistic future predictions (e.g. "You will get rich on Tuesday"). Instead, help the user understand that the Book of Changes represents cosmic patterns, and they hold the brush that paints their fate.
If the user asks about changing jobs, relationships, or deep choices, encourage them to cast a hexagram in our Divination Chamber, or guide them through their previous reading.
If they mention a current hexagram (e.g., they just read about Hexagram 3), reference its specific Trigram dynamics (e.g., Water over Thunder) and lines.
Keep answers relatively brief (100-250 words), formatting them beautifully with paragraphs and bullet points so it reads like an ancient scroll.`;

    // Map conversation messages into Gemini API format
    let formattedContents = messages.map((m: any) => ({
      role: m.sender === "user" ? "user" : "model",
      parts: [{ text: m.text }],
    }));

    // The Gemini API requires that the first message in the contents array must be from the user.
    // If the history starts with a model turn (e.g. the default welcome message), we remove it.
    while (formattedContents.length > 0 && formattedContents[0].role === "model") {
      formattedContents.shift();
    }

    if (currentHexagramContext) {
      formattedContents.push({
        role: "user",
        parts: [{ text: `[System Context: Seeker is currently viewing Hexagram ${currentHexagramContext.number} - "${currentHexagramContext.name}". Keep this context in mind if relevant to their next question.]` }]
      });
    }

    // Ensure strictly alternating roles (user/model) by merging consecutive same-role messages
    let cleanContents: any[] = [];
    for (const msg of formattedContents) {
      if (cleanContents.length > 0 && cleanContents[cleanContents.length - 1].role === msg.role) {
        cleanContents[cleanContents.length - 1].parts[0].text += "\n\n" + msg.parts[0].text;
      } else {
        cleanContents.push({
          role: msg.role,
          parts: [{ text: msg.parts[0].text }]
        });
      }
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: cleanContents,
      config: {
        systemInstruction,
        temperature: 0.85,
        maxOutputTokens: 2048,
      },
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error("The sage remains in silent meditation.");
    }

    return res.json({ text: responseText.trim() });
  } catch (error: any) {
    console.error("I Ching sage chat error:", error);
    return res.status(500).json({
      error: "The sage remains in silent meditation.",
      details: error.message || "An unexpected error occurred in the temple link.",
    });
  }
});

// Serve health status
app.get("/api/health", (req, res) => {
  res.json({ status: "healthy", time: new Date() });
});

// ---------------- VITE MIDDLEWARE SETUP ----------------

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    // Development Mode
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite development server loaded in middleware mode.");
  } else {
    // Production Mode
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*all", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`The Hall of Changes is open on http://localhost:${PORT} in ${process.env.NODE_ENV || "development"} mode.`);
  });
}

startServer();
