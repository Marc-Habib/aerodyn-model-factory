# EnhancedGraphView + GraphEditor Merger - TODO

## Current Status
- ✅ EnhancedGraphView is the main Interactive Graph view
- ✅ Has beautiful circular layout, expandable nodes with details
- ✅ Imports added for draft system, modals, AI
- ⏳ Need to add state management and UI elements

## What Needs to Be Added to EnhancedGraphView

### 1. State Management (after line 240)
```typescript
const [draftState, setDraftState] = useState<DraftState>({
  active: false,
  draft: null,
  changes: []
});
const [showDraftPanel, setShowDraftPanel] = useState(true);
const [undoStack, setUndoStack] = useState<PatchChange[]>([]);
const [redoStack, setRedoStack] = useState<PatchChange[]>([]);
const [editingNode, setEditingNode] = useState<{ id: string; data: any } | null>(null);
const [editingEdge, setEditingEdge] = useState<Edge | null>(null);
const [showAIModal, setShowAIModal] = useState(false);
const [aiGenerating, setAiGenerating] = useState(false);
const [aiProposals, setAiProposals] = useState<PatchChange[]>([]);
const [aiError, setAiError] = useState<string>();
const [aiAvailable, setAiAvailable] = useState(false);
const [isFullscreen, setIsFullscreen] = useState(false);
```

### 2. AI Availability Check (useEffect)
```typescript
useEffect(() => {
  checkAIStatus()
    .then(status => setAiAvailable(status.available))
    .catch(() => setAiAvailable(false));
}, []);
```

### 3. Draft System Functions
Copy from GraphEditor.tsx lines 250-350:
- `startDraft()`
- `addChange()`
- `handleValidate()`
- `handleApply()`
- `handleUndo()`
- `handleRedo()`
- `handleAIGenerate()`
- `handleAcceptAIProposals()`
- `handleNodeSave()`
- `handleEdgeSave()`
- `handleEdgeDelete()`

### 4. Add onConnect Handler
```typescript
const onConnect = useCallback((connection: Connection) => {
  setEdges((eds) => addEdge(connection, eds));
  if (draftState.active) {
    addChange({
      op: 'add_relation',
      data: {
        source: connection.source,
        target: connection.target,
      },
      reason: 'New edge created'
    });
  }
}, [draftState.active, addChange, setEdges]);
```

### 5. Add Toolbar (before ReactFlow component)
```typescript
{/* Toolbar */}
{!isFullscreen && (
  <div className="absolute top-4 left-4 z-10 flex gap-2">
    <button onClick={addNode} className="...">
      <Plus size={16} /> Add Node
    </button>
    {aiAvailable && (
      <button onClick={() => setShowAIModal(true)} className="...">
        <Sparkles size={16} /> Ask AI
      </button>
    )}
    {draftState.active && (
      <>
        <button onClick={handleValidate} className="...">
          <Eye size={16} /> Validate
        </button>
        <button onClick={() => handleApply(false)} className="...">
          <Save size={16} /> Apply
        </button>
        <button onClick={() => handleApply(true)} className="...">
          <Save size={16} /> Commit
        </button>
      </>
    )}
    {!draftState.active && (
      <button onClick={startDraft} className="...">
        Start Editing
      </button>
    )}
    <button onClick={handleUndo} disabled={undoStack.length === 0} className="...">
      <Undo size={16} />
    </button>
    <button onClick={handleRedo} disabled={redoStack.length === 0} className="...">
      <Redo size={16} />
    </button>
    <button onClick={() => setShowDraftPanel(!showDraftPanel)} className="...">
      {showDraftPanel ? <EyeOff size={16} /> : <Eye size={16} />}
    </button>
    <button onClick={() => setIsFullscreen(!isFullscreen)} className="...">
      {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
    </button>
  </div>
)}
```

### 6. Add Edit Button in StockNode Component (line 180)
```typescript
{/* Action Buttons - Always visible when expanded */}
{!isEditing && (
  <div className="flex gap-2 pt-2 border-t border-slate-700">
    <button
      onClick={() => {
        // Open NodeEditModal
        // Pass node data to parent component
      }}
      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-blue-600 hover:bg-blue-500 rounded text-xs font-medium transition-colors"
    >
      <Edit2 size={14} />
      Edit Node
    </button>
    <button
      onClick={() => {
        if (confirm(`Delete node ${data.label}?`)) {
          // Call delete handler
        }
      }}
      className="px-3 py-2 bg-red-600 hover:bg-red-500 rounded text-xs font-medium transition-colors"
    >
      <Trash2 size={14} />
      Delete
    </button>
  </div>
)}
```

### 7. Add Modals and Panels (after ReactFlow)
```typescript
{/* Draft Panel */}
{showDraftPanel && draftState.active && !isFullscreen && (
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
```

### 8. Update ReactFlow Props
```typescript
<ReactFlow
  nodes={nodes}
  edges={edges}
  onNodesChange={onNodesChange}
  onEdgesChange={onEdgesChange}
  onConnect={onConnect}  // ADD THIS
  onNodeClick={onNodeClick}
  onEdgeClick={onEdgeClick}  // ADD THIS
  nodeTypes={nodeTypes}
  fitView
  minZoom={0.1}
  maxZoom={2}
>
  <Background color="#1e293b" gap={30} size={1} />
  <Controls />
  <MiniMap
    nodeColor={(node) => (node.data as any).color || '#64748b'}
    className="bg-slate-900 border-slate-700"
  />
</ReactFlow>
```

## Result
User will have:
- ✅ Beautiful EnhancedGraphView layout with expandable nodes
- ✅ Click node → see details (business meaning, equations, etc)
- ✅ Click Edit button in node → NodeEditModal opens
- ✅ Toolbar with Add Node, Ask AI, Undo, Redo, Validate, Apply, Commit
- ✅ Draft system tracking all changes
- ✅ DraftPanel showing change log with Accept/Cancel
- ✅ Ability to connect nodes by dragging
- ✅ Fullscreen mode
- ✅ All editing features from GraphEditor + all viewing features from EnhancedGraphView

## Files to Reference
- `frontend/src/components/GraphEditor.tsx` - Copy draft system logic
- `frontend/src/components/EnhancedGraphView.tsx` - Target file to enhance
