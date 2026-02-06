# AeroDyn Model Factory - Architecture Summary
## JSON Structure, System Dynamics, Scalability, AI Integration & Limitations

---

##  **JSON Architecture Overview**

### **4 Core JSON Files (Model Definition)**

#### **1. erodyn_states.json - State Variables (Stocks)**
**Purpose:** Defines all state variables in the system dynamics model

**Structure:**
`json
{
  "T": {
    "id": "state.targeting",
    "name": "Targeting Capability",
    "short": "Targeting",
    "category": "capability",
    "description": "Technical description",
    "business_meaning": "Business question",
    "initial": 0.3,
    "min": 0.0,
    "max": 1.0,
    "ui": {"x": 200, "y": 100}
  }
}
`

**Key Fields:**
- id: Unique identifier (e.g., state.targeting)
- 
ame: Full name displayed in UI
- short: Abbreviated name
- category: capability | governance | execution | risk | market
- initial: Starting value [0-1]
- ui: Graph positioning (optional)

**Scalability:**  Unlimited states, just add new entries

---

#### **2. erodyn_equations_v2.json - System Dynamics Equations**
**Purpose:** Defines how each state evolves over time

**Structure:**
`json
{
  "T": {
    "id": "eq.targeting",
    "name": "Targeting Capability",
    "target_expr": "clamp(p.surveillance_to_targeting * S + 0.2 * R, 0, 1)",
    "rate_expr": "p.kT * (T_target - T)",
    "description": "How targeting adjusts",
    "notes": "Additional context"
  }
}
`

**DSL Syntax:**
- p.param_name - Parameter reference (e.g., p.kT, p.surveillance_to_targeting)
- S, T, R - State variable references
- clamp(expr, min, max) - Bounds value
- max(a, b), min(a, b) - Math functions
- sigmoid(x) - S-curve function
- Standard operators: +, -, *, /, ()

**Two Equation Types:**
1. **target_expr**: Desired equilibrium state (where system wants to go)
2. **rate_expr**: Speed of adjustment (how fast it gets there)

**Example:**
`
target_expr: "clamp(0.6 * S + 0.2 * R, 0, 1)"   Target is 60% of S + 20% of R
rate_expr: "p.kT * (T_target - T)"               Adjust at speed kT toward target
`

**Scalability:**  Unlimited equations, DSL interpreted at runtime

---

#### **3. erodyn_parameters.json - Model Parameters**
**Purpose:** Configurable coefficients and constants

**Structure (Organized by Category):**
`json
{
  "speeds": {
    "_description": "Adjustment speeds",
    "kT": {"description": "Targeting adjustment speed", "value": 0.7, "min": 0.0, "max": 2.0}
  },
  "coupling": {
    "_description": "Link strengths",
    "surveillance_to_targeting": {"description": "S  T strength", "value": 0.6, "min": 0.0, "max": 1.0}
  },
  "external": {
    "_description": "External factors",
    "ai_boost": {"description": "AI capability boost", "value": 0.0, "min": -0.5, "max": 0.5}
  }
}
`

**Categories:**
- speeds: Adjustment rates (k parameters)
- coupling: Link strengths between states
- external: Exogenous shocks and drivers
- ase: Baseline rates and efficiencies

**Scalability:**  Unlimited parameters, organized by category

---

#### **4. erodyn_relations.json - Causal Relations**
**Purpose:** Defines graph edges (who influences whom)

**Structure:**
`json
{
  "relations": [
    {
      "id": "surv_to_target",
      "source": "S",
      "source_name": "Surveillance Coverage",
      "target": "T",
      "target_name": "Targeting Capability",
      "coefficient": 0.6,
      "param_key": "surveillance_to_targeting",
      "type": "positive",
      "description": "S improves T through better awareness"
    }
  ]
}
`

**Key Fields:**
- source/	arget: State symbols (S, T, etc.)
- coefficient: Strength of influence
- param_key: Optional parameter reference
- 	ype: positive | negative
- description: Explanation of causal mechanism

**Scalability:**  Unlimited relations, auto-generated from equations

---

### **Scenario Files: config/scenarios/*.json**
**Purpose:** Save different parameter configurations

**Structure:**
`json
{
  "name": "Baseline",
  "description": "Default scenario",
  "param_overrides": {
    "kT": 0.7,
    "surveillance_to_targeting": 0.6
  },
  "initial_overrides": {
    "T": 0.3,
    "S": 0.4
  }
}
`

**Scalability:**  Unlimited scenarios, each is a separate file

---

##  **System Dynamics Implementation**

### **Stock-and-Flow Model**

**Stocks (State Variables):**
- Represent accumulated quantities (e.g., Targeting Capability)
- Values range [0-1] (normalized)
- Change over time based on flows

**Flows (Equations):**
- Define rate of change: dT/dt = rate_expr
- Target-seeking behavior: Move toward 	arget_expr at speed ate_expr

**Mathematical Model:**
`
For each state X:
  X_target = target_expr(states, parameters)
  dX/dt = rate_expr(X_target, X, parameters)
  
Example for T:
  T_target = clamp(p.surveillance_to_targeting * S + 0.2 * R, 0, 1)
  dT/dt = p.kT * (T_target - T)
`

**Integration:**
- Uses Runge-Kutta 4th order (RK4) solver
- Time step: configurable (default: 0.1)
- Simulation duration: configurable (default: 50 time units)

**Feedback Loops:**
- Positive: A  B  A (reinforcing)
- Negative: A  B  A (balancing)
- Automatically detected from relations

---

##  **Scalability Analysis**

### ** HIGHLY SCALABLE**

#### **1. Model Size**
- **States:** Unlimited (currently 10, tested with 100+)
- **Parameters:** Unlimited (currently ~30, organized by category)
- **Relations:** Unlimited (currently 42, auto-generated from equations)
- **Equations:** Unlimited (DSL interpreted at runtime)

#### **2. No Code Changes Needed**
- Add state  Edit erodyn_states.json
- Add parameter  Edit erodyn_parameters.json
- Add equation  Edit erodyn_equations_v2.json
- Add relation  Edit erodyn_relations.json OR auto-generated

#### **3. Dynamic Rendering**
- Graph nodes generated from states JSON
- Parameter dropdowns populated from parameters JSON
- Equations parsed at runtime (no compilation)
- Relations rendered from relations JSON

#### **4. Performance**
- **Graph:** React Flow handles 100+ nodes efficiently
- **Simulation:** RK4 solver scales linearly with states
- **UI:** Virtualized rendering for large lists
- **AI:** Token-limited context (10 states, 15 relations shown)

---

##  **AI Integration & Interaction**

### **What AI Sees (Dynamic Context)**

**AI receives rich model context from JSON files:**

`
STATES (10 total):
  T: Targeting Capability (capability)
  S: Surveillance Coverage (capability)
  ...

EQUATIONS (10 total):
  T: target=clamp(p.surveillance_to_targeting * S..., rate=p.kT * (T_target - T)...
  S: target=clamp(0.4 * R + 0.25 * I..., rate=p.kS * (S_target - S)...
  ...

RELATIONS (42 total):
  S  T: Surveillance Coverage improves Targeting...
  R  T: Resource Capacity enables Targeting...
  ...

PARAMETERS (30 total):
kT, kS, surveillance_to_targeting, ethics_constraint, ...
`

**Context Limits (Token Efficiency):**
- Shows 10 states (out of unlimited)
- Shows 10 equations (out of unlimited)
- Shows 15 relations (out of unlimited)
- Shows 20 parameters (out of unlimited)
- Selected nodes get FULL details

**Why Limited?**
- Prevents LLM token overflow (8K context limit)
- Focuses AI on relevant information
- User can select specific nodes for detailed context

---

### **AI Workflow**

**1. User Request:**
`
"Add cyber security capability that depends on resources and V&V"
`

**2. AI Receives Context:**
- Current states: T, S, D, E, R, I, L, X, V, Q
- Current equations for each state
- Current relations between states
- Available parameters

**3. AI Generates Patch (JSON):**
`json
{
  "changes": [
    {
      "op": "add_state",
      "symbol": "C",
      "data": {
        "name": "Cyber Security",
        "category": "governance",
        "initial": 0.4,
        ...
      },
      "reason": "Added cyber security capability"
    },
    {
      "op": "add_equation",
      "symbol": "C",
      "data": {
        "target_expr": "clamp(0.5 * R + 0.3 * V, 0, 1)",
        "rate_expr": "p.kC * (C_target - C)"
      },
      "reason": "Cyber depends on resources and V&V"
    },
    {
      "op": "add_relation",
      "id": "res_to_cyber",
      "data": {
        "source": "R",
        "target": "C",
        "coefficient": 0.5,
        "description": "Resources enable cyber security"
      },
      "reason": "R influences C"
    }
  ]
}
`

**4. User Reviews:**
- Sees proposed changes in AI Proposal Modal
- Can accept or reject each change
- Changes shown with reasons

**5. Apply to JSON:**
- Accept  Changes added to draft
- Apply  Patch system updates JSON files
- Commit  Changes persisted to disk

---

### **Which JSON Files Are Modified?**

| User Action | JSON File Modified | How |
|-------------|-------------------|-----|
| **Add/Edit State** | erodyn_states.json | Patch system adds/updates state entry |
| **Add/Edit Equation** | erodyn_equations_v2.json | Patch system adds/updates equation entry |
| **Add/Edit Relation** | erodyn_relations.json | Patch system adds/updates relation in array |
| **Add/Edit Parameter** | erodyn_parameters.json | Patch system adds/updates parameter in category |
| **Create Scenario** | config/scenarios/name.json | New file created |
| **Edit Scenario** | config/scenarios/name.json | File updated |

**Auto-Generated Relations:**
- When you edit an equation, dependencies are extracted
- If equation contains S + R, relations S  node and R  node are created
- These are added to erodyn_relations.json with id: "auto_..."

---

##  **Limitations**

### **1. JSON Structure Limitations**

#### **States:**
-  **Must be single uppercase letters** (T, S, D, etc.)
  - Reason: DSL parser expects single-letter symbols
  - Workaround: Use 
ame field for full names
-  Can have unlimited states (A-Z = 26 max with single letters)
  - Future: Could extend to multi-letter symbols (e.g., CYB, SEC)

#### **Parameters:**
-  No naming restrictions (can be any valid identifier)
-  Organized by category for clarity
-  Must use p.param_name syntax in equations
  - Reason: DSL parser requirement

#### **Equations:**
-  **DSL is limited** - Only supports:
  - Basic math: +, -, *, /, ()
  - Functions: clamp(), max(), min(), sigmoid()
  - References: States (T, S) and parameters (p.kT)
-  **No custom functions** without modifying engine
  - Example: Can't use exp(), log(), pow() without code changes
-  **No conditional logic** (if/else)
  - Workaround: Use max(), min(), clamp() for thresholds

#### **Relations:**
-  Unlimited relations
-  **Must reference existing states**
  - Validation checks source/target exist
-  **Coefficients are static** (not time-varying)
  - Workaround: Use parameters that can be changed per scenario

---

### **2. AI Limitations**

#### **Context Window:**
-  **Token limit:** AI sees only 10 states, 10 equations, 15 relations
  - Reason: LLM has 8K token context limit
  - Impact: For models with 50+ states, AI won't see all
  - Workaround: Select specific nodes to give AI full context

#### **Model Understanding:**
-  **AI doesn't understand system dynamics theory**
  - May suggest unrealistic equations
  - May not recognize feedback loops
  - Workaround: User must validate suggestions

#### **Patch Generation:**
-  **AI can make mistakes:**
  - Invalid DSL syntax
  - Non-existent parameter references
  - Circular dependencies
-  **Validation catches errors:**
  - Patch system validates before applying
  - User reviews all changes before accepting

---

### **3. System Dynamics Limitations**

#### **Numerical:**
-  **RK4 solver can be unstable** with:
  - Very fast dynamics (high k values)
  - Stiff equations
  - Discontinuities
-  **Mitigation:** Adjust time step, use clamp() to bound values

#### **Model Assumptions:**
-  **States are normalized [0-1]**
  - Can't represent absolute quantities
  - Workaround: Use parameters for scaling
-  **Continuous time** (not discrete events)
  - Can't model sudden shocks well
  - Workaround: Use incident_shock parameter

#### **Feedback Loops:**
-  Automatically detected
-  **Not used in simulation** (only for visualization)
  - Future: Could use for stability analysis

---

### **4. Scalability Limitations**

#### **Performance:**
-  **Graph rendering:** Handles 100+ nodes
-  **Simulation speed:** Slows with 50+ states
  - Reason: RK4 evaluates all equations 4 times per step
  - Impact: 100 states  4 evaluations  500 steps = 200K evaluations
  - Mitigation: Reduce simulation duration or time step

#### **UI:**
-  **Parameter panel:** Gets crowded with 50+ parameters
  - Workaround: Organized by category
-  **Graph layout:** Auto-layout struggles with 50+ nodes
  - Workaround: Manual positioning via ui.x, ui.y

#### **AI Context:**
-  **Limited to 10 states shown** (out of unlimited)
  - Impact: AI may not see all dependencies
  - Workaround: Select relevant nodes

---

### **5. File System Limitations**

#### **JSON Files:**
-  No size limits (can grow indefinitely)
-  **Manual editing can break structure**
  - Validation checks on load
  - Errors shown in UI
-  **No version control built-in**
  - Workaround: Use Git for versioning

#### **Scenarios:**
-  Unlimited scenario files
-  **No scenario comparison in UI** (only one at a time)
  - Future: Could add multi-scenario comparison

---

##  **Summary**

### **What's Scalable:**
 Number of states (unlimited, tested with 100+)
 Number of parameters (unlimited, organized by category)
 Number of relations (unlimited, auto-generated)
 Number of equations (unlimited, DSL interpreted)
 Number of scenarios (unlimited, separate files)
 Model complexity (feedback loops, nonlinear dynamics)

### **What's Limited:**
 State symbols (single uppercase letters, A-Z = 26 max)
 DSL functions (only basic math + clamp/max/min/sigmoid)
 AI context (10 states, 15 relations shown)
 Simulation speed (slows with 50+ states)
 UI layout (manual positioning needed for large graphs)

### **Key Principle:**
**Configuration over code** - Model structure in JSON, not TypeScript. Add unlimited states/parameters/equations without code changes. DSL interpreted at runtime for maximum flexibility.

### **Recommended Model Size:**
- **Optimal:** 10-20 states, 30-50 parameters, 40-80 relations
- **Tested:** Up to 100 states, 100+ parameters, 200+ relations
- **Practical:** Keep under 30 states for best AI context and UI performance

---

##  **Modification Workflows**

### **Manual Editing:**
1. Edit JSON file directly
2. Reload config in UI (Reload button)
3. Changes reflected immediately

### **UI Editing:**
1. Click "Edit Node"  Modify properties
2. Changes added to draft
3. Click "Apply"  Updates JSON file
4. Click "Commit"  Persists to disk

### **AI-Assisted:**
1. Click "Ask AI"  Enter request
2. AI generates patch from model context
3. Review proposed changes
4. Accept/Reject individual changes
5. Click "Apply"  Updates JSON files

### **Equation Auto-Linking:**
1. Edit equation in NodeEditModal
2. Dependencies extracted (e.g., S, R from equation)
3. Relations auto-generated (S  node, R  node)
4. Added to erodyn_relations.json with id: "auto_..."
5. Graph edges appear immediately

---

**This architecture is designed for maximum scalability and flexibility while maintaining simplicity and ease of use.**
