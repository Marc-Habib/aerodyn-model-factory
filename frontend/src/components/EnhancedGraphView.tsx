import { useCallback, useMemo, useState } from 'react';
import {
  ReactFlow,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
  Position,
  Handle,
} from '@xyflow/react';
import type { Node, Edge, NodeProps } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Edit2, Save, Copy, ChevronDown, ChevronUp } from 'lucide-react';
import type { GraphData } from '../api';

interface EnhancedGraphViewProps {
  data: GraphData | null;
  equations: { stocks?: Record<string, { name: string; equation: string; target_equation: string; description: string }> };
  paramOverrides?: Record<string, number>;
  onUpdateEquation?: (stockId: string, field: 'equation' | 'target_equation' | 'description', value: string) => void;
  onToggleStock?: (stockId: string, enabled: boolean) => void;
}

interface StockNodeData extends Record<string, unknown> {
  id: string;
  label: string;
  short: string;
  category: string;
  description: string;
  business_meaning: string;
  color: string;
  equation?: string;
  target_equation?: string;
  isExpanded: boolean;
  isEnabled: boolean;
}

function StockNode({ data, selected }: NodeProps<StockNodeData>) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedEquation, setEditedEquation] = useState(data.equation || '');
  const [editedTarget, setEditedTarget] = useState(data.target_equation || '');
  const [showJson, setShowJson] = useState(false);

  const handleSave = () => {
    // In a real implementation, this would call the API to update
    setIsEditing(false);
  };

  const handleCopyJson = () => {
    const json = JSON.stringify({
      [data.id]: {
        name: data.label,
        equation: data.equation,
        target_equation: data.target_equation,
        description: data.description
      }
    }, null, 2);
    navigator.clipboard.writeText(json);
  };

  const nodeColor = data.color || '#3b82f6';
  const isExpanded = data.isExpanded;

  return (
    <div 
      className={`bg-slate-900 rounded-lg border-2 transition-all ${
        selected ? 'shadow-lg shadow-blue-500/50' : 'shadow-md'
      }`}
      style={{ 
        borderColor: nodeColor,
        minWidth: isExpanded ? '400px' : '140px',
        maxWidth: isExpanded ? '600px' : 'fit-content',
        zIndex: isExpanded ? 1000 : 1
      }}
    >
      <Handle type="target" position={Position.Left} className="w-3 h-3" style={{ background: nodeColor }} />
      
      {/* Header - clickable to toggle expand/collapse */}
      <div 
        className="px-3 py-2 flex items-center justify-between cursor-pointer"
        style={{ backgroundColor: `${nodeColor}20` }}
      >
        <div className="flex items-center gap-2">
          <div 
            className="w-2 h-2 rounded-full" 
            style={{ backgroundColor: nodeColor }}
          />
          <div className="font-bold text-slate-200 text-sm whitespace-nowrap">{data.label}</div>
        </div>
        <div className="text-xs text-slate-500 capitalize ml-2">{data.category}</div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div 
          onClick={(e) => e.stopPropagation()}
          className="p-3 space-y-3 max-h-96 overflow-y-auto"
        >
          {/* Business Meaning */}
          <div>
            <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">Business Meaning</div>
            <p className="text-xs text-slate-300 italic">{data.business_meaning}</p>
          </div>

          {/* Description */}
          <div>
            <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">Description</div>
            <p className="text-xs text-slate-400">{data.description}</p>
          </div>

          {/* Target Equation */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="text-xs text-slate-500 uppercase tracking-wide">Target Equation</div>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-slate-400 hover:text-blue-400 transition-colors"
                  title="Edit equation"
                >
                  <Edit2 size={12} />
                </button>
              )}
            </div>
            {isEditing ? (
              <textarea
                value={editedTarget}
                onChange={(e) => setEditedTarget(e.target.value)}
                className="w-full text-xs bg-slate-800 p-2 rounded text-blue-400 font-mono border border-slate-700 focus:border-blue-500 focus:outline-none"
                rows={3}
              />
            ) : (
              <code className="block text-xs bg-slate-800 p-2 rounded text-blue-400 font-mono overflow-x-auto whitespace-pre-wrap break-all">
                {data.id}_target = {data.target_equation}
              </code>
            )}
          </div>

          {/* Derivative */}
          <div>
            <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">Derivative</div>
            {isEditing ? (
              <textarea
                value={editedEquation}
                onChange={(e) => setEditedEquation(e.target.value)}
                className="w-full text-xs bg-slate-800 p-2 rounded text-emerald-400 font-mono border border-slate-700 focus:border-emerald-500 focus:outline-none"
                rows={2}
              />
            ) : (
              <code className="block text-xs bg-slate-800 p-2 rounded text-emerald-400 font-mono overflow-x-auto whitespace-pre-wrap break-all">
                d{data.id}/dt = {data.equation}
              </code>
            )}
          </div>

          {/* Edit Controls */}
          {isEditing && (
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                className="flex-1 flex items-center justify-center gap-1 px-2 py-1 bg-blue-600 hover:bg-blue-500 rounded text-xs transition-colors"
              >
                <Save size={12} />
                Save
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditedEquation(data.equation || '');
                  setEditedTarget(data.target_equation || '');
                }}
                className="flex-1 px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded text-xs transition-colors"
              >
                Cancel
              </button>
            </div>
          )}

          {/* JSON Toggle */}
          <div>
            <button
              onClick={() => setShowJson(!showJson)}
              className="flex items-center gap-2 text-xs text-slate-400 hover:text-slate-200 transition-colors"
            >
              {showJson ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              {showJson ? 'Hide' : 'Show'} JSON
            </button>
            {showJson && (
              <div className="mt-2">
                <div className="flex items-center justify-between mb-1">
                  <div className="text-xs text-slate-500">Configuration</div>
                  <button
                    onClick={handleCopyJson}
                    className="text-slate-400 hover:text-blue-400 transition-colors"
                    title="Copy JSON"
                  >
                    <Copy size={12} />
                  </button>
                </div>
                <pre className="text-xs bg-slate-800 p-2 rounded text-slate-300 overflow-x-auto border border-slate-700 hover:overflow-x-scroll" style={{ overflowX: 'auto' }}>
{JSON.stringify({
  [data.id]: {
    name: data.label,
    equation: data.equation,
    target_equation: data.target_equation,
    description: data.description
  }
}, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}

      <Handle type="source" position={Position.Right} className="w-3 h-3" style={{ background: nodeColor }} />
    </div>
  );
}

const nodeTypes = {
  stockNode: StockNode,
};

export function EnhancedGraphView({ data, equations, onToggleStock }: EnhancedGraphViewProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [enabledStocks, setEnabledStocks] = useState<Set<string>>(new Set(data?.nodes.map(n => n.id) || []));

  const initialNodes: Node<StockNodeData>[] = useMemo(() => {
    if (!data) return [];

    return data.nodes.map((node, i) => {
      const equation = equations?.stocks?.[node.id];
      const angle = (2 * Math.PI * i) / data.nodes.length - Math.PI / 2;
      const radius = 250;
      const x = 400 + radius * Math.cos(angle);
      const y = 300 + radius * Math.sin(angle);

      return {
        id: node.id,
        type: 'stockNode',
        position: { x, y },
        data: {
          id: node.id,
          label: node.label,
          short: node.short || node.id,
          category: node.category,
          description: node.description,
          business_meaning: node.business_meaning,
          color: node.color || '#3b82f6',
          equation: equation?.equation,
          target_equation: equation?.target_equation,
          isExpanded: expandedNodes.has(node.id),
          isEnabled: enabledStocks.has(node.id),
        },
      };
    });
  }, [data, equations, expandedNodes, enabledStocks]);

  const initialEdges: Edge[] = useMemo(() => {
    if (!data) return [];

    return data.edges.map((edge) => {
      const isNegative = edge.type === 'negative' || (edge.coefficient && edge.coefficient.toString().startsWith('-'));
      
      return {
        id: edge.id,
        source: edge.source,
        target: edge.target,
        animated: true,
        style: { 
          stroke: isNegative ? '#ef4444' : '#64748b',
          strokeWidth: 2,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: isNegative ? '#ef4444' : '#64748b',
          width: 20,
          height: 20,
        },
        label: edge.coefficient ? edge.coefficient.toString() : undefined,
        labelStyle: { fill: '#94a3b8', fontSize: 10 },
        labelBgStyle: { fill: '#0f172a' },
      };
    });
  }, [data]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(node.id)) {
        newSet.delete(node.id);
      } else {
        newSet.add(node.id);
      }
      return newSet;
    });

    // Update node data
    setNodes(nds =>
      nds.map(n => {
        if (n.id === node.id) {
          return {
            ...n,
            data: {
              ...n.data,
              isExpanded: !expandedNodes.has(node.id),
            },
          };
        }
        return n;
      })
    );
  }, [expandedNodes, setNodes]);

  const handleToggleStock = useCallback((stockId: string) => {
    setEnabledStocks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(stockId)) {
        newSet.delete(stockId);
      } else {
        newSet.add(stockId);
      }
      return newSet;
    });

    if (onToggleStock) {
      onToggleStock(stockId, !enabledStocks.has(stockId));
    }
  }, [enabledStocks, onToggleStock]);

  if (!data) {
    return (
      <div className="flex items-center justify-center h-96 text-slate-500">
        <p>No graph data available</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[700px] bg-slate-900 rounded-lg border border-slate-700">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.2}
        maxZoom={2}
        defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
      >
        <Background color="#334155" gap={16} />
      </ReactFlow>

      {/* Stock Toggle Panel */}
      <div className="absolute top-4 left-4 bg-slate-900/95 backdrop-blur border border-slate-700 rounded-lg p-3 max-w-xs">
        <div className="text-xs text-slate-400 uppercase tracking-wide mb-2">Active Stocks</div>
        <div className="space-y-1 max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800">
          {data.nodes.map(node => (
            <label key={node.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-slate-800/50 p-1 rounded">
              <input
                type="checkbox"
                checked={enabledStocks.has(node.id)}
                onChange={() => handleToggleStock(node.id)}
                className="rounded border-slate-600 text-blue-600 focus:ring-blue-500"
              />
              <span className="font-mono text-slate-300">{node.id}</span>
              <span className="text-xs text-slate-500">{node.short}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Instructions */}
      <div className="absolute bottom-4 left-4 bg-slate-900/95 backdrop-blur border border-slate-700 rounded-lg p-3 text-xs text-slate-400 max-w-sm">
        <div className="font-semibold text-slate-300 mb-1">Graph Controls:</div>
        <ul className="space-y-0.5">
          <li>• <strong>Click node</strong> to expand/collapse details</li>
          <li>• <strong>Drag nodes</strong> to reposition</li>
          <li>• <strong>Scroll</strong> to zoom in/out</li>
          <li>• <strong>Edit icon</strong> in expanded node to modify equations</li>
          <li>• <strong>Toggle stocks</strong> in top-left panel</li>
        </ul>
      </div>
    </div>
  );
}
