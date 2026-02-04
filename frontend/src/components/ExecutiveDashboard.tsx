import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import type { SimulationResult, KPI, Insight } from '../api';

interface ExecutiveDashboardProps {
  result: SimulationResult | null;
  scenarioName: string;
}

export function ExecutiveDashboard({ result, scenarioName }: ExecutiveDashboardProps) {
  const kpis = result?.kpis || {};
  const insights = result?.insights || [];

  if (!result) {
    return (
      <div className="flex items-center justify-center h-96 text-slate-500">
        <div className="text-center">
          <Info size={48} className="mx-auto mb-4 opacity-50" />
          <p>Select a scenario and run simulation to see executive summary</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        {Object.entries(kpis).map(([id, kpi]) => (
          <KPICard
            key={id}
            title={kpi.name}
            icon={getKPIIcon(id)}
            kpi={kpi}
            description={kpi.business_meaning}
          />
        ))}
      </div>

      {/* Key Insights */}
      <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6">
        <h3 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
          <Info size={20} className="text-cyan-400" />
          Key Insights
        </h3>
        <div className="space-y-3">
          {insights.length === 0 ? (
            <p className="text-slate-400 text-sm">No significant insights for this scenario.</p>
          ) : (
            insights.map((insight, i) => (
              <InsightCard key={i} insight={insight} />
            ))
          )}
        </div>
      </div>

      {/* Scenario Summary */}
      <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6">
        <h3 className="text-lg font-semibold text-slate-200 mb-4">Scenario: {scenarioName}</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-slate-500">Simulation Period:</span>
            <span className="ml-2 text-slate-300">{result.t[0].toFixed(1)} - {result.t[result.t.length - 1].toFixed(1)} years</span>
          </div>
          <div>
            <span className="text-slate-500">Data Points:</span>
            <span className="ml-2 text-slate-300">{result.t.length}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function getKPIIcon(kpiId: string): string {
  const icons: Record<string, string> = {
    capability_index: '🎯',
    risk_index: '⚠️',
    compliance_index: '⚖️',
    trust_index: '🤝',
  };
  return icons[kpiId] || '📊';
}

interface KPICardProps {
  title: string;
  icon: string;
  kpi: KPI;
  description: string;
}

function KPICard({ title, icon, kpi, description }: KPICardProps) {
  const status = kpi.status;

  const statusColors = {
    good: 'from-emerald-500/20 to-emerald-600/20 border-emerald-500/50',
    warning: 'from-amber-500/20 to-amber-600/20 border-amber-500/50',
    danger: 'from-red-500/20 to-red-600/20 border-red-500/50',
  };

  const textColors = {
    good: 'text-emerald-400',
    warning: 'text-amber-400',
    danger: 'text-red-400',
  };

  const bgColors = {
    good: 'bg-emerald-500/10',
    warning: 'bg-amber-500/10',
    danger: 'bg-red-500/10',
  };

  return (
    <div className={`bg-gradient-to-br ${statusColors[status]} border rounded-xl p-4 transition-all hover:scale-105`}>
      <div className="flex items-start justify-between mb-3">
        <div className="text-2xl">{icon}</div>
        <div className={`px-2 py-1 rounded text-xs font-medium ${bgColors[status]} ${textColors[status]}`}>
          {status.toUpperCase()}
        </div>
      </div>
      <div className="space-y-1">
        <h4 className="text-slate-400 text-xs uppercase tracking-wide">{title}</h4>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-slate-100">
            {(kpi.value * 100).toFixed(0)}%
          </span>
          <div className={`flex items-center gap-1 text-sm ${kpi.change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {kpi.change >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            <span>{Math.abs(kpi.change).toFixed(0)}%</span>
          </div>
        </div>
        <p className="text-xs text-slate-500">{description}</p>
      </div>
    </div>
  );
}

function InsightCard({ insight }: { insight: Insight }) {
  const icons = {
    warning: <AlertTriangle size={18} className="text-amber-400" />,
    success: <CheckCircle size={18} className="text-emerald-400" />,
    info: <Info size={18} className="text-cyan-400" />,
  };

  const bgColors = {
    warning: 'bg-amber-500/10 border-amber-500/30',
    success: 'bg-emerald-500/10 border-emerald-500/30',
    info: 'bg-cyan-500/10 border-cyan-500/30',
  };

  const impactBadge = {
    high: 'bg-red-500/20 text-red-400',
    medium: 'bg-amber-500/20 text-amber-400',
    low: 'bg-slate-500/20 text-slate-400',
  };

  return (
    <div className={`${bgColors[insight.type]} border rounded-lg p-4`}>
      <div className="flex items-start gap-3">
        <div className="mt-0.5">{icons[insight.type]}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold text-slate-200">{insight.title}</h4>
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${impactBadge[insight.impact]}`}>
              {insight.impact}
            </span>
          </div>
          <p className="text-sm text-slate-400">{insight.description}</p>
        </div>
      </div>
    </div>
  );
}
