/**
 * Draft Panel Component
 * 
 * Shows current draft changes with accept/reject controls.
 */

import { X, Check, Trash2 } from 'lucide-react';
import type { Draft, PatchChange } from '../api/drafts';

interface DraftPanelProps {
  draft: Draft | null;
  changes: PatchChange[];
  onClose: () => void;
  onAccept?: (changeIndex: number) => void;
  onReject?: (changeIndex: number) => void;
}

export function DraftPanel({ draft, changes, onClose, onAccept, onReject }: DraftPanelProps) {
  if (!draft) return null;

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

  const getOperationColor = (op: string): string => {
    if (op.startsWith('add')) return 'text-green-400 bg-green-500/20';
    if (op.startsWith('remove')) return 'text-red-400 bg-red-500/20';
    if (op.startsWith('update')) return 'text-yellow-400 bg-yellow-500/20';
    return 'text-slate-400 bg-slate-500/20';
  };

  return (
    <div className="absolute top-4 right-4 w-96 bg-slate-900/95 backdrop-blur border border-slate-700 rounded-lg shadow-xl z-10">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700">
        <div>
          <h3 className="text-lg font-bold text-slate-200">Draft Changes</h3>
          <p className="text-xs text-slate-400 mt-1">
            {changes.length} change{changes.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-200 transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      {/* Changes List */}
      <div className="max-h-96 overflow-y-auto p-4 space-y-3">
        {changes.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-8">
            No changes yet. Start editing the graph!
          </p>
        ) : (
          changes.map((change, index) => (
            <div
              key={index}
              className="bg-slate-800/50 rounded-lg p-3 border border-slate-700"
            >
              {/* Operation Badge */}
              <div className="flex items-center justify-between mb-2">
                <span
                  className={`text-xs px-2 py-1 rounded ${getOperationColor(
                    change.op
                  )}`}
                >
                  {getOperationLabel(change.op)}
                </span>
                {change.symbol && (
                  <span className="text-xs font-mono text-slate-400">
                    {change.symbol}
                  </span>
                )}
              </div>

              {/* Reason */}
              {change.reason && (
                <p className="text-xs text-slate-300 mb-2">{change.reason}</p>
              )}

              {/* Data Preview */}
              {Object.keys(change.data).length > 0 && (
                <details className="text-xs">
                  <summary className="text-slate-500 cursor-pointer hover:text-slate-400">
                    View data
                  </summary>
                  <pre className="mt-2 p-2 bg-slate-900 rounded text-slate-400 overflow-x-auto">
                    {JSON.stringify(change.data, null, 2)}
                  </pre>
                </details>
              )}

              {/* Actions */}
              <div className="flex gap-2 mt-3">
                <button
                  className="flex-1 flex items-center justify-center gap-1 px-2 py-1 bg-green-600/20 text-green-400 rounded hover:bg-green-600/30 transition-colors text-xs"
                  onClick={() => onAccept?.(index)}
                >
                  <Check size={12} />
                  Accept
                </button>
                <button
                  className="flex-1 flex items-center justify-center gap-1 px-2 py-1 bg-red-600/20 text-red-400 rounded hover:bg-red-600/30 transition-colors text-xs"
                  onClick={() => onReject?.(index)}
                >
                  <Trash2 size={12} />
                  Reject
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-slate-700">
        <div className="text-xs text-slate-500">
          <p>Draft ID: {draft.draft_id}</p>
          <p className="mt-1">
            Created: {new Date(draft.created_at).toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}
