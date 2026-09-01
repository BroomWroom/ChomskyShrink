import React, { useState, useEffect, useRef, useCallback } from "react";
import cytoscape from "cytoscape";
import {
  Sparkles,
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
  Repeat
} from "lucide-react";
import { Automaton, parseRegexToNFA, parseSimpleTextToAutomaton } from "../core/automaton";
import { ConversionStep, TheoreticalBreakdown } from "../types/automaton";
import { ConversionPlayer } from "./ConversionPlayer";
import { TheoreticalSummary } from "./TheoreticalSummary";

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
  const [activeTab, setActiveTab] = useState<"quick" | "regex" | "text">("quick");

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

  const cyContainerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);

  // Mutable refs to solve closure issues in event listeners
  const selectedSourceRef = useRef<string | null>(null);
  const activeToolRef = useRef<"select" | "connect" | "delete">("select");
  const automatonRef = useRef<Automaton>(automaton);

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

  // Update Cytoscape Graph
  const updateCytoscape = useCallback(() => {
    if (!cyContainerRef.current) return;

    const nodeBg = isDark ? "#382416" : "#DCD6F7";
    const nodeBorder = isDark ? "#ffedd7" : "#424874";
    const textColor = isDark ? "#ffedd7" : "#424874";
    const edgeColor = isDark ? "#ffedd7" : "#424874";
    const textBgColor = isDark ? "#100904" : "#F4EEFF";

    if (!cyRef.current) {
      cyRef.current = cytoscape({
        container: cyContainerRef.current,
        maxZoom: 1.35,
        minZoom: 0.2,
        wheelSensitivity: 0.2,
        style: [
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
              "border-width": "2px",
              "border-color": nodeBorder,
              "transition-property": "background-color, border-color, width, height, border-width",
              "transition-duration": 0.25,
            },
          },
          {
            selector: "node.start-state",
            style: {
              "background-color": isDark ? "#100904" : "#424874",
              color: "#ffedd7",
              "border-color": isDark ? "#ffedd7" : "#424874",
              "border-width": "3px",
            },
          },
          {
            selector: "node.accept-state",
            style: {
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
              "border-color": "#ffedd7",
              "border-width": "4px",
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
              "transition-property": "line-color, target-arrow-color, width, control-point-step-size",
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
            selector: "node.highlighted-node",
            style: {
              "background-color": "#dc5000",
              "border-color": "#ffedd7",
              "border-width": "5px",
              width: "52px",
              height: "52px",
            },
          },
          {
            selector: "node.self-loop-pulse",
            style: {
              "background-color": "#dc5000",
              "border-color": "#ffedd7",
              "border-width": "6px",
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
        ],
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
    setAutomaton(dfa);
    onAutomatonChange?.(dfa);
    setConversionSteps(steps);
    setTheoryBreakdown(theory);
    setConversionType("NFA_TO_DFA");
    setShowPlayer(true);
  };

  const handleMinimizeDfa = () => {
    let base = automaton;
    if (automaton.isNFA()) {
      const { dfa } = automaton.toDFA();
      base = dfa;
    }
    const { minDFA, steps, theory } = base.minimizeDFA();
    setAutomaton(minDFA);
    onAutomatonChange?.(minDFA);
    setConversionSteps(steps);
    setTheoryBreakdown(theory);
    setConversionType("MINIMIZE_DFA");
    setShowPlayer(true);
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

  // Animate Simulation Step on Cytoscape Graph
  const highlightSimStep = useCallback((stepIdx: number, resultData: typeof testResult) => {
    if (!cyRef.current || !resultData) return;
    const cy = cyRef.current;

    // Reset previous highlights
    cy.nodes().removeClass("highlighted-node self-loop-pulse");
    cy.edges().removeClass("highlighted-edge self-loop-active");

    if (stepIdx < 0) {
      // Highlight start state
      if (automaton.startState) {
        cy.getElementById(automaton.startState).addClass("highlighted-node");
      }
      return;
    }

    const step = resultData.path[stepIdx];
    if (!step) return;

    const isSelfLoop = step.state === step.nextState;

    if (isSelfLoop) {
      // Highlight self-loop edge with distinct vibration
      const edgeId = `e_${step.state}_${step.nextState}`;
      const edge = cy.getElementById(edgeId);
      if (edge.length > 0) {
        edge.addClass("self-loop-active");
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
      // Highlight transition edge & target node
      const edgeId = `e_${step.state}_${step.nextState}`;
      const edge = cy.getElementById(edgeId);
      if (edge.length > 0) {
        edge.addClass("highlighted-edge");
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

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 lg:p-6 text-[#ffedd7]">
      
      {/* Top Action Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-[12px] border border-[#40372e] bg-[#1a1007] p-4">
        
        {/* Preset Selector */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium uppercase tracking-wider text-[#a69888]">
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
              } else if (val === "nfa_sample") {
                const auto = parseSimpleTextToAutomaton(
                  "->q0\nq0 --a--> q0\nq0 --b--> q0\nq0 --a--> q1\nq1 --b--> q2\nq2*"
                );
                setAutomaton(auto);
                onAutomatonChange?.(auto);
              } else if (val === "dfa_minimization") {
                const auto = parseSimpleTextToAutomaton(
                  "->A\nA --0--> B\nA --1--> C\nB --0--> A\nB --1--> D\nC* --0--> E\nC* --1--> F\nD* --0--> E\nD* --1--> F\nE* --0--> E\nE* --1--> F\nF* --0--> F\nF* --1--> F"
                );
                setAutomaton(auto);
                onAutomatonChange?.(auto);
              }
            }}
            className="rounded-[22.5px] border border-[#40372e] bg-[#100904] px-4 py-1.5 font-mono text-xs text-[#ffedd7] focus:outline-none cursor-pointer"
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
            onClick={handleConvertNfaToDfa}
            className="inline-flex items-center gap-2 rounded-[36px] bg-[#382416] px-5 py-2 text-xs font-medium uppercase text-[#ffedd7] hover:bg-[#40372e] transition-all cursor-pointer border border-[#40372e]"
          >
            <Sparkles className="h-4 w-4" />
            <span>CONVERT NFA → DFA</span>
          </button>

          <button
            onClick={handleMinimizeDfa}
            className="inline-flex items-center gap-2 rounded-[22.5px] border border-[#ffedd7] bg-transparent px-5 py-2 text-xs font-medium uppercase text-[#ffedd7] hover:bg-[#ffedd7]/10 transition-all cursor-pointer"
          >
            <ListFilter className="h-4 w-4" />
            <span>MINIMIZE DFA</span>
          </button>

          {theoryBreakdown && (
            <button
              onClick={() => setShowTheoryModal(true)}
              className="inline-flex items-center gap-2 rounded-[22.5px] border border-[#40372e] bg-[#100904] px-4 py-2 text-xs font-medium uppercase text-[#ffedd7] hover:border-[#6c5f51] transition-all cursor-pointer"
            >
              <BookOpen className="h-4 w-4 text-[#a69888]" />
              <span>THEORY DOCS</span>
            </button>
          )}

          <button
            onClick={handleClear}
            className="rounded-[22.5px] border border-[#40372e] px-4 py-2 text-xs font-medium uppercase text-[#a69888] hover:text-[#ffedd7] transition-all cursor-pointer"
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
          <div className="rounded-[12px] border border-[#40372e] bg-[#1a1007] p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-dashed border-[#40372e] pb-3">
              <span className="text-xs font-medium uppercase tracking-wider text-[#ffedd7]">
                DRAG & DROP TOOLBOX
              </span>
              <span className="text-[10px] font-mono text-[#6c5f51]">
                DRAG TO CANVAS
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2.5">
              
              {/* State Node */}
              <div
                draggable
                onDragStart={(e) => e.dataTransfer.setData("text/plain", "state")}
                className="flex flex-col items-center justify-center p-3 rounded-[12px] border border-[#40372e] bg-[#100904] hover:border-[#ffedd7] cursor-grab active:cursor-grabbing transition-all text-center"
              >
                <div className="w-8 h-8 rounded-full border border-[#ffedd7] bg-[#382416] flex items-center justify-center font-mono text-xs font-bold text-[#ffedd7]">
                  q
                </div>
                <span className="text-[10px] font-medium uppercase text-[#a69888] mt-1.5">State</span>
              </div>

              {/* Start State Node */}
              <div
                draggable
                onDragStart={(e) => e.dataTransfer.setData("text/plain", "start_state")}
                className="flex flex-col items-center justify-center p-3 rounded-[12px] border border-[#40372e] bg-[#100904] hover:border-[#ffedd7] cursor-grab active:cursor-grabbing transition-all text-center"
              >
                <div className="w-8 h-8 rounded-full border-2 border-[#ffedd7] bg-[#100904] flex items-center justify-center font-mono text-xs font-bold text-[#ffedd7]">
                  q₀
                </div>
                <span className="text-[10px] font-medium uppercase text-[#a69888] mt-1.5">Start</span>
              </div>

              {/* Accept State Node */}
              <div
                draggable
                onDragStart={(e) => e.dataTransfer.setData("text/plain", "accept_state")}
                className="flex flex-col items-center justify-center p-3 rounded-[12px] border border-[#40372e] bg-[#100904] hover:border-[#ffedd7] cursor-grab active:cursor-grabbing transition-all text-center"
              >
                <div className="w-8 h-8 rounded-full border-[3px] border-double border-[#ffedd7] bg-[#382416] flex items-center justify-center font-mono text-xs font-bold text-[#ffedd7]">
                  q*
                </div>
                <span className="text-[10px] font-medium uppercase text-[#a69888] mt-1.5">Accept</span>
              </div>

              {/* Transition Connector Tool */}
              <div
                onClick={() => {
                  setActiveTool((prev) => (prev === "connect" ? "select" : "connect"));
                }}
                className={`flex flex-col items-center justify-center p-3 rounded-[12px] border transition-all text-center cursor-pointer ${
                  activeTool === "connect"
                    ? "border-[#dc5000] bg-[#382416]"
                    : "border-[#40372e] bg-[#100904] hover:border-[#ffedd7]"
                }`}
              >
                <div className="w-8 h-8 rounded-full border border-[#ffedd7] flex items-center justify-center text-[#ffedd7]">
                  <Link className="h-4 w-4" />
                </div>
                <span className="text-[10px] font-medium uppercase text-[#a69888] mt-1.5">Connect</span>
              </div>

            </div>

            {/* Quick Connect Row */}
            {automaton.states.length >= 1 && (
              <div className="flex flex-col gap-2 rounded-[8px] bg-[#100904] p-3 border border-[#40372e]">
                <div className="text-[10px] font-medium uppercase text-[#a69888]">
                  Direct Connect Controls:
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[9px] font-mono text-[#6c5f51] block uppercase">From</label>
                    <select
                      value={manualFrom}
                      onChange={(e) => setManualFrom(e.target.value)}
                      className="w-full bg-[#1a1007] border border-[#40372e] rounded px-1.5 py-1 text-xs font-mono text-[#ffedd7] focus:outline-none"
                    >
                      {automaton.states.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[9px] font-mono text-[#6c5f51] block uppercase">To</label>
                    <select
                      value={manualTo}
                      onChange={(e) => setManualTo(e.target.value)}
                      className="w-full bg-[#1a1007] border border-[#40372e] rounded px-1.5 py-1 text-xs font-mono text-[#ffedd7] focus:outline-none"
                    >
                      {automaton.states.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[9px] font-mono text-[#6c5f51] block uppercase">Symbol</label>
                    <input
                      type="text"
                      value={manualSymbol}
                      onChange={(e) => setManualSymbol(e.target.value)}
                      placeholder="a"
                      className="w-full bg-[#1a1007] border border-[#40372e] rounded px-1.5 py-1 text-xs font-mono text-[#ffedd7] focus:outline-none"
                    />
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (manualFrom && manualTo) {
                      handleConfirmConnect(manualFrom, manualTo, manualSymbol);
                    }
                  }}
                  className="w-full rounded-[22.5px] border border-[#40372e] bg-[#382416] py-1.5 text-xs font-medium uppercase text-[#ffedd7] hover:bg-[#40372e] transition-all cursor-pointer mt-1"
                >
                  + Add Transition Arrow
                </button>
              </div>
            )}

            {/* Active Mode Notice */}
            {selectedSourceState && (
              <div className="rounded-[8px] bg-[#382416] p-3 text-xs text-[#ffedd7] border border-[#dc5000] flex items-center justify-between animate-pulse">
                <span>Selected source: <strong className="text-amber-300">{selectedSourceState}</strong>. Now click target state node!</span>
                <button
                  onClick={() => {
                    selectedSourceRef.current = null;
                    setSelectedSourceState(null);
                  }}
                  className="text-[10px] uppercase text-[#a69888] hover:text-[#ffedd7] ml-2"
                >
                  Cancel
                </button>
              </div>
            )}

          </div>

          {/* Input Methods Card */}
          <div className="rounded-[12px] border border-[#40372e] bg-[#1a1007] p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-dashed border-[#40372e] pb-3">
              <span className="text-xs font-medium uppercase tracking-wider text-[#ffedd7]">
                INPUT MODES
              </span>
              <div className="flex gap-1.5">
                <button
                  onClick={() => setActiveTab("quick")}
                  className={`px-3 py-1 text-xs font-medium uppercase rounded-[22.5px] transition-all cursor-pointer ${
                    activeTab === "quick" ? "bg-[#382416] text-[#ffedd7] border border-[#40372e]" : "text-[#a69888] hover:text-[#ffedd7]"
                  }`}
                >
                  QUICK
                </button>
                <button
                  onClick={() => setActiveTab("regex")}
                  className={`px-3 py-1 text-xs font-medium uppercase rounded-[22.5px] transition-all cursor-pointer ${
                    activeTab === "regex" ? "bg-[#382416] text-[#ffedd7] border border-[#40372e]" : "text-[#a69888] hover:text-[#ffedd7]"
                  }`}
                >
                  REGEX
                </button>
                <button
                  onClick={() => setActiveTab("text")}
                  className={`px-3 py-1 text-xs font-medium uppercase rounded-[22.5px] transition-all cursor-pointer ${
                    activeTab === "text" ? "bg-[#382416] text-[#ffedd7] border border-[#40372e]" : "text-[#a69888] hover:text-[#ffedd7]"
                  }`}
                >
                  TEXT
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
                    className="w-full border-b border-[#40372e] bg-transparent px-2 py-1.5 font-mono text-xs text-[#ffedd7] focus:outline-none focus:border-[#ffedd7]"
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
                    className="rounded-[22.5px] border border-[#ffedd7] px-4 py-1.5 text-xs font-medium uppercase text-[#ffedd7] hover:bg-[#ffedd7]/10 transition-all cursor-pointer"
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
                    className="w-full border-b border-[#40372e] bg-transparent px-2 py-1.5 font-mono text-xs text-[#ffedd7] focus:outline-none focus:border-[#ffedd7]"
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
                    className="rounded-[22.5px] border border-[#40372e] px-4 py-1.5 text-xs font-medium uppercase text-[#ffedd7] hover:border-[#6c5f51] transition-all cursor-pointer"
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
                  className="w-full border-b border-[#40372e] bg-transparent px-2 py-1.5 font-mono text-xs text-[#ffedd7] focus:outline-none focus:border-[#ffedd7]"
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
                    className="flex-1 rounded-[36px] bg-[#382416] py-2 text-xs font-medium uppercase text-[#ffedd7] hover:bg-[#40372e] transition-all cursor-pointer border border-[#40372e]"
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
                    className="flex-1 rounded-[22.5px] border border-[#ffedd7] py-2 text-xs font-medium uppercase text-[#ffedd7] hover:bg-[#ffedd7]/10 transition-all cursor-pointer"
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
                  className="w-full rounded-[8px] border border-[#40372e] bg-[#100904] p-3 font-mono text-xs text-[#ffedd7] focus:outline-none focus:border-[#ffedd7] resize-none"
                  placeholder="->q0&#10;q0 --a--> q1&#10;q1*"
                />
                <button
                  onClick={() => {
                    const auto = parseSimpleTextToAutomaton(simpleTextInput);
                    setAutomaton(auto);
                    onAutomatonChange?.(auto);
                  }}
                  className="rounded-[36px] bg-[#382416] py-2 text-xs font-medium uppercase text-[#ffedd7] hover:bg-[#40372e] transition-all cursor-pointer border border-[#40372e]"
                >
                  APPLY TEXT NOTATION
                </button>
              </div>
            )}

          </div>

          {/* Live String Simulator Card with Self-Loop Animations */}
          <div className="rounded-[12px] border border-[#40372e] bg-[#1a1007] p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-dashed border-[#40372e] pb-3">
              <span className="text-xs font-medium uppercase tracking-wider text-[#ffedd7]">
                EXECUTION SIMULATOR
              </span>
              {isCurrentStepSelfLoop && (
                <span className="flex items-center gap-1 text-[10px] font-mono text-[#dc5000] font-bold animate-pulse">
                  <RotateCw className="h-3 w-3 animate-spin" />
                  SELF-LOOP ACTIVE ↺
                </span>
              )}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter test string (e.g. abb)"
                value={testString}
                onChange={(e) => setTestString(e.target.value)}
                className="w-full border-b border-[#40372e] bg-transparent px-2 py-1.5 font-mono text-xs text-[#ffedd7] focus:outline-none focus:border-[#ffedd7]"
              />
              <button
                onClick={handleRunTestString}
                className="rounded-[36px] bg-[#382416] px-5 py-1.5 text-xs font-medium uppercase text-[#ffedd7] hover:bg-[#40372e] transition-all cursor-pointer border border-[#40372e]"
              >
                EXECUTE
              </button>
            </div>

            {/* Interactive Step-by-Step Playback Controls */}
            {testResult && testResult.path.length > 0 && (
              <div className="rounded-[8px] bg-[#100904] p-3.5 border border-[#40372e] flex flex-col gap-3">
                
                {/* Status Bar */}
                <div className="flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <span className="text-[#a69888]">STEP:</span>
                    <span className="font-bold text-[#ffedd7]">
                      {currentSimStepIndex + 1} / {testResult.path.length}
                    </span>
                  </div>

                  {currentStepData && (
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-amber-300">
                        {currentStepData.state}
                      </span>
                      <span>--{currentStepData.symbolConsumed}&rarr;</span>
                      <span className="font-bold text-amber-300">
                        {currentStepData.nextState}
                      </span>
                      {isCurrentStepSelfLoop && (
                        <span className="text-[10px] bg-[#382416] text-[#dc5000] px-1.5 py-0.5 rounded border border-[#dc5000] font-bold">
                          ↺ LOOP
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Stream Character Progress */}
                <div className="flex gap-1.5 overflow-x-auto py-1 font-mono text-xs">
                  {testString.split("").map((ch, idx) => (
                    <span
                      key={idx}
                      className={`px-2 py-0.5 rounded transition-all ${
                        idx === currentSimStepIndex
                          ? "bg-[#dc5000] text-white font-bold scale-110 shadow"
                          : idx < currentSimStepIndex
                          ? "bg-[#382416] text-[#a69888] border border-[#40372e]"
                          : "bg-[#100904] text-[#6c5f51] border border-[#40372e]"
                      }`}
                    >
                      {ch}
                    </span>
                  ))}
                </div>

                {/* Timeline Controls */}
                <div className="flex items-center justify-between pt-1 border-t border-dashed border-[#40372e]">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        setIsSimPlaying(false);
                        const prev = Math.max(0, currentSimStepIndex - 1);
                        setCurrentSimStepIndex(prev);
                        highlightSimStep(prev, testResult);
                      }}
                      disabled={currentSimStepIndex <= 0}
                      className="p-1 rounded border border-[#40372e] text-[#a69888] hover:text-[#ffedd7] disabled:opacity-30 cursor-pointer"
                    >
                      <SkipBack className="h-3.5 w-3.5" />
                    </button>

                    <button
                      onClick={() => setIsSimPlaying(!isSimPlaying)}
                      className="px-3 py-1 rounded-[22.5px] bg-[#382416] border border-[#40372e] text-xs font-mono text-[#ffedd7] hover:bg-[#40372e] cursor-pointer"
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
                      className="p-1 rounded border border-[#40372e] text-[#a69888] hover:text-[#ffedd7] disabled:opacity-30 cursor-pointer"
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
                    className="p-1 rounded border border-[#40372e] text-[#a69888] hover:text-[#ffedd7] cursor-pointer"
                    title="Reset Trace"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                  </button>
                </div>

              </div>
            )}

            {testResult && (
              <div className={`p-3.5 rounded-[8px] border text-xs font-mono flex flex-col gap-1.5 ${
                testResult.accepted
                  ? "bg-emerald-950/40 border-emerald-800 text-emerald-200"
                  : "bg-rose-950/40 border-rose-800 text-rose-200"
              }`}>
                <div className="font-bold flex items-center justify-between uppercase">
                  <span>VERDICT: {testResult.accepted ? "ACCEPTED" : "REJECTED"}</span>
                  <span className="text-[10px] opacity-75">FINAL: {testResult.finalState}</span>
                </div>
                <div className="text-[11px] font-sans opacity-90">{testResult.details}</div>
              </div>
            )}
          </div>

          {/* Formal Definition Summary */}
          <div className="rounded-[12px] border border-[#40372e] bg-[#1a1007] p-5 flex flex-col gap-3 font-mono text-xs">
            <span className="text-xs font-medium uppercase tracking-wider text-[#a69888] font-sans">
              FORMAL 5-TUPLE M = (Q, Σ, δ, q₀, F)
            </span>
            <div className="bg-[#100904] p-3 rounded-[8px] border border-[#40372e] space-y-1.5 text-[#ffedd7]">
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
          <div className="relative rounded-[12px] border border-[#40372e] bg-[#100904] overflow-hidden flex flex-col shadow-2xl">
            
            {/* Canvas Header */}
            <div className="flex items-center justify-between border-b border-[#40372e] bg-[#1a1007] px-5 py-3 z-10">
              <div className="flex items-center gap-6 text-xs font-mono text-[#a69888]">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full border-2 border-[#ffedd7] bg-[#100904]" />
                  <span>START STATE</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full border border-[#ffedd7] bg-[#382416]" />
                  <span>NORMAL</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 rounded-full border-[2px] border-double border-[#ffedd7] bg-[#382416]" />
                  <span>ACCEPT</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => cyRef.current?.fit(undefined, 30)}
                  title="Fit View"
                  className="rounded-[6px] border border-[#40372e] bg-[#100904] p-1.5 text-[#ffedd7] hover:border-[#6c5f51] cursor-pointer"
                >
                  <Maximize2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => {
                    if (cyRef.current) {
                      const png = cyRef.current.png({ full: true, bg: "#100904" });
                      const a = document.createElement("a");
                      a.href = png;
                      a.download = "automaton.png";
                      a.click();
                    }
                  }}
                  title="Export Diagram PNG"
                  className="rounded-[6px] border border-[#40372e] bg-[#100904] p-1.5 text-[#ffedd7] hover:border-[#6c5f51] cursor-pointer"
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
              className="w-full h-[520px] bg-[#100904] cursor-crosshair relative"
            />

            {/* Bottom Hint Bar */}
            <div className="absolute bottom-3 left-3 z-10 flex items-center gap-2 rounded-[8px] bg-[#1a1007]/90 backdrop-blur-md border border-[#40372e] px-3.5 py-1.5 text-[11px] text-[#a69888]">
              <HelpCircle className="h-3.5 w-3.5 text-[#ffedd7]" />
              <span>Click source state then target state to link. Self-loops pulse with animation in simulator.</span>
            </div>

          </div>

          {/* Video Walkthrough Player (when conversion is active) */}
          {showPlayer && conversionSteps && (
            <ConversionPlayer
              steps={conversionSteps}
              onStepChange={(step) => {
                setAutomaton(new Automaton(step.intermediateAutomaton));
              }}
              onClose={() => setShowPlayer(false)}
            />
          )}

          {/* Transition Table & Symbol Editor */}
          <div className="rounded-[12px] border border-[#40372e] bg-[#1a1007] p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-dashed border-[#40372e] pb-3">
              <span className="text-xs font-medium uppercase tracking-wider text-[#ffedd7]">
                TRANSITION MATRIX (δ)
              </span>
              <span className="font-mono text-xs text-[#a69888]">
                {automaton.isNFA() ? "NON-DETERMINISTIC (NFA)" : "DETERMINISTIC (DFA)"}
              </span>
            </div>

            <div className="overflow-x-auto rounded-[8px] border border-[#40372e]">
              <table className="w-full text-left font-mono text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#40372e] bg-[#100904] text-[#a69888]">
                    <th className="p-3">State</th>
                    {automaton.alphabet.map((sym) => (
                      <th key={sym} className="p-3">{sym}</th>
                    ))}
                    {automaton.isNFA() && <th className="p-3">ε</th>}
                    <th className="p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {automaton.states.map((st, idx) => {
                    const isStart = st === automaton.startState;
                    const isAccept = automaton.acceptStates.includes(st);
                    return (
                      <tr
                        key={st}
                        className={`border-b border-[#40372e]/60 ${idx % 2 === 1 ? "bg-[#100904]/40" : ""}`}
                      >
                        <td className="p-3 font-bold text-[#ffedd7]">
                          {isStart ? "→ " : ""}{st}{isAccept ? " *" : ""}
                        </td>
                        {automaton.alphabet.map((sym) => {
                          const tgts = automaton.transitions
                            .filter((t) => t.from === st && t.symbol === sym)
                            .map((t) => t.to)
                            .join(", ");
                          return (
                            <td key={sym} className="p-3 text-[#ffedd7]">
                              {tgts || "—"}
                            </td>
                          );
                        })}
                        {automaton.isNFA() && (
                          <td className="p-3 text-[#a69888]">
                            {automaton.transitions
                              .filter((t) => t.from === st && (t.symbol === "ε" || t.symbol === "e" || t.symbol === ""))
                              .map((t) => t.to)
                              .join(", ") || "—"}
                          </td>
                        )}
                        <td className="p-3">
                          <button
                            onClick={() => setStateToDelete(st)}
                            title="Delete State"
                            className="text-rose-400 hover:text-rose-300 transition-colors p-1 cursor-pointer"
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
          </div>

        </div>

      </div>

      {/* -------------------------------------------------------------
          MODAL: Connect Transition Arrow & Assign Symbol
          ------------------------------------------------------------- */}
      {showConnectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#100904]/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-[12px] border border-[#40372e] bg-[#1a1007] p-6 text-[#ffedd7] flex flex-col gap-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-dashed border-[#40372e] pb-3">
              <span className="text-xs font-medium uppercase tracking-wider text-[#ffedd7]">
                CONNECT TRANSITION ARROW
              </span>
              <button 
                onClick={() => {
                  selectedSourceRef.current = null;
                  setSelectedSourceState(null);
                  setShowConnectModal(null);
                }} 
                className="text-[#a69888] hover:text-[#ffedd7] cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="text-sm text-[#ffedd7]/90 leading-relaxed">
              Define transition symbol from state <strong className="text-amber-300 font-mono">{showConnectModal.from}</strong> to state <strong className="text-amber-300 font-mono">{showConnectModal.to}</strong>:
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-medium uppercase text-[#a69888]">Transition Symbol:</label>
              <input
                type="text"
                value={connectSymbolInput}
                onChange={(e) => setConnectSymbolInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleConfirmConnect();
                }}
                placeholder="e.g. a, b, 0, 1, or ε"
                className="w-full border-b border-[#40372e] bg-transparent px-2 py-2 font-mono text-sm text-[#ffedd7] focus:outline-none focus:border-[#ffedd7]"
                autoFocus
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-dashed border-[#40372e]">
              <button
                onClick={() => {
                  selectedSourceRef.current = null;
                  setSelectedSourceState(null);
                  setShowConnectModal(null);
                }}
                className="rounded-[22.5px] border border-[#40372e] px-5 py-2 text-xs font-medium uppercase text-[#a69888] hover:text-[#ffedd7] cursor-pointer"
              >
                CANCEL
              </button>
              <button
                onClick={() => handleConfirmConnect()}
                className="rounded-[36px] bg-[#382416] px-6 py-2 text-xs font-medium uppercase text-[#ffedd7] hover:bg-[#40372e] border border-[#40372e] cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#100904]/85 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-[12px] border border-rose-900 bg-[#1a1007] p-6 text-[#ffedd7] flex flex-col gap-5 shadow-2xl">
            
            <div className="flex items-center gap-3 border-b border-dashed border-[#40372e] pb-3 text-rose-400">
              <AlertTriangle className="h-5 w-5" />
              <span className="text-sm font-medium uppercase tracking-wider">
                CONFIRM STATE DELETION // CONSEQUENCE AUDIT
              </span>
            </div>

            <div className="text-sm text-[#ffedd7] leading-relaxed">
              Are you sure you want to delete state <strong className="font-mono text-base text-rose-300">{stateToDelete}</strong>?
            </div>

            <div className="rounded-[8px] bg-[#100904] p-4 border border-[#40372e] flex flex-col gap-2 font-mono text-xs text-[#a69888]">
              <div className="text-xs font-medium uppercase text-[#ffedd7] font-sans">
                Cascading Effects of this Deletion:
              </div>
              <div className="flex justify-between">
                <span>Incoming transitions to be removed:</span>
                <span className="font-bold text-rose-400">{incomingTransitionsCount}</span>
              </div>
              <div className="flex justify-between">
                <span>Outgoing transitions to be removed:</span>
                <span className="font-bold text-rose-400">{outgoingTransitionsCount}</span>
              </div>
              {isTargetStartState && (
                <div className="text-amber-400 font-sans text-xs mt-1 pt-1 border-t border-dashed border-[#40372e]">
                  Notice: <strong>{stateToDelete}</strong> is currently the START STATE. Deleting it will leave the automaton without a start anchor.
                </div>
              )}
              {isTargetAcceptState && (
                <div className="text-amber-400 font-sans text-xs mt-1">
                  Notice: <strong>{stateToDelete}</strong> is an ACCEPT STATE.
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setStateToDelete(null)}
                className="rounded-[22.5px] border border-[#40372e] px-5 py-2 text-xs font-medium uppercase text-[#a69888] hover:text-[#ffedd7] cursor-pointer"
              >
                CANCEL
              </button>
              <button
                onClick={handleConfirmDeleteState}
                className="rounded-[36px] bg-rose-950 border border-rose-800 px-6 py-2 text-xs font-medium uppercase text-rose-200 hover:bg-rose-900 cursor-pointer"
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
        />
      )}

    </div>
  );
};
