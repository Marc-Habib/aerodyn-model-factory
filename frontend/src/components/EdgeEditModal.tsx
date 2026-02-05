/**
 * Edge Edit Modal Component
 * 
 * Modal for editing edge properties (relations).
 */

import { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';

interface EdgeEditModalProps {
  edge: {
    id: string;
    source: string;
    target: string;
    data?: {
      coefficient?: number;
      description?: string;
    };
  } | null;
  onClose: () => void;
  onSave: (edgeId: string, updates: { coefficient: number; description: string; type: 'positive' | 'negative' }) => void;
  onDelete?: (edgeId: string) => void;
}

export function EdgeEditModal({ edge, onClose, onSave, onDelete }: EdgeEditModalProps) {
  const [coefficient, setCoefficient] = useState(0.5);
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    if (edge) {
      setCoefficient(edge.data?.coefficient || 0.5);
      setDescription(edge.data?.description || '');
    }
  }, [edge]);

  if (!edge) return null;

  const handleSave = () => {
    setErrors([]);

    // Validate
    const newErrors: string[] = [];
    if (coefficient === 0) newErrors.push('Coefficient cannot be zero');
    if (Math.abs(coefficient) > 1) newErrors.push('Coefficient should typically be between -1 and 1');

    if (newErrors.length > 0) {
      setErrors(newErrors);
      return;
    }

    // Save
    onSave(edge.id, {
      coefficient,
      description,
      type: coefficient >= 0 ? 'positive' : 'negative',
    });

    onClose();
  };

  const handleDelete = () => {
    if (onDelete && confirm('Are you sure you want to delete this relation?')) {
      onDelete(edge.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-slate-900 rounded-xl border border-slate-700 shadow-2xl w-full max-w-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div>
            <h2 className="text-xl font-bold text-slate-200">Edit Relation</h2>
            <p className="text-sm text-slate-400 mt-1">
              {edge.source} → {edge.target}
            </p>
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
          {/* Coefficient */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Coefficient
            </label>
            <div className="flex items-center gap-4">
              <input
                type="number"
                min="-1"
                max="1"
                step="0.1"
                value={coefficient}
                onChange={(e) => setCoefficient(parseFloat(e.target.value))}
                className="flex-1 bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className={`text-sm font-medium ${coefficient >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {coefficient >= 0 ? 'Positive' : 'Negative'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Positive: increases target. Negative: decreases target.
            </p>
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
              placeholder="Describe how this relation works..."
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
        <div className="flex items-center justify-between p-6 border-t border-slate-700">
          {onDelete && (
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30 transition-colors"
            >
              Delete Relation
            </button>
          )}
          <div className="flex items-center gap-3 ml-auto">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Save size={16} />
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
