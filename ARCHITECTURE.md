# AeroDyn Model Factory - Architecture Document

## 🏗️ System Architecture: "Model Factory" with Live Editing

This document describes the **draft/patch system** that transforms AeroDyn into a true "model factory" where you can edit models live, with GenAI proposing changes as draft patches.

---

## 🎯 Core Concept: Draft/Patch Overlay System

### Three-Layer Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    USER INTERFACE                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Graph Editor │  │  AI Propose  │  │ Accept/Reject│     │
│  │  (React Flow)│  │   Patches    │  │     UI       │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                    DRAFT LAYER                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Draft (Patch Operations)                            │  │
│  │  - add_state, remove_state, update_state             │  │
│  │  - add_relation, remove_relation, update_relation    │  │
│  │  - add_equation, update_equation                     │  │
│  │  - add_parameter, update_parameter                   │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                    MERGE LAYER                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  PatchMerger                                         │  │
│  │  effective_model = merge(base_model, draft)         │  │
│  │  validate(effective_model)                           │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                    BASE MODEL (Immutable)                   │
│  config/aerodyn_states.json                                 │
│  config/aerodyn_parameters.json                             │
│  config/aerodyn_relations.json                              │
│  config/aerodyn_equations.json                              │
│  config/scenarios.json                                      │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                SIMULATION ENGINE (Unchanged)                │
│  models/engine_v2.py - ODE solver (SciPy)                   │
└─────────────────────────────────────────────────────────────┘
```

---

## 📦 Key Components

### 1. Equation DSL (`models/equation_dsl.py`)

**Purpose:** Safe, deterministic equation language that prevents arbitrary code execution.

**Allowed Syntax:**
- Numbers: `0.3`, `1.5`, `-2.0`
- State variables: `T`, `S`, `R`, etc.
- Parameters: `p.kT`, `p.ai_boost` (cleaner than `p['ai_boost']`)
- Operators: `+`, `-`, `*`, `/`, `**`, `(`, `)`
- Functions: `clamp`, `min`, `max`, `sigmoid`, `step`, `smoothstep`, `abs`, `exp`, `log`

**Example Valid Expressions:**
```python
"clamp(0.4*S + 0.2*R + 0.3*Q + p.ai_boost - p.ethics_constraint*(1-E), 0, 1)"
"p.kT * (T_target - T)"
"sigmoid(X - p.incident_threshold, p.sensitivity)"
```

**Validation Process:**
1. Parse expression into AST (Abstract Syntax Tree)
2. Reject forbidden nodes (imports, attribute access except `p.<name>`, non-whitelisted functions)
3. Extract dependencies (which variables/parameters used)
4. Return normalized version

**Key Features:**
- ✅ No `eval()` or `exec()` - uses AST validation
- ✅ Deterministic - same input always produces same output
- ✅ Safe - cannot access filesystem, network, or system calls
- ✅ Dependency tracking - knows what each equation depends on

---

### 2. Patch System (`models/patch_system.py`)

**Purpose:** Manage changes to the model as a series of operations, not direct mutations.

#### Patch Operations

```python
class PatchOperation(Enum):
    # State operations
    ADD_STATE = "add_state"
    REMOVE_STATE = "remove_state"
    UPDATE_STATE = "update_state"
    
    # Relation operations
    ADD_RELATION = "add_relation"
    REMOVE_RELATION = "remove_relation"
    UPDATE_RELATION = "update_relation"
    
    # Parameter operations
    ADD_PARAMETER = "add_parameter"
    REMOVE_PARAMETER = "remove_parameter"
    UPDATE_PARAMETER = "update_parameter"
    
    # Equation operations
    ADD_EQUATION = "add_equation"
    UPDATE_EQUATION = "update_equation"
    REMOVE_EQUATION = "remove_equation"
    
    # Scenario operations
    ADD_SCENARIO = "add_scenario"
    UPDATE_SCENARIO = "update_scenario"
    REMOVE_SCENARIO = "remove_scenario"
```

#### Draft Structure

```json
{
  "draft_id": "draft_20260205_143000",
  "created_at": "2026-02-05T14:30:00",
  "based_on_version": "git:abc123",
  "description": "Add market share variable",
  "changes": [
    {
      "op": "add_state",
      "symbol": "M",
      "id": "state.market_share",
      "data": {
        "name": "Market Share",
        "initial": 0.2,
        "category": "market",
        "ui": { "x": 560, "y": 200 }
      },
      "reason": "Track market penetration"
    },
    {
      "op": "add_relation",
      "id": "rel.T_to_M",
      "data": {
        "source": "T",
        "target": "M",
        "coefficient": 0.5,
        "polarity": "+",
        "description": "Better targeting increases market share"
      },
      "reason": "Causal link from targeting to market"
    },
    {
      "op": "add_equation",
      "symbol": "M",
      "data": {
        "target_expr": "clamp(0.5*T + 0.3*L - 0.2*X, 0, 1)",
        "rate_expr": "p.kM * (M_target - M)"
      },
      "reason": "Market share equation"
    }
  ],
  "metadata": {
    "author": "user",
    "source": "manual"
  }
}
```

#### Merge Algorithm

```python
def merge(base_model, draft) -> effective_model:
    """
    Deterministically merge base + draft.
    
    Process:
    1. Deep copy base model (no mutations)
    2. Apply each change in order
    3. Validate merged model
    4. Return effective model or errors
    """
    effective = deep_copy(base_model)
    
    for change in draft.changes:
        apply_change(effective, change)
    
    validate(effective)
    return effective
```

**Key Properties:**
- ✅ **Deterministic:** Same base + draft always produces same result
- ✅ **Immutable base:** Original config files never modified (unless explicitly committed)
- ✅ **Cascade deletes:** Removing a state also removes its relations and equations
- ✅ **Validation:** Checks all references exist, no orphaned equations, etc.

---

### 3. Draft API (`backend/draft_api.py`)

**Purpose:** REST API for managing drafts and patches.

#### Endpoints

```
POST   /drafts                      - Create new draft
GET    /drafts                      - List all drafts
GET    /drafts/{draft_id}           - Get specific draft
PUT    /drafts/{draft_id}           - Update draft
DELETE /drafts/{draft_id}           - Delete draft

POST   /drafts/{draft_id}/add-change      - Add single change
DELETE /drafts/{draft_id}/changes/{index} - Remove change

POST   /drafts/{draft_id}/validate  - Validate without applying
POST   /drafts/{draft_id}/apply     - Merge and return effective model
POST   /drafts/{draft_id}/apply?commit=true - Merge and write to config files

POST   /drafts/validate-equation    - Real-time equation validation
GET    /drafts/health               - Health check
```

#### Example Usage

**Create draft:**
```bash
POST /drafts
{
  "description": "Add market share variable",
  "based_on_version": "git:abc123"
}

Response:
{
  "draft_id": "draft_20260205_143000",
  "created_at": "2026-02-05T14:30:00",
  "changes": []
}
```

**Add change:**
```bash
POST /drafts/draft_20260205_143000/add-change
{
  "op": "add_state",
  "symbol": "M",
  "data": {
    "name": "Market Share",
    "initial": 0.2,
    "category": "market"
  },
  "reason": "Track market penetration"
}
```

**Validate:**
```bash
POST /drafts/draft_20260205_143000/validate

Response:
{
  "success": true,
  "effective_model": { ... },
  "warnings": [],
  "errors": [],
  "applied_changes": 3,
  "skipped_changes": 0
}
```

**Apply (simulate with effective model):**
```bash
POST /drafts/draft_20260205_143000/apply

Response:
{
  "success": true,
  "effective_model": { ... },
  "warnings": ["New state M added"]
}
```

**Commit (write to config files):**
```bash
POST /drafts/draft_20260205_143000/apply?commit=true

Response:
{
  "success": true,
  "warnings": ["Changes committed to config files"]
}
```

---

## 🎨 Visual Language for UI

### Color Coding

| State | Color | Meaning |
|-------|-------|---------|
| **Base model** | Normal | Unchanged from config files |
| **Draft-added** | 🟢 Green outline/glow | New node/edge added in draft |
| **Draft-modified** | 🟡 Yellow badge | Existing item changed in draft |
| **Draft-removed** | 🔴 Red strikethrough | Marked for deletion (still visible) |
| **AI-proposed** | 🟢 Green + sparkle icon | GenAI suggested change |

### User Actions → Patch Operations

| User Action | Patch Operation | Visual Feedback |
|-------------|-----------------|-----------------|
| Add node | `add_state` | Green outline appears |
| Delete node | `remove_state` | Red strikethrough, cascade warning |
| Add edge | `add_relation` | Green edge appears |
| Drag edge weight slider | `update_relation` | Yellow badge on edge |
| Edit equation in panel | `update_equation` | Yellow badge on node |
| Accept AI suggestion | Apply change to draft | Green → Normal |
| Reject AI suggestion | Remove from draft | Disappears |

---

## 🤖 GenAI Integration

### AI as Patch Generator

**Key Principle:** AI never mutates the base model directly. It only proposes patches.

#### Flow

```
1. User selects context (nodes, subgraph, scenario)
2. Click "Ask AI" or "Suggest Improvements"
3. LLM receives:
   - Current model snippet (relevant subgraph)
   - Allowed symbols list
   - Patch schema
   - Hard constraints
4. LLM returns patch JSON
5. UI renders as green proposals
6. User can:
   - Accept (add to draft)
   - Edit (modify patch data)
   - Reject (discard)
```

#### AI Prompt Template

```
System: You are a patch generator for system dynamics models. 
Output ONLY valid JSON in the patch schema. No extra text.

User:
Goal: {user_goal}
Context: {model_snippet}
Allowed states: {state_symbols}
Allowed parameters: {param_names}
Allowed functions: clamp, min, max, sigmoid, step, smoothstep, abs, exp, log

Constraints:
- All new IDs must be unique
- Equations must use DSL only (no Python code)
- All references must exist or be added in same patch
- Provide clear "reason" for each change

Output patch JSON:
{
  "changes": [...]
}
```

#### Example AI Response

```json
{
  "changes": [
    {
      "op": "add_state",
      "symbol": "G",
      "data": {
        "name": "Regulatory Pressure",
        "initial": 0.1,
        "category": "governance"
      },
      "reason": "Models regulatory delay after incidents"
    },
    {
      "op": "add_relation",
      "id": "rel.X_to_G",
      "data": {
        "source": "X",
        "target": "G",
        "coefficient": 0.6,
        "polarity": "+"
      },
      "reason": "Incidents increase regulatory pressure"
    },
    {
      "op": "add_relation",
      "id": "rel.G_to_R",
      "data": {
        "source": "G",
        "target": "R",
        "coefficient": -0.3,
        "polarity": "-"
      },
      "reason": "Regulatory pressure reduces available resources"
    },
    {
      "op": "add_equation",
      "symbol": "G",
      "data": {
        "target_expr": "clamp(step(X - 0.3, 0.5) * 0.8, 0, 1)",
        "rate_expr": "0.2 * (G_target - G)"
      },
      "reason": "Regulatory pressure activates after incident threshold"
    }
  ]
}
```

---

## 🔒 Safety & Determinism Guarantees

### 1. No Arbitrary Code Execution
- ✅ Equation DSL uses AST validation, not `eval()`
- ✅ Whitelist of allowed functions
- ✅ No imports, no file access, no network

### 2. Deterministic Evaluation
- ✅ Same inputs always produce same outputs
- ✅ No randomness unless explicitly seeded
- ✅ Merge algorithm is order-dependent but predictable

### 3. Immutable Base Model
- ✅ Config files never modified unless explicitly committed
- ✅ Simulation uses effective model, not base
- ✅ Can always revert to base

### 4. Validation at Every Step
- ✅ Equation syntax validation (DSL)
- ✅ Reference validation (all symbols exist)
- ✅ Dependency validation (no circular loops)
- ✅ Type validation (coefficients are numbers, etc.)

### 5. Undo/Redo
- ✅ Draft is just a list of changes
- ✅ Remove last change = undo
- ✅ Re-add change = redo
- ✅ Full history preserved

---

## 📁 File Structure

```
aerodyn-model-factory/
├── models/
│   ├── equation_dsl.py        # Safe equation validator
│   ├── patch_system.py        # Draft/patch/merge logic
│   ├── engine_v2.py           # Simulation engine (unchanged)
│   └── engine.py              # Legacy engine
├── backend/
│   ├── draft_api.py           # Draft REST API
│   ├── api_v2.py              # Main API (includes draft router)
│   └── requirements.txt
├── config/
│   ├── aerodyn_states.json    # Base model: states
│   ├── aerodyn_parameters.json # Base model: parameters
│   ├── aerodyn_relations.json  # Base model: relations
│   ├── aerodyn_equations.json  # Base model: equations
│   ├── scenarios.json          # Base model: scenarios
│   ├── simulation.json         # Simulation settings
│   └── drafts/                 # Draft storage
│       ├── draft_001.json
│       ├── draft_002.json
│       └── ...
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── GraphEditor.tsx      # (TODO) Graph editing UI
│   │   │   ├── DraftPanel.tsx       # (TODO) Draft management
│   │   │   ├── AIProposal.tsx       # (TODO) AI suggestions
│   │   │   └── ...
│   │   └── ...
│   └── ...
└── ARCHITECTURE.md             # This file
```

---

## 🚀 Implementation Phases

### ✅ Phase 1: Foundation (COMPLETED)
- [x] Equation DSL validator with AST parsing
- [x] Patch system with merge algorithm
- [x] Draft API endpoints
- [x] Integration with main API

### 🔄 Phase 2: Enhanced Config (IN PROGRESS)
- [ ] Add stable IDs to all config files
- [ ] Add UI coordinates for graph layout
- [ ] Update config schema documentation

### 📋 Phase 3: Graph Editor UI (NEXT)
- [ ] Build graph editor with React Flow
- [ ] Implement add/remove/edit node operations
- [ ] Map user actions to patch operations
- [ ] Real-time equation validation

### 🎨 Phase 4: Visual Diff System
- [ ] Color coding (green/yellow/red)
- [ ] Draft preview mode
- [ ] Side-by-side comparison
- [ ] Highlight changed elements

### 🤖 Phase 5: AI Integration
- [ ] AI patch proposal endpoint
- [ ] LLM prompt engineering
- [ ] Structured JSON output validation
- [ ] Context selection UI

### ✅ Phase 6: Accept/Edit/Reject UI
- [ ] Change review panel
- [ ] Individual change accept/reject
- [ ] Inline editing of proposals
- [ ] Batch operations

### 🔧 Phase 7: Advanced Features
- [ ] Undo/redo stack
- [ ] Draft branching
- [ ] Conflict resolution
- [ ] Collaborative editing

### 🚢 Phase 8: Production Ready
- [ ] Performance optimization
- [ ] Error handling
- [ ] User documentation
- [ ] Tutorial/onboarding

---

## 🎯 Key Benefits

### For Users
- ✅ **No code required** - Edit models visually
- ✅ **Safe experimentation** - Base model never touched
- ✅ **AI assistance** - Get smart suggestions
- ✅ **Full control** - Accept/reject each change
- ✅ **Undo/redo** - Easy to experiment

### For Developers
- ✅ **No engine changes** - Simulation code untouched
- ✅ **Deterministic** - Predictable behavior
- ✅ **Version control friendly** - Patches are JSON
- ✅ **Testable** - Each component isolated
- ✅ **Extensible** - Easy to add new operations

### For System Integrity
- ✅ **Safe** - No arbitrary code execution
- ✅ **Validated** - Multiple validation layers
- ✅ **Auditable** - Full change history
- ✅ **Reversible** - Can always go back
- ✅ **Consistent** - Deterministic merging

---

## 📚 References

- **System Dynamics:** Jay Forrester (MIT)
- **AST Validation:** Python `ast` module
- **Patch Systems:** Git, JSON Patch (RFC 6902)
- **React Flow:** Graph visualization library
- **FastAPI:** Modern Python web framework

---

**Built with ❤️ for safe, deterministic, AI-assisted model editing**
