import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini Client
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey) {
  ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
  console.log("Gemini API client initialized successfully on server.");
} else {
  console.warn("Warning: GEMINI_API_KEY is not defined. The custom AI features will return a key setup prompt.");
}

// Custom symptom analysis API endpoint
app.post("/api/analyze-symptom", async (req: express.Request, res: express.Response) => {
  try {
    const { symptom, habits } = req.body;

    if (!symptom) {
      return res.status(400).json({ error: "Symptom description is required." });
    }

    if (!ai) {
      return res.status(400).json({
        error: "Gemini API key is not configured.",
        isMissingKey: true
      });
    }

    const systemInstruction = `You are a world-class psychosomatic medicine specialist with a hilarious, highly sarcastic, and dryly mocking persona (similar to House M.D. or a witty cynical doctor). 
Your task is to analyze the user's physical symptom or physical ailment, optionally taking into consideration their bad habits (like poor posture, dehydration, stress, endless doomscrolling, caffeine dependency, or lack of sleep).

You must return a strictly formatted JSON object that maps:
1. The emotional/metaphorical root of the physical ailment.
2. The actual scientific, technical, and physiological mechanism happening in the body (the nervous system, muscle contractions, chemical releases, blood flow restriction, etc.). This should be completely medically accurate and real.
3. A biting, sarcastic review that mocks the user's bad habits, lifestyle choices, or refusal to take care of themselves, while retaining medical accuracy in the joke.
4. 2-3 deep mindfulness reflection/journal prompts for self-exploration.
5. 2-3 practical somatic or physical therapy exercises to help release the somatic charge.

Your tone should be dry, sharp, and satirical, but the underlying insights MUST be incredibly accurate, educational, and helpful. Do not be overly mean, but do mock their typical modern habits (e.g., sitting like a boiled shrimp, excessive screen time, ignoring thirst, emotional suppression).

You must respond with raw JSON matching the following schema structure:
{
  "emotionalRoot": "string explaining the emotional/metaphorical root causes",
  "physiologicalDescription": "highly accurate, scientific description of the body's actual physiological/somatic reaction, nerve pathways, muscle contractions, etc.",
  "sarcasticReview": "the sarcastic, mocking review of their lifestyle/habits and coping mechanisms",
  "mindfulnessPrompts": ["prompt 1", "prompt 2"],
  "practicalTips": ["practical physical exercise or habit tip 1", "practical physical exercise or habit tip 2"]
}

Make sure to not include markdown code blocks inside the JSON fields. Just clean string values. Return only the JSON object.`;

    const promptText = `Analyze this physical symptom: "${symptom}". 
User's self-reported lifestyle habits/context: "${habits || 'Not provided'}"`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: promptText,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            emotionalRoot: {
              type: Type.STRING,
              description: "Emotional and metaphysical root causes of this ailment."
            },
            physiologicalDescription: {
              type: Type.STRING,
              description: "Scientifically accurate, professional medical details of what is physically happening in the nervous system, muscles, or organs."
            },
            sarcasticReview: {
              type: Type.STRING,
              description: "Hilarious, mocking, sarcastic commentary on their bad habits and denial of physical needs."
            },
            mindfulnessPrompts: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Deep, probing journal prompts for mental reflection."
            },
            practicalTips: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Practical physical exercises, somatic releases, or posture corrections."
            }
          },
          required: ["emotionalRoot", "physiologicalDescription", "sarcasticReview", "mindfulnessPrompts", "practicalTips"]
        }
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("Empty response from AI model.");
    }

    const parsed = JSON.parse(text);
    return res.json(parsed);

  } catch (error: any) {
    console.error("Error analyzing symptom:", error);
    return res.status(500).json({ 
      error: error.message || "An error occurred during symptom analysis."
    });
  }
});

// Serve static assets in development or production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite development server mounted as Express middleware.");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Serving static production assets from dist/.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
