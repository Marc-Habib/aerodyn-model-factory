"""
Dynamic ODE Engine V2 - Fully Parameterizable from model.json
NO HARDCODED VALUES - Everything driven by configuration
"""

import json
import numpy as np
from scipy.integrate import solve_ivp
from pathlib import Path
from typing import Dict, List, Any, Callable


def clamp(x: float, lo: float, hi: float) -> float:
    """Clamp value between lo and hi."""
    return float(np.clip(x, lo, hi))


class ModelEngine:
    """
    Fully dynamic system dynamics engine.
    Reads EVERYTHING from model.json - no hardcoded stock names or equations.
    """
    
    def __init__(self, config_path: str = None):
        if config_path is None:
            config_path = Path(__file__).parent.parent / "config" / "model.json"
        
        with open(config_path, "r") as f:
            self.config = json.load(f)
        
        # Extract model components dynamically
        self.meta = self.config["meta"]
        self.stocks = self.config["stocks"]
        self.parameters = self.config["parameters"]
        self.equations = self.config["equations"]
        self.scenarios = self.config["scenarios"]
        self.kpis = self.config["kpis"]
        self.feedback_loops = self.config["feedback_loops"]
        self.insights_rules = self.config["insights_rules"]
        
        # Build dynamic lists
        self.stock_ids = list(self.stocks.keys())
        self.n_stocks = len(self.stock_ids)
        
        # Build default parameter dict
        self.default_params = {k: v["value"] for k, v in self.parameters.items()}
        
        # Build global namespace for equation evaluation
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
        
        # Compile equations
        self._compiled_targets = {}
        self._compiled_derivatives = {}
        self._compile_equations()
    
    def _compile_equations(self):
        """Compile target and derivative equations for all stocks."""
        for stock_id in self.stock_ids:
            eq = self.equations[stock_id]
            
            # Build function signature dynamically from all stock IDs
            stock_args = ", ".join(self.stock_ids)
            
            # Compile target equation
            target_code = f"""
def {stock_id}_target_func({stock_args}, p, t):
    return {eq['target']}
"""
            local_ns = {}
            exec(target_code, self.globals, local_ns)
            self._compiled_targets[stock_id] = local_ns[f"{stock_id}_target_func"]
            
            # Compile derivative equation
            deriv_code = f"""
def {stock_id}_deriv_func({stock_args}, p, t, {stock_id}_target):
    return {eq['derivative']}
"""
            local_ns = {}
            exec(deriv_code, self.globals, local_ns)
            self._compiled_derivatives[stock_id] = local_ns[f"{stock_id}_deriv_func"]
    
    def get_initial_conditions(self, overrides: dict = None) -> np.ndarray:
        """Build initial conditions array from config."""
        y0 = np.array([self.stocks[s]["initial"] for s in self.stock_ids], dtype=float)
        if overrides:
            for stock_id, val in overrides.items():
                if stock_id in self.stock_ids:
                    y0[self.stock_ids.index(stock_id)] = val
        return y0
    
    def ode_func(self, t: float, y: np.ndarray, params: dict) -> np.ndarray:
        """ODE function - fully dynamic."""
        # Build state dict
        state_vals = {stock_id: y[i] for i, stock_id in enumerate(self.stock_ids)}
        
        # Compute all targets
        targets = {}
        for stock_id, func in self._compiled_targets.items():
            targets[stock_id] = func(**state_vals, p=params, t=t)
        
        # Compute all derivatives
        derivs = []
        for stock_id, func in self._compiled_derivatives.items():
            deriv = func(**state_vals, p=params, t=t, **{f"{stock_id}_target": targets[stock_id]})
            derivs.append(deriv)
        
        return np.array(derivs, dtype=float)
    
    def simulate(self, scenario_name: str = None, param_overrides: dict = None,
                 initial_overrides: dict = None) -> dict:
        """Run simulation with optional scenario or manual overrides."""
        params = self.default_params.copy()
        initials = {}
        
        # Apply scenario
        if scenario_name and scenario_name in self.scenarios:
            scenario = self.scenarios[scenario_name]
            params.update(scenario.get("param_overrides", {}))
            initials.update(scenario.get("initial_overrides", {}))
        
        # Apply manual overrides
        if param_overrides:
            params.update(param_overrides)
        if initial_overrides:
            initials.update(initial_overrides)
        
        # Get initial conditions
        y0 = self.get_initial_conditions(initials)
        
        # Get simulation config
        sim_config = self.config["simulation"]
        t_eval = np.linspace(sim_config["t_start"], sim_config["t_end"], sim_config["steps"])
        
        # Solve ODE
        sol = solve_ivp(
            fun=lambda t, y: self.ode_func(t, y, params),
            t_span=(sim_config["t_start"], sim_config["t_end"]),
            y0=y0,
            t_eval=t_eval,
            method=sim_config["method"]
        )
        
        return {
            "t": sol.t.tolist(),
            "states": {stock_id: sol.y[i].tolist() for i, stock_id in enumerate(self.stock_ids)},
            "params": params,
            "initial": y0.tolist()
        }
    
    def simulate_all_scenarios(self) -> dict:
        """Simulate all defined scenarios."""
        results = {}
        for name in self.scenarios:
            results[name] = self.simulate(scenario_name=name)
        return results
    
    def get_graph_structure(self) -> dict:
        """Build graph structure for visualization."""
        nodes = []
        edges = []
        
        # Add stock nodes with full metadata
        for stock_id, stock_def in self.stocks.items():
            nodes.append({
                "id": stock_id,
                "type": "stock",
                "label": stock_def["name"],
                "short": stock_def["short"],
                "category": stock_def["category"],
                "description": stock_def["description"],
                "business_meaning": stock_def["business_meaning"],
                "color": self.config["categories"][stock_def["category"]]["color"]
            })
        
        # Parse equations to extract edges
        # This is a simplified approach - in production you'd want more robust parsing
        for stock_id, eq in self.equations.items():
            target_expr = eq["target"]
            # Extract stock references (simple regex approach)
            for other_id in self.stock_ids:
                if other_id != stock_id and other_id in target_expr:
                    # Determine if positive or negative influence
                    # This is simplified - real implementation would parse the expression
                    edge_type = "positive"
                    if f"- {other_id}" in target_expr or f"(1 - {other_id})" in target_expr:
                        edge_type = "negative"
                    
                    edges.append({
                        "id": f"{other_id}_to_{stock_id}",
                        "source": other_id,
                        "target": stock_id,
                        "type": edge_type,
                        "label": f"{other_id} → {stock_id}"
                    })
        
        return {"nodes": nodes, "edges": edges}
    
    def calculate_kpis(self, result: dict) -> dict:
        """Calculate KPIs from simulation results."""
        kpi_values = {}
        
        for kpi_id, kpi_def in self.kpis.items():
            formula = kpi_def["formula"]
            
            # Get final values of all stocks
            final_idx = len(result["t"]) - 1
            initial_idx = 0
            
            # Build namespace for formula evaluation
            namespace = {}
            for stock_id in self.stock_ids:
                namespace[stock_id] = result["states"][stock_id][final_idx]
                namespace[f"{stock_id}_initial"] = result["states"][stock_id][initial_idx]
            
            # Evaluate formula
            try:
                value = eval(formula, self.globals, namespace)
                
                # Determine status
                if kpi_def.get("higher_is_better", True):
                    if value >= kpi_def["good_threshold"]:
                        status = "good"
                    elif value >= kpi_def["warning_threshold"]:
                        status = "warning"
                    else:
                        status = "danger"
                else:
                    if value <= kpi_def["good_threshold"]:
                        status = "good"
                    elif value <= kpi_def["warning_threshold"]:
                        status = "warning"
                    else:
                        status = "danger"
                
                # Calculate change
                initial_value = eval(formula, self.globals, {
                    **{stock_id: result["states"][stock_id][initial_idx] for stock_id in self.stock_ids},
                    **{f"{stock_id}_initial": result["states"][stock_id][initial_idx] for stock_id in self.stock_ids}
                })
                change = ((value - initial_value) / (initial_value if initial_value != 0 else 1)) * 100
                
                kpi_values[kpi_id] = {
                    "value": value,
                    "change": change,
                    "status": status,
                    "name": kpi_def["name"],
                    "description": kpi_def["description"],
                    "business_meaning": kpi_def["business_meaning"]
                }
            except Exception as e:
                kpi_values[kpi_id] = {
                    "value": 0,
                    "change": 0,
                    "status": "warning",
                    "error": str(e)
                }
        
        return kpi_values
    
    def generate_insights(self, result: dict, scenario_name: str) -> list:
        """Generate insights from rules in config."""
        insights = []
        
        final_idx = len(result["t"]) - 1
        initial_idx = 0
        
        # Build namespace for condition evaluation
        namespace = {}
        for stock_id in self.stock_ids:
            namespace[stock_id] = result["states"][stock_id][final_idx]
            namespace[f"{stock_id}_initial"] = result["states"][stock_id][initial_idx]
        
        # Add KPIs to namespace
        kpis = self.calculate_kpis(result)
        for kpi_id, kpi_data in kpis.items():
            namespace[kpi_id] = kpi_data["value"]
            namespace[f"{kpi_id}_initial"] = eval(
                self.kpis[kpi_id]["formula"],
                self.globals,
                {stock_id: result["states"][stock_id][initial_idx] for stock_id in self.stock_ids}
            )
        
        # Evaluate each rule
        for rule in self.insights_rules:
            try:
                condition_met = eval(rule["condition"], self.globals, namespace)
                if condition_met:
                    # Format template with values
                    template = rule["template"]
                    for key, val in namespace.items():
                        if isinstance(val, (int, float)):
                            template = template.replace(f"{{{key}_percent}}", f"{int(val * 100)}")
                            template = template.replace(f"{{{key}}}", f"{val:.2f}")
                    
                    insights.append({
                        "type": rule["type"],
                        "title": rule["title"],
                        "description": template,
                        "impact": rule["impact"],
                        "recommendation": rule.get("recommendation", "")
                    })
            except Exception:
                pass  # Skip rules that fail to evaluate
        
        return insights[:3]  # Return top 3 insights


if __name__ == "__main__":
    engine = ModelEngine()
    print(f"Model: {engine.meta['name']}")
    print(f"Stocks: {engine.stock_ids}")
    print(f"Scenarios: {list(engine.scenarios.keys())}")
    
    result = engine.simulate("baseline")
    print(f"Simulation points: {len(result['t'])}")
    
    kpis = engine.calculate_kpis(result)
    print(f"KPIs: {list(kpis.keys())}")
    
    insights = engine.generate_insights(result, "baseline")
    print(f"Insights: {len(insights)}")
