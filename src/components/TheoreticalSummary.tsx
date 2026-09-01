import React from "react";
import { BookOpen, CheckCircle, FileText, Zap, X } from "lucide-react";
import { TheoreticalBreakdown } from "../types/automaton";

interface TheoreticalSummaryProps {
  theory: TheoreticalBreakdown;
  conversionType: "NFA_TO_DFA" | "MINIMIZE_DFA" | "GENERAL";
  onClose?: () => void;
  isDark?: boolean;
}

export const TheoreticalSummary: React.FC<TheoreticalSummaryProps> = ({
  theory,
  conversionType,
  onClose,
  isDark = true,
}) => {
  const { formalDefinition, epsilonClosures, subsetTable, minimizationSteps, theoremNotes } = theory;

  const surfaceBg = isDark ? "#1a1007" : "#FFFFFF";
  const innerBg = isDark ? "#100904" : "#F8F6FF";
  const elevatedBg = isDark ? "#382416" : "#DCD6F7";
  const borderColor = isDark ? "#40372e" : "#DCD6F7";
  const textColor = isDark ? "#ffedd7" : "#424874";
  const mutedText = isDark ? "#a69888" : "#5f6594";
  const dimText = isDark ? "#6c5f51" : "#8b92be";

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto"
      style={{ backgroundColor: isDark ? "rgba(16, 9, 4, 0.85)" : "rgba(66, 72, 116, 0.4)" }}
    >
      <div 
        className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-[12px] border p-6 lg:p-8 flex flex-col gap-6 shadow-2xl transition-colors duration-200"
        style={{ backgroundColor: surfaceBg, borderColor, color: textColor }}
      >
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-dashed pb-4" style={{ borderColor }}>
          <div className="flex items-center gap-3">
            <div 
              className="flex h-10 w-10 items-center justify-center rounded-[8px] border"
              style={{ backgroundColor: elevatedBg, borderColor, color: textColor }}
            >
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-medium uppercase tracking-tight" style={{ color: textColor }}>
                {conversionType === "NFA_TO_DFA"
                  ? "THEORETICAL SUMMARY // SUBSET CONSTRUCTION (NFA → DFA)"
                  : conversionType === "MINIMIZE_DFA"
                  ? "THEORETICAL SUMMARY // HOPCROFT'S MINIMIZATION"
                  : "FORMAL AUTOMATON THEORETICAL BREAKDOWN"}
              </h2>
              <p className="text-xs" style={{ color: mutedText }}>
                Rigorous mathematical proof, state mappings, and transition equivalence classes.
              </p>
            </div>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-[6px] border transition-all cursor-pointer hover:opacity-80"
              style={{ borderColor, color: mutedText }}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Formal 5-Tuple Definition */}
        <div 
          className="flex flex-col gap-3 rounded-[8px] border p-4"
          style={{ backgroundColor: innerBg, borderColor }}
        >
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider" style={{ color: textColor }}>
            <FileText className="h-4 w-4 text-[#dc5000]" />
            <span>FORMAL 5-TUPLE DEFINITION: M = (Q, Σ, δ, q₀, F)</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-xs" style={{ color: textColor }}>
            <div className="rounded-[6px] p-3 border" style={{ backgroundColor: surfaceBg, borderColor }}>
              <span style={{ color: mutedText }}>Q (States)</span> = &#123; {formalDefinition.Q.join(", ")} &#125;
            </div>
            <div className="rounded-[6px] p-3 border" style={{ backgroundColor: surfaceBg, borderColor }}>
              <span style={{ color: mutedText }}>Σ (Alphabet)</span> = &#123; {formalDefinition.Sigma.join(", ")} &#125;
            </div>
            <div className="rounded-[6px] p-3 border" style={{ backgroundColor: surfaceBg, borderColor }}>
              <span style={{ color: mutedText }}>q₀ (Start State)</span> = {formalDefinition.q0 || "none"}
            </div>
            <div className="rounded-[6px] p-3 border" style={{ backgroundColor: surfaceBg, borderColor }}>
              <span style={{ color: mutedText }}>F (Accept States)</span> = &#123; {formalDefinition.F.join(", ")} &#125;
            </div>
          </div>
        </div>

        {/* Epsilon Closures */}
        {epsilonClosures && Object.keys(epsilonClosures).length > 0 && (
          <div 
            className="flex flex-col gap-3 rounded-[8px] border p-4"
            style={{ backgroundColor: innerBg, borderColor }}
          >
            <div className="text-xs font-medium uppercase tracking-wider" style={{ color: textColor }}>
              EPSILON (ε) CLOSURES: E(q)
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 font-mono text-xs">
              {Object.entries(epsilonClosures).map(([st, closure]) => (
                <div key={st} className="rounded-[6px] p-2.5 border" style={{ backgroundColor: surfaceBg, borderColor }}>
                  <span style={{ color: mutedText }}>E({st})</span> = &#123; {closure.join(", ")} &#125;
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Subset Construction Table */}
        {subsetTable && subsetTable.length > 0 && (
          <div 
            className="flex flex-col gap-3 rounded-[8px] border p-4"
            style={{ backgroundColor: innerBg, borderColor }}
          >
            <div className="text-xs font-medium uppercase tracking-wider" style={{ color: textColor }}>
              POWER-STATE SUBSET MAPPING TABLE
            </div>
            <div className="overflow-x-auto rounded-[6px] border" style={{ borderColor }}>
              <table className="w-full text-left font-mono text-xs border-collapse">
                <thead>
                  <tr className="border-b" style={{ backgroundColor: surfaceBg, borderColor, color: mutedText }}>
                    <th className="p-3">DFA State</th>
                    <th className="p-3">NFA Subset</th>
                    <th className="p-3">Classification</th>
                    {formalDefinition.Sigma.map((sym) => (
                      <th key={sym} className="p-3">δ(S, {sym})</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {subsetTable.map((row, idx) => (
                    <tr key={row.dfaState} className={`border-b ${idx % 2 === 1 ? (isDark ? "bg-[#1a1007]/40" : "bg-[#F8F6FF]/60") : ""}`} style={{ borderColor }}>
                      <td className="p-3 font-bold" style={{ color: textColor }}>
                        {row.isStart ? "→ " : ""}{row.dfaState}{row.isAccept ? " *" : ""}
                      </td>
                      <td className="p-3" style={{ color: mutedText }}>&#123; {row.nfaSubset.join(", ")} &#125;</td>
                      <td className="p-3">
                        {row.isStart && row.isAccept ? (
                          <span className="rounded-[4px] border px-1.5 py-0.5 text-[10px]" style={{ backgroundColor: elevatedBg, borderColor, color: textColor }}>START & ACCEPT</span>
                        ) : row.isStart ? (
                          <span className="rounded-[4px] border px-1.5 py-0.5 text-[10px]" style={{ backgroundColor: surfaceBg, borderColor, color: textColor }}>START</span>
                        ) : row.isAccept ? (
                          <span className={`rounded-[4px] border px-1.5 py-0.5 text-[10px] ${isDark ? "bg-emerald-950 border-emerald-800 text-emerald-200" : "bg-emerald-100 border-emerald-300 text-emerald-800"}`}>ACCEPT</span>
                        ) : (
                          <span className="text-[10px]" style={{ color: dimText }}>NORMAL</span>
                        )}
                      </td>
                      {formalDefinition.Sigma.map((sym) => (
                        <td key={sym} className="p-3" style={{ color: textColor }}>
                          {row.moves[sym] || "—"}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Hopcroft Minimization Iterations */}
        {minimizationSteps && minimizationSteps.length > 0 && (
          <div 
            className="flex flex-col gap-3 rounded-[8px] border p-4"
            style={{ backgroundColor: innerBg, borderColor }}
          >
            <div className="text-xs font-medium uppercase tracking-wider" style={{ color: textColor }}>
              HOPCROFT PARTITION REFINEMENT LOG
            </div>
            <div className="flex flex-col gap-2 font-mono text-xs">
              {minimizationSteps.map((step) => (
                <div key={step.iteration} className="rounded-[6px] p-3 border flex flex-col gap-1" style={{ backgroundColor: surfaceBg, borderColor }}>
                  <div className="text-xs font-medium uppercase" style={{ color: textColor }}>
                    ITERATION {step.iteration}: {step.description}
                  </div>
                  <div className="text-[11px]" style={{ color: mutedText }}>
                    Partitions: &#123; {step.partitions.map((p) => `{ ${p.join(", ")} }`).join(", ")} &#125;
                  </div>
                  {step.splitReason && (
                    <div className="text-[10px] font-sans mt-0.5" style={{ color: dimText }}>
                      {step.splitReason}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Theoretical Notes & Guarantees */}
        <div 
          className="rounded-[8px] border p-4 flex flex-col gap-2.5"
          style={{ backgroundColor: innerBg, borderColor }}
        >
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider" style={{ color: textColor }}>
            <Zap className="h-4 w-4 text-[#dc5000]" />
            <span>THEORETICAL GUARANTEES</span>
          </div>
          <ul className="flex flex-col gap-1.5 text-xs" style={{ color: mutedText }}>
            {theoremNotes.map((note, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 shrink-0 mt-0.5 text-[#dc5000]" />
                <span>{note}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end pt-2 border-t border-dashed" style={{ borderColor }}>
          <button
            onClick={onClose}
            className="rounded-[36px] px-7 py-2.5 text-xs font-medium uppercase border transition-all cursor-pointer hover:opacity-90"
            style={{
              backgroundColor: isDark ? "#382416" : "#424874",
              borderColor: isDark ? "#40372e" : "#424874",
              color: isDark ? "#ffedd7" : "#F4EEFF",
            }}
          >
            CLOSE SUMMARY
          </button>
        </div>

      </div>
    </div>
  );
};
