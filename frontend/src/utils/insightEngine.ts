import type { SimulationResult } from '../api';

export interface KPIMetrics {
  capability: { value: number; change: number; status: 'good' | 'warning' | 'danger' };
  risk: { value: number; change: number; status: 'good' | 'warning' | 'danger' };
  compliance: { value: number; change: number; status: 'good' | 'warning' | 'danger' };
  trust: { value: number; change: number; status: 'good' | 'warning' | 'danger' };
}

export interface Insight {
  type: 'warning' | 'success' | 'info';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
}

/**
 * Calculate KPI metrics from simulation results
 */
export function calculateKPIs(result: SimulationResult | null, baseline?: SimulationResult): KPIMetrics {
  if (!result) {
    return {
      capability: { value: 0, change: 0, status: 'warning' },
      risk: { value: 0, change: 0, status: 'warning' },
      compliance: { value: 0, change: 0, status: 'warning' },
      trust: { value: 0, change: 0, status: 'warning' },
    };
  }

  const lastIdx = result.t.length - 1;
  const firstIdx = 0;

  // Capability = average of T, S, D
  const capabilityEnd = (
    result.states.T[lastIdx] + 
    result.states.S[lastIdx] + 
    result.states.D[lastIdx]
  ) / 3;
  const capabilityStart = (
    result.states.T[firstIdx] + 
    result.states.S[firstIdx] + 
    result.states.D[firstIdx]
  ) / 3;
  const capabilityChange = ((capabilityEnd - capabilityStart) / capabilityStart) * 100;

  // Risk = X (Incidents)
  const riskEnd = result.states.X[lastIdx];
  const riskStart = result.states.X[firstIdx];
  const riskChange = ((riskEnd - riskStart) / (riskStart || 0.1)) * 100;

  // Compliance = average of E, V
  const complianceEnd = (result.states.E[lastIdx] + result.states.V[lastIdx]) / 2;
  const complianceStart = (result.states.E[firstIdx] + result.states.V[firstIdx]) / 2;
  const complianceChange = ((complianceEnd - complianceStart) / complianceStart) * 100;

  // Trust = L
  const trustEnd = result.states.L[lastIdx];
  const trustStart = result.states.L[firstIdx];
  const trustChange = ((trustEnd - trustStart) / trustStart) * 100;

  return {
    capability: {
      value: capabilityEnd,
      change: capabilityChange,
      status: capabilityEnd > 0.7 ? 'good' : capabilityEnd > 0.4 ? 'warning' : 'danger',
    },
    risk: {
      value: riskEnd,
      change: riskChange,
      status: riskEnd < 0.3 ? 'good' : riskEnd < 0.6 ? 'warning' : 'danger',
    },
    compliance: {
      value: complianceEnd,
      change: complianceChange,
      status: complianceEnd > 0.6 ? 'good' : complianceEnd > 0.4 ? 'warning' : 'danger',
    },
    trust: {
      value: trustEnd,
      change: trustChange,
      status: trustEnd > 0.6 ? 'good' : trustEnd > 0.4 ? 'warning' : 'danger',
    },
  };
}

/**
 * Generate plain-English insights from simulation results
 */
export function generateInsights(result: SimulationResult | null, scenarioName: string): Insight[] {
  if (!result) return [];

  const insights: Insight[] = [];
  const lastIdx = result.t.length - 1;
  const midIdx = Math.floor(result.t.length / 2);

  // Check for high incident risk
  const incidentEnd = result.states.X[lastIdx];
  const incidentMid = result.states.X[midIdx];
  if (incidentEnd > 0.6) {
    insights.push({
      type: 'warning',
      title: 'High Incident Risk',
      description: `This scenario results in ${(incidentEnd * 100).toFixed(0)}% incident accumulation, which could damage trust and trigger regulatory scrutiny.`,
      impact: 'high',
    });
  }

  // Check for trust erosion
  const trustEnd = result.states.L[lastIdx];
  const trustStart = result.states.L[0];
  if (trustEnd < trustStart * 0.7) {
    insights.push({
      type: 'warning',
      title: 'Trust Erosion',
      description: `Legitimacy drops by ${((1 - trustEnd / trustStart) * 100).toFixed(0)}%, potentially limiting future procurement and political support.`,
      impact: 'high',
    });
  }

  // Check for V&V underinvestment
  const vvEnd = result.states.V[lastIdx];
  const targetingEnd = result.states.T[lastIdx];
  if (targetingEnd > 0.6 && vvEnd < 0.4) {
    insights.push({
      type: 'warning',
      title: 'V&V Investment Gap',
      description: `High targeting capability (${(targetingEnd * 100).toFixed(0)}%) without adequate V&V maturity (${(vvEnd * 100).toFixed(0)}%) increases incident probability.`,
      impact: 'high',
    });
  }

  // Check for positive capability growth
  const capabilityEnd = (result.states.T[lastIdx] + result.states.S[lastIdx] + result.states.D[lastIdx]) / 3;
  const capabilityStart = (result.states.T[0] + result.states.S[0] + result.states.D[0]) / 3;
  if (capabilityEnd > capabilityStart * 1.2 && incidentEnd < 0.4) {
    insights.push({
      type: 'success',
      title: 'Sustainable Growth',
      description: `Capability increases by ${((capabilityEnd / capabilityStart - 1) * 100).toFixed(0)}% while maintaining low incident risk. This is a balanced approach.`,
      impact: 'high',
    });
  }

  // Check for compliance-first benefits
  const ethicsEnd = result.states.E[lastIdx];
  if (ethicsEnd > 0.7 && trustEnd > 0.7) {
    insights.push({
      type: 'success',
      title: 'Strong Compliance Posture',
      description: `High ethics compliance (${(ethicsEnd * 100).toFixed(0)}%) builds trust (${(trustEnd * 100).toFixed(0)}%), enabling sustained procurement.`,
      impact: 'medium',
    });
  }

  // Check for resource constraints
  const resourceEnd = result.states.R[lastIdx];
  if (resourceEnd < 0.4) {
    insights.push({
      type: 'warning',
      title: 'Resource Constraints',
      description: `Resource capacity drops to ${(resourceEnd * 100).toFixed(0)}%, limiting ability to invest in capabilities or compliance.`,
      impact: 'medium',
    });
  }

  return insights.slice(0, 3); // Return top 3 insights
}

/**
 * Compare two scenarios and generate recommendation
 */
export function compareScenarios(
  scenarioA: { name: string; result: SimulationResult },
  scenarioB: { name: string; result: SimulationResult }
): { recommendation: string; reasoning: string } {
  const kpiA = calculateKPIs(scenarioA.result);
  const kpiB = calculateKPIs(scenarioB.result);

  // Score each scenario (higher is better)
  const scoreA = 
    kpiA.capability.value * 0.3 + 
    (1 - kpiA.risk.value) * 0.3 + 
    kpiA.compliance.value * 0.2 + 
    kpiA.trust.value * 0.2;

  const scoreB = 
    kpiB.capability.value * 0.3 + 
    (1 - kpiB.risk.value) * 0.3 + 
    kpiB.compliance.value * 0.2 + 
    kpiB.trust.value * 0.2;

  const winner = scoreA > scoreB ? scenarioA : scenarioB;
  const loser = scoreA > scoreB ? scenarioB : scenarioA;
  const winnerKPI = scoreA > scoreB ? kpiA : kpiB;
  const loserKPI = scoreA > scoreB ? kpiB : kpiA;

  const riskDiff = Math.abs(winnerKPI.risk.value - loserKPI.risk.value);
  const capDiff = Math.abs(winnerKPI.capability.value - loserKPI.capability.value);

  let reasoning = `${winner.name} provides `;
  if (riskDiff > 0.2) {
    reasoning += `${(riskDiff * 100).toFixed(0)}% lower incident risk`;
  }
  if (capDiff > 0.1 && riskDiff > 0.1) {
    reasoning += ` while maintaining `;
  }
  if (capDiff > 0.1) {
    reasoning += `${(capDiff * 100).toFixed(0)}% ${winnerKPI.capability.value > loserKPI.capability.value ? 'higher' : 'comparable'} capability`;
  }
  reasoning += `. This approach is more sustainable for long-term procurement and political support.`;

  return {
    recommendation: winner.name,
    reasoning,
  };
}
