import { AutomatonData, Transition } from "../types/automaton";

export interface VisionAutomataResult {
  states: string[];
  alphabet: string[];
  transitions: Transition[];
  startState: string | null;
  acceptStates: string[];
  detectedType: "DFA" | "NFA" | "TRANSITION_TABLE";
  confidenceScore: number;
  explanation: string;
}

/**
 * Converts a File, Blob, or Data URL to clean Base64 string and MIME type.
 */
export async function fileToBase64(file: File | Blob | string): Promise<{ base64: string; mimeType: string }> {
  if (typeof file === "string" && file.startsWith("data:")) {
    const match = file.match(/^data:([^;]+);base64,(.+)$/);
    if (match) {
      return { mimeType: match[1], base64: match[2] };
    }
  }

  if (typeof file === "string") {
    // Fetch if it's a blob/object URL
    const res = await fetch(file);
    const blob = await res.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        const match = result.match(/^data:([^;]+);base64,(.+)$/);
        if (match) {
          resolve({ mimeType: match[1], base64: match[2] });
        } else {
          reject(new Error("Failed to extract Base64 data from URL."));
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const match = result.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        resolve({ mimeType: match[1], base64: match[2] });
      } else {
        reject(new Error("Failed to convert image file to Base64."));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Candidate Gemini Vision models to try in order of preference.
 */
const CANDIDATE_MODELS = [
  "gemini-1.5-flash",
  "gemini-1.5-flash-latest",
  "gemini-2.5-flash",
  "gemini-1.5-pro",
  "gemini-2.0-flash-exp"
];

/**
 * Analyzes state diagrams, graph sketches, and transition tables using Gemini Vision AI.
 * Automatically tries active Google AI Studio model candidates for maximum compatibility.
 */
export async function analyzeDiagramWithGeminiVision(
  imageSource: File | Blob | string,
  apiKey: string
): Promise<VisionAutomataResult> {
  const cleanKey = apiKey.trim();
  if (!cleanKey) {
    throw new Error("Please provide a Gemini API Key to use High-Accuracy Vision AI.");
  }

  const { base64, mimeType } = await fileToBase64(imageSource);

  const promptText = `
You are an expert theoretical computer science finite state automata parser.
Analyze this image containing a finite automaton diagram, state transition graph, or transition table.

Extract the complete, exact formal 5-tuple:
1. "states": Array of all state labels found in circles/nodes (e.g. ["q0", "q2", "q1"] or ["A", "B", "C"]).
2. "alphabet": Array of all distinct transition symbols (e.g. ["0", "1"] or ["a", "b"]). Do NOT include epsilon in the main alphabet if not used.
3. "startState": The initial state indicated by an incoming arrow from nowhere (e.g. "q0").
4. "acceptStates": Array of all final / accept states (indicated by double-circle rings or asterisk *).
5. "transitions": Array of objects: { "from": string, "symbol": string, "to": string }.
   - If an arrow or loop is labeled with multiple comma-separated symbols like "0,1" or "0, 1" or "a,b", create SEPARATE transitions for each symbol!
   - Make sure self-loops (arrows starting and ending on the same node) are correctly recorded with "from" == "to".
6. "detectedType": "DFA" or "NFA" or "TRANSITION_TABLE".
7. "confidenceScore": number between 0.0 and 1.0.
8. "explanation": Brief 1-line description of the recognized state machine.

Respond ONLY with a valid JSON object conforming to this schema with NO markdown code block wrappers, NO text before or after.
Example format:
{
  "states": ["q0", "q2", "q1"],
  "alphabet": ["0", "1"],
  "startState": "q0",
  "acceptStates": ["q1"],
  "transitions": [
    { "from": "q0", "symbol": "1", "to": "q0" },
    { "from": "q0", "symbol": "0", "to": "q2" },
    { "from": "q2", "symbol": "0", "to": "q2" },
    { "from": "q2", "symbol": "1", "to": "q1" },
    { "from": "q1", "symbol": "0", "to": "q1" },
    { "from": "q1", "symbol": "1", "to": "q1" }
  ],
  "detectedType": "DFA",
  "confidenceScore": 0.98,
  "explanation": "3-state DFA with start state q0 and accept state q1."
}
`;

  const requestBody = {
    contents: [
      {
        parts: [
          { text: promptText },
          {
            inlineData: {
              mimeType: mimeType || "image/png",
              data: base64,
            },
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.1,
      responseMimeType: "application/json",
    },
  };

  let lastErrorMessage = "";

  // Try candidate models in order
  for (const modelName of CANDIDATE_MODELS) {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${cleanKey}`;

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const message = errorData?.error?.message || `HTTP Error ${response.status}: ${response.statusText}`;

        // If key is totally invalid, no need to retry other models
        if (response.status === 400 && message.toLowerCase().includes("api_key_invalid")) {
          throw new Error(`Invalid Gemini API Key: ${message}`);
        }

        lastErrorMessage = message;
        // Continue to next model candidate
        continue;
      }

      const data = await response.json();
      const rawContent = data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!rawContent) {
        continue;
      }

      // Parse JSON response safely
      const cleanedJsonStr = rawContent.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
      const parsed = JSON.parse(cleanedJsonStr) as VisionAutomataResult;

      // Validate structure
      if (!Array.isArray(parsed.states) || parsed.states.length === 0) {
        throw new Error("Vision AI could not identify any state nodes in the diagram.");
      }

      // Sanitize transitions
      const validTransitions: Transition[] = [];
      if (Array.isArray(parsed.transitions)) {
        for (const t of parsed.transitions) {
          if (t.from && t.to && t.symbol) {
            const syms = String(t.symbol).split(",").map((s) => s.trim()).filter((s) => s.length > 0);
            for (const s of syms) {
              validTransitions.push({ from: t.from, symbol: s, to: t.to });
            }
          }
        }
      }

      return {
        states: parsed.states,
        alphabet: parsed.alphabet || ["0", "1"],
        transitions: validTransitions,
        startState: parsed.startState || parsed.states[0],
        acceptStates: parsed.acceptStates || [],
        detectedType: parsed.detectedType || "DFA",
        confidenceScore: parsed.confidenceScore || 0.95,
        explanation: parsed.explanation || `Recognized with ${modelName}.`,
      };
    } catch (err: any) {
      if (err.message && err.message.includes("Invalid Gemini API Key")) {
        throw err;
      }
      lastErrorMessage = err.message || lastErrorMessage;
    }
  }

  throw new Error(`Gemini Vision API Error: ${lastErrorMessage || "All candidate models failed. Please verify your API Key in Google AI Studio."}`);
}
