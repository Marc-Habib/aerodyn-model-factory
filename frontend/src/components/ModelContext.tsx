import { FileText, X, HelpCircle, Database, Target, AlertCircle } from 'lucide-react';
import { useState } from 'react';

interface ModelMeta {
  name: string;
  description: string;
  company: {
    name: string;
    type: string;
    focus: string;
    context: string;
  };
  questions: string[];
  data_sources: string[];
  assumptions: string[];
  limitations: string[];
}

interface FeedbackLoop {
  id: string;
  name: string;
  type: 'reinforcing' | 'balancing';
  polarity: string;
  stocks: string[];
  description: string;
  business_meaning: string;
  strength: string;
}

interface ModelContextProps {
  meta: ModelMeta;
  feedbackLoops: FeedbackLoop[];
  stockCount: number;
  parameterCount: number;
  scenarioCount: number;
}

export function ModelContext({ meta, feedbackLoops, stockCount, parameterCount, scenarioCount }: ModelContextProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 flex items-center gap-2 px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium shadow-lg transition-all z-50"
      >
        <FileText size={20} />
        Model Context
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700 bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/20">
              <FileText size={24} className="text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-100">Model Context</h2>
              <p className="text-sm text-slate-400">{meta.name}</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {/* Company Context */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Target size={18} className="text-blue-400" />
              <h3 className="text-lg font-semibold text-slate-200">Company Context</h3>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-4 space-y-2">
              <div>
                <span className="text-sm font-medium text-slate-400">Company:</span>
                <span className="ml-2 text-slate-200">{meta.company.name}</span>
              </div>
              <div>
                <span className="text-sm font-medium text-slate-400">Type:</span>
                <span className="ml-2 text-slate-200">{meta.company.type}</span>
              </div>
              <p className="text-sm text-slate-300 pt-2">{meta.company.focus}</p>
              <p className="text-sm text-slate-400 italic">{meta.company.context}</p>
            </div>
          </section>

          {/* Strategic Questions */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <HelpCircle size={18} className="text-violet-400" />
              <h3 className="text-lg font-semibold text-slate-200">Strategic Questions</h3>
            </div>
            <div className="space-y-2">
              {meta.questions.map((q, i) => (
                <div key={i} className="flex gap-3 bg-slate-800/50 rounded-lg p-3">
                  <span className="text-violet-400 font-bold">{i + 1}.</span>
                  <p className="text-sm text-slate-300">{q}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Model Structure */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Database size={18} className="text-emerald-400" />
              <h3 className="text-lg font-semibold text-slate-200">Model Structure</h3>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-800/50 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-emerald-400">{stockCount}</div>
                <div className="text-sm text-slate-400 mt-1">Stocks</div>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-blue-400">{parameterCount}</div>
                <div className="text-sm text-slate-400 mt-1">Parameters</div>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-violet-400">{scenarioCount}</div>
                <div className="text-sm text-slate-400 mt-1">Scenarios</div>
              </div>
            </div>
          </section>

          {/* Feedback Loops */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <div className="text-lg font-semibold text-slate-200">Key Feedback Loops</div>
            </div>
            <div className="space-y-3">
              {feedbackLoops.map((loop) => (
                <div key={loop.id} className="bg-slate-800/50 rounded-lg p-4 border-l-4" style={{
                  borderColor: loop.type === 'reinforcing' ? '#10b981' : '#ef4444'
                }}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        loop.type === 'reinforcing' 
                          ? 'bg-emerald-500/20 text-emerald-400' 
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {loop.polarity} {loop.type.toUpperCase()}
                      </span>
                      <span className="text-sm font-medium text-slate-300">{loop.name}</span>
                    </div>
                    <span className="text-xs text-slate-500">{loop.strength} impact</span>
                  </div>
                  <p className="text-sm text-slate-400 mb-2">{loop.description}</p>
                  <p className="text-sm text-slate-300 italic">💡 {loop.business_meaning}</p>
                  <div className="flex gap-1 mt-2">
                    {loop.stocks.map((stock) => (
                      <span key={stock} className="px-2 py-1 rounded bg-slate-700 text-xs text-slate-300 font-mono">
                        {stock}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Data Sources */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Database size={18} className="text-amber-400" />
              <h3 className="text-lg font-semibold text-slate-200">Data Sources</h3>
            </div>
            <ul className="space-y-2">
              {meta.data_sources.map((source, i) => (
                <li key={i} className="flex gap-2 text-sm text-slate-300">
                  <span className="text-amber-400">•</span>
                  {source}
                </li>
              ))}
            </ul>
          </section>

          {/* Assumptions & Limitations */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle size={18} className="text-orange-400" />
              <h3 className="text-lg font-semibold text-slate-200">Assumptions & Limitations</h3>
            </div>
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-slate-400 mb-2">Assumptions:</h4>
                <ul className="space-y-1">
                  {meta.assumptions.map((assumption, i) => (
                    <li key={i} className="flex gap-2 text-sm text-slate-300">
                      <span className="text-slate-500">→</span>
                      {assumption}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-medium text-slate-400 mb-2">Limitations:</h4>
                <ul className="space-y-1">
                  {meta.limitations.map((limitation, i) => (
                    <li key={i} className="flex gap-2 text-sm text-slate-300">
                      <span className="text-orange-400">⚠</span>
                      {limitation}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-700 bg-slate-800/50">
          <p className="text-xs text-slate-500 text-center">
            This model is designed to explore strategic options, not to make precise predictions.
            Use insights to inform discussion and decision-making.
          </p>
        </div>
      </div>
    </div>
  );
}
