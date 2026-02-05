"""
Patch System for AeroDyn Model Factory
======================================

Implements the draft/patch overlay system for live model editing.

Key concepts:
- Base Model: Immutable source of truth (config/*.json)
- Draft/Patch: Overlay with only diffs (add/modify/remove operations)
- Merge: Deterministic combination of base + patch → effective model
- Validation: Ensures merged model is valid before simulation
"""

import json
import copy
from typing import Dict, Any, List, Optional, Set
from dataclasses import dataclass, field, asdict
from datetime import datetime
from enum import Enum


class PatchOperation(str, Enum):
    """Types of patch operations"""
    ADD_STATE = "add_state"
    REMOVE_STATE = "remove_state"
    UPDATE_STATE = "update_state"
    ADD_RELATION = "add_relation"
    REMOVE_RELATION = "remove_relation"
    UPDATE_RELATION = "update_relation"
    ADD_PARAMETER = "add_parameter"
    REMOVE_PARAMETER = "remove_parameter"
    UPDATE_PARAMETER = "update_parameter"
    ADD_EQUATION = "add_equation"
    UPDATE_EQUATION = "update_equation"
    REMOVE_EQUATION = "remove_equation"
    ADD_SCENARIO = "add_scenario"
    UPDATE_SCENARIO = "update_scenario"
    REMOVE_SCENARIO = "remove_scenario"


@dataclass
class PatchChange:
    """A single change in a patch"""
    op: PatchOperation
    symbol: Optional[str] = None  # State/param symbol (T, S, ai_boost, etc.)
    id: Optional[str] = None  # Stable ID (state.targeting, rel.T_to_L, etc.)
    data: Dict[str, Any] = field(default_factory=dict)
    reason: Optional[str] = None  # Human/AI explanation
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            "op": self.op.value,
            "symbol": self.symbol,
            "id": self.id,
            "data": self.data,
            "reason": self.reason
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'PatchChange':
        """Create from dictionary"""
        return cls(
            op=PatchOperation(data["op"]),
            symbol=data.get("symbol"),
            id=data.get("id"),
            data=data.get("data", {}),
            reason=data.get("reason")
        )


@dataclass
class Draft:
    """A draft containing a list of patch changes"""
    draft_id: str
    created_at: str
    based_on_version: Optional[str] = None
    description: Optional[str] = None
    changes: List[PatchChange] = field(default_factory=list)
    metadata: Dict[str, Any] = field(default_factory=dict)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            "draft_id": self.draft_id,
            "created_at": self.created_at,
            "based_on_version": self.based_on_version,
            "description": self.description,
            "changes": [c.to_dict() for c in self.changes],
            "metadata": self.metadata
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Draft':
        """Create from dictionary"""
        return cls(
            draft_id=data["draft_id"],
            created_at=data["created_at"],
            based_on_version=data.get("based_on_version"),
            description=data.get("description"),
            changes=[PatchChange.from_dict(c) for c in data.get("changes", [])],
            metadata=data.get("metadata", {})
        )
    
    def add_change(self, change: PatchChange):
        """Add a change to the draft"""
        self.changes.append(change)
    
    def remove_change(self, index: int):
        """Remove a change by index"""
        if 0 <= index < len(self.changes):
            self.changes.pop(index)
    
    def save(self, filepath: str):
        """Save draft to JSON file"""
        with open(filepath, 'w') as f:
            json.dump(self.to_dict(), f, indent=2)
    
    @classmethod
    def load(cls, filepath: str) -> 'Draft':
        """Load draft from JSON file"""
        with open(filepath, 'r') as f:
            data = json.load(f)
        return cls.from_dict(data)


@dataclass
class MergeResult:
    """Result of merging base model with draft"""
    success: bool
    effective_model: Optional[Dict[str, Any]] = None
    errors: List[str] = field(default_factory=list)
    warnings: List[str] = field(default_factory=list)
    applied_changes: List[PatchChange] = field(default_factory=list)
    skipped_changes: List[PatchChange] = field(default_factory=list)


class PatchMerger:
    """
    Merges base model with draft patches to create effective model.
    
    This is the core of the "model factory" - it applies changes
    deterministically without modifying the base model or engine.
    """
    
    def __init__(self, base_model: Dict[str, Any]):
        """
        Initialize merger with base model.
        
        Args:
            base_model: The immutable base configuration
        """
        self.base_model = base_model
    
    def merge(self, draft: Draft) -> MergeResult:
        """
        Merge draft changes into base model.
        
        Args:
            draft: Draft containing patch changes
            
        Returns:
            MergeResult with effective model or errors
        """
        result = MergeResult(success=False)
        
        # Deep copy base model to avoid mutations
        effective = copy.deepcopy(self.base_model)
        
        # Apply each change in order
        for change in draft.changes:
            try:
                self._apply_change(effective, change, result)
                result.applied_changes.append(change)
            except Exception as e:
                result.errors.append(f"Failed to apply {change.op} on {change.symbol}: {e}")
                result.skipped_changes.append(change)
        
        # Validate the merged model
        validation_errors = self._validate_model(effective)
        result.errors.extend(validation_errors)
        
        if not result.errors:
            result.success = True
            result.effective_model = effective
        
        return result
    
    def _apply_change(self, model: Dict[str, Any], change: PatchChange, result: MergeResult):
        """Apply a single change to the model"""
        
        if change.op == PatchOperation.ADD_STATE:
            self._add_state(model, change)
        
        elif change.op == PatchOperation.REMOVE_STATE:
            self._remove_state(model, change, result)
        
        elif change.op == PatchOperation.UPDATE_STATE:
            self._update_state(model, change)
        
        elif change.op == PatchOperation.ADD_RELATION:
            self._add_relation(model, change)
        
        elif change.op == PatchOperation.REMOVE_RELATION:
            self._remove_relation(model, change)
        
        elif change.op == PatchOperation.UPDATE_RELATION:
            self._update_relation(model, change)
        
        elif change.op == PatchOperation.ADD_PARAMETER:
            self._add_parameter(model, change)
        
        elif change.op == PatchOperation.REMOVE_PARAMETER:
            self._remove_parameter(model, change)
        
        elif change.op == PatchOperation.UPDATE_PARAMETER:
            self._update_parameter(model, change)
        
        elif change.op == PatchOperation.ADD_EQUATION:
            self._add_equation(model, change)
        
        elif change.op == PatchOperation.UPDATE_EQUATION:
            self._update_equation(model, change)
        
        elif change.op == PatchOperation.REMOVE_EQUATION:
            self._remove_equation(model, change)
        
        elif change.op == PatchOperation.ADD_SCENARIO:
            self._add_scenario(model, change)
        
        elif change.op == PatchOperation.UPDATE_SCENARIO:
            self._update_scenario(model, change)
        
        elif change.op == PatchOperation.REMOVE_SCENARIO:
            self._remove_scenario(model, change)
        
        else:
            raise ValueError(f"Unknown operation: {change.op}")
    
    # State operations
    def _add_state(self, model: Dict[str, Any], change: PatchChange):
        """Add a new state variable"""
        if 'states' not in model:
            model['states'] = {}
        
        if change.symbol in model['states']:
            raise ValueError(f"State {change.symbol} already exists")
        
        model['states'][change.symbol] = change.data
    
    def _remove_state(self, model: Dict[str, Any], change: PatchChange, result: MergeResult):
        """Remove a state variable (cascade delete relations and equations)"""
        if change.symbol not in model.get('states', {}):
            result.warnings.append(f"State {change.symbol} not found, skipping removal")
            return
        
        # Remove state
        del model['states'][change.symbol]
        
        # Cascade: remove relations involving this state
        if 'relations' in model:
            model['relations'] = [
                r for r in model['relations']
                if r.get('source') != change.symbol and r.get('target') != change.symbol
            ]
        
        # Cascade: remove equation
        if 'equations' in model and change.symbol in model['equations']:
            del model['equations'][change.symbol]
        
        result.warnings.append(f"Cascade deleted relations and equation for {change.symbol}")
    
    def _update_state(self, model: Dict[str, Any], change: PatchChange):
        """Update state properties"""
        if change.symbol not in model.get('states', {}):
            raise ValueError(f"State {change.symbol} not found")
        
        model['states'][change.symbol].update(change.data)
    
    # Relation operations
    def _add_relation(self, model: Dict[str, Any], change: PatchChange):
        """Add a new relation"""
        if 'relations' not in model:
            model['relations'] = []
        
        # Check if relation with same ID exists
        if change.id and any(r.get('id') == change.id for r in model['relations']):
            raise ValueError(f"Relation {change.id} already exists")
        
        model['relations'].append(change.data)
    
    def _remove_relation(self, model: Dict[str, Any], change: PatchChange):
        """Remove a relation"""
        if 'relations' not in model:
            return
        
        model['relations'] = [
            r for r in model['relations']
            if r.get('id') != change.id
        ]
    
    def _update_relation(self, model: Dict[str, Any], change: PatchChange):
        """Update relation properties"""
        if 'relations' not in model:
            raise ValueError("No relations in model")
        
        for relation in model['relations']:
            if relation.get('id') == change.id:
                relation.update(change.data)
                return
        
        raise ValueError(f"Relation {change.id} not found")
    
    # Parameter operations
    def _add_parameter(self, model: Dict[str, Any], change: PatchChange):
        """Add a new parameter"""
        if 'parameters' not in model:
            model['parameters'] = {}
        
        if change.symbol in model['parameters']:
            raise ValueError(f"Parameter {change.symbol} already exists")
        
        model['parameters'][change.symbol] = change.data
    
    def _remove_parameter(self, model: Dict[str, Any], change: PatchChange):
        """Remove a parameter"""
        if change.symbol in model.get('parameters', {}):
            del model['parameters'][change.symbol]
    
    def _update_parameter(self, model: Dict[str, Any], change: PatchChange):
        """Update parameter properties"""
        if change.symbol not in model.get('parameters', {}):
            raise ValueError(f"Parameter {change.symbol} not found")
        
        model['parameters'][change.symbol].update(change.data)
    
    # Equation operations
    def _add_equation(self, model: Dict[str, Any], change: PatchChange):
        """Add a new equation"""
        if 'equations' not in model:
            model['equations'] = {}
        
        if change.symbol in model['equations']:
            raise ValueError(f"Equation for {change.symbol} already exists")
        
        model['equations'][change.symbol] = change.data
    
    def _update_equation(self, model: Dict[str, Any], change: PatchChange):
        """Update equation"""
        if 'equations' not in model:
            model['equations'] = {}
        
        if change.symbol not in model['equations']:
            model['equations'][change.symbol] = {}
        
        model['equations'][change.symbol].update(change.data)
    
    def _remove_equation(self, model: Dict[str, Any], change: PatchChange):
        """Remove equation"""
        if change.symbol in model.get('equations', {}):
            del model['equations'][change.symbol]
    
    # Scenario operations
    def _add_scenario(self, model: Dict[str, Any], change: PatchChange):
        """Add a new scenario"""
        if 'scenarios' not in model:
            model['scenarios'] = {}
        
        if change.symbol in model['scenarios']:
            raise ValueError(f"Scenario {change.symbol} already exists")
        
        model['scenarios'][change.symbol] = change.data
    
    def _update_scenario(self, model: Dict[str, Any], change: PatchChange):
        """Update scenario"""
        if change.symbol not in model.get('scenarios', {}):
            raise ValueError(f"Scenario {change.symbol} not found")
        
        model['scenarios'][change.symbol].update(change.data)
    
    def _remove_scenario(self, model: Dict[str, Any], change: PatchChange):
        """Remove scenario"""
        if change.symbol in model.get('scenarios', {}):
            del model['scenarios'][change.symbol]
    
    def _validate_model(self, model: Dict[str, Any]) -> List[str]:
        """
        Validate the merged model for consistency.
        
        Returns:
            List of error messages (empty if valid)
        """
        errors = []
        
        # Check that all relations reference existing states
        states = set(model.get('states', {}).keys())
        for relation in model.get('relations', []):
            source = relation.get('source')
            target = relation.get('target')
            
            if source not in states:
                errors.append(f"Relation {relation.get('id')} references unknown source state: {source}")
            if target not in states:
                errors.append(f"Relation {relation.get('id')} references unknown target state: {target}")
        
        # Check that all states have equations
        equations = set(model.get('equations', {}).keys())
        for state in states:
            if state not in equations:
                errors.append(f"State {state} has no equation defined")
        
        # Check for orphaned equations
        for eq_state in equations:
            if eq_state not in states:
                errors.append(f"Equation for {eq_state} has no corresponding state")
        
        return errors


def create_draft(description: str = "", based_on_version: str = None) -> Draft:
    """
    Create a new empty draft.
    
    Args:
        description: Human-readable description
        based_on_version: Git commit hash or version identifier
        
    Returns:
        New Draft instance
    """
    draft_id = f"draft_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    created_at = datetime.now().isoformat()
    
    return Draft(
        draft_id=draft_id,
        created_at=created_at,
        based_on_version=based_on_version,
        description=description
    )


# Example usage
if __name__ == "__main__":
    # Create a simple base model
    base_model = {
        "states": {
            "T": {"name": "Targeting", "initial": 0.3},
            "S": {"name": "Surveillance", "initial": 0.2}
        },
        "parameters": {
            "kT": {"value": 0.5, "min": 0, "max": 1}
        },
        "relations": [
            {"id": "rel.S_to_T", "source": "S", "target": "T", "coefficient": 0.4}
        ],
        "equations": {
            "T": {"target_expr": "0.4*S", "rate_expr": "p.kT * (T_target - T)"}
        }
    }
    
    # Create a draft
    draft = create_draft("Add market share variable")
    
    # Add changes
    draft.add_change(PatchChange(
        op=PatchOperation.ADD_STATE,
        symbol="M",
        data={
            "name": "Market Share",
            "initial": 0.2,
            "category": "market"
        },
        reason="Track market penetration"
    ))
    
    draft.add_change(PatchChange(
        op=PatchOperation.ADD_RELATION,
        id="rel.T_to_M",
        data={
            "id": "rel.T_to_M",
            "source": "T",
            "target": "M",
            "coefficient": 0.5
        },
        reason="Better targeting increases market share"
    ))
    
    draft.add_change(PatchChange(
        op=PatchOperation.ADD_EQUATION,
        symbol="M",
        data={
            "target_expr": "clamp(0.5*T, 0, 1)",
            "rate_expr": "0.3 * (M_target - M)"
        },
        reason="Market share equation"
    ))
    
    # Merge
    merger = PatchMerger(base_model)
    result = merger.merge(draft)
    
    print(f"Merge success: {result.success}")
    print(f"Applied changes: {len(result.applied_changes)}")
    print(f"Errors: {result.errors}")
    print(f"Warnings: {result.warnings}")
    
    if result.success:
        print("\nEffective model states:", list(result.effective_model['states'].keys()))
        print("Effective model relations:", len(result.effective_model['relations']))
