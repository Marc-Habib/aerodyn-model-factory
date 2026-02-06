import { useState, useEffect, useCallback } from 'react';
import { Play, RefreshCw, GitCompare, Loader2, Network, BarChart3, Briefcase, Code } from 'lucide-react';
import { ScenarioPanel } from './components/ScenarioPanel';
import { ParameterPanel } from './components/ParameterPanel';
import { SimulationChart, CompareChart } from './components/Chart';
import { EnhancedGraphView } from './components/EnhancedGraphView';
import { ScenarioModal } from './components/ScenarioModal';
import { ExecutiveDashboard } from './components/ExecutiveDashboard';
import { ScenarioComparison } from './components/ScenarioComparison';
import type { FullConfig, SimulationResult, Scenario, GraphData } from './api';
import { fetchConfig, simulate, simulateAll, reloadConfig, fetchGraph, fetchEquations, saveScenario } from './api';

function App() {
  const [config, setConfig] = useState<FullConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedScenario, setSelectedScenario] = useState<string | null>(null);
  const [paramValues, setParamValues] = useState<Record<string, number>>({});
  const [initialValues, setInitialValues] = useState<Record<string, number>>({});
  
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [allResults, setAllResults] = useState<Record<string, SimulationResult> | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [compareState, setCompareState] = useState('T');
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [equations, setEquations] = useState<Record<string, unknown> | null>(null);
  const [viewMode, setViewMode] = useState<'chart' | 'graph'>('chart');
  const [userMode, setUserMode] = useState<'executive' | 'expert'>('executive');
  
  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingScenario, setEditingScenario] = useState<Scenario | null>(null);

  // Load config, graph, and equations on mount
  useEffect(() => {
    Promise.all([fetchConfig(), fetchGraph(), fetchEquations()])
      .then(([cfg, graph, eqs]) => {
        setConfig(cfg);
        setGraphData(graph);
        setEquations(eqs);
        if (Object.keys(cfg.scenarios).length > 0) {
          const first = Object.keys(cfg.scenarios)[0];
          setSelectedScenario(first);
          loadScenarioValues(cfg.scenarios[first], cfg);
        }
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to connect to backend. Make sure the API is running on port 8000.');
        setLoading(false);
      });
  }, []);

  const loadScenarioValues = useCallback((scenario: Scenario, cfg: FullConfig) => {
    // Reset to defaults
    const defaultParams: Record<string, number> = {};
    Object.entries(cfg.parameters).forEach(([k, v]) => {
      defaultParams[k] = v.value;
    });
    const defaultInitials: Record<string, number> = {};
    Object.entries(cfg.states).forEach(([k, v]) => {
      defaultInitials[k] = v.initial;
    });

    // Apply scenario overrides
    setParamValues({ ...defaultParams, ...scenario.param_overrides });
    setInitialValues({ ...defaultInitials, ...scenario.initial_overrides });
  }, []);

  const handleSelectScenario = useCallback((name: string) => {
    if (!config) return;
    setSelectedScenario(name);
    loadScenarioValues(config.scenarios[name], config);
    setCompareMode(false);
  }, [config, loadScenarioValues]);

  const handleAddScenario = useCallback(() => {
    setModalMode('create');
    setEditingScenario(null);
    setModalOpen(true);
  }, []);

  const handleEditScenario = useCallback((name: string) => {
    if (!config) return;
    setModalMode('edit');
    setEditingScenario(config.scenarios[name]);
    setModalOpen(true);
  }, [config]);

  const handleSaveScenario = useCallback(async (scenario: Scenario) => {
    if (!config) return;
    
    const key = scenario.name.toLowerCase().replace(/\s+/g, '_');
    
    // Update local state
    setConfig({
      ...config,
      scenarios: { ...config.scenarios, [key]: scenario },
    });
    
    // Save to backend (persists to JSON file)
    try {
      await saveScenario(key, scenario);
    } catch (err) {
      setError('Failed to save scenario to file');
    }
    
    // Select the new/edited scenario
    setSelectedScenario(key);
    loadScenarioValues(scenario, config);
  }, [config, loadScenarioValues]);

  const handleDeleteScenario = useCallback((name: string) => {
    if (!config) return;
    const { [name]: _, ...rest } = config.scenarios;
    setConfig({ ...config, scenarios: rest });
    if (selectedScenario === name) {
      const remaining = Object.keys(rest);
      setSelectedScenario(remaining.length > 0 ? remaining[0] : null);
    }
  }, [config, selectedScenario]);

  const handleDuplicateScenario = useCallback((name: string) => {
    if (!config) return;
    const src = config.scenarios[name];
    const newName = `${name}_copy`;
    const newScenario: Scenario = {
      ...src,
      name: newName,
      param_overrides: { ...src.param_overrides },
      initial_overrides: { ...src.initial_overrides },
    };
    setConfig({
      ...config,
      scenarios: { ...config.scenarios, [newName]: newScenario },
    });
  }, [config]);

  const handleParamChange = useCallback((key: string, value: number) => {
    setParamValues(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleInitialChange = useCallback((key: string, value: number) => {
    setInitialValues(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleSimulate = useCallback(async () => {
    if (!config) return;
    setSimulating(true);
    setCompareMode(false);
    try {
      const res = await simulate(undefined, paramValues, initialValues);
      setResult(res);
    } catch (err) {
      setError('Simulation failed');
    }
    setSimulating(false);
  }, [config, paramValues, initialValues]);

  const handleCompareAll = useCallback(async () => {
    setSimulating(true);
    try {
      const res = await simulateAll();
      setAllResults(res);
      setCompareMode(true);
    } catch (err) {
      setError('Compare failed');
    }
    setSimulating(false);
  }, []);

  const handleReload = useCallback(async () => {
    setLoading(true);
    try {
      await reloadConfig();
      const cfg = await fetchConfig();
      setConfig(cfg);
      setError(null);
    } catch (err) {
      setError('Failed to reload config');
    }
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
      </div>
    );
  }

  if (error && !config) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <p className="text-slate-400 text-sm">
            Run: <code className="bg-slate-800 px-2 py-1 rounded">python backend/api.py</code>
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
    <div className="min-h-screen bg-slate-900 text-slate-100">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">AeroDyn Model Factory</h1>
            <p className="text-xs text-slate-500">System Dynamics Model Explorer</p>
          </div>
          <div className="flex gap-3">
            {/* Mode Toggle */}
            <div className="flex gap-1 bg-slate-800 rounded-lg p-1">
              <button
                onClick={() => setUserMode('executive')}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                  userMode === 'executive'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Briefcase size={16} />
                Executive
              </button>
              <button
                onClick={() => setUserMode('expert')}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                  userMode === 'expert'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Code size={16} />
                Expert
              </button>
            </div>
            <button
              onClick={handleReload}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm transition-colors"
              title="Reload config from files"
            >
              <RefreshCw size={16} />
              Reload Config
            </button>
          </div>
        </div>
      </header>

      {error && (
        <div className="max-w-7xl mx-auto px-4 py-2">
          <div className="bg-red-900/20 border border-red-800 rounded-lg px-4 py-2 text-red-400 text-sm">
            {error}
          </div>
        </div>
      )}

      <main className="flex h-[calc(100vh-4rem)] max-h-[calc(100vh-4rem)] overflow-hidden">
        {userMode === 'executive' ? (
          /* Executive Mode Layout */
          <>
            {/* Left Sidebar - Scenarios */}
            <div className="w-80 flex-shrink-0 bg-slate-800/30 border-r border-slate-700 p-4 space-y-4 overflow-y-auto max-h-full">
              <ScenarioPanel
                scenarios={config?.scenarios || {}}
                selected={selectedScenario}
                onSelect={handleSelectScenario}
                onAdd={handleAddScenario}
                onEdit={handleEditScenario}
                onDelete={handleDeleteScenario}
                onDuplicate={handleDuplicateScenario}
              />
              <div className="flex flex-col gap-3">
                <button
                  onClick={handleSimulate}
                  disabled={simulating}
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 font-medium transition-all disabled:opacity-50"
                >
                  {simulating ? <Loader2 size={18} className="animate-spin" /> : <Play size={18} />}
                  Run Simulation
                </button>
                <button
                  onClick={handleCompareAll}
                  disabled={simulating}
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-700 hover:bg-slate-600 font-medium transition-all disabled:opacity-50"
                >
                  <GitCompare size={18} />
                  Compare All
                </button>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-hidden max-w-full">
              <div className="h-full overflow-y-auto p-6 max-h-full">
                {/* Executive Dashboard or Comparison */}
                {compareMode && allResults ? (
                  <ScenarioComparison
                    scenarios={Object.entries(allResults).map(([name, result]) => ({ name, result }))}
                  />
                ) : (
                  <ExecutiveDashboard
                    result={result}
                    scenarioName={selectedScenario || 'No scenario selected'}
                  />
                )}

                {/* Chart view */}
                {result && !compareMode && (
                  <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6 mt-4" style={{ minHeight: '500px' }}>
                    <h3 className="text-lg font-semibold text-slate-200 mb-4">Detailed Timeline</h3>
                    <SimulationChart result={result} />
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          /* Expert Mode Layout */
          <>
            {/* Left Sidebar */}
            <div className="w-80 flex-shrink-0 bg-slate-800/30 border-r border-slate-700 p-4 space-y-4 overflow-y-auto max-h-full">
              <ScenarioPanel
                scenarios={config?.scenarios || {}}
                selected={selectedScenario}
                onSelect={handleSelectScenario}
                onAdd={handleAddScenario}
                onEdit={handleEditScenario}
                onDelete={handleDeleteScenario}
                onDuplicate={handleDuplicateScenario}
              />

              {config && (
                <ParameterPanel
                  parameters={config.parameters}
                  states={config.states}
                  paramValues={paramValues}
                  initialValues={initialValues}
                  onParamChange={handleParamChange}
                  onInitialChange={handleInitialChange}
                />
              )}

              {/* Action buttons */}
              <div className="flex flex-col gap-3">
                <button
                  onClick={handleSimulate}
                  disabled={simulating}
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 font-medium transition-all disabled:opacity-50"
                >
                  {simulating ? <Loader2 size={18} className="animate-spin" /> : <Play size={18} />}
                  Simulate
                </button>
                <button
                  onClick={handleCompareAll}
                  disabled={simulating}
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-700 hover:bg-slate-600 font-medium transition-all disabled:opacity-50"
                >
                  <GitCompare size={18} />
                  Compare
                </button>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col overflow-hidden max-w-full">
              {/* View mode toggle */}
              <div className="flex gap-2 px-3 py-2 items-center justify-between border-b border-slate-700 bg-slate-800/20">
                <div className="flex gap-2">
                  <button
                    onClick={() => setViewMode('chart')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      viewMode === 'chart'
                        ? 'bg-blue-600 text-white' 
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    <BarChart3 size={16} />
                    Simulation
                  </button>
                  <button
                    onClick={() => setViewMode('graph')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      viewMode === 'graph'
                        ? 'bg-blue-600 text-white' 
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    <Network size={16} />
                    Interactive Graph
                  </button>
                </div>
              </div>

              {/* Content Area - Full Width to Edge */}
              <div className={`flex-1 overflow-auto max-h-full ${viewMode === 'graph' ? '' : 'p-6 bg-slate-800/50'}`}>
                {viewMode === 'graph' ? (
                  <EnhancedGraphView
                    data={graphData}
                    equations={equations as { stocks?: Record<string, { name?: string; equation?: string; target_equation?: string; target?: string; derivative?: string; description?: string }> }}
                    paramOverrides={selectedScenario && config ? config.scenarios[selectedScenario]?.param_overrides : undefined}
                    parameters={config ? Object.fromEntries(
                      Object.entries(config.parameters).map(([key, param]) => [
                        key,
                        { description: param.description, value: param.value }
                      ])
                    ) : {}}
                    modelData={config}
                  />
              ) : compareMode && allResults ? (
                <div>
                  <div className="flex items-center gap-4 mb-4">
                    <span className="text-sm text-slate-400">Compare state:</span>
                    <select
                      value={compareState}
                      onChange={(e) => setCompareState(e.target.value)}
                      className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-sm"
                    >
                      {config && Object.keys(config.states).map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <CompareChart results={allResults} stateKey={compareState} />
                </div>
              ) : (
                <SimulationChart result={result} />
              )}
              </div>
            </div>
          </>
        )}
      </main>
    </div>

      {/* Scenario Modal */}
      {config && (
        <ScenarioModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onSave={handleSaveScenario}
          parameters={config.parameters}
          states={config.states}
          existingScenario={editingScenario}
          mode={modalMode}
        />
      )}
    </>
  );
}

export default App;
