import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ReactFlow,
  Controls,
  Background,
  MiniMap,
  Panel,
  useNodesState,
  useEdgesState,
  useReactFlow,
  MarkerType,
  Node,
  Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useApp } from '../context/AppContext';
import { ConceptGraphNode } from '../components/ConceptGraphNode';
import { Concept, MasteryTier } from '../types';
import {
  GitFork,
  AlertTriangle,
  CheckCircle2,
  BrainCircuit,
  Zap,
  Info,
  Layers,
  ArrowRight,
  Shield,
  UserCheck,
  X,
} from 'lucide-react';

const nodeTypes = {
  conceptNode: ConceptGraphNode,
};

// Re-centers and fits graph view whenever docked detail panel opens or closes
const FlowFitViewController: React.FC<{ panelOpen: boolean }> = ({ panelOpen }) => {
  const { fitView } = useReactFlow();

  React.useEffect(() => {
    const timer = setTimeout(() => {
      fitView({ padding: 0.18, duration: 250 });
    }, 60);
    return () => clearTimeout(timer);
  }, [panelOpen, fitView]);

  return null;
};

export const KnowledgeGraphPage: React.FC = () => {
  const {
    concepts,
    edges,
    studentMastery,
    currentUser,
    switchRole,
    setActiveRemediation,
    remediationBites,
  } = useApp();
  const navigate = useNavigate();

  const isTeacher = currentUser.role === 'teacher';
  const [selectedConceptId, setSelectedConceptId] = useState<string | null>(null);
  const [tierFilter, setTierFilter] = useState<number | 'all'>('all');

  // Compute depth-ranked tiered layout with generous spacing for enlarged nodes
  const layoutedNodes: Node[] = useMemo(() => {
    const tiers: Record<number, Concept[]> = {};
    concepts.forEach((c) => {
      if (!tiers[c.tier]) tiers[c.tier] = [];
      tiers[c.tier].push(c);
    });

    const result: Node[] = [];
    const tierKeys = Object.keys(tiers)
      .map(Number)
      .sort((a, b) => a - b);

    // Spacing calibrated for 272px simplified node cards
    const HORIZONTAL_SPACING = 340;
    const VERTICAL_SPACING = 210;

    tierKeys.forEach((tier) => {
      const tierConcepts = tiers[tier];
      const tierWidth = tierConcepts.length * HORIZONTAL_SPACING;
      const startX = -tierWidth / 2 + HORIZONTAL_SPACING / 2;

      tierConcepts.forEach((concept, index) => {
        const isHidden = tierFilter !== 'all' && concept.tier !== tierFilter;
        result.push({
          id: concept.id,
          type: 'conceptNode',
          position: {
            x: startX + index * HORIZONTAL_SPACING,
            y: tier * VERTICAL_SPACING + 50,
          },
          data: {
            concept,
            mastery: studentMastery[concept.id],
            isTeacherMode: isTeacher,
            isSelected: concept.id === selectedConceptId,
          },
          hidden: isHidden,
        });
      });
    });

    return result;
  }, [concepts, studentMastery, isTeacher, selectedConceptId, tierFilter]);

  // Compute edges with styled directional arrows
  const styledEdges: Edge[] = useMemo(() => {
    return edges.map((edge) => {
      const isConnected =
        edge.sourceConceptId === selectedConceptId || edge.targetConceptId === selectedConceptId;

      const sourceMastery = studentMastery[edge.sourceConceptId]?.status;
      const isWeakPrereq = sourceMastery === 'bottleneck' || sourceMastery === 'at-risk';

      return {
        id: edge.id,
        source: edge.sourceConceptId,
        target: edge.targetConceptId,
        animated: isWeakPrereq,
        style: {
          stroke: isConnected ? '#09090b' : isWeakPrereq ? '#ef4444' : '#cbd5e1',
          strokeWidth: isConnected ? 2.5 : 1.75,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: isConnected ? '#09090b' : isWeakPrereq ? '#ef4444' : '#94a3b8',
          width: 16,
          height: 16,
        },
      };
    });
  }, [edges, selectedConceptId, studentMastery]);

  const [nodes, setNodes, onNodesChange] = useNodesState(layoutedNodes);
  const [currentEdges, setEdgesState, onEdgesChange] = useEdgesState(styledEdges);

  React.useEffect(() => {
    setNodes(layoutedNodes);
  }, [layoutedNodes, setNodes]);

  React.useEffect(() => {
    setEdgesState(styledEdges);
  }, [styledEdges, setEdgesState]);

  const onNodeClick = useCallback((_: any, node: Node) => {
    setSelectedConceptId(node.id);
  }, []);

  const selectedConcept = useMemo(
    () => concepts.find((c) => c.id === selectedConceptId) || null,
    [concepts, selectedConceptId]
  );

  const upstreamPrereqs = useMemo(() => {
    if (!selectedConceptId) return [];
    const directPrereqIds = edges
      .filter((e) => e.targetConceptId === selectedConceptId)
      .map((e) => e.sourceConceptId);
    return concepts.filter((c) => directPrereqIds.includes(c.id));
  }, [selectedConceptId, edges, concepts]);

  const downstreamDependents = useMemo(() => {
    if (!selectedConceptId) return [];
    const directDependentIds = edges
      .filter((e) => e.sourceConceptId === selectedConceptId)
      .map((e) => e.targetConceptId);
    return concepts.filter((c) => directDependentIds.includes(c.id));
  }, [selectedConceptId, edges, concepts]);

  const weakUpstreamPrereqs = useMemo(() => {
    return upstreamPrereqs.filter((p) => {
      const st = studentMastery[p.id]?.status;
      return st === 'bottleneck' || st === 'at-risk';
    });
  }, [upstreamPrereqs, studentMastery]);

  return (
    <div className="h-[calc(100vh-6.5rem)] flex flex-col bg-white border border-zinc-200 rounded-3xl overflow-hidden shadow-subtle relative">
      {/* Top Single Tidy Toolbar */}
      <div className="border-b border-zinc-200 px-5 py-2.5 flex flex-wrap items-center justify-between gap-3 bg-zinc-50/90 z-10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <GitFork className="w-4 h-4 text-emerald-600 shrink-0" />
            <h2 className="font-extrabold text-sm text-zinc-950 whitespace-nowrap">
              {isTeacher ? 'Cohort Prerequisite Topology' : 'Interactive Knowledge Graph'}
            </h2>
          </div>

          <div className="h-4 w-[1px] bg-zinc-300 hidden sm:block"></div>

          {/* Tier Filter Buttons */}
          <div className="flex items-center gap-1">
            <span className="text-zinc-500 text-xs font-semibold mr-1">Tiers:</span>
            {(['all', 0, 1, 2, 3] as const).map((tier) => (
              <button
                key={tier}
                onClick={() => setTierFilter(tier)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  tierFilter === tier
                    ? 'bg-dark-900 text-white shadow-xs'
                    : 'bg-white text-zinc-700 border border-zinc-200 hover:bg-zinc-100'
                }`}
              >
                {tier === 'all' ? 'All' : `T${tier}`}
              </button>
            ))}
          </div>
        </div>

        {/* Mastery Legend on the same single row */}
        <div className="flex items-center gap-3.5 text-xs font-semibold text-zinc-600 flex-wrap">
          <div className="flex items-center gap-1.5 text-emerald-800">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span>Mastered (80%+)</span>
          </div>
          <div className="flex items-center gap-1.5 text-amber-800">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            <span>Developing (60-79%)</span>
          </div>
          <div className="flex items-center gap-1.5 text-orange-800">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
            <span>At-Risk (40-59%)</span>
          </div>
          <div className="flex items-center gap-1.5 text-red-800">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
            <span>Bottleneck (&lt;40%)</span>
          </div>
        </div>
      </div>

      {/* Main Content: Split layout with graph canvas and docked right panel */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Graph Canvas: takes all remaining available width */}
        <div className="flex-1 min-w-0 h-full relative">
          <ReactFlow
            nodes={nodes}
            edges={currentEdges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={onNodeClick}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.18 }}
            minZoom={0.2}
            maxZoom={1.6}
          >
            <Background gap={24} size={1} color="#e2e8f0" />
            <Controls
              position="bottom-left"
              className="!bg-white !border !border-zinc-200 !rounded-xl !shadow-subtle !overflow-hidden !m-4"
            />
            <MiniMap
              position="bottom-right"
              nodeColor={(n: any) => {
                const status = n.data?.mastery?.status;
                if (status === 'mastered') return '#10b981';
                if (status === 'developing') return '#f59e0b';
                if (status === 'at-risk') return '#f97316';
                return '#ef4444';
              }}
              className="!bg-white !border !border-zinc-200 !rounded-xl !shadow-subtle !m-4 hidden sm:block"
            />
            <FlowFitViewController panelOpen={!!selectedConcept} />

            {/* Floated Status Callout for Student */}
            {!isTeacher && weakUpstreamPrereqs.length > 0 && selectedConcept && (
              <Panel position="top-left" className="m-4">
                <div className="bg-red-50/95 border-2 border-red-300 backdrop-blur-md rounded-2xl p-4 max-w-sm shadow-float text-xs animate-fadeIn">
                  <div className="font-extrabold text-red-700 flex items-center gap-1.5 text-sm mb-1">
                    <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                    Foundation Warning
                  </div>
                  <p className="text-red-950 leading-relaxed mb-2.5 font-medium">
                    <strong>{selectedConcept.name}</strong> relies on unmastered upstream
                    prerequisites:{' '}
                    <strong>{weakUpstreamPrereqs.map((p) => p.name).join(', ')}</strong>.
                  </p>
                  <button
                    onClick={() => {
                      const bite = remediationBites[weakUpstreamPrereqs[0].id];
                      if (bite) setActiveRemediation(bite);
                    }}
                    className="bg-red-600 hover:bg-red-700 text-white font-bold px-3 py-1.5 rounded-lg transition-all shadow-xs flex items-center gap-1.5 text-xs"
                  >
                    <Zap className="w-3.5 h-3.5 fill-white" />
                    <span>Revisit Foundation</span>
                  </button>
                </div>
              </Panel>
            )}
          </ReactFlow>
        </div>

        {/* Docked Right-Hand Side Detail Panel: Never covers the graph */}
        {selectedConcept && (
          <aside className="w-[380px] shrink-0 h-full border-l border-zinc-200 bg-white flex flex-col z-20 shadow-sm animate-fadeIn">
            {/* Header with Title and Clear Close (X) button */}
            <div className="p-4 sm:p-5 border-b border-zinc-200 flex items-start justify-between gap-3 bg-zinc-50/70 shrink-0">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                    Tier {selectedConcept.tier} Topic
                  </span>
                  <span
                    className={`text-[11px] font-extrabold px-2 py-0.5 rounded-full border ${
                      selectedConcept.isBottleneck
                        ? 'bg-red-50 text-red-800 border-red-200'
                        : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    }`}
                  >
                    {selectedConcept.isBottleneck ? 'Critical Bottleneck' : 'Verified Topic'}
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-black text-zinc-950 leading-snug break-words">
                  {selectedConcept.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedConceptId(null)}
                className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-900 hover:bg-zinc-200/60 transition-colors shrink-0"
                title="Close panel"
                aria-label="Close panel"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Panel Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
              {/* Concept Scope Description */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                  Concept Description
                </h4>
                <p className="text-xs sm:text-sm text-zinc-700 leading-relaxed bg-zinc-50/80 p-3 rounded-xl border border-zinc-200/80">
                  {selectedConcept.description}
                </p>
              </div>

              {/* Mastery & Stability Stats */}
              <div className="p-3 rounded-xl border border-zinc-200 bg-zinc-50/50 flex items-center justify-between text-xs">
                <div>
                  <span className="text-zinc-500 font-medium block">
                    {isTeacher ? 'Cohort Mastery' : 'Personal Mastery'}
                  </span>
                  <span className="font-black text-base text-zinc-950">
                    {isTeacher
                      ? `${selectedConcept.cohortMastery || 50}%`
                      : `${studentMastery[selectedConcept.id]?.score || 45}%`}
                  </span>
                </div>
                {!isTeacher && studentMastery[selectedConcept.id]?.stability && (
                  <div className="text-right">
                    <span className="text-zinc-500 font-medium block">Memory Stability</span>
                    <span className="font-mono font-bold text-emerald-700 text-xs sm:text-sm">
                      S={studentMastery[selectedConcept.id]?.stability} days
                    </span>
                  </div>
                )}
              </div>

              {/* Upstream Prerequisites Breadcrumbs (Incoming) */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2 flex items-center gap-1.5">
                  <GitFork className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Incoming Prerequisites ({upstreamPrereqs.length})</span>
                </h4>
                {upstreamPrereqs.length === 0 ? (
                  <div className="text-xs text-zinc-400 italic bg-zinc-50 p-2.5 rounded-xl border border-zinc-200">
                    Root foundational concept (No incoming dependencies)
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {upstreamPrereqs.map((p) => {
                      const m = studentMastery[p.id];
                      return (
                        <div
                          key={p.id}
                          onClick={() => setSelectedConceptId(p.id)}
                          className="flex items-center justify-between p-2.5 rounded-xl border border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 cursor-pointer text-xs font-semibold transition-all"
                        >
                          <span className="text-zinc-900 truncate pr-2">{p.name}</span>
                          <span
                            className={`text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                              m?.status === 'mastered'
                                ? 'bg-emerald-100 text-emerald-800'
                                : m?.status === 'bottleneck'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {m?.score || 50}%
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Downstream Dependents (Outgoing) */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">
                  Downstream Dependents ({downstreamDependents.length})
                </h4>
                {downstreamDependents.length === 0 ? (
                  <div className="text-xs text-zinc-400 italic bg-zinc-50 p-2.5 rounded-xl border border-zinc-200">
                    Terminal node in curriculum
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {downstreamDependents.map((d) => (
                      <div
                        key={d.id}
                        onClick={() => setSelectedConceptId(d.id)}
                        className="flex items-center justify-between p-2.5 rounded-xl border border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 cursor-pointer text-xs font-medium transition-all"
                      >
                        <span className="text-zinc-800 truncate pr-2">{d.name}</span>
                        <span className="text-[11px] font-mono font-bold text-zinc-400 shrink-0">
                          Tier {d.tier}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Panel Footer Actions */}
            <div className="p-4 border-t border-zinc-200 bg-zinc-50/70 space-y-2 shrink-0">
              <button
                onClick={() => navigate('/app/practice')}
                className="w-full bg-dark-900 hover:bg-black text-white font-bold text-xs py-2.5 rounded-xl shadow-xs transition-all flex items-center justify-center gap-2"
              >
                <BrainCircuit className="w-4 h-4 text-emerald-400" />
                <span>Practice MCQs on this Concept</span>
              </button>

              {remediationBites[selectedConcept.id] && (
                <button
                  onClick={() => setActiveRemediation(remediationBites[selectedConcept.id])}
                  className="w-full bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-bold text-xs py-2 rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  <Zap className="w-3.5 h-3.5 fill-red-500" />
                  <span>Open 60-Second Remediation Bite</span>
                </button>
              )}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
};
