"""
Draft API Endpoints for AeroDyn Model Factory
=============================================

REST API for managing drafts, patches, and live model editing.

Endpoints:
- POST /drafts - Create new draft
- GET /drafts/{draft_id} - Get draft
- PUT /drafts/{draft_id} - Update draft
- DELETE /drafts/{draft_id} - Delete draft
- POST /drafts/{draft_id}/apply - Merge and validate
- POST /drafts/{draft_id}/validate - Validate without applying
- GET /drafts - List all drafts
"""

from fastapi import APIRouter, HTTPException, Body
from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional
import json
import os
from pathlib import Path

# Import our patch system
import sys
sys.path.append(str(Path(__file__).parent.parent))
from models.patch_system import (
    Draft, PatchChange, PatchOperation, PatchMerger, 
    create_draft, MergeResult
)
from models.equation_dsl import EquationDSL, create_validator_from_config

router = APIRouter(prefix="/drafts", tags=["drafts"])

# Configuration
DRAFTS_DIR = Path(__file__).parent.parent / "config" / "drafts"
DRAFTS_DIR.mkdir(exist_ok=True)

CONFIG_DIR = Path(__file__).parent.parent / "config"


# Pydantic models for API
class PatchChangeRequest(BaseModel):
    """Request model for a patch change"""
    op: str
    symbol: Optional[str] = None
    id: Optional[str] = None
    data: Dict[str, Any] = Field(default_factory=dict)
    reason: Optional[str] = None


class CreateDraftRequest(BaseModel):
    """Request to create a new draft"""
    description: Optional[str] = None
    based_on_version: Optional[str] = None


class UpdateDraftRequest(BaseModel):
    """Request to update a draft"""
    description: Optional[str] = None
    changes: Optional[List[PatchChangeRequest]] = None
    metadata: Optional[Dict[str, Any]] = None


class ValidateRequest(BaseModel):
    """Request to validate equations"""
    equations: Dict[str, str]


class MergeResponse(BaseModel):
    """Response from merge operation"""
    success: bool
    effective_model: Optional[Dict[str, Any]] = None
    errors: List[str] = Field(default_factory=list)
    warnings: List[str] = Field(default_factory=list)
    applied_changes: int = 0
    skipped_changes: int = 0


def load_base_model() -> Dict[str, Any]:
    """Load the base model from config files"""
    base_model = {
        "states": {},
        "parameters": {},
        "relations": [],
        "equations": {},
        "scenarios": {},
        "simulation": {}
    }
    
    # Load each config file
    config_files = {
        "states": "aerodyn_states.json",
        "parameters": "aerodyn_parameters.json",
        "relations": "aerodyn_relations.json",
        "equations": "aerodyn_equations.json",
        "scenarios": "scenarios.json",
        "simulation": "simulation.json"
    }
    
    for key, filename in config_files.items():
        filepath = CONFIG_DIR / filename
        if filepath.exists():
            with open(filepath, 'r') as f:
                base_model[key] = json.load(f)
    
    return base_model


@router.post("", response_model=Dict[str, Any])
async def create_new_draft(request: CreateDraftRequest):
    """
    Create a new draft.
    
    Returns the draft ID and initial structure.
    """
    draft = create_draft(
        description=request.description or "",
        based_on_version=request.based_on_version
    )
    
    # Save to disk
    filepath = DRAFTS_DIR / f"{draft.draft_id}.json"
    draft.save(str(filepath))
    
    return draft.to_dict()


@router.get("/{draft_id}", response_model=Dict[str, Any])
async def get_draft(draft_id: str):
    """
    Get a draft by ID.
    """
    filepath = DRAFTS_DIR / f"{draft_id}.json"
    
    if not filepath.exists():
        raise HTTPException(status_code=404, detail=f"Draft {draft_id} not found")
    
    draft = Draft.load(str(filepath))
    return draft.to_dict()


@router.get("", response_model=List[Dict[str, Any]])
async def list_drafts():
    """
    List all drafts.
    """
    drafts = []
    
    for filepath in DRAFTS_DIR.glob("*.json"):
        try:
            draft = Draft.load(str(filepath))
            drafts.append({
                "draft_id": draft.draft_id,
                "created_at": draft.created_at,
                "description": draft.description,
                "num_changes": len(draft.changes)
            })
        except Exception as e:
            print(f"Error loading draft {filepath}: {e}")
    
    return sorted(drafts, key=lambda d: d["created_at"], reverse=True)


@router.put("/{draft_id}", response_model=Dict[str, Any])
async def update_draft(draft_id: str, request: UpdateDraftRequest):
    """
    Update a draft.
    
    Can update description, changes, or metadata.
    """
    filepath = DRAFTS_DIR / f"{draft_id}.json"
    
    if not filepath.exists():
        raise HTTPException(status_code=404, detail=f"Draft {draft_id} not found")
    
    draft = Draft.load(str(filepath))
    
    # Update fields
    if request.description is not None:
        draft.description = request.description
    
    if request.changes is not None:
        draft.changes = [
            PatchChange(
                op=PatchOperation(c.op),
                symbol=c.symbol,
                id=c.id,
                data=c.data,
                reason=c.reason
            )
            for c in request.changes
        ]
    
    if request.metadata is not None:
        draft.metadata.update(request.metadata)
    
    # Save
    draft.save(str(filepath))
    
    return draft.to_dict()


@router.delete("/{draft_id}")
async def delete_draft(draft_id: str):
    """
    Delete a draft.
    """
    filepath = DRAFTS_DIR / f"{draft_id}.json"
    
    if not filepath.exists():
        raise HTTPException(status_code=404, detail=f"Draft {draft_id} not found")
    
    filepath.unlink()
    
    return {"message": f"Draft {draft_id} deleted"}


@router.post("/{draft_id}/validate", response_model=MergeResponse)
async def validate_draft(draft_id: str):
    """
    Validate a draft without applying it.
    
    Checks:
    - Merge succeeds
    - All equations are valid DSL
    - No circular dependencies
    - All references exist
    """
    filepath = DRAFTS_DIR / f"{draft_id}.json"
    
    if not filepath.exists():
        raise HTTPException(status_code=404, detail=f"Draft {draft_id} not found")
    
    draft = Draft.load(str(filepath))
    base_model = load_base_model()
    
    # Merge
    merger = PatchMerger(base_model)
    merge_result = merger.merge(draft)
    
    if not merge_result.success:
        return MergeResponse(
            success=False,
            errors=merge_result.errors,
            warnings=merge_result.warnings,
            applied_changes=len(merge_result.applied_changes),
            skipped_changes=len(merge_result.skipped_changes)
        )
    
    # Validate equations with DSL
    effective_model = merge_result.effective_model
    validator = create_validator_from_config(effective_model)
    
    equation_errors = []
    for symbol, eq_data in effective_model.get("equations", {}).items():
        # Validate target expression
        if "target_expr" in eq_data:
            result = validator.validate(eq_data["target_expr"])
            if not result.valid:
                equation_errors.append(f"Invalid target equation for {symbol}: {result.errors}")
        
        # Validate rate expression
        if "rate_expr" in eq_data:
            result = validator.validate(eq_data["rate_expr"])
            if not result.valid:
                equation_errors.append(f"Invalid rate equation for {symbol}: {result.errors}")
    
    if equation_errors:
        return MergeResponse(
            success=False,
            errors=equation_errors,
            warnings=merge_result.warnings,
            applied_changes=len(merge_result.applied_changes),
            skipped_changes=len(merge_result.skipped_changes)
        )
    
    return MergeResponse(
        success=True,
        effective_model=effective_model,
        warnings=merge_result.warnings,
        applied_changes=len(merge_result.applied_changes),
        skipped_changes=len(merge_result.skipped_changes)
    )


@router.post("/{draft_id}/apply", response_model=MergeResponse)
async def apply_draft(draft_id: str, commit: bool = False):
    """
    Apply a draft to create effective model.
    
    If commit=True, writes the effective model back to config files.
    Otherwise, just returns the merged model for simulation.
    """
    # First validate
    validation_result = await validate_draft(draft_id)
    
    if not validation_result.success:
        return validation_result
    
    # If commit requested, write back to config files
    if commit:
        effective_model = validation_result.effective_model
        
        # Write each section back
        config_files = {
            "states": "aerodyn_states.json",
            "parameters": "aerodyn_parameters.json",
            "relations": "aerodyn_relations.json",
            "equations": "aerodyn_equations.json",
            "scenarios": "scenarios.json",
            "simulation": "simulation.json"
        }
        
        for key, filename in config_files.items():
            if key in effective_model:
                filepath = CONFIG_DIR / filename
                with open(filepath, 'w') as f:
                    json.dump(effective_model[key], f, indent=2)
        
        validation_result.warnings.append("Changes committed to config files")
    
    return validation_result


@router.post("/{draft_id}/add-change")
async def add_change_to_draft(draft_id: str, change: PatchChangeRequest):
    """
    Add a single change to a draft.
    """
    filepath = DRAFTS_DIR / f"{draft_id}.json"
    
    if not filepath.exists():
        raise HTTPException(status_code=404, detail=f"Draft {draft_id} not found")
    
    draft = Draft.load(str(filepath))
    
    # Add change
    patch_change = PatchChange(
        op=PatchOperation(change.op),
        symbol=change.symbol,
        id=change.id,
        data=change.data,
        reason=change.reason
    )
    draft.add_change(patch_change)
    
    # Save
    draft.save(str(filepath))
    
    return {"message": "Change added", "num_changes": len(draft.changes)}


@router.delete("/{draft_id}/changes/{change_index}")
async def remove_change_from_draft(draft_id: str, change_index: int):
    """
    Remove a change from a draft by index.
    """
    filepath = DRAFTS_DIR / f"{draft_id}.json"
    
    if not filepath.exists():
        raise HTTPException(status_code=404, detail=f"Draft {draft_id} not found")
    
    draft = Draft.load(str(filepath))
    
    if change_index < 0 or change_index >= len(draft.changes):
        raise HTTPException(status_code=400, detail="Invalid change index")
    
    draft.remove_change(change_index)
    draft.save(str(filepath))
    
    return {"message": "Change removed", "num_changes": len(draft.changes)}


@router.post("/validate-equation")
async def validate_equation(request: ValidateRequest):
    """
    Validate equation expressions without creating a draft.
    
    Useful for real-time validation in the UI.
    """
    base_model = load_base_model()
    validator = create_validator_from_config(base_model)
    
    results = {}
    
    for symbol, expression in request.equations.items():
        validation = validator.validate(expression)
        results[symbol] = {
            "valid": validation.valid,
            "errors": validation.errors,
            "warnings": validation.warnings,
            "dependencies": list(validation.dependencies)
        }
    
    return results


# Health check
@router.get("/health")
async def health_check():
    """Check if draft system is operational"""
    return {
        "status": "ok",
        "drafts_dir": str(DRAFTS_DIR),
        "num_drafts": len(list(DRAFTS_DIR.glob("*.json")))
    }
