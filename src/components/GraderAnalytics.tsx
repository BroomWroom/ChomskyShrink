import React from "react";
import { CheckCircle2, XCircle, Trophy, Activity, ArrowRight, Lightbulb } from "lucide-react";
import { PracticeChallenge, TestCase } from "../types/automaton";
import { Automaton } from "../core/automaton";

interface GraderAnalyticsProps {
  challenge: PracticeChallenge;
  userAutomaton: Automaton;
  onRetry?: () => void;
  onNextChallenge?: () => void;
  isDark?: boolean;
}

export const GraderAnalytics: React.FC<GraderAnalyticsProps> = ({
  challenge,
  userAutomaton,
  onRetry,
  onNextChallenge,
  isDark = true,
}) => {
  // Execute userAutomaton against all test cases
  const results = challenge.testCases.map((tc: TestCase) => {
    const sim = userAutomaton.simulateString(tc.input);
    const passed = sim.accepted === tc.expected;
    return {
      testCase: tc,
      passed,
      userAccepted: sim.accepted,
      simulationDetails: sim.details,
      path: sim.path,
    };
  });

  const passedCount = results.filter((r) => r.passed).length;
  const totalCount = results.length;
  const scorePercent = Math.round((passedCount / totalCount) * 100);
  const isPerfect = passedCount === totalCount;

  // Efficiency calculation
  const userStateCount = userAutomaton.states.length;
  const optimalStateCount = challenge.optimalStateCount;
  const isOptimalStates = userStateCount <= optimalStateCount;

  const surfaceBg = isDark ? "#1a1007" : "#FFFFFF";
  const innerBg = isDark ? "#100904" : "#F8F6FF";
  const elevatedBg = isDark ? "#382416" : "#DCD6F7";
  const borderColor = isDark ? "#40372e" : "#DCD6F7";
  const textColor = isDark ? "#ffedd7" : "#424874";
  const mutedText = isDark ? "#a69888" : "#5f6594";
  const dimText = isDark ? "#6c5f51" : "#8b92be";

  return (
    <div 
      className="flex flex-col gap-6 rounded-[12px] border p-6 transition-colors duration-200"
      style={{ backgroundColor: surfaceBg, borderColor, color: textColor }}
    >
      
      {/* Score Banner */}
      <div className={`rounded-[12px] p-6 flex flex-col sm:flex-row items-center justify-between gap-4 border ${
        isPerfect
          ? "bg-emerald-950/40 border-emerald-800 text-emerald-200"
          : scorePercent >= 60
          ? "bg-amber-950/40 border-amber-800 text-amber-200"
          : "bg-rose-950/40 border-rose-800 text-rose-200"
      }`}>
        <div className="flex items-center gap-4">
          <div className={`flex h-12 w-12 items-center justify-center rounded-[8px] border ${
            isPerfect ? "bg-emerald-900 border-emerald-700 text-emerald-100" : "bg-[#382416] border-[#40372e] text-[#ffedd7]"
          }`}>
            <Trophy className="h-6 w-6" />
          </div>
          <div>
            <div className="text-xs font-medium uppercase tracking-wider opacity-75">
              TEST SUITE EXECUTION REPORT
            </div>
            <div className="text-xl font-medium uppercase tracking-tight">
              {isPerfect ? "ALL TEST CASES PASSED" : `${passedCount} OF ${totalCount} TEST CASES PASSED (${scorePercent}%)`}
            </div>
          </div>
        </div>

        <div className="text-right">
          <div className="text-3xl font-mono font-bold">{scorePercent}%</div>
          <div className="text-[10px] font-mono uppercase opacity-75">ACCURACY RATING</div>
        </div>
      </div>

      {/* Metrics Row: Efficiency & State Count */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div 
          className="rounded-[8px] border p-4"
          style={{ backgroundColor: innerBg, borderColor }}
        >
          <div className="text-[10px] font-medium uppercase" style={{ color: dimText }}>SUBMITTED STATE COUNT</div>
          <div className="text-xl font-mono font-bold mt-1" style={{ color: textColor }}>{userStateCount} STATES</div>
          <div className="text-[11px] mt-0.5" style={{ color: mutedText }}>Alphabet: &#123; {userAutomaton.alphabet.join(", ")} &#125;</div>
        </div>

        <div 
          className="rounded-[8px] border p-4"
          style={{ backgroundColor: innerBg, borderColor }}
        >
          <div className="text-[10px] font-medium uppercase" style={{ color: dimText }}>THEORETICAL OPTIMAL MINIMAL</div>
          <div className="text-xl font-mono font-bold mt-1" style={{ color: textColor }}>{optimalStateCount} STATES</div>
          <div className="text-[11px] mt-0.5" style={{ color: mutedText }}>
            {isOptimalStates ? "State-Minimal Equivalence Class" : `${userStateCount - optimalStateCount} Redundant State(s)`}
          </div>
        </div>

        <div 
          className="rounded-[8px] border p-4"
          style={{ backgroundColor: innerBg, borderColor }}
        >
          <div className="text-[10px] font-medium uppercase" style={{ color: dimText }}>DETERMINISM VERIFICATION</div>
          <div className="text-xl font-mono font-bold mt-1" style={{ color: textColor }}>
            {userAutomaton.isNFA() ? "NFA DETECTED" : "DFA COMPLIANT"}
          </div>
          <div className="text-[11px] mt-0.5" style={{ color: mutedText }}>
            {userAutomaton.isNFA() ? "Contains parallel branching paths" : "Strict deterministic transitions"}
          </div>
        </div>
      </div>

      {/* Test Case Execution Log */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between border-b border-dashed pb-2" style={{ borderColor }}>
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider" style={{ color: textColor }}>
            <Activity className="h-4 w-4 text-[#dc5000]" />
            <span>TEST SUITE EXECUTION TRACE</span>
          </div>
          <div className="text-xs font-mono" style={{ color: dimText }}>
            {passedCount}/{totalCount} PASSED
          </div>
        </div>

        <div className="overflow-x-auto rounded-[8px] border" style={{ borderColor }}>
          <table className="w-full text-left font-mono text-xs border-collapse">
            <thead>
              <tr className="border-b" style={{ backgroundColor: innerBg, borderColor, color: mutedText }}>
                <th className="p-3">Status</th>
                <th className="p-3">Input String (w)</th>
                <th className="p-3">Expected</th>
                <th className="p-3">Your Machine</th>
                <th className="p-3 font-sans">Diagnostic Detail</th>
              </tr>
            </thead>
            <tbody>
              {results.map((res, idx) => (
                <tr
                  key={idx}
                  className={`border-b ${
                    res.passed 
                      ? (isDark ? "bg-emerald-950/20" : "bg-emerald-50/60") 
                      : (isDark ? "bg-rose-950/30" : "bg-rose-50/60")
                  }`}
                  style={{ borderColor }}
                >
                  <td className="p-3">
                    {res.passed ? (
                      <span className="flex items-center gap-1 font-bold text-emerald-500">
                        <CheckCircle2 className="h-4 w-4" />
                        PASS
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 font-bold text-rose-500">
                        <XCircle className="h-4 w-4" />
                        FAIL
                      </span>
                    )}
                  </td>
                  <td className="p-3 font-bold" style={{ color: textColor }}>
                    {res.testCase.input === "" ? "ε (empty string)" : `"${res.testCase.input}"`}
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-[4px] text-[10px] font-bold ${
                      res.testCase.expected 
                        ? (isDark ? "bg-emerald-900 text-emerald-200" : "bg-emerald-100 text-emerald-800") 
                        : (isDark ? "bg-[#382416] text-[#a69888]" : "bg-[#DCD6F7] text-[#424874]")
                    }`}>
                      {res.testCase.expected ? "ACCEPT" : "REJECT"}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-[4px] text-[10px] font-bold ${
                      res.userAccepted 
                        ? (isDark ? "bg-emerald-900 text-emerald-200" : "bg-emerald-100 text-emerald-800") 
                        : (isDark ? "bg-[#382416] text-[#a69888]" : "bg-[#DCD6F7] text-[#424874]")
                    }`}>
                      {res.userAccepted ? "ACCEPT" : "REJECT"}
                    </span>
                  </td>
                  <td className="p-3 font-sans text-xs" style={{ color: mutedText }}>
                    {res.testCase.explanation}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recommendations & Tips */}
      <div 
        className="rounded-[8px] border p-4 flex flex-col gap-2"
        style={{ backgroundColor: innerBg, borderColor }}
      >
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider" style={{ color: textColor }}>
          <Lightbulb className="h-4 w-4 text-[#dc5000]" />
          <span>DIAGNOSTIC SUGGESTIONS & PROOFS</span>
        </div>
        <ul className="flex flex-col gap-1.5 text-xs list-disc pl-4" style={{ color: mutedText }}>
          {!isPerfect && (
            <li>
              Review the failed test vectors above. Ensure your state machine handles transition sink states and edge cases like the empty string ε properly.
            </li>
          )}
          {!isOptimalStates && (
            <li>
              Your solution is mathematically correct but contains redundant states. Try running Hopcroft's partition refinement algorithm in the Studio to merge indistinguishable states.
            </li>
          )}
          {isPerfect && isOptimalStates && (
            <li>
              Perfect solution: 100% test accuracy and canonical minimal state equivalence.
            </li>
          )}
        </ul>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between border-t border-dashed pt-4" style={{ borderColor }}>
        {onRetry && (
          <button
            onClick={onRetry}
            className="rounded-[22.5px] border px-5 py-2 text-xs font-medium uppercase transition-all cursor-pointer hover:opacity-80"
            style={{ borderColor, color: mutedText }}
          >
            EDIT IN STUDIO
          </button>
        )}

        {onNextChallenge && (
          <button
            onClick={onNextChallenge}
            className="flex items-center gap-2 rounded-[36px] px-6 py-2.5 text-xs sm:text-sm font-medium uppercase border transition-all cursor-pointer hover:opacity-90"
            style={{
              backgroundColor: isDark ? "#382416" : "#424874",
              borderColor: isDark ? "#40372e" : "#424874",
              color: isDark ? "#ffedd7" : "#F4EEFF",
            }}
          >
            <span>NEXT CHALLENGE</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        )}
      </div>

    </div>
  );
};
