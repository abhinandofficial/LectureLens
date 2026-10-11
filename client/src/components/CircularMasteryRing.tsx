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
  size = 62,
  strokeWidth = 5.5,
  showLabel = true,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedScore = Math.min(100, Math.max(0, score));
  const strokeDashoffset = circumference - (clampedScore / 100) * circumference;

  let strokeColor = '#10b981'; // emerald (mastered)
  let badgeBg = 'bg-emerald-50 text-emerald-800 border-emerald-300';
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
    badgeBg = 'bg-red-50 text-red-800 border-red-300';
    label = 'Bottleneck';
  } else if (effectiveStatus === 'at-risk') {
    strokeColor = '#f97316'; // orange
    badgeBg = 'bg-orange-50 text-orange-800 border-orange-300';
    label = 'At-Risk';
  } else if (effectiveStatus === 'developing') {
    strokeColor = '#f59e0b'; // amber
    badgeBg = 'bg-amber-50 text-amber-800 border-amber-300';
    label = 'Developing';
  }

  return (
    <div className="inline-flex items-center gap-3">
      <div className="relative inline-flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
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
        <span className="absolute text-sm font-black tracking-tight text-zinc-900 select-none">
          {clampedScore}%
        </span>
      </div>
      {showLabel && (
        <span className={`text-xs font-bold px-3 py-1 rounded-full border shadow-xs ${badgeBg}`}>
          {label}
        </span>
      )}
    </div>
  );
};
