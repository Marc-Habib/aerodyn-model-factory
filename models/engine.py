"""
Dynamic ODE Engine - Builds equations from config files
Uses exec/globals to evaluate string expressions from JSON
"""

import json
import numpy as np
from scipy.integrate import solve_ivp
from pathlib import Path
from typing import Dict, List, Any, Callable


def clamp(x: float, lo: float, hi: float) -> float:
    """Clamp value between lo and hi."""
    return float(np.clip(x, lo, hi))


class ConfigLoader:
    """Load and merge all config files."""
    
    def __init__(self, config_dir: str = None):
        self.config_dir = Path(config_dir) if config_dir else Path(__file__).parent.parent / "config"
    
    def load_json(self, filename: str) -> dict:
        filepath = self.config_dir / filename
        if filepath.exists():
            with open(filepath, "r") as f:
                return json.load(f)
        return {}
    
    def load_all(self) -> dict:
        return {
            "states": self.load_json("aerodyn_states.json"),
            "parameters": self.load_json("aerodyn_parameters.json"),
            "relations": self.load_json("aerodyn_relations.json"),
            "equations": self.load_json("aerodyn_equations.json"),
            "scenarios": self.load_json("scenarios.json"),
            "simulation": self.load_json("simulation.json"),
        }


class ExpressionEngine:
    """
    Evaluates string expressions from JSON using exec/globals.
    Allows fully parameterizable stock/flow equations.
    """
    
    def __init__(self, equations_config: dict):
        self.stocks = equations_config.get("stocks", {})
        self.flows = equations_config.get("flows", {})
        
        # Build global namespace for expression evaluation
        self.globals = {
            "clamp": clamp,
            "np": np,
            "abs": abs,
            "min": min,
            "max": max,
            "exp": np.exp,
            "log": np.log,
            "sqrt": np.sqrt,
            "sin": np.sin,
            "cos": np.cos,
        }
        
        # Compile target equations for each stock
        self._compiled_targets: Dict[str, Callable] = {}
        self._compiled_derivatives: Dict[str, Callable] = {}
        self._compile_equations()
    
    def _compile_equations(self):
        """Pre-compile equations for performance."""
        for stock_name, stock_def in self.stocks.items():
            # Compile target equation
            target_expr = stock_def.get("target_equation", "0")
            self._compiled_targets[stock_name] = self._make_eval_func(target_expr, f"{stock_name}_target")
            
            # Compile derivative equation
            deriv_expr = stock_def.get("equation", "0")
            self._compiled_derivatives[stock_name] = self._make_eval_func(deriv_expr, f"d{stock_name}")
    
    def _make_eval_func(self, expr: str, name: str) -> Callable:
        """Create a callable from a string expression."""
        # Build function code with all 10 stocks
        func_code = f"""
def {name}_func(T, S, D, E, R, I, L, X, V, Q, p, t, **kwargs):
    T_target = kwargs.get('T_target', 0)
    S_target = kwargs.get('S_target', 0)
    D_target = kwargs.get('D_target', 0)
    E_target = kwargs.get('E_target', 0)
    R_target = kwargs.get('R_target', 0)
    I_target = kwargs.get('I_target', 0)
    L_target = kwargs.get('L_target', 0)
    X_target = kwargs.get('X_target', 0)
    V_target = kwargs.get('V_target', 0)
    Q_target = kwargs.get('Q_target', 0)
    return {expr}
"""
        # Execute to define function
        local_ns = {}
        exec(func_code, self.globals, local_ns)
        return local_ns[f"{name}_func"]
    
    def compute_targets(self, state_vals: dict, params: dict, t: float = 0) -> dict:
        """Compute all target values."""
        targets = {}
        for stock_name, func in self._compiled_targets.items():
            targets[f"{stock_name}_target"] = func(
                T=state_vals.get("T", 0),
                S=state_vals.get("S", 0),
                D=state_vals.get("D", 0),
                E=state_vals.get("E", 0),
                R=state_vals.get("R", 0),
                I=state_vals.get("I", 0),
                L=state_vals.get("L", 0),
                X=state_vals.get("X", 0),
                V=state_vals.get("V", 0),
                Q=state_vals.get("Q", 0),
                p=params,
                t=t
            )
        return targets
    
    def compute_derivatives(self, state_vals: dict, params: dict, t: float = 0) -> dict:
        """Compute all derivatives (dX/dt for each stock)."""
        # First compute targets
        targets = self.compute_targets(state_vals, params, t)
        
        derivatives = {}
        for stock_name, func in self._compiled_derivatives.items():
            derivatives[stock_name] = func(
                T=state_vals.get("T", 0),
                S=state_vals.get("S", 0),
                D=state_vals.get("D", 0),
                E=state_vals.get("E", 0),
                R=state_vals.get("R", 0),
                I=state_vals.get("I", 0),
                L=state_vals.get("L", 0),
                X=state_vals.get("X", 0),
                V=state_vals.get("V", 0),
                Q=state_vals.get("Q", 0),
                p=params,
                t=t,
                **targets
            )
        return derivatives
    
    def get_graph_structure(self) -> dict:
        """Extract graph structure for visualization."""
        nodes = []
        edges = []
        
        # Add stock nodes
        for stock_name, stock_def in self.stocks.items():
            nodes.append({
                "id": stock_name,
                "type": "stock",
                "label": stock_def.get("name", stock_name),
                "description": stock_def.get("description", "")
            })
        
        # Add flow edges
        for flow_id, flow_def in self.flows.items():
            from_node = flow_def.get("from")
            to_node = flow_def.get("to")
            
            if from_node and to_node:
                edges.append({
                    "id": flow_id,
                    "source": from_node,
                    "target": to_node,
                    "coefficient": flow_def.get("coefficient", "1"),
                    "label": flow_def.get("description", flow_id),
                    "type": "positive" if not str(flow_def.get("coefficient", "1")).startswith("-") else "negative"
                })
        
        return {"nodes": nodes, "edges": edges}


class DynamicODEEngine:
    """
    Builds and solves ODEs dynamically from config.
    Uses ExpressionEngine to evaluate string equations.
    """
    
    def __init__(self, config: dict = None, config_dir: str = None):
        if config:
            self.config = config
        else:
            loader = ConfigLoader(config_dir)
            self.config = loader.load_all()
        
        self.states = {k: v for k, v in self.config["states"].items() if not k.startswith("_")}
        self.state_names = list(self.states.keys())
        self.n_states = len(self.state_names)
        
        # Build flat parameter dict from nested structure
        self.default_params = self._build_params()
        
        # Parse relations (for backward compatibility)
        self.relations = self.config.get("relations", {}).get("relations", [])
        self.link_params = self.config.get("relations", {}).get("link_parameters", {})
        
        # Merge link params into default params
        for k, v in self.link_params.items():
            self.default_params[k] = v["value"]
        
        # Initialize expression engine if equations config exists
        self.expr_engine = None
        if self.config.get("equations") and self.config["equations"].get("stocks"):
            self.expr_engine = ExpressionEngine(self.config["equations"])
    
    def _build_params(self) -> dict:
        """Flatten nested parameter structure into single dict."""
        params = {}
        for category, items in self.config.get("parameters", {}).items():
            if category.startswith("_"):
                continue
            if not isinstance(items, dict):
                continue
            for key, val in items.items():
                if key.startswith("_"):
                    continue
                if isinstance(val, dict) and "value" in val:
                    params[key] = val["value"]
        return params
    
    def get_param_metadata(self) -> dict:
        """Get all parameters with their metadata for UI."""
        metadata = {}
        for category, items in self.config.get("parameters", {}).items():
            if category.startswith("_"):
                continue
            if not isinstance(items, dict):
                continue
            for key, val in items.items():
                if key.startswith("_"):
                    continue
                if isinstance(val, dict):
                    metadata[key] = {**val, "category": category}
        for key, val in self.link_params.items():
            if isinstance(val, dict):
                metadata[key] = {**val, "category": "links"}
        return metadata
    
    def get_initial_conditions(self, overrides: dict = None) -> np.ndarray:
        """Build initial conditions array from config."""
        y0 = np.array([self.states[s]["initial"] for s in self.state_names], dtype=float)
        if overrides:
            for state, val in overrides.items():
                if state in self.state_names:
                    y0[self.state_names.index(state)] = val
        return y0
    
    def get_graph_structure(self) -> dict:
        """Get graph structure for visualization."""
        if self.expr_engine:
            return self.expr_engine.get_graph_structure()
        
        # Fallback: build from relations
        nodes = [{"id": s, "type": "stock", "label": self.states[s].get("name", s)} 
                 for s in self.state_names]
        edges = [{"id": r["id"], "source": r["source"], "target": r["target"], 
                  "coefficient": str(r["coefficient"]), "label": r.get("description", "")}
                 for r in self.relations if r.get("source")]
        return {"nodes": nodes, "edges": edges}
    
    def ode_func(self, t: float, y: np.ndarray, params: dict) -> np.ndarray:
        """ODE function - uses expression engine if available."""
        state_vals = {name: y[i] for i, name in enumerate(self.state_names)}
        
        if self.expr_engine:
            # Use expression engine
            derivs = self.expr_engine.compute_derivatives(state_vals, params, t)
            return np.array([derivs.get(s, 0) for s in self.state_names], dtype=float)
        
        # Fallback to hardcoded logic
        dy = np.zeros(self.n_states, dtype=float)
        for i, state in enumerate(self.state_names):
            target = self._compute_target_fallback(state, state_vals, params)
            speed_key = f"k{state}"
            speed = params.get(speed_key, 0.5)
            dy[i] = speed * (target - y[i])
        return dy
    
    def _compute_target_fallback(self, target_state: str, state_vals: dict, params: dict) -> float:
        """Fallback target computation from relations."""
        total = 0.0
        for rel in self.relations:
            if rel["target"] != target_state:
                continue
            coef = rel["coefficient"]
            if "param_key" in rel and rel["param_key"] in params:
                coef = params[rel["param_key"]]
            source = rel.get("source")
            if source is None:
                val = coef
            else:
                source_val = state_vals.get(source, 0)
                if rel.get("transform") == "invert":
                    source_val = 1 - source_val
                val = coef * source_val
            total += val
        if target_state == "T" and "ai_boost" in params:
            total += params["ai_boost"]
        return np.clip(total, 0, 1)
    
    def simulate(self, scenario_name: str = None, param_overrides: dict = None,
                 initial_overrides: dict = None) -> dict:
        """Run simulation with optional scenario or manual overrides."""
        params = self.default_params.copy()
        initials = {}
        
        if scenario_name and scenario_name in self.config.get("scenarios", {}):
            scenario = self.config["scenarios"][scenario_name]
            params.update(scenario.get("param_overrides", {}))
            initials.update(scenario.get("initial_overrides", {}))
        
        if param_overrides:
            params.update(param_overrides)
        if initial_overrides:
            initials.update(initial_overrides)
        
        y0 = self.get_initial_conditions(initials)
        sim_config = self.config.get("simulation", {"t_end": 60, "steps": 500})
        t_eval = np.linspace(0, sim_config["t_end"], sim_config["steps"])
        
        sol = solve_ivp(
            fun=lambda t, y: self.ode_func(t, y, params),
            t_span=(0, sim_config["t_end"]),
            y0=y0,
            t_eval=t_eval,
            method=sim_config.get("method", "RK45")
        )
        
        return {
            "t": sol.t.tolist(),
            "states": {name: sol.y[i].tolist() for i, name in enumerate(self.state_names)},
            "params": params,
            "initial": y0.tolist()
        }
    
    def simulate_all_scenarios(self) -> dict:
        """Simulate all defined scenarios."""
        results = {}
        for name in self.config.get("scenarios", {}):
            results[name] = self.simulate(scenario_name=name)
        return results


if __name__ == "__main__":
    engine = DynamicODEEngine()
    print(f"States: {engine.state_names}")
    print(f"Expression engine: {'enabled' if engine.expr_engine else 'fallback mode'}")
    
    result = engine.simulate("baseline")
    print(f"Simulation points: {len(result['t'])}")
    print(f"Final T: {result['states']['T'][-1]:.3f}")
    
    graph = engine.get_graph_structure()
    print(f"Graph: {len(graph['nodes'])} nodes, {len(graph['edges'])} edges")
