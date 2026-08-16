import React from "react";
import { BookOpen, CheckCircle, FileText, Sparkles, X } from "lucide-react";
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#100904]/85 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-[12px] border border-[#40372e] bg-[#1a1007] p-6 lg:p-8 text-[#ffedd7] flex flex-col gap-6 shadow-2xl">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-dashed border-[#40372e] pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-[8px] border border-[#40372e] bg-[#382416] text-[#ffedd7]">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-medium uppercase text-[#ffedd7] tracking-tight">
                {conversionType === "NFA_TO_DFA"
                  ? "THEORETICAL SUMMARY // SUBSET CONSTRUCTION (NFA → DFA)"
                  : conversionType === "MINIMIZE_DFA"
                  ? "THEORETICAL SUMMARY // HOPCROFT'S MINIMIZATION"
                  : "FORMAL AUTOMATON THEORETICAL BREAKDOWN"}
              </h2>
              <p className="text-xs text-[#a69888]">
                Rigorous mathematical proof, state mappings, and transition equivalence classes.
              </p>
            </div>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-[6px] border border-[#40372e] text-[#a69888] hover:text-[#ffedd7] transition-all cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Formal 5-Tuple Definition */}
        <div className="flex flex-col gap-3 rounded-[8px] border border-[#40372e] bg-[#100904] p-4">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-[#ffedd7]">
            <FileText className="h-4 w-4 text-[#dc5000]" />
            <span>FORMAL 5-TUPLE DEFINITION: M = (Q, Σ, δ, q₀, F)</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-xs text-[#ffedd7]">
            <div className="rounded-[6px] bg-[#1a1007] p-3 border border-[#40372e]">
              <span className="text-[#a69888]">Q (States)</span> = &#123; {formalDefinition.Q.join(", ")} &#125;
            </div>
            <div className="rounded-[6px] bg-[#1a1007] p-3 border border-[#40372e]">
              <span className="text-[#a69888]">Σ (Alphabet)</span> = &#123; {formalDefinition.Sigma.join(", ")} &#125;
            </div>
            <div className="rounded-[6px] bg-[#1a1007] p-3 border border-[#40372e]">
              <span className="text-[#a69888]">q₀ (Start State)</span> = {formalDefinition.q0 || "none"}
            </div>
            <div className="rounded-[6px] bg-[#1a1007] p-3 border border-[#40372e]">
              <span className="text-[#a69888]">F (Accept States)</span> = &#123; {formalDefinition.F.join(", ")} &#125;
            </div>
          </div>
        </div>

        {/* Epsilon Closures */}
        {epsilonClosures && Object.keys(epsilonClosures).length > 0 && (
          <div className="flex flex-col gap-3 rounded-[8px] border border-[#40372e] bg-[#100904] p-4">
            <div className="text-xs font-medium uppercase tracking-wider text-[#ffedd7]">
              EPSILON (ε) CLOSURES: E(q)
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 font-mono text-xs">
              {Object.entries(epsilonClosures).map(([st, closure]) => (
                <div key={st} className="rounded-[6px] bg-[#1a1007] p-2.5 border border-[#40372e]">
                  <span className="text-[#a69888]">E({st})</span> = &#123; {closure.join(", ")} &#125;
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Subset Construction Table */}
        {subsetTable && subsetTable.length > 0 && (
          <div className="flex flex-col gap-3 rounded-[8px] border border-[#40372e] bg-[#100904] p-4">
            <div className="text-xs font-medium uppercase tracking-wider text-[#ffedd7]">
              POWER-STATE SUBSET MAPPING TABLE
            </div>
            <div className="overflow-x-auto rounded-[6px] border border-[#40372e]">
              <table className="w-full text-left font-mono text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#40372e] bg-[#1a1007] text-[#a69888]">
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
                    <tr key={row.dfaState} className={`border-b border-[#40372e]/60 ${idx % 2 === 1 ? "bg-[#1a1007]/40" : ""}`}>
                      <td className="p-3 font-bold text-[#ffedd7]">
                        {row.isStart ? "→ " : ""}{row.dfaState}{row.isAccept ? " *" : ""}
                      </td>
                      <td className="p-3 text-[#a69888]">&#123; {row.nfaSubset.join(", ")} &#125;</td>
                      <td className="p-3">
                        {row.isStart && row.isAccept ? (
                          <span className="rounded-[4px] bg-[#382416] border border-[#40372e] px-1.5 py-0.5 text-[10px] text-[#ffedd7]">START & ACCEPT</span>
                        ) : row.isStart ? (
                          <span className="rounded-[4px] bg-[#1a1007] border border-[#40372e] px-1.5 py-0.5 text-[10px] text-[#ffedd7]">START</span>
                        ) : row.isAccept ? (
                          <span className="rounded-[4px] bg-emerald-950 border border-emerald-800 px-1.5 py-0.5 text-[10px] text-emerald-200">ACCEPT</span>
                        ) : (
                          <span className="text-[10px] text-[#6c5f51]">NORMAL</span>
                        )}
                      </td>
                      {formalDefinition.Sigma.map((sym) => (
                        <td key={sym} className="p-3 text-[#ffedd7]">
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
          <div className="flex flex-col gap-3 rounded-[8px] border border-[#40372e] bg-[#100904] p-4">
            <div className="text-xs font-medium uppercase tracking-wider text-[#ffedd7]">
              HOPCROFT PARTITION REFINEMENT LOG
            </div>
            <div className="flex flex-col gap-2 font-mono text-xs">
              {minimizationSteps.map((step) => (
                <div key={step.iteration} className="rounded-[6px] bg-[#1a1007] p-3 border border-[#40372e] flex flex-col gap-1">
                  <div className="text-xs font-medium text-[#ffedd7] uppercase">
                    ITERATION {step.iteration}: {step.description}
                  </div>
                  <div className="text-[11px] text-[#a69888]">
                    Partitions: &#123; {step.partitions.map((p) => `{ ${p.join(", ")} }`).join(", ")} &#125;
                  </div>
                  {step.splitReason && (
                    <div className="text-[10px] font-sans text-[#6c5f51] mt-0.5">
                      {step.splitReason}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Theoretical Notes & Guarantees */}
        <div className="rounded-[8px] border border-[#40372e] bg-[#100904] p-4 flex flex-col gap-2.5">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-[#ffedd7]">
            <Sparkles className="h-4 w-4 text-[#dc5000]" />
            <span>THEORETICAL GUARANTEES</span>
          </div>
          <ul className="flex flex-col gap-1.5 text-xs text-[#a69888]">
            {theoremNotes.map((note, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-[#ffedd7] shrink-0 mt-0.5" />
                <span>{note}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end pt-2 border-t border-dashed border-[#40372e]">
          <button
            onClick={onClose}
            className="rounded-[36px] bg-[#382416] px-7 py-2.5 text-xs font-medium uppercase text-[#ffedd7] border border-[#40372e] hover:bg-[#40372e] transition-all cursor-pointer"
          >
            CLOSE SUMMARY
          </button>
        </div>

      </div>
    </div>
  );
};
