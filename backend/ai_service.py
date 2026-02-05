"""
AI Service for AeroDyn Model Factory
====================================

Integrates with Ollama for local LLM-powered patch generation.

Uses Llama 3.1 8B for generating model modifications based on natural language prompts.
"""

import json
import requests
from typing import Dict, Any, List, Optional
from dataclasses import dataclass


@dataclass
class AIConfig:
    """Configuration for AI service"""
    ollama_url: str = "http://localhost:11434"
    model: str = "llama3.1:8b"
    temperature: float = 0.7
    max_tokens: int = 2000


class OllamaClient:
    """Client for interacting with Ollama API"""
    
    def __init__(self, config: AIConfig = None):
        self.config = config or AIConfig()
    
    def generate(self, prompt: str, system_prompt: str = None) -> str:
        """
        Generate text using Ollama.
        
        Args:
            prompt: User prompt
            system_prompt: System instructions
            
        Returns:
            Generated text
        """
        url = f"{self.config.ollama_url}/api/generate"
        
        payload = {
            "model": self.config.model,
            "prompt": prompt,
            "stream": False,
            "options": {
                "temperature": self.config.temperature,
                "num_predict": self.config.max_tokens,
            }
        }
        
        if system_prompt:
            payload["system"] = system_prompt
        
        try:
            response = requests.post(url, json=payload, timeout=120)
            response.raise_for_status()
            result = response.json()
            return result.get("response", "")
        except requests.exceptions.RequestException as e:
            raise Exception(f"Ollama API error: {e}")
    
    def check_health(self) -> bool:
        """Check if Ollama is running and model is available"""
        try:
            response = requests.get(f"{self.config.ollama_url}/api/tags", timeout=5)
            response.raise_for_status()
            models = response.json().get("models", [])
            return any(m.get("name", "").startswith(self.config.model) for m in models)
        except:
            return False


class AIPatchGenerator:
    """
    Generates model patches using AI based on natural language prompts.
    
    This is the core of Phase 5 - AI-assisted model editing.
    """
    
    def __init__(self, ollama_client: OllamaClient = None):
        self.client = ollama_client or OllamaClient()
    
    def generate_patch(
        self,
        prompt: str,
        current_model: Dict[str, Any],
        selected_nodes: List[str] = None,
        context: str = None
    ) -> Dict[str, Any]:
        """
        Generate a patch based on user prompt and current model state.
        
        Args:
            prompt: User's natural language request
            current_model: Current model configuration
            selected_nodes: List of selected node symbols (for context)
            context: Additional context information
            
        Returns:
            Patch dictionary with changes array
        """
        # Build system prompt
        system_prompt = self._build_system_prompt()
        
        # Build user prompt with context
        user_prompt = self._build_user_prompt(
            prompt=prompt,
            current_model=current_model,
            selected_nodes=selected_nodes,
            context=context
        )
        
        # Generate response
        response = self.client.generate(user_prompt, system_prompt)
        
        # Parse JSON response
        try:
            # Extract JSON from response (handle markdown code blocks)
            json_str = self._extract_json(response)
            patch = json.loads(json_str)
            
            # Validate patch structure
            if not isinstance(patch, dict) or "changes" not in patch:
                raise ValueError("Invalid patch structure")
            
            return patch
        except (json.JSONDecodeError, ValueError) as e:
            raise Exception(f"Failed to parse AI response: {e}\nResponse: {response}")
    
    def _build_system_prompt(self) -> str:
        """Build system prompt for the AI"""
        return """You are an expert system dynamics modeler. Your task is to generate model modifications in JSON format.

You must output ONLY valid JSON in this exact format:
{
  "changes": [
    {
      "op": "add_state" | "update_state" | "add_relation" | "update_relation" | "add_parameter" | "update_parameter" | "add_equation" | "update_equation",
      "symbol": "STATE_SYMBOL",
      "id": "unique_id",
      "data": { ... },
      "reason": "Clear explanation"
    }
  ]
}

Rules:
1. Output ONLY JSON, no markdown, no explanations
2. All new state symbols must be single uppercase letters not already used
3. All IDs must be unique (e.g., "state.new_var", "rel.A_to_B")
4. Equations must use DSL syntax: p.param_name, clamp(), min(), max(), sigmoid()
5. Initial values must be between 0 and 1
6. Coefficients should typically be between -1 and 1
7. Categories: capability, governance, execution, risk, market
8. Provide clear "reason" for each change

Example operations:
- add_state: Add new state variable
- add_relation: Add causal link between states
- update_state: Modify state properties
- update_relation: Change coefficient or description
- add_equation: Define dynamics for new state
- update_equation: Modify existing equation"""
    
    def _build_user_prompt(
        self,
        prompt: str,
        current_model: Dict[str, Any],
        selected_nodes: List[str] = None,
        context: str = None
    ) -> str:
        """Build user prompt with model context"""
        
        # Extract current states
        states = current_model.get("states", {})
        state_list = ", ".join(states.keys())
        
        # Extract current parameters
        params = current_model.get("parameters", {})
        param_list = ", ".join(params.keys())
        
        # Build context section
        context_section = ""
        if selected_nodes:
            context_section = f"\nSelected nodes for context: {', '.join(selected_nodes)}"
        if context:
            context_section += f"\nAdditional context: {context}"
        
        # Build prompt
        user_prompt = f"""Current model state:
- Existing states: {state_list}
- Existing parameters: {param_list}
- Number of relations: {len(current_model.get('relations', []))}
{context_section}

User request: {prompt}

Generate a JSON patch with the necessary changes to implement this request. Remember:
- Use only available states or add new ones
- Reference existing parameters or add new ones
- Provide clear reasons for each change
- Ensure all equations use valid DSL syntax

Output only the JSON patch:"""
        
        return user_prompt
    
    def _extract_json(self, response: str) -> str:
        """Extract JSON from response, handling markdown code blocks"""
        response = response.strip()
        
        # Remove markdown code blocks if present
        if response.startswith("```"):
            lines = response.split("\n")
            # Remove first line (```json or ```)
            lines = lines[1:]
            # Remove last line (```)
            if lines and lines[-1].strip() == "```":
                lines = lines[:-1]
            response = "\n".join(lines)
        
        return response.strip()


def create_ai_service(model: str = "llama3.1:8b") -> AIPatchGenerator:
    """
    Factory function to create AI service.
    
    Args:
        model: Ollama model to use
        
    Returns:
        Configured AIPatchGenerator
    """
    config = AIConfig(model=model)
    client = OllamaClient(config)
    return AIPatchGenerator(client)


# Example usage
if __name__ == "__main__":
    # Test the AI service
    ai = create_ai_service()
    
    # Check if Ollama is running
    if not ai.client.check_health():
        print("❌ Ollama is not running or model not found")
        print("Please install Ollama and run: ollama pull llama3.1:8b")
        exit(1)
    
    print("✅ Ollama is running")
    
    # Test patch generation
    test_model = {
        "states": {
            "T": {"name": "Targeting"},
            "S": {"name": "Surveillance"},
            "L": {"name": "Trust"}
        },
        "parameters": {
            "kT": {"value": 0.5}
        },
        "relations": []
    }
    
    try:
        patch = ai.generate_patch(
            prompt="Add a feedback loop where incidents reduce trust",
            current_model=test_model
        )
        print("\n✅ Generated patch:")
        print(json.dumps(patch, indent=2))
    except Exception as e:
        print(f"\n❌ Error: {e}")
