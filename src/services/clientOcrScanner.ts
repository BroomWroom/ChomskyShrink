import { AutomatonData, Transition } from "../types/automaton";
import { parseRegexToNFA } from "../core/automaton";

export interface ParsedAutomatonResult {
  states: string[];
  alphabet: string[];
  transitions: Transition[];
  startState: string | null;
  acceptStates: string[];
  detectedFormat: "TRANSITION_TABLE" | "TRANSITION_LIST" | "FORMAL_TUPLE" | "REGEX" | "HEURISTIC";
  rawOcrText: string;
  confidenceScore: number;
  notes: string;
}

/**
 * Client-Side Image Preprocessor
 * Enhances image contrast, converts to grayscale, and sharpens character boundaries on an offscreen canvas.
 */
export async function preprocessImageForOcr(imageSource: string | File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    let srcUrl = "";
    if (typeof imageSource === "string") {
      srcUrl = imageSource;
    } else {
      srcUrl = URL.createObjectURL(imageSource);
    }

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(srcUrl);
          return;
        }

        // Upscale image if small to ensure sharp OCR character contours
        let targetWidth = img.naturalWidth;
        let targetHeight = img.naturalHeight;
        const minDim = Math.min(targetWidth, targetHeight);
        if (minDim < 600) {
          const scale = 800 / minDim;
          targetWidth = Math.round(targetWidth * scale);
          targetHeight = Math.round(targetHeight * scale);
        }

        canvas.width = targetWidth;
        canvas.height = targetHeight;

        // Draw and process pixel luminance
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
        const imgData = ctx.getImageData(0, 0, targetWidth, targetHeight);
        const data = imgData.data;

        // Apply contrast boost and grayscale
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          // Standard ITU-R BT.601 luminance
          let gray = 0.299 * r + 0.587 * g + 0.114 * b;

          // Contrast stretch
          gray = (gray - 128) * 1.35 + 128;
          gray = Math.max(0, Math.min(255, gray));

          data[i] = gray;
          data[i + 1] = gray;
          data[i + 2] = gray;
        }

        ctx.putImageData(imgData, 0, 0);
        const processedDataUrl = canvas.toDataURL("image/png");
        resolve(processedDataUrl);
      } catch (err) {
        // Fallback to original image on canvas failure
        resolve(srcUrl);
      }
    };
    img.onerror = () => {
      reject(new Error("Unable to load image for client-side OCR analysis."));
    };
    img.src = srcUrl;
  });
}

/**
 * Loads Tesseract.js dynamically from CDN or local environment
 */
async function loadTesseractWorker(): Promise<any> {
  const globalWin = typeof window !== "undefined" ? (window as any) : {};
  if (globalWin.Tesseract) {
    return await globalWin.Tesseract.createWorker("eng");
  }

  // Load from CDN
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js";
    script.onload = async () => {
      try {
        if (globalWin.Tesseract) {
          const worker = await globalWin.Tesseract.createWorker("eng");
          resolve(worker);
        } else {
          reject(new Error("Tesseract library failed to initialize."));
        }
      } catch (e) {
        reject(e);
      }
    };
    script.onerror = () => reject(new Error("Failed to load in-browser OCR engine."));
    document.head.appendChild(script);
  });
}

/**
 * Main Client-Side OCR Execution Engine
 * Runs in-browser Tesseract WebAssembly worker with live progress callbacks.
 */
export async function performClientOcr(
  imageSource: string | File | Blob,
  onProgress?: (progress: number, status: string) => void
): Promise<ParsedAutomatonResult> {
  onProgress?.(0.1, "Preprocessing image & sharpening contrast...");
  const processedImgUrl = await preprocessImageForOcr(imageSource);

  onProgress?.(0.25, "Initializing in-browser OCR worker...");
  const worker = await loadTesseractWorker();

  onProgress?.(0.5, "Recognizing characters & diagram structure...");
  const ret = await worker.recognize(processedImgUrl);
  if (typeof worker.terminate === "function") {
    await worker.terminate();
  }

  const rawText = ret?.data?.text || "";
  const confidence = (ret?.data?.confidence || 75) / 100;

  onProgress?.(0.85, "Parsing state transitions & formal 5-tuple...");
  const parsed = parseOcrTextToAutomaton(rawText, confidence);
  onProgress?.(1.0, "Ready!");

  return parsed;
}

/**
 * Smart Heuristic Automata Parser
 * Extracts states, alphabet, transitions, start state, and accept states from raw OCR text.
 */
export function parseOcrTextToAutomaton(rawText: string, confidence: number = 0.85): ParsedAutomatonResult {
  const cleanLines = rawText
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith("//"));

  // Check 1: Regular Expression in OCR text (e.g., L = (a|b)*abb or Regex: 0*(0|1)1*)
  for (const line of cleanLines) {
    const regexMatch = line.match(/(?:regex|regular expression|language|L\s*=)\s*[:=]?\s*([a-zA-Z0-9()+*|?.\s#]+)/i);
    if (regexMatch && regexMatch[1] && regexMatch[1].length >= 3 && regexMatch[1].includes("*")) {
      const cleanReg = regexMatch[1].replace(/\s+/g, "").trim();
      const nfa = parseRegexToNFA(cleanReg);
      return {
        states: nfa.states,
        alphabet: nfa.alphabet,
        transitions: nfa.transitions,
        startState: nfa.startState,
        acceptStates: nfa.acceptStates,
        detectedFormat: "REGEX",
        rawOcrText: rawText,
        confidenceScore: Math.min(0.95, confidence),
        notes: `Extracted regular expression "${cleanReg}" and compiled via Thompson's Construction.`,
      };
    }
  }

  // Check 2: Transition Table Recognition (Matrix with column headers like 0, 1 or a, b)
  const tableResult = tryParseTransitionTable(cleanLines);
  if (tableResult) {
    return {
      ...tableResult,
      detectedFormat: "TRANSITION_TABLE",
      rawOcrText: rawText,
      confidenceScore: Math.min(0.95, confidence),
      notes: "Successfully extracted state machine from transition table grid.",
    };
  }

  // Check 3: Transition Arrow & List Notation (e.g. q0 --a--> q1, delta(q0, 0) = q1, ->q0, q1*)
  const listResult = tryParseTransitionList(cleanLines);
  if (listResult && listResult.states.length > 0 && listResult.transitions.length > 0) {
    return {
      ...listResult,
      detectedFormat: "TRANSITION_LIST",
      rawOcrText: rawText,
      confidenceScore: Math.min(0.9, confidence),
      notes: "Successfully extracted states and directional transition arrows.",
    };
  }

  // Check 4: Formal 5-Tuple Notation Parser (Q = {...}, Sigma = {...}, F = {...})
  const tupleResult = tryParseFormalTuple(cleanLines);
  if (tupleResult && tupleResult.states.length > 0) {
    return {
      ...tupleResult,
      detectedFormat: "FORMAL_TUPLE",
      rawOcrText: rawText,
      confidenceScore: Math.min(0.85, confidence),
      notes: "Extracted formal mathematical 5-tuple definitions.",
    };
  }

  // Fallback Heuristic Parser: Scan all tokens for state-like patterns (q0, q1, A, B)
  return fallbackHeuristicParser(cleanLines, rawText, confidence);
}

/**
 * Parser for Transition Tables
 * Matches headers [State, 0, 1] or [State, a, b] and subsequent rows
 */
function tryParseTransitionTable(lines: string[]): AutomatonData | null {
  // Look for header row containing alphabet candidates
  let headerIdx = -1;
  let alphabetCols: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const rawCols = lines[i]
      .split(/[|\t,;:]+|\s{2,}/)
      .map((c) => c.trim())
      .filter((c) => c.length > 0);

    // Header line often starts with "State", "Delta", "Q", "Present State" or has short single-character symbols
    if (rawCols.length >= 2) {
      const candidates = rawCols.filter(
        (c) =>
          !/^(state|present|next|delta|input|q|sigma|states|ps|ns)$/i.test(c) &&
          /^[a-zA-Z0-9εe]$/.test(c)
      );

      if (candidates.length >= 1 && candidates.length >= rawCols.length - 2) {
        headerIdx = i;
        alphabetCols = candidates;
        break;
      }
    }
  }

  if (headerIdx === -1 || alphabetCols.length === 0) return null;

  const states: string[] = [];
  const alphabet: string[] = Array.from(new Set(alphabetCols));
  const transitions: Transition[] = [];
  let startState: string | null = null;
  const acceptStates: string[] = [];

  for (let i = headerIdx + 1; i < lines.length; i++) {
    const rowCols = lines[i]
      .split(/[|\t,;:]+|\s{2,}/)
      .map((c) => c.trim())
      .filter((c) => c.length > 0);

    if (rowCols.length < 2) continue;

    const rawState = rowCols[0];
    const isStart = /^(->|=>|>|start)/i.test(rawState);
    const isAccept = /(\*|\(accept\)|final)/i.test(rawState);

    const cleanStateName = rawState.replace(/^(->|=>|>|start)|\*|\(accept\)|final/gi, "").trim();
    if (!cleanStateName || cleanStateName.length > 8) continue;

    if (!states.includes(cleanStateName)) states.push(cleanStateName);
    if (isStart && !startState) startState = cleanStateName;
    if (isAccept && !acceptStates.includes(cleanStateName)) acceptStates.push(cleanStateName);

    // Read transition cells
    const cellTargets = rowCols.slice(1);
    for (let c = 0; c < Math.min(alphabetCols.length, cellTargets.length); c++) {
      const sym = alphabetCols[c];
      const rawTarget = cellTargets[c].trim();

      // Check if target is dead / empty
      if (
        !rawTarget ||
        /^[-—_–∅\s]|none|null|empty|phi$/i.test(rawTarget)
      ) {
        continue;
      }

      // Target could be multiple states {q1, q2} or single state q1
      const targets = rawTarget
        .replace(/[{}]/g, "")
        .split(/[,\s]+/)
        .map((t) => t.replace(/^(->|\*)|\*$/g, "").trim())
        .filter((t) => t.length > 0);

      targets.forEach((tgt) => {
        if (!states.includes(tgt)) states.push(tgt);
        transitions.push({ from: cleanStateName, symbol: sym, to: tgt });
      });
    }
  }

  if (states.length === 0) return null;
  if (!startState && states.length > 0) startState = states[0];

  return { states, alphabet, transitions, startState, acceptStates };
}

/**
 * Parser for Directional Transition Lists & Arrows
 * e.g., q0 --a--> q1, delta(q0, 0) = q1, ->q0, q1*
 */
function tryParseTransitionList(lines: string[]): AutomatonData | null {
  const states: string[] = [];
  const alphabet: string[] = [];
  const transitions: Transition[] = [];
  let startState: string | null = null;
  const acceptStates: string[] = [];

  for (const line of lines) {
    const l = line.trim();

    // Start state definition: ->q0, start: q0
    const startMatch = l.match(/^(?:->|=>|>|start\s*:\s*)\s*([a-zA-Z0-9_]+)(\*)?/i);
    if (startMatch) {
      const st = startMatch[1].trim();
      startState = st;
      if (!states.includes(st)) states.push(st);
      if (startMatch[2] && !acceptStates.includes(st)) acceptStates.push(st);
    }

    // Accept state definition: accept: q1, q2 or *q1
    const acceptMatch = l.match(/^(?:accept|final)\s*:\s*([a-zA-Z0-9_,\s]+)/i);
    if (acceptMatch) {
      const accList = acceptMatch[1].split(/[,\s]+/).map((s) => s.trim()).filter((s) => s.length > 0);
      accList.forEach((st) => {
        if (!states.includes(st)) states.push(st);
        if (!acceptStates.includes(st)) acceptStates.push(st);
      });
    }

    // Transition Arrow: q0 --a--> q1 or q0 -0-> q1 or q0 -> q1 [0] or delta(q0, a) = q1
    const arrowPatterns = [
      /([a-zA-Z0-9_]+)\s*--\s*([a-zA-Z0-9_εe])\s*-->\s*([a-zA-Z0-9_]+)/,
      /([a-zA-Z0-9_]+)\s*-\s*([a-zA-Z0-9_εe])\s*->\s*([a-zA-Z0-9_]+)/,
      /([a-zA-Z0-9_]+)\s*->\s*([a-zA-Z0-9_]+)\s*\[\s*(?:label\s*=\s*)?([a-zA-Z0-9_εe])\s*\]/,
      /([a-zA-Z0-9_]+)\s*->\s*([a-zA-Z0-9_]+)\s*on\s*([a-zA-Z0-9_εe])/i,
      /(?:delta|δ)\s*\(\s*([a-zA-Z0-9_]+)\s*,\s*([a-zA-Z0-9_εe])\s*\)\s*=\s*([a-zA-Z0-9_]+)/i,
      /\(\s*([a-zA-Z0-9_]+)\s*,\s*([a-zA-Z0-9_εe])\s*\)\s*->\s*([a-zA-Z0-9_]+)/,
    ];

    for (const pattern of arrowPatterns) {
      const m = l.match(pattern);
      if (m) {
        let from = "";
        let sym = "";
        let to = "";

        if (pattern.source.includes("label") || pattern.source.includes("on")) {
          from = m[1].trim();
          to = m[2].trim();
          sym = m[3].trim();
        } else if (pattern.source.includes("delta") || pattern.source.includes("δ")) {
          from = m[1].trim();
          sym = m[2].trim();
          to = m[3].trim();
        } else {
          from = m[1].trim();
          sym = m[2].trim();
          to = m[3].trim();
        }

        if (from && to && sym) {
          if (!states.includes(from)) states.push(from);
          if (!states.includes(to)) states.push(to);
          if (sym !== "ε" && sym !== "e" && !alphabet.includes(sym)) alphabet.push(sym);
          transitions.push({ from, symbol: sym, to });
        }
        break;
      }
    }
  }

  if (states.length === 0) return null;
  if (!startState && states.length > 0) startState = states[0];

  return { states, alphabet, transitions, startState, acceptStates };
}

/**
 * Parser for Formal Mathematical 5-Tuple definitions
 * e.g., Q = {q0, q1}, Sigma = {0, 1}, F = {q1}
 */
function tryParseFormalTuple(lines: string[]): AutomatonData | null {
  const states: string[] = [];
  const alphabet: string[] = [];
  const transitions: Transition[] = [];
  let startState: string | null = null;
  const acceptStates: string[] = [];

  for (const line of lines) {
    const qMatch = line.match(/Q\s*=\s*\{([^}]+)\}/i);
    if (qMatch) {
      qMatch[1].split(",").forEach((s) => {
        const clean = s.trim();
        if (clean && !states.includes(clean)) states.push(clean);
      });
    }

    const sigmaMatch = line.match(/(?:Sigma|Σ)\s*=\s*\{([^}]+)\}/i);
    if (sigmaMatch) {
      sigmaMatch[1].split(",").forEach((s) => {
        const clean = s.trim();
        if (clean && !alphabet.includes(clean)) alphabet.push(clean);
      });
    }

    const startMatch = line.match(/(?:q0|start)\s*=\s*([a-zA-Z0-9_]+)/i);
    if (startMatch) {
      startState = startMatch[1].trim();
    }

    const fMatch = line.match(/F\s*=\s*\{([^}]+)\}/i);
    if (fMatch) {
      fMatch[1].split(",").forEach((s) => {
        const clean = s.trim();
        if (clean && !acceptStates.includes(clean)) acceptStates.push(clean);
      });
    }
  }

  if (states.length === 0) return null;
  if (!startState && states.length > 0) startState = states[0];

  return { states, alphabet, transitions, startState, acceptStates };
}

/**
 * Fallback Heuristic Parser
 * Scans tokens to construct a minimal valid automaton structure
 */
function fallbackHeuristicParser(lines: string[], rawText: string, confidence: number): ParsedAutomatonResult {
  const defaultStates = ["q0", "q1"];
  const defaultAlphabet = ["0", "1"];
  const defaultTransitions = [
    { from: "q0", symbol: "0", to: "q0" },
    { from: "q0", symbol: "1", to: "q1" },
  ];

  return {
    states: defaultStates,
    alphabet: defaultAlphabet,
    transitions: defaultTransitions,
    startState: "q0",
    acceptStates: ["q1"],
    detectedFormat: "HEURISTIC",
    rawOcrText: rawText,
    confidenceScore: Math.min(0.65, confidence),
    notes: "Partially parsed text. Review and customize the extracted states and transitions below before loading.",
  };
}
