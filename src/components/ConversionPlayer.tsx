import React, { useState, useEffect, useRef } from "react";
import { Play, Pause, SkipBack, SkipForward, RotateCcw, FastForward, CheckCircle2, Sparkles, X } from "lucide-react";
import { ConversionStep } from "../types/automaton";

interface ConversionPlayerProps {
  steps: ConversionStep[];
  onStepChange?: (step: ConversionStep) => void;
  onClose?: () => void;
  isDark?: boolean;
}

export const ConversionPlayer: React.FC<ConversionPlayerProps> = ({
  steps,
  onStepChange,
  onClose,
  isDark = true,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState<number>(1);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

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
    <div className="w-full rounded-[12px] border border-[#40372e] bg-[#1a1007] p-5 text-[#ffedd7] flex flex-col gap-4 shadow-xl">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-dashed border-[#40372e] pb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-[6px] bg-[#382416] text-[#ffedd7]">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <div className="text-xs font-medium uppercase tracking-wider text-[#ffedd7]">
              STEP-BY-STEP CONVERSION PLAYER
            </div>
            <div className="text-[10px] font-mono text-[#6c5f51]">
              FRAME {currentStepIndex + 1} OF {steps.length}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Speed badge */}
          <button
            onClick={() => setSpeed((s) => (s === 1 ? 1.5 : s === 1.5 ? 2 : 1))}
            className="flex items-center gap-1 rounded-[22.5px] border border-[#40372e] bg-[#100904] px-3 py-1 text-xs font-mono text-[#ffedd7] hover:border-[#6c5f51] transition-all cursor-pointer"
          >
            <FastForward className="h-3 w-3" />
            <span>{speed}x</span>
          </button>
          
          {onClose && (
            <button
              onClick={onClose}
              className="rounded-[6px] border border-[#40372e] p-1 text-[#a69888] hover:text-[#ffedd7] cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Step Display */}
      <div className="rounded-[8px] border border-[#40372e] bg-[#100904] p-4 flex flex-col gap-2.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium uppercase tracking-wider text-[#ffedd7] bg-[#382416] px-2.5 py-0.5 rounded-[4px] border border-[#40372e]">
            {currentStep.title}
          </span>
          {currentStepIndex === steps.length - 1 && (
            <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2 py-0.5 rounded-[4px]">
              <CheckCircle2 className="h-3.5 w-3.5" />
              COMPLETE
            </span>
          )}
        </div>

        <div className="font-mono text-xs text-[#ffedd7] bg-[#1a1007] p-2.5 rounded-[6px] border border-[#40372e]">
          {currentStep.description}
        </div>

        <div className="text-xs text-[#a69888] leading-relaxed">
          {currentStep.explanation}
        </div>

        {/* Active Elements Highlight */}
        {currentStep.activeStates.length > 0 && (
          <div className="flex items-center gap-2 text-[11px] font-mono text-[#6c5f51] pt-1">
            <span>ACTIVE SUBSET NODES:</span>
            <div className="flex flex-wrap gap-1">
              {currentStep.activeStates.map((st) => (
                <span key={st} className="rounded-[4px] bg-[#382416] border border-[#40372e] px-1.5 py-0.5 text-[10px] text-[#ffedd7] font-bold">
                  {st}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Progress Scrubbing Slider */}
      <div className="flex flex-col gap-1">
        <div className="flex justify-between text-[10px] font-mono text-[#6c5f51]">
          <span>TIMELINE</span>
          <span>{Math.round(progressPercent)}%</span>
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
          className="w-full accent-[#ffedd7] cursor-pointer"
        />
      </div>

      {/* Player Controls */}
      <div className="flex items-center justify-center gap-3 pt-1">
        <button
          onClick={handleReset}
          title="Reset to Start"
          className="flex h-8 w-8 items-center justify-center rounded-[22.5px] border border-[#40372e] bg-[#100904] text-[#ffedd7] hover:border-[#6c5f51] transition-all cursor-pointer"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </button>

        <button
          onClick={handlePrev}
          disabled={currentStepIndex === 0}
          title="Previous Step"
          className="flex h-8 w-8 items-center justify-center rounded-[22.5px] border border-[#40372e] bg-[#100904] text-[#ffedd7] hover:border-[#6c5f51] disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
        >
          <SkipBack className="h-3.5 w-3.5" />
        </button>

        <button
          onClick={handlePlayPause}
          title={isPlaying ? "Pause" : "Play Walkthrough"}
          className="flex h-9 w-12 items-center justify-center rounded-[36px] bg-[#382416] text-[#ffedd7] border border-[#40372e] hover:bg-[#40372e] transition-all cursor-pointer"
        >
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 fill-current ml-0.5" />}
        </button>

        <button
          onClick={handleNext}
          disabled={currentStepIndex === steps.length - 1}
          title="Next Step"
          className="flex h-8 w-8 items-center justify-center rounded-[22.5px] border border-[#40372e] bg-[#100904] text-[#ffedd7] hover:border-[#6c5f51] disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
        >
          <SkipForward className="h-3.5 w-3.5" />
        </button>
      </div>

    </div>
  );
};
