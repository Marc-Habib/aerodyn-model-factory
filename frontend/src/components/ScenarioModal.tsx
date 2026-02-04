import { useState, useEffect } from 'react';
import { X, Plus, Trash2, Check } from 'lucide-react';
import type { Parameter, State, Scenario } from '../api';

interface ScenarioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (scenario: Scenario) => void;
  parameters: Record<string, Parameter>;
  states: Record<string, State>;
  existingScenario?: Scenario | null;
  mode: 'create' | 'edit';
}

export function ScenarioModal({
  isOpen,
  onClose,
  onSave,
  parameters,
  states,
  existingScenario,
  mode,
}: ScenarioModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [paramOverrides, setParamOverrides] = useState<Record<string, number>>({});
  const [initialOverrides, setInitialOverrides] = useState<Record<string, number>>({});
  const [activeTab, setActiveTab] = useState<'params' | 'initials'>('params');

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      if (existingScenario && mode === 'edit') {
        setName(existingScenario.name);
        setDescription(existingScenario.description);
        setParamOverrides({ ...existingScenario.param_overrides });
        setInitialOverrides({ ...existingScenario.initial_overrides });
      } else {
        setName('');
        setDescription('');
        setParamOverrides({});
        setInitialOverrides({});
      }
    }
  }, [isOpen, existingScenario, mode]);

  const handleAddParam = (key: string) => {
    const defaultVal = parameters[key]?.value ?? 0.5;
    setParamOverrides(prev => ({ ...prev, [key]: defaultVal }));
  };

  const handleRemoveParam = (key: string) => {
    setParamOverrides(prev => {
      const { [key]: _, ...rest } = prev;
      return rest;
    });
  };

  const handleParamChange = (key: string, value: number) => {
    setParamOverrides(prev => ({ ...prev, [key]: value }));
  };

  const handleAddInitial = (key: string) => {
    const defaultVal = states[key]?.initial ?? 0.5;
    setInitialOverrides(prev => ({ ...prev, [key]: defaultVal }));
  };

  const handleRemoveInitial = (key: string) => {
    setInitialOverrides(prev => {
      const { [key]: _, ...rest } = prev;
      return rest;
    });
  };

  const handleInitialChange = (key: string, value: number) => {
    setInitialOverrides(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    if (!name.trim()) return;
    
    const scenario: Scenario = {
      name: name.trim(),
      description: description.trim(),
      param_overrides: paramOverrides,
      initial_overrides: initialOverrides,
    };
    
    onSave(scenario);
    onClose();
  };

  // Get available params (not yet added)
  const availableParams = Object.keys(parameters).filter(k => !(k in paramOverrides));
  const availableStates = Object.keys(states).filter(k => !(k in initialOverrides));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      {/* Modal */}
      <div className="relative bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700">
          <h2 className="text-lg font-semibold text-slate-200">
            {mode === 'create' ? 'New Scenario' : 'Edit Scenario'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5 max-h-[60vh] overflow-y-auto">
          {/* Name & Description */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-slate-500 uppercase tracking-wide mb-1">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="scenario_name"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 uppercase tracking-wide mb-1">Description</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What does this scenario test?"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-slate-800 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('params')}
              className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'params' ? 'bg-slate-700 text-slate-200' : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              Parameters ({Object.keys(paramOverrides).length})
            </button>
            <button
              onClick={() => setActiveTab('initials')}
              className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'initials' ? 'bg-slate-700 text-slate-200' : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              Initial States ({Object.keys(initialOverrides).length})
            </button>
          </div>

          {/* Parameters Tab */}
          {activeTab === 'params' && (
            <div className="space-y-3">
              {/* Added params */}
              {Object.entries(paramOverrides).map(([key, value]) => {
                const param = parameters[key];
                return (
                  <div key={key} className="flex items-center gap-3 bg-slate-800/50 p-3 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-300">{key}</div>
                      <div className="text-xs text-slate-500 truncate">{param?.description}</div>
                    </div>
                    <input
                      type="number"
                      value={value}
                      onChange={(e) => handleParamChange(key, parseFloat(e.target.value) || 0)}
                      step="0.01"
                      min={param?.min ?? 0}
                      max={param?.max ?? 1}
                      className="w-20 bg-slate-700 border border-slate-600 rounded px-2 py-1 text-sm text-right font-mono text-cyan-400"
                    />
                    <button
                      onClick={() => handleRemoveParam(key)}
                      className="p-1 text-slate-500 hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                );
              })}

              {/* Add param dropdown */}
              {availableParams.length > 0 && (
                <div className="flex items-center gap-2">
                  <select
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-400"
                    onChange={(e) => {
                      if (e.target.value) {
                        handleAddParam(e.target.value);
                        e.target.value = '';
                      }
                    }}
                    defaultValue=""
                  >
                    <option value="" disabled>Add parameter override...</option>
                    {availableParams.map(key => (
                      <option key={key} value={key}>{key} - {parameters[key]?.description}</option>
                    ))}
                  </select>
                  <Plus size={16} className="text-slate-500" />
                </div>
              )}

              {Object.keys(paramOverrides).length === 0 && (
                <p className="text-sm text-slate-500 text-center py-4">
                  No parameter overrides. Add one above.
                </p>
              )}
            </div>
          )}

          {/* Initial States Tab */}
          {activeTab === 'initials' && (
            <div className="space-y-3">
              {Object.entries(initialOverrides).map(([key, value]) => {
                const state = states[key];
                return (
                  <div key={key} className="flex items-center gap-3 bg-slate-800/50 p-3 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-300">{key}: {state?.name}</div>
                      <div className="text-xs text-slate-500 truncate">{state?.description}</div>
                    </div>
                    <input
                      type="number"
                      value={value}
                      onChange={(e) => handleInitialChange(key, parseFloat(e.target.value) || 0)}
                      step="0.01"
                      min={state?.min ?? 0}
                      max={state?.max ?? 1}
                      className="w-20 bg-slate-700 border border-slate-600 rounded px-2 py-1 text-sm text-right font-mono text-emerald-400"
                    />
                    <button
                      onClick={() => handleRemoveInitial(key)}
                      className="p-1 text-slate-500 hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                );
              })}

              {availableStates.length > 0 && (
                <div className="flex items-center gap-2">
                  <select
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-400"
                    onChange={(e) => {
                      if (e.target.value) {
                        handleAddInitial(e.target.value);
                        e.target.value = '';
                      }
                    }}
                    defaultValue=""
                  >
                    <option value="" disabled>Add initial state override...</option>
                    {availableStates.map(key => (
                      <option key={key} value={key}>{key}: {states[key]?.name}</option>
                    ))}
                  </select>
                  <Plus size={16} className="text-slate-500" />
                </div>
              )}

              {Object.keys(initialOverrides).length === 0 && (
                <p className="text-sm text-slate-500 text-center py-4">
                  No initial state overrides. Add one above.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-slate-700 bg-slate-800/50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-slate-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim()}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-700 disabled:text-slate-500 rounded-lg transition-colors"
          >
            <Check size={16} />
            {mode === 'create' ? 'Create Scenario' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
