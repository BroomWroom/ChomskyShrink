import { LessonModule } from "../types/automaton";

export interface LessonTrack {
  id: string;
  title: string;
  description: string;
  lessonIds: string[];
}

export interface ReferenceMaterial {
  title: string;
  author: string;
  source: string;
  type: "Textbook" | "Paper" | "Cheatsheet" | "Reference";
  description: string;
  link?: string;
}

export const LESSON_TRACKS: LessonTrack[] = [
  {
    id: "track-foundations",
    title: "Track 1: Deterministic Automata & Foundations",
    description: "Formal 5-tuple models, determinism rules, state transition functions, and basic language acceptance.",
    lessonIds: ["dfa-fundamentals", "dfa-state-minimization", "dfa-complement-construction"],
  },
  {
    id: "track-nondeterminism",
    title: "Track 2: Non-Determinism & Powerset Equivalence",
    description: "Branching computation, epsilon transitions, subset construction proofs, and regular expression mapping.",
    lessonIds: ["nfa-and-epsilon", "subset-construction", "thompson-construction"],
  },
  {
    id: "track-patterns-modulo",
    title: "Track 3: Pattern Recognizers & Modular Arithmetic",
    description: "Streaming binary modulo counters, Horner's rule, sliding window substring matchers, and parity cross-products.",
    lessonIds: ["divisibility-modulo-machines", "substring-matching-dfa", "parity-counting-grids", "forbidden-patterns-dead-states"],
  },
  {
    id: "track-lexers-alphabets",
    title: "Track 4: Compiler Lexing & Multi-Character Alphabets",
    description: "Industrial tokenizers, identifier recognizers, floating-point numeric scanners, and non-binary alphabets.",
    lessonIds: ["multi-char-alphabets-lexers", "ternary-base4-machines", "run-length-bounded-machines"],
  },
  {
    id: "track-limits-grammars",
    title: "Track 5: Computational Limits & The Chomsky Hierarchy",
    description: "Pumping Lemma proofs by contradiction, Myhill-Nerode equivalence classes, Moore/Mealy transducers, and grammar hierarchies.",
    lessonIds: ["pumping-lemma", "myhill-nerode-theorem", "moore-mealy-machines", "chomsky-hierarchy"],
  },
];

export const REFERENCE_MATERIALS: ReferenceMaterial[] = [
  {
    title: "Introduction to Automata Theory, Languages, and Computation (3rd Edition)",
    author: "John E. Hopcroft, Rajeev Motwani, Jeffrey D. Ullman",
    source: "Pearson / Addison-Wesley",
    type: "Textbook",
    description: "The definitive reference text on finite automata, regular languages, and computational complexity.",
  },
  {
    title: "Introduction to the Theory of Computation (3rd Edition)",
    author: "Michael Sipser (MIT)",
    source: "Cengage Learning",
    type: "Textbook",
    description: "Standard pedagogical guide featuring intuitive proofs of the Pumping Lemma and Myhill-Nerode Theorem.",
  },
  {
    title: "Finite Automata and Their Decision Problems",
    author: "Michael O. Rabin & Dana Scott (1959)",
    source: "IBM Journal of Research and Development",
    type: "Paper",
    description: "Seminal Turing Award-winning paper introducing Non-Deterministic Finite Automata (NFA) and subset construction.",
  },
  {
    title: "Regular Expressions and State Models Cheat Sheet",
    author: "ChomskyShrink Lab",
    source: "Internal Formal Docs",
    type: "Cheatsheet",
    description: "Quick-reference table of standard closure properties, Horner's rule modulo transitions, and pumping lengths.",
  },
];

export const LESSON_MODULES: LessonModule[] = [
  {
    id: "dfa-fundamentals",
    title: "Deterministic Finite Automata (DFA) Foundations",
    category: "Track 1: Deterministic Automata",
    readTime: "6 min read",
    videoUrl: "https://www.youtube-nocookie.com/embed/40i4PKpM0cI",
    videoTitle: "Introduction to Finite Automata - Determinism & Formal 5-Tuple",
    videoDuration: "12:45",
    summary: "Understand the formal 5-tuple mathematical definition of a DFA, determinism constraints, state transition functions, and acceptance criteria.",
    content: [
      {
        heading: "The 5-Tuple Formal Definition",
        body: "A Deterministic Finite Automaton (DFA) is formally defined as a 5-tuple M = (Q, Σ, δ, q₀, F).",
        mathFormula: "M = (Q, \\Sigma, \\delta, q_0, F)",
        keyTakeaway: "Q is the finite set of states; Σ is the input alphabet; δ: Q × Σ → Q is the transition function; q₀ ∈ Q is the start state; F ⊆ Q is the set of accept states.",
      },
      {
        heading: "The Determinism Rule",
        body: "In a DFA, for EVERY state q ∈ Q and EVERY alphabet symbol a ∈ Σ, there must exist EXACTLY ONE transition δ(q, a). There can be no missing transitions and no epsilon (ε) transitions.",
        keyTakeaway: "Zero ambiguity: Given an input string, there is exactly one unique computational path.",
      },
    ],
    interactiveTips: [
      "Always verify that every state has an outgoing transition for each symbol in your alphabet Σ.",
      "If an input string can never be accepted once an invalid sequence is read, route it to a permanent Trap/Dead state.",
    ],
    commonMistakes: [
      "Forgetting transitions for some symbols in Σ.",
      "Adding multiple outgoing transitions on the same symbol (turns it into an NFA).",
    ],
    practiceChallengeId: "bin-div-2",
  },
  {
    id: "dfa-state-minimization",
    title: "Hopcroft's DFA Minimization & Partition Refinement",
    category: "Track 1: Deterministic Automata",
    readTime: "9 min read",
    videoUrl: "https://www.youtube-nocookie.com/embed/0XaGAkY09Wc",
    videoTitle: "Minimization of DFA using Partition Method",
    videoDuration: "14:40",
    summary: "Learn how to reduce redundant states to achieve the unique minimal DFA guaranteed by the Myhill-Nerode theorem.",
    content: [
      {
        heading: "Partition Refinement Principle",
        body: "Start with two groups: Accept states (F) and Non-Accept states (Q \\ F). Successively refine partitions by checking if states in a group transition to different groups on symbol 'a'.",
        mathFormula: "P_0 = \\{ F, Q \\setminus F \\}",
        keyTakeaway: "Two states are equivalent if and only if for all input strings w ∈ Σ*, either both states accept or both reject.",
      },
    ],
    interactiveTips: [
      "First eliminate all unreachable states before performing partition refinement.",
      "When no partition can be split further on any alphabet symbol, merge states within each group.",
    ],
    commonMistakes: [
      "Failing to prune unreachable states before partitioning.",
    ],
    practiceChallengeId: "bin-div-4",
  },
  {
    id: "dfa-complement-construction",
    title: "Complement & Intersection of Regular Languages",
    category: "Track 1: Deterministic Automata",
    readTime: "7 min read",
    videoUrl: "https://www.youtube-nocookie.com/embed/6aRJQNYYz4s",
    videoTitle: "Complement & Intersection of Finite Automata",
    videoDuration: "11:20",
    summary: "Construct complement machines by inverting accept states, and build cross-product machines for language intersection.",
    content: [
      {
        heading: "Language Complementation",
        body: "For a complete DFA M = (Q, Σ, δ, q₀, F), the complement automaton M' accepting Σ* \\ L(M) is obtained simply by replacing F with Q \\ F.",
        mathFormula: "M' = (Q, \\Sigma, \\delta, q_0, Q \\setminus F)",
        keyTakeaway: "Complementation requires a strictly complete DFA (all dead states must be explicit).",
      },
    ],
    interactiveTips: [
      "Ensure all missing transitions are routed to a trap state before inverting accept states.",
    ],
    commonMistakes: [
      "Inverting states on an incomplete DFA (this rejects instead of complementing).",
    ],
    practiceChallengeId: "no-three-consecutive-ones",
  },
  {
    id: "nfa-and-epsilon",
    title: "Non-Deterministic Automata & ε-Moves",
    category: "Track 2: Non-Determinism",
    readTime: "8 min read",
    videoUrl: "https://www.youtube-nocookie.com/embed/ehy0jGIYRtE",
    videoTitle: "NFA with Epsilon Transitions & Equivalence",
    videoDuration: "15:20",
    summary: "Explore branching computation trees, non-deterministic state guessing, and spontaneous ε-transitions.",
    content: [
      {
        heading: "What Makes an NFA Non-Deterministic?",
        body: "An NFA allows a state to have zero, one, or multiple outgoing transitions on the same symbol, plus spontaneous transitions labeled ε without consuming input.",
        mathFormula: "\\delta_{NFA}: Q \\times (\\Sigma \\cup \\{\\varepsilon\\}) \\to 2^Q",
        keyTakeaway: "An NFA accepts a string if AT LEAST ONE parallel computational branch ends in an accept state.",
      },
    ],
    interactiveTips: [
      "Use ε-transitions to modularly stitch smaller sub-automata together.",
    ],
    commonMistakes: [
      "Assuming NFAs have greater expressive power than DFAs (they recognize the exact same regular languages).",
    ],
    practiceChallengeId: "sub-101",
  },
  {
    id: "subset-construction",
    title: "Subset (Powerset) Construction Algorithm",
    category: "Track 2: Non-Determinism",
    readTime: "10 min read",
    videoUrl: "https://www.youtube-nocookie.com/embed/taClnxU-nao",
    videoTitle: "NFA to DFA Conversion (Subset Construction Method)",
    videoDuration: "18:10",
    summary: "Step-by-step masterclass on converting any NFA into an equivalent DFA by tracking parallel subsets of active states.",
    content: [
      {
        heading: "Why Subset Construction Works",
        body: "Because an NFA can be in multiple states simultaneously, a single state in the equivalent DFA corresponds to a subset of NFA states S ⊆ Q_NFA.",
        mathFormula: "Q_{DFA} \\subseteq \\mathcal{P}(Q_{NFA}), \\quad \\delta_{DFA}(S, a) = \\mathcal{E}\\left( \\bigcup_{q \\in S} \\delta_{NFA}(q, a) \\right)",
        keyTakeaway: "If an NFA has n states, the equivalent DFA will have at most 2ⁿ states.",
      },
    ],
    interactiveTips: [
      "Only generate reachable subsets (Lazy Evaluation) to prevent state explosion.",
    ],
    commonMistakes: [
      "Forgetting to compute ε-closures after moving across transition symbols.",
    ],
    practiceChallengeId: "bin-div-3",
  },
  {
    id: "thompson-construction",
    title: "Thompson's Construction (Regex → NFA)",
    category: "Track 2: Non-Determinism",
    readTime: "9 min read",
    videoUrl: "https://www.youtube-nocookie.com/embed/YGjEoND31YU",
    videoTitle: "Regular Expressions to NFA Conversion (Thompson's Algorithm)",
    videoDuration: "16:00",
    summary: "Compile regular expressions (Union, Concatenation, Kleene Star) into equivalent ε-NFAs.",
    content: [
      {
        heading: "Structural Inductive Rules",
        body: "Thompson's algorithm recursively builds an NFA with a single start and single accept state for base symbols, union (r₁ | r₂), concatenation (r₁r₂), and star (r*).",
        mathFormula: "L(R) = L(N(R))",
        keyTakeaway: "Thompson's construction generates an NFA with at most 2|R| states in linear O(|R|) time.",
      },
    ],
    interactiveTips: [
      "Add ε-transitions from the start state to bypass the loop for zero occurrences in Kleene Star.",
    ],
    commonMistakes: [
      "Reusing the accept state directly without adding ε-bridges in union blocks.",
    ],
    practiceChallengeId: "starts-and-ends-with-same-symbol",
  },
  {
    id: "divisibility-modulo-machines",
    title: "Modulo Counters & Binary Divisibility",
    category: "Track 3: Patterns & Arithmetic",
    readTime: "8 min read",
    videoUrl: "https://www.youtube-nocookie.com/embed/l20xHDJPHBM",
    videoTitle: "DFA for Binary Numbers Divisible by 3, 5, and N",
    videoDuration: "13:20",
    summary: "Design state machines that compute modular arithmetic on streaming binary and ternary inputs (divisible by 2, 3, 5, 8).",
    content: [
      {
        heading: "The Horner's Rule Modulo Transition Function",
        body: "When a new binary bit b arrives at the least significant position, the current integer value n is updated to: n' = 2·n + b. Taking modulo k on both sides gives the state transition formula:",
        mathFormula: "\\delta(q_r, b) = q_{(2r + b) \\bmod k}",
        keyTakeaway: "A binary machine checking divisibility by k requires exactly k states {q₀, q₁, ..., qₖ₋₁}.",
      },
    ],
    interactiveTips: [
      "For general k (like 3 or 5), use the (2r + b) mod k transition table with q0 as start and accept state.",
    ],
    commonMistakes: [
      "Assuming higher-order bits reset the counter (binary inputs arrive MSB-first).",
    ],
    practiceChallengeId: "bin-div-5",
  },
  {
    id: "substring-matching-dfa",
    title: "Substring & Suffix/Prefix Matchers",
    category: "Track 3: Patterns & Arithmetic",
    readTime: "7 min read",
    videoUrl: "https://www.youtube-nocookie.com/embed/JF48ymcpEzY",
    videoTitle: "DFA for Substrings, Prefixes, and Suffixes",
    videoDuration: "15:40",
    summary: "Construct linear-chain and fallback automata that recognize specific substrings (e.g. '101', '0101', 'abb').",
    content: [
      {
        heading: "Prefix-Memory State Design",
        body: "Each state in a pattern-matching DFA represents the longest valid prefix of the target pattern matched so far. On mismatch, transition back to the longest proper prefix that is also a suffix of the text seen.",
        keyTakeaway: "Once the entire pattern is matched: for substring DFAs, loop in the final state; for suffix DFAs, fallback on mismatch.",
      },
    ],
    interactiveTips: [
      "For 'contains substring w', the accept state has self-loops on all alphabet symbols.",
    ],
    commonMistakes: [
      "Resetting directly to q0 on every mismatch instead of preserving overlapping prefixes.",
    ],
    practiceChallengeId: "sub-0101",
  },
  {
    id: "parity-counting-grids",
    title: "Parity Grids & Multi-Variable Counters",
    category: "Track 3: Patterns & Arithmetic",
    readTime: "8 min read",
    videoUrl: "https://www.youtube-nocookie.com/embed/rV5O1d_Wvj4",
    videoTitle: "DFA for Even Number of 0s and Even Number of 1s",
    videoDuration: "11:50",
    summary: "Master 2D cross-product state constructions to track multiple independent counting and parity properties simultaneously.",
    content: [
      {
        heading: "The Cross-Product Construction Q₁ × Q₂",
        body: "To track two properties simultaneously (such as parity of 0s and parity of 1s), form the Cartesian product of the state sets:",
        mathFormula: "Q = Q_1 \\times Q_2 = \\{ (E, E), (E, O), (O, E), (O, O) \\}",
        keyTakeaway: "Reading symbol '0' transitions along the first dimension; reading '1' transitions along the second dimension.",
      },
    ],
    interactiveTips: [
      "Start state is (Even, Even) representing 0 zeros and 0 ones.",
    ],
    commonMistakes: [
      "Trying to count unbounded integers with finite states (DFAs can only track modular congruences).",
    ],
    practiceChallengeId: "even-zeros-odd-ones",
  },
  {
    id: "forbidden-patterns-dead-states",
    title: "Pattern Avoidance & Trap/Dead States",
    category: "Track 3: Patterns & Arithmetic",
    readTime: "7 min read",
    videoUrl: "https://www.youtube-nocookie.com/embed/-MCb0dIHidk",
    videoTitle: "DFA for Not Containing Certain Substrings & Dead States",
    videoDuration: "12:10",
    summary: "Learn how to build complement machines and permanent trap/dead states to reject forbidden sequences (e.g. No '00', No '111', No 'aba').",
    content: [
      {
        heading: "The Role of Trap / Dead States",
        body: "A trap state is a non-accepting state with permanent self-loops on all alphabet symbols. Once an automaton enters a trap state, the string can never be accepted.",
        keyTakeaway: "To construct 'Does NOT contain pattern P', construct the DFA for 'Contains P' and invert all accept states.",
      },
    ],
    interactiveTips: [
      "Every state except the dead state is an accepting state in complement avoidance DFAs.",
    ],
    commonMistakes: [
      "Forgetting to make the initial start state q0 an accept state when the empty string is valid.",
    ],
    practiceChallengeId: "no-three-consecutive-ones",
  },
  {
    id: "multi-char-alphabets-lexers",
    title: "Lexical Analyzers & Token Recognizers",
    category: "Track 4: Compiler Lexing",
    readTime: "9 min read",
    videoUrl: "https://www.youtube-nocookie.com/embed/4nx8LEGy9kI",
    videoTitle: "Lexical Analysis - DFA for Identifiers, Integers, and Floats",
    videoDuration: "16:00",
    summary: "Build realistic compiler lexer state machines for identifiers, integer constants, and floating-point numeric tokens.",
    content: [
      {
        heading: "Token Recognition via Finite State Automata",
        body: "Compilers use DFAs to scan character streams into discrete tokens (Identifiers, Keywords, Numbers, Operators).",
        mathFormula: "\\text{Identifier} = [a\\text{-}z]([a\\text{-}z] \\mid [0\\text{-}9])^*",
        keyTakeaway: "DFAs provide O(N) linear-time token scanning with guaranteed zero backtracking.",
      },
    ],
    interactiveTips: [
      "Enforce mandatory boundary characters.",
    ],
    commonMistakes: [
      "Allowing empty fractions like '3.' as valid floating-point literals.",
    ],
    practiceChallengeId: "floating-point-literal",
  },
  {
    id: "ternary-base4-machines",
    title: "Multi-Base Alphabets (Ternary & Base-4)",
    category: "Track 4: Compiler Lexing",
    readTime: "8 min read",
    videoUrl: "https://www.youtube-nocookie.com/embed/40i4PKpM0cI",
    videoTitle: "DFA for Base-3 and Base-4 Arithmetic Machines",
    videoDuration: "12:30",
    summary: "Construct state machines for non-binary alphabets Σ = {0, 1, 2} and Σ = {0, 1, 2, 3}.",
    content: [
      {
        heading: "Base-B Horner Transitions",
        body: "For general base B and divisor k, reading digit d updates state r to (B·r + d) mod k.",
        mathFormula: "\\delta(q_r, d) = q_{(B\\cdot r + d) \\bmod k}",
        keyTakeaway: "State transition formulas scale naturally across arbitrary alphabet sizes.",
      },
    ],
    interactiveTips: [
      "For ternary (B=3) mod 4, compute (3r + d) mod 4 for each digit d ∈ {0, 1, 2}.",
    ],
    commonMistakes: [
      "Using binary base multiplier 2 instead of base B.",
    ],
    practiceChallengeId: "ternary-div-4",
  },
  {
    id: "run-length-bounded-machines",
    title: "Run-Length Limits & Block Constraints",
    category: "Track 4: Compiler Lexing",
    readTime: "7 min read",
    videoUrl: "https://www.youtube-nocookie.com/embed/4VZjmE3qnsk",
    videoTitle: "DFA for Bounded Run Lengths and Consecutive Constraints",
    videoDuration: "10:45",
    summary: "Design automata where consecutive runs of characters are bounded (e.g. every block of 0s has even length).",
    content: [
      {
        heading: "Tracking Parity of Runs",
        body: "Use dedicated states to represent whether the current run of consecutive symbols has even or odd length, transitioning to trap state upon premature termination of odd runs.",
        keyTakeaway: "Accept states must only match when all completed and open runs satisfy the length constraint.",
      },
    ],
    interactiveTips: [
      "Separate 'inside an active run' from 'between runs'.",
    ],
    commonMistakes: [
      "Accepting strings ending with an unfinished odd-length block.",
    ],
    practiceChallengeId: "even-length-zero-blocks",
  },
  {
    id: "pumping-lemma",
    title: "The Pumping Lemma for Regular Languages",
    category: "Track 5: Computational Limits",
    readTime: "11 min read",
    videoUrl: "https://www.youtube-nocookie.com/embed/dikEDuepOtI",
    videoTitle: "Pumping Lemma for Regular Languages Explained with Examples",
    videoDuration: "16:30",
    summary: "Master the mathematical proof technique used to prove that a language is NOT regular by finding an unpumpable string.",
    content: [
      {
        heading: "The Pumping Lemma Statement",
        body: "If a language L is regular, there exists a pumping length p >= 1 such that every string s ∈ L with |s| >= p can be split into three parts s = xyz satisfying: (1) |y| > 0, (2) |xy| <= p, and (3) for all i >= 0, xyⁱz ∈ L.",
        mathFormula: "\\forall s \\in L, |s| \\ge p \\implies s = xyz, \\text{ where } |y| \\ge 1, |xy| \\le p, \\text{ and } \\forall i \\ge 0, xy^i z \\in L",
        keyTakeaway: "Pigeonhole Principle: In a DFA with p states, any string of length >= p must visit at least one state twice.",
      },
    ],
    interactiveTips: [
      "Show the contradiction holds for ANY valid decomposition chosen by the adversary.",
    ],
    commonMistakes: [
      "Using the Pumping Lemma to prove a language IS regular (it is only a negative test to prove non-regularity).",
    ],
    practiceChallengeId: "equal-zeros-and-ones-length-le-4",
  },
  {
    id: "myhill-nerode-theorem",
    title: "The Myhill-Nerode Theorem & Equivalence Classes",
    category: "Track 5: Computational Limits",
    readTime: "10 min read",
    videoUrl: "https://www.youtube-nocookie.com/embed/0XaGAkY09Wc",
    videoTitle: "Myhill-Nerode Theorem & Minimal State Equivalence",
    videoDuration: "15:10",
    summary: "Explore distinguishing extensions, equivalence relations R_L, and how index(R_L) defines the unique minimal DFA state count.",
    content: [
      {
        heading: "Distinguishing Extensions",
        body: "Two strings x and y are distinguishable with respect to language L if there exists a string z such that exactly one of xz or yz belongs to L.",
        mathFormula: "x \\sim_L y \\iff (\\forall z \\in \\Sigma^*, xz \\in L \\iff yz \\in L)",
        keyTakeaway: "A language L is regular if and only if the number of equivalence classes of ~L is finite. The minimum number of states in any DFA accepting L is exactly the number of equivalence classes.",
      },
    ],
    interactiveTips: [
      "Identify pairwise distinguishable prefixes to prove a lower bound on state count.",
    ],
    commonMistakes: [
      "Confusing language equivalence with state equivalence in non-minimal machines.",
    ],
    practiceChallengeId: "bin-div-4",
  },
  {
    id: "moore-mealy-machines",
    title: "Moore & Mealy Machines (FSM with Output)",
    category: "Track 5: Computational Limits",
    readTime: "8 min read",
    videoUrl: "https://www.youtube-nocookie.com/embed/playlist?list=PLBlnK6fEyqRhduNC2PI4FPJqAhwoNTe1d",
    videoTitle: "Moore and Mealy Machine Conversion and Differences",
    videoDuration: "14:15",
    summary: "Explore finite state machines that generate output symbols: state-associated outputs (Moore) vs transition-associated outputs (Mealy).",
    content: [
      {
        heading: "Moore vs Mealy Architecture",
        body: "In a Moore Machine, output depends solely on current state (λ: Q → Δ). In a Mealy Machine, output depends on both current state and input symbol (λ: Q × Σ → Δ).",
        mathFormula: "\\text{Moore: } \\lambda(q) \\in \\Delta, \\quad \\text{Mealy: } \\lambda(q, a) \\in \\Delta",
        keyTakeaway: "For an input of length n, a Moore machine produces output of length n + 1, while a Mealy machine produces output of length n.",
      },
    ],
    interactiveTips: [
      "Mealy machines typically require fewer states than equivalent Moore machines.",
    ],
    commonMistakes: [
      "Confusing the output length: Moore outputs one extra initial symbol compared to Mealy.",
    ],
    practiceChallengeId: "bin-div-2",
  },
  {
    id: "chomsky-hierarchy",
    title: "The Chomsky Hierarchy & Computational Limits",
    category: "Track 5: Computational Limits",
    readTime: "10 min read",
    videoUrl: "https://www.youtube-nocookie.com/embed/9idnQ2C6HfA",
    videoTitle: "The Chomsky Hierarchy - Regular, Context-Free, Context-Sensitive, Turing",
    videoDuration: "17:50",
    summary: "Discover the four levels of formal grammars: Regular (DFA/NFA), Context-Free (PDAs), Context-Sensitive (LBA), and Recursively Enumerable (Turing Machines).",
    content: [
      {
        heading: "The 4 Classes of Languages & Automata",
        body: "Type 3: Regular Languages\nType 2: Context-Free Languages\nType 1: Context-Sensitive Languages\nType 0: Recursively Enumerable Languages",
        mathFormula: "\\text{Type 3 } \\subset \\text{ Type 2 } \\subset \\text{ Type 1 } \\subset \\text{ Type 0}",
        keyTakeaway: "Finite automata have no memory beyond current state. Adding a Stack yields PDAs (Context-Free). Adding an infinite Tape yields Turing Machines.",
      },
    ],
    interactiveTips: [
      "When a language requires unbounded counting (like 0ⁿ1ⁿ), it cannot be recognized by a Finite Automaton.",
    ],
    commonMistakes: [
      "Assuming finite automata can store arbitrary unbounded counters.",
    ],
    practiceChallengeId: "abc-alphabetical-order",
  },
];
