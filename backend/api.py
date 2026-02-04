"""
FastAPI Backend for System Dynamics Model Explorer
Serves simulation results and config to React frontend
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Optional, Any
import sys
from pathlib import Path

# Add models to path
sys.path.insert(0, str(Path(__file__).parent.parent))
from models.engine import DynamicODEEngine, ConfigLoader

app = FastAPI(title="AeroDyn Systems API", version="1.0.0")

# CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize engine
engine = DynamicODEEngine()


class SimulationRequest(BaseModel):
    scenario: Optional[str] = None
    param_overrides: Optional[Dict[str, float]] = None
    initial_overrides: Optional[Dict[str, float]] = None


class ScenarioCreate(BaseModel):
    name: str
    description: str = ""
    param_overrides: Dict[str, float] = {}
    initial_overrides: Dict[str, float] = {}


@app.get("/")
def root():
    return {"status": "ok", "service": "AeroDyn Systems API"}


@app.get("/config/states")
def get_states():
    """Get all state definitions."""
    return engine.states


@app.get("/config/parameters")
def get_parameters():
    """Get all parameters with metadata."""
    return engine.get_param_metadata()


@app.get("/config/relations")
def get_relations():
    """Get all relations."""
    return engine.relations


@app.get("/config/scenarios")
def get_scenarios():
    """Get all scenarios."""
    return engine.config["scenarios"]


@app.get("/config/full")
def get_full_config():
    """Get complete configuration."""
    return {
        "states": engine.states,
        "parameters": engine.get_param_metadata(),
        "relations": engine.relations,
        "scenarios": engine.config["scenarios"],
        "simulation": engine.config["simulation"]
    }


@app.post("/simulate")
def simulate(request: SimulationRequest):
    """Run a simulation."""
    try:
        result = engine.simulate(
            scenario_name=request.scenario,
            param_overrides=request.param_overrides,
            initial_overrides=request.initial_overrides
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/simulate/{scenario_name}")
def simulate_scenario(scenario_name: str):
    """Run simulation for a specific scenario."""
    if scenario_name not in engine.config["scenarios"]:
        raise HTTPException(status_code=404, detail=f"Scenario '{scenario_name}' not found")
    return engine.simulate(scenario_name=scenario_name)


@app.get("/simulate-all")
def simulate_all():
    """Simulate all scenarios."""
    return engine.simulate_all_scenarios()


@app.post("/scenarios")
def create_scenario(scenario: ScenarioCreate):
    """Create a new scenario (in memory only)."""
    engine.config["scenarios"][scenario.name] = {
        "name": scenario.name,
        "description": scenario.description,
        "param_overrides": scenario.param_overrides,
        "initial_overrides": scenario.initial_overrides
    }
    return {"status": "created", "scenario": scenario.name}


@app.put("/scenarios/{name}")
def update_scenario(name: str, scenario: ScenarioCreate):
    """Update an existing scenario."""
    if name not in engine.config["scenarios"]:
        raise HTTPException(status_code=404, detail=f"Scenario '{name}' not found")
    engine.config["scenarios"][name] = {
        "name": scenario.name,
        "description": scenario.description,
        "param_overrides": scenario.param_overrides,
        "initial_overrides": scenario.initial_overrides
    }
    return {"status": "updated", "scenario": name}


@app.delete("/scenarios/{name}")
def delete_scenario(name: str):
    """Delete a scenario."""
    if name not in engine.config["scenarios"]:
        raise HTTPException(status_code=404, detail=f"Scenario '{name}' not found")
    del engine.config["scenarios"][name]
    return {"status": "deleted", "scenario": name}


@app.get("/graph")
def get_graph():
    """Get graph structure for visualization."""
    return engine.get_graph_structure()


@app.get("/equations")
def get_equations():
    """Get equations config."""
    return engine.config.get("equations", {})


@app.post("/reload")
def reload_config():
    """Reload configuration from files."""
    global engine
    engine = DynamicODEEngine()
    return {"status": "reloaded"}


@app.post("/scenarios/save")
def save_scenarios_to_file():
    """Save current scenarios to JSON file."""
    import json
    scenarios_path = Path(__file__).parent.parent / "config" / "scenarios.json"
    with open(scenarios_path, "w") as f:
        json.dump(engine.config["scenarios"], f, indent=2)
    return {"status": "saved", "path": str(scenarios_path)}


@app.put("/scenarios/{name}/overrides")
def update_scenario_overrides(name: str, scenario: ScenarioCreate):
    """Update scenario and persist to file."""
    if name not in engine.config["scenarios"]:
        engine.config["scenarios"][name] = {}
    
    engine.config["scenarios"][name] = {
        "name": scenario.name,
        "description": scenario.description,
        "param_overrides": scenario.param_overrides,
        "initial_overrides": scenario.initial_overrides
    }
    
    # Auto-save to file
    import json
    scenarios_path = Path(__file__).parent.parent / "config" / "scenarios.json"
    with open(scenarios_path, "w") as f:
        json.dump(engine.config["scenarios"], f, indent=2)
    
    return {"status": "updated", "scenario": name}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
