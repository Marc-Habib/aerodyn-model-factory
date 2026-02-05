/**
 * AI API Client
 * 
 * Client for interacting with AI-powered patch generation.
 */

const API_BASE = 'http://localhost:8000';

export interface AIPatchRequest {
  prompt: string;
  selected_nodes?: string[];
  context?: string;
}

export interface AIPatchResponse {
  success: boolean;
  patch: {
    changes: Array<{
      op: string;
      symbol?: string;
      id?: string;
      data: Record<string, any>;
      reason?: string;
    }>;
  };
  model_used: string;
}

export interface AIStatus {
  available: boolean;
  model: string | null;
  ollama_url: string | null;
}

/**
 * Check if AI service is available
 */
export async function checkAIStatus(): Promise<AIStatus> {
  const response = await fetch(`${API_BASE}/ai/status`);
  
  if (!response.ok) {
    throw new Error(`Failed to check AI status: ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * Generate a patch using AI
 */
export async function generateAIPatch(request: AIPatchRequest): Promise<AIPatchResponse> {
  const response = await fetch(`${API_BASE}/ai/generate-patch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request)
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'AI generation failed');
  }
  
  return response.json();
}
