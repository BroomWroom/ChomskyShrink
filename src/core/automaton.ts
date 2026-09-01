import { AutomatonData, ConversionStep, TheoreticalBreakdown, Transition } from "../types/automaton";

export class Automaton implements AutomatonData {
  states: string[];
  alphabet: string[];
  transitions: Transition[];
  startState: string | null;
  acceptStates: string[];
  stateMappings: Record<string, string>;

  constructor(data?: Partial<AutomatonData>) {
    this.states = data?.states ? [...data.states] : ["q0", "q1"];
    this.alphabet = data?.alphabet ? [...data.alphabet] : ["a", "b"];
    this.transitions = data?.transitions ? [...data.transitions] : [{ from: "q0", symbol: "a", to: "q1" }];
    this.startState = data?.startState !== undefined ? data.startState : "q0";
    this.acceptStates = data?.acceptStates ? [...data.acceptStates] : ["q1"];
    this.stateMappings = data?.stateMappings ? { ...data.stateMappings } : {};
  }

  clone(): Automaton {
    return new Automaton({
      states: [...this.states],
      alphabet: [...this.alphabet],
      transitions: this.transitions.map(t => ({ ...t })),
      startState: this.startState,
      acceptStates: [...this.acceptStates],
      stateMappings: { ...this.stateMappings },
    });
  }

  isNFA(): boolean {
    for (const t of this.transitions) {
      if (t.symbol === "ε" || t.symbol === "e" || t.symbol === "" || !t.symbol) return true;
    }
    const seen = new Set<string>();
    for (const t of this.transitions) {
      const key = `${t.from}__${t.symbol}`;
      if (seen.has(key)) return true;
      seen.add(key);
    }
    return false;
  }

  getEpsilonClosure(stateSet: string[]): string[] {
    const closure = new Set<string>(stateSet);
    const stack = [...stateSet];

    while (stack.length > 0) {
      const current = stack.pop()!;
      const epsTransitions = this.transitions.filter(
        t => t.from === current && (t.symbol === "ε" || t.symbol === "e" || t.symbol === "" || !t.symbol)
      );
      for (const t of epsTransitions) {
        if (!closure.has(t.to)) {
          closure.add(t.to);
          stack.push(t.to);
        }
      }
    }
    return Array.from(closure).sort();
  }

  /* ==========================================================================
     SUBSET / POWERSET CONSTRUCTION (NFA -> DFA)
     ========================================================================== */
  toDFA(): { dfa: Automaton; steps: ConversionStep[]; theory: TheoreticalBreakdown } {
    const steps: ConversionStep[] = [];
    const epsClosures: Record<string, string[]> = {};
    for (const s of this.states) {
      epsClosures[s] = this.getEpsilonClosure([s]);
    }

    const dfa = new Automaton();
    dfa.alphabet = this.alphabet.filter(s => s !== "ε" && s !== "e" && s !== "" && s !== undefined);
    dfa.transitions = [];
    dfa.states = [];
    dfa.acceptStates = [];
    dfa.stateMappings = {};

    if (!this.startState || this.states.length === 0) {
      return { dfa, steps, theory: this.buildTheory(dfa) };
    }

    const initialSet = this.getEpsilonClosure([this.startState]);
    const subsetQueue: string[][] = [initialSet];
    const subsetMap = new Map<string, string>();
    const subsetList: { dfaName: string; set: string[]; moves: Record<string, string> }[] = [];

    const startDfaName = "q0";
    const startKey = initialSet.join(",");
    subsetMap.set(startKey, startDfaName);
    dfa.states.push(startDfaName);
    dfa.startState = startDfaName;
    dfa.stateMappings[startDfaName] = `{ ${initialSet.join(", ")} }`;

    if (initialSet.some(s => this.acceptStates.includes(s))) {
      dfa.acceptStates.push(startDfaName);
    }

    // Step 0: Initial Epsilon-Closure of Start State
    steps.push({
      stepIndex: 0,
      title: "Compute Initial State Closure",
      description: `Compute ε-closure for start state ${this.startState}: { ${initialSet.join(", ")} }`,
      explanation: `Subset construction begins at the ε-closure of the NFA start state. State ${startDfaName} represents the subset { ${initialSet.join(", ")} }.`,
      activeStates: [startDfaName],
      activeTransitions: [],
      intermediateAutomaton: dfa.clone(),
    });

    let stateCounter = 1;

    while (subsetQueue.length > 0) {
      const currentSet = subsetQueue.shift()!;
      const currentKey = currentSet.join(",");
      const currentDfaName = subsetMap.get(currentKey)!;
      const moveRecords: Record<string, string> = {};

      for (const sym of dfa.alphabet) {
        const directTargets = new Set<string>();
        for (const state of currentSet) {
          const targets = this.transitions
            .filter(t => t.from === state && t.symbol === sym)
            .map(t => t.to);
          targets.forEach(tgt => directTargets.add(tgt));
        }

        const nextSet = this.getEpsilonClosure(Array.from(directTargets));
        if (nextSet.length === 0) {
          moveRecords[sym] = "∅";
          continue;
        }

        const nextKey = nextSet.join(",");
        let nextDfaName = subsetMap.get(nextKey);

        const isNewState = !nextDfaName;
        if (isNewState) {
          nextDfaName = `q${stateCounter++}`;
          subsetMap.set(nextKey, nextDfaName);
          dfa.states.push(nextDfaName);
          dfa.stateMappings[nextDfaName] = `{ ${nextSet.join(", ")} }`;

          if (nextSet.some(s => this.acceptStates.includes(s))) {
            dfa.acceptStates.push(nextDfaName);
          }
          subsetQueue.push(nextSet);
        }

        moveRecords[sym] = nextDfaName!;
        
        // Prevent duplicate transition in DFA
        if (!dfa.transitions.some(t => t.from === currentDfaName && t.symbol === sym && t.to === nextDfaName)) {
          dfa.transitions.push({ from: currentDfaName, symbol: sym, to: nextDfaName! });
        }

        steps.push({
          stepIndex: steps.length,
          title: `Transition on '${sym}' from ${currentDfaName}`,
          description: `move(${currentDfaName}, '${sym}') = ε-closure({ ${Array.from(directTargets).join(", ")} }) = { ${nextSet.join(", ")} } → ${nextDfaName}`,
          explanation: isNewState
            ? `Discovered new deterministic power-state ${nextDfaName} representing NFA subset { ${nextSet.join(", ")} }.`
            : `Mapped transition from ${currentDfaName} on '${sym}' to existing power-state ${nextDfaName}.`,
          activeStates: [currentDfaName, nextDfaName!],
          activeTransitions: [{ from: currentDfaName, symbol: sym, to: nextDfaName! }],
          intermediateAutomaton: dfa.clone(),
        });
      }

      subsetList.push({ dfaName: currentDfaName, set: currentSet, moves: moveRecords });
    }

    const theory: TheoreticalBreakdown = {
      formalDefinition: {
        Q: [...dfa.states],
        Sigma: [...dfa.alphabet],
        delta: this.buildDelta(dfa),
        q0: dfa.startState || "q0",
        F: [...dfa.acceptStates],
      },
      epsilonClosures: epsClosures,
      subsetTable: subsetList.map(item => ({
        dfaState: item.dfaName,
        nfaSubset: item.set,
        isStart: item.dfaName === dfa.startState,
        isAccept: dfa.acceptStates.includes(item.dfaName),
        moves: item.moves,
      })),
      theoremNotes: [
        "Rabin-Scott Subset Construction Theorem guarantees that L(DFA) = L(NFA).",
        "Every state in the resulting DFA corresponds to an equivalence subset S ⊆ Q_NFA.",
        "Transitions δ_DFA(S, a) are computed by taking the ε-closure of all reachable NFA states on symbol 'a'.",
      ],
    };

    return { dfa, steps, theory };
  }

  /* ==========================================================================
     HOPCROFT / MOORE DFA MINIMIZATION & PARTITION REFINEMENT
     ========================================================================== */
  minimizeDFA(): { minDFA: Automaton; steps: ConversionStep[]; theory: TheoreticalBreakdown } {
    const steps: ConversionStep[] = [];

    // Step 1: Reachability check & unreachable state elimination
    const reachable = new Set<string>();
    if (this.startState && this.states.includes(this.startState)) {
      const q = [this.startState];
      reachable.add(this.startState);
      while (q.length > 0) {
        const curr = q.shift()!;
        for (const t of this.transitions.filter(tr => tr.from === curr)) {
          if (!reachable.has(t.to) && this.states.includes(t.to)) {
            reachable.add(t.to);
            q.push(t.to);
          }
        }
      }
    }

    const validStates = this.states.filter(s => reachable.has(s));
    const validAccept = this.acceptStates.filter(s => reachable.has(s));
    const nonAccept = validStates.filter(s => !validAccept.includes(s));

    if (validStates.length === 0) {
      const emptyDFA = new Automaton({ states: [], alphabet: [...this.alphabet], transitions: [], startState: null, acceptStates: [] });
      return { minDFA: emptyDFA, steps, theory: this.buildTheory(emptyDFA) };
    }

    // Step 2: Initial Partition P0 = { F, Q \ F }
    let partitions: string[][] = [];
    if (validAccept.length > 0) partitions.push([...validAccept]);
    if (nonAccept.length > 0) partitions.push([...nonAccept]);

    const minimizationLogs: { iteration: number; description: string; partitions: string[][]; splitReason?: string }[] = [];

    minimizationLogs.push({
      iteration: 0,
      description: "Initial Partition: Accept vs Non-Accept states",
      partitions: partitions.map(p => [...p]),
      splitReason: `Partitioned into Accept states { ${validAccept.join(", ")} } and Non-Accept states { ${nonAccept.join(", ")} }.`,
    });

    const alphabet = this.alphabet.filter(s => s !== "ε" && s !== "e" && s !== "" && s !== undefined);

    // Step 3: Iterative Partition Refinement until Equilibrium Fixed Point
    let changed = true;
    let iterationCount = 1;

    while (changed && iterationCount < 50) {
      changed = false;
      const nextPartitions: string[][] = [];

      for (const group of partitions) {
        if (group.length <= 1) {
          nextPartitions.push(group);
          continue;
        }

        // Subdivide group based on signature across all symbols
        const subGroupMap = new Map<string, string[]>();

        for (const state of group) {
          // Signature encodes which partition group index each transition lands in
          const sigParts: string[] = [];
          for (const sym of alphabet) {
            const trans = this.transitions.find(t => t.from === state && t.symbol === sym);
            if (!trans || !reachable.has(trans.to)) {
              sigParts.push(`${sym}:NONE`);
            } else {
              const targetPartitionIdx = partitions.findIndex(p => p.includes(trans.to));
              sigParts.push(`${sym}:P${targetPartitionIdx}`);
            }
          }
          const sig = sigParts.join("|");

          if (!subGroupMap.has(sig)) subGroupMap.set(sig, []);
          subGroupMap.get(sig)!.push(state);
        }

        const subGroups = Array.from(subGroupMap.values());
        if (subGroups.length > 1) {
          changed = true;
          subGroups.forEach(sg => nextPartitions.push(sg));

          minimizationLogs.push({
            iteration: iterationCount,
            description: `Refined partition { ${group.join(", ")} } into ${subGroups.length} distinct equivalence classes`,
            partitions: [...nextPartitions, ...partitions.slice(partitions.indexOf(group) + 1)].map(p => [...p]),
            splitReason: `States in { ${group.join(", ")} } had differing target partition signatures on alphabet Σ.`,
          });
        } else {
          nextPartitions.push(group);
        }
      }

      partitions = nextPartitions;
      iterationCount++;
    }

    // Step 4: Build Minimal DFA from Consolidated Partitions
    const minDFA = new Automaton();
    minDFA.alphabet = [...alphabet];
    minDFA.transitions = [];
    minDFA.states = [];
    minDFA.acceptStates = [];
    minDFA.stateMappings = {};

    const stateToMinName = new Map<string, string>();

    // Name partitions: ensure start state partition is q0
    const startPartitionIdx = partitions.findIndex(p => this.startState && p.includes(this.startState));
    if (startPartitionIdx > 0) {
      const [startGroup] = partitions.splice(startPartitionIdx, 1);
      partitions.unshift(startGroup);
    }

    partitions.forEach((group, idx) => {
      const name = `q${idx}`;
      minDFA.states.push(name);

      const mappedSets = group.map(s => this.stateMappings[s] || s);
      minDFA.stateMappings[name] = `{ ${mappedSets.join(", ")} }`;

      group.forEach(s => stateToMinName.set(s, name));
      if (group.some(s => validAccept.includes(s))) {
        minDFA.acceptStates.push(name);
      }
      if (this.startState && group.includes(this.startState)) {
        minDFA.startState = name;
      }
    });

    if (!minDFA.startState && minDFA.states.length > 0) {
      minDFA.startState = minDFA.states[0];
    }

    // Map transitions between partitions
    const addedTransitions = new Set<string>();
    for (const group of partitions) {
      const rep = group[0];
      const sourceMinName = stateToMinName.get(rep)!;

      for (const sym of alphabet) {
        const trans = this.transitions.find(t => t.from === rep && t.symbol === sym && reachable.has(t.to));
        if (trans) {
          const targetMinName = stateToMinName.get(trans.to);
          if (targetMinName) {
            const key = `${sourceMinName}_${sym}_${targetMinName}`;
            if (!addedTransitions.has(key)) {
              addedTransitions.add(key);
              minDFA.transitions.push({ from: sourceMinName, symbol: sym, to: targetMinName });
            }
          }
        }
      }
    }

    // Generate Steps for Walkthrough Player
    steps.push({
      stepIndex: 0,
      title: "Eliminate Unreachable States",
      description: `Identified reachable state set: { ${validStates.join(", ")} }`,
      explanation: `Pruned ${this.states.length - validStates.length} unreachable state(s) from initial automaton.`,
      activeStates: validStates,
      activeTransitions: [],
      intermediateAutomaton: minDFA.clone(),
    });

    minimizationLogs.forEach((log, idx) => {
      steps.push({
        stepIndex: idx + 1,
        title: `Partition Iteration ${log.iteration}`,
        description: log.description,
        explanation: log.splitReason || "Partition refinement step.",
        activeStates: minDFA.states,
        activeTransitions: minDFA.transitions,
        intermediateAutomaton: minDFA.clone(),
      });
    });

    const theory: TheoreticalBreakdown = {
      formalDefinition: {
        Q: [...minDFA.states],
        Sigma: [...minDFA.alphabet],
        delta: this.buildDelta(minDFA),
        q0: minDFA.startState || "q0",
        F: [...minDFA.acceptStates],
      },
      minimizationSteps: minimizationLogs,
      theoremNotes: [
        "Hopcroft's and Moore's Partition Refinement computes the unique Minimal DFA.",
        "Myhill-Nerode Theorem guarantees that any regular language has a unique minimal state model up to isomorphism.",
        "Unreachable states are pruned first, followed by partition refinement until all indistinguishable states are merged.",
      ],
    };

    return { minDFA, steps, theory };
  }

  /* ==========================================================================
     UNIVERSAL STRING SIMULATOR (NFA + DFA ACCURATE)
     ========================================================================== */
  simulateString(inputStr: string): {
    accepted: boolean;
    path: { state: string; symbolConsumed: string; nextState: string }[];
    finalState: string;
    details: string;
  } {
    if (!this.startState || this.states.length === 0) {
      return { accepted: false, path: [], finalState: "", details: "No start state defined." };
    }

    const isNfaModel = this.isNFA();

    if (!isNfaModel) {
      // Deterministic DFA simulation
      let current = this.startState;
      const path: { state: string; symbolConsumed: string; nextState: string }[] = [];

      for (let i = 0; i < inputStr.length; i++) {
        const sym = inputStr[i];
        const trans = this.transitions.find(t => t.from === current && t.symbol === sym);
        if (!trans) {
          return {
            accepted: false,
            path,
            finalState: current,
            details: `Rejected: No transition from state '${current}' on symbol '${sym}' at position ${i + 1}.`,
          };
        }
        path.push({ state: current, symbolConsumed: sym, nextState: trans.to });
        current = trans.to;
      }

      const isAccept = this.acceptStates.includes(current);
      return {
        accepted: isAccept,
        path,
        finalState: current,
        details: isAccept
          ? `Accepted: String reached Final Accept State '${current}'.`
          : `Rejected: String terminated in Non-Accept State '${current}'.`,
      };
    } else {
      // Non-Deterministic NFA simulation using active subsets & ε-closures
      let currentSubset = this.getEpsilonClosure([this.startState]);
      const path: { state: string; symbolConsumed: string; nextState: string }[] = [];

      for (let i = 0; i < inputStr.length; i++) {
        const sym = inputStr[i];
        const directTargets = new Set<string>();
        for (const st of currentSubset) {
          const targets = this.transitions
            .filter(t => t.from === st && t.symbol === sym)
            .map(t => t.to);
          targets.forEach(t => directTargets.add(t));
        }

        const nextSubset = this.getEpsilonClosure(Array.from(directTargets));
        const fromSummary = currentSubset.join(",");
        const toSummary = nextSubset.length > 0 ? nextSubset.join(",") : "∅";

        // Representative single state for graph highlighter
        const repFrom = currentSubset[0] || this.startState;
        const repTo = nextSubset[0] || repFrom;

        path.push({ state: repFrom, symbolConsumed: sym, nextState: repTo });

        if (nextSubset.length === 0) {
          return {
            accepted: false,
            path,
            finalState: "∅",
            details: `Rejected: All non-deterministic computation branches died on symbol '${sym}' at position ${i + 1}.`,
          };
        }

        currentSubset = nextSubset;
      }

      const isAccept = currentSubset.some(s => this.acceptStates.includes(s));
      const finalAccepts = currentSubset.filter(s => this.acceptStates.includes(s));
      return {
        accepted: isAccept,
        path,
        finalState: `{ ${currentSubset.join(", ")} }`,
        details: isAccept
          ? `Accepted: Active computation subset contains accept state(s): { ${finalAccepts.join(", ")} }.`
          : `Rejected: None of the active final states { ${currentSubset.join(", ")} } are in accept set.`,
      };
    }
  }

  private buildDelta(auto: Automaton): Record<string, Record<string, string[]>> {
    const delta: Record<string, Record<string, string[]>> = {};
    for (const s of auto.states) {
      delta[s] = {};
      for (const sym of auto.alphabet) {
        const targets = auto.transitions
          .filter(t => t.from === s && t.symbol === sym)
          .map(t => t.to);
        if (targets.length > 0) {
          delta[s][sym] = targets;
        }
      }
    }
    return delta;
  }

  private buildTheory(auto: Automaton): TheoreticalBreakdown {
    return {
      formalDefinition: {
        Q: [...auto.states],
        Sigma: [...auto.alphabet],
        delta: this.buildDelta(auto),
        q0: auto.startState || "q0",
        F: [...auto.acceptStates],
      },
      theoremNotes: [],
    };
  }
}

/* ==========================================================================
   THOMPSON'S REGEX BUILDER
   ========================================================================== */
export function parseRegexToNFA(regexStr: string): Automaton {
  if (!regexStr || typeof regexStr !== "string") return new Automaton();

  const isOperator = (c: string) => ["(", ")", "|", "*", "+", "?", "."].includes(c);
  const isOperand = (c: string) => !isOperator(c);
  const canEnd = (c: string) => isOperand(c) || c === ")" || c === "*" || c === "+" || c === "?";
  const canStart = (c: string) => isOperand(c) || c === "(";

  let formatted = "";
  for (let i = 0; i < regexStr.length; i++) {
    const c1 = regexStr[i];
    formatted += c1;
    if (i + 1 < regexStr.length) {
      const c2 = regexStr[i + 1];
      if (canEnd(c1) && canStart(c2)) {
        formatted += ".";
      }
    }
  }

  const precedence: Record<string, number> = { "*": 3, "+": 3, "?": 3, ".": 2, "|": 1 };
  const output: string[] = [], stack: string[] = [];

  for (let i = 0; i < formatted.length; i++) {
    const token = formatted[i];
    if (isOperand(token)) {
      output.push(token);
    } else if (token === "(") {
      stack.push(token);
    } else if (token === ")") {
      while (stack.length > 0 && stack[stack.length - 1] !== "(") {
        output.push(stack.pop()!);
      }
      if (stack.length > 0) stack.pop();
    } else if (precedence[token]) {
      while (
        stack.length > 0 &&
        stack[stack.length - 1] !== "(" &&
        precedence[stack[stack.length - 1]] >= precedence[token]
      ) {
        output.push(stack.pop()!);
      }
      stack.push(token);
    }
  }
  while (stack.length > 0) output.push(stack.pop()!);

  let counter = 0;
  function newState() { return `q${counter++}`; }
  const fragStack: { start: string; accept: string; states: string[]; transitions: Transition[]; alphabet: string[] }[] = [];

  for (const token of output) {
    if (isOperand(token)) {
      const s = newState(), a = newState();
      fragStack.push({
        start: s,
        accept: a,
        states: [s, a],
        transitions: [{ from: s, symbol: token, to: a }],
        alphabet: [token],
      });
    } else if (token === ".") {
      if (fragStack.length < 2) continue;
      const b = fragStack.pop()!, a = fragStack.pop()!;
      fragStack.push({
        start: a.start,
        accept: b.accept,
        states: [...a.states, ...b.states],
        transitions: [...a.transitions, ...b.transitions, { from: a.accept, symbol: "ε", to: b.start }],
        alphabet: Array.from(new Set([...a.alphabet, ...b.alphabet])),
      });
    } else if (token === "|") {
      if (fragStack.length < 2) continue;
      const b = fragStack.pop()!, a = fragStack.pop()!;
      const s = newState(), acc = newState();
      fragStack.push({
        start: s,
        accept: acc,
        states: [s, acc, ...a.states, ...b.states],
        transitions: [
          ...a.transitions,
          ...b.transitions,
          { from: s, symbol: "ε", to: a.start },
          { from: s, symbol: "ε", to: b.start },
          { from: a.accept, symbol: "ε", to: acc },
          { from: b.accept, symbol: "ε", to: acc },
        ],
        alphabet: Array.from(new Set([...a.alphabet, ...b.alphabet])),
      });
    } else if (token === "*") {
      if (fragStack.length < 1) continue;
      const a = fragStack.pop()!;
      const s = newState(), acc = newState();
      fragStack.push({
        start: s,
        accept: acc,
        states: [s, acc, ...a.states],
        transitions: [
          ...a.transitions,
          { from: s, symbol: "ε", to: a.start },
          { from: s, symbol: "ε", to: acc },
          { from: a.accept, symbol: "ε", to: a.start },
          { from: a.accept, symbol: "ε", to: acc },
        ],
        alphabet: a.alphabet,
      });
    }
  }

  const finalFrag = fragStack.pop();
  return new Automaton({
    states: finalFrag ? finalFrag.states : ["q0"],
    alphabet: finalFrag ? finalFrag.alphabet : ["a"],
    transitions: finalFrag ? finalFrag.transitions : [],
    startState: finalFrag ? finalFrag.start : "q0",
    acceptStates: finalFrag ? [finalFrag.accept] : [],
  });
}

/* ==========================================================================
   SIMPLE TEXT NOTATION PARSER
   ========================================================================== */
export function parseSimpleTextToAutomaton(text: string): Automaton {
  const auto = new Automaton();
  auto.states = [];
  auto.alphabet = [];
  auto.transitions = [];
  auto.acceptStates = [];
  auto.startState = null;

  const lines = text.split("\n");
  lines.forEach(line => {
    const l = line.trim();
    if (!l || l.startsWith("#")) return;

    if (l.startsWith("->")) {
      const st = l.replace("->", "").replace("*", "").trim();
      auto.startState = st;
      if (!auto.states.includes(st)) auto.states.push(st);
      if (l.includes("*") && !auto.acceptStates.includes(st)) auto.acceptStates.push(st);
    } else if (l.endsWith("*") && !l.includes("--")) {
      const st = l.replace("*", "").trim();
      if (!auto.states.includes(st)) auto.states.push(st);
      if (!auto.acceptStates.includes(st)) auto.acceptStates.push(st);
    } else if (l.includes("--") && l.includes("-->")) {
      const parts = l.split(/--|-->/);
      if (parts.length >= 3) {
        const from = parts[0].replace("->", "").replace("*", "").trim();
        const sym = parts[1].trim();
        const to = parts[2].replace("*", "").trim();

        if (from && !auto.states.includes(from)) auto.states.push(from);
        if (to && !auto.states.includes(to)) auto.states.push(to);

        if (sym && !auto.alphabet.includes(sym) && sym !== "ε" && sym !== "e") {
          auto.alphabet.push(sym);
        }

        if (from && to) {
          auto.transitions.push({ from, symbol: sym || "ε", to });
        }

        if (parts[0].includes("->") && !auto.startState) auto.startState = from;
        if (parts[0].includes("*") && !auto.acceptStates.includes(from)) auto.acceptStates.push(from);
        if (parts[2].includes("*") && !auto.acceptStates.includes(to)) auto.acceptStates.push(to);
      }
    }
  });

  if (!auto.startState && auto.states.length > 0) {
    auto.startState = auto.states[0];
  }

  return auto;
}
