import React, { useState } from "react";
import {
  Trophy,
  HelpCircle,
  Sparkles,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Play,
  ArrowRight,
  Search,
  Filter,
  Layers,
  ArrowLeft,
  BookOpen,
  Zap,
  Target
} from "lucide-react";
import { PRACTICE_CHALLENGES } from "../data/challenges";
import { PracticeChallenge } from "../types/automaton";
import { Automaton } from "../core/automaton";
import { ConverterApp } from "./ConverterApp";
import { GraderAnalytics } from "./GraderAnalytics";
import { ChomskyLogo } from "./ui/ChomskyLogo";

interface PracticeGymProps {
  initialChallengeId?: string;
  onOpenLessons?: () => void;
  isDark?: boolean;
}

const CATEGORIES = [
  "All Categories",
  "Divisibility & Arithmetic",
  "Substrings & Suffixes",
  "Parity Counters",
  "Forbidden Patterns",
  "Advanced Languages",
];

export const PracticeGym: React.FC<PracticeGymProps> = ({
  initialChallengeId,
  onOpenLessons,
  isDark = true,
}) => {
  const [selectedId, setSelectedId] = useState<string | null>(initialChallengeId || null);
  const [showHints, setShowHints] = useState(false);
  const [currentAutomaton, setCurrentAutomaton] = useState<Automaton>(new Automaton());
  const [showAnalytics, setShowAnalytics] = useState(false);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("All");
  const [categoryFilter, setCategoryFilter] = useState<string>("All Categories");

  const primaryBg = isDark ? "#100904" : "#F4EEFF";
  const surfaceBg = isDark ? "#1a1007" : "#FFFFFF";
  const elevatedBg = isDark ? "#382416" : "#DCD6F7";
  const borderColor = isDark ? "#40372e" : "#DCD6F7";
  const textColor = isDark ? "#ffedd7" : "#424874";
  const mutedText = isDark ? "#a69888" : "#5f6594";
  const dimText = isDark ? "#6c5f51" : "#8b92be";

  const filteredChallenges = PRACTICE_CHALLENGES.filter((ch) => {
    const matchesSearch =
      ch.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ch.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ch.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDiff = difficultyFilter === "All" || ch.difficulty === difficultyFilter;
    const matchesCategory = categoryFilter === "All Categories" || ch.category === categoryFilter;
    return matchesSearch && matchesDiff && matchesCategory;
  });

  const activeChallenge: PracticeChallenge | undefined = PRACTICE_CHALLENGES.find(
    (c) => c.id === selectedId
  );

  const handleSelectChallenge = (id: string) => {
    setSelectedId(id);
    setShowHints(false);
    setShowAnalytics(false);
    setCurrentAutomaton(new Automaton());
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleNextChallenge = () => {
    if (!selectedId) return;
    const currIdx = PRACTICE_CHALLENGES.findIndex((c) => c.id === selectedId);
    const nextIdx = (currIdx + 1) % PRACTICE_CHALLENGES.length;
    handleSelectChallenge(PRACTICE_CHALLENGES[nextIdx].id);
  };

  return (
    <div
      className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 lg:p-6 transition-colors duration-300 font-sans"
      style={{ color: textColor }}
    >
      
      {/* -------------------------------------------------------------
          VIEW A: ACTIVE CHALLENGE SOLVING WORKBENCH
          ------------------------------------------------------------- */}
      {selectedId && activeChallenge ? (
        <div className="flex flex-col gap-6">
          
          {/* Back Navigation Bar */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSelectedId(null)}
              className="inline-flex items-center gap-2 rounded-[22.5px] border px-4 py-1.5 text-xs font-medium uppercase transition-all cursor-pointer"
              style={{ borderColor, color: mutedText }}
              onMouseEnter={(e) => (e.currentTarget.style.color = textColor)}
              onMouseLeave={(e) => (e.currentTarget.style.color = mutedText)}
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>BACK TO ALL CHALLENGES</span>
            </button>

            <div className="flex items-center gap-2 text-xs font-mono" style={{ color: dimText }}>
              <span>CHALLENGE {PRACTICE_CHALLENGES.findIndex((c) => c.id === selectedId) + 1} OF {PRACTICE_CHALLENGES.length}</span>
            </div>
          </div>

          {/* Active Challenge Specification Card */}
          <div
            className="flex flex-col gap-4 rounded-[12px] border p-6"
            style={{ backgroundColor: surfaceBg, borderColor }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-dashed pb-4" style={{ borderColor }}>
              <div>
                <span className="text-[11px] font-mono uppercase text-[#dc5000]">
                  {activeChallenge.category} // {activeChallenge.difficulty}
                </span>
                <h2 className="text-xl font-medium uppercase mt-1" style={{ color: textColor }}>
                  {activeChallenge.title}
                </h2>
              </div>

              <div className="flex items-center gap-2">
                <span 
                  className="rounded-[4px] border px-3 py-1 text-xs font-mono"
                  style={{ backgroundColor: isDark ? "#100904" : "#F4EEFF", borderColor, color: textColor }}
                >
                  Σ = &#123; {activeChallenge.alphabet.join(", ")} &#125;
                </span>
                <span 
                  className="rounded-[4px] border px-3 py-1 text-xs font-mono"
                  style={{ backgroundColor: isDark ? "#100904" : "#F4EEFF", borderColor, color: textColor }}
                >
                  TARGET: {activeChallenge.optimalStateCount} STATES
                </span>
              </div>
            </div>

            <p className="text-sm leading-relaxed" style={{ color: isDark ? "rgba(255, 237, 215, 0.9)" : "rgba(66, 72, 116, 0.9)" }}>
              {activeChallenge.description}
            </p>

            {/* Design Hints Accordion */}
            <div className="border-t border-dashed pt-3" style={{ borderColor }}>
              <button
                onClick={() => setShowHints(!showHints)}
                className="flex items-center gap-1.5 text-xs font-medium uppercase transition-colors cursor-pointer"
                style={{ color: mutedText }}
              >
                <HelpCircle className="h-4 w-4 text-[#dc5000]" />
                <span>{showHints ? "HIDE HINTS" : "VIEW DESIGN HINTS"}</span>
                {showHints ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              </button>

              {showHints && (
                <div 
                  className="mt-3 rounded-[8px] border p-4 text-xs flex flex-col gap-1.5"
                  style={{ backgroundColor: isDark ? "#100904" : "#F4EEFF", borderColor, color: mutedText }}
                >
                  <ul className="list-disc pl-4 space-y-1">
                    {activeChallenge.hints.map((h, i) => (
                      <li key={i}>{h}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Solution Evaluation & Auto-Grader */}
          {showAnalytics ? (
            <GraderAnalytics
              challenge={activeChallenge}
              userAutomaton={currentAutomaton}
              onRetry={() => setShowAnalytics(false)}
              onNextChallenge={handleNextChallenge}
              isDark={isDark}
            />
          ) : (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wider" style={{ color: mutedText }}>
                  STATE MACHINE DESIGN WORKBENCH
                </span>
                <button
                  onClick={() => setShowAnalytics(true)}
                  className="inline-flex items-center gap-2 rounded-[36px] px-6 py-2.5 text-xs sm:text-sm font-medium uppercase transition-all cursor-pointer border"
                  style={{
                    backgroundColor: isDark ? "#382416" : "#424874",
                    color: isDark ? "#ffedd7" : "#F4EEFF",
                    borderColor: isDark ? "#40372e" : "#424874",
                  }}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>SUBMIT & AUTO-GRADE</span>
                </button>
              </div>

              <ConverterApp
                initialAutomaton={currentAutomaton}
                onAutomatonChange={(auto) => setCurrentAutomaton(auto)}
                isDark={isDark}
              />
            </div>
          )}

        </div>
      ) : (
        /* -------------------------------------------------------------
           VIEW B: MASTER CATEGORIZED CHALLENGE BROWSER (52 Challenges)
           ------------------------------------------------------------- */
        <div className="flex flex-col gap-8">
          
          {/* Header Banner */}
          <div
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-[12px] border p-6"
            style={{ backgroundColor: surfaceBg, borderColor }}
          >
            <div className="flex items-center gap-4">
              <div 
                className="flex h-12 w-12 items-center justify-center rounded-[8px] border"
                style={{ backgroundColor: isDark ? "#382416" : "#DCD6F7", borderColor }}
              >
                <Trophy className="h-6 w-6" style={{ color: textColor }} />
              </div>
              <div>
                <h1 className="text-xl font-medium uppercase tracking-tight" style={{ color: textColor }}>
                  PRACTICE ARENA
                </h1>
                <p className="text-xs mt-0.5" style={{ color: mutedText }}>
                  Master automata design with authentic university problems arranged into 5 progressive tracks.
                </p>
              </div>
            </div>

            <button
              onClick={onOpenLessons}
              className="flex items-center gap-2 rounded-[22.5px] border px-4 py-2 text-xs font-medium uppercase transition-all cursor-pointer"
              style={{ borderColor, color: mutedText }}
              onMouseEnter={(e) => (e.currentTarget.style.color = textColor)}
              onMouseLeave={(e) => (e.currentTarget.style.color = mutedText)}
            >
              <BookOpen className="h-4 w-4" />
              <span>VIEW CURRICULUM</span>
            </button>
          </div>

          {/* Search and Track Filter Bar */}
          <div
            className="flex flex-col gap-4 rounded-[12px] border p-4"
            style={{ backgroundColor: surfaceBg, borderColor }}
          >
            
            {/* Search Input & Difficulty Pills */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 w-full sm:w-80 border-b px-2 py-1" style={{ borderColor }}>
                <Search className="h-4 w-4" style={{ color: dimText }} />
                <input
                  type="text"
                  placeholder="Search challenges by keyword or rule..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent text-xs placeholder-opacity-50 focus:outline-none"
                  style={{ color: textColor }}
                />
              </div>

              {/* Difficulty Filters */}
              <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
                <span className="text-[10px] font-mono uppercase mr-1" style={{ color: dimText }}>DIFF:</span>
                {["All", "Beginner", "Intermediate", "Advanced"].map((diff) => (
                  <button
                    key={diff}
                    onClick={() => setDifficultyFilter(diff)}
                    className={`px-3 py-1 text-xs font-medium uppercase rounded-[22.5px] transition-all cursor-pointer ${
                      difficultyFilter === diff
                        ? "bg-[#382416] text-[#ffedd7] border border-[#40372e]"
                        : "text-[#a69888] hover:text-[#ffedd7]"
                    }`}
                    style={{
                      backgroundColor: difficultyFilter === diff ? (isDark ? "#382416" : "#424874") : "transparent",
                      color: difficultyFilter === diff ? (isDark ? "#ffedd7" : "#F4EEFF") : mutedText,
                    }}
                  >
                    {diff}
                  </button>
                ))}
              </div>
            </div>

            {/* Category Track Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto border-t border-dashed pt-3" style={{ borderColor }}>
              {CATEGORIES.map((cat) => {
                const count =
                  cat === "All Categories"
                    ? PRACTICE_CHALLENGES.length
                    : PRACTICE_CHALLENGES.filter((c) => c.category === cat).length;
                const isSelected = categoryFilter === cat;

                return (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className="flex items-center gap-2 shrink-0 rounded-[22.5px] px-3.5 py-1.5 text-xs font-medium uppercase transition-all cursor-pointer border"
                    style={{
                      backgroundColor: isSelected ? (isDark ? "#382416" : "#424874") : "transparent",
                      borderColor: isSelected ? textColor : borderColor,
                      color: isSelected ? (isDark ? "#ffedd7" : "#F4EEFF") : mutedText,
                    }}
                  >
                    <span>{cat}</span>
                    <span 
                      className="rounded-full px-1.5 py-0.2 text-[10px] font-mono"
                      style={{
                        backgroundColor: isDark ? "#100904" : "#F4EEFF",
                        color: isSelected ? textColor : dimText,
                      }}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

          </div>

          {/* Challenge Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredChallenges.map((ch, idx) => {
              const diffBadgeColor =
                ch.difficulty === "Beginner"
                  ? isDark ? "bg-emerald-950/60 text-emerald-300 border-emerald-800" : "bg-emerald-100 text-emerald-800 border-emerald-300"
                  : ch.difficulty === "Intermediate"
                  ? isDark ? "bg-amber-950/60 text-amber-300 border-amber-800" : "bg-amber-100 text-amber-800 border-amber-300"
                  : isDark ? "bg-rose-950/60 text-rose-300 border-rose-800" : "bg-rose-100 text-rose-800 border-rose-300";

              return (
                <div
                  key={ch.id}
                  onClick={() => handleSelectChallenge(ch.id)}
                  className="flex flex-col justify-between rounded-[12px] border p-5 transition-all cursor-pointer hover:scale-[1.01] group shadow-sm"
                  style={{ backgroundColor: surfaceBg, borderColor }}
                >
                  <div className="flex flex-col gap-3">
                    
                    {/* Top Metadata Header */}
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="uppercase text-[10px]" style={{ color: dimText }}>
                        {ch.category}
                      </span>
                      <span className={`px-2 py-0.5 rounded-[4px] border text-[10px] font-medium uppercase ${diffBadgeColor}`}>
                        {ch.difficulty}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 
                      className="text-base font-medium uppercase tracking-tight group-hover:underline"
                      style={{ color: textColor }}
                    >
                      {ch.title}
                    </h3>

                    {/* Description Snippet */}
                    <p className="text-xs line-clamp-3 leading-relaxed" style={{ color: mutedText }}>
                      {ch.description}
                    </p>

                  </div>

                  {/* Card Footer: Target States & Action */}
                  <div className="flex items-center justify-between border-t border-dashed pt-3 mt-4" style={{ borderColor }}>
                    <div className="flex items-center gap-2 text-[11px] font-mono" style={{ color: dimText }}>
                      <span>Σ = &#123; {ch.alphabet.join(", ")} &#125;</span>
                      <span>//</span>
                      <span>{ch.optimalStateCount} STATES</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs font-medium uppercase text-[#dc5000] group-hover:translate-x-1 transition-transform">
                      <span>SOLVE</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </div>
                  </div>

                </div>
              );
            })}
          </div>

          {filteredChallenges.length === 0 && (
            <div 
              className="w-full text-center py-16 rounded-[12px] border"
              style={{ backgroundColor: surfaceBg, borderColor, color: mutedText }}
            >
              No challenges match your search filters. Try selecting a different track or clearing search query.
            </div>
          )}

        </div>
      )}

    </div>
  );
};
