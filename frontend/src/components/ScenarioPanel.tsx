import { Plus, Trash2, Copy, Edit2 } from 'lucide-react';
import type { Scenario } from '../api';

interface ScenarioPanelProps {
  scenarios: Record<string, Scenario>;
  selected: string | null;
  onSelect: (name: string) => void;
  onAdd: () => void;
  onEdit?: (name: string) => void;
  onDelete: (name: string) => void;
  onDuplicate: (name: string) => void;
}

export function ScenarioPanel({ 
  scenarios, 
  selected, 
  onSelect, 
  onAdd,
  onEdit,
  onDelete,
  onDuplicate 
}: ScenarioPanelProps) {
  return (
    <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-200">Scenarios</h2>
        <button
          onClick={onAdd}
          className="p-2 rounded-lg bg-blue-600 hover:bg-blue-500 transition-colors"
          title="Add scenario"
        >
          <Plus size={16} />
        </button>
      </div>
      
      <div className="space-y-2">
        {Object.entries(scenarios).map(([name, scenario]) => (
          <div
            key={name}
            className={`group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all ${
              selected === name
                ? 'bg-blue-600/20 border border-blue-500/50'
                : 'bg-slate-700/50 hover:bg-slate-700 border border-transparent'
            }`}
            onClick={() => onSelect(name)}
          >
            <div className="flex-1 min-w-0">
              <p className="font-medium text-slate-200 truncate">{scenario.name || name}</p>
              {scenario.description && (
                <p className="text-xs text-slate-400 truncate">{scenario.description}</p>
              )}
            </div>
            
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {onEdit && (
                <button
                  onClick={(e) => { e.stopPropagation(); onEdit(name); }}
                  className="p-1.5 rounded hover:bg-slate-600 text-slate-400 hover:text-slate-200"
                  title="Edit"
                >
                  <Edit2 size={14} />
                </button>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); onDuplicate(name); }}
                className="p-1.5 rounded hover:bg-slate-600 text-slate-400 hover:text-slate-200"
                title="Duplicate"
              >
                <Copy size={14} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(name); }}
                className="p-1.5 rounded hover:bg-red-600/20 text-slate-400 hover:text-red-400"
                title="Delete"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
      
      {Object.keys(scenarios).length === 0 && (
        <p className="text-sm text-slate-500 text-center py-4">
          No scenarios yet. Click + to add one.
        </p>
      )}
    </div>
  );
}
