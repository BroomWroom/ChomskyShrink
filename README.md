# ChomskyShrink

> **A precision finite state automata workbench engineered for determinization, Hopcroft state minimization, formal language theory, and competitive automata practice.**

[![GitHub Repo](https://img.shields.io/badge/GitHub-BroomWroom%2FChomskyShrink-181717?style=flat&logo=github)](https://github.com/BroomWroom/ChomskyShrink)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-61dafb.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-6.1-646cff.svg)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38bdf8.svg)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 📌 Overview

**ChomskyShrink** is an interactive, browser-based theoretical computer science suite designed for university students, educators, and software engineers. It unifies **visual state machine design**, **Rabin-Scott subset determinization**, **Hopcroft partition minimization**, **Thompson regex compilation**, **interactive video lessons**, and **automated challenge grading** into a single client-side application.

---

##  Key Features

### 1. Finite State Automata Studio
- **Interactive Visual Canvas**: Drag-and-drop state creation, configurable initial states, double-ring accept states, and multi-symbol transitions powered by [Cytoscape.js](https://js.cytoscape.org/).
- **Multi-Modal Automata Construction**:
  - **Drag-and-Drop Visual Palette**: Drag normal states, start anchors ($q_0$), and accept nodes ($q^*$) directly onto the canvas.
  - **Direct Point-and-Click Connector**: Click a source node and target node to link transition arrows with arbitrary symbols or $\varepsilon$.
  - **Thompson Regular Expression Parser**: Converts standard regular expressions (e.g. `(a|b)*abb`) directly into equivalent non-deterministic finite automata.
  - **Declarative Text Notation**: Input automata with simple arrow notation (e.g. `->q0`, `q0 --a--> q1`, `q1*`).
- **Bidirectional Transition Matrix ($\delta$)**: Real-time transition matrix table with live dropdown repointing, inline state renaming, dynamic row/column additions, and $\varepsilon$-move toggling.
- **Topological Rank Layout**: Clean horizontal auto-layout with virtual start pointers and curved loop arcs.
- **High-Resolution PNG Export**: Export publication-quality state diagrams with theme-aware canvas backgrounds.

### 2. Theoretical Conversion & Minimization Engines
- **Rabin-Scott Subset Construction ($\text{NFA} \to \text{DFA}$)**:
  - Complete recursive $\varepsilon$-closure computation ($\text{ECLOSE}(q)$) across arbitrary branching depths.
  - Generates power-state subset lookup tables ($\mathcal{P}(Q)$) with formal step-by-step mapping.
- **Hopcroft & Moore Partition Refinement (DFA Minimization)**:
  - Start-state reachability analysis and dead state pruning.
  - Multi-class partition refinement: iteratively partitions equivalence classes ($P_i \to P_{i+1}$) until fixed-point equilibrium is reached.
  - Produces the unique minimal canonical DFA guaranteed by the **Myhill-Nerode Theorem**.
- **Interactive Conversion Walkthrough Player**: Step-by-step scrubber (Play, Pause, Step Forward/Back, Timeline Slider) highlighting active nodes, partition splits, and theoretical rationales.

### 3. Live String Execution Simulator
- **Dual Engine Simulation**: Simulates deterministic DFAs and branch-tracking non-deterministic NFAs.
- **Animated Self-Loop Pulses**: Prominent bezier arc expansion, active looping badges, and ripple animations when executing self-loops ($q \xrightarrow{a} q$).
- **Step-by-Step Timeline Scrubber**: Trace string execution character-by-character with detailed transition logs and accept/reject verdicts.

### 4. 5 Structured Curriculum Tracks & Video Labs
- **Track 01**: *Deterministic Automata & Formal Foundations* (5-Tuple definitions, DFA construction, complement machines).
- **Track 02**: *Non-Determinism & Powerset Equivalence* (NFAs, $\varepsilon$-moves, powerset subset construction, Thompson algorithm).
- **Track 03**: *Pattern Recognizers & Modular Arithmetic* (Horner's rule modulo counters, substring matchers, parity grids).
- **Track 04**: *Compiler Lexing & Multi-Character Alphabets* (Tokenizers, floating-point literals, multi-symbol alphabets).
- **Track 05**: *Computational Limits & Grammar Hierarchies* (Pumping Lemma proofs, Myhill-Nerode equivalence, Moore/Mealy machines, Chomsky hierarchy).
- **Curated Video Embeds**: High-definition video lectures integrated from *Neso Academy*, *Gate Smashers*, *Knowledge Gate*, and *Easy Theory*.

### 5. Practice Arena & Automated Test-Suite Grader
- **5 Categorized Practice Tracks**: 52 rigorous theoretical computer science challenges ranging from beginner parity checks to complex lexical parsers.
- **Automated Multi-Case Test Suite**: Evaluates submissions against 10–20 comprehensive edge-case strings with live visual execution traces.
- **State Count Bound Grader**: Compares your automaton's state count against theoretical minimal bounds.
- **Embedded Challenge Workbench**: Design, edit, and test state machines directly within challenge workbenches.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | [React 18](https://react.dev/) + [TypeScript 5.7](https://www.typescriptlang.org/) |
| **Build Tool** | [Vite 6](https://vitejs.dev/) |
| **Styling** | [Tailwind CSS 3.4](https://tailwindcss.com/) |
| **Graph Engine** | [Cytoscape.js 3.30](https://js.cytoscape.org/) |
| **Animation Engine** | [Framer Motion 11](https://www.framer.com/motion/) |
| **Iconography** | [Lucide React](https://lucide.dev/) |
| **Celebrations** | [Canvas Confetti](https://www.npmjs.com/package/canvas-confetti) |

---

## 📂 Project Architecture

```
ChomskyShrink/
├── public/                       # Static public assets & favicon
├── src/
│   ├── components/               # Application UI components
│   │   ├── ui/                   # Shared UI primitives
│   │   │   ├── ChomskyLogo.tsx   # Dynamic SVG brand identity logo
│   │   │   ├── dock.tsx          # Hardware-accelerated 120fps macOS dock
│   │   │   └── prisma-hero.tsx   # Hero visualizer & animated text banner
│   │   ├── ConversionPlayer.tsx  # Step-by-step NFA→DFA / Minimization player
│   │   ├── ConverterApp.tsx      # Dual-mode Cytoscape studio & transition matrix
│   │   ├── GraderAnalytics.tsx   # Automated test suite & equivalence analytics
│   │   ├── LandingPage.tsx       # Editorial landing page & live trace visualizer
│   │   ├── LessonsHub.tsx        # 5-track video lab & curriculum viewer
│   │   ├── Navbar.tsx            # Navigation header & theme switcher
│   │   ├── NotFoundPage.tsx      # 404 dead-state route fallback
│   │   ├── PracticeGym.tsx       # 52-challenge practice arena & auto-grader
│   │   └── TheoreticalSummary.tsx# 5-tuple breakdown, ε-closure & Hopcroft logs
│   ├── core/
│   │   └── automaton.ts          # Core automata engine (Subset, Hopcroft, BFS, Thompson)
│   ├── data/
│   │   ├── challenges.ts         # 52 CS challenge test specifications
│   │   └── lessons.ts            # 16 curriculum modules with lecture references
│   ├── lib/
│   │   └── utils.ts              # Tailwind class merging & utility helpers
│   ├── types/
│   │   └── automaton.ts          # TypeScript interfaces, 5-tuple definitions & types
│   ├── App.tsx                   # Root router, theme provider & state container
│   ├── index.css                 # Tailwind directives, custom fonts & theme tokens
│   └── main.tsx                  # Vite React application entry point
├── .gitignore                    # Git exclusions
├── LICENSE                       # MIT Open Source License
├── package.json                  # NPM dependencies & build scripts
├── tsconfig.json                 # TypeScript strict compiler options
└── vite.config.ts                # Vite bundler configuration
```

---

## 📚 Theoretical Foundations

ChomskyShrink implements rigorous mathematical foundations of theoretical computer science:

1. **Formal 5-Tuple Definition**:
   $$M = (Q, \Sigma, \delta, q_0, F)$$
   - $Q$: Finite set of internal states
   - $\Sigma$: Finite alphabet of input symbols
   - $\delta$: Transition function ($Q \times \Sigma \to Q$ for DFA, $Q \times (\Sigma \cup \{\varepsilon\}) \to \mathcal{P}(Q)$ for NFA)
   - $q_0 \in Q$: Start state anchor
   - $F \subseteq Q$: Set of accept/final states

2. **Rabin-Scott Powerset Determinization (1959)**:
   - For every NFA $N = (Q_N, \Sigma, \delta_N, q_{0N}, F_N)$, there exists an equivalent deterministic finite automaton $D = (Q_D, \Sigma, \delta_D, q_{0D}, F_D)$ where $Q_D \subseteq \mathcal{P}(Q_N)$.

3. **Hopcroft Partition Refinement (1971)**:
   - Divides state space $Q$ into initial partition $P = \{F, Q \setminus F\}$. Iteratively refines partitions using inverse transition preimage splitters $\delta^{-1}(B, a)$ in $O(|\Sigma| \cdot |Q| \log |Q|)$ time.

4. **Myhill-Nerode Theorem (1958)**:
   - A language $L$ is regular if and only if the number of equivalence classes of its prefix relation $R_L$ is finite. The minimum DFA is unique up to state isomorphism.

5. **Thompson's Inductive Construction (1968)**:
   - Recursively compiles regular expressions (base symbols, concatenation, alternation, and Kleene star) into equivalent $\varepsilon$-NFAs with single start and accept states.

---

## Credits & Attributions


### Video Lecture Attributions
Educational video embeds across the 5 curriculum tracks are sourced with deep gratitude from premier computer science educators:
- **[Neso Academy](https://www.youtube.com/@nesoacademy)**
- **[Gate Smashers](https://www.youtube.com/@GateSmashers)**
- **[Knowledge Gate](https://www.youtube.com/@KnowledgeGate_ai)**
- **[Easy Theory](https://www.youtube.com/@EasyTheory)**

---

## 📄 License

This project is open-source software licensed under the [MIT License](LICENSE).
Feel free to use, modify, and distribute it for academic and educational purposes.
