import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { parseSyllabusWithGemini, runKahnsAlgorithm } from '../services/api';
import { Concept, PrerequisiteEdge } from '../types';
import {
  UploadCloud,
  GitFork,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Plus,
  Trash2,
  Edit2,
  ArrowRight,
  ShieldAlert,
  Check,
} from 'lucide-react';

const VALID_SAMPLE = `Unit 4: Advanced Graph Algorithms & Flow
1. Disjoint Set Union (DSU) & Union-Find with Path Compression
2. Kruskal's Minimum Spanning Tree Algorithm (Requires: DSU)
3. Prim's Algorithm & Priority Queue Invariants (Requires: Binary Heaps)
4. Topological Sorting & Kahn's In-Degree Algorithm (Requires: BFS, Queues)
5. Shortest Paths: Dijkstra's Algorithm with Non-negative Weights (Requires: Min-Heap, BFS)`;

const CYCLE_SAMPLE = `Unit 5: Faulty Cyclic Dependency Test
1. System Alpha: Requires System Beta
2. System Beta: Requires System Gamma
3. System Gamma: Requires System Alpha (Direct Circular Cycle! Alpha -> Beta -> Gamma -> Alpha)`;

export const SyllabusIngestionPage: React.FC = () => {
  const { course, addOrUpdateConceptsAndEdges } = useApp();

  const [inputText, setInputText] = useState<string>(VALID_SAMPLE);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [extractedConcepts, setExtractedConcepts] = useState<Concept[]>([]);
  const [extractedEdges, setExtractedEdges] = useState<PrerequisiteEdge[]>([]);
  const [cycleReport, setCycleReport] = useState<{
    hasCycle: boolean;
    cycleNodes: string[];
    topologicalOrder: string[];
  } | null>(null);
  const [isPublished, setIsPublished] = useState<boolean>(false);

  const handleRunIngestion = async () => {
    setIsProcessing(true);
    setIsPublished(false);
    try {
      const res = await parseSyllabusWithGemini(inputText, course.id);

      setExtractedConcepts(res.concepts);
      setExtractedEdges(res.edges);

      // Verify Kahn's topological sort
      const kahnResult = runKahnsAlgorithm(res.concepts, res.edges);
      setCycleReport(kahnResult);
    } catch (err) {
      console.error('Ingestion failed:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTestCycle = () => {
    setInputText(CYCLE_SAMPLE);
    const mockCycleConcepts: Concept[] = [
      {
        id: 'c-alpha',
        courseId: course.id,
        name: 'System Alpha',
        description: 'Module Alpha',
        tier: 1,
        isBottleneck: true,
        status: 'pending_review',
      },
      {
        id: 'c-beta',
        courseId: course.id,
        name: 'System Beta',
        description: 'Module Beta',
        tier: 2,
        isBottleneck: false,
        status: 'pending_review',
      },
      {
        id: 'c-gamma',
        courseId: course.id,
        name: 'System Gamma',
        description: 'Module Gamma',
        tier: 3,
        isBottleneck: false,
        status: 'pending_review',
      },
    ];
    const mockCycleEdges: PrerequisiteEdge[] = [
      { id: 'ec-1', sourceConceptId: 'c-alpha', targetConceptId: 'c-beta' },
      { id: 'ec-2', sourceConceptId: 'c-beta', targetConceptId: 'c-gamma' },
      { id: 'ec-3', sourceConceptId: 'c-gamma', targetConceptId: 'c-alpha' }, // CYCLE!
    ];

    setExtractedConcepts(mockCycleConcepts);
    setExtractedEdges(mockCycleEdges);

    const kahnResult = runKahnsAlgorithm(mockCycleConcepts, mockCycleEdges);
    setCycleReport(kahnResult);
  };

  const handleBreakCycle = () => {
    // Remove the circular edge to demonstrate Kahn validation passing
    const fixedEdges = extractedEdges.filter((e) => e.sourceConceptId !== 'c-gamma');
    setExtractedEdges(fixedEdges);
    const kahnResult = runKahnsAlgorithm(extractedConcepts, fixedEdges);
    setCycleReport(kahnResult);
  };

  const handlePublish = () => {
    if (cycleReport?.hasCycle) return;
    const publishedConcepts = extractedConcepts.map((c) => ({
      ...c,
      status: 'published' as const,
    }));
    addOrUpdateConceptsAndEdges(publishedConcepts, extractedEdges);
    setIsPublished(true);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-zinc-200 rounded-3xl p-6 sm:p-8 shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 border border-zinc-200 text-xs font-semibold text-zinc-700 mb-2">
            <UploadCloud className="w-3.5 h-3.5 text-emerald-600" />
            <span>Kahn's Topological Sort Validator</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-950 tracking-tight">
            Syllabus Ingestion & Cycle Prevention
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1 max-w-xl">
            Ingest course outlines with Gemini. Before saving, Kahn's algorithm validates the prerequisite
            DAG to reject cyclic dependencies. Teachers inspect and approve before publishing.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            onClick={() => setInputText(VALID_SAMPLE)}
            className="text-xs font-semibold px-3 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 transition-colors"
          >
            Load Valid Outline
          </button>
          <button
            onClick={handleTestCycle}
            className="text-xs font-semibold px-3 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 transition-colors"
          >
            Simulate Cycle Error
          </button>
        </div>
      </div>

      {/* Input Textarea & Action */}
      <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-subtle space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">
            Paste Syllabus / Outline / Chapter Text
          </label>
          <span className="text-xs text-zinc-400">Gemini 2.5 Flash Structured JSON Extraction</span>
        </div>

        <textarea
          rows={6}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Paste course topics and module prerequisites here..."
          className="w-full text-xs font-mono p-4 rounded-2xl border border-zinc-200 bg-zinc-50/50 text-zinc-800 focus:outline-none focus:ring-2 focus:ring-dark-900/10 leading-relaxed resize-none"
        />

        <div className="flex items-center justify-between pt-2">
          <div className="text-xs text-zinc-500 flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            Automatic atomic concept extraction + prerequisite edge resolution
          </div>

          <button
            disabled={isProcessing || !inputText.trim()}
            onClick={handleRunIngestion}
            className="bg-dark-900 hover:bg-black disabled:bg-zinc-200 disabled:text-zinc-400 text-white font-bold text-xs sm:text-sm px-6 py-3 rounded-2xl shadow-subtle transition-all flex items-center gap-2"
          >
            {isProcessing ? 'Running Kahn Engine...' : 'Extract & Run Kahn Cycle Check'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Kahn Validation Report Bar */}
      {cycleReport && (
        <div
          className={`p-6 rounded-3xl border shadow-subtle animate-fadeIn ${
            cycleReport.hasCycle
              ? 'bg-red-50 border-red-200 text-red-950'
              : 'bg-emerald-50 border-emerald-200 text-emerald-950'
          }`}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              {cycleReport.hasCycle ? (
                <ShieldAlert className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
              ) : (
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
              )}
              <div>
                <h4 className="font-extrabold text-base">
                  {cycleReport.hasCycle
                    ? "Kahn's Topological Sort Rejected: Circular Dependency Detected!"
                    : "Kahn's Topological Sort Verified: Valid Acyclic DAG"}
                </h4>
                <p className="text-xs mt-1">
                  {cycleReport.hasCycle
                    ? `Offending cycle loop contains nodes: ${cycleReport.cycleNodes.join(' ➔ ')}. In-degrees cannot reach zero.`
                    : `Zero cycles detected. All ${extractedConcepts.length} concepts can be strictly ordered in topological execution sequence.`}
                </p>
              </div>
            </div>

            {cycleReport.hasCycle && (
              <button
                onClick={handleBreakCycle}
                className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shrink-0"
              >
                Auto-Repair: Remove Back-Edge
              </button>
            )}
          </div>
        </div>
      )}

      {/* Extracted Concepts Review & Approval Table */}
      {extractedConcepts.length > 0 && (
        <div className="bg-white border border-zinc-200 rounded-3xl p-6 sm:p-8 shadow-subtle space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                AI-Generated, Pending Review
              </span>
              <h3 className="text-xl font-extrabold text-zinc-950 mt-1">
                Extracted Concepts & Edge Dependencies ({extractedConcepts.length})
              </h3>
            </div>

            <div className="flex items-center gap-3">
              <button
                disabled={cycleReport?.hasCycle || isPublished}
                onClick={handlePublish}
                className={`inline-flex items-center gap-2 font-bold text-xs sm:text-sm px-6 py-3 rounded-2xl shadow-subtle transition-all ${
                  isPublished
                    ? 'bg-emerald-600 text-white cursor-default'
                    : cycleReport?.hasCycle
                    ? 'bg-zinc-200 text-zinc-400 cursor-not-allowed'
                    : 'bg-dark-900 hover:bg-black text-white'
                }`}
              >
                {isPublished ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Published to Course Graph!</span>
                  </>
                ) : (
                  <>
                    <span>Approve & Publish to DAG</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Concepts Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {extractedConcepts.map((concept, idx) => (
              <div
                key={concept.id}
                className="p-4 rounded-2xl border border-zinc-200 hover:border-zinc-300 transition-all bg-white"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                    Tier {concept.tier}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                    Pending Review
                  </span>
                </div>
                <h4 className="font-bold text-sm text-zinc-900 mb-1">{concept.name}</h4>
                <p className="text-xs text-zinc-500 leading-relaxed mb-3">
                  {concept.description}
                </p>

                <div className="pt-2 border-t border-zinc-100 flex items-center justify-between text-xs">
                  <label className="flex items-center gap-2 cursor-pointer text-zinc-600">
                    <input
                      type="checkbox"
                      checked={concept.isBottleneck}
                      onChange={(e) => {
                        const updated = [...extractedConcepts];
                        updated[idx].isBottleneck = e.target.checked;
                        setExtractedConcepts(updated);
                      }}
                      className="accent-dark-900 rounded"
                    />
                    <span className="text-[11px] font-semibold">Flag as Potential Bottleneck</span>
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
