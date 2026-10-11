import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { DoubtItem, AppLanguage } from '../types';
import {
  HelpCircle,
  ThumbsUp,
  MessageSquare,
  Sparkles,
  Plus,
  Send,
  GitFork,
  CheckCircle2,
  Filter,
  Languages,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const DoubtsPortalPage: React.FC = () => {
  const { doubts, addDoubt, upvoteDoubt, concepts, activeLanguage, setActiveLanguage } = useApp();
  const navigate = useNavigate();

  const [isAsking, setIsAsking] = useState<boolean>(false);
  const [newQuestion, setNewQuestion] = useState<string>('');
  const [selectedConceptId, setSelectedConceptId] = useState<string>('c-rec');
  const [filterConceptId, setFilterConceptId] = useState<string>('all');

  const filteredDoubts =
    filterConceptId === 'all'
      ? doubts
      : doubts.filter((d) => d.conceptId === filterConceptId);

  const handlePostDoubt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestion.trim()) return;

    const targetConcept = concepts.find((c) => c.id === selectedConceptId);

    addDoubt({
      studentName: 'Aarav Sharma',
      studentAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256',
      question: newQuestion.trim(),
      conceptId: selectedConceptId,
      conceptName: targetConcept?.name || 'General Topic',
      answerEn: `Instructor Response: Excellent question on ${targetConcept?.name}. The core constraint hinges on memory invariant boundaries and runtime frame lifecycle.`,
      answerHi: `शिक्षक स्पष्टीकरण: ${targetConcept?.name} पर बहुत अच्छा प्रश्न। मुख्य नियम यह है कि मेमोरी इनवेरिएंट और रनटाइम फ्रेम के नियमों का पालन करना अनिवार्य है।`,
      answerMl: `അധ്യാപകന്റെ മറുപടി: ${targetConcept?.name} സംബന്ധിച്ച് മികച്ച ചോദ്യം. റൺടൈം മെമ്മറി സ്റ്റാക്കുകളുടെ പ്രവർത്തന തത്വങ്ങൾ കൃത്യമായി പരിശോധിച്ചാൽ ഈ സംശയം പരിഹരിക്കാം.`,
      status: 'answered',
    });

    setNewQuestion('');
    setIsAsking(false);
  };

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="bg-white border border-zinc-200 rounded-3xl p-7 sm:p-9 shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-100 border border-zinc-200 text-xs font-bold text-zinc-800 mb-3">
            <HelpCircle className="w-4 h-4 text-emerald-600" />
            <span>Peer & Instructor Doubts Exchange</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-zinc-950 tracking-tight">
            Doubts & Clarifications Portal
          </h1>
          <p className="text-base sm:text-lg text-zinc-600 mt-2 max-w-2xl leading-relaxed">
            Clarify misconceptions from lectures with instant prerequisite-linked answers in
            English, Hindi, and Malayalam.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Language Switch */}
          <div className="flex items-center bg-zinc-100 p-1 rounded-2xl border border-zinc-200 text-xs font-extrabold">
            <button
              onClick={() => setActiveLanguage('en')}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                activeLanguage === 'en' ? 'bg-white text-zinc-950 shadow-xs' : 'text-zinc-600'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => setActiveLanguage('hi')}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                activeLanguage === 'hi' ? 'bg-white text-zinc-950 shadow-xs' : 'text-zinc-600'
              }`}
            >
              हिन्दी
            </button>
            <button
              onClick={() => setActiveLanguage('ml')}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                activeLanguage === 'ml' ? 'bg-white text-zinc-950 shadow-xs' : 'text-zinc-600'
              }`}
            >
              മലയാളം
            </button>
          </div>

          <button
            onClick={() => setIsAsking(!isAsking)}
            className="inline-flex items-center gap-2 bg-dark-900 hover:bg-black text-white font-extrabold text-sm sm:text-base px-6 py-3.5 rounded-2xl shadow-subtle transition-all"
          >
            <Plus className="w-5 h-5" />
            <span>Ask a Doubt</span>
          </button>
        </div>
      </div>

      {/* Ask Question Drawer */}
      {isAsking && (
        <form
          onSubmit={handlePostDoubt}
          className="bg-white border-2 border-dark-900 rounded-3xl p-7 sm:p-9 shadow-modal space-y-5 animate-fadeIn"
        >
          <div className="flex items-center justify-between pb-3 border-b border-zinc-200">
            <h3 className="text-xl font-black text-zinc-950 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-600" />
              Submit Lecture Doubt
            </h3>
            <span className="text-xs text-zinc-500 font-semibold">
              Cross-references Knowledge Graph nodes
            </span>
          </div>

          <div>
            <label className="text-sm font-extrabold text-zinc-800 block mb-2">
              Select Related Course Concept:
            </label>
            <select
              value={selectedConceptId}
              onChange={(e) => setSelectedConceptId(e.target.value)}
              className="w-full sm:w-96 text-sm font-semibold p-3.5 rounded-2xl border border-zinc-300 bg-zinc-50 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-dark-900/10"
            >
              {concepts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} (Tier {c.tier})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-extrabold text-zinc-800 block mb-2">
              What specific part of the lecture did you misunderstand?
            </label>
            <textarea
              rows={4}
              required
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              placeholder="e.g. In BFS, why does enqueuing duplicate nodes cause memory explosion instead of just slow execution?"
              className="w-full text-base p-4 rounded-2xl border border-zinc-300 bg-zinc-50/70 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-dark-900/10 leading-relaxed resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsAsking(false)}
              className="px-5 py-3 rounded-2xl text-sm font-bold text-zinc-600 hover:bg-zinc-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm sm:text-base px-7 py-3 rounded-2xl shadow-subtle flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>Post Doubt to Class</span>
            </button>
          </div>
        </form>
      )}

      {/* Filter Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 mr-2 flex items-center gap-1.5 shrink-0">
          <Filter className="w-4 h-4" /> Filter Topics:
        </span>
        <button
          onClick={() => setFilterConceptId('all')}
          className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-extrabold shrink-0 transition-all border ${
            filterConceptId === 'all'
              ? 'bg-dark-900 text-white border-dark-900'
              : 'bg-white text-zinc-700 border-zinc-300 hover:bg-zinc-100'
          }`}
        >
          All Topics ({doubts.length})
        </button>
        {concepts.slice(0, 6).map((c) => (
          <button
            key={c.id}
            onClick={() => setFilterConceptId(c.id)}
            className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-extrabold shrink-0 transition-all border ${
              filterConceptId === c.id
                ? 'bg-dark-900 text-white border-dark-900'
                : 'bg-white text-zinc-700 border-zinc-300 hover:bg-zinc-100'
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      {/* Doubts List */}
      <div className="space-y-6">
        {filteredDoubts.map((doubt) => {
          const answerText =
            activeLanguage === 'ml'
              ? doubt.answerMl
              : activeLanguage === 'hi'
              ? doubt.answerHi
              : doubt.answerEn;

          return (
            <div
              key={doubt.id}
              className="bg-white border border-zinc-200 hover:border-zinc-300 rounded-3xl p-7 sm:p-9 shadow-subtle space-y-6 transition-all"
            >
              {/* Question Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-zinc-100">
                <div className="flex items-center gap-3">
                  <img
                    src={doubt.studentAvatar}
                    alt={doubt.studentName}
                    className="w-10 h-10 rounded-full border border-zinc-300 object-cover"
                  />
                  <div>
                    <h4 className="font-extrabold text-sm sm:text-base text-zinc-950">
                      {doubt.studentName}
                    </h4>
                    <span className="text-xs text-zinc-400">
                      {new Date(doubt.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-zinc-100 text-zinc-700 border border-zinc-200">
                    {doubt.conceptName}
                  </span>
                  <button
                    onClick={() => navigate('/app/graph')}
                    className="p-1.5 hover:bg-zinc-100 rounded-xl text-zinc-500 hover:text-zinc-900"
                    title="Find in Graph"
                  >
                    <GitFork className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Question Stem (20px) */}
              <h3 className="text-xl sm:text-2xl font-black text-zinc-950 leading-snug tracking-tight">
                "{doubt.question}"
              </h3>

              {/* Instructor / AI Answer (18-20px) */}
              <div
                className={`p-6 sm:p-7 rounded-2xl border ${
                  activeLanguage === 'ml'
                    ? 'font-malayalam bg-emerald-50/50 border-emerald-200'
                    : 'bg-zinc-50 border-zinc-200'
                }`}
              >
                <div className="flex items-center justify-between pb-3 border-b border-zinc-200/60 mb-3">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-800 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Verified Explanation
                  </span>
                  <span className="text-xs text-zinc-500 font-semibold font-mono">
                    {activeLanguage === 'ml'
                      ? 'മലയാളം'
                      : activeLanguage === 'hi'
                      ? 'हिन्दी'
                      : 'English'}
                  </span>
                </div>

                <p className="text-base sm:text-lg text-zinc-800 leading-relaxed font-medium">
                  {answerText}
                </p>
              </div>

              {/* Footer Controls */}
              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={() => upvoteDoubt(doubt.id)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-zinc-200 text-xs sm:text-sm font-bold text-zinc-700 hover:bg-zinc-50 hover:border-zinc-300 transition-all"
                >
                  <ThumbsUp className="w-4 h-4 text-emerald-600" />
                  <span>Helpful ({doubt.votes})</span>
                </button>

                <div className="text-xs text-zinc-400 font-semibold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Indexed in course cognitive memory</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
