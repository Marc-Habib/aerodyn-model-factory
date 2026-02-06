/**
 * Modular Equation Editor Component
 * 
 * Visual editor for creating/editing equations with:
 * - Parameter selection from dropdown
 * - Stock/node selection from available nodes
 * - Auto-completion and syntax highlighting
 * - Dependency extraction for auto-linking
 */

import { useState, useEffect, useMemo } from 'react';
import { Plus, ChevronDown } from 'lucide-react';

interface EquationEditorProps {
  equation: string;
  onChange: (equation: string, dependencies: EquationDependencies) => void;
  availableStocks: string[];
  availableParameters: Record<string, { description: string; value: number }>;
  label?: string;
  placeholder?: string;
}

export interface EquationDependencies {
  stocks: string[];
  parameters: string[];
}

export function EquationEditor({
  equation,
  onChange,
  availableStocks,
  availableParameters,
  label = "Equation",
  placeholder = "Enter equation..."
}: EquationEditorProps) {
  const [localEquation, setLocalEquation] = useState(equation);
  const [showStockMenu, setShowStockMenu] = useState(false);
  const [showParamMenu, setShowParamMenu] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);

  // Parse equation to extract dependencies
  const dependencies = useMemo(() => {
    const deps: EquationDependencies = {
      stocks: [],
      parameters: []
    };

    // Extract stock references (single uppercase letters or known stock IDs)
    const stockPattern = new RegExp(`\\b(${availableStocks.join('|')})\\b`, 'g');
    const stockMatches = localEquation.match(stockPattern);
    if (stockMatches) {
      deps.stocks = [...new Set(stockMatches)];
    }

    // Extract parameter references (p['param_name'] or p["param_name"])
    const paramPattern = /p\[['"]([^'"]+)['"]\]/g;
    let match;
    while ((match = paramPattern.exec(localEquation)) !== null) {
      deps.parameters.push(match[1]);
    }
    deps.parameters = [...new Set(deps.parameters)];

    return deps;
  }, [localEquation, availableStocks]);

  // Notify parent of changes
  useEffect(() => {
    onChange(localEquation, dependencies);
  }, [localEquation, dependencies, onChange]);

  const insertStock = (stock: string) => {
    const before = localEquation.slice(0, cursorPosition);
    const after = localEquation.slice(cursorPosition);
    const newEquation = `${before}${stock}${after}`;
    setLocalEquation(newEquation);
    setCursorPosition(cursorPosition + stock.length);
    setShowStockMenu(false);
  };

  const insertParameter = (paramKey: string) => {
    const paramRef = `p['${paramKey}']`;
    const before = localEquation.slice(0, cursorPosition);
    const after = localEquation.slice(cursorPosition);
    const newEquation = `${before}${paramRef}${after}`;
    setLocalEquation(newEquation);
    setCursorPosition(cursorPosition + paramRef.length);
    setShowParamMenu(false);
  };

  const insertOperator = (operator: string) => {
    const before = localEquation.slice(0, cursorPosition);
    const after = localEquation.slice(cursorPosition);
    const newEquation = `${before} ${operator} ${after}`;
    setLocalEquation(newEquation);
    setCursorPosition(cursorPosition + operator.length + 2);
  };

  const insertFunction = (func: string) => {
    const funcCall = `${func}()`;
    const before = localEquation.slice(0, cursorPosition);
    const after = localEquation.slice(cursorPosition);
    const newEquation = `${before}${funcCall}${after}`;
    setLocalEquation(newEquation);
    setCursorPosition(cursorPosition + func.length + 1); // Position cursor inside parentheses
  };

  return (
    <div className="space-y-3">
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium text-slate-300">
          {label}
        </label>
      )}

      {/* Equation Input */}
      <div className="relative">
        <textarea
          value={localEquation}
          onChange={(e) => {
            setLocalEquation(e.target.value);
            setCursorPosition(e.target.selectionStart);
          }}
          onSelect={(e) => setCursorPosition((e.target as HTMLTextAreaElement).selectionStart)}
          placeholder={placeholder}
          className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-slate-200 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          rows={3}
        />
      </div>

      {/* Quick Insert Buttons */}
      <div className="flex flex-wrap gap-2">
        {/* Insert Stock */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowStockMenu(!showStockMenu)}
            className="flex items-center gap-1 px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
          >
            <Plus size={12} />
            Stock
            <ChevronDown size={12} />
          </button>
          
          {showStockMenu && (
            <div className="absolute top-full mt-1 left-0 bg-slate-800 border border-slate-600 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto min-w-[150px]">
              {availableStocks.map(stock => (
                <button
                  key={stock}
                  type="button"
                  onClick={() => insertStock(stock)}
                  className="w-full text-left px-3 py-2 text-sm text-slate-200 hover:bg-slate-700 transition-colors"
                >
                  {stock}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Insert Parameter */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowParamMenu(!showParamMenu)}
            className="flex items-center gap-1 px-2 py-1 bg-purple-600 text-white text-xs rounded hover:bg-purple-700 transition-colors"
          >
            <Plus size={12} />
            Parameter
            <ChevronDown size={12} />
          </button>
          
          {showParamMenu && (
            <div className="absolute top-full mt-1 left-0 bg-slate-800 border border-slate-600 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto min-w-[200px]">
              {Object.entries(availableParameters).map(([key, param]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => insertParameter(key)}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-slate-700 transition-colors"
                >
                  <div className="text-slate-200 font-mono">{key}</div>
                  <div className="text-xs text-slate-400 truncate">{param.description}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Operators */}
        <button
          type="button"
          onClick={() => insertOperator('+')}
          className="px-2 py-1 bg-slate-700 text-white text-xs rounded hover:bg-slate-600 transition-colors"
        >
          +
        </button>
        <button
          type="button"
          onClick={() => insertOperator('-')}
          className="px-2 py-1 bg-slate-700 text-white text-xs rounded hover:bg-slate-600 transition-colors"
        >
          −
        </button>
        <button
          type="button"
          onClick={() => insertOperator('*')}
          className="px-2 py-1 bg-slate-700 text-white text-xs rounded hover:bg-slate-600 transition-colors"
        >
          ×
        </button>
        <button
          type="button"
          onClick={() => insertOperator('/')}
          className="px-2 py-1 bg-slate-700 text-white text-xs rounded hover:bg-slate-600 transition-colors"
        >
          ÷
        </button>

        {/* Functions */}
        <button
          type="button"
          onClick={() => insertFunction('clamp')}
          className="px-2 py-1 bg-slate-700 text-white text-xs rounded hover:bg-slate-600 transition-colors"
        >
          clamp()
        </button>
        <button
          type="button"
          onClick={() => insertFunction('max')}
          className="px-2 py-1 bg-slate-700 text-white text-xs rounded hover:bg-slate-600 transition-colors"
        >
          max()
        </button>
        <button
          type="button"
          onClick={() => insertFunction('min')}
          className="px-2 py-1 bg-slate-700 text-white text-xs rounded hover:bg-slate-600 transition-colors"
        >
          min()
        </button>
      </div>

      {/* Dependencies Display */}
      {(dependencies.stocks.length > 0 || dependencies.parameters.length > 0) && (
        <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700 space-y-2">
          <div className="text-xs font-semibold text-slate-400 uppercase">Dependencies</div>
          
          {dependencies.stocks.length > 0 && (
            <div>
              <div className="text-xs text-slate-500 mb-1">Stocks (will create graph links):</div>
              <div className="flex flex-wrap gap-1">
                {dependencies.stocks.map(stock => (
                  <span
                    key={stock}
                    className="px-2 py-0.5 bg-blue-600/20 text-blue-400 text-xs rounded border border-blue-600/30"
                  >
                    {stock}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {dependencies.parameters.length > 0 && (
            <div>
              <div className="text-xs text-slate-500 mb-1">Parameters:</div>
              <div className="flex flex-wrap gap-1">
                {dependencies.parameters.map(param => (
                  <span
                    key={param}
                    className="px-2 py-0.5 bg-purple-600/20 text-purple-400 text-xs rounded border border-purple-600/30"
                  >
                    {param}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
