import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { CircularMasteryRing } from './CircularMasteryRing';
import { Concept, StudentMastery, MasteryTier } from '../types';

interface ConceptGraphNodeData {
  concept: Concept;
  mastery?: StudentMastery;
  isTeacherMode: boolean;
  isSelected?: boolean;
}

export const ConceptGraphNode = memo(({ data }: { data: ConceptGraphNodeData }) => {
  const { concept, mastery, isTeacherMode, isSelected } = data;

  const score = isTeacherMode ? concept.cohortMastery || 50 : mastery?.score || 45;
  const status: MasteryTier = isTeacherMode
    ? score >= 75
      ? 'mastered'
      : score >= 60
      ? 'developing'
      : score >= 45
      ? 'at-risk'
      : 'bottleneck'
    : mastery?.status || 'developing';

  let borderColor = 'border-zinc-200';
  let badgeColor = 'bg-zinc-100 text-zinc-800 border-zinc-200';

  if (status === 'mastered') {
    borderColor = 'border-emerald-400 hover:border-emerald-500';
    badgeColor = 'bg-emerald-50 text-emerald-800 border-emerald-200';
  } else if (status === 'developing') {
    borderColor = 'border-amber-400 hover:border-amber-500';
    badgeColor = 'bg-amber-50 text-amber-800 border-amber-200';
  } else if (status === 'at-risk') {
    borderColor = 'border-orange-400 hover:border-orange-500';
    badgeColor = 'bg-orange-50 text-orange-800 border-orange-200';
  } else if (status === 'bottleneck') {
    borderColor = 'border-red-400 hover:border-red-500';
    badgeColor = 'bg-red-50 text-red-800 border-red-200';
  }

  return (
    <div
      className={`relative w-[17rem] bg-white rounded-2xl border-2 ${borderColor} p-3.5 shadow-subtle transition-all duration-150 cursor-pointer ${
        isSelected ? 'ring-2 ring-zinc-950 shadow-md border-zinc-950 scale-[1.02]' : 'hover:shadow-md'
      }`}
    >
      {/* Target Handle: incoming prerequisites from parent tiers */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-zinc-400 hover:!bg-zinc-900 !border-2 !border-white transition-colors"
      />

      {/* Row 1: Status badge and percentage */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${badgeColor}`}>
          {isTeacherMode ? `Cohort: ${score}%` : status.toUpperCase()}
        </span>
        <span className="text-xs font-black text-zinc-700">
          {score}%
        </span>
      </div>

      {/* Row 2: Topic Title and Ring */}
      <div className="flex items-center justify-between gap-2.5">
        <h4 className="font-extrabold text-sm text-zinc-950 leading-snug break-words line-clamp-2 flex-1" title={concept.name}>
          {concept.name}
        </h4>
        <div className="shrink-0">
          <CircularMasteryRing
            score={score}
            status={status}
            size={36}
            strokeWidth={3.5}
            showLabel={false}
          />
        </div>
      </div>

      {/* Source Handle: outgoing edges to dependent downstream tiers */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-zinc-400 hover:!bg-zinc-900 !border-2 !border-white transition-colors"
      />
    </div>
  );
});

ConceptGraphNode.displayName = 'ConceptGraphNode';
