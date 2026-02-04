import { useState } from 'react';
import { ChevronDown, ChevronRight, BookOpen } from 'lucide-react';

interface Stock {
  id: string;
  name: string;
  short: string;
  category: string;
  description: string;
  business_meaning: string;
}

interface Equation {
  target: string;
  derivative: string;
  explanation: string;
}

interface EquationsPanelProps {
  stocks: Record<string, Stock>;
  equations: Record<string, Equation>;
}

export function EquationsPanel({ stocks, equations }: EquationsPanelProps) {
  const [expandedStocks, setExpandedStocks] = useState<Set<string>>(new Set());

  const toggleStock = (stockId: string) => {
    const newExpanded = new Set(expandedStocks);
    if (newExpanded.has(stockId)) {
      newExpanded.delete(stockId);
    } else {
      newExpanded.add(stockId);
    }
    setExpandedStocks(newExpanded);
  };

  const categoryColors: Record<string, string> = {
    capability: '#3b82f6',
    governance: '#8b5cf6',
    execution: '#10b981',
    risk: '#ef4444',
    market: '#f59e0b',
  };

  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-700 bg-slate-800/80 flex items-center gap-2">
        <BookOpen size={18} className="text-blue-400" />
        <h3 className="font-semibold text-slate-200">Stock Equations</h3>
      </div>
      
      <div className="p-4 space-y-2 max-h-[600px] overflow-y-auto">
        {Object.entries(stocks).map(([stockId, stock]) => {
          const equation = equations[stockId];
          const isExpanded = expandedStocks.has(stockId);
          const categoryColor = categoryColors[stock.category] || '#64748b';

          return (
            <div key={stockId} className="border border-slate-700 rounded-lg overflow-hidden">
              {/* Header */}
              <button
                onClick={() => toggleStock(stockId)}
                className="w-full flex items-center justify-between p-3 hover:bg-slate-700/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  <div 
                    className="w-2 h-2 rounded-full" 
                    style={{ backgroundColor: categoryColor }}
                  />
                  <div className="text-left">
                    <div className="font-mono font-bold text-slate-200">{stockId}</div>
                    <div className="text-xs text-slate-400">{stock.name}</div>
                  </div>
                </div>
                <div className="text-xs text-slate-500 capitalize">{stock.category}</div>
              </button>

              {/* Expanded Content */}
              {isExpanded && equation && (
                <div className="p-4 bg-slate-900/50 space-y-4 border-t border-slate-700">
                  {/* Business Meaning */}
                  <div>
                    <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">Business Meaning</div>
                    <p className="text-sm text-slate-300 italic">{stock.business_meaning}</p>
                  </div>

                  {/* Description */}
                  <div>
                    <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">Description</div>
                    <p className="text-sm text-slate-400">{stock.description}</p>
                  </div>

                  {/* Target Equation */}
                  <div>
                    <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">Target Equation</div>
                    <code className="block text-xs bg-slate-800 p-3 rounded text-blue-400 font-mono overflow-x-auto whitespace-pre-wrap break-all">
                      {stockId}_target = {equation.target}
                    </code>
                  </div>

                  {/* Derivative */}
                  <div>
                    <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">Derivative (Rate of Change)</div>
                    <code className="block text-xs bg-slate-800 p-3 rounded text-emerald-400 font-mono overflow-x-auto whitespace-pre-wrap break-all">
                      d{stockId}/dt = {equation.derivative}
                    </code>
                  </div>

                  {/* Explanation */}
                  {equation.explanation && (
                    <div>
                      <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">Explanation</div>
                      <p className="text-sm text-slate-300">{equation.explanation}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
