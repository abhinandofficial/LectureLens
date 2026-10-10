import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { CircularMasteryRing } from './CircularMasteryRing';
import { Concept, StudentMastery, MasteryTier } from '../types';
import { AlertTriangle, CheckCircle2, Zap } from 'lucide-react';

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
  let badgeColor = 'bg-zinc-100 text-zinc-700';

  if (status === 'mastered') {
    borderColor = 'border-emerald-400/80 hover:border-emerald-500';
    badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  } else if (status === 'developing') {
    borderColor = 'border-amber-300 hover:border-amber-400';
    badgeColor = 'bg-amber-50 text-amber-700 border-amber-200';
  } else if (status === 'at-risk') {
    borderColor = 'border-orange-300 hover:border-orange-400';
    badgeColor = 'bg-orange-50 text-orange-700 border-orange-200';
  } else if (status === 'bottleneck') {
    borderColor = 'border-red-400 hover:border-red-500 shadow-sm';
    badgeColor = 'bg-red-50 text-red-700 border-red-200';
  }

  return (
    <div
      className={`relative w-64 bg-white rounded-2xl border-2 ${borderColor} p-4 shadow-subtle transition-all duration-200 ${
        isSelected ? 'ring-4 ring-dark-900/10 scale-105 shadow-float' : ''
      }`}
    >
      {/* Target Handle: incoming prerequisites from parent tiers */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-zinc-400 hover:!bg-zinc-900 !border-2 !border-white transition-colors"
      />

      {/* Top Meta Bar */}
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
          Tier {concept.tier}
        </span>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeColor}`}>
          {isTeacherMode ? `Cohort: ${score}%` : status}
        </span>
      </div>

      {/* Main Info */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="font-extrabold text-xs sm:text-sm text-zinc-900 leading-snug">
          {concept.name}
        </h4>
        <CircularMasteryRing
          score={score}
          status={status}
          size={38}
          strokeWidth={3.5}
          showLabel={false}
        />
      </div>

      <p className="text-[11px] text-zinc-500 line-clamp-2 leading-relaxed mb-3">
        {concept.description}
      </p>

      {/* Bottom Status Indicator */}
      <div className="pt-2 border-t border-zinc-100 flex items-center justify-between text-[10px] font-medium">
        {concept.isBottleneck ? (
          <span className="text-red-600 font-bold flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-red-600" /> Critical Bottleneck
          </span>
        ) : (
          <span className="text-zinc-400">
            {concept.status === 'pending_review' ? 'AI Generated (Draft)' : 'Published'}
          </span>
        )}

        {!isTeacherMode && mastery?.stability && (
          <span className="text-zinc-500 font-mono">S={mastery.stability}d</span>
        )}
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
