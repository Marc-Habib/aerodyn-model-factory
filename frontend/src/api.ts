const API_BASE = '/api';

export interface State {
  id: string;
  name: string;
  short: string;
  category: string;
  description: string;
  business_meaning: string;
  initial: number;
  min: number;
  max: number;
  unit: string;
  threshold_warning?: number;
  threshold_danger?: number;
  invert?: boolean;
}

export interface Parameter {
  id: string;
  name: string;
  category: string;
  description: string;
  business_meaning: string;
  value: number;
  min: number;
  max: number;
  unit: string;
  sensitivity: string;
}

export interface Relation {
  id: string;
  source: string | null;
  target: string;
  coefficient: number;
  param_key?: string;
  transform?: string;
  description: string;
}

export interface Scenario {
  name: string;
  description: string;
  param_overrides: Record<string, number>;
  initial_overrides: Record<string, number>;
}

export interface KPI {
  value: number;
  change: number;
  status: 'good' | 'warning' | 'danger';
  name: string;
  description: string;
  business_meaning: string;
}

export interface Insight {
  type: 'warning' | 'success' | 'info';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  recommendation?: string;
}

export interface SimulationResult {
  t: number[];
  states: Record<string, number[]>;
  params: Record<string, number>;
  initial: number[];
  kpis?: Record<string, KPI>;
  insights?: Insight[];
}

export interface FullConfig {
  states: Record<string, State>;
  parameters: Record<string, Parameter>;
  relations: Relation[];
  scenarios: Record<string, Scenario>;
  simulation: { t_end: number; steps: number };
}

export async function fetchConfig(): Promise<FullConfig> {
  const res = await fetch(`${API_BASE}/config/full`);
  if (!res.ok) throw new Error('Failed to fetch config');
  return res.json();
}

export async function simulate(
  scenario?: string,
  paramOverrides?: Record<string, number>,
  initialOverrides?: Record<string, number>
): Promise<SimulationResult> {
  const res = await fetch(`${API_BASE}/simulate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      scenario,
      param_overrides: paramOverrides,
      initial_overrides: initialOverrides,
    }),
  });
  if (!res.ok) throw new Error('Simulation failed');
  return res.json();
}

export async function simulateAll(): Promise<Record<string, SimulationResult>> {
  const res = await fetch(`${API_BASE}/simulate-all`);
  if (!res.ok) throw new Error('Failed to simulate all');
  return res.json();
}

export async function createScenario(scenario: Scenario): Promise<void> {
  const res = await fetch(`${API_BASE}/scenarios`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(scenario),
  });
  if (!res.ok) throw new Error('Failed to create scenario');
}

export async function deleteScenario(name: string): Promise<void> {
  const res = await fetch(`${API_BASE}/scenarios/${name}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete scenario');
}

export async function reloadConfig(): Promise<void> {
  const res = await fetch(`${API_BASE}/reload`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to reload config');
}

export interface GraphNode {
  id: string;
  type: string;
  label: string;
  short: string;
  category: string;
  description: string;
  business_meaning: string;
  color: string;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  coefficient: string;
  label?: string;
  type?: string;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export async function fetchGraph(): Promise<GraphData> {
  const res = await fetch(`${API_BASE}/graph`);
  if (!res.ok) throw new Error('Failed to fetch graph');
  return res.json();
}

export async function fetchEquations(): Promise<Record<string, unknown>> {
  const res = await fetch(`${API_BASE}/equations`);
  if (!res.ok) throw new Error('Failed to fetch equations');
  return res.json();
}

export async function saveScenario(name: string, scenario: Scenario): Promise<void> {
  const res = await fetch(`${API_BASE}/scenarios/${name}/overrides`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(scenario),
  });
  if (!res.ok) throw new Error('Failed to save scenario');
}

export async function saveAllScenarios(): Promise<void> {
  const res = await fetch(`${API_BASE}/scenarios/save`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to save scenarios');
}

export interface ModelMeta {
  id: string;
  name: string;
  description: string;
  version: string;
  company: {
    name: string;
    type: string;
    focus: string;
    context: string;
  };
  questions: string[];
  data_sources: string[];
  assumptions: string[];
  limitations: string[];
}

export interface FeedbackLoop {
  id: string;
  name: string;
  type: 'reinforcing' | 'balancing';
  polarity: string;
  stocks: string[];
  description: string;
  business_meaning: string;
  strength: string;
}

export interface KPIDefinition {
  id: string;
  name: string;
  formula: string;
  description: string;
  business_meaning: string;
  good_threshold: number;
  warning_threshold: number;
  danger_threshold: number;
  unit: string;
  higher_is_better: boolean;
}

export async function fetchModelMeta(): Promise<ModelMeta> {
  const res = await fetch(`${API_BASE}/model/meta`);
  if (!res.ok) throw new Error('Failed to fetch model meta');
  return res.json();
}

export async function fetchFeedbackLoops(): Promise<FeedbackLoop[]> {
  const res = await fetch(`${API_BASE}/config/feedback-loops`);
  if (!res.ok) throw new Error('Failed to fetch feedback loops');
  return res.json();
}

export async function fetchKPIDefinitions(): Promise<Record<string, KPIDefinition>> {
  const res = await fetch(`${API_BASE}/config/kpis`);
  if (!res.ok) throw new Error('Failed to fetch KPI definitions');
  return res.json();
}
