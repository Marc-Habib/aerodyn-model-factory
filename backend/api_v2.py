"""
FastAPI Backend V2 - Uses new dynamic engine
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Optional, Any, List
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))
from models.engine_v2 import ModelEngine
from backend.draft_api import router as draft_router
from backend.ai_service import create_ai_service

app = FastAPI(title="AeroDyn API v2", version="2.0.0")

# Initialize AI service
try:
    ai_service = create_ai_service()
    AI_AVAILABLE = ai_service.client.check_health()
except Exception:
    AI_AVAILABLE = False
    ai_service = None

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

engine = ModelEngine()

# Include draft/patch system router
app.include_router(draft_router)


class SimulationRequest(BaseModel):
    scenario: Optional[str] = None
    param_overrides: Optional[Dict[str, float]] = None
    initial_overrides: Optional[Dict[str, float]] = None


@app.get("/")
def root():
    return {"status": "ok", "service": "AeroDyn Systems API V2", "model": engine.meta["name"]}


@app.get("/model/meta")
def get_model_meta():
    """Get model metadata and context."""
    return engine.meta


@app.get("/model/config")
def get_full_config():
    """Get complete model configuration."""
    return engine.config


@app.get("/config/stocks")
def get_stocks():
    """Get all stock definitions."""
    return engine.stocks


@app.get("/config/parameters")
def get_parameters():
    """Get all parameters."""
    return engine.parameters


@app.get("/config/scenarios")
def get_scenarios():
    """Get all scenarios."""
    return engine.scenarios


@app.get("/config/kpis")
def get_kpis():
    """Get KPI definitions."""
    return engine.kpis


@app.get("/config/full")
def get_full_config_compat():
    """Get complete configuration (compatibility endpoint)."""
    return {
        "states": engine.stocks,
        "parameters": engine.parameters,
        "relations": [],  # Relations are embedded in equations now
        "scenarios": engine.scenarios,
        "simulation": engine.config["simulation"]
    }


@app.get("/equations")
def get_equations():
    """Get equations config (compatibility endpoint)."""
    return {
        "stocks": engine.config["equations"]
    }


@app.get("/config/feedback-loops")
def get_feedback_loops():
    """Get feedback loop definitions."""
    return engine.feedback_loops


@app.post("/simulate")
def simulate(request: SimulationRequest):
    """Run a simulation."""
    try:
        result = engine.simulate(
            scenario_name=request.scenario,
            param_overrides=request.param_overrides,
            initial_overrides=request.initial_overrides
        )
        
        # Add KPIs and insights
        result["kpis"] = engine.calculate_kpis(result)
        result["insights"] = engine.generate_insights(result, request.scenario or "custom")
        
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/simulate/{scenario_name}")
def simulate_scenario(scenario_name: str):
    """Run simulation for a specific scenario."""
    if scenario_name not in engine.scenarios:
        raise HTTPException(status_code=404, detail=f"Scenario '{scenario_name}' not found")
    
    result = engine.simulate(scenario_name=scenario_name)
    result["kpis"] = engine.calculate_kpis(result)
    result["insights"] = engine.generate_insights(result, scenario_name)
    
    return result


@app.get("/simulate-all")
def simulate_all():
    """Simulate all scenarios."""
    results = engine.simulate_all_scenarios()
    
    # Add KPIs and insights for each
    for name, result in results.items():
        result["kpis"] = engine.calculate_kpis(result)
        result["insights"] = engine.generate_insights(result, name)
    
    return results


@app.get("/graph")
def get_graph():
    """Get graph structure for visualization."""
    return engine.get_graph_structure()


@app.post("/reload")
def reload_config():
    """Reload configuration from files."""
    global engine
    engine = ModelEngine()
    return {"status": "reloaded", "model": engine.meta["name"]}


class AIPatchRequest(BaseModel):
    prompt: str
    selected_nodes: Optional[List[str]] = None
    context: Optional[str] = None


@app.post("/ai/generate-patch")
def generate_ai_patch(request: AIPatchRequest):
    """
    Generate a model patch using AI based on natural language prompt.
    
    Requires Ollama to be running with llama3.1:8b model.
    """
    if not AI_AVAILABLE or ai_service is None:
        raise HTTPException(
            status_code=503,
            detail="AI service not available. Please install Ollama and run: ollama pull llama3.1:8b"
        )
    
    try:
        # Get current model state
        current_model = engine.config
        
        # Generate patch
        patch = ai_service.generate_patch(
            prompt=request.prompt,
            current_model=current_model,
            selected_nodes=request.selected_nodes,
            context=request.context
        )
        
        return {
            "success": True,
            "patch": patch,
            "model_used": ai_service.client.config.model
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI generation failed: {str(e)}")


@app.get("/ai/status")
def get_ai_status():
    """Check if AI service is available."""
    return {
        "available": AI_AVAILABLE,
        "model": ai_service.client.config.model if ai_service else None,
        "ollama_url": ai_service.client.config.ollama_url if ai_service else None
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
