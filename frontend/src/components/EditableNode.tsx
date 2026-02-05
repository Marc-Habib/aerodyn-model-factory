/**
 * Editable Node Component
 * 
 * Custom node for React Flow that can be edited inline.
 */

import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';

export interface EditableNodeData {
  symbol: string;
  label: string;
  short: string;
  category: string;
  description: string;
  business_meaning: string;
  initial: number;
  color: string;
  isDraft: boolean;
  isModified: boolean;
}

export const EditableNode = memo(({ data, selected }: NodeProps<EditableNodeData>) => {
  const nodeColor = data.color || '#64748b';
  
  return (
    <div
      className={`bg-slate-900 rounded-lg border-2 transition-all ${
        selected ? 'shadow-lg shadow-blue-500/50' : 'shadow-md'
      } ${data.isDraft ? 'ring-2 ring-green-500' : ''} ${
        data.isModified ? 'ring-2 ring-yellow-500' : ''
      }`}
      style={{
        borderColor: nodeColor,
        minWidth: '140px',
        maxWidth: 'fit-content',
      }}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3"
        style={{ background: nodeColor }}
      />

      {/* Header */}
      <div
        className="px-3 py-2 flex items-center justify-between"
        style={{ backgroundColor: `${nodeColor}20` }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: nodeColor }}
          />
          <div className="font-bold text-slate-200 text-sm whitespace-nowrap">
            {data.label}
          </div>
        </div>
        <div className="text-xs text-slate-500 capitalize ml-2">{data.category}</div>
      </div>

      {/* Draft/Modified Badge */}
      {(data.isDraft || data.isModified) && (
        <div className="px-3 py-1 text-xs">
          {data.isDraft && (
            <span className="inline-block px-2 py-0.5 bg-green-500/20 text-green-400 rounded">
              NEW
            </span>
          )}
          {data.isModified && (
            <span className="inline-block px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded ml-1">
              MODIFIED
            </span>
          )}
        </div>
      )}

      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3"
        style={{ background: nodeColor }}
      />
    </div>
  );
});

EditableNode.displayName = 'EditableNode';
