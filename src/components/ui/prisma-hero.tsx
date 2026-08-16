import { motion, useInView } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { useRef } from "react";

/* ---------------- WordsPullUp ---------------- */
interface WordsPullUpProps {
  text: string;
  className?: string;
  showAsterisk?: boolean;
  style?: React.CSSProperties;
}

export const WordsPullUp = ({ text, className = "", showAsterisk = false, style }: WordsPullUpProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });
  const words = text.split(" ");

  return (
    <div ref={ref} className={`inline-flex flex-wrap ${className}`} style={style}>
      {words.map((word, i) => {
        const isLast = i === words.length - 1;
        return (
          <motion.span
            key={i}
            initial={{ y: 20, opacity: 0 }}
            animate={isInView ? { y: 0, opacity: 1 } : {}}
            transition={{ duration: 0.6, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
            className="inline-block relative"
            style={{ marginRight: isLast ? 0 : "0.25em" }}
          >
            {word}
            {showAsterisk && isLast && (
              <span className="absolute top-[0.65em] -right-[0.3em] text-[0.31em]">*</span>
            )}
          </motion.span>
        );
      })}
    </div>
  );
};

/* ---------------- WordsPullUpMultiStyle ---------------- */
interface Segment {
  text: string;
  className?: string;
}

interface WordsPullUpMultiStyleProps {
  segments: Segment[];
  className?: string;
  style?: React.CSSProperties;
}

export const WordsPullUpMultiStyle = ({ segments, className = "", style }: WordsPullUpMultiStyleProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });

  const words: { word: string; className?: string }[] = [];
  segments.forEach((seg) => {
    seg.text.split(" ").forEach((w) => {
      if (w) words.push({ word: w, className: seg.className });
    });
  });

  return (
    <div ref={ref} className={`inline-flex flex-wrap justify-center ${className}`} style={style}>
      {words.map((w, i) => (
        <motion.span
          key={i}
          initial={{ y: 20, opacity: 0 }}
          animate={isInView ? { y: 0, opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
          className={`inline-block ${w.className ?? ""}`}
          style={{ marginRight: "0.25em" }}
        >
          {w.word}
        </motion.span>
      ))}
    </div>
  );
};

/* ---------------- Hero ---------------- */
interface PrismaHeroProps {
  onNavigate?: (tab: string) => void;
}

const navItems = [
  { label: "Converter", tab: "converter" },
  { label: "Interactive Lessons", tab: "lessons" },
  { label: "Practice Arena", tab: "practice" },
  { label: "Theory Docs", tab: "theory" },
];

export const PrismaHero = ({ onNavigate }: PrismaHeroProps) => {
  return (
    <section className="h-[92vh] w-full p-2 md:p-4">
      <div className="relative h-full w-full overflow-hidden rounded-2xl md:rounded-[2rem] shadow-2xl border border-[#424874]/20 bg-[#0f1123]">
        
        {/* Background video */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 h-full w-full object-cover opacity-60"
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260405_170732_8a9ccda6-5cff-4628-b164-059c500a2b41.mp4"
        />

        {/* Noise overlay */}
        <div className="noise-overlay pointer-events-none absolute inset-0 opacity-[0.7] mix-blend-overlay" />

        {/* Gradient overlay */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#0f1123]/60 via-transparent to-[#0f1123]/90" />

        {/* Floating badge */}
        <div className="absolute top-6 left-6 z-20 flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#424874]/80 backdrop-blur-md border border-[#A6B1E1]/30 text-[#F4EEFF] text-xs font-mono">
          <Sparkles className="w-3.5 h-3.5 text-[#A6B1E1]" />
          <span>Finite Automata Engine v2.5</span>
        </div>

        {/* Navbar */}
        <nav className="absolute left-1/2 top-0 z-20 -translate-x-1/2">
          <div className="flex items-center gap-3 rounded-b-2xl bg-[#0f1123]/90 backdrop-blur-md border-b border-x border-[#424874]/40 px-4 py-2.5 sm:gap-6 md:gap-10 md:rounded-b-3xl md:px-8">
            {navItems.map((item) => (
              <button
                key={item.label}
                onClick={() => onNavigate?.(item.tab)}
                className="text-xs transition-colors sm:text-sm font-medium tracking-wide"
                style={{ color: "rgba(225, 224, 204, 0.8)" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#F4EEFF")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(225, 224, 204, 0.8)")}
              >
                {item.label}
              </button>
            ))}
          </div>
        </nav>

        {/* Hero content */}
        <div className="absolute bottom-0 left-0 right-0 px-6 pb-6 sm:px-8 md:px-12">
          <div className="grid grid-cols-12 items-end gap-6">
            
            <div className="col-span-12 lg:col-span-8">
              <h1
                className="font-bold leading-[0.82] tracking-[-0.07em] text-[18vw] sm:text-[16vw] md:text-[14vw] lg:text-[12vw] xl:text-[11vw] text-[#F4EEFF]"
                style={{ textShadow: "0 10px 40px rgba(0,0,0,0.6)" }}
              >
                <WordsPullUp text="Chomsky" showAsterisk />
              </h1>
              <div className="text-xl sm:text-2xl md:text-3xl font-mono text-[#A6B1E1] tracking-tight mt-1 font-semibold">
                Finite Automata Converter & Minimizer Studio
              </div>
            </div>

            <div className="col-span-12 flex flex-col gap-5 pb-2 lg:col-span-4 lg:pb-4">
              
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="text-xs text-[#DCD6F7]/90 sm:text-sm md:text-base leading-relaxed"
              >
                Visual drag-and-drop state machines, instant Subset Construction (NFA &rarr; DFA), Hopcroft minimization, step-by-step video playback, and curated CS practice challenges.
              </motion.p>

              <div className="flex flex-wrap gap-3">
                <motion.button
                  onClick={() => onNavigate?.("converter")}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.7, ease: [0.16, 1, 0.3, 1] }}
                  className="group inline-flex items-center gap-3 rounded-full bg-[#F4EEFF] py-1.5 pl-6 pr-2 text-sm font-semibold text-[#424874] transition-all hover:bg-[#DCD6F7] hover:scale-105 shadow-xl sm:text-base cursor-pointer"
                >
                  Launch Studio
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#424874] text-[#F4EEFF] transition-transform group-hover:translate-x-1 sm:h-10 sm:w-10">
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </motion.button>

                <motion.button
                  onClick={() => onNavigate?.("lessons")}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.8, ease: [0.16, 1, 0.3, 1] }}
                  className="inline-flex items-center gap-2 rounded-full bg-[#424874]/60 backdrop-blur-md border border-[#A6B1E1]/40 px-5 py-2.5 text-sm font-medium text-[#F4EEFF] hover:bg-[#424874] transition-all cursor-pointer"
                >
                  Interactive Lessons
                </motion.button>
              </div>

            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
