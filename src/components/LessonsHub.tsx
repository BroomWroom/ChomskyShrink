import React, { useState } from "react";
import {
  BookOpen,
  Video,
  Lightbulb,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  Bookmark,
  FileText,
  Layers,
  Search,
  Check,
  ChevronRight,
  GraduationCap
} from "lucide-react";
import { LESSON_MODULES, LESSON_TRACKS, REFERENCE_MATERIALS } from "../data/lessons";

interface LessonsHubProps {
  onOpenStudio?: () => void;
  onOpenPractice?: (challengeId?: string) => void;
  isDark?: boolean;
}

export const LessonsHub: React.FC<LessonsHubProps> = ({
  onOpenStudio,
  onOpenPractice,
  isDark = true,
}) => {
  const [selectedTrackId, setSelectedTrackId] = useState<string>(LESSON_TRACKS[0].id);
  const [selectedLessonId, setSelectedLessonId] = useState<string>(LESSON_MODULES[0].id);
  const [searchQuery, setSearchQuery] = useState<string>("");

  const surfaceBg = isDark ? "#1a1007" : "#FFFFFF";
  const innerBg = isDark ? "#100904" : "#F4EEFF";
  const borderColor = isDark ? "#40372e" : "#DCD6F7";
  const textColor = isDark ? "#ffedd7" : "#424874";
  const mutedText = isDark ? "#a69888" : "#5f6594";
  const dimText = isDark ? "#6c5f51" : "#8b92be";

  const activeTrack = LESSON_TRACKS.find((t) => t.id === selectedTrackId) || LESSON_TRACKS[0];

  // Lessons belonging to active track or filtered by search
  const filteredLessons = searchQuery.trim()
    ? LESSON_MODULES.filter(
        (l) =>
          l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          l.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
          l.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : LESSON_MODULES.filter((l) => activeTrack.lessonIds.includes(l.id));

  const activeLesson =
    LESSON_MODULES.find((l) => l.id === selectedLessonId) ||
    filteredLessons[0] ||
    LESSON_MODULES[0];

  const handleSelectTrack = (trackId: string) => {
    setSelectedTrackId(trackId);
    setSearchQuery("");
    const targetTrack = LESSON_TRACKS.find((t) => t.id === trackId);
    if (targetTrack && targetTrack.lessonIds.length > 0) {
      setSelectedLessonId(targetTrack.lessonIds[0]);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 p-4 lg:p-6" style={{ color: textColor }}>
      
      {/* Header Banner */}
      <div 
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-[12px] border p-6 shadow-sm"
        style={{ backgroundColor: surfaceBg, borderColor }}
      >
        <div className="flex items-center gap-4">
          <div 
            className="flex h-12 w-12 items-center justify-center rounded-[8px] border"
            style={{ backgroundColor: isDark ? "#382416" : "#DCD6F7", borderColor }}
          >
            <BookOpen className="h-6 w-6" style={{ color: textColor }} />
          </div>
          <div>
            <h1 className="text-xl font-medium uppercase tracking-tight" style={{ color: textColor }}>
              CURRICULUM & VIDEO LABS
            </h1>
            <p className="text-xs mt-0.5" style={{ color: mutedText }}>
              Step-by-step tracks covering Deterministic Models, Non-Determinism, Arithmetic Counters, and Grammar Hierarchies.
            </p>
          </div>
        </div>

        <button
          onClick={() => onOpenPractice?.()}
          className="flex items-center gap-2 rounded-[36px] px-5 py-2.5 text-xs font-medium uppercase transition-all cursor-pointer border"
          style={{
            backgroundColor: isDark ? "#382416" : "#424874",
            borderColor: isDark ? "#40372e" : "#424874",
            color: isDark ? "#ffedd7" : "#F4EEFF",
          }}
        >
          <span>PRACTICE ARENA</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* -------------------------------------------------------------
          CURRICULUM TRACK PROGRESSION (Top Track Cards Line-up)
          ------------------------------------------------------------- */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-medium uppercase tracking-wider" style={{ color: dimText }}>
            LEARNING TRACKS
          </span>
          <div className="flex items-center gap-2 border-b px-2 py-1" style={{ borderColor }}>
            <Search className="h-3.5 w-3.5" style={{ color: dimText }} />
            <input
              type="text"
              placeholder="Search across all modules..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-xs placeholder-opacity-50 focus:outline-none w-48 font-sans"
              style={{ color: textColor }}
            />
          </div>
        </div>

        {/* 5 Track Lineup Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {LESSON_TRACKS.map((track, idx) => {
            const isSelected = selectedTrackId === track.id && !searchQuery;
            return (
              <div
                key={track.id}
                onClick={() => handleSelectTrack(track.id)}
                className={`flex flex-col justify-between p-4 rounded-[12px] border transition-all cursor-pointer hover:scale-[1.01] ${
                  isSelected ? "shadow-lg ring-1" : "hover:border-[#6c5f51]"
                }`}
                style={{
                  backgroundColor: isSelected ? (isDark ? "#382416" : "#424874") : surfaceBg,
                  borderColor: isSelected ? textColor : borderColor,
                  color: isSelected ? (isDark ? "#ffedd7" : "#F4EEFF") : textColor,
                }}
              >
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span 
                      className={`px-1.5 py-0.5 rounded font-bold ${
                        isSelected 
                          ? "bg-[#dc5000] text-white" 
                          : isDark ? "bg-[#100904] text-[#ffedd7]" : "bg-[#F4EEFF] text-[#424874]"
                      }`}
                    >
                      TRACK 0{idx + 1}
                    </span>
                    <span className="opacity-75">{track.lessonIds.length} Modules</span>
                  </div>

                  <h3 className="font-medium text-xs uppercase leading-snug mt-1">
                    {track.title.replace(/^Track \d+:\s*/, "")}
                  </h3>

                  <p 
                    className="text-[11px] line-clamp-2 leading-relaxed"
                    style={{ color: isSelected ? (isDark ? "#ffedd7" : "#DCD6F7") : mutedText }}
                  >
                    {track.description}
                  </p>
                </div>

                <div className="flex items-center gap-1 text-[10px] font-mono font-medium uppercase mt-3 pt-2 border-t border-dashed" style={{ borderColor }}>
                  <span>{isSelected ? "ACTIVE TRACK" : "VIEW TRACK"}</span>
                  <ChevronRight className="h-3 w-3" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* -------------------------------------------------------------
          MASTER-DETAIL WORKSPACE: MODULE LIST + LESSON VIEWER
          ------------------------------------------------------------- */}
      <div className="grid grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Track-Focused Module List */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-3 max-h-[85vh] overflow-y-auto pr-1">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-medium uppercase tracking-wider" style={{ color: dimText }}>
              {searchQuery ? "SEARCH RESULTS" : `${activeTrack.title.toUpperCase()}`}
            </span>
            <span className="text-[10px] font-mono" style={{ color: dimText }}>
              {filteredLessons.length} MODULES
            </span>
          </div>

          <div className="flex flex-col gap-2.5">
            {filteredLessons.map((mod, idx) => {
              const isSelected = mod.id === activeLesson.id;
              return (
                <button
                  key={mod.id}
                  onClick={() => {
                    setSelectedLessonId(mod.id);
                    window.scrollTo({ top: 320, behavior: "smooth" });
                  }}
                  className={`flex flex-col gap-1.5 rounded-[12px] p-4 text-left border transition-all cursor-pointer ${
                    isSelected ? "shadow-md" : "hover:border-[#6c5f51]"
                  }`}
                  style={{
                    backgroundColor: isSelected ? (isDark ? "#382416" : "#424874") : surfaceBg,
                    borderColor: isSelected ? textColor : borderColor,
                    color: isSelected ? (isDark ? "#ffedd7" : "#F4EEFF") : textColor,
                  }}
                >
                  <div className="flex items-center justify-between text-[11px] font-mono opacity-75">
                    <span className="uppercase">MODULE {idx + 1}</span>
                    <span>{mod.readTime}</span>
                  </div>

                  <div className="font-medium uppercase text-sm leading-snug">
                    {mod.title}
                  </div>

                  <div 
                    className="text-xs line-clamp-2 mt-0.5"
                    style={{ color: isSelected ? (isDark ? "#ffedd7" : "#DCD6F7") : mutedText }}
                  >
                    {mod.summary}
                  </div>
                </button>
              );
            })}

            {filteredLessons.length === 0 && (
              <div className="p-6 text-center text-xs rounded-[12px] border" style={{ backgroundColor: surfaceBg, borderColor, color: mutedText }}>
                No modules match your query. Try clearing the search filter.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Detailed Lesson Viewer */}
        <div 
          className="col-span-12 lg:col-span-8 flex flex-col gap-6 rounded-[12px] border p-6 lg:p-8 shadow-xl"
          style={{ backgroundColor: surfaceBg, borderColor }}
        >
          
          {/* Active Lesson Header */}
          <div className="flex flex-col gap-2 border-b border-dashed pb-4" style={{ borderColor }}>
            <div className="flex items-center gap-2 text-xs font-mono uppercase" style={{ color: dimText }}>
              <span>{activeLesson.category}</span>
              <span>//</span>
              <span>{activeLesson.readTime}</span>
            </div>
            <h2 className="text-2xl font-medium uppercase tracking-tight" style={{ color: textColor }}>
              {activeLesson.title}
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: mutedText }}>
              {activeLesson.summary}
            </p>
          </div>

          {/* Video Player */}
          {activeLesson.videoUrl && (
            <div 
              className="flex flex-col gap-2 rounded-[12px] border overflow-hidden shadow-lg"
              style={{ backgroundColor: innerBg, borderColor }}
            >
              <div 
                className="flex items-center justify-between px-4 py-2.5 border-b text-xs font-mono"
                style={{ backgroundColor: innerBg, borderColor, color: mutedText }}
              >
                <div className="flex items-center gap-2">
                  <Video className="h-4 w-4 text-[#dc5000]" />
                  <span className="font-medium uppercase" style={{ color: textColor }}>
                    {activeLesson.videoTitle || "Video Lecture"}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  {activeLesson.videoDuration && <span>{activeLesson.videoDuration}</span>}
                  <a
                    href={activeLesson.videoUrl.replace("-nocookie.com/embed/", ".com/watch?v=")}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-[11px] text-[#dc5000] hover:underline"
                  >
                    <span>Open on YouTube</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>

              <div className="relative w-full aspect-video bg-black">
                <iframe
                  src={activeLesson.videoUrl}
                  title={activeLesson.videoTitle || "Automata Lesson"}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="absolute inset-0 h-full w-full border-0"
                />
              </div>
            </div>
          )}

          {/* Lesson Content Sections */}
          <div className="flex flex-col gap-6">
            {activeLesson.content.map((sec, idx) => (
              <div key={idx} className="flex flex-col gap-2">
                <h3 className="text-base font-medium uppercase" style={{ color: textColor }}>
                  {sec.heading}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: isDark ? "rgba(255, 237, 215, 0.9)" : "rgba(66, 72, 116, 0.9)" }}>
                  {sec.body}
                </p>

                {sec.mathFormula && (
                  <div 
                    className="my-1 rounded-[8px] border p-3 font-mono text-xs"
                    style={{ backgroundColor: innerBg, borderColor, color: textColor }}
                  >
                    {sec.mathFormula}
                  </div>
                )}

                <div 
                  className="flex items-start gap-2 rounded-[8px] p-3 text-xs border"
                  style={{ backgroundColor: innerBg, borderColor, color: mutedText }}
                >
                  <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" style={{ color: textColor }} />
                  <span><strong style={{ color: textColor }}>Key Takeaway:</strong> {sec.keyTakeaway}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Interactive Suggestions */}
          <div 
            className="rounded-[8px] border p-5 flex flex-col gap-3"
            style={{ backgroundColor: innerBg, borderColor }}
          >
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider" style={{ color: textColor }}>
              <Lightbulb className="h-4 w-4 text-[#dc5000]" />
              <span>PRACTICAL DESIGN SUGGESTIONS</span>
            </div>
            <ul className="flex flex-col gap-2 text-xs list-disc pl-4" style={{ color: mutedText }}>
              {activeLesson.interactiveTips.map((tip, idx) => (
                <li key={idx} className="leading-relaxed">{tip}</li>
              ))}
            </ul>
          </div>

          {/* Common Pitfalls Warning */}
          <div className="rounded-[8px] border border-rose-900 bg-rose-950/30 p-5 flex flex-col gap-3 text-rose-200">
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-rose-400">
              <AlertTriangle className="h-4 w-4" />
              <span>COMMON PITFALLS & MISCONCEPTIONS</span>
            </div>
            <ul className="flex flex-col gap-2 text-xs text-rose-200/90 list-disc pl-4">
              {activeLesson.commonMistakes.map((mistake, idx) => (
                <li key={idx} className="leading-relaxed">{mistake}</li>
              ))}
            </ul>
          </div>

          {/* Bottom Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-dashed pt-4" style={{ borderColor }}>
            <button
              onClick={() => onOpenStudio?.()}
              className="rounded-[22.5px] border px-5 py-2.5 text-xs font-medium uppercase transition-all cursor-pointer"
              style={{ borderColor, color: mutedText }}
              onMouseEnter={(e) => (e.currentTarget.style.color = textColor)}
              onMouseLeave={(e) => (e.currentTarget.style.color = mutedText)}
            >
              TRY IN STUDIO
            </button>

            {activeLesson.practiceChallengeId && (
              <button
                onClick={() => onOpenPractice?.(activeLesson.practiceChallengeId)}
                className="flex items-center gap-2 rounded-[36px] px-6 py-2.5 text-xs font-medium uppercase transition-all cursor-pointer border"
                style={{
                  backgroundColor: isDark ? "#382416" : "#424874",
                  borderColor: isDark ? "#40372e" : "#424874",
                  color: isDark ? "#ffedd7" : "#F4EEFF",
                }}
              >
                <span>SOLVE RELATED CHALLENGE</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </div>

        </div>

      </div>

      {/* -------------------------------------------------------------
          RECOMMENDED ACADEMIC REFERENCE LITERATURE
          ------------------------------------------------------------- */}
      <div 
        className="rounded-[12px] border p-6 flex flex-col gap-6"
        style={{ backgroundColor: surfaceBg, borderColor }}
      >
        <div className="flex items-center justify-between border-b border-dashed pb-3" style={{ borderColor }}>
          <div className="flex items-center gap-2.5">
            <Bookmark className="h-5 w-5 text-[#dc5000]" />
            <h3 className="text-base font-medium uppercase" style={{ color: textColor }}>
              RECOMMENDED ACADEMIC REFERENCE MATERIALS
            </h3>
          </div>
          <span className="text-xs font-mono" style={{ color: dimText }}>PEER-REVIEWED LITERATURE</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {REFERENCE_MATERIALS.map((ref, idx) => (
            <div 
              key={idx}
              className="rounded-[8px] border p-4 flex flex-col justify-between gap-3"
              style={{ backgroundColor: innerBg, borderColor }}
            >
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-[#dc5000] font-bold">{ref.type}</span>
                  <span style={{ color: dimText }}>{ref.source}</span>
                </div>
                <h4 className="font-medium text-sm" style={{ color: textColor }}>{ref.title}</h4>
                <div className="text-xs font-mono opacity-80" style={{ color: mutedText }}>{ref.author}</div>
                <p className="text-xs leading-relaxed mt-1" style={{ color: mutedText }}>{ref.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
