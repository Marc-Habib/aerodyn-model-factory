import { TrendingUp, TrendingDown, Award } from 'lucide-react';
import type { SimulationResult } from '../api';
import { calculateKPIs, compareScenarios } from '../utils/insightEngine';

interface ScenarioComparisonProps {
  scenarios: Array<{ name: string; result: SimulationResult }>;
}

export function ScenarioComparison({ scenarios }: ScenarioComparisonProps) {
  if (scenarios.length < 2) {
    return (
      <div className="flex items-center justify-center h-96 text-slate-500">
        <p>Run at least 2 scenarios to compare them</p>
      </div>
    );
  }

  const scenarioA = scenarios[0];
  const scenarioB = scenarios[1];
  const comparison = compareScenarios(scenarioA, scenarioB);
  const kpiA = calculateKPIs(scenarioA.result);
  const kpiB = calculateKPIs(scenarioB.result);

  return (
    <div className="space-y-6">
      {/* Recommendation Banner */}
      <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-xl p-6">
        <div className="flex items-start gap-3">
          <Award size={24} className="text-cyan-400 mt-1" />
          <div>
            <h3 className="text-lg font-semibold text-slate-200 mb-2">
              Recommended: {comparison.recommendation}
            </h3>
            <p className="text-slate-400">{comparison.reasoning}</p>
          </div>
        </div>
      </div>

      {/* Side-by-side comparison */}
      <div className="grid grid-cols-2 gap-6">
        <ScenarioCard
          name={scenarioA.name}
          kpis={kpiA}
          isRecommended={comparison.recommendation === scenarioA.name}
        />
        <ScenarioCard
          name={scenarioB.name}
          kpis={kpiB}
          isRecommended={comparison.recommendation === scenarioB.name}
        />
      </div>

      {/* Detailed metrics table */}
      <div className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-800/80 border-b border-slate-700">
            <tr>
              <th className="text-left px-4 py-3 text-slate-400 font-medium">Metric</th>
              <th className="text-center px-4 py-3 text-slate-400 font-medium">{scenarioA.name}</th>
              <th className="text-center px-4 py-3 text-slate-400 font-medium">{scenarioB.name}</th>
              <th className="text-center px-4 py-3 text-slate-400 font-medium">Difference</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            <MetricRow
              label="Capability"
              valueA={kpiA.capability.value}
              valueB={kpiB.capability.value}
              higherIsBetter
            />
            <MetricRow
              label="Risk"
              valueA={kpiA.risk.value}
              valueB={kpiB.risk.value}
              higherIsBetter={false}
            />
            <MetricRow
              label="Compliance"
              valueA={kpiA.compliance.value}
              valueB={kpiB.compliance.value}
              higherIsBetter
            />
            <MetricRow
              label="Trust"
              valueA={kpiA.trust.value}
              valueB={kpiB.trust.value}
              higherIsBetter
            />
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface ScenarioCardProps {
  name: string;
  kpis: ReturnType<typeof calculateKPIs>;
  isRecommended: boolean;
}

function ScenarioCard({ name, kpis, isRecommended }: ScenarioCardProps) {
  return (
    <div className={`bg-slate-800/50 rounded-xl border ${isRecommended ? 'border-cyan-500/50 ring-2 ring-cyan-500/20' : 'border-slate-700'} p-6`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-200">{name}</h3>
        {isRecommended && (
          <div className="px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-400 text-xs font-medium">
            RECOMMENDED
          </div>
        )}
      </div>
      <div className="space-y-3">
        <MetricBar label="Capability" value={kpis.capability.value} status={kpis.capability.status} />
        <MetricBar label="Risk" value={kpis.risk.value} status={kpis.risk.status} invert />
        <MetricBar label="Compliance" value={kpis.compliance.value} status={kpis.compliance.status} />
        <MetricBar label="Trust" value={kpis.trust.value} status={kpis.trust.status} />
      </div>
    </div>
  );
}

interface MetricBarProps {
  label: string;
  value: number;
  status: 'good' | 'warning' | 'danger';
  invert?: boolean;
}

function MetricBar({ label, value, status, invert = false }: MetricBarProps) {
  const displayStatus = invert 
    ? (status === 'good' ? 'danger' : status === 'danger' ? 'good' : status)
    : status;

  const colors = {
    good: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-red-500',
  };

  const icons = {
    good: '✓',
    warning: '⚠',
    danger: '✗',
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm text-slate-400">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-200">{(value * 100).toFixed(0)}%</span>
          <span className="text-xs">{icons[displayStatus]}</span>
        </div>
      </div>
      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full ${colors[displayStatus]} transition-all duration-500`}
          style={{ width: `${value * 100}%` }}
        />
      </div>
    </div>
  );
}

interface MetricRowProps {
  label: string;
  valueA: number;
  valueB: number;
  higherIsBetter: boolean;
}

function MetricRow({ label, valueA, valueB, higherIsBetter }: MetricRowProps) {
  const diff = valueB - valueA;
  const absDiff = Math.abs(diff);
  const isBetter = higherIsBetter ? diff > 0 : diff < 0;

  return (
    <tr className="hover:bg-slate-700/30 transition-colors">
      <td className="px-4 py-3 text-slate-300">{label}</td>
      <td className="px-4 py-3 text-center">
        <span className="font-mono text-slate-200">{(valueA * 100).toFixed(0)}%</span>
      </td>
      <td className="px-4 py-3 text-center">
        <span className="font-mono text-slate-200">{(valueB * 100).toFixed(0)}%</span>
      </td>
      <td className="px-4 py-3 text-center">
        <div className={`flex items-center justify-center gap-1 ${isBetter ? 'text-emerald-400' : 'text-red-400'}`}>
          {diff !== 0 && (isBetter ? <TrendingUp size={14} /> : <TrendingDown size={14} />)}
          <span className="font-mono">{diff > 0 ? '+' : ''}{(absDiff * 100).toFixed(0)}%</span>
        </div>
      </td>
    </tr>
  );
}
