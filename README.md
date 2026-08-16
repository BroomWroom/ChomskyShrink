<<<<<<< HEAD
#  ChomskyShrink

> **A precision finite state automata workbench engineered for determinization, state minimization, formal language theory, and competitive automata practice.**


=======
# ChomskyShrink

> **A precision finite state automata workbench engineered for determinization, state minimization, formal language theory, and competitive automata practice.**

>>>>>>> d35f9398766d6efead87f5c6d27b3c0b298f33e5
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-61dafb.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-6.1-646cff.svg)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38bdf8.svg)](https://tailwindcss.com/)
<<<<<<< HEAD
=======

---

**ChomskyShrink** is an interactive, browser-based theoretical computer science suite designed for university students, educators, and software engineers. It unifies **visual state machine construction**, **Rabin-Scott subset determinization**, **Hopcroft partition minimization**, **Thompson regex compilation**, and **automated challenge grading** in a single client-side application.

---

## Key Features

### 1.Finite State Automata Studio
- **Interactive Visual Canvas**: Drag-and-drop state creation, customizable initial states, double-ring accept states, and multi-symbol transitions.
- **Multi-Modal Input**:
  - Drag-and-drop visual palette
  - Direct point-and-click state connector
  - Thompson regular expression parser (e.g. `(a|b)*abb`)
  - Simple declarative text notation (e.g. `->q0`, `q0 --a--> q1`, `q1*`)
- **Automated Rank Layout**: Horizontal topological state layout with incoming virtual start pointers and curved loop arcs.
- **Export & Share**: High-resolution PNG diagram export with transparent or canvas background.

### 2.Theoretical Conversion & Minimization Engines
- **Rabin-Scott Subset Construction ($\text{NFA} \to \text{DFA}$)**:
  - Complete recursive $\epsilon$-closure computation across arbitrary branching depths.
  - Generates power-state subset lookup tables ($\mathcal{P}(Q)$).
- **Hopcroft & Moore Partition Refinement (DFA Minimization)**:
  - Unreachable state pruning from the start anchor.
  - Multi-class partition refinement: separates accept and non-accept partitions iteratively until fixed-point equilibrium is reached.
  - Produces the unique minimal canonical DFA guaranteed by the **Myhill-Nerode Theorem**.
- **Interactive Conversion Player**: Step-by-step interactive scrubber (Play, Pause, Step Forward/Back, Speed Toggle) showing intermediate graph states and split rationales.

### 3. String Execution Simulator with Self-Loop Animations
- **Universal Dual Simulation**: Accurately simulates deterministic DFAs and non-deterministic NFAs (tracking parallel computation branches).
- **Self-Loop Execution Animations**: Prominent bezier arc expansion, ember glow, and node ripple bounce animations when processing self-loops ($q \xrightarrow{a} q$).
- **Live Stream Ribbon**: Visual step-by-step character progression with pass/fail verdict breakdown.

### 4. 5 Structured Curriculum Tracks & Academic Reference Materials
- **Track 01**: *Deterministic Automata & Formal Foundations* (5-Tuple, Minimization, Complement Machines)
- **Track 02**: *Non-Determinism & Powerset Equivalence* (NFAs, $\epsilon$-Moves, Subset Construction, Thompson Algorithm)
- **Track 03**: *Pattern Recognizers & Modular Arithmetic* (Horner's Modulo Counters, Substring Matchers, Parity Grids)
- **Track 04**: *Compiler Lexing & Multi-Character Alphabets* (Tokenizers, Floating-Point Literals, Base-3/4 Alphabets)
- **Track 05**: *Computational Limits & Grammar Hierarchies* (Pumping Lemma Proofs, Myhill-Nerode Equivalence, Moore/Mealy Machines, Chomsky Hierarchy)
- **Academic Citations**: Includes direct references to *Hopcroft, Motwani & Ullman (2006)*, *Michael Sipser (MIT, 2012)*, and *Rabin & Scott (1959)*.

### 5. Practice Arena & Automated Test-Suite Grader
- **5 Categorized Practice Tracks** containing 52 rigorous automata design challenges.
- **Multi-Case Test Suite Runner**: Evaluates submissions against 10–20 comprehensive edge-case strings.
- **State Efficiency Grader**: Compares your automaton's state count against the theoretical minimal state bound.
- **Interactive Workbench Solving Mode**: Edit, test, and verify state machines directly within challenge workbenches.

---

## Tech Stack

- **Framework**: [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite 6](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Graph Visualization**: [Cytoscape.js](https://js.cytoscape.org/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Confetti**: [Canvas Confetti](https://www.npmjs.com/package/canvas-confetti)
>>>>>>> d35f9398766d6efead87f5c6d27b3c0b298f33e5

---

## Overview

**ChomskyShrink** is an interactive, browser-based theoretical computer science suite designed for university students, educators, and software engineers. It unifies **visual state machine construction**, **Rabin-Scott subset determinization**, **Hopcroft partition minimization**, **Thompson regex compilation**, and **automated challenge grading** in a single client-side application.

---

<<<<<<< HEAD
## Key Features

### 1. Finite State Automata Studio
- **Interactive Visual Canvas**: Drag-and-drop state creation, customizable initial states, double-ring accept states, and multi-symbol transitions powered by [Cytoscape.js](https://js.cytoscape.org/).
- **Multi-Modal Input**:
  - Drag-and-drop visual palette
  - Direct point-and-click state connector
  - Thompson regular expression parser (e.g. `(a|b)*abb`)
  - Simple declarative text notation (e.g. `->q0`, `q0 --a--> q1`, `q1*`)
- **Automated Rank Layout**: Horizontal topological state layout with incoming virtual start pointers and curved loop arcs.
- **Export & Share**: High-resolution PNG diagram export with transparent or canvas background.

### 2. Theoretical Conversion & Minimization Engines
- **Rabin-Scott Subset Construction ($\text{NFA} \to \text{DFA}$)**:
  - Complete recursive $\epsilon$-closure computation across arbitrary branching depths.
  - Generates power-state subset lookup tables ($\mathcal{P}(Q)$).
- **Hopcroft & Moore Partition Refinement (DFA Minimization)**:
  - Unreachable state pruning from the start anchor.
  - Multi-class partition refinement: separates accept and non-accept partitions iteratively until fixed-point equilibrium is reached.
  - Produces the unique minimal canonical DFA guaranteed by the **Myhill-Nerode Theorem**.
- **Interactive Conversion Player**: Step-by-step interactive scrubber (Play, Pause, Step Forward/Back, Speed Toggle) showing intermediate graph states and split rationales.

### 3. String Execution Simulator with Self-Loop Animations
- **Universal Dual Simulation**: Accurately simulates deterministic DFAs and non-deterministic NFAs (tracking parallel computation branches).
- **Self-Loop Execution Animations**: Prominent bezier arc expansion, ember glow, and node ripple bounce animations when processing self-loops ($q \xrightarrow{a} q$).
- **Live Stream Ribbon**: Visual step-by-step character progression with pass/fail verdict breakdown.

### 4. 5 Structured Curriculum Tracks & Academic Reference Materials
- **Track 01**: *Deterministic Automata & Formal Foundations* (5-Tuple, Minimization, Complement Machines)
- **Track 02**: *Non-Determinism & Powerset Equivalence* (NFAs, $\epsilon$-Moves, Subset Construction, Thompson Algorithm)
- **Track 03**: *Pattern Recognizers & Modular Arithmetic* (Horner's Modulo Counters, Substring Matchers, Parity Grids)
- **Track 04**: *Compiler Lexing & Multi-Character Alphabets* (Tokenizers, Floating-Point Literals, Base-3/4 Alphabets)
- **Track 05**: *Computational Limits & Grammar Hierarchies* (Pumping Lemma Proofs, Myhill-Nerode Equivalence, Moore/Mealy Machines, Chomsky Hierarchy)
- **Academic Citations**: Includes direct references to *Hopcroft, Motwani & Ullman (2006)*, *Michael Sipser (MIT, 2012)*, and *Rabin & Scott (1959)*.

### 5. Practice Arena & Automated Test-Suite Grader
- **5 Categorized Practice Tracks** containing 52 rigorous automata design challenges.
- **Multi-Case Test Suite Runner**: Evaluates submissions against 10–20 comprehensive edge-case strings.
- **State Efficiency Grader**: Compares your automaton's state count against the theoretical minimal state bound.
- **Interactive Workbench Solving Mode**: Edit, test, and verify state machines directly within challenge workbenches.

---

## Tech Stack

- **Framework**: [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite 6](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Graph Visualization**: [Cytoscape.js](https://js.cytoscape.org/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Confetti**: [Canvas Confetti](https://www.npmjs.com/package/canvas-confetti)

---

## 📂 Project Architecture

```
ChomskyShrink/
├── public/                  # Static assets & favicon
├── src/
│   ├── components/          # React UI components
│   │   ├── ui/              # Atom components (Logo, Dock, etc.)
│   │   ├── ConverterApp.tsx # Visual DFA/NFA studio & graph canvas
│   │   ├── ConversionPlayer.tsx # Step-by-step conversion player
│   │   ├── LandingPage.tsx  # Editorial landing & storytelling view
│   │   ├── LessonsHub.tsx   # 5-track curriculum & video lab viewer
│   │   ├── Navbar.tsx       # Top brand header & view navigation
│   │   ├── NotFoundPage.tsx # 404 dead-state view
│   │   ├── PracticeGym.tsx  # Challenge arena & auto-grader
│   │   └── TheoreticalSummary.tsx # Formal definitions & proof breakdowns
│   ├── core/
│   │   └── automaton.ts     # Core mathematical algorithms (Subset, Hopcroft, Simulation)
│   ├── data/
│   │   ├── challenges.ts    # 52 CS challenge test specifications
│   │   └── lessons.ts       # 16 curriculum modules across 5 tracks
│   ├── types/
│   │   └── automaton.ts     # TypeScript interfaces & state definitions
│   ├── App.tsx              # Root application router & theme state
│   ├── main.tsx             # Application bootstrap entry point
│   └── index.css            # Tailwind directives & theme tokens
├── .gitignore               # Git exclusions
├── LICENSE                  # MIT License
├── package.json             # Project dependencies & scripts
├── tsconfig.json            # TypeScript configuration
└── vite.config.ts           # Vite build configuration
```

---
=======
## 📂 Project Architecture

```
ChomskyShrink/
├── public/                  # Static assets & favicon
├── src/
│   ├── components/          # React UI components
│   │   ├── ui/              # Atom components (Logo, Dock, etc.)
│   │   ├── ConverterApp.tsx # Visual DFA/NFA studio & graph canvas
│   │   ├── ConversionPlayer.tsx # Step-by-step conversion player
│   │   ├── LandingPage.tsx  # Editorial landing & storytelling view
│   │   ├── LessonsHub.tsx   # 5-track curriculum & video lab viewer
│   │   ├── Navbar.tsx       # Top brand header & view navigation
│   │   ├── NotFoundPage.tsx # 404 dead-state view
│   │   ├── PracticeGym.tsx  # Challenge arena & auto-grader
│   │   └── TheoreticalSummary.tsx # Formal definitions & proof breakdowns
│   ├── core/
│   │   └── automaton.ts     # Core mathematical algorithms (Subset, Hopcroft, Simulation)
│   ├── data/
│   │   ├── challenges.ts    # 52 CS challenge test specifications
│   │   └── lessons.ts       # 16 curriculum modules across 5 tracks
│   ├── types/
│   │   └── automaton.ts     # TypeScript interfaces & state definitions
│   ├── App.tsx              # Root application router & theme state
│   ├── main.tsx             # Application bootstrap entry point
│   └── index.css            # Tailwind directives & theme tokens
├── .gitignore               # Git exclusions
├── LICENSE                  # MIT License
├── package.json             # Project dependencies & scripts
├── tsconfig.json            # TypeScript configuration
└── vite.config.ts           # Vite build configuration
```

---


>>>>>>> d35f9398766d6efead87f5c6d27b3c0b298f33e5

## Academic & Theoretical Attribution

ChomskyShrink is built upon foundational theorems in theoretical computer science:
- **Noam Chomsky (1956)**: Formal hierarchy of grammars and regular language classification.
- **Michael O. Rabin & Dana Scott (1959)**: Finite Automata and Their Decision Problems (Turing Award).
- **John E. Hopcroft (1971)**: $O(k \cdot n \log n)$ minimal state equivalence partition refinement algorithm.
- **Anil Nerode & John Myhill (1958)**: Myhill-Nerode Theorem on distinguishable prefix equivalence classes.
- **Ken Thompson (1968)**: Inductive regular expression compilation into non-deterministic finite automata.

---
