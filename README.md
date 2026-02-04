# AeroDyn Model Factory

> **A configuration-driven system dynamics modeling platform for strategic decision-making in complex adaptive systems**

[![Python 3.9+](https://img.shields.io/badge/python-3.9+-blue.svg)](https://www.python.org/downloads/)
[![React 18](https://img.shields.io/badge/react-18-blue.svg)](https://reactjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-green.svg)](https://fastapi.tiangolo.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Use Case: Defense AI Systems](#use-case-defense-ai-systems)
- [Key Features](#key-features)
- [Architecture](#architecture)
- [Quick Start](#quick-start)
- [Understanding the Model](#understanding-the-model)
- [Working with Scenarios](#working-with-scenarios)
- [Configuration Guide](#configuration-guide)
- [API Documentation](#api-documentation)
- [Development](#development)
- [Use Cases & Applications](#use-cases--applications)
- [Contributing](#contributing)
- [License](#license)

---

## 🎯 Overview

**AeroDyn Model Factory** is a next-generation system dynamics modeling platform that enables organizations to:

- **Model complex systems** without writing code
- **Simulate strategic scenarios** to understand long-term impacts
- **Visualize causal relationships** through interactive network graphs
- **Compare policy alternatives** with quantitative metrics
- **Communicate insights** to both technical and executive audiences

Unlike traditional modeling tools, AeroDyn uses a **configuration-first approach**: define your system in JSON files, and the platform dynamically generates simulations, visualizations, and insights.

### Why AeroDyn?

**Traditional Approach:**
```
Change model → Rewrite code → Recompile → Test → Deploy
```

**AeroDyn Approach:**
```
Edit JSON config → Reload UI → Instant results
```

---

## 🛡️ Use Case: Defense AI Systems

The default model simulates **AI weapons system development** for a defense contractor (AeroDyn), modeling the complex interplay between:

### System Variables (Stocks)

| Variable | Name | Business Question |
|----------|------|------------------|
| **T** | Targeting Capability | How accurate are our AI targeting systems? |
| **S** | Surveillance Coverage | How comprehensive is our monitoring capability? |
| **D** | Decision Support | How reliable are AI-generated recommendations? |
| **E** | Ethics Compliance | Are we meeting ethical AI guidelines? |
| **R** | Resources | Do we have sufficient budget and personnel? |
| **I** | Integration | How well do systems work together? |
| **L** | Trust & Legitimacy | Do governments and public trust our systems? |
| **X** | Incidents | How many safety failures have occurred? |
| **V** | V&V Maturity | How thorough is our verification & validation? |
| **Q** | Data Quality | How good is our training data? |

### Key Dynamics

**Positive Feedback Loops:**
- Better targeting → More trust → More resources → Better targeting
- High data quality → Better AI → Better surveillance → More data

**Negative Feedback Loops:**
- Incidents → Loss of trust → Reduced resources → Slower capability growth
- Low ethics → Political scrutiny → Constraints on development

**Strategic Trade-offs:**
- Fast deployment vs. thorough validation
- Aggressive capability push vs. ethical constraints
- Short-term wins vs. long-term sustainability

### Strategic Questions Answered

1. **"What if we rush deployment to beat competitors?"**
   - Scenario: `rapid_capability_race`
   - Result: Short-term gains, but incident risk increases, trust erodes

2. **"What if we invest in compliance first?"**
   - Scenario: `compliance_first`
   - Result: Slower growth, but sustainable and resilient to incidents

3. **"What happens after a major incident?"**
   - Scenario: `post_incident_crisis`
   - Result: Trust collapse, increased scrutiny, forced V&V investment

4. **"How do we balance AI innovation with ethics?"**
   - Scenario: `enhanced_AI` vs. `high_scrutiny`
   - Result: Compare trade-offs between capability and compliance

---

## ✨ Key Features

### 🎨 Dual-Mode Interface

**Executive Mode:**
- High-level KPI dashboard
- Strategic insights and recommendations
- Scenario comparison
- Business-friendly language

**Expert Mode:**
- Interactive network graph with expandable nodes
- Full equation visibility and editing
- Parameter tuning with real-time feedback
- Technical details and derivatives

### 📊 Advanced Visualization

- **Time Series Charts:** Track all variables over simulation period
- **Network Graphs:** Visualize causal relationships and feedback loops
- **Scenario Comparison:** Side-by-side analysis of different strategies
- **Adaptive Chart Width:** Automatically cuts off when values converge

### 🔧 Configuration-Driven

- **No Code Changes:** Modify system entirely through JSON files
- **Hot Reload:** Changes reflect instantly in UI
- **Version Control Friendly:** Track model evolution in Git
- **Portable:** Share models as simple JSON files

### 🚀 Dynamic Engine

- **ODE Solver:** Numerical integration using SciPy
- **Constraint Handling:** Automatic clamping to valid ranges
- **Parameter Sensitivity:** Test impact of different values
- **Feedback Loop Detection:** Identify reinforcing and balancing loops

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND (React)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │  Executive   │  │    Expert    │  │   Scenario   │    │
│  │  Dashboard   │  │  Graph View  │  │  Comparison  │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
└─────────────────────────────────────────────────────────────┘
                            ↕ REST API
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND (FastAPI)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │   Simulate   │  │   Compare    │  │   Insights   │    │
│  │   Endpoint   │  │   Scenarios  │  │   Generator  │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                  DYNAMIC ENGINE (Python)                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │  ODE Solver  │  │  Constraint  │  │   Feedback   │    │
│  │   (SciPy)    │  │   Handler    │  │  Loop Finder │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│              CONFIGURATION (JSON Files)                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │    States    │  │  Parameters  │  │  Relations   │    │
│  │   (Stocks)   │  │   (Knobs)    │  │  (Edges)     │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │  Equations   │  │  Scenarios   │  │  Simulation  │    │
│  │  (Formulas)  │  │  (Presets)   │  │   Settings   │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

**Backend:**
- Python 3.9+
- FastAPI (REST API)
- SciPy (ODE solver)
- NumPy (numerical computing)
- Pydantic (data validation)

**Frontend:**
- React 18
- TypeScript
- Vite (build tool)
- Tailwind CSS v4
- React Flow (graph visualization)
- Recharts (time series charts)
- Lucide Icons

---

## 🚀 Quick Start

### Prerequisites

- Python 3.9 or higher
- Node.js 18 or higher
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/Marc-Habib/aerodyn-model-factory.git
cd aerodyn-model-factory

# Install backend dependencies
pip install -r backend/requirements.txt

# Install frontend dependencies
cd frontend
npm install
cd ..
```

### Running the Application

**Terminal 1 - Backend:**
```bash
python backend/api_v2.py
# Server runs on http://localhost:8000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
# App runs on http://localhost:5173
```

**Open your browser:**
```
http://localhost:5173
```

### First Steps

1. **Switch to Executive Mode** (top-right toggle)
   - View high-level KPIs
   - See strategic insights
   - Compare scenarios

2. **Switch to Expert Mode**
   - Click "Graph View" to see network
   - Click any node to expand and see equations
   - Adjust parameters with sliders
   - Run simulations

3. **Try a Scenario**
   - Select "Rapid Capability Race" from dropdown
   - Click "Run Simulation"
   - Observe how aggressive AI push affects trust and incidents

4. **Compare Scenarios**
   - Click "Compare All"
   - See which strategy performs best
   - Analyze trade-offs

---

## 📚 Understanding the Model

### System Dynamics Fundamentals

The model uses **differential equations** to simulate how variables change over time:

```
dX/dt = f(X, parameters)
```

Where:
- **X** = Current state (e.g., Targeting capability)
- **dX/dt** = Rate of change
- **f()** = Function determining how X changes
- **parameters** = Tunable knobs (e.g., AI boost)

### Example: Targeting Capability (T)

**Target Equation:**
```python
T_target = clamp(
    0.4 * S +              # Surveillance helps targeting
    0.2 * R +              # Resources enable development
    0.3 * Q +              # Data quality improves AI
    ai_boost -             # AI acceleration factor
    ethics_constraint * (1 - E),  # Low ethics constrains growth
    0, 1                   # Keep between 0 and 1
)
```

**Derivative (Rate of Change):**
```python
dT/dt = kT * (T_target - T)
```

**In Plain English:**
"Targeting improves when you have good surveillance, resources, and data quality. AI boost accelerates this. But if ethics compliance is low, aggressive targeting is constrained. The system moves halfway to the target each time step."

### Feedback Loops

**Reinforcing Loop (R1): Success Breeds Success**
```
T ↑ → L ↑ → R ↑ → T ↑
(Better targeting → More trust → More resources → Better targeting)
```

**Balancing Loop (B1): Incidents Constrain Growth**
```
T ↑ → X ↑ → L ↓ → R ↓ → T ↓
(Aggressive targeting → More incidents → Less trust → Fewer resources)
```

---

## 🎭 Working with Scenarios

### What is a Scenario?

A scenario is a **preset configuration** that answers a strategic question by adjusting:
- **Parameters:** Change system behavior (e.g., increase AI boost)
- **Initial Values:** Start from different conditions (e.g., low trust)

### Built-in Scenarios

| Scenario | Question | Key Changes |
|----------|----------|-------------|
| **Baseline** | What's the default trajectory? | No changes |
| **Enhanced AI** | What if we boost AI capabilities? | `ai_boost: 0.2`, better integration |
| **High Scrutiny** | What if political oversight increases? | `political_scrutiny: 0.7`, ethics constraints |
| **Rapid Capability Race** | What if we rush deployment? | High AI push, low V&V investment |
| **Post-Incident Crisis** | What happens after a major incident? | Trust collapsed, scrutiny spiked |
| **Compliance First** | What if we invest in V&V proactively? | High V&V, slower capability growth |
| **Export Restricted** | What if geopolitical tensions rise? | Reduced integration, export controls |

### Creating a Custom Scenario

**In the UI:**
1. Adjust parameter sliders to desired values
2. Click "+ New Scenario"
3. Enter name and description
4. Click "Create Scenario"
5. Scenario saved to `config/scenarios.json`

**Manually (JSON):**
```json
{
  "my_scenario": {
    "name": "My Custom Scenario",
    "description": "Testing aggressive AI with high ethics",
    "param_overrides": {
      "ai_boost": 0.3,
      "ethics_constraint": 0.8
    },
    "initial_overrides": {
      "T": 0.5,
      "E": 0.7
    }
  }
}
```

---

## ⚙️ Configuration Guide

### File Structure

```
config/
├── model.json              # Master config (unified)
├── aerodyn_states.json     # Stock variables
├── aerodyn_parameters.json # Tunable parameters
├── aerodyn_relations.json  # Causal relationships
├── aerodyn_equations.json  # Mathematical formulas
├── scenarios.json          # Scenario presets
└── simulation.json         # Simulation settings
```

### Adding a New State Variable

**1. Define in `aerodyn_states.json`:**
```json
{
  "M": {
    "name": "Market Share",
    "short": "Market",
    "description": "Percentage of defense AI market captured",
    "business_meaning": "How much of the market do we control?",
    "initial": 0.2,
    "category": "market"
  }
}
```

**2. Add equation in `aerodyn_equations.json`:**
```json
{
  "M": {
    "name": "Market Share",
    "equation": "kM * (M_target - M)",
    "target_equation": "clamp(0.5 * T + 0.3 * L - 0.2 * X, 0, 1)",
    "description": "Market share grows with capability and trust, shrinks with incidents"
  }
}
```

**3. Add relations in `aerodyn_relations.json`:**
```json
{
  "id": "targeting_to_market",
  "source": "T",
  "target": "M",
  "coefficient": 0.5,
  "description": "Better targeting increases market share"
}
```

**4. Reload UI** - No code changes needed!

### Adding a New Parameter

**Edit `aerodyn_parameters.json`:**
```json
{
  "market_competition": {
    "description": "Intensity of market competition",
    "value": 0.5,
    "min": 0.0,
    "max": 1.0,
    "category": "market"
  }
}
```

**Reference in equations:**
```json
"target_equation": "clamp(0.5 * T - p['market_competition'] * 0.3, 0, 1)"
```

### Modifying Simulation Settings

**Edit `simulation.json`:**
```json
{
  "t_start": 0,
  "t_end": 120,        # Simulate for 120 months
  "dt": 0.1,           # Time step
  "method": "RK45"     # Integration method
}
```

---

## 📡 API Documentation

### Base URL
```
http://localhost:8000
```

### Endpoints

#### Get Full Configuration
```http
GET /config/full
```

**Response:**
```json
{
  "states": {...},
  "parameters": {...},
  "scenarios": {...},
  "simulation": {...}
}
```

#### Run Simulation
```http
POST /simulate
Content-Type: application/json

{
  "scenario": "enhanced_AI",
  "param_overrides": {"ai_boost": 0.25},
  "initial_overrides": {"T": 0.4}
}
```

**Response:**
```json
{
  "t": [0, 0.1, 0.2, ...],
  "states": {
    "T": [0.3, 0.32, 0.34, ...],
    "S": [0.2, 0.22, 0.24, ...]
  },
  "kpis": {
    "peak_targeting": 0.85,
    "convergence_time": 45
  },
  "insights": [
    "Targeting capability peaks at 0.85 after 45 months",
    "Trust remains stable above 0.6 throughout simulation"
  ]
}
```

#### Compare All Scenarios
```http
GET /simulate/compare-all
```

#### Get Network Graph
```http
GET /graph
```

#### Get Feedback Loops
```http
GET /config/feedback-loops
```

---

## 🛠️ Development

### Project Structure

```
aerodyn-model-factory/
├── backend/
│   ├── api_v2.py           # Main FastAPI application
│   ├── api.py              # Legacy API (compatibility)
│   └── requirements.txt    # Python dependencies
├── models/
│   ├── engine_v2.py        # Dynamic ODE engine
│   └── engine.py           # Legacy engine
├── config/
│   └── *.json              # All model configurations
├── frontend/
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── api.ts          # API client
│   │   ├── App.tsx         # Main app
│   │   └── index.css       # Global styles
│   ├── package.json
│   └── vite.config.ts
├── .gitignore
└── README.md
```

### Running Tests

```bash
# Backend tests
python -m pytest backend/tests/

# Frontend tests
cd frontend
npm test
```

### Building for Production

```bash
# Build frontend
cd frontend
npm run build

# Serve with backend
cd ..
uvicorn backend.api_v2:app --host 0.0.0.0 --port 8000
```

### Code Style

**Python:**
```bash
black backend/ models/
flake8 backend/ models/
mypy backend/ models/
```

**TypeScript:**
```bash
cd frontend
npm run lint
npm run format
```

---

## 🌍 Use Cases & Applications

### 1. Defense & Security
- AI weapons system development strategy
- Cybersecurity capability planning
- Intelligence system integration

### 2. Healthcare
- Hospital capacity planning
- Disease outbreak modeling
- Healthcare policy impact analysis

### 3. Climate & Environment
- Carbon emission reduction strategies
- Renewable energy transition planning
- Ecosystem management

### 4. Business Strategy
- Market entry strategy
- Technology adoption modeling
- Supply chain resilience

### 5. Public Policy
- Education system reform
- Transportation infrastructure
- Social program effectiveness

### Adapting to Your Domain

**Step 1:** Define your system variables (stocks)
**Step 2:** Identify causal relationships
**Step 3:** Write equations for each variable
**Step 4:** Set parameters and initial values
**Step 5:** Create scenarios for strategic questions
**Step 6:** Run simulations and analyze results

---

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit your changes** (`git commit -m 'Add amazing feature'`)
4. **Push to the branch** (`git push origin feature/amazing-feature`)
5. **Open a Pull Request**

### Development Guidelines

- Follow existing code style
- Add tests for new features
- Update documentation
- Keep commits atomic and well-described

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- System Dynamics methodology by Jay Forrester (MIT)
- React Flow for graph visualization
- FastAPI for elegant API design
- SciPy for numerical computing

---

## 📞 Contact

**Marc Habib**
- GitHub: [@Marc-Habib](https://github.com/Marc-Habib)
- Repository: [aerodyn-model-factory](https://github.com/Marc-Habib/aerodyn-model-factory)

---

## 🚀 What's Next?

- [ ] Multi-model support
- [ ] Real-time collaboration
- [ ] Monte Carlo sensitivity analysis
- [ ] Machine learning integration
- [ ] Cloud deployment templates
- [ ] Mobile app

---

**Built with ❤️ for strategic decision-makers and systems thinkers**
