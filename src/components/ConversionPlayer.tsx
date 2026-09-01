import React, { useState, useEffect, useRef } from "react";
import { Play, Pause, SkipBack, SkipForward, RotateCcw, FastForward, CheckCircle2, Workflow, X } from "lucide-react";
import { ConversionStep } from "../types/automaton";

interface ConversionPlayerProps {
  steps: ConversionStep[];
  onStepChange?: (step: ConversionStep) => void;
  onClose?: () => void;
  onApplyFinal?: () => void;
  isDark?: boolean;
}

export const ConversionPlayer: React.FC<ConversionPlayerProps> = ({
  steps,
  onStepChange,
  onClose,
  onApplyFinal,
  isDark = true,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState<number>(1);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const surfaceBg = isDark ? "#1a1007" : "#FFFFFF";
  const innerBg = isDark ? "#100904" : "#F8F6FF";
  const elevatedBg = isDark ? "#382416" : "#DCD6F7";
  const borderColor = isDark ? "#40372e" : "#DCD6F7";
  const textColor = isDark ? "#ffedd7" : "#424874";
  const mutedText = isDark ? "#a69888" : "#5f6594";
  const dimText = isDark ? "#6c5f51" : "#8b92be";

  const currentStep = steps[currentStepIndex] || steps[0];

  useEffect(() => {
    if (currentStep) {
      onStepChange?.(currentStep);
    }
  }, [currentStepIndex, currentStep, onStepChange]);

  useEffect(() => {
    if (isPlaying) {
      const intervalMs = Math.max(400, Math.floor(1800 / speed));
      timerRef.current = setTimeout(() => {
        if (currentStepIndex < steps.length - 1) {
          setCurrentStepIndex((prev) => prev + 1);
        } else {
          setIsPlaying(false);
        }
      }, intervalMs);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isPlaying, currentStepIndex, steps.length, speed]);

  const handlePlayPause = () => {
    if (!isPlaying && currentStepIndex >= steps.length - 1) {
      setCurrentStepIndex(0);
    }
    setIsPlaying(!isPlaying);
  };

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentStepIndex(0);
  };

  if (!steps || steps.length === 0) {
    return null;
  }

  const progressPercent = ((currentStepIndex + 1) / steps.length) * 100;

  return (
    <div 
      className="w-full rounded-[12px] border p-5 flex flex-col gap-4 shadow-xl transition-colors duration-200"
      style={{ backgroundColor: surfaceBg, borderColor, color: textColor }}
    >
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-dashed pb-3" style={{ borderColor }}>
        <div className="flex items-center gap-3">
          <div 
            className="flex h-7 w-7 items-center justify-center rounded-[6px] border"
            style={{ backgroundColor: elevatedBg, borderColor, color: textColor }}
          >
            <Workflow className="h-4 w-4" />
          </div>
          <div>
            <div className="text-xs font-medium uppercase tracking-wider" style={{ color: textColor }}>
              STEP-BY-STEP CONVERSION PLAYER
            </div>
            <div className="text-[10px] font-mono" style={{ color: dimText }}>
              FRAME {currentStepIndex + 1} OF {steps.length}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Speed badge */}
          <button
            onClick={() => setSpeed((s) => (s === 1 ? 1.5 : s === 1.5 ? 2 : 1))}
            className="flex items-center gap-1 rounded-[22.5px] border px-3 py-1 text-xs font-mono transition-all cursor-pointer hover:opacity-80"
            style={{ backgroundColor: innerBg, borderColor, color: textColor }}
          >
            <FastForward className="h-3 w-3" />
            <span>{speed}x</span>
          </button>
          
          {onApplyFinal && (
            <button
              onClick={onApplyFinal}
              className="flex items-center gap-1 rounded-[22.5px] border border-emerald-600 bg-emerald-950/80 px-3 py-1 text-xs font-mono text-emerald-300 hover:bg-emerald-900 transition-all cursor-pointer font-bold shadow"
              title="Apply Final Result and Close Player"
            >
              <CheckCircle2 className="h-3 w-3" />
              <span>APPLY & CLOSE</span>
            </button>
          )}

          {onClose && (
            <button
              onClick={onClose}
              className="rounded-[6px] border p-1 transition-all cursor-pointer hover:opacity-80"
              style={{ borderColor, color: mutedText }}
              title="Close Walkthrough Player"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Step Display */}
      <div 
        className="rounded-[8px] border p-4 flex flex-col gap-2.5"
        style={{ backgroundColor: innerBg, borderColor }}
      >
        <div className="flex items-center justify-between gap-2">
          <span 
            className="text-xs font-medium uppercase tracking-wider px-2.5 py-0.5 rounded-[4px] border"
            style={{ backgroundColor: elevatedBg, borderColor, color: textColor }}
          >
            {currentStep.title}
          </span>
          {currentStepIndex === steps.length - 1 && (
            <button
              onClick={() => {
                if (onApplyFinal) onApplyFinal();
                else if (onClose) onClose();
              }}
              className="flex items-center gap-1 text-[11px] font-bold text-emerald-300 bg-emerald-950 border border-emerald-500 px-2.5 py-1 rounded-[4px] hover:bg-emerald-900 transition-all cursor-pointer shadow animate-pulse"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>APPLY TO STUDIO</span>
            </button>
          )}
        </div>

        <div 
          className="font-mono text-xs p-2.5 rounded-[6px] border"
          style={{ backgroundColor: surfaceBg, borderColor, color: textColor }}
        >
          {currentStep.description}
        </div>

        <div className="text-xs leading-relaxed" style={{ color: mutedText }}>
          {currentStep.explanation}
        </div>

        {/* Active Elements Highlight */}
        {currentStep.activeStates.length > 0 && (
          <div className="flex items-center gap-2 text-[11px] font-mono pt-1" style={{ color: mutedText }}>
            <span className="text-[#dc5000] font-bold">ACTIVE NODES:</span>
            <div className="flex flex-wrap gap-1">
              {currentStep.activeStates.map((st) => (
                <span 
                  key={st} 
                  className="rounded-[4px] border border-[#dc5000]/60 px-1.5 py-0.5 text-[10px] font-bold"
                  style={{ backgroundColor: elevatedBg, color: textColor }}
                >
                  {st}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Live Partitions Display (for DFA Minimization) */}
        {currentStep.currentPartitions && currentStep.currentPartitions.length > 0 && (
          <div className="flex flex-col gap-1.5 pt-2 border-t border-dashed" style={{ borderColor }}>
            <div className="flex items-center justify-between text-[10px] font-mono uppercase" style={{ color: mutedText }}>
              <span>EQUIVALENCE PARTITIONS:</span>
              <span>{currentStep.currentPartitions.length} CLASSES</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {currentStep.currentPartitions.map((part, pIdx) => (
                <div
                  key={pIdx}
                  className="flex items-center gap-1 rounded-[6px] border px-2.5 py-1 text-xs font-mono"
                  style={{ backgroundColor: surfaceBg, borderColor }}
                >
                  <span className="text-[#dc5000] font-bold">P{pIdx}:</span>
                  <span style={{ color: textColor }}>{"{ " + part.join(", ") + " }"}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Live Subset Construction Table (for NFA to DFA) */}
        {currentStep.currentSubsetTable && currentStep.currentSubsetTable.length > 0 && (
          <div className="flex flex-col gap-1.5 pt-2 border-t border-dashed" style={{ borderColor }}>
            <div className="flex items-center justify-between text-[10px] font-mono uppercase" style={{ color: mutedText }}>
              <span>POWERSET LOOKUP TABLE:</span>
              <span>{currentStep.currentSubsetTable.length} POWER-STATES</span>
            </div>
            <div 
              className="max-h-36 overflow-y-auto rounded border"
              style={{ backgroundColor: surfaceBg, borderColor }}
            >
              <table className="w-full text-left font-mono text-[11px] border-collapse">
                <thead>
                  <tr className="border-b" style={{ backgroundColor: innerBg, borderColor, color: mutedText }}>
                    <th className="p-1.5">DFA State</th>
                    <th className="p-1.5">NFA Subset</th>
                    <th className="p-1.5">Transitions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentStep.currentSubsetTable.map((row) => (
                    <tr key={row.stateName} className="border-b" style={{ borderColor }}>
                      <td className="p-1.5 font-bold text-[#dc5000]">{row.stateName}</td>
                      <td className="p-1.5" style={{ color: textColor }}>{"{ " + row.originalSet.join(", ") + " }"}</td>
                      <td className="p-1.5" style={{ color: mutedText }}>
                        {Object.entries(row.transitions || {})
                          .map(([sym, tgt]) => `${sym} → ${tgt}`)
                          .join(" | ") || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Progress Scrubbing Slider */}
      <div className="flex flex-col gap-1">
        <div className="flex justify-between text-[10px] font-mono" style={{ color: dimText }}>
          <span>TIMELINE</span>
          <div className="flex items-center gap-3">
            <span>{Math.round(progressPercent)}%</span>
            {currentStepIndex < steps.length - 1 && (
              <button
                onClick={() => {
                  setIsPlaying(false);
                  setCurrentStepIndex(steps.length - 1);
                }}
                className="text-[#dc5000] hover:underline cursor-pointer font-bold uppercase"
              >
                Skip to End →
              </button>
            )}
          </div>
        </div>
        <input
          type="range"
          min={0}
          max={steps.length - 1}
          value={currentStepIndex}
          onChange={(e) => {
            setIsPlaying(false);
            setCurrentStepIndex(Number(e.target.value));
          }}
          className="w-full accent-[#dc5000] cursor-pointer"
        />
      </div>

      {/* Player Controls */}
      <div className="flex items-center justify-center gap-3 pt-1">
        <button
          onClick={handleReset}
          title="Reset to Start"
          className="flex h-8 w-8 items-center justify-center rounded-[22.5px] border transition-all cursor-pointer hover:opacity-80"
          style={{ backgroundColor: innerBg, borderColor, color: textColor }}
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </button>

        <button
          onClick={handlePrev}
          disabled={currentStepIndex === 0}
          title="Previous Step"
          className="flex h-8 w-8 items-center justify-center rounded-[22.5px] border disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer hover:opacity-80"
          style={{ backgroundColor: innerBg, borderColor, color: textColor }}
        >
          <SkipBack className="h-3.5 w-3.5" />
        </button>

        <button
          onClick={handlePlayPause}
          title={isPlaying ? "Pause" : "Play Walkthrough"}
          className="flex h-9 w-12 items-center justify-center rounded-[36px] border transition-all cursor-pointer hover:opacity-90"
          style={{
            backgroundColor: isDark ? "#382416" : "#424874",
            borderColor: isDark ? "#40372e" : "#424874",
            color: isDark ? "#ffedd7" : "#F4EEFF",
          }}
        >
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 fill-current ml-0.5" />}
        </button>

        <button
          onClick={handleNext}
          disabled={currentStepIndex === steps.length - 1}
          title="Next Step"
          className="flex h-8 w-8 items-center justify-center rounded-[22.5px] border disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer hover:opacity-80"
          style={{ backgroundColor: innerBg, borderColor, color: textColor }}
        >
          <SkipForward className="h-3.5 w-3.5" />
        </button>
      </div>

    </div>
  );
};
