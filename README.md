# ⚡ Automata Converter & Minimizer

A slick, hyperminimalist, single-page web application for constructing, converting, and minimizing Finite Automata (NFA, DFA, Regular Expressions) in real-time. Built with Vanilla JS and Cytoscape.js.

---

## 🚀 Live Demo

[🔗 Click here to access the Live Demo](YOUR_LIVE_DEMO_URL_HERE)

---

## 🌟 Key Features

- **Multi-Modal Automaton Input**:
  - **Quick Controls**: Interactive state & symbol additions.
  - **Regular Expressions**: Thompson's Construction algorithm converting Regex (e.g. `(a|b)*abb`) directly into NFAs with $\epsilon$-transitions.
  - **Simple State Notation**: Intuitive text format (e.g. `->q0`, `q1*`, `q0 --a--> q1`).
- **Conversion & Minimization Algorithms**:
  - **NFA → DFA (Subset / Powerset Construction)**: Computes full $\epsilon$-closures and generates explicit state mappings.
  - **Hopcroft's DFA Minimization**: Prunes unreachable states and refines partition equivalences to construct minimal DFAs.
- **Export Options**:
  - High-resolution PNG diagram exports.

---

## 🛠️ Built With

- **HTML5 / CSS3 / JavaScript (ES6+)**
- **[Cytoscape.js](https://js.cytoscape.org/)** (Graph layout & visualization library via CDN)
- **Google Fonts** (Inter & JetBrains Mono)
