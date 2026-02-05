/**
 * AI Proposal Modal Component
 * 
 * Shows AI-generated patch proposals with accept/edit/reject options.
 */

import { useState } from 'react';
import { X, Check, Sparkles, Loader2 } from 'lucide-react';
import type { PatchChange } from '../api/drafts';

interface AIProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: (changes: PatchChange[]) => void;
  onGenerate: (prompt: string, selectedNodes?: string[]) => Promise<void>;
  isGenerating: boolean;
  proposals: PatchChange[];
  error?: string;
}

export function AIProposalModal({
  isOpen,
  onClose,
  onAccept,
  onGenerate,
  isGenerating,
  proposals,
  error
}: AIProposalModalProps) {
  const [prompt, setPrompt] = useState('');
  const [selectedChanges, setSelectedChanges] = useState<Set<number>>(new Set());

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    await onGenerate(prompt);
  };

  const toggleChange = (index: number) => {
    const newSelected = new Set(selectedChanges);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedChanges(newSelected);
  };

  const handleAcceptSelected = () => {
    const selected = proposals.filter((_, i) => selectedChanges.has(i));
    if (selected.length > 0) {
      onAccept(selected);
      setPrompt('');
      setSelectedChanges(new Set());
    }
  };

  const getOperationLabel = (op: string): string => {
    const labels: Record<string, string> = {
      add_state: 'Add State',
      remove_state: 'Remove State',
      update_state: 'Update State',
      add_relation: 'Add Relation',
      remove_relation: 'Remove Relation',
      update_relation: 'Update Relation',
      add_parameter: 'Add Parameter',
      update_parameter: 'Update Parameter',
      add_equation: 'Add Equation',
      update_equation: 'Update Equation',
    };
    return labels[op] || op;
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-slate-900 rounded-xl border border-slate-700 shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <Sparkles className="text-purple-400" size={24} />
            <div>
              <h2 className="text-xl font-bold text-slate-200">AI Model Assistant</h2>
              <p className="text-sm text-slate-400 mt-1">
                Describe what you want to add or modify
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Prompt Input */}
        <div className="p-6 border-b border-slate-700">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Example: Add a feedback loop where regulatory pressure increases after incidents and reduces available resources"
            rows={3}
            className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
            disabled={isGenerating}
          />
          <div className="flex items-center justify-between mt-4">
            <p className="text-xs text-slate-500">
              💡 Tip: Be specific about what you want to add, modify, or connect
            </p>
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  Generate Suggestions
                </>
              )}
            </button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mx-6 mt-4 bg-red-500/10 border border-red-500/50 rounded-lg p-4">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Proposals List */}
        <div className="flex-1 overflow-y-auto p-6">
          {proposals.length === 0 ? (
            <div className="text-center py-12">
              <Sparkles size={48} className="mx-auto text-slate-600 mb-4" />
              <p className="text-slate-400">
                Enter a prompt above to get AI-powered suggestions
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-slate-300">
                  AI Suggestions ({proposals.length})
                </h3>
                <button
                  onClick={() => {
                    if (selectedChanges.size === proposals.length) {
                      setSelectedChanges(new Set());
                    } else {
                      setSelectedChanges(new Set(proposals.map((_, i) => i)));
                    }
                  }}
                  className="text-xs text-purple-400 hover:text-purple-300"
                >
                  {selectedChanges.size === proposals.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>

              {proposals.map((change, index) => (
                <div
                  key={index}
                  className={`bg-slate-800/50 rounded-lg p-4 border-2 transition-all cursor-pointer ${
                    selectedChanges.has(index)
                      ? 'border-green-500 bg-green-500/10'
                      : 'border-slate-700 hover:border-slate-600'
                  }`}
                  onClick={() => toggleChange(index)}
                >
                  <div className="flex items-start gap-3">
                    {/* Checkbox */}
                    <div className="mt-1">
                      <div
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                          selectedChanges.has(index)
                            ? 'bg-green-500 border-green-500'
                            : 'border-slate-600'
                        }`}
                      >
                        {selectedChanges.has(index) && (
                          <Check size={14} className="text-white" />
                        )}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs px-2 py-1 rounded bg-purple-500/20 text-purple-400">
                          {getOperationLabel(change.op)}
                        </span>
                        {change.symbol && (
                          <span className="text-xs font-mono text-slate-400">
                            {change.symbol}
                          </span>
                        )}
                      </div>

                      {change.reason && (
                        <p className="text-sm text-slate-300 mb-2">{change.reason}</p>
                      )}

                      {Object.keys(change.data).length > 0 && (
                        <details className="text-xs">
                          <summary className="text-slate-500 cursor-pointer hover:text-slate-400">
                            View details
                          </summary>
                          <pre className="mt-2 p-2 bg-slate-900 rounded text-slate-400 overflow-x-auto">
                            {JSON.stringify(change.data, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {proposals.length > 0 && (
          <div className="flex items-center justify-between p-6 border-t border-slate-700">
            <p className="text-sm text-slate-400">
              {selectedChanges.size} of {proposals.length} selected
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAcceptSelected}
                disabled={selectedChanges.size === 0}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Check size={16} />
                Accept Selected ({selectedChanges.size})
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
