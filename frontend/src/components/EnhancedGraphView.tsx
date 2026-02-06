import { useCallback, useMemo, useState, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  MarkerType,
  Position,
  Handle,
} from '@xyflow/react';
import type { Node, Edge, NodeProps, Connection } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import '../styles/react-flow-custom.css';
import { Edit2, Save, Copy, ChevronDown, ChevronUp, Plus, Eye, EyeOff, Sparkles, Maximize2, Minimize2, Undo, Redo, Trash2 } from 'lucide-react';
import type { GraphData } from '../api';
import { createDraft, addChangeToDraft, validateDraft, applyDraft } from '../api/drafts';
import type { Draft, PatchChange } from '../api/drafts';
import { NodeEditModal } from './NodeEditModal';
import { EdgeEditModal } from './EdgeEditModal';
import { AIProposalModal } from './AIProposalModal';
import { DraftPanel } from './DraftPanel';
import { checkAIStatus, generateAIPatch } from '../api/ai';

interface EnhancedGraphViewProps {
  data: GraphData | null;
  equations: { stocks?: Record<string, { name?: string; equation?: string; target_equation?: string; target?: string; derivative?: string; description?: string }> };
  paramOverrides?: Record<string, number>;
  parameters?: Record<string, { description: string; value: number }>;
  onUpdateEquation?: (stockId: string, field: 'equation' | 'target_equation' | 'description', value: string) => void;
  onToggleStock?: (stockId: string, enabled: boolean) => void;
  modelData?: any;
}

interface DraftState {
  active: boolean;
  draft: Draft | null;
  changes: PatchChange[];
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
  onEdit?: (nodeId: string, nodeData: any) => void;
}

function StockNode({ data, selected }: NodeProps<StockNodeData>) {
  const [showJson, setShowJson] = useState(false);

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
            <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">Target Equation</div>
            <code className="block text-xs bg-slate-800 p-2 rounded text-blue-400 font-mono overflow-x-auto whitespace-pre-wrap break-all">
              {data.id}_target = {data.target_equation}
            </code>
          </div>

          {/* Derivative */}
          <div>
            <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">Derivative</div>
            <code className="block text-xs bg-slate-800 p-2 rounded text-emerald-400 font-mono overflow-x-auto whitespace-pre-wrap break-all">
              d{data.id}/dt = {data.equation}
            </code>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2 border-t border-slate-700">
            <button
              onClick={() => data.onEdit?.(data.id, data)}
              className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-blue-600 hover:bg-blue-500 rounded text-xs font-medium transition-colors"
            >
              <Edit2 size={14} />
              Edit Node
            </button>
          </div>

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

export function EnhancedGraphView({ data, equations, parameters = {}, onToggleStock, modelData }: EnhancedGraphViewProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [enabledStocks, setEnabledStocks] = useState<Set<string>>(new Set(data?.nodes.map(n => n.id) || []));
  
  // Draft system state
  const [draftState, setDraftState] = useState<DraftState>({
    active: false,
    draft: null,
    changes: []
  });
  const [showDraftPanel, setShowDraftPanel] = useState(true);
  const [undoStack, setUndoStack] = useState<PatchChange[]>([]);
  const [redoStack, setRedoStack] = useState<PatchChange[]>([]);
  
  // Modal state
  const [editingNode, setEditingNode] = useState<{ id: string; data: any } | null>(null);
  const [editingEdge, setEditingEdge] = useState<Edge | null>(null);
  
  // AI state
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiProposals, setAiProposals] = useState<PatchChange[]>([]);
  const [aiError, setAiError] = useState<string>();
  const [aiAvailable, setAiAvailable] = useState(false);
  
  // UI state
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Check AI availability
  useEffect(() => {
    checkAIStatus()
      .then(status => setAiAvailable(status.available))
      .catch(() => setAiAvailable(false));
  }, []);

  // Start a new draft
  const startDraft = useCallback(async () => {
    try {
      const draft = await createDraft('Live model editing session');
      setDraftState({
        active: true,
        draft,
        changes: []
      });
    } catch (error) {
      console.error('Failed to create draft:', error);
    }
  }, []);

  // Add change to draft
  const addChange = useCallback(async (change: PatchChange) => {
    if (!draftState.draft) {
      await startDraft();
      return;
    }

    try {
      await addChangeToDraft(draftState.draft.draft_id, change);
      
      setDraftState(prev => ({
        ...prev,
        changes: [...prev.changes, change]
      }));

      setUndoStack(prev => [...prev, change]);
      setRedoStack([]);
    } catch (error) {
      console.error('Failed to add change:', error);
    }
  }, [draftState.draft, startDraft]);

  // Validate draft
  const handleValidate = useCallback(async () => {
    if (!draftState.draft) return;
    try {
      const result = await validateDraft(draftState.draft.draft_id);
      if (result.success) {
        alert(`✅ Draft is valid!\n\nApplied: ${result.applied_changes}\nWarnings: ${result.warnings.length}`);
      } else {
        alert(`❌ Draft has errors:\n\n${result.errors.join('\n')}`);
      }
    } catch (error) {
      console.error('Validation failed:', error);
      alert('Validation failed. Check console for details.');
    }
  }, [draftState.draft]);

  // Apply draft
  const handleApply = useCallback(async (commit: boolean = false) => {
    if (!draftState.draft) return;
    try {
      const result = await applyDraft(draftState.draft.draft_id, commit);
      if (result.success) {
        alert(`✅ Draft applied successfully!\n\n${commit ? 'Changes committed to config files.' : 'Effective model created for simulation.'}`);
        setDraftState({ active: false, draft: null, changes: [] });
        setUndoStack([]);
        setRedoStack([]);
      } else {
        alert(`❌ Failed to apply draft:\n\n${result.errors.join('\n')}`);
      }
    } catch (error) {
      console.error('Apply failed:', error);
      alert('Apply failed. Check console for details.');
    }
  }, [draftState.draft]);

  // Undo/Redo
  const handleUndo = useCallback(() => {
    if (undoStack.length === 0) return;
    const lastChange = undoStack[undoStack.length - 1];
    setUndoStack(prev => prev.slice(0, -1));
    setRedoStack(prev => [...prev, lastChange]);
    console.log('Undo:', lastChange);
  }, [undoStack]);

  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) return;
    const change = redoStack[redoStack.length - 1];
    setRedoStack(prev => prev.slice(0, -1));
    setUndoStack(prev => [...prev, change]);
    console.log('Redo:', change);
  }, [redoStack]);

  // AI generation
  const handleAIGenerate = useCallback(async (prompt: string, selectedNodes?: string[]) => {
    setAiGenerating(true);
    setAiError(undefined);
    try {
      const response = await generateAIPatch({ prompt, selected_nodes: selectedNodes });
      setAiProposals(response.patch.changes);
    } catch (error) {
      setAiError(error instanceof Error ? error.message : 'AI generation failed');
    } finally {
      setAiGenerating(false);
    }
  }, []);

  const handleAcceptAIProposals = useCallback(async (changes: PatchChange[]) => {
    for (const change of changes) {
      await addChange(change);
    }
    setShowAIModal(false);
    setAiProposals([]);
  }, [addChange]);

  // Node/Edge handlers
  const handleNodeSave = useCallback((nodeId: string, updates: any, dependencies?: {
    target: { stocks: string[]; parameters: string[] };
    derivative: { stocks: string[]; parameters: string[] };
  }) => {
    // Update node data
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId ? { ...node, data: { ...node.data, ...updates } } : node
      )
    );
    
    // Auto-generate edges from equation dependencies
    if (dependencies) {
      const allDependentStocks = [...new Set([...dependencies.target.stocks, ...dependencies.derivative.stocks])];
      
      // Remove old edges from this node
      setEdges((eds) => eds.filter((edge) => edge.target !== nodeId || !edge.id.includes('auto_')));
      
      // Create new edges for each dependent stock
      allDependentStocks.forEach((sourceStock) => {
        if (sourceStock !== nodeId) { // Don't create self-loops
          const edgeId = `auto_${sourceStock}_to_${nodeId}`;
          setEdges((eds) => {
            // Check if edge already exists
            if (eds.some(e => e.id === edgeId)) return eds;
            
            return [...eds, {
              id: edgeId,
              source: sourceStock,
              target: nodeId,
              animated: true,
              style: { stroke: '#64748b', strokeWidth: 2 },
              markerEnd: { type: MarkerType.ArrowClosed, color: '#64748b', width: 20, height: 20 },
              label: 'auto',
              labelStyle: { fill: '#94a3b8', fontSize: 10 },
              labelBgStyle: { fill: '#0f172a' },
            }];
          });
          
          // Add change for new relation
          addChange({
            op: 'add_relation',
            id: edgeId,
            data: {
              source: sourceStock,
              target: nodeId,
              type: 'positive',
              description: `Auto-generated from equation dependency`
            },
            reason: 'Auto-generated relation from equation'
          });
        }
      });
    }
    
    addChange({
      op: 'update_state',
      symbol: nodeId,
      data: updates,
      reason: 'Node properties updated'
    });
    setEditingNode(null);
  }, [addChange]);

  const handleEdgeSave = useCallback((edgeId: string, updates: any) => {
    setEdges((eds) =>
      eds.map((edge) =>
        edge.id === edgeId ? { ...edge, label: updates.coefficient?.toString(), data: { ...edge.data, ...updates } } : edge
      )
    );
    addChange({
      op: 'update_relation',
      id: edgeId,
      data: updates,
      reason: 'Relation updated'
    });
    setEditingEdge(null);
  }, [addChange]);

  const handleEdgeDelete = useCallback((edgeId: string) => {
    setEdges((eds) => eds.filter((edge) => edge.id !== edgeId));
    addChange({
      op: 'remove_relation',
      id: edgeId,
      data: {},
      reason: 'Relation deleted'
    });
    setEditingEdge(null);
  }, [addChange]);

  // Add node
  const addNode = useCallback(() => {
    const newSymbol = prompt('Enter new state symbol (e.g., M):');
    if (!newSymbol) return;
    const newName = prompt('Enter state name:');
    if (!newName) return;
    const category = prompt('Enter category (capability/governance/execution/risk/market):') || 'capability';

    const newNode: Node = {
      id: newSymbol,
      type: 'stockNode',
      position: { x: 400, y: 300 },
      data: {
        id: newSymbol,
        label: newName,
        short: newSymbol,
        category,
        description: 'New state variable',
        business_meaning: 'What does this represent?',
        color: '#3b82f6',
        isExpanded: false,
      },
    };

    setNodes((nds) => [...nds, newNode]);
    addChange({
      op: 'add_state',
      symbol: newSymbol,
      data: {
        name: newName,
        short: newSymbol,
        category,
        description: 'New state variable',
        business_meaning: 'What does this represent?',
        initial: 0.5,
        ui: { x: 400, y: 300 }
      },
      reason: 'State added via graph editor'
    });
  }, [addChange]);

  // Edge connection
  const onConnect = useCallback((connection: Connection) => {
    setEdges((eds) => addEdge(connection, eds));
    addChange({
      op: 'add_relation',
      id: `${connection.source}_to_${connection.target}`,
      data: {
        source: connection.source,
        target: connection.target,
        coefficient: 0.5,
        type: 'positive',
        description: 'New relation'
      },
      reason: 'Relation added via graph editor'
    });
  }, [addChange]);

  // Edge click
  const onEdgeClick = useCallback((_: React.MouseEvent, edge: Edge) => {
    setEditingEdge(edge);
  }, []);

  // Handle accept change (individual change from DraftPanel)
  const handleAcceptChange = useCallback((changeIndex: number) => {
    // For now, accepting individual changes just logs
    // In a full implementation, this would apply just that change
    console.log('Accepting change:', draftState.changes[changeIndex]);
    alert('Individual change accepted. Use Apply button to apply all changes.');
  }, [draftState.changes]);

  // Handle reject change (remove from draft and undo the visual change)
  const handleRejectChange = useCallback((changeIndex: number) => {
    const changeToReject = draftState.changes[changeIndex];
    console.log('Rejecting change:', changeToReject);
    
    // Undo the visual change based on operation type
    switch (changeToReject.op) {
      case 'add_state':
        // Remove the added node
        if (changeToReject.symbol) {
          setNodes((nds) => nds.filter(n => n.id !== changeToReject.symbol));
        }
        break;
        
      case 'update_state':
        // Restore original node data (we don't have original, so just notify)
        console.log('Update state rejected - original data not stored');
        // In a full implementation, we'd store original data before changes
        break;
        
      case 'add_relation':
        // Remove the added edge
        if (changeToReject.id) {
          setEdges((eds) => eds.filter(e => e.id !== changeToReject.id));
        } else if (changeToReject.data?.source && changeToReject.data?.target) {
          // Try to find by source/target if no ID
          const edgeId = `${changeToReject.data.source}_to_${changeToReject.data.target}`;
          setEdges((eds) => eds.filter(e => e.id !== edgeId));
        }
        break;
        
      case 'remove_relation':
        // Would need to restore the edge (not implemented - need original data)
        console.log('Remove relation rejected - restoration not implemented');
        break;
        
      case 'update_relation':
        // Would need to restore original edge data
        console.log('Update relation rejected - original data not stored');
        break;
        
      default:
        console.log('Reject not implemented for operation:', changeToReject.op);
    }
    
    // Remove from changes array
    setDraftState(prev => ({
      ...prev,
      changes: prev.changes.filter((_, i) => i !== changeIndex)
    }));
    
    // Remove from undo stack if present
    setUndoStack(prev => prev.filter(c => c !== changeToReject));
  }, [draftState.changes]);

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
          equation: equation?.derivative || equation?.equation,
          target_equation: equation?.target || equation?.target_equation,
          isExpanded: expandedNodes.has(node.id),
          isEnabled: enabledStocks.has(node.id),
          onEdit: (nodeId: string, nodeData: any) => {
            // Map StockNodeData to EditableNodeData format for modal
            setEditingNode({ 
              id: nodeId, 
              data: {
                symbol: nodeData.id,
                label: nodeData.label,
                short: nodeData.short,
                category: nodeData.category,
                description: nodeData.description,
                business_meaning: nodeData.business_meaning,
                initial: 0.5, // Default value
                color: nodeData.color,
                isDraft: false,
                isModified: false,
              }
            });
          },
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
    <div className={`relative transition-all duration-300 ${
      isFullscreen 
        ? 'fixed top-0 left-0 right-0 bottom-0 z-[9999] w-full h-full bg-slate-900' 
        : 'w-full h-[700px] bg-slate-900 rounded-lg border border-slate-700'
    }`}>
      {/* Toolbar */}
      {!isFullscreen && (
        <div className="absolute top-4 left-4 z-10 flex gap-2">
          <button
            onClick={addNode}
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-lg"
          >
            <Plus size={16} />
            Add Node
          </button>

          {aiAvailable && (
            <button
              onClick={() => setShowAIModal(true)}
              className="flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-lg"
            >
              <Sparkles size={16} />
              Ask AI
            </button>
          )}
          
          {draftState.active && (
            <>
              <button
                onClick={handleValidate}
                className="flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-lg"
              >
                <Eye size={16} />
                Validate
              </button>
              
              <button
                onClick={() => handleApply(false)}
                className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-lg"
              >
                <Save size={16} />
                Apply
              </button>
              
              <button
                onClick={() => handleApply(true)}
                className="flex items-center gap-2 px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors shadow-lg"
              >
                <Save size={16} />
                Commit
              </button>
            </>
          )}

          {!draftState.active && (
            <button
              onClick={startDraft}
              className="flex items-center gap-2 px-3 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors shadow-lg"
            >
              Start Editing
            </button>
          )}

          <button
            onClick={handleUndo}
            disabled={undoStack.length === 0}
            className="flex items-center gap-2 px-3 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Undo size={16} />
          </button>

          <button
            onClick={handleRedo}
            disabled={redoStack.length === 0}
            className="flex items-center gap-2 px-3 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Redo size={16} />
          </button>

          <button
            onClick={() => setShowDraftPanel(!showDraftPanel)}
            className="flex items-center gap-2 px-3 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors shadow-lg"
          >
            {showDraftPanel ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="flex items-center gap-2 px-3 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors shadow-lg"
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        </div>
      )}

      {/* Fullscreen Exit Button */}
      {isFullscreen && (
        <button
          onClick={() => setIsFullscreen(false)}
          className="absolute top-4 right-4 z-10 flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-lg"
          title="Exit Fullscreen"
        >
          <Minimize2 size={16} />
          Exit Fullscreen
        </button>
      )}

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onEdgeClick={onEdgeClick}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.2}
        maxZoom={2}
        defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
      >
        <Background color="#334155" gap={16} />
        <Controls />
        <MiniMap
          nodeColor={(node) => (node.data as any).color || '#64748b'}
          className="bg-slate-900 border-slate-700"
        />
      </ReactFlow>

      {/* Draft Panel */}
      {showDraftPanel && draftState.active && !isFullscreen && (
        <DraftPanel
          draft={draftState.draft}
          changes={draftState.changes}
          onClose={() => setShowDraftPanel(false)}
          onAccept={handleAcceptChange}
          onReject={handleRejectChange}
        />
      )}

      {/* Edit Modals */}
      <NodeEditModal
        node={editingNode}
        onClose={() => setEditingNode(null)}
        onSave={handleNodeSave}
        availableStocks={data?.nodes.map(n => n.id) || []}
        availableParameters={parameters}
      />

      <EdgeEditModal
        edge={editingEdge}
        onClose={() => setEditingEdge(null)}
        onSave={handleEdgeSave}
        onDelete={handleEdgeDelete}
      />

      <AIProposalModal
        isOpen={showAIModal}
        onClose={() => {
          setShowAIModal(false);
          setAiProposals([]);
          setAiError(undefined);
        }}
        onAccept={handleAcceptAIProposals}
        onGenerate={handleAIGenerate}
        isGenerating={aiGenerating}
        proposals={aiProposals}
        error={aiError}
      />
    </div>
  );
}
