/**
 * Node Edit Modal Component
 * 
 * Modal for editing node properties (state variables).
 */

import { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import type { EditableNodeData } from './EditableNode';
import { EquationEditor, type EquationDependencies } from './EquationEditor';

interface NodeEditModalProps {
  node: {
    id: string;
    data: EditableNodeData;
  } | null;
  onClose: () => void;
  onSave: (nodeId: string, updates: Partial<EditableNodeData>, dependencies?: {
    target: EquationDependencies;
    derivative: EquationDependencies;
  }) => void;
  availableStocks?: string[];
  availableParameters?: Record<string, { description: string; value: number }>;
}

export function NodeEditModal({ node, onClose, onSave, availableStocks = [], availableParameters = {} }: NodeEditModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [businessMeaning, setBusinessMeaning] = useState('');
  const [initial, setInitial] = useState(0.5);
  const [category, setCategory] = useState('capability');
  const [targetEquation, setTargetEquation] = useState('');
  const [derivativeEquation, setDerivativeEquation] = useState('');
  const [targetDeps, setTargetDeps] = useState<EquationDependencies>({ stocks: [], parameters: [] });
  const [derivativeDeps, setDerivativeDeps] = useState<EquationDependencies>({ stocks: [], parameters: [] });
  const [validating, setValidating] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    if (node) {
      console.log('NodeEditModal received node data:', node.data);
      console.log('Target equation:', (node.data as any).target_equation);
      console.log('Derivative equation:', (node.data as any).equation);
      
      setName(node.data.label);
      setDescription(node.data.description);
      setBusinessMeaning(node.data.business_meaning);
      setInitial(node.data.initial);
      setCategory(node.data.category);
      // Initialize equations if available (from StockNodeData)
      setTargetEquation((node.data as any).target_equation || '');
      setDerivativeEquation((node.data as any).equation || '');
    }
  }, [node]);

  if (!node) return null;

  const handleSave = async () => {
    setValidating(true);
    setErrors([]);

    // Validate inputs
    const newErrors: string[] = [];
    if (!name.trim()) newErrors.push('Name is required');
    if (initial < 0 || initial > 1) newErrors.push('Initial value must be between 0 and 1');

    if (newErrors.length > 0) {
      setErrors(newErrors);
      setValidating(false);
      return;
    }

    // Save updates with equations and dependencies
    onSave(node.id, {
      label: name,
      description,
      business_meaning: businessMeaning,
      initial,
      category,
    }, {
      target: targetDeps,
      derivative: derivativeDeps,
    });

    setValidating(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-slate-900 rounded-xl border border-slate-700 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div>
            <h2 className="text-xl font-bold text-slate-200">Edit State Variable</h2>
            <p className="text-sm text-slate-400 mt-1">Symbol: {node.id}</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Targeting Capability"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="capability">Capability</option>
              <option value="governance">Governance</option>
              <option value="execution">Execution</option>
              <option value="risk">Risk</option>
              <option value="market">Market</option>
            </select>
          </div>

          {/* Initial Value */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Initial Value (0-1)
            </label>
            <input
              type="number"
              min="0"
              max="1"
              step="0.1"
              value={initial}
              onChange={(e) => setInitial(parseFloat(e.target.value))}
              className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Business Meaning */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Business Meaning
            </label>
            <input
              type="text"
              value={businessMeaning}
              onChange={(e) => setBusinessMeaning(e.target.value)}
              className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., How accurate are our AI targeting systems?"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Technical description of this state variable..."
            />
          </div>

          {/* Target Equation */}
          <div>
            <EquationEditor
              equation={targetEquation}
              onChange={(eq, deps) => {
                setTargetEquation(eq);
                setTargetDeps(deps);
              }}
              availableStocks={availableStocks}
              availableParameters={availableParameters}
              label="Target Equation"
              placeholder="e.g., clamp(p['surveillance_to_targeting'] * S + 0.2 * R, 0, 1)"
            />
          </div>

          {/* Derivative Equation */}
          <div>
            <EquationEditor
              equation={derivativeEquation}
              onChange={(eq, deps) => {
                setDerivativeEquation(eq);
                setDerivativeDeps(deps);
              }}
              availableStocks={availableStocks}
              availableParameters={availableParameters}
              label="Derivative (d/dt)"
              placeholder="e.g., p['kT'] * (target - current)"
            />
          </div>

          {/* Errors */}
          {errors.length > 0 && (
            <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4">
              <p className="text-sm font-medium text-red-400 mb-2">Validation Errors:</p>
              <ul className="text-sm text-red-300 space-y-1">
                {errors.map((error, i) => (
                  <li key={i}>• {error}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-700">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={validating}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save size={16} />
            {validating ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
