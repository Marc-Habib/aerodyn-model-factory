/**
 * Draft API Client
 * 
 * Client for interacting with the draft/patch system API.
 */

const API_BASE = 'http://localhost:8000';

export interface PatchChange {
  op: string;
  symbol?: string;
  id?: string;
  data: Record<string, any>;
  reason?: string;
}

export interface Draft {
  draft_id: string;
  created_at: string;
  based_on_version?: string;
  description?: string;
  changes: PatchChange[];
  metadata: Record<string, any>;
}

export interface DraftSummary {
  draft_id: string;
  created_at: string;
  description?: string;
  num_changes: number;
}

export interface MergeResult {
  success: boolean;
  effective_model?: any;
  errors: string[];
  warnings: string[];
  applied_changes: number;
  skipped_changes: number;
}

export interface ValidationResult {
  [symbol: string]: {
    valid: boolean;
    errors: string[];
    warnings: string[];
    dependencies: string[];
  };
}

/**
 * Create a new draft
 */
export async function createDraft(description?: string, basedOnVersion?: string): Promise<Draft> {
  const response = await fetch(`${API_BASE}/drafts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      description: description || '',
      based_on_version: basedOnVersion
    })
  });
  
  if (!response.ok) {
    throw new Error(`Failed to create draft: ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * Get a draft by ID
 */
export async function getDraft(draftId: string): Promise<Draft> {
  const response = await fetch(`${API_BASE}/drafts/${draftId}`);
  
  if (!response.ok) {
    throw new Error(`Failed to get draft: ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * List all drafts
 */
export async function listDrafts(): Promise<DraftSummary[]> {
  const response = await fetch(`${API_BASE}/drafts`);
  
  if (!response.ok) {
    throw new Error(`Failed to list drafts: ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * Update a draft
 */
export async function updateDraft(
  draftId: string,
  updates: {
    description?: string;
    changes?: PatchChange[];
    metadata?: Record<string, any>;
  }
): Promise<Draft> {
  const response = await fetch(`${API_BASE}/drafts/${draftId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates)
  });
  
  if (!response.ok) {
    throw new Error(`Failed to update draft: ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * Delete a draft
 */
export async function deleteDraft(draftId: string): Promise<void> {
  const response = await fetch(`${API_BASE}/drafts/${draftId}`, {
    method: 'DELETE'
  });
  
  if (!response.ok) {
    throw new Error(`Failed to delete draft: ${response.statusText}`);
  }
}

/**
 * Add a change to a draft
 */
export async function addChangeToDraft(draftId: string, change: PatchChange): Promise<void> {
  const response = await fetch(`${API_BASE}/drafts/${draftId}/add-change`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(change)
  });
  
  if (!response.ok) {
    throw new Error(`Failed to add change: ${response.statusText}`);
  }
}

/**
 * Remove a change from a draft
 */
export async function removeChangeFromDraft(draftId: string, changeIndex: number): Promise<void> {
  const response = await fetch(`${API_BASE}/drafts/${draftId}/changes/${changeIndex}`, {
    method: 'DELETE'
  });
  
  if (!response.ok) {
    throw new Error(`Failed to remove change: ${response.statusText}`);
  }
}

/**
 * Validate a draft
 */
export async function validateDraft(draftId: string): Promise<MergeResult> {
  const response = await fetch(`${API_BASE}/drafts/${draftId}/validate`, {
    method: 'POST'
  });
  
  if (!response.ok) {
    throw new Error(`Failed to validate draft: ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * Apply a draft (merge with base model)
 */
export async function applyDraft(draftId: string, commit: boolean = false): Promise<MergeResult> {
  const url = commit 
    ? `${API_BASE}/drafts/${draftId}/apply?commit=true`
    : `${API_BASE}/drafts/${draftId}/apply`;
    
  const response = await fetch(url, {
    method: 'POST'
  });
  
  if (!response.ok) {
    throw new Error(`Failed to apply draft: ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * Validate equations in real-time
 */
export async function validateEquations(equations: Record<string, string>): Promise<ValidationResult> {
  const response = await fetch(`${API_BASE}/drafts/validate-equation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ equations })
  });
  
  if (!response.ok) {
    throw new Error(`Failed to validate equations: ${response.statusText}`);
  }
  
  return response.json();
}
