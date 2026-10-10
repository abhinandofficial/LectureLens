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
} from 'lucide-react';

const nodeTypes = {
  conceptNode: ConceptGraphNode,
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
  const [selectedConceptId, setSelectedConceptId] = useState<string | null>('c-rec');
  const [tierFilter, setTierFilter] = useState<number | 'all'>('all');

  // Compute depth-ranked tiered layout
  const layoutedNodes: Node[] = useMemo(() => {
    // Group concepts by tier
    const tiers: Record<number, Concept[]> = {};
    concepts.forEach((c) => {
      if (!tiers[c.tier]) tiers[c.tier] = [];
      tiers[c.tier].push(c);
    });

    const result: Node[] = [];
    const tierKeys = Object.keys(tiers)
      .map(Number)
      .sort((a, b) => a - b);

    const HORIZONTAL_SPACING = 300;
    const VERTICAL_SPACING = 240;

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
      // Highlight edge if connects to selected node
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
          stroke: isConnected ? '#09090b' : isWeakPrereq ? '#ef4444' : '#a1a1aa',
          strokeWidth: isConnected ? 2.5 : 1.5,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: isConnected ? '#09090b' : isWeakPrereq ? '#ef4444' : '#a1a1aa',
          width: 16,
          height: 16,
        },
      };
    });
  }, [edges, selectedConceptId, studentMastery]);

  const [nodes, setNodes, onNodesChange] = useNodesState(layoutedNodes);
  const [currentEdges, setEdgesState, onEdgesChange] = useEdgesState(styledEdges);

  // Sync state when dependencies change
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

  // Compute upstream prerequisites for selected node
  const upstreamPrereqs = useMemo(() => {
    if (!selectedConceptId) return [];
    const directPrereqIds = edges
      .filter((e) => e.targetConceptId === selectedConceptId)
      .map((e) => e.sourceConceptId);
    return concepts.filter((c) => directPrereqIds.includes(c.id));
  }, [selectedConceptId, edges, concepts]);

  // Compute downstream dependents for selected node
  const downstreamDependents = useMemo(() => {
    if (!selectedConceptId) return [];
    const directDependentIds = edges
      .filter((e) => e.sourceConceptId === selectedConceptId)
      .map((e) => e.targetConceptId);
    return concepts.filter((c) => directDependentIds.includes(c.id));
  }, [selectedConceptId, edges, concepts]);

  // Check if any upstream prerequisite has weak foundations
  const weakUpstreamPrereqs = useMemo(() => {
    return upstreamPrereqs.filter((p) => {
      const st = studentMastery[p.id]?.status;
      return st === 'bottleneck' || st === 'at-risk';
    });
  }, [upstreamPrereqs, studentMastery]);

  return (
    <div className="h-[calc(100vh-6.5rem)] flex flex-col bg-white border border-zinc-200 rounded-3xl overflow-hidden shadow-subtle relative">
      {/* Top Toolbar */}
      <div className="h-14 border-b border-zinc-200 px-5 flex items-center justify-between bg-zinc-50/80 backdrop-blur-sm z-10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <GitFork className="w-4 h-4 text-emerald-600" />
            <h2 className="font-extrabold text-sm text-zinc-950">
              {isTeacher ? 'Cohort Prerequisite Topology' : 'Interactive Dependency Graph'}
            </h2>
          </div>

          <div className="h-4 w-[1px] bg-zinc-200"></div>

          {/* Tier Filter Buttons */}
          <div className="flex items-center gap-1 text-xs">
            <span className="text-zinc-400 text-[11px] font-semibold mr-1">Tiers:</span>
            {(['all', 0, 1, 2, 3] as const).map((tier) => (
              <button
                key={tier}
                onClick={() => setTierFilter(tier)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                  tierFilter === tier
                    ? 'bg-dark-900 text-white'
                    : 'bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-100'
                }`}
              >
                {tier === 'all' ? 'All Tiers' : `T${tier}`}
              </button>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="hidden lg:flex items-center gap-4 text-xs font-semibold">
          <div className="flex items-center gap-1.5 text-emerald-700">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span>Mastered (80%+)</span>
          </div>
          <div className="flex items-center gap-1.5 text-amber-700">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            <span>Developing (60-79%)</span>
          </div>
          <div className="flex items-center gap-1.5 text-orange-700">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
            <span>At-Risk (40-59%)</span>
          </div>
          <div className="flex items-center gap-1.5 text-red-700">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
            <span>Bottleneck (&lt;40%)</span>
          </div>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={currentEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.2}
          maxZoom={1.8}
        >
          <Background gap={20} size={1} color="#e4e4e7" />
          <Controls className="!bg-white !border !border-zinc-200 !rounded-xl !shadow-subtle !overflow-hidden" />
          <MiniMap
            nodeColor={(n: any) => {
              const status = n.data?.mastery?.status;
              if (status === 'mastered') return '#10b981';
              if (status === 'developing') return '#f59e0b';
              if (status === 'at-risk') return '#f97316';
              return '#ef4444';
            }}
            className="!bg-white !border !border-zinc-200 !rounded-2xl !shadow-subtle"
          />

          {/* Floated Status Callout for Student */}
          {!isTeacher && weakUpstreamPrereqs.length > 0 && selectedConcept && (
            <Panel position="top-left" className="m-4">
              <div className="bg-red-50/95 border border-red-200 backdrop-blur-md rounded-2xl p-4 max-w-sm shadow-subtle text-xs animate-fadeIn">
                <div className="font-bold text-red-700 flex items-center gap-1.5 mb-1">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                  Foundation Warning
                </div>
                <p className="text-red-900 leading-relaxed mb-2">
                  <strong>{selectedConcept.name}</strong> relies directly on weak upstream
                  prerequisites:{' '}
                  <strong>{weakUpstreamPrereqs.map((p) => p.name).join(', ')}</strong>.
                </p>
                <button
                  onClick={() => {
                    const bite = remediationBites[weakUpstreamPrereqs[0].id];
                    if (bite) setActiveRemediation(bite);
                  }}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold px-3 py-1.5 rounded-xl transition-all"
                >
                  Revisit Weak Foundation Now
                </button>
              </div>
            </Panel>
          )}
        </ReactFlow>

        {/* Right Details Drawer for Selected Concept */}
        {selectedConcept && (
          <div className="absolute top-4 right-4 bottom-4 w-80 sm:w-96 bg-white/95 backdrop-blur-md border border-zinc-200 rounded-3xl p-6 shadow-modal flex flex-col justify-between overflow-y-auto z-20">
            <div>
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-zinc-100 mb-4">
                <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                  Tier {selectedConcept.tier} Concept
                </span>
                <span
                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                    selectedConcept.isBottleneck
                      ? 'bg-red-50 text-red-700 border-red-200'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}
                >
                  {selectedConcept.isBottleneck ? 'Bottleneck' : 'Normal Node'}
                </span>
              </div>

              <h3 className="text-xl font-extrabold text-zinc-950 mb-2">
                {selectedConcept.name}
              </h3>
              <p className="text-xs text-zinc-500 leading-relaxed mb-6">
                {selectedConcept.description}
              </p>

              {/* Upstream Prerequisites Breadcrumbs */}
              <div className="mb-5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2 flex items-center gap-1.5">
                  <GitFork className="w-3.5 h-3.5" /> Prerequisites (Incoming)
                </h4>
                {upstreamPrereqs.length === 0 ? (
                  <div className="text-xs text-zinc-400 italic">Root foundational concept</div>
                ) : (
                  <div className="space-y-2">
                    {upstreamPrereqs.map((p) => {
                      const m = studentMastery[p.id];
                      return (
                        <div
                          key={p.id}
                          onClick={() => setSelectedConceptId(p.id)}
                          className="flex items-center justify-between p-2.5 rounded-xl border border-zinc-200 hover:bg-zinc-50 cursor-pointer text-xs"
                        >
                          <span className="font-semibold text-zinc-800">{p.name}</span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
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

              {/* Downstream Dependents */}
              <div className="mb-6">
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
                  Dependents (Blocked if unmastered)
                </h4>
                {downstreamDependents.length === 0 ? (
                  <div className="text-xs text-zinc-400 italic">Leaf node in curriculum</div>
                ) : (
                  <div className="space-y-2">
                    {downstreamDependents.map((d) => (
                      <div
                        key={d.id}
                        onClick={() => setSelectedConceptId(d.id)}
                        className="flex items-center justify-between p-2.5 rounded-xl border border-zinc-100 hover:bg-zinc-50 cursor-pointer text-xs"
                      >
                        <span className="font-medium text-zinc-700">{d.name}</span>
                        <span className="text-[10px] text-zinc-400 font-mono">Tier {d.tier}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Actions Bottom */}
            <div className="pt-4 border-t border-zinc-100 space-y-2">
              <button
                onClick={() => navigate('/app/practice')}
                className="w-full bg-dark-900 hover:bg-black text-white font-bold text-xs py-3 rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <BrainCircuit className="w-4 h-4 text-emerald-400" />
                <span>Practice MCQs on this Concept</span>
              </button>

              {remediationBites[selectedConcept.id] && (
                <button
                  onClick={() => setActiveRemediation(remediationBites[selectedConcept.id])}
                  className="w-full bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-bold text-xs py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5"
                >
                  <Zap className="w-4 h-4 fill-red-500" />
                  <span>Open 60-Second Remediation Bite</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
