/**
 * Graph Editor Component
 * 
 * Live model editing with React Flow.
 * Features:
 * - Drag nodes to reposition
 * - Click nodes to edit
 * - Add/remove nodes and edges
 * - Real-time validation
 * - Draft/patch integration
 * - Visual diff (green/yellow/red)
 */

import { useCallback, useEffect, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  MarkerType,
} from '@xyflow/react';
import type { Node, Edge, Connection, NodeChange } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Plus, Save, Undo, Redo, Eye, EyeOff, Sparkles } from 'lucide-react';
import { createDraft, addChangeToDraft, validateDraft, applyDraft } from '../api/drafts';
import type { Draft, PatchChange } from '../api/drafts';
import { EditableNode } from './EditableNode';
import type { EditableNodeData } from './EditableNode';
import { DraftPanel } from './DraftPanel';
import { NodeEditModal } from './NodeEditModal';
import { EdgeEditModal } from './EdgeEditModal';
import { AIProposalModal } from './AIProposalModal';
import { checkAIStatus, generateAIPatch } from '../api/ai';

interface GraphEditorProps {
  modelData: any;
  onModelUpdate?: (model: any) => void;
}

interface DraftState {
  active: boolean;
  draft: Draft | null;
  changes: PatchChange[];
}

const nodeTypes = {
  editable: EditableNode,
};

export function GraphEditor({ modelData, onModelUpdate }: GraphEditorProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [draftState, setDraftState] = useState<DraftState>({
    active: false,
    draft: null,
    changes: []
  });
  const [showDraftPanel, setShowDraftPanel] = useState(true);
  const [undoStack, setUndoStack] = useState<PatchChange[]>([]);
  const [redoStack, setRedoStack] = useState<PatchChange[]>([]);
  const [editingNode, setEditingNode] = useState<{ id: string; data: EditableNodeData } | null>(null);
  const [editingEdge, setEditingEdge] = useState<Edge | null>(null);
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiProposals, setAiProposals] = useState<PatchChange[]>([]);
  const [aiError, setAiError] = useState<string>();
  const [aiAvailable, setAiAvailable] = useState(false);

  // Category colors
  const categoryColors: Record<string, string> = {
    capability: '#3b82f6',
    governance: '#8b5cf6',
    execution: '#10b981',
    risk: '#ef4444',
    market: '#f59e0b',
  };

  // Check AI availability
  useEffect(() => {
    checkAIStatus()
      .then(status => setAiAvailable(status.available))
      .catch(() => setAiAvailable(false));
  }, []);

  // Initialize nodes and edges from model data
  useEffect(() => {
    if (!modelData?.states || !modelData?.relations) return;

    // Create nodes from states
    const initialNodes: Node[] = Object.entries(modelData.states).map(([symbol, state]: [string, any]) => ({
      id: symbol,
      type: 'editable',
      position: state.ui || { x: Math.random() * 500, y: Math.random() * 500 },
      data: {
        symbol,
        label: state.name,
        short: state.short,
        category: state.category,
        description: state.description,
        business_meaning: state.business_meaning,
        initial: state.initial,
        color: categoryColors[state.category] || '#64748b',
        isDraft: false,
        isModified: false,
      },
    }));

    // Create edges from relations
    const initialEdges: Edge[] = modelData.relations.map((rel: any) => ({
      id: rel.id,
      source: rel.source,
      target: rel.target,
      type: 'smoothstep',
      animated: false,
      label: rel.coefficient?.toString() || '',
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: rel.type === 'negative' ? '#ef4444' : '#10b981',
      },
      style: {
        stroke: rel.type === 'negative' ? '#ef4444' : '#10b981',
        strokeWidth: 2,
      },
      data: {
        coefficient: rel.coefficient,
        description: rel.description,
        isDraft: false,
        isModified: false,
      },
    }));

    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [modelData]);

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

      // Add to undo stack
      setUndoStack(prev => [...prev, change]);
      setRedoStack([]);
    } catch (error) {
      console.error('Failed to add change:', error);
    }
  }, [draftState.draft, startDraft]);

  // Handle node position change
  const handleNodesChange = useCallback((changes: NodeChange[]) => {
    onNodesChange(changes);

    // Track position changes for draft
    changes.forEach(change => {
      if (change.type === 'position' && change.position && !change.dragging) {
        const node = nodes.find(n => n.id === change.id);
        if (node) {
          addChange({
            op: 'update_state',
            symbol: node.id,
            data: {
              ui: change.position
            },
            reason: 'Node repositioned'
          });
        }
      }
    });
  }, [onNodesChange, nodes, addChange]);

  // Handle node click to edit
  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    setEditingNode(node as { id: string; data: EditableNodeData });
  }, []);

  // Handle edge click to edit
  const onEdgeClick = useCallback((_event: React.MouseEvent, edge: Edge) => {
    setEditingEdge(edge);
  }, []);

  // Handle node save
  const handleNodeSave = useCallback((nodeId: string, updates: Partial<EditableNodeData>) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, ...updates, isModified: true } }
          : node
      )
    );

    // Add to draft
    addChange({
      op: 'update_state',
      symbol: nodeId,
      data: updates,
      reason: 'Node properties updated'
    });
  }, [addChange]);

  // Handle edge save
  const handleEdgeSave = useCallback((edgeId: string, updates: { coefficient: number; description: string; type: 'positive' | 'negative' }) => {
    setEdges((eds) =>
      eds.map((edge) =>
        edge.id === edgeId
          ? {
              ...edge,
              label: updates.coefficient.toString(),
              style: {
                ...edge.style,
                stroke: updates.type === 'negative' ? '#ef4444' : '#10b981',
              },
              markerEnd: {
                ...edge.markerEnd,
                color: updates.type === 'negative' ? '#ef4444' : '#10b981',
              },
              data: { ...edge.data, ...updates, isModified: true },
            }
          : edge
      )
    );

    // Add to draft
    addChange({
      op: 'update_relation',
      id: edgeId,
      data: updates,
      reason: 'Relation coefficient/description updated'
    });
  }, [addChange]);

  // Handle edge delete
  const handleEdgeDelete = useCallback((edgeId: string) => {
    setEdges((eds) => eds.filter((edge) => edge.id !== edgeId));

    // Add to draft
    addChange({
      op: 'remove_relation',
      id: edgeId,
      data: {},
      reason: 'Relation deleted'
    });
  }, [addChange]);

  // Handle edge connection
  const onConnect = useCallback((connection: Connection) => {
    const newEdge: Edge = {
      id: `${connection.source}_to_${connection.target}`,
      source: connection.source!,
      target: connection.target!,
      type: 'smoothstep',
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: '#10b981',
      },
      style: {
        stroke: '#10b981',
        strokeWidth: 2,
      },
      data: {
        coefficient: 0.5,
        isDraft: true,
        isModified: false,
      },
    };

    setEdges((eds) => addEdge(newEdge, eds));

    // Add to draft
    addChange({
      op: 'add_relation',
      id: newEdge.id,
      data: {
        id: newEdge.id,
        source: connection.source,
        target: connection.target,
        coefficient: 0.5,
        type: 'positive',
        description: 'New relation'
      },
      reason: 'Relation added via graph editor'
    });
  }, [addChange]);

  // Add new node
  const addNode = useCallback(() => {
    const newSymbol = prompt('Enter new state symbol (e.g., M):');
    if (!newSymbol) return;

    const newName = prompt('Enter state name:');
    if (!newName) return;

    const category = prompt('Enter category (capability/governance/execution/risk/market):') || 'capability';

    const newNode: Node = {
      id: newSymbol,
      type: 'editable',
      position: { x: 400, y: 300 },
      data: {
        symbol: newSymbol,
        label: newName,
        short: newSymbol,
        category,
        description: 'New state variable',
        business_meaning: 'What does this represent?',
        initial: 0.5,
        color: categoryColors[category] || '#64748b',
        isDraft: true,
        isModified: false,
      },
    };

    setNodes((nds) => [...nds, newNode]);

    // Add to draft
    addChange({
      op: 'add_state',
      symbol: newSymbol,
      data: {
        id: `state.${newSymbol.toLowerCase()}`,
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
  }, [addChange, categoryColors]);

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
        
        if (onModelUpdate && result.effective_model) {
          onModelUpdate(result.effective_model);
        }

        // Reset draft state
        setDraftState({
          active: false,
          draft: null,
          changes: []
        });
      } else {
        alert(`❌ Failed to apply draft:\n\n${result.errors.join('\n')}`);
      }
    } catch (error) {
      console.error('Apply failed:', error);
      alert('Apply failed. Check console for details.');
    }
  }, [draftState.draft, onModelUpdate]);

  // Undo last change
  const handleUndo = useCallback(() => {
    if (undoStack.length === 0) return;
    
    const lastChange = undoStack[undoStack.length - 1];
    setUndoStack(prev => prev.slice(0, -1));
    setRedoStack(prev => [...prev, lastChange]);
    
    // TODO: Implement actual undo logic
    console.log('Undo:', lastChange);
  }, [undoStack]);

  // Redo last undone change
  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) return;
    
    const change = redoStack[redoStack.length - 1];
    setRedoStack(prev => prev.slice(0, -1));
    setUndoStack(prev => [...prev, change]);
    
    // TODO: Implement actual redo logic
    console.log('Redo:', change);
  }, [redoStack]);

  // Handle AI generation
  const handleAIGenerate = useCallback(async (prompt: string, selectedNodes?: string[]) => {
    setAiGenerating(true);
    setAiError(undefined);

    try {
      const response = await generateAIPatch({
        prompt,
        selected_nodes: selectedNodes,
      });

      setAiProposals(response.patch.changes);
    } catch (error) {
      setAiError(error instanceof Error ? error.message : 'AI generation failed');
    } finally {
      setAiGenerating(false);
    }
  }, []);

  // Handle accepting AI proposals
  const handleAcceptAIProposals = useCallback(async (changes: PatchChange[]) => {
    for (const change of changes) {
      await addChange(change);
    }
    setShowAIModal(false);
    setAiProposals([]);
  }, [addChange]);

  return (
    <div className="relative w-full h-full">
      {/* Toolbar */}
      <div className="absolute top-4 left-4 z-10 flex gap-2">
        <button
          onClick={addNode}
          className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={16} />
          Add Node
        </button>

        {aiAvailable && (
          <button
            onClick={() => setShowAIModal(true)}
            className="flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Sparkles size={16} />
            Ask AI
          </button>
        )}
        
        {draftState.active && (
          <>
            <button
              onClick={handleValidate}
              className="flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Eye size={16} />
              Validate
            </button>
            
            <button
              onClick={() => handleApply(false)}
              className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Save size={16} />
              Apply
            </button>
            
            <button
              onClick={() => handleApply(true)}
              className="flex items-center gap-2 px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            >
              <Save size={16} />
              Commit
            </button>
          </>
        )}

        {!draftState.active && (
          <button
            onClick={startDraft}
            className="flex items-center gap-2 px-3 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
          >
            Start Editing
          </button>
        )}

        <button
          onClick={handleUndo}
          disabled={undoStack.length === 0}
          className="flex items-center gap-2 px-3 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Undo size={16} />
        </button>

        <button
          onClick={handleRedo}
          disabled={redoStack.length === 0}
          className="flex items-center gap-2 px-3 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Redo size={16} />
        </button>

        <button
          onClick={() => setShowDraftPanel(!showDraftPanel)}
          className="flex items-center gap-2 px-3 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors"
        >
          {showDraftPanel ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>

      {/* React Flow Canvas */}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onEdgeClick={onEdgeClick}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.1}
        maxZoom={2}
      >
        <Background color="#334155" gap={16} />
        <Controls className="bg-slate-800 border-slate-700" />
        <MiniMap
          nodeColor={(node) => node.data.color || '#64748b'}
          className="bg-slate-900 border-slate-700"
        />
      </ReactFlow>

      {/* Draft Panel */}
      {showDraftPanel && draftState.active && (
        <DraftPanel
          draft={draftState.draft}
          changes={draftState.changes}
          onClose={() => setShowDraftPanel(false)}
        />
      )}

      {/* Edit Modals */}
      <NodeEditModal
        node={editingNode}
        onClose={() => setEditingNode(null)}
        onSave={handleNodeSave}
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
