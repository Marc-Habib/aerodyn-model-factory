# AeroDyn Model Factory

> **A live-editable system dynamics modeling platform with AI-powered suggestions**

[![Python 3.8+](https://img.shields.io/badge/python-3.8+-blue.svg)](https://www.python.org/downloads/)
[![React 18](https://img.shields.io/badge/react-18-blue.svg)](https://reactjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-green.svg)](https://fastapi.tiangolo.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## Overview

**AeroDyn Model Factory** is a next-generation system dynamics modeling platform that combines visual graph editing, real-time simulation, and local AI assistance to enable rapid prototyping and analysis of complex adaptive systems.

### Key Capabilities

- **Visual Graph Editor** - Interactive node-based interface with drag-and-drop editing
- **AI-Powered Suggestions** - Local LLM integration (Ollama) for natural language model modifications
- **Draft/Patch System** - Non-destructive editing with full change tracking
- **Real-Time Validation** - Safe equation DSL with AST-based validation
- **Dual-Mode Interface** - Executive insights and expert technical views
- **Scenario Analysis** - Compare multiple strategies side-by-side

---

## Quick Start

### Prerequisites

- Python 3.8+
- Node.js 18+
- Ollama (optional, for AI features)

### Installation

```bash
# Clone repository
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
# Runs on http://localhost:8000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
# Runs on http://localhost:5173
```

**Open:** http://localhost:5173

---

## Features

### Visual Graph Editor

- **Interactive Canvas** - Drag nodes to reposition, click to edit
- **Real-Time Updates** - Changes reflected immediately
- **Fullscreen Mode** - Maximize canvas for complex models
- **Custom Theming** - Dark slate design with consistent styling
- **Position Persistence** - Node layouts saved automatically

### AI-Powered Editing

**Setup Ollama (Optional):**
```bash
# Install Ollama from https://ollama.com
ollama pull llama3.1:8b
```

**Usage:**
1. Click "Model Editor" button
2. Click "Ask AI" (purple sparkle icon)
3. Enter natural language prompt
4. Review and accept AI-generated suggestions

**Example Prompts:**
- "Add a feedback loop where regulatory pressure increases after incidents"
- "Create a reinforcing loop between trust and resources"
- "Add a market share variable influenced by targeting and trust"

### Draft/Patch System

- **Non-Destructive** - Base model remains immutable
- **Change Tracking** - All modifications logged in draft
- **Validation** - Real-time checking before applying
- **Apply/Commit** - Merge changes when ready

### Safe Equation DSL

- **AST Validation** - No arbitrary code execution
- **Whitelisted Functions** - Only safe operations allowed
- **Dependency Tracking** - Automatic relationship detection
- **Syntax Checking** - Real-time validation

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  FRONTEND (React + TypeScript)          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │ Graph Editor │  │  AI Proposal │  │ Draft Panel  │ │
│  │ (React Flow) │  │    Modal     │  │  (Changes)   │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────┘
                         ↕ REST API
┌─────────────────────────────────────────────────────────┐
│                 BACKEND (FastAPI + Python)              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │ Draft API    │  │  AI Service  │  │  Simulation  │ │
│  │ (Patches)    │  │  (Ollama)    │  │   Engine     │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────┘
                         ↕
┌─────────────────────────────────────────────────────────┐
│              MODELS (Python + SciPy)                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │ Equation DSL │  │ Patch System │  │  ODE Solver  │ │
│  │ (Validator)  │  │   (Merger)   │  │   (SciPy)    │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### Technology Stack

**Backend:**
- Python 3.8+, FastAPI, SciPy, NumPy
- Ollama (local LLM integration)

**Frontend:**
- React 18, TypeScript, Vite
- React Flow (graph visualization)
- Tailwind CSS v4
- Recharts (time series)

---

## Use Case: Defense AI Systems

The default model simulates AI weapons system development, modeling the interplay between:

**System Variables:**
- **T** - Targeting Capability
- **S** - Surveillance Coverage
- **D** - Decision Support
- **E** - Ethics Compliance
- **R** - Resources
- **I** - Integration
- **L** - Trust & Legitimacy
- **X** - Incidents
- **V** - V&V Maturity
- **Q** - Data Quality

**Key Dynamics:**
- Better targeting → More trust → More resources (reinforcing loop)
- Incidents → Loss of trust → Reduced resources (balancing loop)
- Fast deployment vs. thorough validation (strategic trade-off)

**Strategic Questions:**
- What if we rush deployment to beat competitors?
- What if we invest in compliance first?
- What happens after a major incident?
- How do we balance AI innovation with ethics?

---

## Configuration

### File Structure

```
config/
├── aerodyn_states.json         # State variables with UI coordinates
├── aerodyn_relations.json      # Causal relationships
├── aerodyn_equations_v2.json   # DSL-compatible equations
├── aerodyn_parameters.json     # Model parameters
├── scenarios.json              # Scenario presets
├── simulation.json             # Simulation settings
└── drafts/                     # Draft storage
```

### Adding a New State

**1. Edit `aerodyn_states.json`:**
```json
{
  "M": {
    "id": "state.market_share",
    "name": "Market Share",
    "short": "Market",
    "initial": 0.2,
    "category": "market",
    "ui": {"x": 400, "y": 300}
  }
}
```

**2. Add equation in `aerodyn_equations_v2.json`:**
```json
{
  "id": "eq.market_share",
  "name": "Market Share",
  "target_expr": "clamp(0.5 * p.targeting_weight + 0.3 * p.trust_weight, 0, 1)",
  "rate_expr": "p.kM * (target - current)"
}
```

**3. Add relations in `aerodyn_relations.json`:**
```json
{
  "id": "rel.targeting_to_market",
  "source": "T",
  "target": "M",
  "coefficient": 0.5,
  "type": "positive"
}
```

**4. Reload UI** - Changes appear instantly

---

## API Endpoints

### Base URL
```
http://localhost:8000
```

### Core Endpoints

**Configuration:**
- `GET /config/full` - Get complete model configuration
- `GET /graph` - Get network graph structure
- `GET /config/feedback-loops` - Get feedback loops

**Simulation:**
- `POST /simulate` - Run simulation with overrides
- `GET /simulate/compare-all` - Compare all scenarios

**Draft System:**
- `POST /drafts` - Create new draft
- `GET /drafts/{id}` - Get draft details
- `POST /drafts/{id}/changes` - Add change to draft
- `POST /drafts/{id}/validate` - Validate draft
- `POST /drafts/{id}/apply` - Apply draft to model

**AI Integration:**
- `GET /ai/status` - Check Ollama availability
- `POST /ai/generate-patch` - Generate AI suggestions

---

## Development

### Project Structure

```
aerodyn-model-factory/
├── backend/
│   ├── api_v2.py              # Main FastAPI app
│   ├── draft_api.py           # Draft endpoints
│   └── ai_service.py          # Ollama integration
├── models/
│   ├── engine_v2.py           # ODE engine
│   ├── equation_dsl.py        # Safe equation validator
│   └── patch_system.py        # Draft/patch logic
├── config/
│   └── *.json                 # Model configurations
├── frontend/
│   ├── src/
│   │   ├── components/        # React components
│   │   │   ├── GraphEditor.tsx
│   │   │   ├── NodeEditModal.tsx
│   │   │   ├── EdgeEditModal.tsx
│   │   │   └── AIProposalModal.tsx
│   │   └── api/               # API clients
│   │       ├── drafts.ts
│   │       └── ai.ts
│   └── package.json
└── README.md
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

---

## Privacy & Security

✅ **100% Local** - All AI processing runs on your machine  
✅ **No External APIs** - No data sent to cloud services  
✅ **No Tracking** - No analytics or telemetry  
✅ **Open Source Model** - Llama 3.1 is fully open  
✅ **Safe Execution** - AST-validated equations only  
✅ **No Eval** - No arbitrary code execution  

---

## Use Cases

### 1. Defense & Security
- AI weapons system strategy
- Cybersecurity capability planning
- Intelligence system integration

### 2. Healthcare
- Hospital capacity planning
- Disease outbreak modeling
- Healthcare policy analysis

### 3. Climate & Environment
- Carbon emission strategies
- Renewable energy transition
- Ecosystem management

### 4. Business Strategy
- Market entry strategy
- Technology adoption
- Supply chain resilience

### 5. Public Policy
- Education reform
- Transportation infrastructure
- Social program effectiveness

---

## License

MIT License - see LICENSE file for details

---

## Acknowledgments

- System Dynamics methodology by Jay Forrester (MIT)
- React Flow for graph visualization
- Ollama for local LLM inference
- FastAPI for elegant API design

---

**Built for strategic decision-makers and systems thinkers**
