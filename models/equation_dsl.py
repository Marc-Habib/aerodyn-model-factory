"""
Equation DSL Validator and Compiler
====================================

Safe, deterministic equation language for AeroDyn Model Factory.

Allowed syntax:
- Numbers: 0.3, 1.5, -2.0
- State variables: T, S, R, etc.
- Parameters: p.kT, p.ai_boost
- Operators: + - * / ** ( )
- Functions: clamp, min, max, sigmoid, step, smoothstep, abs, exp, log

Example valid expressions:
- "clamp(0.4*S + 0.2*R + 0.3*Q + p.ai_boost - p.ethics_constraint*(1-E), 0, 1)"
- "p.kT * (T_target - T)"
- "sigmoid(X - p.incident_threshold, p.sensitivity)"
"""

import ast
import re
from typing import Set, Dict, Any, List, Tuple
from dataclasses import dataclass


@dataclass
class ValidationResult:
    """Result of equation validation"""
    valid: bool
    normalized_expr: str = ""
    dependencies: Set[str] = None
    errors: List[str] = None
    warnings: List[str] = None
    
    def __post_init__(self):
        if self.dependencies is None:
            self.dependencies = set()
        if self.errors is None:
            self.errors = []
        if self.warnings is None:
            self.warnings = []


class EquationDSL:
    """
    Validates and compiles equations in the AeroDyn DSL.
    
    This ensures:
    1. No arbitrary code execution
    2. Only whitelisted functions
    3. Deterministic evaluation
    4. Clear dependency tracking
    """
    
    # Whitelisted functions
    ALLOWED_FUNCTIONS = {
        'clamp': lambda x, a, b: max(a, min(b, x)),
        'min': min,
        'max': max,
        'abs': abs,
        'sigmoid': lambda x, k=1: 1 / (1 + 2.71828 ** (-k * x)),
        'step': lambda x, threshold=0: 1.0 if x >= threshold else 0.0,
        'smoothstep': lambda x, edge0=0, edge1=1: (
            0 if x < edge0 else 1 if x > edge1 else
            (x - edge0) / (edge1 - edge0) * ((x - edge0) / (edge1 - edge0)) * (3 - 2 * (x - edge0) / (edge1 - edge0))
        ),
        'exp': lambda x: 2.71828 ** x,
        'log': lambda x: __import__('math').log(x) if x > 0 else float('-inf'),
    }
    
    # Allowed operators
    ALLOWED_OPS = {
        ast.Add, ast.Sub, ast.Mult, ast.Div, ast.Pow,
        ast.USub, ast.UAdd
    }
    
    def __init__(self, valid_states: Set[str] = None, valid_params: Set[str] = None):
        """
        Initialize validator with known states and parameters.
        
        Args:
            valid_states: Set of valid state variable symbols (e.g., {'T', 'S', 'R'})
            valid_params: Set of valid parameter names (e.g., {'kT', 'ai_boost'})
        """
        self.valid_states = valid_states or set()
        self.valid_params = valid_params or set()
    
    def validate(self, expression: str) -> ValidationResult:
        """
        Validate an equation expression.
        
        Args:
            expression: The equation string to validate
            
        Returns:
            ValidationResult with validation status and details
        """
        result = ValidationResult(valid=False)
        
        # Basic syntax check
        try:
            tree = ast.parse(expression, mode='eval')
        except SyntaxError as e:
            result.errors.append(f"Syntax error: {e}")
            return result
        
        # Walk the AST and validate
        try:
            self._validate_node(tree.body, result)
        except Exception as e:
            result.errors.append(f"Validation error: {e}")
            return result
        
        if not result.errors:
            result.valid = True
            result.normalized_expr = expression.strip()
        
        return result
    
    def _validate_node(self, node: ast.AST, result: ValidationResult):
        """Recursively validate AST nodes"""
        
        if isinstance(node, ast.Constant):
            # Numbers are always OK
            if not isinstance(node.value, (int, float)):
                result.errors.append(f"Only numeric constants allowed, got {type(node.value)}")
        
        elif isinstance(node, ast.Name):
            # State variable reference
            var_name = node.id
            if var_name not in self.valid_states:
                result.errors.append(f"Unknown state variable: {var_name}")
            else:
                result.dependencies.add(var_name)
        
        elif isinstance(node, ast.Attribute):
            # Parameter reference (p.param_name)
            if isinstance(node.value, ast.Name) and node.value.id == 'p':
                param_name = node.attr
                if param_name not in self.valid_params:
                    result.warnings.append(f"Unknown parameter: p.{param_name}")
                result.dependencies.add(f"p.{param_name}")
            else:
                result.errors.append(f"Only 'p.<param>' attribute access allowed")
        
        elif isinstance(node, ast.Call):
            # Function call
            if isinstance(node.func, ast.Name):
                func_name = node.func.id
                if func_name not in self.ALLOWED_FUNCTIONS:
                    result.errors.append(f"Function '{func_name}' not allowed. Allowed: {list(self.ALLOWED_FUNCTIONS.keys())}")
                
                # Validate arguments
                for arg in node.args:
                    self._validate_node(arg, result)
                for keyword in node.keywords:
                    self._validate_node(keyword.value, result)
            else:
                result.errors.append("Only simple function calls allowed")
        
        elif isinstance(node, ast.BinOp):
            # Binary operation
            if type(node.op) not in self.ALLOWED_OPS:
                result.errors.append(f"Operator {type(node.op).__name__} not allowed")
            self._validate_node(node.left, result)
            self._validate_node(node.right, result)
        
        elif isinstance(node, ast.UnaryOp):
            # Unary operation
            if type(node.op) not in self.ALLOWED_OPS:
                result.errors.append(f"Operator {type(node.op).__name__} not allowed")
            self._validate_node(node.operand, result)
        
        elif isinstance(node, ast.Compare):
            # Comparison (for step functions, etc.)
            self._validate_node(node.left, result)
            for comparator in node.comparators:
                self._validate_node(comparator, result)
        
        elif isinstance(node, ast.IfExp):
            # Ternary operator (a if b else c)
            self._validate_node(node.test, result)
            self._validate_node(node.body, result)
            self._validate_node(node.orelse, result)
        
        else:
            result.errors.append(f"AST node type {type(node).__name__} not allowed")
    
    def compile_to_python(self, expression: str, target_name: str = "result") -> str:
        """
        Compile DSL expression to safe Python code.
        
        Args:
            expression: The DSL expression
            target_name: Variable name for the result
            
        Returns:
            Python code string
        """
        validation = self.validate(expression)
        if not validation.valid:
            raise ValueError(f"Invalid expression: {validation.errors}")
        
        # For now, just return the expression as-is since it's already Python-compatible
        # In production, you might want to add more transformations
        return f"{target_name} = {expression}"
    
    def extract_dependencies(self, expression: str) -> Tuple[Set[str], Set[str]]:
        """
        Extract state and parameter dependencies from expression.
        
        Returns:
            (state_deps, param_deps)
        """
        validation = self.validate(expression)
        
        state_deps = {dep for dep in validation.dependencies if not dep.startswith('p.')}
        param_deps = {dep.replace('p.', '') for dep in validation.dependencies if dep.startswith('p.')}
        
        return state_deps, param_deps


def create_validator_from_config(config: Dict[str, Any]) -> EquationDSL:
    """
    Create a validator from model configuration.
    
    Args:
        config: Model config with 'states' and 'parameters' keys
        
    Returns:
        Configured EquationDSL validator
    """
    states = set(config.get('states', {}).keys())
    params = set(config.get('parameters', {}).keys())
    
    return EquationDSL(valid_states=states, valid_params=params)


# Example usage
if __name__ == "__main__":
    # Test the validator
    validator = EquationDSL(
        valid_states={'T', 'S', 'R', 'Q', 'E'},
        valid_params={'kT', 'ai_boost', 'ethics_constraint'}
    )
    
    test_cases = [
        "clamp(0.4*S + 0.2*R + 0.3*Q + p.ai_boost - p.ethics_constraint*(1-E), 0, 1)",
        "p.kT * (T_target - T)",
        "sigmoid(X - p.incident_threshold, p.sensitivity)",
        "import os; os.system('rm -rf /')",  # Should fail
        "eval('malicious code')",  # Should fail
        "T + S + R",  # Should pass
        "p.unknown_param * T",  # Should warn
    ]
    
    for expr in test_cases:
        print(f"\nTesting: {expr}")
        result = validator.validate(expr)
        print(f"Valid: {result.valid}")
        if result.errors:
            print(f"Errors: {result.errors}")
        if result.warnings:
            print(f"Warnings: {result.warnings}")
        if result.dependencies:
            print(f"Dependencies: {result.dependencies}")
