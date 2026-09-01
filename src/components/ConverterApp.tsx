import React, { useState, useEffect, useRef, useCallback } from "react";
import cytoscape from "cytoscape";
import {
  Zap,
  Plus,
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Download,
  Maximize2,
  BookOpen,
  ArrowRight,
  MousePointer,
  HelpCircle,
  Video,
  ListFilter,
  Trash2,
  AlertTriangle,
  Link,
  Edit2,
  X,
  Check,
  SkipForward,
  SkipBack,
  Repeat,
  Scan,
  Camera
} from "lucide-react";
import { Automaton, parseRegexToNFA, parseSimpleTextToAutomaton } from "../core/automaton";
import { ConversionStep, TheoreticalBreakdown } from "../types/automaton";
import { ConversionPlayer } from "./ConversionPlayer";
import { TheoreticalSummary } from "./TheoreticalSummary";
import { VisionScannerModal } from "./VisionScannerModal";

interface ConverterAppProps {
  initialAutomaton?: Automaton;
  onAutomatonChange?: (auto: Automaton) => void;
  isDark?: boolean;
}

export const ConverterApp: React.FC<ConverterAppProps> = ({
  initialAutomaton,
  onAutomatonChange,
  isDark = true,
}) => {
  const [automaton, setAutomaton] = useState<Automaton>(() =>
    initialAutomaton ? initialAutomaton.clone() : new Automaton()
  );
  const [activeTab, setActiveTab] = useState<"quick" | "regex" | "text" | "image">("quick");

  // Inputs
  const [newStateName, setNewStateName] = useState("");
  const [newSymbol, setNewSymbol] = useState("");
  const [regexInput, setRegexInput] = useState("(a|b)*abb");
  const [simpleTextInput, setSimpleTextInput] = useState(
    "->q0\nq0 --a--> q1\nq0 --b--> q0\nq1 --b--> q2\nq2 --b--> q3\nq3*"
  );

  // String Simulator State
  const [testString, setTestString] = useState("abb");
  const [testResult, setTestResult] = useState<{
    accepted: boolean;
    details: string;
    path: { state: string; symbolConsumed: string; nextState: string }[];
    finalState: string;
  } | null>(null);
  const [currentSimStepIndex, setCurrentSimStepIndex] = useState<number>(-1);
  const [isSimPlaying, setIsSimPlaying] = useState<boolean>(false);
  const simTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Conversion & Walkthrough
  const [conversionSteps, setConversionSteps] = useState<ConversionStep[] | null>(null);
  const [showPlayer, setShowPlayer] = useState(false);
  const [theoryBreakdown, setTheoryBreakdown] = useState<TheoreticalBreakdown | null>(null);
  const [conversionType, setConversionType] = useState<"NFA_TO_DFA" | "MINIMIZE_DFA" | "GENERAL">("GENERAL");
  const [showTheoryModal, setShowTheoryModal] = useState(false);
  const [showScannerModal, setShowScannerModal] = useState(false);

  // Interactive Tools & State Linking
  const [activeTool, setActiveTool] = useState<"select" | "connect" | "delete">("select");
  const [selectedSourceState, setSelectedSourceState] = useState<string | null>(null);
  const [showConnectModal, setShowConnectModal] = useState<{ from: string; to: string } | null>(null);
  const [connectSymbolInput, setConnectSymbolInput] = useState("a");

  // Quick connect dropdown states in toolbox
  const [manualFrom, setManualFrom] = useState<string>("");
  const [manualTo, setManualTo] = useState<string>("");
  const [manualSymbol, setManualSymbol] = useState<string>("a");

  // Delete State Confirmation Modal with Consequences
  const [stateToDelete, setStateToDelete] = useState<string | null>(null);

  // Transition Table Inline Editing State
  const [editingStateName, setEditingStateName] = useState<{ original: string; current: string } | null>(null);
  const [editingCell, setEditingCell] = useState<{ from: string; symbol: string; text: string } | null>(null);
  const [newTableSymbolInput, setNewTableSymbolInput] = useState<string>("");
  const [showAddSymbolPopover, setShowAddSymbolPopover] = useState<boolean>(false);
  const [showEpsilonColumn, setShowEpsilonColumn] = useState<boolean>(false);

  const cyContainerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);

  // Mutable refs to solve closure issues in event listeners
  const selectedSourceRef = useRef<string | null>(null);
  const activeToolRef = useRef<"select" | "connect" | "delete">("select");
  const automatonRef = useRef<Automaton>(automaton);
  const finalConversionAutoRef = useRef<Automaton | null>(null);

  useEffect(() => {
    selectedSourceRef.current = selectedSourceState;
  }, [selectedSourceState]);

  useEffect(() => {
    activeToolRef.current = activeTool;
  }, [activeTool]);

  useEffect(() => {
    automatonRef.current = automaton;
    if (automaton.states.length > 0) {
      if (!manualFrom || !automaton.states.includes(manualFrom)) {
        setManualFrom(automaton.startState || automaton.states[0]);
      }
      if (!manualTo || !automaton.states.includes(manualTo)) {
        setManualTo(automaton.states[0]);
      }
    }
  }, [automaton, manualFrom, manualTo]);

  // Layout calculations
  const applyHorizontalRankLayout = useCallback((cyInstance: cytoscape.Core, auto: Automaton) => {
    if (!cyInstance || auto.states.length === 0) return;

    const ranks = new Map<string, number>();
    const start = auto.startState || auto.states[0];

    const visited = new Set<string>();
    const queue: { state: string; rank: number }[] = [{ state: start, rank: 0 }];
    visited.add(start);
    ranks.set(start, 0);

    while (queue.length > 0) {
      const { state, rank } = queue.shift()!;
      for (const t of auto.transitions.filter((tr) => tr.from === state)) {
        if (!visited.has(t.to)) {
          visited.add(t.to);
          ranks.set(t.to, rank + 1);
          queue.push({ state: t.to, rank: rank + 1 });
        }
      }
    }

    auto.states.forEach((s) => {
      if (!ranks.has(s)) {
        let maxRank = 0;
        ranks.forEach((r) => {
          if (r > maxRank) maxRank = r;
        });
        ranks.set(s, maxRank + 1);
      }
    });

    const rankGroups = new Map<number, string[]>();
    ranks.forEach((rank, state) => {
      if (!rankGroups.has(rank)) rankGroups.set(rank, []);
      rankGroups.get(rank)!.push(state);
    });

    const xSpacing = 160;
    const ySpacing = 110;
    const startX = 140;
    const startY = 160;

    rankGroups.forEach((groupStates, rank) => {
      const totalInRank = groupStates.length;
      groupStates.forEach((state, idx) => {
        const node = cyInstance.getElementById(state);
        if (node.length > 0) {
          const x = startX + rank * xSpacing;
          const y = startY + (idx - (totalInRank - 1) / 2) * ySpacing;
          node.position({ x, y });
        }
      });
    });

      // Position virtual start arrow
      const startNode = cyInstance.getElementById(start);
      const virtualStart = cyInstance.getElementById("__start_arrow__");
      if (startNode.length > 0 && virtualStart.length > 0) {
        const pos = startNode.position();
        virtualStart.position({ x: pos.x - 70, y: pos.y });
      }

      // Safe fit with bounded zoom
      cyInstance.fit(undefined, 50);
      if (cyInstance.zoom() > 1.15) {
        cyInstance.zoom(1.0);
        cyInstance.center();
      }
    },
    []
  );

  // Dynamic Cytoscape Theme Stylesheet Builder
  const getCyStyle = useCallback((dark: boolean) => {
    const nodeBg = dark ? "#382416" : "#FFFFFF";
    const nodeBorder = dark ? "#ffedd7" : "#424874";
    const textColor = dark ? "#ffedd7" : "#424874";
    const edgeColor = dark ? "#ffedd7" : "#424874";
    const textBgColor = dark ? "#100904" : "#FFFFFF";

    return [
      {
        selector: "node",
        style: {
          label: "data(label)",
          "text-valign": "center",
          "text-halign": "center",
          "background-color": nodeBg,
          color: textColor,
          "font-family": "JetBrains Mono, monospace",
          "font-size": "13px",
          "font-weight": "bold",
          width: "48px",
          height: "48px",
          "border-width": "2.5px",
          "border-color": nodeBorder,
          "transition-property": "background-color, border-color, width, height, border-width, color",
          "transition-duration": 0.25,
        },
      },
      {
        selector: "node.start-state",
        style: {
          "background-color": dark ? "#100904" : "#424874",
          color: dark ? "#ffedd7" : "#FFFFFF",
          "border-color": dark ? "#ffedd7" : "#424874",
          "border-width": "3px",
        },
      },
      {
        selector: "node.accept-state",
        style: {
          "background-color": nodeBg,
          color: textColor,
          "border-style": "double",
          "border-width": "6px",
          "border-color": nodeBorder,
        },
      },
      {
        selector: "node.virtual-start",
        style: {
          width: "1px",
          height: "1px",
          opacity: 0,
          label: "",
        },
      },
      {
        selector: "node.selected-source",
        style: {
          "background-color": "#dc5000",
          "border-color": dark ? "#ffedd7" : "#424874",
          "border-width": "4px",
          color: "#FFFFFF",
        },
      },
      {
        selector: "edge",
        style: {
          label: "data(label)",
          "curve-style": "bezier",
          "target-arrow-shape": "triangle",
          "target-arrow-color": edgeColor,
          "line-color": edgeColor,
          width: 2,
          "font-family": "JetBrains Mono, monospace",
          "font-size": "12px",
          "font-weight": "bold",
          color: textColor,
          "text-background-color": textBgColor,
          "text-background-opacity": 0.95,
          "text-background-padding": "2px",
          "text-background-shape": "roundrectangle",
          "arrow-scale": 1.2,
          "loop-direction": "-45deg",
          "loop-sweep": "-90deg",
          "control-point-step-size": 35,
          "transition-property": "line-color, target-arrow-color, width, control-point-step-size, color",
          "transition-duration": 0.25,
        },
      },
      {
        selector: "edge.start-arrow",
        style: {
          width: 2.5,
          "line-color": edgeColor,
          "target-arrow-color": edgeColor,
          "target-arrow-shape": "triangle",
          "arrow-scale": 1.4,
          label: "",
        },
      },
      {
        selector: "node.highlighted-source-node",
        style: {
          "background-color": dark ? "#ffedd7" : "#DCD6F7",
          "border-color": "#dc5000",
          "border-width": "5px",
          color: dark ? "#100904" : "#424874",
          width: "52px",
          height: "52px",
        },
      },
      {
        selector: "node.highlighted-node",
        style: {
          "background-color": "#dc5000",
          "border-color": dark ? "#ffedd7" : "#424874",
          "border-width": "5px",
          color: "#FFFFFF",
          width: "52px",
          height: "52px",
        },
      },
      {
        selector: "node.self-loop-pulse",
        style: {
          "background-color": "#dc5000",
          "border-color": dark ? "#ffedd7" : "#424874",
          "border-width": "6px",
          color: "#FFFFFF",
          width: "58px",
          height: "58px",
        },
      },
      {
        selector: "edge.highlighted-edge",
        style: {
          "line-color": "#dc5000",
          "target-arrow-color": "#dc5000",
          width: 3.5,
          "arrow-scale": 1.5,
        },
      },
      {
        selector: "edge.self-loop-active",
        style: {
          "line-color": "#dc5000",
          "target-arrow-color": "#dc5000",
          width: 4.5,
          "arrow-scale": 1.8,
          "control-point-step-size": 55,
        },
      },
    ];
  }, []);

  // Update Cytoscape Graph
  const updateCytoscape = useCallback(() => {
    if (!cyContainerRef.current) return;

    if (!cyRef.current) {
      cyRef.current = cytoscape({
        container: cyContainerRef.current,
        maxZoom: 1.35,
        minZoom: 0.2,
        wheelSensitivity: 0.2,
        style: getCyStyle(isDark) as any,
        layout: { name: "preset" },
        userZoomingEnabled: true,
        userPanningEnabled: true,
      });

      // Canvas click listener using mutable refs
      cyRef.current.on("tap", (evt) => {
        if (evt.target === cyRef.current) {
          selectedSourceRef.current = null;
          setSelectedSourceState(null);
        } else if (evt.target.isNode()) {
          const clickedId = evt.target.id();
          if (clickedId === "__start_arrow__") return;

          const tool = activeToolRef.current;
          const currentSource = selectedSourceRef.current;

          if (tool === "delete") {
            setStateToDelete(clickedId);
          } else {
            if (!currentSource) {
              selectedSourceRef.current = clickedId;
              setSelectedSourceState(clickedId);
            } else {
              const fromState = currentSource;
              const toState = clickedId;
              selectedSourceRef.current = null;
              setSelectedSourceState(null);
              setShowConnectModal({ from: fromState, to: toState });
            }
          }
        }
      });
    }

    const cy = cyRef.current;
    cy.style(getCyStyle(isDark) as any).update();
    cy.elements().remove();

    // Add nodes
    automaton.states.forEach((st) => {
      const isStart = st === automaton.startState;
      const isAccept = automaton.acceptStates.includes(st);
      let classes = "";
      if (isStart) classes += " start-state";
      if (isAccept) classes += " accept-state";
      if (st === selectedSourceState) classes += " selected-source";

      cy.add({
        group: "nodes",
        data: { id: st, label: st },
        classes: classes.trim(),
      });
    });

    // Add virtual start arrow node & edge
    if (automaton.startState) {
      cy.add({
        group: "nodes",
        data: { id: "__start_arrow__", label: "" },
        classes: "virtual-start",
      });
      cy.add({
        group: "edges",
        data: { id: "__edge_start__", source: "__start_arrow__", target: automaton.startState, label: "" },
        classes: "start-arrow",
      });
    }

    // Group multi-edges between same source and target
    const edgeMap = new Map<string, string[]>();
    automaton.transitions.forEach((t) => {
      const key = `${t.from}__${t.to}`;
      if (!edgeMap.has(key)) edgeMap.set(key, []);
      edgeMap.get(key)!.push(t.symbol || "ε");
    });

    let edgeIdx = 0;
    edgeMap.forEach((syms, key) => {
      const [from, to] = key.split("__");
      const combinedLabel = Array.from(new Set(syms)).join(", ");
      cy.add({
        group: "edges",
        data: { id: `e_${from}_${to}`, source: from, target: to, label: combinedLabel },
      });
    });

    applyHorizontalRankLayout(cy, automaton);
  }, [automaton, selectedSourceState, activeTool, isDark, applyHorizontalRankLayout]);

  useEffect(() => {
    updateCytoscape();
  }, [updateCytoscape]);

  // Handle Drag & Drop onto Canvas
  const handleDropOnCanvas = (e: React.DragEvent) => {
    e.preventDefault();
    const tool = e.dataTransfer.getData("text/plain");
    if (!tool || !cyContainerRef.current || !cyRef.current) return;

    const nextName = `q${automaton.states.length}`;
    const updated = automaton.clone();

    if (tool === "state") {
      updated.states.push(nextName);
      if (!updated.startState) updated.startState = nextName;
    } else if (tool === "start_state") {
      updated.states.push(nextName);
      updated.startState = nextName;
    } else if (tool === "accept_state") {
      updated.states.push(nextName);
      updated.acceptStates.push(nextName);
      if (!updated.startState) updated.startState = nextName;
    } else if (tool === "connect_arrow") {
      setActiveTool("connect");
    }

    setAutomaton(updated);
    onAutomatonChange?.(updated);
  };

  // Add Transition Confirmation
  const handleConfirmConnect = (from?: string, to?: string, symbol?: string) => {
    const fromState = from || showConnectModal?.from;
    const toState = to || showConnectModal?.to;
    const sym = (symbol !== undefined ? symbol : connectSymbolInput).trim() || "ε";

    if (!fromState || !toState) return;

    const updated = automaton.clone();
    if (sym && !updated.alphabet.includes(sym) && sym !== "ε" && sym !== "e") {
      updated.alphabet.push(sym);
    }
    // Prevent exact duplicate transition
    if (!updated.transitions.some((t) => t.from === fromState && t.to === toState && t.symbol === sym)) {
      updated.transitions.push({ from: fromState, symbol: sym, to: toState });
    }

    setAutomaton(updated);
    onAutomatonChange?.(updated);
    setShowConnectModal(null);
    setConnectSymbolInput("a");
  };

  // Delete State with Full Consequence Confirmation
  const handleConfirmDeleteState = () => {
    if (!stateToDelete) return;
    const target = stateToDelete;
    const updated = automaton.clone();

    updated.states = updated.states.filter((s) => s !== target);
    updated.acceptStates = updated.acceptStates.filter((s) => s !== target);
    updated.transitions = updated.transitions.filter((t) => t.from !== target && t.to !== target);
    if (updated.startState === target) {
      updated.startState = updated.states.length > 0 ? updated.states[0] : null;
    }

    setAutomaton(updated);
    onAutomatonChange?.(updated);
    setStateToDelete(null);
    selectedSourceRef.current = null;
    setSelectedSourceState(null);
  };

  // Conversions
  const handleConvertNfaToDfa = () => {
    const { dfa, steps, theory } = automaton.toDFA();
    finalConversionAutoRef.current = dfa;
    setAutomaton(dfa);
    onAutomatonChange?.(dfa);
    setConversionSteps(steps);
    setTheoryBreakdown(theory);
    setConversionType("NFA_TO_DFA");
    setShowPlayer(true);

    // Reset simulation state
    setTestResult(null);
    setCurrentSimStepIndex(-1);
    setIsSimPlaying(false);
    if (simTimerRef.current) clearTimeout(simTimerRef.current);
  };

  const handleMinimizeDfa = () => {
    let base = automaton;
    if (automaton.isNFA()) {
      const { dfa } = automaton.toDFA();
      base = dfa;
    }
    const { minDFA, steps, theory } = base.minimizeDFA();
    finalConversionAutoRef.current = minDFA;
    setAutomaton(minDFA);
    onAutomatonChange?.(minDFA);
    setConversionSteps(steps);
    setTheoryBreakdown(theory);
    setConversionType("MINIMIZE_DFA");
    setShowPlayer(true);

    // Reset simulation state
    setTestResult(null);
    setCurrentSimStepIndex(-1);
    setIsSimPlaying(false);
    if (simTimerRef.current) clearTimeout(simTimerRef.current);

    // Auto-align test string if characters don't match alphabet
    if (minDFA.alphabet.length > 0 && !minDFA.alphabet.some((s) => testString.includes(s))) {
      if (minDFA.alphabet.includes("0") || minDFA.alphabet.includes("1")) {
        setTestString("0101");
      } else {
        setTestString(minDFA.alphabet.slice(0, 3).join(""));
      }
    }
  };

  const handleApplyFinalConversion = () => {
    setShowPlayer(false);
    if (finalConversionAutoRef.current) {
      setAutomaton(finalConversionAutoRef.current);
      onAutomatonChange?.(finalConversionAutoRef.current);
      setTestResult(null);
      setCurrentSimStepIndex(-1);
      setIsSimPlaying(false);
      if (simTimerRef.current) clearTimeout(simTimerRef.current);
    }
  };

  const handleClear = () => {
    const fresh = new Automaton({ states: [], alphabet: [], transitions: [], startState: null, acceptStates: [] });
    setAutomaton(fresh);
    onAutomatonChange?.(fresh);
    setConversionSteps(null);
    setShowPlayer(false);
    setTestResult(null);
    setCurrentSimStepIndex(-1);
    setIsSimPlaying(false);
    selectedSourceRef.current = null;
    setSelectedSourceState(null);
  };

  const handleImportScannedAutomaton = (scannedAuto: Automaton) => {
    setAutomaton(scannedAuto);
    onAutomatonChange?.(scannedAuto);
    setActiveTab("quick");
    setConversionSteps(null);
    setShowPlayer(false);
    setTheoryBreakdown(null);
    setTestResult(null);
    setCurrentSimStepIndex(-1);
    setIsSimPlaying(false);
    selectedSourceRef.current = null;
    setSelectedSourceState(null);

    setTimeout(() => {
      if (cyRef.current) {
        cyRef.current.resize();
        applyHorizontalRankLayout(cyRef.current, scannedAuto);
      }
    }, 60);
  };

  // Handle Table Cell Change
  const handleUpdateCellTransition = (fromState: string, symbol: string, targetState: string) => {
    const updated = automaton.clone();
    // Remove existing transitions for this (fromState, symbol)
    updated.transitions = updated.transitions.filter(
      (t) => !(t.from === fromState && (t.symbol === symbol || (symbol === "ε" && (t.symbol === "ε" || t.symbol === "e" || t.symbol === ""))))
    );
    if (targetState && targetState !== "__none__" && targetState !== "") {
      updated.transitions.push({ from: fromState, symbol, to: targetState });
    }
    setAutomaton(updated);
    onAutomatonChange?.(updated);
    setTestResult(null);
    setCurrentSimStepIndex(-1);
  };

  // Handle Multi-target Text Submit
  const handleCellTextSubmit = (fromState: string, symbol: string, text: string) => {
    const updated = automaton.clone();
    updated.transitions = updated.transitions.filter(
      (t) => !(t.from === fromState && (t.symbol === symbol || (symbol === "ε" && (t.symbol === "ε" || t.symbol === "e" || t.symbol === ""))))
    );
    const targets = text
      .split(/[,\s]+/)
      .map((t) => t.trim())
      .filter((t) => t.length > 0 && updated.states.includes(t));
    targets.forEach((tgt) => {
      updated.transitions.push({ from: fromState, symbol, to: tgt });
    });
    setAutomaton(updated);
    onAutomatonChange?.(updated);
    setEditingCell(null);
    setTestResult(null);
    setCurrentSimStepIndex(-1);
  };

  // Toggle Start State
  const handleToggleStartState = (state: string) => {
    const updated = automaton.clone();
    updated.startState = state;
    setAutomaton(updated);
    onAutomatonChange?.(updated);
  };

  // Toggle Accept State
  const handleToggleAcceptState = (state: string) => {
    const updated = automaton.clone();
    if (updated.acceptStates.includes(state)) {
      updated.acceptStates = updated.acceptStates.filter((s) => s !== state);
    } else {
      updated.acceptStates.push(state);
    }
    setAutomaton(updated);
    onAutomatonChange?.(updated);
  };

  // Rename State
  const handleConfirmRenameState = () => {
    if (!editingStateName) return;
    const { original, current } = editingStateName;
    const clean = current.trim();
    if (!clean || clean === original || automaton.states.includes(clean)) {
      setEditingStateName(null);
      return;
    }
    const updated = automaton.clone();
    updated.states = updated.states.map((s) => (s === original ? clean : s));
    updated.transitions = updated.transitions.map((t) => ({
      from: t.from === original ? clean : t.from,
      symbol: t.symbol,
      to: t.to === original ? clean : t.to,
    }));
    if (updated.startState === original) updated.startState = clean;
    updated.acceptStates = updated.acceptStates.map((s) => (s === original ? clean : s));
    setAutomaton(updated);
    onAutomatonChange?.(updated);
    setEditingStateName(null);
  };

  // Add State from Table
  const handleAddStateFromTable = () => {
    let nextIdx = automaton.states.length;
    let candidate = `q${nextIdx}`;
    while (automaton.states.includes(candidate)) {
      nextIdx++;
      candidate = `q${nextIdx}`;
    }
    const updated = automaton.clone();
    updated.states.push(candidate);
    if (!updated.startState) updated.startState = candidate;
    setAutomaton(updated);
    onAutomatonChange?.(updated);
  };

  // Add Symbol from Table
  const handleAddSymbolFromTable = () => {
    const sym = newTableSymbolInput.trim();
    if (!sym || automaton.alphabet.includes(sym)) {
      setShowAddSymbolPopover(false);
      setNewTableSymbolInput("");
      return;
    }
    const updated = automaton.clone();
    updated.alphabet.push(sym);
    setAutomaton(updated);
    onAutomatonChange?.(updated);
    setNewTableSymbolInput("");
    setShowAddSymbolPopover(false);
  };

  // Remove Symbol from Table
  const handleRemoveSymbolFromTable = (sym: string) => {
    const updated = automaton.clone();
    updated.alphabet = updated.alphabet.filter((s) => s !== sym);
    updated.transitions = updated.transitions.filter((t) => t.symbol !== sym);
    setAutomaton(updated);
    onAutomatonChange?.(updated);
  };

  // Animate Simulation Step on Cytoscape Graph
  const highlightSimStep = useCallback((stepIdx: number, resultData: typeof testResult) => {
    if (!cyRef.current || !resultData) return;
    const cy = cyRef.current;

    // Reset previous highlights
    cy.nodes().removeClass("highlighted-node highlighted-source-node self-loop-pulse");
    cy.edges().removeClass("highlighted-edge self-loop-active");

    if (stepIdx < 0) {
      // Highlight start state
      if (automaton.startState) {
        cy.getElementById(automaton.startState).addClass("highlighted-node");
      }
      return;
    }

    const step = resultData.path[stepIdx];
    if (!step) {
      // String rejected on step 0: pulse start state as dead end indicator
      if (automaton.startState) {
        cy.getElementById(automaton.startState).addClass("self-loop-pulse");
      }
      return;
    }

    const isSelfLoop = step.state === step.nextState;

    if (isSelfLoop) {
      // Highlight self-loop edge with distinct vibration
      const edgeId = `e_${step.state}_${step.nextState}`;
      const edge = cy.getElementById(edgeId);
      if (edge.length > 0) {
        edge.addClass("self-loop-active");
      } else {
        cy.edges(`[source = "${step.state}"][target = "${step.nextState}"]`).addClass("self-loop-active");
      }
      const node = cy.getElementById(step.state);
      if (node.length > 0) {
        node.addClass("self-loop-pulse");
        // Ripple bounce
        setTimeout(() => {
          node.removeClass("self-loop-pulse");
          setTimeout(() => node.addClass("self-loop-pulse"), 100);
        }, 150);
      }
    } else {
      // Highlight source node
      const sourceNode = cy.getElementById(step.state);
      if (sourceNode.length > 0) {
        sourceNode.addClass("highlighted-source-node");
      }
      // Highlight transition edge & target node
      const edgeId = `e_${step.state}_${step.nextState}`;
      const edge = cy.getElementById(edgeId);
      if (edge.length > 0) {
        edge.addClass("highlighted-edge");
      } else {
        cy.edges(`[source = "${step.state}"][target = "${step.nextState}"]`).addClass("highlighted-edge");
      }
      const targetNode = cy.getElementById(step.nextState);
      if (targetNode.length > 0) {
        targetNode.addClass("highlighted-node");
      }
    }
  }, [automaton.startState]);

  // Run or Initialize String Simulation
  const handleRunTestString = () => {
    const res = automaton.simulateString(testString);
    setTestResult(res);
    setCurrentSimStepIndex(0);
    setIsSimPlaying(true);
    highlightSimStep(0, res);
  };

  // Playback Auto-Stepper
  useEffect(() => {
    if (!isSimPlaying || !testResult || testResult.path.length === 0) return;

    simTimerRef.current = setTimeout(() => {
      if (currentSimStepIndex < testResult.path.length - 1) {
        const nextIdx = currentSimStepIndex + 1;
        setCurrentSimStepIndex(nextIdx);
        highlightSimStep(nextIdx, testResult);
      } else {
        setIsSimPlaying(false);
      }
    }, 900);

    return () => {
      if (simTimerRef.current) clearTimeout(simTimerRef.current);
    };
  }, [isSimPlaying, currentSimStepIndex, testResult, highlightSimStep]);

  // Consequence metrics for state deletion
  const incomingTransitionsCount = stateToDelete
    ? automaton.transitions.filter((t) => t.to === stateToDelete).length
    : 0;
  const outgoingTransitionsCount = stateToDelete
    ? automaton.transitions.filter((t) => t.from === stateToDelete).length
    : 0;
  const isTargetStartState = stateToDelete === automaton.startState;
  const isTargetAcceptState = stateToDelete ? automaton.acceptStates.includes(stateToDelete) : false;

  const currentStepData = testResult && currentSimStepIndex >= 0 && currentSimStepIndex < testResult.path.length
    ? testResult.path[currentSimStepIndex]
    : null;
  const isCurrentStepSelfLoop = currentStepData ? currentStepData.state === currentStepData.nextState : false;

  const primaryBg = isDark ? "#100904" : "#F4EEFF";
  const surfaceBg = isDark ? "#1a1007" : "#FFFFFF";
  const innerBg = isDark ? "#100904" : "#F8F6FF";
  const elevatedBg = isDark ? "#382416" : "#DCD6F7";
  const borderColor = isDark ? "#40372e" : "#DCD6F7";
  const textColor = isDark ? "#ffedd7" : "#424874";
  const mutedText = isDark ? "#a69888" : "#5f6594";
  const dimText = isDark ? "#6c5f51" : "#8b92be";

  return (
    <div 
      className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 lg:p-6 transition-colors duration-200"
      style={{ color: textColor }}
    >
      
      {/* Top Action Header Bar */}
      <div 
        className="flex flex-wrap items-center justify-between gap-4 rounded-[12px] border p-4 shadow-sm"
        style={{ backgroundColor: surfaceBg, borderColor }}
      >
        
        {/* Preset Selector */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium uppercase tracking-wider" style={{ color: mutedText }}>
            PRESET:
          </span>
          <select
            onChange={(e) => {
              const val = e.target.value;
              if (val === "regex_sample") {
                const auto = parseRegexToNFA("(a|b)*abb");
                setAutomaton(auto);
                onAutomatonChange?.(auto);
                setRegexInput("(a|b)*abb");
                setTestString("abb");
                setTestResult(null);
                setCurrentSimStepIndex(-1);
                setShowPlayer(false);
                setConversionSteps(null);
              } else if (val === "nfa_sample") {
                const auto = parseSimpleTextToAutomaton(
                  "->q0\nq0 --a--> q0\nq0 --b--> q0\nq0 --a--> q1\nq1 --b--> q2\nq2*"
                );
                setAutomaton(auto);
                onAutomatonChange?.(auto);
                setTestString("abb");
                setTestResult(null);
                setCurrentSimStepIndex(-1);
                setShowPlayer(false);
                setConversionSteps(null);
              } else if (val === "dfa_minimization") {
                const auto = parseSimpleTextToAutomaton(
                  "->A\nA --0--> B\nA --1--> C\nB --0--> A\nB --1--> D\nC* --0--> E\nC* --1--> F\nD* --0--> E\nD* --1--> F\nE* --0--> E\nE* --1--> F\nF* --0--> F\nF* --1--> F"
                );
                setAutomaton(auto);
                onAutomatonChange?.(auto);
                setTestString("0101");
                setTestResult(null);
                setCurrentSimStepIndex(-1);
                setShowPlayer(false);
                setConversionSteps(null);
              }
            }}
            className="rounded-[22.5px] border px-4 py-1.5 font-mono text-xs focus:outline-none cursor-pointer"
            style={{ backgroundColor: innerBg, borderColor, color: textColor }}
            defaultValue=""
          >
            <option value="" disabled>Load Preset Automaton...</option>
            <option value="regex_sample">Sample Regex: (a|b)*abb#</option>
            <option value="nfa_sample">Sample NFA (Powerset Construction)</option>
            <option value="dfa_minimization">Sample Non-minimal DFA</option>
          </select>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowScannerModal(true)}
            className="inline-flex items-center gap-2 rounded-[36px] px-5 py-2 text-xs font-medium uppercase transition-all cursor-pointer border border-[#dc5000] shadow-sm hover:opacity-90"
            style={{
              backgroundColor: isDark ? "#382416" : "#FFFFFF",
              color: textColor,
            }}
          >
            <Scan className="h-4 w-4 text-[#dc5000]" />
            <span>SCAN IMAGE</span>
          </button>

          <button
            onClick={handleConvertNfaToDfa}
            className="inline-flex items-center gap-2 rounded-[36px] px-5 py-2 text-xs font-medium uppercase transition-all cursor-pointer border hover:opacity-90 shadow-sm"
            style={{
              backgroundColor: isDark ? "#382416" : "#424874",
              borderColor: isDark ? "#40372e" : "#424874",
              color: isDark ? "#ffedd7" : "#F4EEFF",
            }}
          >
            <Zap className="h-4 w-4" />
            <span>CONVERT NFA → DFA</span>
          </button>

          <button
            onClick={handleMinimizeDfa}
            className="inline-flex items-center gap-2 rounded-[22.5px] border px-5 py-2 text-xs font-medium uppercase transition-all cursor-pointer hover:opacity-80"
            style={{
              borderColor: isDark ? "#ffedd7" : "#424874",
              color: textColor,
            }}
          >
            <ListFilter className="h-4 w-4" />
            <span>MINIMIZE DFA</span>
          </button>

          {theoryBreakdown && (
            <button
              onClick={() => setShowTheoryModal(true)}
              className="inline-flex items-center gap-2 rounded-[22.5px] border px-4 py-2 text-xs font-medium uppercase transition-all cursor-pointer hover:opacity-80"
              style={{ backgroundColor: innerBg, borderColor, color: textColor }}
            >
              <BookOpen className="h-4 w-4" style={{ color: mutedText }} />
              <span>THEORY DOCS</span>
            </button>
          )}

          <button
            onClick={handleClear}
            className="rounded-[22.5px] border px-4 py-2 text-xs font-medium uppercase transition-all cursor-pointer hover:opacity-80"
            style={{ borderColor, color: mutedText }}
          >
            CLEAR
          </button>
        </div>

      </div>

      {/* Main Dual Workspace Grid */}
      <div className="grid grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Drag & Drop Toolbox & Inputs */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
          
          {/* Drag & Drop Toolbox Card */}
          <div 
            className="rounded-[12px] border p-5 flex flex-col gap-4 shadow-sm"
            style={{ backgroundColor: surfaceBg, borderColor }}
          >
            <div className="flex items-center justify-between border-b border-dashed pb-3" style={{ borderColor }}>
              <span className="text-xs font-medium uppercase tracking-wider" style={{ color: textColor }}>
                DRAG & DROP TOOLBOX
              </span>
              <span className="text-[10px] font-mono" style={{ color: dimText }}>
                DRAG TO CANVAS
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2.5">
              
              {/* State Node */}
              <div
                draggable
                onDragStart={(e) => e.dataTransfer.setData("text/plain", "state")}
                className="flex flex-col items-center justify-center p-3 rounded-[12px] border cursor-grab active:cursor-grabbing transition-all text-center hover:opacity-80"
                style={{ backgroundColor: innerBg, borderColor }}
              >
                <div 
                  className="w-8 h-8 rounded-full border flex items-center justify-center font-mono text-xs font-bold"
                  style={{ backgroundColor: elevatedBg, borderColor: textColor, color: textColor }}
                >
                  q
                </div>
                <span className="text-[10px] font-medium uppercase mt-1.5" style={{ color: mutedText }}>State</span>
              </div>

              {/* Start State Node */}
              <div
                draggable
                onDragStart={(e) => e.dataTransfer.setData("text/plain", "start_state")}
                className="flex flex-col items-center justify-center p-3 rounded-[12px] border cursor-grab active:cursor-grabbing transition-all text-center hover:opacity-80"
                style={{ backgroundColor: innerBg, borderColor }}
              >
                <div 
                  className="w-8 h-8 rounded-full border-2 flex items-center justify-center font-mono text-xs font-bold"
                  style={{ backgroundColor: isDark ? "#100904" : "#424874", borderColor: isDark ? "#ffedd7" : "#424874", color: isDark ? "#ffedd7" : "#FFFFFF" }}
                >
                  q₀
                </div>
                <span className="text-[10px] font-medium uppercase mt-1.5" style={{ color: mutedText }}>Start</span>
              </div>

              {/* Accept State Node */}
              <div
                draggable
                onDragStart={(e) => e.dataTransfer.setData("text/plain", "accept_state")}
                className="flex flex-col items-center justify-center p-3 rounded-[12px] border cursor-grab active:cursor-grabbing transition-all text-center hover:opacity-80"
                style={{ backgroundColor: innerBg, borderColor }}
              >
                <div 
                  className="w-8 h-8 rounded-full border-[3px] border-double flex items-center justify-center font-mono text-xs font-bold"
                  style={{ backgroundColor: elevatedBg, borderColor: textColor, color: textColor }}
                >
                  q*
                </div>
                <span className="text-[10px] font-medium uppercase mt-1.5" style={{ color: mutedText }}>Accept</span>
              </div>

              {/* Transition Connector Tool */}
              <div
                onClick={() => {
                  setActiveTool((prev) => (prev === "connect" ? "select" : "connect"));
                }}
                className={`flex flex-col items-center justify-center p-3 rounded-[12px] border transition-all text-center cursor-pointer`}
                style={{
                  backgroundColor: activeTool === "connect" ? (isDark ? "#382416" : "#424874") : innerBg,
                  borderColor: activeTool === "connect" ? "#dc5000" : borderColor,
                  color: activeTool === "connect" ? (isDark ? "#ffedd7" : "#FFFFFF") : textColor,
                }}
              >
                <div 
                  className="w-8 h-8 rounded-full border flex items-center justify-center"
                  style={{ borderColor: activeTool === "connect" ? "#dc5000" : textColor }}
                >
                  <Link className="h-4 w-4" />
                </div>
                <span className="text-[10px] font-medium uppercase mt-1.5" style={{ color: mutedText }}>Connect</span>
              </div>

            </div>

            {/* Quick Connect Row */}
            {automaton.states.length >= 1 && (
              <div 
                className="flex flex-col gap-2 rounded-[8px] p-3 border"
                style={{ backgroundColor: innerBg, borderColor }}
              >
                <div className="text-[10px] font-medium uppercase" style={{ color: mutedText }}>
                  Direct Connect Controls:
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[9px] font-mono block uppercase" style={{ color: dimText }}>From</label>
                    <select
                      value={manualFrom}
                      onChange={(e) => setManualFrom(e.target.value)}
                      className="w-full rounded px-1.5 py-1 text-xs font-mono border focus:outline-none"
                      style={{ backgroundColor: surfaceBg, borderColor, color: textColor }}
                    >
                      {automaton.states.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[9px] font-mono block uppercase" style={{ color: dimText }}>To</label>
                    <select
                      value={manualTo}
                      onChange={(e) => setManualTo(e.target.value)}
                      className="w-full rounded px-1.5 py-1 text-xs font-mono border focus:outline-none"
                      style={{ backgroundColor: surfaceBg, borderColor, color: textColor }}
                    >
                      {automaton.states.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[9px] font-mono block uppercase" style={{ color: dimText }}>Symbol</label>
                    <input
                      type="text"
                      value={manualSymbol}
                      onChange={(e) => setManualSymbol(e.target.value)}
                      placeholder="a"
                      className="w-full rounded px-1.5 py-1 text-xs font-mono border focus:outline-none"
                      style={{ backgroundColor: surfaceBg, borderColor, color: textColor }}
                    />
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (manualFrom && manualTo) {
                      handleConfirmConnect(manualFrom, manualTo, manualSymbol);
                    }
                  }}
                  className="w-full rounded-[22.5px] border py-1.5 text-xs font-medium uppercase transition-all cursor-pointer mt-1 hover:opacity-90"
                  style={{
                    backgroundColor: isDark ? "#382416" : "#424874",
                    borderColor: isDark ? "#40372e" : "#424874",
                    color: isDark ? "#ffedd7" : "#F4EEFF",
                  }}
                >
                  + Add Transition Arrow
                </button>
              </div>
            )}

            {/* Active Mode Notice */}
            {selectedSourceState && (
              <div 
                className="rounded-[8px] p-3 text-xs border flex items-center justify-between animate-pulse"
                style={{ backgroundColor: elevatedBg, borderColor: "#dc5000", color: textColor }}
              >
                <span>Selected source: <strong className="text-[#dc5000]">{selectedSourceState}</strong>. Now click target state node!</span>
                <button
                  onClick={() => {
                    selectedSourceRef.current = null;
                    setSelectedSourceState(null);
                  }}
                  className="text-[10px] uppercase hover:underline ml-2 cursor-pointer"
                  style={{ color: mutedText }}
                >
                  Cancel
                </button>
              </div>
            )}

          </div>

          {/* Input Methods Card */}
          <div 
            className="rounded-[12px] border p-5 flex flex-col gap-4 shadow-sm"
            style={{ backgroundColor: surfaceBg, borderColor }}
          >
            <div className="flex items-center justify-between border-b border-dashed pb-3" style={{ borderColor }}>
              <span className="text-xs font-medium uppercase tracking-wider" style={{ color: textColor }}>
                INPUT MODES
              </span>
              <div className="flex gap-1.5">
                <button
                  onClick={() => setActiveTab("quick")}
                  className="px-3 py-1 text-xs font-medium uppercase rounded-[22.5px] transition-all cursor-pointer border"
                  style={{
                    backgroundColor: activeTab === "quick" ? (isDark ? "#382416" : "#424874") : "transparent",
                    borderColor: activeTab === "quick" ? (isDark ? "#40372e" : "#424874") : "transparent",
                    color: activeTab === "quick" ? (isDark ? "#ffedd7" : "#F4EEFF") : mutedText,
                  }}
                >
                  QUICK
                </button>
                <button
                  onClick={() => setActiveTab("regex")}
                  className="px-3 py-1 text-xs font-medium uppercase rounded-[22.5px] transition-all cursor-pointer border"
                  style={{
                    backgroundColor: activeTab === "regex" ? (isDark ? "#382416" : "#424874") : "transparent",
                    borderColor: activeTab === "regex" ? (isDark ? "#40372e" : "#424874") : "transparent",
                    color: activeTab === "regex" ? (isDark ? "#ffedd7" : "#F4EEFF") : mutedText,
                  }}
                >
                  REGEX
                </button>
                <button
                  onClick={() => setActiveTab("text")}
                  className="px-3 py-1 text-xs font-medium uppercase rounded-[22.5px] transition-all cursor-pointer border"
                  style={{
                    backgroundColor: activeTab === "text" ? (isDark ? "#382416" : "#424874") : "transparent",
                    borderColor: activeTab === "text" ? (isDark ? "#40372e" : "#424874") : "transparent",
                    color: activeTab === "text" ? (isDark ? "#ffedd7" : "#F4EEFF") : mutedText,
                  }}
                >
                  TEXT
                </button>
                <button
                  onClick={() => {
                    setActiveTab("image");
                    setShowScannerModal(true);
                  }}
                  className="flex items-center gap-1 px-3 py-1 text-xs font-medium uppercase rounded-[22.5px] transition-all cursor-pointer border"
                  style={{
                    backgroundColor: activeTab === "image" ? (isDark ? "#382416" : "#424874") : "transparent",
                    borderColor: activeTab === "image" ? "#dc5000" : "transparent",
                    color: activeTab === "image" ? (isDark ? "#ffedd7" : "#F4EEFF") : mutedText,
                  }}
                >
                  <Scan className="h-3 w-3 text-[#dc5000]" />
                  <span>IMAGE</span>
                </button>
              </div>
            </div>

            {/* Quick Add Fields */}
            {activeTab === "quick" && (
              <div className="flex flex-col gap-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="New state name (e.g. q2)"
                    value={newStateName}
                    onChange={(e) => setNewStateName(e.target.value)}
                    className="w-full border-b bg-transparent px-2 py-1.5 font-mono text-xs focus:outline-none"
                    style={{ borderColor, color: textColor }}
                  />
                  <button
                    onClick={() => {
                      const name = newStateName.trim() || `q${automaton.states.length}`;
                      if (!automaton.states.includes(name)) {
                        const updated = automaton.clone();
                        updated.states.push(name);
                        if (!updated.startState) updated.startState = name;
                        setAutomaton(updated);
                        onAutomatonChange?.(updated);
                        setNewStateName("");
                      }
                    }}
                    className="rounded-[22.5px] border px-4 py-1.5 text-xs font-medium uppercase transition-all cursor-pointer hover:opacity-80"
                    style={{ borderColor, color: textColor }}
                  >
                    ADD
                  </button>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="New symbol (e.g. 0, a)"
                    value={newSymbol}
                    onChange={(e) => setNewSymbol(e.target.value)}
                    className="w-full border-b bg-transparent px-2 py-1.5 font-mono text-xs focus:outline-none"
                    style={{ borderColor, color: textColor }}
                  />
                  <button
                    onClick={() => {
                      const sym = newSymbol.trim();
                      if (sym && !automaton.alphabet.includes(sym)) {
                        const updated = automaton.clone();
                        updated.alphabet.push(sym);
                        setAutomaton(updated);
                        onAutomatonChange?.(updated);
                        setNewSymbol("");
                      }
                    }}
                    className="rounded-[22.5px] border px-4 py-1.5 text-xs font-medium uppercase transition-all cursor-pointer hover:opacity-80"
                    style={{ borderColor, color: textColor }}
                  >
                    ADD
                  </button>
                </div>
              </div>
            )}

            {/* Regex Mode */}
            {activeTab === "regex" && (
              <div className="flex flex-col gap-3">
                <input
                  type="text"
                  placeholder="Regex e.g. (a|b)*abb#"
                  value={regexInput}
                  onChange={(e) => setRegexInput(e.target.value)}
                  className="w-full border-b bg-transparent px-2 py-1.5 font-mono text-xs focus:outline-none"
                  style={{ borderColor, color: textColor }}
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      if (regexInput) {
                        const nfa = parseRegexToNFA(regexInput);
                        setAutomaton(nfa);
                        onAutomatonChange?.(nfa);
                      }
                    }}
                    className="flex-1 rounded-[36px] py-2 text-xs font-medium uppercase border transition-all cursor-pointer hover:opacity-90"
                    style={{
                      backgroundColor: isDark ? "#382416" : "#424874",
                      borderColor: isDark ? "#40372e" : "#424874",
                      color: isDark ? "#ffedd7" : "#F4EEFF",
                    }}
                  >
                    BUILD NFA
                  </button>
                  <button
                    onClick={() => {
                      if (regexInput) {
                        const nfa = parseRegexToNFA(regexInput);
                        const { dfa, steps, theory } = nfa.toDFA();
                        setAutomaton(dfa);
                        onAutomatonChange?.(dfa);
                        setConversionSteps(steps);
                        setTheoryBreakdown(theory);
                        setConversionType("NFA_TO_DFA");
                        setShowPlayer(false);
                      }
                    }}
                    className="flex-1 rounded-[22.5px] border py-2 text-xs font-medium uppercase transition-all cursor-pointer hover:opacity-80"
                    style={{ borderColor, color: textColor }}
                  >
                    BUILD DFA
                  </button>
                </div>
              </div>
            )}

            {/* Text Mode */}
            {activeTab === "text" && (
              <div className="flex flex-col gap-3">
                <textarea
                  rows={4}
                  value={simpleTextInput}
                  onChange={(e) => setSimpleTextInput(e.target.value)}
                  className="w-full rounded-[8px] border p-3 font-mono text-xs focus:outline-none resize-none"
                  style={{ backgroundColor: innerBg, borderColor, color: textColor }}
                  placeholder="->q0&#10;q0 --a--> q1&#10;q1*"
                />
                <button
                  onClick={() => {
                    const auto = parseSimpleTextToAutomaton(simpleTextInput);
                    setAutomaton(auto);
                    onAutomatonChange?.(auto);
                  }}
                  className="rounded-[36px] py-2 text-xs font-medium uppercase border transition-all cursor-pointer hover:opacity-90"
                  style={{
                    backgroundColor: isDark ? "#382416" : "#424874",
                    borderColor: isDark ? "#40372e" : "#424874",
                    color: isDark ? "#ffedd7" : "#F4EEFF",
                  }}
                >
                  APPLY TEXT NOTATION
                </button>
              </div>
            )}

            {/* Image Scan Mode */}
            {activeTab === "image" && (
              <div 
                className="flex flex-col gap-3 rounded-[8px] p-4 border text-center"
                style={{ backgroundColor: innerBg, borderColor }}
              >
                <div className="flex items-center justify-center gap-2 text-xs font-medium uppercase" style={{ color: textColor }}>
                  <Scan className="h-4 w-4 text-[#dc5000]" />
                  <span>CLIENT-SIDE IMAGE / OCR SCANNER</span>
                </div>
                <p className="text-xs leading-relaxed" style={{ color: mutedText }}>
                  Paste a screenshot from your clipboard with <kbd className="px-1.5 py-0.5 rounded border font-mono" style={{ borderColor, backgroundColor: surfaceBg, color: textColor }}>Ctrl + V</kbd> or click below to upload a diagram.
                </p>
                <button
                  onClick={() => setShowScannerModal(true)}
                  className="inline-flex items-center justify-center gap-2 rounded-[36px] py-2.5 text-xs font-medium uppercase border cursor-pointer shadow-lg mt-1 hover:opacity-90"
                  style={{
                    backgroundColor: isDark ? "#382416" : "#FFFFFF",
                    borderColor: "#dc5000",
                    color: textColor,
                  }}
                >
                  <Camera className="h-4 w-4 text-[#dc5000]" />
                  <span>OPEN SCANNER MODAL</span>
                </button>
              </div>
            )}

          </div>

          {/* Live String Simulator Card with Self-Loop Animations */}
          <div 
            className="rounded-[12px] border p-5 flex flex-col gap-4 shadow-sm"
            style={{ backgroundColor: surfaceBg, borderColor }}
          >
            <div className="flex items-center justify-between border-b border-dashed pb-3" style={{ borderColor }}>
              <span className="text-xs font-medium uppercase tracking-wider" style={{ color: textColor }}>
                EXECUTION SIMULATOR
              </span>
              {isCurrentStepSelfLoop && (
                <span className="flex items-center gap-1 text-[10px] font-mono text-[#dc5000] font-bold animate-pulse">
                  <RotateCw className="h-3 w-3 animate-spin" />
                  SELF-LOOP ACTIVE ↺
                </span>
              )}
            </div>
            {/* If ConversionPlayer is showing an intermediate frame, show a banner to apply the final DFA */}
            {showPlayer && finalConversionAutoRef.current && (
              <div 
                className="flex items-center justify-between border rounded-[8px] p-2.5 text-xs font-mono"
                style={{ backgroundColor: elevatedBg, borderColor: "#dc5000" }}
              >
                <span style={{ color: textColor }}>Previewing step-by-step frame.</span>
                <button
                  onClick={handleApplyFinalConversion}
                  className="text-[#dc5000] hover:underline font-bold cursor-pointer"
                >
                  Apply Final DFA →
                </button>
              </div>
            )}

            <div className="flex gap-2">
              <input
                type="text"
                placeholder={`Enter test string (e.g. ${automaton.alphabet.slice(0, 3).join("") || "abb"})`}
                value={testString}
                onChange={(e) => {
                  setTestString(e.target.value);
                  setTestResult(null);
                  setCurrentSimStepIndex(-1);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleRunTestString();
                }}
                className="w-full border-b bg-transparent px-2 py-1.5 font-mono text-xs focus:outline-none"
                style={{ borderColor, color: textColor }}
              />
              <button
                onClick={handleRunTestString}
                className="rounded-[36px] px-5 py-1.5 text-xs font-medium uppercase border transition-all cursor-pointer hover:opacity-90"
                style={{
                  backgroundColor: isDark ? "#382416" : "#424874",
                  borderColor: isDark ? "#40372e" : "#424874",
                  color: isDark ? "#ffedd7" : "#F4EEFF",
                }}
              >
                EXECUTE
              </button>
            </div>

            {/* Interactive Step-by-Step Playback Controls */}
            {testResult && (
              <div 
                className="rounded-[8px] p-3.5 border flex flex-col gap-3"
                style={{ backgroundColor: innerBg, borderColor }}
              >
                {/* Status Bar */}
                <div className="flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <span style={{ color: mutedText }}>STEP:</span>
                    <span className="font-bold" style={{ color: textColor }}>
                      {testResult.path.length > 0
                        ? `${Math.min(currentSimStepIndex + 1, testResult.path.length)} / ${testResult.path.length}`
                        : "0 / 0"}
                    </span>
                  </div>

                  {currentStepData ? (
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-[#dc5000]">
                        {currentStepData.state}
                      </span>
                      <span style={{ color: mutedText }}>--{currentStepData.symbolConsumed}&rarr;</span>
                      <span className="font-bold text-[#dc5000]">
                        {currentStepData.nextState}
                      </span>
                      {isCurrentStepSelfLoop && (
                        <span 
                          className="text-[10px] px-1.5 py-0.5 rounded border font-bold"
                          style={{ backgroundColor: elevatedBg, borderColor: "#dc5000", color: "#dc5000" }}
                        >
                          ↺ LOOP
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-rose-500 font-bold">
                      {testResult.accepted ? "ACCEPTED (ε)" : "HALTED AT START"}
                    </span>
                  )}
                </div>

                {/* Stream Character Progress */}
                {testString.length > 0 && (
                  <div className="flex gap-1.5 overflow-x-auto py-1 font-mono text-xs">
                    {testString.split("").map((ch, idx) => {
                      const isPast = idx < currentSimStepIndex;
                      const isCurrent = idx === currentSimStepIndex;
                      const isFailedChar = !testResult.accepted && idx === testResult.path.length;

                      return (
                        <span
                          key={idx}
                          className={`px-2 py-0.5 rounded transition-all ${
                            isCurrent
                              ? "bg-[#dc5000] text-white font-bold scale-110 shadow"
                              : isFailedChar
                              ? (isDark ? "bg-rose-900 border border-rose-500 text-rose-200 font-bold" : "bg-rose-100 border border-rose-300 text-rose-800 font-bold")
                              : isPast
                              ? ""
                              : ""
                          }`}
                          style={
                            !isCurrent && !isFailedChar
                              ? isPast
                                ? { backgroundColor: elevatedBg, color: mutedText, borderColor }
                                : { backgroundColor: innerBg, color: dimText, borderColor }
                              : undefined
                          }
                        >
                          {ch}
                        </span>
                      );
                    })}
                  </div>
                )}

                {/* Timeline Controls */}
                {testResult.path.length > 0 && (
                  <div className="flex items-center justify-between pt-1 border-t border-dashed" style={{ borderColor }}>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          setIsSimPlaying(false);
                          const prev = Math.max(0, currentSimStepIndex - 1);
                          setCurrentSimStepIndex(prev);
                          highlightSimStep(prev, testResult);
                        }}
                        disabled={currentSimStepIndex <= 0}
                        className="p-1 rounded border disabled:opacity-30 cursor-pointer hover:opacity-80"
                        style={{ borderColor, color: mutedText }}
                      >
                        <SkipBack className="h-3.5 w-3.5" />
                      </button>

                      <button
                        onClick={() => setIsSimPlaying(!isSimPlaying)}
                        className="px-3 py-1 rounded-[22.5px] border text-xs font-mono cursor-pointer hover:opacity-90"
                        style={{
                          backgroundColor: isDark ? "#382416" : "#424874",
                          borderColor: isDark ? "#40372e" : "#424874",
                          color: isDark ? "#ffedd7" : "#F4EEFF",
                        }}
                      >
                        {isSimPlaying ? <Pause className="h-3 w-3 inline mr-1" /> : <Play className="h-3 w-3 inline mr-1 fill-current" />}
                        {isSimPlaying ? "PAUSE" : "PLAY"}
                      </button>

                      <button
                        onClick={() => {
                          setIsSimPlaying(false);
                          const next = Math.min(testResult.path.length - 1, currentSimStepIndex + 1);
                          setCurrentSimStepIndex(next);
                          highlightSimStep(next, testResult);
                        }}
                        disabled={currentSimStepIndex >= testResult.path.length - 1}
                        className="p-1 rounded border disabled:opacity-30 cursor-pointer hover:opacity-80"
                        style={{ borderColor, color: mutedText }}
                      >
                        <SkipForward className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <button
                      onClick={() => {
                        setIsSimPlaying(false);
                        setCurrentSimStepIndex(0);
                        highlightSimStep(0, testResult);
                      }}
                      className="p-1 rounded border cursor-pointer hover:opacity-80"
                      style={{ borderColor, color: mutedText }}
                      title="Reset Trace"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
            )}

            {testResult && (
              <div 
                className={`p-3.5 rounded-[8px] border text-xs font-mono flex flex-col gap-1.5 ${
                  testResult.accepted
                    ? (isDark ? "bg-emerald-950/40 border-emerald-800 text-emerald-200" : "bg-emerald-50 border-emerald-300 text-emerald-900")
                    : (isDark ? "bg-rose-950/40 border-rose-800 text-rose-200" : "bg-rose-50 border-rose-300 text-rose-900")
                }`}
              >
                <div className="font-bold flex items-center justify-between uppercase">
                  <span>VERDICT: {testResult.accepted ? "ACCEPTED" : "REJECTED"}</span>
                  <span className="text-[10px] opacity-75">FINAL: {testResult.finalState}</span>
                </div>
                <div className="text-[11px] font-sans opacity-90">{testResult.details}</div>
              </div>
            )}
          </div>

          {/* Formal Definition Summary */}
          <div 
            className="rounded-[12px] border p-5 flex flex-col gap-3 font-mono text-xs shadow-sm"
            style={{ backgroundColor: surfaceBg, borderColor }}
          >
            <span className="text-xs font-medium uppercase tracking-wider font-sans" style={{ color: mutedText }}>
              FORMAL 5-TUPLE M = (Q, Σ, δ, q₀, F)
            </span>
            <div 
              className="p-3 rounded-[8px] border space-y-1.5"
              style={{ backgroundColor: innerBg, borderColor, color: textColor }}
            >
              <div>Q = &#123; {automaton.states.join(", ")} &#125;</div>
              <div>Σ = &#123; {automaton.alphabet.join(", ")} &#125;</div>
              <div>q₀ = {automaton.startState || "none"}</div>
              <div>F = &#123; {automaton.acceptStates.join(", ")} &#125;</div>
            </div>
          </div>

        </div>

        {/* Right Column: Visual Cytoscape Canvas & Transitions */}
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
          
          {/* Cytoscape Canvas Container */}
          <div 
            className="relative rounded-[12px] border overflow-hidden flex flex-col shadow-2xl"
            style={{ backgroundColor: surfaceBg, borderColor }}
          >
            
            {/* Canvas Header */}
            <div 
              className="flex items-center justify-between border-b px-5 py-3 z-10"
              style={{ backgroundColor: surfaceBg, borderColor }}
            >
              <div className="flex items-center gap-6 text-xs font-mono" style={{ color: mutedText }}>
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full border-2"
                    style={{
                      borderColor: isDark ? "#ffedd7" : "#424874",
                      backgroundColor: isDark ? "#100904" : "#424874"
                    }}
                  />
                  <span>START STATE</span>
                </div>
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full border"
                    style={{
                      borderColor: isDark ? "#ffedd7" : "#424874",
                      backgroundColor: elevatedBg
                    }}
                  />
                  <span>NORMAL</span>
                </div>
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3.5 h-3.5 rounded-full border-[2px] border-double"
                    style={{
                      borderColor: isDark ? "#ffedd7" : "#424874",
                      backgroundColor: elevatedBg
                    }}
                  />
                  <span>ACCEPT</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => cyRef.current?.fit(undefined, 30)}
                  title="Fit View"
                  className="rounded-[6px] border p-1.5 cursor-pointer transition-all hover:opacity-80"
                  style={{ backgroundColor: innerBg, borderColor, color: textColor }}
                >
                  <Maximize2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => {
                    if (cyRef.current) {
                      const png = cyRef.current.png({ full: true, bg: isDark ? "#100904" : "#FFFFFF" });
                      const a = document.createElement("a");
                      a.href = png;
                      a.download = "automaton.png";
                      a.click();
                    }
                  }}
                  title="Export Diagram PNG"
                  className="rounded-[6px] border p-1.5 cursor-pointer transition-all hover:opacity-80"
                  style={{ backgroundColor: innerBg, borderColor, color: textColor }}
                >
                  <Download className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Visual Canvas */}
            <div
              ref={cyContainerRef}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDropOnCanvas}
              className="w-full h-[520px] cursor-crosshair relative transition-colors duration-200"
              style={{ backgroundColor: isDark ? "#100904" : "#FFFFFF" }}
            />

            {/* Bottom Hint Bar */}
            <div 
              className="absolute bottom-3 left-3 z-10 flex items-center gap-2 rounded-[8px] backdrop-blur-md border px-3.5 py-1.5 text-[11px]"
              style={{
                backgroundColor: isDark ? "rgba(26, 16, 7, 0.9)" : "rgba(255, 255, 255, 0.9)",
                borderColor,
                color: mutedText,
              }}
            >
              <HelpCircle className="h-3.5 w-3.5 text-[#dc5000]" />
              <span>Click source state then target state to link. Self-loops pulse with animation in simulator.</span>
            </div>

          </div>

          {/* Video Walkthrough Player (when conversion is active) */}
          {showPlayer && conversionSteps && (
            <ConversionPlayer
              steps={conversionSteps}
              isDark={isDark}
              onStepChange={(step) => {
                const intermediate = new Automaton(step.intermediateAutomaton);
                setAutomaton(intermediate);

                // Highlight active states and transitions with glowing styling in Cytoscape
                setTimeout(() => {
                  if (cyRef.current) {
                    const cy = cyRef.current;
                    cy.nodes().removeClass("highlighted-node");
                    cy.edges().removeClass("highlighted-edge");

                    step.activeStates.forEach((st) => {
                      const n = cy.getElementById(st);
                      if (n.length > 0) n.addClass("highlighted-node");
                    });

                    step.activeTransitions.forEach((t) => {
                      cy.edges().forEach((edge) => {
                        if (edge.data("source") === t.from && edge.data("target") === t.to) {
                          edge.addClass("highlighted-edge");
                        }
                      });
                    });
                  }
                }, 40);
              }}
              onApplyFinal={handleApplyFinalConversion}
              onClose={handleApplyFinalConversion}
            />
          )}

          {/* Interactive Transition Table & Symbol Editor */}
          <div 
            className="rounded-[12px] border p-5 flex flex-col gap-4 shadow-xl"
            style={{ backgroundColor: surfaceBg, borderColor }}
          >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-dashed pb-3" style={{ borderColor }}>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium uppercase tracking-wider" style={{ color: textColor }}>
                  TRANSITION MATRIX (δ)
                </span>
                <span className="rounded px-2 py-0.5 text-[10px] font-mono text-[#dc5000] border border-[#dc5000]/40 font-bold" style={{ backgroundColor: elevatedBg }}>
                  BIDIRECTIONAL
                </span>
              </div>

              {/* Table Controls: Add State, Add Symbol, Toggle Epsilon */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs mr-1 hidden sm:inline" style={{ color: mutedText }}>
                  {automaton.isNFA() ? "NFA (Multi-Target)" : "DFA (Single-Target)"}
                </span>

                <button
                  onClick={handleAddStateFromTable}
                  className="inline-flex items-center gap-1 rounded-[22.5px] border px-3 py-1 text-xs font-mono transition-all cursor-pointer hover:opacity-80"
                  style={{ backgroundColor: innerBg, borderColor, color: textColor }}
                  title="Add a new state row"
                >
                  <Plus className="h-3 w-3 text-[#dc5000]" />
                  <span>Row (State)</span>
                </button>

                {showAddSymbolPopover ? (
                  <div 
                    className="flex items-center gap-1 rounded-[22.5px] border px-2 py-0.5"
                    style={{ backgroundColor: innerBg, borderColor }}
                  >
                    <input
                      type="text"
                      placeholder="Symbol"
                      value={newTableSymbolInput}
                      onChange={(e) => setNewTableSymbolInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleAddSymbolFromTable();
                        if (e.key === "Escape") setShowAddSymbolPopover(false);
                      }}
                      autoFocus
                      className="w-14 bg-transparent text-xs font-mono focus:outline-none"
                      style={{ color: textColor }}
                    />
                    <button
                      onClick={handleAddSymbolFromTable}
                      className="text-emerald-500 hover:text-emerald-400 p-0.5 cursor-pointer"
                    >
                      <Check className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => setShowAddSymbolPopover(false)}
                      className="p-0.5 cursor-pointer hover:opacity-80"
                      style={{ color: mutedText }}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowAddSymbolPopover(true)}
                    className="inline-flex items-center gap-1 rounded-[22.5px] border px-3 py-1 text-xs font-mono transition-all cursor-pointer hover:opacity-80"
                    style={{ backgroundColor: innerBg, borderColor, color: textColor }}
                    title="Add a new alphabet column"
                  >
                    <Plus className="h-3 w-3 text-[#dc5000]" />
                    <span>Column (Σ)</span>
                  </button>
                )}

                <button
                  onClick={() => setShowEpsilonColumn(!showEpsilonColumn)}
                  className={`inline-flex items-center gap-1 rounded-[22.5px] border px-3 py-1 text-xs font-mono transition-all cursor-pointer ${
                    showEpsilonColumn || automaton.isNFA()
                      ? "border-[#dc5000] bg-[#382416] text-[#ffedd7]"
                      : "border-[#40372e] bg-[#100904] text-[#a69888] hover:text-[#ffedd7]"
                  }`}
                  title="Toggle ε (epsilon) transitions column"
                >
                  <span>ε Moves</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto rounded-[8px] border" style={{ backgroundColor: innerBg, borderColor }}>
              <table className="w-full text-left font-mono text-xs border-collapse">
                <thead>
                  <tr className="border-b" style={{ backgroundColor: innerBg, borderColor, color: mutedText }}>
                    <th className="p-3 min-w-[140px]">State (Start / Final)</th>
                    {automaton.alphabet.map((sym) => (
                      <th key={sym} className="p-3 min-w-[120px]">
                        <div className="flex items-center justify-between group">
                          <span className="font-bold" style={{ color: textColor }}>{sym}</span>
                          <button
                            onClick={() => handleRemoveSymbolFromTable(sym)}
                            title={`Remove symbol '${sym}'`}
                            className="opacity-0 group-hover:opacity-100 p-0.5 transition-opacity cursor-pointer hover:text-rose-500"
                            style={{ color: mutedText }}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      </th>
                    ))}
                    {(automaton.isNFA() || showEpsilonColumn) && (
                      <th className="p-3 min-w-[120px] text-[#dc5000] font-bold">ε (Epsilon)</th>
                    )}
                    <th className="p-3 text-right">Delete</th>
                  </tr>
                </thead>
                <tbody>
                  {automaton.states.map((st, idx) => {
                    const isStart = st === automaton.startState;
                    const isAccept = automaton.acceptStates.includes(st);
                    const isEditingName = editingStateName?.original === st;

                    return (
                      <tr
                        key={st}
                        className={`border-b transition-colors ${
                          idx % 2 === 1 ? (isDark ? "bg-[#100904]/40" : "bg-[#F8F6FF]/60") : ""
                        }`}
                        style={{ borderColor }}
                      >
                        {/* State Column with Start & Accept Toggles + Inline Rename */}
                        <td className="p-3 font-bold" style={{ color: textColor }}>
                          <div className="flex items-center gap-2">
                            {/* Start State Toggle */}
                            <button
                              onClick={() => handleToggleStartState(st)}
                              title={isStart ? "Start state (Click to switch)" : "Set as start state"}
                              className={`flex items-center justify-center h-5 px-1.5 rounded text-[10px] font-mono font-bold transition-all cursor-pointer ${
                                isStart
                                  ? "bg-[#dc5000] text-white shadow"
                                  : "border hover:border-[#dc5000]"
                              }`}
                              style={
                                !isStart
                                  ? { backgroundColor: surfaceBg, borderColor, color: mutedText }
                                  : undefined
                              }
                            >
                              →
                            </button>

                            {/* State Name / Rename Input */}
                            {isEditingName ? (
                              <div className="flex items-center gap-1">
                                <input
                                  type="text"
                                  value={editingStateName.current}
                                  onChange={(e) =>
                                    setEditingStateName({ original: st, current: e.target.value })
                                  }
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") handleConfirmRenameState();
                                    if (e.key === "Escape") setEditingStateName(null);
                                  }}
                                  onBlur={handleConfirmRenameState}
                                  autoFocus
                                  className="w-16 rounded border px-1 py-0.5 text-xs font-mono focus:outline-none"
                                  style={{ backgroundColor: surfaceBg, borderColor, color: textColor }}
                                />
                                <button
                                  onClick={handleConfirmRenameState}
                                  className="text-emerald-500 hover:text-emerald-400"
                                >
                                  <Check className="h-3 w-3" />
                                </button>
                              </div>
                            ) : (
                              <span
                                onDoubleClick={() =>
                                  setEditingStateName({ original: st, current: st })
                                }
                                title="Double-click to rename state"
                                className="cursor-pointer hover:underline text-sm tracking-wide"
                              >
                                {st}
                              </span>
                            )}

                            {/* Accept State Toggle */}
                            <button
                              onClick={() => handleToggleAcceptState(st)}
                              title={isAccept ? "Accept state (Click to toggle off)" : "Make accept state"}
                              className={`flex items-center justify-center h-5 px-1.5 rounded text-[10px] font-mono font-bold transition-all cursor-pointer ${
                                isAccept
                                  ? (isDark ? "bg-emerald-950 border border-emerald-500 text-emerald-300 shadow" : "bg-emerald-100 border border-emerald-400 text-emerald-800 shadow")
                                  : "border"
                              }`}
                              style={
                                !isAccept
                                  ? { backgroundColor: surfaceBg, borderColor, color: mutedText }
                                  : undefined
                              }
                            >
                              *
                            </button>
                          </div>
                        </td>

                        {/* Transitions for each Symbol in Alphabet */}
                        {automaton.alphabet.map((sym) => {
                          const tgts = automaton.transitions
                            .filter((t) => t.from === st && t.symbol === sym)
                            .map((t) => t.to);
                          const isCellEditing =
                            editingCell?.from === st && editingCell?.symbol === sym;

                          return (
                            <td key={sym} className="p-3">
                              {isCellEditing ? (
                                <div className="flex items-center gap-1">
                                  <input
                                    type="text"
                                    value={editingCell.text}
                                    onChange={(e) =>
                                      setEditingCell({ from: st, symbol: sym, text: e.target.value })
                                    }
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter")
                                        handleCellTextSubmit(st, sym, editingCell.text);
                                      if (e.key === "Escape") setEditingCell(null);
                                    }}
                                    placeholder="e.g. q0, q1"
                                    autoFocus
                                    className="w-24 rounded border px-1.5 py-0.5 text-xs font-mono focus:outline-none"
                                    style={{ backgroundColor: surfaceBg, borderColor, color: textColor }}
                                  />
                                  <button
                                    onClick={() =>
                                      handleCellTextSubmit(st, sym, editingCell.text)
                                    }
                                    className="text-emerald-500 hover:text-emerald-400 p-0.5 cursor-pointer"
                                  >
                                    <Check className="h-3 w-3" />
                                  </button>
                                  <button
                                    onClick={() => setEditingCell(null)}
                                    className="p-0.5 cursor-pointer hover:opacity-80"
                                    style={{ color: mutedText }}
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1">
                                  <select
                                    value={
                                      tgts.length === 0
                                        ? ""
                                        : tgts.length === 1
                                        ? tgts[0]
                                        : "__multi__"
                                    }
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      if (val === "__custom__" || val === "__multi__") {
                                        setEditingCell({
                                          from: st,
                                          symbol: sym,
                                          text: tgts.join(", "),
                                        });
                                      } else {
                                        handleUpdateCellTransition(st, sym, val);
                                      }
                                    }}
                                    className="rounded border px-2 py-1 font-mono text-xs focus:outline-none cursor-pointer transition-all w-full max-w-[110px]"
                                    style={{ backgroundColor: surfaceBg, borderColor, color: textColor }}
                                  >
                                    <option value="">— (None)</option>
                                    {automaton.states.map((dest) => (
                                      <option key={dest} value={dest}>
                                        {dest}
                                      </option>
                                    ))}
                                    {tgts.length > 1 && (
                                      <option value="__multi__">
                                        {"{" + tgts.join(", ") + "}"}
                                      </option>
                                    )}
                                    <option value="__custom__">✏️ Custom...</option>
                                  </select>
                                </div>
                              )}
                            </td>
                          );
                        })}

                        {/* Epsilon Column if NFA or enabled */}
                        {(automaton.isNFA() || showEpsilonColumn) && (
                          <td className="p-3">
                            {(() => {
                              const epsTgts = automaton.transitions
                                .filter(
                                  (t) =>
                                    t.from === st &&
                                    (t.symbol === "ε" || t.symbol === "e" || t.symbol === "" || !t.symbol)
                                )
                                .map((t) => t.to);
                              const isEpsEditing =
                                editingCell?.from === st && editingCell?.symbol === "ε";

                              if (isEpsEditing) {
                                return (
                                  <div className="flex items-center gap-1">
                                    <input
                                      type="text"
                                      value={editingCell.text}
                                      onChange={(e) =>
                                        setEditingCell({ from: st, symbol: "ε", text: e.target.value })
                                      }
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter")
                                          handleCellTextSubmit(st, "ε", editingCell.text);
                                        if (e.key === "Escape") setEditingCell(null);
                                      }}
                                      placeholder="e.g. q1, q2"
                                      autoFocus
                                      className="w-24 rounded border px-1.5 py-0.5 text-xs font-mono focus:outline-none"
                                      style={{ backgroundColor: surfaceBg, borderColor, color: textColor }}
                                    />
                                    <button
                                      onClick={() =>
                                        handleCellTextSubmit(st, "ε", editingCell.text)
                                      }
                                      className="text-emerald-500 hover:text-emerald-400 p-0.5 cursor-pointer"
                                    >
                                      <Check className="h-3 w-3" />
                                    </button>
                                    <button
                                      onClick={() => setEditingCell(null)}
                                      className="p-0.5 cursor-pointer hover:opacity-80"
                                      style={{ color: mutedText }}
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                  </div>
                                );
                              }

                              return (
                                <select
                                  value={
                                    epsTgts.length === 0
                                      ? ""
                                      : epsTgts.length === 1
                                      ? epsTgts[0]
                                      : "__multi__"
                                  }
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    if (val === "__custom__" || val === "__multi__") {
                                      setEditingCell({
                                        from: st,
                                        symbol: "ε",
                                        text: epsTgts.join(", "),
                                      });
                                    } else {
                                      handleUpdateCellTransition(st, "ε", val);
                                    }
                                  }}
                                  className="rounded border px-2 py-1 font-mono text-xs focus:outline-none cursor-pointer transition-all w-full max-w-[110px]"
                                  style={{ backgroundColor: surfaceBg, borderColor, color: textColor }}
                                >
                                  <option value="">— (None)</option>
                                  {automaton.states.map((dest) => (
                                    <option key={dest} value={dest}>
                                      {dest}
                                    </option>
                                  ))}
                                  {epsTgts.length > 1 && (
                                    <option value="__multi__">
                                      {"{" + epsTgts.join(", ") + "}"}
                                    </option>
                                  )}
                                  <option value="__custom__">✏️ Custom...</option>
                                </select>
                              );
                            })()}
                          </td>
                        )}

                        {/* Actions Column */}
                        <td className="p-3 text-right">
                          <button
                            onClick={() => setStateToDelete(st)}
                            title="Delete State"
                            className="text-rose-500 hover:text-rose-400 transition-colors p-1 cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Table Footer Hint */}
            <div className="flex flex-wrap items-center justify-between text-[11px] font-mono pt-1" style={{ color: mutedText }}>
              <span>💡 Tip: Changing any dropdown repoints arrows on the diagram live.</span>
              <span>Double-click state name to rename.</span>
            </div>
          </div>

        </div>

      </div>

      {/* -------------------------------------------------------------
          MODAL: Connect Transition Arrow & Assign Symbol
          ------------------------------------------------------------- */}
      {showConnectModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          style={{ backgroundColor: isDark ? "rgba(16, 9, 4, 0.8)" : "rgba(66, 72, 116, 0.4)" }}
        >
          <div 
            className="w-full max-w-md rounded-[12px] border p-6 flex flex-col gap-4 shadow-2xl"
            style={{ backgroundColor: surfaceBg, borderColor, color: textColor }}
          >
            <div className="flex items-center justify-between border-b border-dashed pb-3" style={{ borderColor }}>
              <span className="text-xs font-medium uppercase tracking-wider" style={{ color: textColor }}>
                CONNECT TRANSITION ARROW
              </span>
              <button 
                onClick={() => {
                  selectedSourceRef.current = null;
                  setSelectedSourceState(null);
                  setShowConnectModal(null);
                }} 
                className="hover:opacity-75 cursor-pointer"
                style={{ color: mutedText }}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="text-sm leading-relaxed" style={{ color: textColor }}>
              Define transition symbol from state <strong className="text-[#dc5000] font-mono">{showConnectModal.from}</strong> to state <strong className="text-[#dc5000] font-mono">{showConnectModal.to}</strong>:
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-medium uppercase" style={{ color: mutedText }}>Transition Symbol:</label>
              <input
                type="text"
                value={connectSymbolInput}
                onChange={(e) => setConnectSymbolInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleConfirmConnect();
                }}
                placeholder="e.g. a, b, 0, 1, or ε"
                className="w-full border-b bg-transparent px-2 py-2 font-mono text-sm focus:outline-none"
                style={{ borderColor, color: textColor }}
                autoFocus
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-dashed" style={{ borderColor }}>
              <button
                onClick={() => {
                  selectedSourceRef.current = null;
                  setSelectedSourceState(null);
                  setShowConnectModal(null);
                }}
                className="rounded-[22.5px] border px-5 py-2 text-xs font-medium uppercase cursor-pointer hover:opacity-80"
                style={{ borderColor, color: mutedText }}
              >
                CANCEL
              </button>
              <button
                onClick={() => handleConfirmConnect()}
                className="rounded-[36px] px-6 py-2 text-xs font-medium uppercase cursor-pointer border transition-all hover:opacity-90"
                style={{
                  backgroundColor: isDark ? "#382416" : "#424874",
                  borderColor: isDark ? "#40372e" : "#424874",
                  color: isDark ? "#ffedd7" : "#F4EEFF",
                }}
              >
                CONNECT
              </button>
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          MODAL: Delete State Confirmation with Explicit Consequences
          ------------------------------------------------------------- */}
      {stateToDelete && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          style={{ backgroundColor: isDark ? "rgba(16, 9, 4, 0.85)" : "rgba(66, 72, 116, 0.4)" }}
        >
          <div 
            className="w-full max-w-lg rounded-[12px] border border-rose-900 p-6 flex flex-col gap-5 shadow-2xl"
            style={{ backgroundColor: surfaceBg, color: textColor }}
          >
            
            <div className="flex items-center gap-3 border-b border-dashed pb-3 text-rose-500" style={{ borderColor }}>
              <AlertTriangle className="h-5 w-5" />
              <span className="text-sm font-medium uppercase tracking-wider">
                CONFIRM STATE DELETION // CONSEQUENCE AUDIT
              </span>
            </div>

            <div className="text-sm leading-relaxed" style={{ color: textColor }}>
              Are you sure you want to delete state <strong className="font-mono text-base text-rose-400">{stateToDelete}</strong>?
            </div>

            <div 
              className="rounded-[8px] p-4 border flex flex-col gap-2 font-mono text-xs"
              style={{ backgroundColor: innerBg, borderColor, color: mutedText }}
            >
              <div className="text-xs font-medium uppercase font-sans" style={{ color: textColor }}>
                Cascading Effects of this Deletion:
              </div>
              <div className="flex justify-between">
                <span>Incoming transitions to be removed:</span>
                <span className="font-bold text-rose-500">{incomingTransitionsCount}</span>
              </div>
              <div className="flex justify-between">
                <span>Outgoing transitions to be removed:</span>
                <span className="font-bold text-rose-500">{outgoingTransitionsCount}</span>
              </div>
              {isTargetStartState && (
                <div className="text-amber-500 font-sans text-xs mt-1 pt-1 border-t border-dashed" style={{ borderColor }}>
                  Notice: <strong>{stateToDelete}</strong> is currently the START STATE. Deleting it will leave the automaton without a start anchor.
                </div>
              )}
              {isTargetAcceptState && (
                <div className="text-amber-500 font-sans text-xs mt-1">
                  Notice: <strong>{stateToDelete}</strong> is an ACCEPT STATE.
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setStateToDelete(null)}
                className="rounded-[22.5px] border px-5 py-2 text-xs font-medium uppercase cursor-pointer hover:opacity-80"
                style={{ borderColor, color: mutedText }}
              >
                CANCEL
              </button>
              <button
                onClick={handleConfirmDeleteState}
                className="rounded-[36px] bg-rose-700 hover:bg-rose-800 border border-rose-600 px-6 py-2 text-xs font-medium uppercase text-white cursor-pointer shadow"
              >
                PERMANENTLY DELETE STATE
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Theoretical Breakdown Modal */}
      {showTheoryModal && theoryBreakdown && (
        <TheoreticalSummary
          theory={theoryBreakdown}
          conversionType={conversionType}
          onClose={() => setShowTheoryModal(false)}
          isDark={isDark}
        />
      )}

      {/* Vision / Image OCR Scanner Modal */}
      <VisionScannerModal
        isOpen={showScannerModal}
        onClose={() => setShowScannerModal(false)}
        onImportAutomaton={handleImportScannedAutomaton}
        isDark={isDark}
      />

    </div>
  );
};
