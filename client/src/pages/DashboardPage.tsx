import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useClassContext } from '../context/ClassContext';
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
  BarChart3,
  TrendingDown,
  Layers,
  Zap,
  HelpCircle,
  X,
  Hash,
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
  const { joinedClass } = useClassContext();
  const navigate = useNavigate();

  const isTeacher = currentUser.role === 'teacher';
  // Dismissible join banner state (student only, shown when not yet in a class)
  const [bannerDismissed, setBannerDismissed] = useState(false);

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
    <div className="space-y-8">
      {/* Join Class Banner — shown to students who haven't joined a class yet */}
      {!isTeacher && !joinedClass && !bannerDismissed && (
        <div className="flex items-center justify-between gap-4 px-5 py-4 bg-emerald-50 border border-emerald-200 rounded-2xl">
          <div className="flex items-center gap-3">
            <Hash className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <p className="text-sm font-black text-emerald-800">Join your class with a code</p>
              <p className="text-xs text-emerald-700 mt-0.5">Ask your teacher for the 6-character code to join the live session.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              to="/app/join-class"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white font-black text-xs hover:bg-emerald-700 transition-colors"
            >
              Join Class
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <button
              onClick={() => setBannerDismissed(true)}
              className="p-1.5 rounded-xl text-emerald-500 hover:text-emerald-800 hover:bg-emerald-100 transition-colors"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Welcome Banner */}
      <div className="bg-white border border-zinc-200 rounded-3xl p-7 sm:p-10 shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-100 border border-zinc-200 text-xs font-bold text-zinc-800 mb-3">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span>{isTeacher ? 'Instructor Command Center' : 'Adaptive Recovery Plan Active'}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-zinc-950 tracking-tight">
            {isTeacher ? `Welcome, ${currentUser.name}` : `Keep Going, ${currentUser.name}`}
          </h1>
          <p className="text-base sm:text-lg text-zinc-600 mt-2 max-w-2xl leading-relaxed">
            {isTeacher
              ? `Cohort CS201 has 4 critical bottlenecks requiring pedagogical intervention before the midterm.`
              : `Your retention model detected 4 concepts approaching memory decay thresholds. Revisit foundations to unblock Graph Traversals.`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {isTeacher ? (
            <button
              onClick={() => navigate('/app/syllabus')}
              className="inline-flex items-center gap-2 bg-dark-900 hover:bg-black text-white text-sm sm:text-base font-extrabold px-6 py-3.5 rounded-2xl shadow-subtle transition-all"
            >
              <span>Ingest Syllabus</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => navigate('/app/practice')}
              className="inline-flex items-center gap-2 bg-dark-900 hover:bg-black text-white text-sm sm:text-base font-extrabold px-6 py-3.5 rounded-2xl shadow-subtle transition-all"
            >
              <span>Practice Arena</span>
              <BrainCircuit className="w-4 h-4 text-emerald-400" />
            </button>
          )}

          <button
            onClick={() => navigate('/app/graph')}
            className="inline-flex items-center gap-2 bg-white hover:bg-zinc-50 border border-zinc-300 text-zinc-900 text-sm sm:text-base font-extrabold px-5 py-3.5 rounded-2xl shadow-subtle transition-all"
          >
            <span>Explore DAG</span>
            <GitFork className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* METRIC CARDS */}
      {!isTeacher ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-subtle">
            <div className="flex items-center justify-between text-xs sm:text-sm text-zinc-500 font-extrabold mb-2">
              <span>Mastered</span>
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="text-4xl font-black text-zinc-950">{masteredCount}</div>
            <div className="text-xs text-zinc-500 font-semibold mt-1.5">High retention stability</div>
          </div>

          <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-subtle">
            <div className="flex items-center justify-between text-xs sm:text-sm text-zinc-500 font-extrabold mb-2">
              <span>Developing</span>
              <Clock className="w-5 h-5 text-amber-500" />
            </div>
            <div className="text-4xl font-black text-zinc-950">{developingCount}</div>
            <div className="text-xs text-amber-700 font-semibold mt-1.5">Progressing through tiers</div>
          </div>

          <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-subtle">
            <div className="flex items-center justify-between text-xs sm:text-sm text-zinc-500 font-extrabold mb-2">
              <span>At-Risk</span>
              <TrendingDown className="w-5 h-5 text-orange-500" />
            </div>
            <div className="text-4xl font-black text-zinc-950">{atRiskCount}</div>
            <div className="text-xs text-orange-700 font-semibold mt-1.5">Decay approaching cutoff</div>
          </div>

          <div className="bg-white border border-red-200 bg-red-50/25 rounded-3xl p-6 shadow-subtle">
            <div className="flex items-center justify-between text-xs sm:text-sm text-red-600 font-black mb-2">
              <span>Critical Bottlenecks</span>
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div className="text-4xl font-black text-red-600">{bottleneckCount}</div>
            <div className="text-xs text-red-700 font-semibold mt-1.5">Blocks downstream topics</div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-subtle">
            <div className="flex items-center justify-between text-xs sm:text-sm text-zinc-500 font-extrabold mb-2">
              <span>Cohort Average</span>
              <BarChart3 className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="text-4xl font-black text-zinc-950">
              {cohortAnalytics.averageMastery}%
            </div>
            <div className="text-xs text-zinc-500 font-semibold mt-1.5">Across 48 enrolled students</div>
          </div>

          <div className="bg-white border border-red-200 bg-red-50/30 rounded-3xl p-6 shadow-subtle">
            <div className="flex items-center justify-between text-xs sm:text-sm text-red-600 font-black mb-2">
              <span>Active Bottlenecks</span>
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div className="text-4xl font-black text-red-600">
              {cohortAnalytics.bottleneckConcepts.length}
            </div>
            <div className="text-xs text-red-700 font-semibold mt-1.5">Recursion & BFS require review</div>
          </div>

          <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-subtle">
            <div className="flex items-center justify-between text-xs sm:text-sm text-zinc-500 font-extrabold mb-2">
              <span>Syllabus Delivery Gap</span>
              <Layers className="w-5 h-5 text-blue-500" />
            </div>
            <div className="text-4xl font-black text-zinc-950">
              {cohortAnalytics.syllabusDeliveryGap.transcriptCoveragePct}%
            </div>
            <div className="text-xs text-zinc-500 font-semibold mt-1.5">3 topics deferred/pending</div>
          </div>

          <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-subtle">
            <div className="flex items-center justify-between text-xs sm:text-sm text-zinc-500 font-extrabold mb-2">
              <span>Top Traps Diagnosed</span>
              <Sparkles className="w-5 h-5 text-purple-600" />
            </div>
            <div className="text-4xl font-black text-zinc-950">4 Tags</div>
            <div className="text-xs text-zinc-500 font-semibold mt-1.5">Queue explosion most frequent</div>
          </div>
        </div>
      )}

      {/* DUAL COLUMN ACTION GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Main Activities */}
        <div className="lg:col-span-2 space-y-8">
          {/* Section: Critical Bottlenecks (For Student) */}
          {!isTeacher ? (
            <div className="bg-white border border-zinc-200 rounded-3xl p-7 sm:p-9 shadow-subtle">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-black text-xl text-zinc-950 flex items-center gap-2.5">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    Immediate Bottlenecks Requiring Action
                  </h3>
                  <p className="text-sm text-zinc-600 mt-1">
                    These foundational gaps propagate errors into advanced data structures.
                  </p>
                </div>
                <button
                  onClick={() => navigate('/app/practice')}
                  className="text-sm font-extrabold text-emerald-600 hover:text-emerald-700"
                >
                  View All →
                </button>
              </div>

              <div className="space-y-4">
                {bottleneckConceptsList.slice(0, 3).map((concept) => {
                  const m = studentMastery[concept.id];
                  const bite = remediationBites[concept.id];
                  return (
                    <div
                      key={concept.id}
                      className="border border-zinc-200 hover:border-zinc-300 rounded-2xl p-5 flex items-center justify-between gap-5 transition-all"
                    >
                      <div className="flex items-center gap-5">
                        <CircularMasteryRing
                          score={m ? m.score : 35}
                          status={m ? m.status : 'bottleneck'}
                          size={54}
                          strokeWidth={4.5}
                          showLabel={false}
                        />
                        <div>
                          <h4 className="font-black text-base sm:text-lg text-zinc-950">{concept.name}</h4>
                          <p className="text-xs sm:text-sm text-zinc-600 line-clamp-1 mt-0.5">{concept.description}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        {bite && (
                          <button
                            onClick={() => setActiveRemediation(bite)}
                            className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs sm:text-sm font-extrabold px-4 py-2 rounded-xl transition-all flex items-center gap-1.5"
                          >
                            <Zap className="w-4 h-4 fill-red-500" />
                            60s Bite
                          </button>
                        )}
                        <button
                          onClick={() => navigate('/app/practice')}
                          className="bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs sm:text-sm font-extrabold px-4 py-2 rounded-xl transition-all"
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
            <div className="bg-white border border-zinc-200 rounded-3xl p-7 sm:p-9 shadow-subtle">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-black text-xl text-zinc-950 flex items-center gap-2.5">
                    <BarChart3 className="w-5 h-5 text-emerald-600" />
                    Cohort Bottlenecks Ranking
                  </h3>
                  <p className="text-sm text-zinc-600 mt-1">
                    Highest error rates across all 48 enrolled students.
                  </p>
                </div>
                <button
                  onClick={() => navigate('/app/graph')}
                  className="text-sm font-extrabold text-emerald-600 hover:text-emerald-700"
                >
                  View on DAG →
                </button>
              </div>

              <div className="space-y-4">
                {cohortAnalytics.bottleneckConcepts.map((item) => (
                  <div
                    key={item.id}
                    className="border border-zinc-200 rounded-2xl p-5 flex items-center justify-between gap-5"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-zinc-500 uppercase">Tier {item.tier}</span>
                        <h4 className="font-black text-base sm:text-lg text-zinc-950">{item.name}</h4>
                      </div>
                      <div className="text-xs sm:text-sm text-red-600 font-bold mt-1">
                        {item.atRiskCount} of 48 students currently failing this concept
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-right">
                        <div className="text-lg font-black text-red-600">{item.averageScore}%</div>
                        <div className="text-xs text-zinc-400 font-bold">Cohort Avg</div>
                      </div>
                      <button
                        onClick={() => navigate('/app/graph')}
                        className="p-2.5 hover:bg-zinc-100 rounded-xl text-zinc-600"
                        title="Locate on Knowledge Graph"
                      >
                        <GitFork className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>


        {/* Right Col: Decay Review Queue Preview */}
        <div className="space-y-8">
          <div className="bg-white border border-zinc-200 rounded-3xl p-7 sm:p-8 shadow-subtle">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-black text-lg text-zinc-950 flex items-center gap-2">
                  <RotateCcw className="w-5 h-5 text-emerald-600" />
                  Due for Review
                </h3>
                <p className="text-xs text-zinc-500 font-semibold">Ebbinghaus Retention &lt; 70%</p>
              </div>
              <button
                onClick={() => navigate('/app/review-queue')}
                className="text-xs font-extrabold text-emerald-600 hover:text-emerald-700"
              >
                Open Queue →
              </button>
            </div>

            {dueForReview.length === 0 ? (
              <div className="text-center py-10 text-zinc-400 text-sm">
                All concepts currently above retention threshold!
              </div>
            ) : (
              <div className="space-y-3.5">
                {dueForReview.slice(0, 4).map(({ concept, retention, daysSince }) => (
                  <div
                    key={concept.id}
                    onClick={() => navigate('/app/review-queue')}
                    className="p-4 rounded-2xl border border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 cursor-pointer transition-all"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-black text-sm text-zinc-950 truncate max-w-[170px]">
                        {concept.name}
                      </span>
                      <span className="text-xs font-black text-amber-600">
                        {(retention * 100).toFixed(0)}% ret.
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-zinc-500 font-medium">
                      <span>Reviewed {daysSince.toFixed(1)}d ago</span>
                      <span className="text-zinc-800 font-bold">Applied test</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Doubts Portal Teaser Banner */}
          <div className="bg-dark-900 text-white rounded-3xl p-7 shadow-float space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-400 bg-white/10 px-3 py-1 rounded-full border border-white/15">
                Peer & Instructor Doubts
              </span>
              <HelpCircle className="w-5 h-5 text-emerald-400" />
            </div>
            <h4 className="font-black text-lg text-white">Class Doubts Portal</h4>
            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
              Ask questions on tricky concepts with bilingual explanations in English, Hindi & Malayalam.
            </p>
            <button
              onClick={() => navigate('/app/doubts')}
              className="w-full bg-white text-zinc-950 hover:bg-zinc-100 font-extrabold text-xs sm:text-sm py-3 rounded-2xl transition-all shadow-subtle flex items-center justify-center gap-2 mt-2"
            >
              <span>Open Doubts Portal</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
