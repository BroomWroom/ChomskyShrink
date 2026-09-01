import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  X,
  Upload,
  Camera,
  Scan,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Plus,
  Trash2,
  Layers,
  HelpCircle,
  FileText,
  Key,
  Cpu,
  ExternalLink,
  RotateCcw
} from "lucide-react";
import { Automaton } from "../core/automaton";
import { analyzeDiagramWithGeminiVision } from "../services/visionScanner";
import { performClientOcr, ParsedAutomatonResult } from "../services/clientOcrScanner";
import { Transition } from "../types/automaton";

interface VisionScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportAutomaton: (automaton: Automaton) => void;
  isDark?: boolean;
}

export const VisionScannerModal: React.FC<VisionScannerModalProps> = ({
  isOpen,
  onClose,
  onImportAutomaton,
  isDark = true,
}) => {
  // Engine Selection: "gemini" (High Accuracy Vision AI) vs "client_ocr" (Local WASM)
  const [engineMode, setEngineMode] = useState<"gemini" | "client_ocr">("gemini");
  const [apiKey, setApiKey] = useState<string>(() => {
    return localStorage.getItem("chomsky_gemini_api_key") || "";
  });
  const [saveKeyToStorage, setSaveKeyToStorage] = useState<boolean>(true);
  const [showKeyPrompt, setShowKeyPrompt] = useState<boolean>(false);

  const [imageFile, setImageFile] = useState<File | Blob | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progressStatus, setProgressStatus] = useState<string>("");
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Extracted and Editable State Machine Data
  const [detectedFormatName, setDetectedFormatName] = useState<string>("DFA");
  const [confidenceScore, setConfidenceScore] = useState<number>(0.95);
  const [notesSummary, setNotesSummary] = useState<string>("");
  const [rawOcrText, setRawOcrText] = useState<string>("");

  const [editableStates, setEditableStates] = useState<string[]>([]);
  const [editableAlphabet, setEditableAlphabet] = useState<string[]>([]);
  const [editableStartState, setEditableStartState] = useState<string | null>(null);
  const [editableAcceptStates, setEditableAcceptStates] = useState<string[]>([]);
  const [editableTransitions, setEditableTransitions] = useState<Transition[]>([]);

  // Quick addition fields in editor
  const [newFromState, setNewFromState] = useState<string>("");
  const [newSymbol, setNewSymbol] = useState<string>("0");
  const [newToState, setNewToState] = useState<string>("");
  const [newStateName, setNewStateName] = useState<string>("");
  const [newAlphabetSym, setNewAlphabetSym] = useState<string>("");

  const [showRawOcr, setShowRawOcr] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const surfaceBg = isDark ? "#1a1007" : "#FFFFFF";
  const innerBg = isDark ? "#100904" : "#F4EEFF";
  const borderColor = isDark ? "#40372e" : "#DCD6F7";
  const textColor = isDark ? "#ffedd7" : "#424874";
  const mutedText = isDark ? "#a69888" : "#5f6594";
  const dimText = isDark ? "#6c5f51" : "#8b92be";

  // Handle saving API key
  const handleSaveApiKey = (keyVal: string) => {
    setApiKey(keyVal);
    if (saveKeyToStorage) {
      localStorage.setItem("chomsky_gemini_api_key", keyVal.trim());
    }
  };

  // Process image with the selected engine
  const processImage = useCallback(
    async (file: File | Blob) => {
      setImageFile(file);
      const previewUrl = URL.createObjectURL(file);
      setImagePreviewUrl(previewUrl);
      setIsProcessing(true);
      setErrorMessage(null);

      try {
        if (engineMode === "gemini") {
          // Check if API key exists
          const currentKey = apiKey.trim() || localStorage.getItem("chomsky_gemini_api_key") || "";
          if (!currentKey) {
            setShowKeyPrompt(true);
            setIsProcessing(false);
            return;
          }

          setProgressPercent(40);
          setProgressStatus("Analyzing visual state graph with Gemini Vision AI...");

          const result = await analyzeDiagramWithGeminiVision(file, currentKey);

          setProgressPercent(90);
          setProgressStatus("Constructing 5-tuple topology...");

          setDetectedFormatName(result.detectedType);
          setConfidenceScore(result.confidenceScore);
          setNotesSummary(result.explanation);
          setRawOcrText(JSON.stringify(result, null, 2));

          setEditableStates([...result.states]);
          setEditableAlphabet([...result.alphabet]);
          setEditableStartState(result.startState);
          setEditableAcceptStates([...result.acceptStates]);
          setEditableTransitions([...result.transitions]);

          if (result.states.length > 0) {
            setNewFromState(result.startState || result.states[0]);
            setNewToState(result.states[0]);
          }
          if (result.alphabet.length > 0) {
            setNewSymbol(result.alphabet[0]);
          }
        } else {
          // Fallback: Local Client-side Tesseract OCR
          const result = await performClientOcr(file, (percent, status) => {
            setProgressPercent(Math.round(percent * 100));
            setProgressStatus(status);
          });

          setDetectedFormatName(result.detectedFormat);
          setConfidenceScore(result.confidenceScore);
          setNotesSummary(result.notes);
          setRawOcrText(result.rawOcrText);

          setEditableStates([...result.states]);
          setEditableAlphabet([...result.alphabet]);
          setEditableStartState(result.startState);
          setEditableAcceptStates([...result.acceptStates]);
          setEditableTransitions([...result.transitions]);

          if (result.states.length > 0) {
            setNewFromState(result.startState || result.states[0]);
            setNewToState(result.states[0]);
          }
          if (result.alphabet.length > 0) {
            setNewSymbol(result.alphabet[0]);
          }
        }
      } catch (err: any) {
        setErrorMessage(err.message || "Failed to analyze state diagram.");
      } finally {
        setIsProcessing(false);
      }
    },
    [engineMode, apiKey, saveKeyToStorage]
  );

  // Global & Modal Clipboard Paste Handler (Ctrl+V)
  useEffect(() => {
    if (!isOpen) return;

    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith("image/")) {
          const blob = items[i].getAsFile();
          if (blob) {
            e.preventDefault();
            processImage(blob);
            break;
          }
        }
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [isOpen, processImage]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processImage(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith("image/")) {
        processImage(file);
      } else {
        setErrorMessage("Please drop a valid image file (.png, .jpg, .webp, .svg).");
      }
    }
  };

  const handleToggleAcceptState = (st: string) => {
    setEditableAcceptStates((prev) =>
      prev.includes(st) ? prev.filter((s) => s !== st) : [...prev, st]
    );
  };

  const handleAddState = () => {
    const name = newStateName.trim();
    if (name && !editableStates.includes(name)) {
      setEditableStates((prev) => [...prev, name]);
      if (!editableStartState) setEditableStartState(name);
      setNewStateName("");
    }
  };

  const handleAddAlphabet = () => {
    const sym = newAlphabetSym.trim();
    if (sym && !editableAlphabet.includes(sym)) {
      setEditableAlphabet((prev) => [...prev, sym]);
      setNewAlphabetSym("");
    }
  };

  const handleAddTransition = () => {
    if (!newFromState || !newToState || !newSymbol) return;
    const exists = editableTransitions.some(
      (t) => t.from === newFromState && t.symbol === newSymbol && t.to === newToState
    );
    if (!exists) {
      setEditableTransitions((prev) => [
        ...prev,
        { from: newFromState, symbol: newSymbol, to: newToState },
      ]);
    }
  };

  const handleDeleteTransition = (index: number) => {
    setEditableTransitions((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleConfirmImport = () => {
    if (editableStates.length === 0) {
      setErrorMessage("Cannot load an empty state machine. Add at least one state.");
      return;
    }

    const automaton = new Automaton({
      states: editableStates,
      alphabet: editableAlphabet.length > 0 ? editableAlphabet : ["0", "1"],
      transitions: editableTransitions,
      startState: editableStartState || editableStates[0],
      acceptStates: editableAcceptStates,
    });

    onImportAutomaton(automaton);
    onClose();
  };

  const handleResetScan = () => {
    setImageFile(null);
    setImagePreviewUrl(null);
    setEditableStates([]);
    setEditableTransitions([]);
    setErrorMessage(null);
    setIsProcessing(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-5 overflow-y-auto">
      <div
        className="relative w-full max-w-5xl rounded-[16px] border shadow-2xl flex flex-col max-h-[92vh] overflow-hidden transition-all"
        style={{ backgroundColor: surfaceBg, borderColor, color: textColor }}
      >
        {/* Modal Header */}
        <div
          className="flex flex-wrap items-center justify-between gap-3 border-b px-6 py-4"
          style={{ borderColor, backgroundColor: innerBg }}
        >
          <div className="flex items-center gap-3">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-[8px] border"
              style={{ backgroundColor: isDark ? "#382416" : "#DCD6F7", borderColor }}
            >
              <Scan className="h-5 w-5 text-[#dc5000]" />
            </div>
            <div>
              <h2 className="text-base font-medium uppercase tracking-tight" style={{ color: textColor }}>
                SCAN DIAGRAM & SCREENSHOT TO DFA
              </h2>
              <div className="flex items-center gap-2 text-[11px] font-mono" style={{ color: mutedText }}>
                <span>Multimodal State Machine Parser</span>
                <span>•</span>
                <span>Clipboard Paste (`Ctrl+V`) Support</span>
              </div>
            </div>
          </div>

          {/* Engine Selector Tabs */}
          <div className="flex items-center gap-2">
            <div className="flex rounded-[22.5px] border p-0.5" style={{ borderColor, backgroundColor: surfaceBg }}>
              <button
                onClick={() => setEngineMode("gemini")}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-mono rounded-[20px] transition-all cursor-pointer ${engineMode === "gemini"
                    ? "bg-[#dc5000] text-white font-bold shadow"
                    : "opacity-70 hover:opacity-100"
                  }`}
                style={{ color: engineMode === "gemini" ? "#fff" : textColor }}
              >

                <span>Vision AI (High Accuracy)</span>
              </button>
              <button
                onClick={() => setEngineMode("client_ocr")}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-mono rounded-[20px] transition-all cursor-pointer ${engineMode === "client_ocr"
                    ? "bg-[#382416] text-[#ffedd7] border border-[#40372e] font-bold"
                    : "opacity-70 hover:opacity-100"
                  }`}
                style={{ color: engineMode === "client_ocr" ? textColor : mutedText }}
              >

                <span>Offline Scanning(Low Accuracy)</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:opacity-80 transition-opacity cursor-pointer border"
              style={{ borderColor, color: mutedText }}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">

          {/* API Key Banner / Settings for Gemini Vision */}
          {engineMode === "gemini" && (!apiKey || showKeyPrompt) && (
            <div
              className="rounded-[12px] border p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md"
              style={{ backgroundColor: innerBg, borderColor: "#dc5000" }}
            >
              <div className="flex items-start gap-2.5">
                <Key className="h-5 w-5 text-[#dc5000] shrink-0 mt-0.5" />
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#dc5000]">
                    GEMINI VISION API KEY REQUIRED FOR 99.9% DIAGRAM ACCURACY
                  </span>
                  <p className="text-xs" style={{ color: mutedText }}>
                    Diagrams with circles, arrows & double rings require Multimodal Vision. Get a 100% free key from{" "}
                    <a
                      href="https://aistudio.google.com/app/apikey"
                      target="_blank"
                      rel="noreferrer"
                      className="underline font-bold text-[#dc5000] inline-flex items-center gap-0.5"
                    >
                      Google AI Studio <ExternalLink className="h-3 w-3 inline" />
                    </a>.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <input
                  type="password"
                  placeholder="Paste AI Studio API Key..."
                  value={apiKey}
                  onChange={(e) => handleSaveApiKey(e.target.value)}
                  className="bg-black/30 border rounded px-3 py-1.5 text-xs font-mono focus:outline-none focus:border-[#dc5000] w-full sm:w-64"
                  style={{ borderColor, color: textColor }}
                />
                {imageFile && (
                  <button
                    onClick={() => processImage(imageFile)}
                    className="px-4 py-1.5 rounded bg-[#dc5000] text-white text-xs font-bold hover:bg-[#b04000] cursor-pointer shrink-0"
                  >
                    Scan Now
                  </button>
                )}
              </div>
            </div>
          )}

          {/* View 1: Upload / Dropzone Screen */}
          {!imagePreviewUrl && !isProcessing && (
            <div className="flex flex-col gap-4">
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center gap-4 rounded-[12px] border-2 border-dashed p-10 text-center cursor-pointer transition-all hover:border-[#dc5000]"
                style={{ backgroundColor: innerBg, borderColor }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />

                <div
                  className="flex h-16 w-16 items-center justify-center rounded-full border shadow-lg"
                  style={{ backgroundColor: isDark ? "#382416" : "#DCD6F7", borderColor }}
                >
                  <Upload className="h-8 w-8 text-[#dc5000]" />
                </div>

                <div className="flex flex-col gap-1 max-w-md">
                  <span className="text-sm font-medium uppercase tracking-wider" style={{ color: textColor }}>
                    DROP DIAGRAM OR CLICK TO BROWSE
                  </span>
                  <p className="text-xs leading-relaxed" style={{ color: mutedText }}>
                    {engineMode === "gemini"
                      ? "Understands visual graph diagrams, circles, arrows, self-loops, double rings & handwriting."
                      : "Local OCR mode for printed transition tables & text definitions."}
                  </p>
                </div>

                {/* Direct Clipboard Paste Badge */}
                <div
                  className="inline-flex items-center gap-2 rounded-[22.5px] border px-4 py-2 text-xs font-mono"
                  style={{ backgroundColor: surfaceBg, borderColor, color: textColor }}
                >
                  <span className="text-[#dc5000] font-bold">INSTANT CLIPBOARD PASTE:</span>
                  <span>Press <kbd className="px-1.5 py-0.5 rounded border bg-black/40 font-bold">Ctrl + V</kbd> anywhere to paste screenshot</span>
                </div>
              </div>

              {/* Supported Diagram Formats Info Card */}
              <div
                className="rounded-[10px] border p-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono"
                style={{ backgroundColor: innerBg, borderColor }}
              >
                <div className="flex flex-col gap-1">
                  <span className="font-bold text-[#dc5000] uppercase">1. Visual State Graphs</span>
                  <span style={{ color: mutedText }}>Circle nodes (q₀, q₁), directed arrows, self-loops & double-ring accept states.</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="font-bold text-[#dc5000] uppercase">2. Transition Tables</span>
                  <span style={{ color: mutedText }}>Tabular rows (&rarr;q0, q1*) and column inputs (0, 1, a, b).</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="font-bold text-[#dc5000] uppercase">3. Problem Text & Regex</span>
                  <span style={{ color: mutedText }}>5-tuple math definitions or regular expressions like (a|b)*abb.</span>
                </div>
              </div>
            </div>
          )}

          {/* View 2: Scanning Progress Screen */}
          {isProcessing && (
            <div className="flex flex-col items-center justify-center gap-6 py-12 text-center">
              <div className="relative flex items-center justify-center">
                <div className="h-20 w-20 rounded-full border-4 border-dashed border-[#dc5000] animate-spin" />
                <Scan className="h-8 w-8 text-[#dc5000] absolute" />
              </div>

              <div className="flex flex-col gap-2 max-w-sm">
                <h3 className="text-base font-medium uppercase tracking-tight" style={{ color: textColor }}>
                  {engineMode === "gemini" ? "ANALYZING DIAGRAM WITH GEMINI VISION AI" : "RECOGNIZING CHARACTERS WITH LOCAL OCR"}
                </h3>
                <p className="text-xs font-mono" style={{ color: mutedText }}>
                  {progressStatus || "Analyzing graph topology..."}
                </p>
              </div>

              {/* Progress Bar */}
              <div className="w-full max-w-md bg-black/40 h-2 rounded-full overflow-hidden border" style={{ borderColor }}>
                <div
                  className="h-full bg-[#dc5000] transition-all duration-300 rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              <span className="text-xs font-mono font-bold" style={{ color: textColor }}>
                {progressPercent}% COMPLETE
              </span>
            </div>
          )}

          {/* View 3: Side-by-Side Visual Verification Screen */}
          {editableStates.length > 0 && !isProcessing && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Image Preview & Raw OCR */}
              <div className="lg:col-span-5 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium uppercase tracking-wider" style={{ color: dimText }}>
                    ORIGINAL SCREENSHOT
                  </span>
                  <button
                    onClick={handleResetScan}
                    className="text-[11px] font-mono text-[#dc5000] hover:underline cursor-pointer"
                  >
                    Scan Another Image
                  </button>
                </div>

                {imagePreviewUrl && (
                  <div
                    className="rounded-[10px] border p-2 overflow-hidden flex items-center justify-center max-h-[300px] bg-black/60 shadow-inner"
                    style={{ borderColor }}
                  >
                    <img
                      src={imagePreviewUrl}
                      alt="Uploaded Automaton Diagram"
                      className="max-h-[280px] w-auto object-contain rounded"
                    />
                  </div>
                )}

                {/* Detection Format Badge */}
                <div
                  className="rounded-[8px] border p-3 flex flex-col gap-1 text-xs font-mono"
                  style={{ backgroundColor: innerBg, borderColor }}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold uppercase text-[#dc5000]">
                      ENGINE: {engineMode === "gemini" ? "Gemini 2.0 Flash Vision" : "Local Tesseract OCR"}
                    </span>
                    <span className="text-emerald-400">
                      CONFIDENCE: {Math.round(confidenceScore * 100)}%
                    </span>
                  </div>
                  <p className="text-[11px] opacity-80" style={{ color: mutedText }}>
                    {notesSummary || "Extracted formal state machine topology."}
                  </p>
                </div>

                {/* Collapsible Raw text view */}
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => setShowRawOcr(!showRawOcr)}
                    className="flex items-center justify-between text-[11px] font-mono text-[#a69888] hover:text-[#ffedd7] py-1 border-b border-dashed"
                    style={{ borderColor }}
                  >
                    <span>{showRawOcr ? "HIDE RAW PARSE DATA ▲" : "VIEW RAW PARSE DATA ▼"}</span>
                    <FileText className="h-3 w-3" />
                  </button>
                  {showRawOcr && (
                    <pre
                      className="rounded-[6px] p-2.5 text-[10px] font-mono overflow-x-auto max-h-36 border whitespace-pre-wrap"
                      style={{ backgroundColor: innerBg, borderColor, color: mutedText }}
                    >
                      {rawOcrText || "No parse data recorded."}
                    </pre>
                  )}
                </div>
              </div>

              {/* Right Column: Extracted & Editable 5-Tuple Definition */}
              <div
                className="lg:col-span-7 rounded-[12px] border p-5 flex flex-col gap-5 shadow-lg"
                style={{ backgroundColor: innerBg, borderColor }}
              >
                <div className="flex items-center justify-between border-b border-dashed pb-3" style={{ borderColor }}>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    <span className="text-xs font-medium uppercase tracking-wider" style={{ color: textColor }}>
                      VERIFY & EDIT DETECTED 5-TUPLE
                    </span>
                  </div>
                  <span className="text-[10px] font-mono" style={{ color: dimText }}>
                    M = (Q, Σ, δ, q₀, F)
                  </span>
                </div>

                {/* States (Q) & Alphabet (Sigma) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* States Q */}
                  <div className="flex flex-col gap-2">
                    <label className="text-[11px] font-medium uppercase font-mono" style={{ color: mutedText }}>
                      States Q ({editableStates.length}):
                    </label>
                    <div className="flex flex-wrap gap-1.5 min-h-[32px] p-1.5 rounded border bg-black/20" style={{ borderColor }}>
                      {editableStates.map((st) => (
                        <span
                          key={st}
                          className="px-2 py-0.5 rounded font-mono text-xs border font-bold flex items-center gap-1"
                          style={{
                            backgroundColor: st === editableStartState ? "#382416" : surfaceBg,
                            borderColor: st === editableStartState ? "#dc5000" : borderColor,
                            color: textColor,
                          }}
                        >
                          {st === editableStartState ? "→" : ""}
                          {st}
                          {editableAcceptStates.includes(st) ? "*" : ""}
                          <button
                            onClick={() => {
                              setEditableStates((prev) => prev.filter((s) => s !== st));
                              setEditableTransitions((prev) => prev.filter((t) => t.from !== st && t.to !== st));
                              if (editableStartState === st) setEditableStartState(null);
                              setEditableAcceptStates((prev) => prev.filter((s) => s !== st));
                            }}
                            className="text-rose-400 hover:text-rose-300 ml-0.5 cursor-pointer text-[10px]"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-1">
                      <input
                        type="text"
                        placeholder="Add state (e.g. q2)"
                        value={newStateName}
                        onChange={(e) => setNewStateName(e.target.value)}
                        className="flex-1 bg-black/20 border rounded px-2 py-1 text-xs font-mono focus:outline-none"
                        style={{ borderColor, color: textColor }}
                      />
                      <button
                        onClick={handleAddState}
                        className="px-2.5 py-1 rounded bg-[#382416] border text-xs font-mono hover:bg-[#40372e] cursor-pointer"
                        style={{ borderColor, color: textColor }}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Alphabet Sigma */}
                  <div className="flex flex-col gap-2">
                    <label className="text-[11px] font-medium uppercase font-mono" style={{ color: mutedText }}>
                      Alphabet Σ ({editableAlphabet.length}):
                    </label>
                    <div className="flex flex-wrap gap-1.5 min-h-[32px] p-1.5 rounded border bg-black/20" style={{ borderColor }}>
                      {editableAlphabet.map((sym) => (
                        <span
                          key={sym}
                          className="px-2 py-0.5 rounded font-mono text-xs border font-bold flex items-center gap-1"
                          style={{ backgroundColor: surfaceBg, borderColor, color: textColor }}
                        >
                          {sym}
                          <button
                            onClick={() => {
                              setEditableAlphabet((prev) => prev.filter((s) => s !== sym));
                              setEditableTransitions((prev) => prev.filter((t) => t.symbol !== sym));
                            }}
                            className="text-rose-400 hover:text-rose-300 ml-0.5 cursor-pointer text-[10px]"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-1">
                      <input
                        type="text"
                        placeholder="Add symbol (e.g. 1)"
                        value={newAlphabetSym}
                        onChange={(e) => setNewAlphabetSym(e.target.value)}
                        className="flex-1 bg-black/20 border rounded px-2 py-1 text-xs font-mono focus:outline-none"
                        style={{ borderColor, color: textColor }}
                      />
                      <button
                        onClick={handleAddAlphabet}
                        className="px-2.5 py-1 rounded bg-[#382416] border text-xs font-mono hover:bg-[#40372e] cursor-pointer"
                        style={{ borderColor, color: textColor }}
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                {/* Start State & Accept States Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  {/* Start State */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-medium uppercase font-mono" style={{ color: mutedText }}>
                      Start State (q₀):
                    </label>
                    <select
                      value={editableStartState || ""}
                      onChange={(e) => setEditableStartState(e.target.value)}
                      className="w-full bg-black/20 border rounded px-2 py-1.5 text-xs font-mono focus:outline-none cursor-pointer"
                      style={{ borderColor, color: textColor }}
                    >
                      {editableStates.map((st) => (
                        <option key={st} value={st} className="bg-[#1a1007]">
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Accept States */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-medium uppercase font-mono" style={{ color: mutedText }}>
                      Accept States F (Click to Toggle):
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {editableStates.map((st) => {
                        const isAcc = editableAcceptStates.includes(st);
                        return (
                          <button
                            key={st}
                            onClick={() => handleToggleAcceptState(st)}
                            className={`px-2 py-1 rounded text-xs font-mono font-bold border transition-all cursor-pointer ${isAcc ? "bg-emerald-950 border-emerald-600 text-emerald-200" : "bg-black/20 opacity-60"
                              }`}
                            style={{ borderColor: isAcc ? undefined : borderColor }}
                          >
                            {st}*
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Transitions Table */}
                <div className="flex flex-col gap-2 pt-2 border-t border-dashed" style={{ borderColor }}>
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-medium uppercase font-mono" style={{ color: mutedText }}>
                      Transitions δ ({editableTransitions.length}):
                    </label>
                  </div>

                  {/* Transitions List */}
                  <div className="max-h-36 overflow-y-auto rounded border bg-black/20 p-2 flex flex-col gap-1.5 font-mono text-xs" style={{ borderColor }}>
                    {editableTransitions.map((t, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between px-2 py-1 rounded bg-black/30 border"
                        style={{ borderColor }}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#dc5000]">{t.from}</span>
                          <span className="opacity-75">--{t.symbol}&rarr;</span>
                          <span className="font-bold text-amber-300">{t.to}</span>
                        </div>
                        <button
                          onClick={() => handleDeleteTransition(idx)}
                          className="text-rose-400 hover:text-rose-300 p-0.5 cursor-pointer"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                    {editableTransitions.length === 0 && (
                      <div className="text-center py-2 text-xs opacity-60" style={{ color: mutedText }}>
                        No transitions recorded. Add transitions below.
                      </div>
                    )}
                  </div>

                  {/* Add Transition Row */}
                  <div className="grid grid-cols-12 gap-1.5 pt-1">
                    <select
                      value={newFromState}
                      onChange={(e) => setNewFromState(e.target.value)}
                      className="col-span-4 bg-black/20 border rounded px-1.5 py-1 text-xs font-mono focus:outline-none"
                      style={{ borderColor, color: textColor }}
                    >
                      {editableStates.map((s) => (
                        <option key={s} value={s} className="bg-[#1a1007]">
                          From: {s}
                        </option>
                      ))}
                    </select>

                    <input
                      type="text"
                      placeholder="Sym"
                      value={newSymbol}
                      onChange={(e) => setNewSymbol(e.target.value)}
                      className="col-span-3 bg-black/20 border rounded px-1.5 py-1 text-xs font-mono focus:outline-none text-center"
                      style={{ borderColor, color: textColor }}
                    />

                    <select
                      value={newToState}
                      onChange={(e) => setNewToState(e.target.value)}
                      className="col-span-4 bg-black/20 border rounded px-1.5 py-1 text-xs font-mono focus:outline-none"
                      style={{ borderColor, color: textColor }}
                    >
                      {editableStates.map((s) => (
                        <option key={s} value={s} className="bg-[#1a1007]">
                          To: {s}
                        </option>
                      ))}
                    </select>

                    <button
                      onClick={handleAddTransition}
                      className="col-span-1 flex items-center justify-center rounded bg-[#382416] border text-xs font-bold hover:bg-[#40372e] cursor-pointer"
                      style={{ borderColor, color: textColor }}
                      title="Add Transition"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {errorMessage && (
            <div className="flex items-center gap-2.5 rounded-[8px] border border-rose-800 bg-rose-950/40 p-3 text-xs text-rose-200">
              <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div
          className="flex items-center justify-between border-t px-6 py-4"
          style={{ borderColor, backgroundColor: innerBg }}
        >
          <button
            onClick={onClose}
            className="rounded-[22.5px] border px-5 py-2 text-xs font-medium uppercase transition-opacity hover:opacity-80 cursor-pointer"
            style={{ borderColor, color: mutedText }}
          >
            CANCEL
          </button>

          {editableStates.length > 0 && !isProcessing && (
            <button
              onClick={handleConfirmImport}
              className="inline-flex items-center gap-2 rounded-[36px] px-7 py-2.5 text-xs font-medium uppercase tracking-wider transition-all cursor-pointer border shadow-xl hover:opacity-95"
              style={{
                backgroundColor: isDark ? "#382416" : "#424874",
                borderColor: isDark ? "#dc5000" : "#424874",
                color: isDark ? "#ffedd7" : "#F4EEFF",
              }}
            >
              <Scan className="h-4 w-4 text-[#dc5000]" />
              <span>LOAD INTO STUDIO CANVAS</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
