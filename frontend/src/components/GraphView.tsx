import { useMemo, useState, useCallback } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MarkerType,
  Position,
  type Node,
  type Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { X } from 'lucide-react';

interface StockDef {
  name: string;
  equation: string;
  target_equation: string;
  description: string;
}

interface GraphData {
  nodes: Array<{
    id: string;
    type: string;
    label: string;
    description?: string;
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
    coefficient: string;
    label?: string;
    type?: string;
  }>;
}

interface GraphViewProps {
  data: GraphData | null;
  equations?: { stocks?: Record<string, StockDef> };
  paramOverrides?: Record<string, number>;
  onNodeClick?: (nodeId: string) => void;
}

export function GraphView({ data, equations, paramOverrides, onNodeClick }: GraphViewProps) {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [showPanel, setShowPanel] = useState(false);

  // Get connected nodes and edges for highlighting
  const { connectedNodes, connectedEdges } = useMemo(() => {
    if (!selectedNode || !data) return { connectedNodes: new Set<string>(), connectedEdges: new Set<string>() };
    
    const nodes = new Set<string>([selectedNode]);
    const edges = new Set<string>();
    
    // Find all edges connected to selected node
    data.edges.forEach(edge => {
      if (edge.source === selectedNode || edge.target === selectedNode) {
        edges.add(edge.id);
        nodes.add(edge.source);
        nodes.add(edge.target);
      }
    });
    
    return { connectedNodes: nodes, connectedEdges: edges };
  }, [selectedNode, data]);

  const { nodes, edges } = useMemo(() => {
    if (!data) return { nodes: [], edges: [] };

    const nodeCount = data.nodes.length;
    const radius = 180;
    const centerX = 280;
    const centerY = 220;

    const nodes: Node[] = data.nodes.map((node, i) => {
      const angle = (2 * Math.PI * i) / nodeCount - Math.PI / 2;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);

      const isSelected = selectedNode === node.id;
      const isConnected = connectedNodes.has(node.id);
      const isGreyed = selectedNode && !isConnected;

      const nodeColor = node.color || '#3b82f6';
      
      return {
        id: node.id,
        position: { x, y },
        data: { label: node.short || node.id },
        style: {
          background: isGreyed ? '#1e293b' : '#0f172a',
          color: isGreyed ? '#475569' : '#e2e8f0',
          border: isSelected ? `2px solid ${nodeColor}` : isConnected ? `1px solid ${nodeColor}` : '1px solid #334155',
          borderRadius: '8px',
          padding: '10px 14px',
          fontSize: '13px',
          fontWeight: '600',
          opacity: isGreyed ? 0.4 : 1,
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
      };
    });

    const edges: Edge[] = data.edges.map((edge) => {
      const isNegative = edge.type === 'negative' || (edge.coefficient && edge.coefficient.toString().startsWith('-'));
      const isConnected = connectedEdges.has(edge.id);
      const isGreyed = selectedNode && !isConnected;
      
      return {
        id: edge.id,
        source: edge.source,
        target: edge.target,
        style: { 
          stroke: isGreyed ? '#1e293b' : (isNegative ? '#ef4444' : '#64748b'),
          strokeWidth: isConnected ? 2 : 1,
          opacity: isGreyed ? 0.2 : (isConnected ? 1 : 0.6),
          transition: 'all 0.2s ease',
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: isGreyed ? '#1e293b' : (isNegative ? '#ef4444' : '#64748b'),
          width: 15,
          height: 15,
        },
      };
    });

    return { nodes, edges };
  }, [data, selectedNode, connectedNodes, connectedEdges]);

  const handleNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(prev => prev === node.id ? null : node.id);
    setShowPanel(true);
    onNodeClick?.(node.id);
  }, [onNodeClick]);

  const handlePaneClick = useCallback(() => {
    setSelectedNode(null);
    setShowPanel(false);
  }, []);

  const selectedStock = selectedNode ? equations?.stocks?.[selectedNode] : null;

  if (!data) {
    return (
      <div className="h-full flex items-center justify-center text-slate-500">
        Loading graph...
      </div>
    );
  }

  return (
    <div className="relative" style={{ height: '450px', width: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodeClick={handleNodeClick}
        onPaneClick={handlePaneClick}
        fitView
        attributionPosition="bottom-left"
        style={{ background: '#0a0f1a' }}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#1e293b" gap={30} size={1} />
        <Controls 
          showInteractive={false}
          style={{ 
            background: '#0f172a', 
            borderRadius: '6px',
            border: '1px solid #1e293b',
          }}
        />
      </ReactFlow>

      {/* Info Panel */}
      {showPanel && selectedNode && (
        <div className="absolute top-4 right-4 w-80 bg-slate-900/95 backdrop-blur border border-slate-700 rounded-lg shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
            <h3 className="font-semibold text-slate-200">
              {selectedNode}: {selectedStock?.name || data.nodes.find(n => n.id === selectedNode)?.label}
            </h3>
            <button onClick={() => { setSelectedNode(null); setShowPanel(false); }} className="text-slate-400 hover:text-slate-200">
              <X size={16} />
            </button>
          </div>
          
          <div className="p-4 space-y-4 max-h-80 overflow-y-auto">
            {selectedStock && (
              <>
                <div>
                  <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">Target Equation</div>
                  <code className="block text-xs bg-slate-800 p-2 rounded text-cyan-400 font-mono overflow-x-auto">
                    {selectedStock.target_equation}
                  </code>
                </div>
                <div>
                  <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">Derivative</div>
                  <code className="block text-xs bg-slate-800 p-2 rounded text-emerald-400 font-mono">
                    d{selectedNode}/dt = {selectedStock.equation}
                  </code>
                </div>
              </>
            )}
            
            {/* Connected flows */}
            <div>
              <div className="text-xs text-slate-500 uppercase tracking-wide mb-2">Connections</div>
              <div className="space-y-1">
                {data.edges.filter(e => e.source === selectedNode || e.target === selectedNode).map(edge => (
                  <div key={edge.id} className="flex items-center gap-2 text-xs">
                    <span className={edge.source === selectedNode ? 'text-slate-400' : 'text-cyan-400'}>
                      {edge.source}
                    </span>
                    <span className="text-slate-600">→</span>
                    <span className={edge.target === selectedNode ? 'text-slate-400' : 'text-cyan-400'}>
                      {edge.target}
                    </span>
                    <span className={`ml-auto font-mono ${edge.coefficient && edge.coefficient.toString().startsWith('-') ? 'text-red-400' : 'text-slate-500'}`}>
                      {edge.coefficient || 'N/A'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Active param overrides */}
            {paramOverrides && Object.keys(paramOverrides).length > 0 && (
              <div>
                <div className="text-xs text-slate-500 uppercase tracking-wide mb-2">Active Overrides</div>
                <div className="space-y-1">
                  {Object.entries(paramOverrides).map(([key, val]) => (
                    <div key={key} className="flex justify-between text-xs">
                      <span className="text-slate-400">{key}</span>
                      <span className="font-mono text-amber-400">{val.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-4 left-4 flex gap-4 text-xs text-slate-500">
        <div className="flex items-center gap-1">
          <div className="w-3 h-0.5 bg-slate-500"></div>
          <span>positive</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-0.5 bg-red-500"></div>
          <span>negative</span>
        </div>
      </div>
    </div>
  );
}
