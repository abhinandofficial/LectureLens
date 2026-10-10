import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { CircularMasteryRing } from '../components/CircularMasteryRing';
import {
  BarChart3,
  AlertTriangle,
  Sparkles,
  Layers,
  ArrowRight,
  TrendingDown,
  GitFork,
  CheckCircle2,
  Users,
  FileQuestion,
} from 'lucide-react';

export const CohortAnalyticsPage: React.FC = () => {
  const { cohortAnalytics, currentLecture } = useApp();
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-zinc-200 rounded-3xl p-6 sm:p-8 shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 border border-zinc-200 text-xs font-semibold text-zinc-700 mb-2">
            <BarChart3 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Class-Wide Learning Diagnostic</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-950 tracking-tight">
            Cohort Analytics & Content Gap
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1 max-w-xl">
            Aggregated performance for {cohortAnalytics.courseTitle} across all{' '}
            {cohortAnalytics.totalStudents} enrolled students. Identifies class bottlenecks and
            cognitive traps before examination milestones.
          </p>
        </div>

        <button
          onClick={() => navigate('/app/graph')}
          className="inline-flex items-center gap-2 bg-dark-900 hover:bg-black text-white text-xs sm:text-sm font-bold px-5 py-3 rounded-2xl shadow-subtle transition-all self-start md:self-auto"
        >
          <span>View Cohort Heatmap on DAG</span>
          <GitFork className="w-4 h-4 text-emerald-400" />
        </button>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-subtle">
          <div className="flex items-center justify-between text-xs text-zinc-500 font-semibold mb-2">
            <span>Enrolled Students</span>
            <Users className="w-4 h-4 text-zinc-400" />
          </div>
          <div className="text-3xl font-extrabold text-zinc-950">{cohortAnalytics.totalStudents}</div>
          <div className="text-[11px] text-zinc-400 mt-1">CS201 Cohort Section A</div>
        </div>

        <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-subtle">
          <div className="flex items-center justify-between text-xs text-zinc-500 font-semibold mb-2">
            <span>Average Class Mastery</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-extrabold text-emerald-600">
            {cohortAnalytics.averageMastery}%
          </div>
          <div className="text-[11px] text-zinc-400 mt-1">+4.2% since last review cycle</div>
        </div>

        <div className="bg-white border border-red-200 bg-red-50/20 rounded-2xl p-5 shadow-subtle">
          <div className="flex items-center justify-between text-xs text-red-600 font-bold mb-2">
            <span>Critical Bottlenecks</span>
            <AlertTriangle className="w-4 h-4 text-red-600" />
          </div>
          <div className="text-3xl font-extrabold text-red-600">
            {cohortAnalytics.bottleneckConcepts.length}
          </div>
          <div className="text-[11px] text-red-600 mt-1">Under 50% cohort pass rate</div>
        </div>

        <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-subtle">
          <div className="flex items-center justify-between text-xs text-zinc-500 font-semibold mb-2">
            <span>Syllabus Delivered</span>
            <Layers className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-3xl font-extrabold text-zinc-950">
            {cohortAnalytics.syllabusDeliveryGap.transcriptCoveragePct}%
          </div>
          <div className="text-[11px] text-zinc-500 mt-1">
            {cohortAnalytics.syllabusDeliveryGap.deliveredConcepts} of{' '}
            {cohortAnalytics.syllabusDeliveryGap.plannedConcepts} topics taught
          </div>
        </div>
      </div>

      {/* Main Two-Column Analytics Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Difficult Concepts & Failure Rates */}
        <div className="bg-white border border-zinc-200 rounded-3xl p-6 sm:p-8 shadow-subtle space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
            <div>
              <h3 className="font-extrabold text-base text-zinc-950">
                Class Bottlenecks & High Failure Rates
              </h3>
              <p className="text-xs text-zinc-500">Concepts blocking students across the curriculum</p>
            </div>
            <span className="text-xs font-mono text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-200">
              Needs Lecture Recap
            </span>
          </div>

          <div className="space-y-3">
            {cohortAnalytics.bottleneckConcepts.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-2xl border border-zinc-200 hover:border-zinc-300 transition-all flex items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                      Tier {item.tier}
                    </span>
                    <span className="text-[10px] font-bold text-red-700 bg-red-50 px-1.5 py-0.2 rounded border border-red-200">
                      {item.atRiskCount} at risk
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-zinc-900">{item.name}</h4>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    {Math.round((item.atRiskCount / cohortAnalytics.totalStudents) * 100)}% of class
                    struggles with activation frame or invariance bounds.
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-xl font-black text-red-600">{item.averageScore}%</div>
                  <div className="text-[10px] text-zinc-400 font-semibold uppercase">Avg Score</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Common Misconceptions & Cognitive Traps */}
        <div className="bg-white border border-zinc-200 rounded-3xl p-6 sm:p-8 shadow-subtle space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
            <div>
              <h3 className="font-extrabold text-base text-zinc-950">
                Frequent Cognitive Traps Diagnosed
              </h3>
              <p className="text-xs text-zinc-500">Exposed through Mental Mirror distractors</p>
            </div>
            <span className="text-xs font-bold text-emerald-600">Top Frequency</span>
          </div>

          <div className="space-y-3">
            {cohortAnalytics.misconceptionHeatmap.map((trap, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-zinc-50/70 border border-zinc-200/80 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    {trap.tag}
                  </span>
                  <span className="text-[10px] font-mono font-bold text-zinc-600 bg-white px-2 py-0.5 rounded-full border border-zinc-200">
                    {trap.occurrences} students trapped
                  </span>
                </div>
                <div className="text-xs text-zinc-500">
                  Associated Topic: <strong>{trap.conceptName}</strong>
                </div>
                <p className="text-xs text-zinc-700 font-medium bg-white p-2.5 rounded-xl border border-zinc-200/60 leading-relaxed">
                  "{trap.sampleTrap}"
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Planned-vs-Delivered Content Gap Card */}
      <div className="bg-white border border-zinc-200 rounded-3xl p-6 sm:p-8 shadow-subtle space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-zinc-100">
          <div>
            <h3 className="font-extrabold text-base text-zinc-950 flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600" />
              Planned Syllabus vs Delivered Lecture Audio Gap
            </h3>
            <p className="text-xs text-zinc-500">
              Cross-referencing teacher syllabus schedule against transcribed lecture coverage.
            </p>
          </div>
          <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200 self-start sm:self-auto">
            {cohortAnalytics.syllabusDeliveryGap.transcriptCoveragePct}% Completed
          </span>
        </div>

        {/* Progress bar */}
        <div>
          <div className="w-full bg-zinc-100 h-3 rounded-full overflow-hidden border border-zinc-200">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-700"
              style={{
                width: `${cohortAnalytics.syllabusDeliveryGap.transcriptCoveragePct}%`,
              }}
            ></div>
          </div>
          <div className="flex justify-between text-xs text-zinc-400 mt-2">
            <span>Delivered: {cohortAnalytics.syllabusDeliveryGap.deliveredConcepts} Topics</span>
            <span>Planned: {cohortAnalytics.syllabusDeliveryGap.plannedConcepts} Topics</span>
          </div>
        </div>

        {/* Missing / Deferred Topics Callout */}
        <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 text-xs">
          <h4 className="font-bold text-amber-900 mb-2 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            Topics Deferred or Missing from Live Audio Transcripts:
          </h4>
          <ul className="list-disc list-inside space-y-1 text-amber-800">
            {cohortAnalytics.syllabusDeliveryGap.missingConcepts.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
