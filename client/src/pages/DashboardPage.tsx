import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { CircularMasteryRing } from '../components/CircularMasteryRing';
import {
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  Clock,
  RotateCcw,
  Sparkles,
  GitFork,
  BrainCircuit,
  FileText,
  BarChart3,
  TrendingDown,
  Layers,
  Zap,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const {
    currentUser,
    course,
    concepts,
    studentMastery,
    calculateRetention,
    setActiveRemediation,
    remediationBites,
    cohortAnalytics,
    currentLecture,
  } = useApp();
  const navigate = useNavigate();

  const isTeacher = currentUser.role === 'teacher';

  // For Student calculations
  const masteryValues = Object.values(studentMastery);
  const masteredCount = masteryValues.filter((m) => m.status === 'mastered').length;
  const developingCount = masteryValues.filter((m) => m.status === 'developing').length;
  const atRiskCount = masteryValues.filter((m) => m.status === 'at-risk').length;
  const bottleneckCount = masteryValues.filter((m) => m.status === 'bottleneck').length;

  const dueForReview = concepts
    .map((c) => {
      const stats = calculateRetention(c.id);
      return { concept: c, ...stats };
    })
    .filter((item) => item.isDue)
    .sort((a, b) => a.retention - b.retention);

  const bottleneckConceptsList = concepts.filter(
    (c) => studentMastery[c.id]?.status === 'bottleneck' || c.isBottleneck
  );

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-white border border-zinc-200 rounded-3xl p-6 sm:p-8 shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 border border-zinc-200 text-xs font-semibold text-zinc-700 mb-3">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>{isTeacher ? 'Instructor Command Center' : 'Adaptive Recovery Plan Active'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-950 tracking-tight">
            {isTeacher ? `Welcome, ${currentUser.name}` : `Keep Going, ${currentUser.name}`}
          </h1>
          <p className="text-sm text-zinc-500 mt-1 max-w-xl">
            {isTeacher
              ? `Cohort CS201 has 4 critical bottlenecks requiring pedagogical intervention before the midterm.`
              : `Your retention model detected 4 concepts approaching memory decay thresholds. Revisit foundations to unblock Graph Traversals.`}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {isTeacher ? (
            <button
              onClick={() => navigate('/app/syllabus')}
              className="inline-flex items-center gap-2 bg-dark-900 hover:bg-black text-white text-xs sm:text-sm font-bold px-5 py-3 rounded-2xl shadow-subtle transition-all"
            >
              <span>Ingest New Syllabus</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => navigate('/app/practice')}
              className="inline-flex items-center gap-2 bg-dark-900 hover:bg-black text-white text-xs sm:text-sm font-bold px-5 py-3 rounded-2xl shadow-subtle transition-all"
            >
              <span>Practice Arena</span>
              <BrainCircuit className="w-4 h-4 text-emerald-400" />
            </button>
          )}

          <button
            onClick={() => navigate('/app/graph')}
            className="inline-flex items-center gap-2 bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-900 text-xs sm:text-sm font-bold px-5 py-3 rounded-2xl shadow-subtle transition-all"
          >
            <span>Explore DAG</span>
            <GitFork className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* METRIC CARDS */}
      {!isTeacher ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-subtle">
            <div className="flex items-center justify-between text-xs text-zinc-500 font-semibold mb-2">
              <span>Mastered</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-3xl font-extrabold text-zinc-950">{masteredCount}</div>
            <div className="text-[11px] text-zinc-400 mt-1">High retention stability</div>
          </div>

          <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-subtle">
            <div className="flex items-center justify-between text-xs text-zinc-500 font-semibold mb-2">
              <span>Developing</span>
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-3xl font-extrabold text-zinc-950">{developingCount}</div>
            <div className="text-[11px] text-amber-600 mt-1">Progressing through tiers</div>
          </div>

          <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-subtle">
            <div className="flex items-center justify-between text-xs text-zinc-500 font-semibold mb-2">
              <span>At-Risk</span>
              <TrendingDown className="w-4 h-4 text-orange-500" />
            </div>
            <div className="text-3xl font-extrabold text-zinc-950">{atRiskCount}</div>
            <div className="text-[11px] text-orange-600 mt-1">Decay approaching cutoff</div>
          </div>

          <div className="bg-white border border-red-200 bg-red-50/20 rounded-2xl p-5 shadow-subtle">
            <div className="flex items-center justify-between text-xs text-red-500 font-bold mb-2">
              <span>Critical Bottlenecks</span>
              <AlertTriangle className="w-4 h-4 text-red-600" />
            </div>
            <div className="text-3xl font-extrabold text-red-600">{bottleneckCount}</div>
            <div className="text-[11px] text-red-700 mt-1">Blocks downstream topics</div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-subtle">
            <div className="flex items-center justify-between text-xs text-zinc-500 font-semibold mb-2">
              <span>Cohort Average</span>
              <BarChart3 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-3xl font-extrabold text-zinc-950">
              {cohortAnalytics.averageMastery}%
            </div>
            <div className="text-[11px] text-zinc-400 mt-1">Across 48 enrolled students</div>
          </div>

          <div className="bg-white border border-red-200 bg-red-50/30 rounded-2xl p-5 shadow-subtle">
            <div className="flex items-center justify-between text-xs text-red-600 font-bold mb-2">
              <span>Active Bottlenecks</span>
              <AlertTriangle className="w-4 h-4 text-red-600" />
            </div>
            <div className="text-3xl font-extrabold text-red-600">
              {cohortAnalytics.bottleneckConcepts.length}
            </div>
            <div className="text-[11px] text-red-600 mt-1">Recursion & BFS require review</div>
          </div>

          <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-subtle">
            <div className="flex items-center justify-between text-xs text-zinc-500 font-semibold mb-2">
              <span>Syllabus Delivery Gap</span>
              <Layers className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-3xl font-extrabold text-zinc-950">
              {cohortAnalytics.syllabusDeliveryGap.transcriptCoveragePct}%
            </div>
            <div className="text-[11px] text-zinc-500 mt-1">3 topics deferred/pending</div>
          </div>

          <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-subtle">
            <div className="flex items-center justify-between text-xs text-zinc-500 font-semibold mb-2">
              <span>Top Traps Diagnosed</span>
              <Sparkles className="w-4 h-4 text-purple-600" />
            </div>
            <div className="text-3xl font-extrabold text-zinc-950">4 Tags</div>
            <div className="text-[11px] text-zinc-500 mt-1">Queue explosion most frequent</div>
          </div>
        </div>
      )}

      {/* DUAL COLUMN ACTION GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Main Activities */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section: Critical Bottlenecks (For Student) */}
          {!isTeacher ? (
            <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-subtle">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-lg text-zinc-900 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    Immediate Bottlenecks Requiring Action
                  </h3>
                  <p className="text-xs text-zinc-500">
                    These foundational gaps propagate errors into advanced data structures.
                  </p>
                </div>
                <button
                  onClick={() => navigate('/app/practice')}
                  className="text-xs font-bold text-emerald-600 hover:text-emerald-700"
                >
                  View All →
                </button>
              </div>

              <div className="space-y-3">
                {bottleneckConceptsList.slice(0, 3).map((concept) => {
                  const m = studentMastery[concept.id];
                  const bite = remediationBites[concept.id];
                  return (
                    <div
                      key={concept.id}
                      className="border border-zinc-200 hover:border-zinc-300 rounded-2xl p-4 flex items-center justify-between gap-4 transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <CircularMasteryRing
                          score={m ? m.score : 35}
                          status={m ? m.status : 'bottleneck'}
                          size={46}
                          strokeWidth={4}
                          showLabel={false}
                        />
                        <div>
                          <h4 className="font-bold text-sm text-zinc-900">{concept.name}</h4>
                          <p className="text-xs text-zinc-500 line-clamp-1">{concept.description}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {bite && (
                          <button
                            onClick={() => setActiveRemediation(bite)}
                            className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5"
                          >
                            <Zap className="w-3.5 h-3.5 fill-red-500" />
                            60s Bite
                          </button>
                        )}
                        <button
                          onClick={() => navigate('/app/practice')}
                          className="bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-semibold px-3 py-1.5 rounded-xl transition-all"
                        >
                          MCQ
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Teacher Cohort Bottlenecks */
            <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-subtle">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-lg text-zinc-900 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-emerald-600" />
                    Cohort Bottlenecks Ranking
                  </h3>
                  <p className="text-xs text-zinc-500">
                    Highest error rates across all 48 enrolled students.
                  </p>
                </div>
                <button
                  onClick={() => navigate('/app/analytics')}
                  className="text-xs font-bold text-emerald-600 hover:text-emerald-700"
                >
                  Full Report →
                </button>
              </div>

              <div className="space-y-3">
                {cohortAnalytics.bottleneckConcepts.map((item) => (
                  <div
                    key={item.id}
                    className="border border-zinc-200 rounded-2xl p-4 flex items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-zinc-400">Tier {item.tier}</span>
                        <h4 className="font-bold text-sm text-zinc-900">{item.name}</h4>
                      </div>
                      <div className="text-xs text-red-600 font-medium mt-1">
                        {item.atRiskCount} of 48 students currently failing this concept
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <div className="text-sm font-black text-red-600">{item.averageScore}%</div>
                        <div className="text-[10px] text-zinc-400">Cohort Avg</div>
                      </div>
                      <button
                        onClick={() => navigate('/app/graph')}
                        className="p-2 hover:bg-zinc-100 rounded-xl text-zinc-600"
                        title="Locate on Knowledge Graph"
                      >
                        <GitFork className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Lecture Catch-Up Card */}
          <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-subtle">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </span>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">
                    Latest Session Ingested
                  </span>
                  <h3 className="font-bold text-base text-zinc-900">{currentLecture.title}</h3>
                </div>
              </div>
              <span className="text-xs text-zinc-400 font-mono">{currentLecture.date}</span>
            </div>

            <p className="text-xs text-zinc-600 leading-relaxed mb-4 bg-zinc-50 p-3.5 rounded-2xl border border-zinc-100">
              {currentLecture.slidesSummary}
            </p>

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-zinc-400">
                {currentLecture.slidesCount} slides • {currentLecture.durationMinutes} min audio recording
              </span>
              <button
                onClick={() => navigate('/app/catchup')}
                className="bg-dark-900 hover:bg-black text-white text-xs font-bold px-4 py-2 rounded-xl transition-all flex items-center gap-1.5"
              >
                <span>Generate Catch-Up Notes</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Col: Decay Review Queue Preview */}
        <div className="space-y-6">
          <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-subtle">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-base text-zinc-900 flex items-center gap-1.5">
                  <RotateCcw className="w-4 h-4 text-emerald-600" />
                  Due for Review
                </h3>
                <p className="text-[11px] text-zinc-400">Ebbinghaus Retention &lt; 70%</p>
              </div>
              <button
                onClick={() => navigate('/app/review-queue')}
                className="text-xs font-bold text-emerald-600 hover:text-emerald-700"
              >
                Open Queue →
              </button>
            </div>

            {dueForReview.length === 0 ? (
              <div className="text-center py-8 text-zinc-400 text-xs">
                All concepts currently above retention threshold!
              </div>
            ) : (
              <div className="space-y-3">
                {dueForReview.slice(0, 4).map(({ concept, retention, daysSince }) => (
                  <div
                    key={concept.id}
                    onClick={() => navigate('/app/review-queue')}
                    className="p-3 rounded-2xl border border-zinc-100 hover:border-zinc-300 hover:bg-zinc-50 cursor-pointer transition-all"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-zinc-900 truncate max-w-[150px]">
                        {concept.name}
                      </span>
                      <span className="text-xs font-bold text-amber-600">
                        {(retention * 100).toFixed(0)}% ret.
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-zinc-400">
                      <span>Reviewed {daysSince.toFixed(1)}d ago</span>
                      <span className="text-zinc-600 font-medium">Forward-dependent test</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Pedagogical Calibration Note */}
          <div className="bg-zinc-50 border border-zinc-200 rounded-3xl p-5 text-xs text-zinc-500 space-y-2">
            <div className="font-bold text-zinc-800 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              Pedagogical Engine Active
            </div>
            <p className="text-[11px] leading-relaxed">
              Retention equation: <code>R = e^(-t/S)</code>. Correct attempts boost memory stability
              by 1.85×, whereas misconceptions reduce stability to schedule an earlier reinforcement
              window.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
