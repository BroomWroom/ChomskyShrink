import React, { useState, useEffect } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  ArrowRight,
  Play,
  Mail,
  Github,
  Globe,
  FileText,
  Sparkles,
  BookOpen,
  Trophy,
  Cpu,
  Layers,
  CheckCircle2,
  Heart,
  ExternalLink,
  MessageSquare,
  ShieldCheck,
  X
} from "lucide-react";
import { ChomskyLogo } from "./ui/ChomskyLogo";
import { Dock, DockIcon, DockItem, DockLabel } from "./ui/dock";

interface LandingPageProps {
  onNavigate: (tab: string) => void;
  isDark?: boolean;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate, isDark = true }) => {
  // Interactive Automata Simulation State in Hero
  const [simStep, setSimStep] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [showCreditsModal, setShowCreditsModal] = useState<boolean>(false);
  const inputChars = ["b", "a", "b", "b"];
  
  const simulationStates = [
    { state: "q0", symbol: "b", isSelfLoop: true, desc: "Self-Loop: δ(q₀, b) → q₀ (Looping in start state ↺)" },
    { state: "q1", symbol: "a", isSelfLoop: false, desc: "Traversing δ(q₀, a) → q₁" },
    { state: "q2", symbol: "b", isSelfLoop: false, desc: "Traversing δ(q₁, b) → q₂" },
    { state: "q3", symbol: "b", isSelfLoop: false, desc: "Traversing δ(q₂, b) → q₃* [ACCEPTED]" },
  ];

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setSimStep((prev) => (prev + 1) % simulationStates.length);
    }, 1800);
    return () => clearInterval(interval);
  }, [isPlaying, simulationStates.length]);

  const primaryBg = isDark ? "#100904" : "#F4EEFF";
  const surfaceBg = isDark ? "#1a1007" : "#FFFFFF";
  const borderColor = isDark ? "#40372e" : "#DCD6F7";
  const textColor = isDark ? "#ffedd7" : "#424874";
  const mutedText = isDark ? "#a69888" : "#5f6594";
  const dimText = isDark ? "#6c5f51" : "#8b92be";

  // Footer Dock: Contacts, Emails, Credits (No Theory redirection)
  const footerDockData = [
    {
      title: "Email Support",
      icon: <Mail className="h-full w-full text-[#ffedd7]" />,
      action: () => window.open("mailto:support@chomskyshrink.internal", "_blank"),
    },
    {
      title: "GitHub Repository",
      icon: <Github className="h-full w-full text-[#ffedd7]" />,
      action: () => window.open("https://github.com", "_blank"),
    },
    {
      title: "Academic Credits",
      icon: <FileText className="h-full w-full text-[#ffedd7]" />,
      action: () => setShowCreditsModal(true),
    },
    {
      title: "Community & Feedback",
      icon: <MessageSquare className="h-full w-full text-[#ffedd7]" />,
      action: () => window.open("mailto:feedback@chomskyshrink.internal", "_blank"),
    },
    {
      title: "System Sandbox",
      icon: <ShieldCheck className="h-full w-full text-[#ffedd7]" />,
      action: () => alert("ChomskyShrink Engine: 100% Client-Side In-Memory Execution Sandbox."),
    },
  ];

  return (
    <div
      className="w-full overflow-x-hidden transition-colors duration-300 font-sans selection:bg-[#382416] selection:text-[#ffedd7] pb-32"
      style={{ backgroundColor: primaryBg, color: textColor }}
    >
      
      {/* -------------------------------------------------------------
          HERO SECTION: Clean Editorial Layout (No Eyebrow Headings)
          ------------------------------------------------------------- */}
      <section 
        className="relative min-h-[86vh] w-full flex flex-col justify-center p-6 sm:p-10 md:p-14 lg:p-20 border-b"
        style={{ borderColor }}
      >
        
        {/* Central Hero Grid */}
        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Direct Typography & CTAs */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-6 flex flex-col gap-6"
          >
            
            <h1 
              className="text-5xl sm:text-7xl md:text-8xl font-medium tracking-tight uppercase leading-[0.88]"
              style={{ color: textColor }}
            >
              CHOMSKY<br />
              SHRINK.
            </h1>

            <p 
              className="text-xl sm:text-2xl font-normal leading-[1.3] max-w-xl"
              style={{ color: isDark ? "rgba(255, 237, 215, 0.9)" : "rgba(66, 72, 116, 0.9)" }}
            >
              A finite state machine suite engineered to determinize models, compute epsilon closures, execute Hopcroft partition minimization, and verify language equivalence.
            </p>

            {/* Direct CTAs */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              
              <button
                onClick={() => onNavigate("converter")}
                className="inline-flex items-center gap-3 rounded-[36px] px-8 py-3.5 text-xs sm:text-sm font-medium uppercase tracking-wider transition-all cursor-pointer border hover:opacity-90 shadow-xl"
                style={{
                  backgroundColor: isDark ? "#382416" : "#424874",
                  color: isDark ? "#ffedd7" : "#F4EEFF",
                  borderColor: isDark ? "#40372e" : "#424874",
                }}
              >
                <span>LAUNCH STUDIO</span>
                <ArrowRight className="h-4 w-4" />
              </button>

              <button
                onClick={() => onNavigate("practice")}
                className="inline-flex items-center gap-2 rounded-[22.5px] border bg-transparent px-7 py-3 text-xs sm:text-sm font-medium uppercase tracking-wider transition-all cursor-pointer"
                style={{
                  borderColor: textColor,
                  color: textColor,
                }}
              >
                <span>PRACTICE ARENA</span>
              </button>

            </div>

          </motion.div>

          {/* Right Column: Accurate Interactive Finite Automata Visualizer */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-6 flex justify-center items-center"
          >
            
            <div 
              className="w-full max-w-lg rounded-[16px] border p-6 flex flex-col gap-6 shadow-2xl backdrop-blur-md relative"
              style={{ backgroundColor: surfaceBg, borderColor }}
            >
              
              {/* Visualizer Header */}
              <div className="flex items-center justify-between border-b border-dashed pb-3" style={{ borderColor }}>
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#dc5000] animate-ping" />
                  <span className="font-mono text-xs font-bold uppercase" style={{ color: textColor }}>
                    LIVE DFA TRACE // L = (a|b)*abb
                  </span>
                </div>
                
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="rounded-[22.5px] border px-3 py-1 text-[10px] font-mono uppercase transition-all cursor-pointer"
                  style={{ borderColor, color: mutedText }}
                >
                  {isPlaying ? "PAUSE" : "PLAY"}
                </button>
              </div>

              {/* Connected State Machine Flow Diagram */}
              <div className="relative py-8 flex items-center justify-between px-2">
                
                {/* State q0 (Start) with Self-Loop Arc */}
                <div className="flex flex-col items-center gap-2 relative z-10">
                  {/* Self-Loop Transition Arc */}
                  <div className={`absolute -top-6 flex items-center justify-center transition-all duration-300 ${
                    simStep === 0 ? "scale-110 opacity-100" : "opacity-40"
                  }`}>
                    <div className={`w-8 h-8 rounded-full border-2 border-dashed border-b-0 flex items-center justify-center ${
                      simStep === 0 ? "border-[#dc5000] animate-spin" : "border-[#6c5f51]"
                    }`}>
                      <span className="text-[9px] font-mono font-bold text-[#ffedd7] bg-[#382416] px-1 rounded -mt-6">
                        b
                      </span>
                    </div>
                  </div>

                  <div 
                    onClick={() => setSimStep(0)}
                    className={`w-14 h-14 rounded-full border-2 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 ${
                      simulationStates[simStep].state === "q0"
                        ? "scale-110 ring-4 ring-[#dc5000] bg-[#382416]"
                        : "bg-[#100904]"
                    }`}
                    style={{ borderColor: textColor }}
                  >
                    <span className="font-mono text-sm font-bold" style={{ color: textColor }}>q₀</span>
                    <span className="text-[8px] font-mono text-[#dc5000] -mt-0.5">
                      {simStep === 0 ? "↺ LOOP" : "START"}
                    </span>
                  </div>
                  <span className="text-[9px] font-mono" style={{ color: dimText }}>q₀</span>
                </div>

                {/* Arrow q0 -> q1 */}
                <div className="flex-1 flex flex-col items-center relative -mt-4">
                  <span className="text-[11px] font-mono font-bold text-[#ffedd7] bg-[#382416] px-1.5 py-0.5 rounded border border-[#40372e]">
                    a
                  </span>
                  <div className={`w-full h-0.5 transition-all duration-300 ${
                    simStep >= 1 ? "bg-[#dc5000]" : "bg-[#40372e]"
                  }`} />
                  <span className="text-[10px] -mt-2 text-[#40372e]">▶</span>
                </div>

                {/* State q1 */}
                <div className="flex flex-col items-center gap-2 relative z-10">
                  <div 
                    onClick={() => setSimStep(1)}
                    className={`w-14 h-14 rounded-full border-2 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 ${
                      simulationStates[simStep].state === "q1"
                        ? "scale-110 ring-4 ring-[#dc5000] bg-[#382416]"
                        : "bg-[#100904]"
                    }`}
                    style={{ borderColor: textColor }}
                  >
                    <span className="font-mono text-sm font-bold" style={{ color: textColor }}>q₁</span>
                    <span className="text-[8px] font-mono opacity-60 -mt-0.5">a-seen</span>
                  </div>
                  <span className="text-[9px] font-mono" style={{ color: dimText }}>q₁</span>
                </div>

                {/* Arrow q1 -> q2 */}
                <div className="flex-1 flex flex-col items-center relative -mt-4">
                  <span className="text-[11px] font-mono font-bold text-[#ffedd7] bg-[#382416] px-1.5 py-0.5 rounded border border-[#40372e]">
                    b
                  </span>
                  <div className={`w-full h-0.5 transition-all duration-300 ${
                    simStep >= 2 ? "bg-[#dc5000]" : "bg-[#40372e]"
                  }`} />
                  <span className="text-[10px] -mt-2 text-[#40372e]">▶</span>
                </div>

                {/* State q2 */}
                <div className="flex flex-col items-center gap-2 relative z-10">
                  <div 
                    onClick={() => setSimStep(2)}
                    className={`w-14 h-14 rounded-full border-2 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 ${
                      simulationStates[simStep].state === "q2"
                        ? "scale-110 ring-4 ring-[#dc5000] bg-[#382416]"
                        : "bg-[#100904]"
                    }`}
                    style={{ borderColor: textColor }}
                  >
                    <span className="font-mono text-sm font-bold" style={{ color: textColor }}>q₂</span>
                    <span className="text-[8px] font-mono opacity-60 -mt-0.5">ab-seen</span>
                  </div>
                  <span className="text-[9px] font-mono" style={{ color: dimText }}>q₂</span>
                </div>

                {/* Arrow q2 -> q3 */}
                <div className="flex-1 flex flex-col items-center relative -mt-4">
                  <span className="text-[11px] font-mono font-bold text-[#ffedd7] bg-[#382416] px-1.5 py-0.5 rounded border border-[#40372e]">
                    b
                  </span>
                  <div className={`w-full h-0.5 transition-all duration-300 ${
                    simStep >= 3 ? "bg-[#dc5000]" : "bg-[#40372e]"
                  }`} />
                  <span className="text-[10px] -mt-2 text-[#40372e]">▶</span>
                </div>

                {/* State q3* (Accept State Double Ring) */}
                <div className="flex flex-col items-center gap-2 relative z-10">
                  <div 
                    onClick={() => setSimStep(3)}
                    className={`w-14 h-14 rounded-full border-[3px] border-double flex flex-col items-center justify-center cursor-pointer transition-all duration-300 ${
                      simulationStates[simStep].state === "q3"
                        ? "scale-110 ring-4 ring-[#dc5000] bg-[#382416]"
                        : "bg-[#100904]"
                    }`}
                    style={{ borderColor: textColor }}
                  >
                    <span className="font-mono text-sm font-bold" style={{ color: textColor }}>q₃*</span>
                    <span className="text-[8px] font-mono text-emerald-400 -mt-0.5">ACCEPT</span>
                  </div>
                  <span className="text-[9px] font-mono" style={{ color: dimText }}>q₃*</span>
                </div>

              </div>

              {/* Active Trace Stream & Explanation Box */}
              <div 
                className="rounded-[10px] border p-4 flex flex-col gap-2 font-mono text-xs"
                style={{ backgroundColor: isDark ? "#100904" : "#F4EEFF", borderColor }}
              >
                <div className="flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-2">
                    <span className="text-[#dc5000] uppercase font-bold">STREAM:</span>
                    <div className="flex gap-1.5 font-bold">
                      {inputChars.map((ch, idx) => (
                        <span
                          key={idx}
                          className={`px-2 py-0.5 rounded ${
                            idx + 1 === simStep
                              ? "bg-[#dc5000] text-white"
                              : idx + 1 < simStep
                              ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                              : "opacity-40 border border-[#40372e]"
                          }`}
                        >
                          {ch}
                        </span>
                      ))}
                    </div>
                  </div>
                  <span className="text-[10px] uppercase text-[#a69888]">
                    FRAME {simStep + 1} OF 4
                  </span>
                </div>

                <div className="text-xs pt-1 border-t border-dashed border-[#40372e]" style={{ color: textColor }}>
                  {simulationStates[simStep].desc}
                </div>
              </div>

            </div>

          </motion.div>

        </div>

      </section>


      {/* -------------------------------------------------------------
          STORYTELLING SECTION 01: VISUAL CONVERTER (No Eyebrow Headings)
          ------------------------------------------------------------- */}
      <motion.section 
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="w-full px-6 sm:px-12 lg:px-20 py-24 border-b"
        style={{ borderColor }}
      >
        <div className="max-w-7xl mx-auto flex flex-col gap-10">
          
          <div className="flex flex-col gap-3">
            <h2 className="text-4xl sm:text-6xl font-medium uppercase tracking-tight" style={{ color: textColor }}>
              DETERMINIZE & MINIMIZE.
            </h2>
            <p className="text-lg sm:text-xl max-w-3xl leading-relaxed" style={{ color: mutedText }}>
              Draw state graphs with drag-and-drop nodes, connect transition paths, or supply simple text and regular expressions. ChomskyShrink executes Lazy Subset Construction and Hopcroft Partition Minimization.
            </p>
          </div>

          {/* Interactive Studio Preview Card */}
          <div 
            className="rounded-[16px] border p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center shadow-2xl"
            style={{ backgroundColor: surfaceBg, borderColor }}
          >
            <div className="lg:col-span-7 flex flex-col gap-5">
              <h3 className="text-2xl font-medium uppercase" style={{ color: textColor }}>
                GRAPH ENGINE & TRANSITION MATRIX
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: mutedText }}>
                Features Cytoscape horizontal layout, real-time string simulation highlighting active computation branches, and full consequence audits before state deletion.
              </p>

              <div className="grid grid-cols-2 gap-4 font-mono text-xs pt-2">
                <div className="rounded-[8px] p-3 border" style={{ backgroundColor: isDark ? "#100904" : "#F4EEFF", borderColor }}>
                  <div className="text-[#dc5000] font-bold">SUBSET CONSTRUCTION</div>
                  <div className="opacity-75 mt-1">Lazy 2^Q evaluation</div>
                </div>
                <div className="rounded-[8px] p-3 border" style={{ backgroundColor: isDark ? "#100904" : "#F4EEFF", borderColor }}>
                  <div className="text-[#dc5000] font-bold">HOPCROFT MINIMIZATION</div>
                  <div className="opacity-75 mt-1">Minimal state equivalence</div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => onNavigate("converter")}
                  className="inline-flex items-center gap-2 rounded-[36px] px-7 py-3 text-xs font-medium uppercase tracking-wider transition-all cursor-pointer border"
                  style={{
                    backgroundColor: isDark ? "#382416" : "#424874",
                    color: isDark ? "#ffedd7" : "#F4EEFF",
                    borderColor: isDark ? "#40372e" : "#424874",
                  }}
                >
                  <span>OPEN STUDIO</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="lg:col-span-5 rounded-[12px] border p-5 flex flex-col gap-3 font-mono text-xs" style={{ backgroundColor: isDark ? "#100904" : "#F4EEFF", borderColor }}>
              <div className="text-[11px] font-medium uppercase text-[#dc5000]">δ Transition Matrix</div>
              <div className="space-y-1.5 opacity-90">
                <div>δ(q₀, a) = &#123; q₀, q₁ &#125;</div>
                <div>δ(q₀, b) = &#123; q₀ &#125;</div>
                <div>δ(q₁, b) = &#123; q₂ &#125;</div>
                <div>δ(q₂, b) = &#123; q₃* &#125;</div>
              </div>
            </div>
          </div>

        </div>
      </motion.section>


      {/* -------------------------------------------------------------
          STORYTELLING SECTION 02: CURRICULUM (No Eyebrow Headings)
          ------------------------------------------------------------- */}
      <motion.section 
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="w-full px-6 sm:px-12 lg:px-20 py-24 border-b"
        style={{ borderColor }}
      >
        <div className="max-w-7xl mx-auto flex flex-col gap-10">
          
          <div className="flex flex-col gap-3">
            <h2 className="text-4xl sm:text-6xl font-medium uppercase tracking-tight" style={{ color: textColor }}>
              FOUNDATIONS & PROOFS.
            </h2>
            <p className="text-lg sm:text-xl max-w-3xl leading-relaxed" style={{ color: mutedText }}>
              From DFA formal 5-tuple foundations and ε-closures to the Pumping Lemma and Chomsky Hierarchy limits. Every module includes verified lecture streams and practical design suggestions.
            </p>
          </div>

          {/* Curriculum Preview Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div className="rounded-[12px] border p-6 flex flex-col justify-between" style={{ backgroundColor: surfaceBg, borderColor }}>
              <div className="flex flex-col gap-2">
                <h4 className="text-lg font-medium uppercase" style={{ color: textColor }}>FOUNDATIONS & CONVERSION</h4>
                <p className="text-xs leading-relaxed mt-1" style={{ color: mutedText }}>
                  DFA formal definitions, NFA non-determinism, powerset subset construction, and Hopcroft partition minimization.
                </p>
              </div>
            </div>

            <div className="rounded-[12px] border p-6 flex flex-col justify-between" style={{ backgroundColor: surfaceBg, borderColor }}>
              <div className="flex flex-col gap-2">
                <h4 className="text-lg font-medium uppercase" style={{ color: textColor }}>PATTERNS & ARITHMETIC</h4>
                <p className="text-xs leading-relaxed mt-1" style={{ color: mutedText }}>
                  Horner's rule binary divisibility, prefix-memory substring recognizers, and parity cross-product grids.
                </p>
              </div>
            </div>

            <div className="rounded-[12px] border p-6 flex flex-col justify-between" style={{ backgroundColor: surfaceBg, borderColor }}>
              <div className="flex flex-col gap-2">
                <h4 className="text-lg font-medium uppercase" style={{ color: textColor }}>ADVANCED COMPUTATION</h4>
                <p className="text-xs leading-relaxed mt-1" style={{ color: mutedText }}>
                  Compiler lexical tokenizers, Pumping Lemma proof by contradiction, Moore/Mealy machines, and Chomsky grammar limits.
                </p>
              </div>
            </div>

          </div>

          <div className="pt-2">
            <button
              onClick={() => onNavigate("lessons")}
              className="inline-flex items-center gap-2 rounded-[36px] px-7 py-3 text-xs font-medium uppercase tracking-wider transition-all cursor-pointer border"
              style={{
                backgroundColor: isDark ? "#382416" : "#424874",
                color: isDark ? "#ffedd7" : "#F4EEFF",
                borderColor: isDark ? "#40372e" : "#424874",
              }}
            >
              <span>EXPLORE LESSONS</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

        </div>
      </motion.section>


      {/* -------------------------------------------------------------
          STORYTELLING SECTION 03: PRACTICE ARENA (No Eyebrow Headings)
          ------------------------------------------------------------- */}
      <motion.section 
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="w-full px-6 sm:px-12 lg:px-20 py-24 border-b"
        style={{ borderColor }}
      >
        <div className="max-w-7xl mx-auto flex flex-col gap-10">
          
          <div className="flex flex-col gap-3">
            <h2 className="text-4xl sm:text-6xl font-medium uppercase tracking-tight" style={{ color: textColor }}>
              AUTOMATED TEST-SUITE GRADER.
            </h2>
            <p className="text-lg sm:text-xl max-w-3xl leading-relaxed" style={{ color: mutedText }}>
              Sourced from competitive and academic automata curricula. Test your state machine designs against multi-string edge cases with instant diagnostic traces and state efficiency ratings.
            </p>
          </div>

          {/* Arena Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            <div className="rounded-[12px] border p-4 text-center" style={{ backgroundColor: surfaceBg, borderColor }}>
              <div className="text-sm font-medium uppercase" style={{ color: textColor }}>Divisibility</div>
              <div className="text-[10px] opacity-75 mt-1" style={{ color: mutedText }}>Modular Counters</div>
            </div>
            <div className="rounded-[12px] border p-4 text-center" style={{ backgroundColor: surfaceBg, borderColor }}>
              <div className="text-sm font-medium uppercase" style={{ color: textColor }}>Substrings</div>
              <div className="text-[10px] opacity-75 mt-1" style={{ color: mutedText }}>Pattern Fallbacks</div>
            </div>
            <div className="rounded-[12px] border p-4 text-center" style={{ backgroundColor: surfaceBg, borderColor }}>
              <div className="text-sm font-medium uppercase" style={{ color: textColor }}>Parity Grids</div>
              <div className="text-[10px] opacity-75 mt-1" style={{ color: mutedText }}>Cross Products</div>
            </div>
            <div className="rounded-[12px] border p-4 text-center" style={{ backgroundColor: surfaceBg, borderColor }}>
              <div className="text-sm font-medium uppercase" style={{ color: textColor }}>Forbidden Rules</div>
              <div className="text-[10px] opacity-75 mt-1" style={{ color: mutedText }}>Trap & Dead States</div>
            </div>
            <div className="rounded-[12px] border p-4 text-center col-span-2 sm:col-span-1" style={{ backgroundColor: surfaceBg, borderColor }}>
              <div className="text-sm font-medium uppercase" style={{ color: textColor }}>Lexers</div>
              <div className="text-[10px] opacity-75 mt-1" style={{ color: mutedText }}>Token Parsers</div>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={() => onNavigate("practice")}
              className="inline-flex items-center gap-2 rounded-[36px] px-7 py-3 text-xs font-medium uppercase tracking-wider transition-all cursor-pointer border"
              style={{
                backgroundColor: isDark ? "#382416" : "#424874",
                color: isDark ? "#ffedd7" : "#F4EEFF",
                borderColor: isDark ? "#40372e" : "#424874",
              }}
            >
              <span>ENTER ARENA</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

        </div>
      </motion.section>

      {/* -------------------------------------------------------------
          EDITORIAL FOOTER: Contacts, Credits, Emails & Dock
          ------------------------------------------------------------- */}
      <footer 
        className="w-full px-6 sm:px-12 lg:px-20 pt-20 pb-28 border-t flex flex-col gap-12"
        style={{ borderColor, backgroundColor: surfaceBg }}
      >
        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 md:grid-cols-12 gap-10">
          
          {/* Brand & Mission Column */}
          <div className="md:col-span-5 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <ChomskyLogo size={28} isDark={isDark} />
              <span className="font-medium tracking-widest text-sm uppercase" style={{ color: textColor }}>
                CHOMSKYSHRINK
              </span>
            </div>
            <p className="text-xs leading-relaxed max-w-sm" style={{ color: mutedText }}>
              A precision finite automata workbench built for formal language theory, state minimization, and automated grading. Fully client-side with zero tracking.
            </p>
            <div className="text-[10px] font-mono uppercase mt-2" style={{ color: dimText }}>
              HOPCROFT-ULLMAN THEOREM COMPLIANT ENGINE
            </div>
          </div>

          {/* Quick Links Column */}
          <div className="md:col-span-3 flex flex-col gap-3">
            <span className="text-xs font-mono uppercase font-medium text-[#dc5000]">STUDIO DIRECTORY</span>
            <div className="flex flex-col gap-2 text-xs" style={{ color: mutedText }}>
              <button onClick={() => onNavigate("converter")} className="text-left hover:underline cursor-pointer">
                Finite Automata Studio
              </button>
              <button onClick={() => onNavigate("lessons")} className="text-left hover:underline cursor-pointer">
                Curriculum & Tracks
              </button>
              <button onClick={() => onNavigate("practice")} className="text-left hover:underline cursor-pointer">
                Practice Arena
              </button>
            </div>
          </div>

          {/* Contacts & Credits Column */}
          <div className="md:col-span-4 flex flex-col gap-3">
            <span className="text-xs font-mono uppercase font-medium text-[#dc5000]">CONTACTS & CREDITS</span>
            <div className="flex flex-col gap-2 text-xs" style={{ color: mutedText }}>
              <div className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-[#dc5000]" />
                <a href="mailto:support@chomskyshrink.internal" className="hover:underline">
                  support@chomskyshrink.internal
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Github className="h-3.5 w-3.5 text-[#dc5000]" />
                <a href="https://github.com" target="_blank" rel="noreferrer" className="hover:underline">
                  Open Source Reference
                </a>
              </div>
              <button 
                onClick={() => setShowCreditsModal(true)}
                className="text-left hover:underline text-[#dc5000] cursor-pointer pt-1"
              >
                View Academic & Theory Credits →
              </button>
            </div>
          </div>

        </div>

        {/* Bottom Micro Line */}
        <div className="max-w-7xl mx-auto w-full pt-8 border-t border-dashed flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] font-mono uppercase" style={{ borderColor, color: dimText }}>
          <div>© {new Date().getFullYear()} CHOMSKYSHRINK. ALL RIGHTS RESERVED.</div>
          <div>BUILT FOR RESEARCH & COMPUTER SCIENCE CURRICULA</div>
        </div>

      </footer>

      {/* -------------------------------------------------------------
          APPLE-STYLE UTILITY DOCK (Contacts, Emails, Docs, Credits)
          ------------------------------------------------------------- */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 max-w-full">
        <Dock className="items-end pb-3">
          {footerDockData.map((item, idx) => (
            <DockItem
              key={idx}
              onClick={item.action}
              className="aspect-square rounded-full bg-[#382416] border border-[#40372e] hover:border-[#ffedd7]"
            >
              <DockLabel>{item.title}</DockLabel>
              <DockIcon>{item.icon}</DockIcon>
            </DockItem>
          ))}
        </Dock>
      </div>

      {/* -------------------------------------------------------------
          ACADEMIC CREDITS MODAL
          ------------------------------------------------------------- */}
      {showCreditsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#100904]/85 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-[12px] border border-[#40372e] bg-[#1a1007] p-6 text-[#ffedd7] flex flex-col gap-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-dashed border-[#40372e] pb-3">
              <span className="text-sm font-medium uppercase tracking-wider text-[#ffedd7]">
                ACADEMIC & THEORETICAL CREDITS
              </span>
              <button 
                onClick={() => setShowCreditsModal(false)}
                className="text-[#a69888] hover:text-[#ffedd7] cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex flex-col gap-3 text-xs leading-relaxed text-[#a69888]">
              <p>ChomskyShrink is built upon foundational theorems in theoretical computer science and formal language theory:</p>
              
              <ul className="list-disc pl-4 space-y-1.5 text-[#ffedd7]">
                <li><strong className="text-[#ffedd7]">Noam Chomsky (1956)</strong> — Formal hierarchy of grammars and regular language classification.</li>
                <li><strong className="text-[#ffedd7]">Michael O. Rabin & Dana Scott (1959)</strong> — Non-deterministic finite automata and subset construction equivalence theorem.</li>
                <li><strong className="text-[#ffedd7]">John E. Hopcroft (1971)</strong> — $O(k \cdot n \log n)$ partition refinement algorithm for minimal DFA equivalence.</li>
                <li><strong className="text-[#ffedd7]">Anil Nerode & John Myhill (1958)</strong> — Myhill-Nerode theorem on distinguishable prefix equivalence classes.</li>
                <li><strong className="text-[#ffedd7]">Ken Thompson (1968)</strong> — Inductive syntax-directed compilation of regular expressions to ε-NFAs.</li>
              </ul>
            </div>

            <div className="flex justify-end pt-2 border-t border-dashed border-[#40372e]">
              <button
                onClick={() => setShowCreditsModal(false)}
                className="rounded-[36px] bg-[#382416] px-6 py-2 text-xs font-medium uppercase text-[#ffedd7] hover:bg-[#40372e] cursor-pointer"
              >
                CLOSE CREDITS
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
