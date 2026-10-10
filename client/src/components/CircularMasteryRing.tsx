import React from 'react';
import { MasteryTier } from '../types';

interface CircularMasteryRingProps {
  score: number;
  status?: MasteryTier;
  size?: number;
  strokeWidth?: number;
  showLabel?: boolean;
}

export const CircularMasteryRing: React.FC<CircularMasteryRingProps> = ({
  score,
  status,
  size = 56,
  strokeWidth = 5,
  showLabel = true,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedScore = Math.min(100, Math.max(0, score));
  const strokeDashoffset = circumference - (clampedScore / 100) * circumference;

  // Determine color based on status or score
  let strokeColor = '#10b981'; // emerald (mastered)
  let badgeBg = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  let label = 'Mastered';

  const effectiveStatus: MasteryTier =
    status ||
    (clampedScore >= 80
      ? 'mastered'
      : clampedScore >= 60
      ? 'developing'
      : clampedScore >= 40
      ? 'at-risk'
      : 'bottleneck');

  if (effectiveStatus === 'bottleneck') {
    strokeColor = '#ef4444'; // red
    badgeBg = 'bg-red-50 text-red-700 border-red-200';
    label = 'Bottleneck';
  } else if (effectiveStatus === 'at-risk') {
    strokeColor = '#f97316'; // orange
    badgeBg = 'bg-orange-50 text-orange-700 border-orange-200';
    label = 'At-Risk';
  } else if (effectiveStatus === 'developing') {
    strokeColor = '#f59e0b'; // amber
    badgeBg = 'bg-amber-50 text-amber-700 border-amber-200';
    label = 'Developing';
  }

  return (
    <div className="inline-flex items-center gap-2.5">
      <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#f4f4f5"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
          />
        </svg>
        <span className="absolute text-[12px] font-bold tracking-tight text-zinc-900">
          {clampedScore}%
        </span>
      </div>
      {showLabel && (
        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${badgeBg}`}>
          {label}
        </span>
      )}
    </div>
  );
};
