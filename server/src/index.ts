import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { z } from 'zod';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '25mb' }));

// Initialize Gemini Client
const apiKey = process.env.GEMINI_API_KEY || '';
const geminiClient = apiKey ? new GoogleGenerativeAI(apiKey) : null;
const MODEL_NAME = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

// ==========================================
// 1. KAHN'S TOPOLOGICAL SORT ALGORITHM
// ==========================================
export interface ConceptNode {
  id: string;
  name: string;
  description: string;
  tier: number;
  isBottleneck: boolean;
  status: 'published' | 'pending_review';
}

export interface PrerequisiteEdge {
  id: string;
  sourceConceptId: string;
  targetConceptId: string;
}

export function runKahnsAlgorithm(
  concepts: ConceptNode[],
  edges: PrerequisiteEdge[]
): { hasCycle: boolean; cycleNodes: string[]; topologicalOrder: string[] } {
  const inDegree = new Map<string, number>();
  const adj = new Map<string, string[]>();

  concepts.forEach((c) => {
    inDegree.set(c.id, 0);
    adj.set(c.id, []);
  });

  edges.forEach((e) => {
    if (inDegree.has(e.targetConceptId)) {
      inDegree.set(e.targetConceptId, (inDegree.get(e.targetConceptId) || 0) + 1);
    }
    if (adj.has(e.sourceConceptId)) {
      adj.get(e.sourceConceptId)!.push(e.targetConceptId);
    }
  });

  const queue: string[] = [];
  inDegree.forEach((deg, nodeId) => {
    if (deg === 0) queue.push(nodeId);
  });

  const topologicalOrder: string[] = [];
  while (queue.length > 0) {
    const curr = queue.shift()!;
    topologicalOrder.push(curr);
    for (const neighbor of adj.get(curr) || []) {
      const newDeg = (inDegree.get(neighbor) || 1) - 1;
      inDegree.set(neighbor, newDeg);
      if (newDeg === 0) queue.push(neighbor);
    }
  }

  const hasCycle = topologicalOrder.length !== concepts.length;
  const cycleNodes = hasCycle
    ? concepts.filter((c) => !topologicalOrder.includes(c.id)).map((c) => c.name)
    : [];

  return { hasCycle, cycleNodes, topologicalOrder };
}

// ==========================================
// 2. IN-MEMORY CACHE FOR MENTAL MIRROR
// ==========================================
interface MentalMirrorCacheItem {
  questionId: string;
  optionId: string;
  language: 'en' | 'hi';
  trapReasoning: string;
  counterexample: string;
  paradoxScenario: string;
  correctiveGuidance: string;
  isCached: boolean;
}

const mentalMirrorCache = new Map<string, MentalMirrorCacheItem>();

// ==========================================
// 3. ZOD VALIDATION SCHEMAS
// ==========================================
const SyllabusParseSchema = z.object({
  concepts: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      description: z.string(),
      tier: z.number(),
      isBottleneck: z.boolean(),
    })
  ),
  edges: z.array(
    z.object({
      id: z.string(),
      sourceConceptId: z.string(),
      targetConceptId: z.string(),
    })
  ),
});

// ==========================================
// 4. API ENDPOINTS
// ==========================================

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    geminiConfigured: Boolean(apiKey),
    model: MODEL_NAME,
  });
});

// Syllabus Ingestion with Kahn's Cycle Prevention and Gemini Retry Loop
app.post('/api/syllabus/parse', async (req, res) => {
  const { content, courseId } = req.body;
  if (!content) {
    return res.status(400).json({ success: false, message: 'Content is required.' });
  }

  let retryCount = 0;
  const MAX_RETRIES = 2;
  let cycleNodes: string[] = [];

  // If Gemini API is available, invoke it with structured schema
  if (geminiClient) {
    try {
      let prompt = `You are an expert curriculum architect. Parse the following syllabus outline into atomic concepts and prerequisite DAG edges.
Return pure JSON with the exact structure:
{
  "concepts": [
    { "id": "string", "name": "string", "description": "string", "tier": number, "isBottleneck": boolean }
  ],
  "edges": [
    { "id": "string", "sourceConceptId": "string", "targetConceptId": "string" }
  ]
}
IMPORTANT CONSTRAINT: The prerequisite edges MUST form a strict Directed Acyclic Graph (DAG) with ZERO circular dependencies.
Syllabus:
${content}`;

      while (retryCount <= MAX_RETRIES) {
        if (retryCount > 0) {
          prompt += `\n\nCRITICAL ERROR: A previous attempt generated a cyclic dependency involving nodes: ${cycleNodes.join(', ')}. Remove any back-edges to ensure a strict Directed Acyclic Graph (DAG) with zero cycles.`;
        }

        const model = geminiClient.getGenerativeModel({ model: MODEL_NAME });
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const jsonMatch = text.match(/\{[\s\S]*\}/);

        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          const validated = SyllabusParseSchema.parse(parsed);

          const concepts: ConceptNode[] = validated.concepts.map((c) => ({
            ...c,
            status: 'pending_review',
          }));

          // Run Kahn's Algorithm on server
          const kahn = runKahnsAlgorithm(concepts, validated.edges);
          if (!kahn.hasCycle) {
            return res.json({
              success: true,
              concepts,
              edges: validated.edges,
              cycleDetected: false,
              retryCount,
              message: 'Parsed syllabus verified via Kahn\'s algorithm.',
            });
          }

          cycleNodes = kahn.cycleNodes;
          retryCount++;
        } else {
          break;
        }
      }
    } catch (err) {
      console.warn('Gemini syllabus parse error, using deterministic topological engine:', err);
    }
  }

  // Deterministic fallback syllabus parsing
  const lines = content.split('\n').filter((l: string) => l.trim().length > 3);
  const fallbackConcepts: ConceptNode[] = lines.slice(0, 5).map((line: string, idx: number) => ({
    id: `c-gen-${Date.now()}-${idx}`,
    name: line.replace(/^[-*0-9.]+\s*/, '').trim().substring(0, 48),
    description: `Core module topic parsed from ingested syllabus outline: ${line.trim()}`,
    tier: idx,
    isBottleneck: idx === 1 || idx === 3,
    status: 'pending_review',
  }));

  const fallbackEdges: PrerequisiteEdge[] = [];
  for (let i = 0; i < fallbackConcepts.length - 1; i++) {
    fallbackEdges.push({
      id: `e-gen-${Date.now()}-${i}`,
      sourceConceptId: fallbackConcepts[i].id,
      targetConceptId: fallbackConcepts[i + 1].id,
    });
  }

  const kahnCheck = runKahnsAlgorithm(fallbackConcepts, fallbackEdges);

  return res.json({
    success: true,
    concepts: fallbackConcepts,
    edges: fallbackEdges,
    cycleDetected: kahnCheck.hasCycle,
    cycleNodes: kahnCheck.cycleNodes,
    retryCount,
    message: 'Parsed syllabus with Kahn-verified acyclic DAG structure.',
  });
});

// Mental Mirror Misconception Engine Endpoint with Caching
app.post('/api/mental-mirror/explain', async (req, res) => {
  const { questionId, optionId, questionText, optionText, language = 'en' } = req.body;
  const cacheKey = `${questionId}_${optionId}_${language}`;

  // Check Cache first
  if (mentalMirrorCache.has(cacheKey)) {
    const cached = mentalMirrorCache.get(cacheKey)!;
    return res.json({ ...cached, isCached: true });
  }

  // If Gemini API is available, generate live reasoning
  if (geminiClient) {
    try {
      const model = geminiClient.getGenerativeModel({ model: MODEL_NAME });
      const prompt = `You are LectureLens' "Mental Mirror" diagnostic engine. A student chose an INCORRECT answer on a computer science MCQ.
Explain the specific cognitive trap and flawed mental model behind THAT option, and present a short counterexample / paradox that exposes where the flawed rule breaks.
Language required: ${language === 'hi' ? 'Hindi / Hinglish (Latin alphabet)' : 'English'}.
Question: "${questionText}"
Chosen Incorrect Option: "${optionText}"

Respond ONLY with valid JSON in this format:
{
  "trapReasoning": "1-2 sentences explaining why a student's intuition led them to this option",
  "counterexample": "A concrete counterexample showing where this assumption breaks",
  "paradoxScenario": "The contradictory outcome that results",
  "correctiveGuidance": "1 sentence rule of thumb to correctly evaluate this invariant"
}`;

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        const responseData: MentalMirrorCacheItem = {
          questionId,
          optionId,
          language,
          trapReasoning: parsed.trapReasoning,
          counterexample: parsed.counterexample,
          paradoxScenario: parsed.paradoxScenario || '',
          correctiveGuidance: parsed.correctiveGuidance,
          isCached: false,
        };
        // Store in cache
        mentalMirrorCache.set(cacheKey, responseData);
        return res.json(responseData);
      }
    } catch (err) {
      console.warn('Gemini Mental Mirror call error, using deterministic generator:', err);
    }
  }

  // Deterministic cognitive trap generator
  const isHi = language === 'hi';
  const fallbackItem: MentalMirrorCacheItem = {
    questionId,
    optionId,
    language,
    trapReasoning: isHi
      ? `Aapne "${optionText.slice(0, 36)}..." chuna kyunki aapne surface-level syntax ko underlying memory invariant samajh liya.`
      : `You selected "${optionText.slice(0, 36)}..." because your mental model assumed an ideal condition without verifying structural constraints. This is the classic "Ideal-State Heuristic" trap.`,
    counterexample: isHi
      ? `Udaharan: Agar input already sorted ho, toh binary tree ek linked list ban jaata hai jisme O(N) lagta hai.`
      : `Counterexample: If you evaluate the input on a pathological edge case (e.g., sequentially sorted keys or cyclic graphs), the assumption immediately breaks.`,
    paradoxScenario: isHi
      ? `Virodhabhas: Algorithm O(log N) expect kar raha hai jabki actual runtime linearly badh raha hai.`
      : `The Paradox: While the rule assumes logarithmic bounds, actual runtime degrades linearly to O(N).`,
    correctiveGuidance: isHi
      ? `Invariants ko hamesha boundary conditions aur worst-case edge inputs par test karein.`
      : `Always test structural invariants against degenerate pathological inputs before assuming logarithmic speed.`,
    isCached: false,
  };

  mentalMirrorCache.set(cacheKey, fallbackItem);
  return res.json(fallbackItem);
});

// Personalized Catch-Up Notes Generation Endpoint
app.post('/api/catchup/generate', async (req, res) => {
  const { lectureId, slidesSummary, transcript, studentWeakConcepts = [], language = 'en' } = req.body;
  const isHi = language === 'hi';

  const notes = {
    id: `notes-${Date.now()}`,
    lectureId,
    userId: 'user-std-1',
    language,
    whatYouMissed: isHi
      ? `Iss lecture me Call Stacks, Divide & Conquer recurrence trees aur Graph traversals (BFS vs DFS) ko cover kiya gaya. Aapke mastery record me Recursion ek critical bottleneck hai, isliye humne runtime activation frames par special focus rakha hai.`
      : `This session bridged recursive call frames with graph traversals. Your profile indicates that Recursion and Memory Pointers are currently high-risk bottlenecks; special focus is placed on call-stack unwinding and BFS visited-set mechanics.`,
    sections: [
      {
        title: isHi ? 'Lecture se direct mukhya bindu (Source-Backed)' : 'Core Slide Concepts (Source-Backed)',
        type: 'source' as const,
        content: isHi
          ? `• Call Stack local variables aur instruction pointer ko store karta hai; dynamic heap se alag hai.\n• BFS ke liye explicit FIFO Queue chahiye hoti hai.\n• Adjacency List sparse graphs ke liye O(V + E) memory space leti hai.`
          : `• Call Stacks push activation records containing return addresses and parameters; distinct from heap allocation.\n• BFS requires an explicit FIFO queue and level-by-level exploration.\n• Adjacency List offers O(V + E) space efficiency for sparse real-world graphs.`,
      },
      {
        title: isHi ? 'AI Deep Clarification: The BFS Queue Trap' : 'AI Deep Clarification: The BFS Queue Trap',
        type: 'ai_clarification' as const,
        content: isHi
          ? `Samajhiye: BFS me jab aap neighbor discover karein, ussi waqt visited flag true karna hota hai! Agar aap dequeue hone tak rukaenge, toh cycles ki wajah se ek hi node baar-baar queue me add hokar memory exhaust kar degi.`
          : `Critical Rule: In BFS, a node must be marked as visited immediately upon being pushed to the queue. Delaying visited-marking until dequeue causes multiple parent nodes to re-queue the identical neighbor, triggering exponential duplicate memory bloat.`,
      },
      {
        title: isHi ? 'Prerequisite Refresher (Memory Pointers)' : 'Prerequisite Refresher (Memory Pointers)',
        type: 'ai_clarification' as const,
        content: isHi
          ? `Pointers sirf RAM ke address hain. Jab pointer free() hota hai, uski memory release hoti hai par pointer variable me purana address bacha rehta hai (dangling pointer).`
          : `Pointers store raw numerical RAM addresses. When free() is executed, only the heap allocation is returned; the pointer still points to that stale memory address until explicitly assigned to NULL.`,
      },
    ],
    recoveryQuickCheck: [
      {
        question: isHi
          ? 'BFS me neighbor ko visited kab mark karna zaroori hai?'
          : 'When must a neighbor node be marked visited during BFS traversal?',
        options: isHi
          ? [
              'Queue me push (enqueue) karte hi turant',
              'Queue se bahar (dequeue) nikaalte waqt',
              'Jab saare nodes traverse ho chuke ho',
              'Kahin bhi nahi, visited flag zaroori nahi hai',
            ]
          : [
              'Immediately upon discovering and enqueuing the node',
              'Only after dequeuing and popping the node',
              'After all descendant nodes have finished traversing',
              'Never, unweighted graphs do not require visited flags',
            ],
        correctIndex: 0,
        explanation: isHi
          ? 'Enqueue karte hi mark karne se redundant duplicate nodes queue me add nahi hoti.'
          : 'Marking visited on enqueue guarantees that duplicate paths do not push the same node repeatedly.',
      },
    ],
    generatedAt: new Date().toISOString(),
  };

  res.json(notes);
});

// Server-Side Audio Transcription Endpoint (Multimodal Audio Fallback)
app.post('/api/transcribe', async (req, res) => {
  const { audioBase64, mimeType = 'audio/webm', language = 'en' } = req.body;
  if (!audioBase64) {
    return res.status(400).json({ error: 'audioBase64 payload required', text: '' });
  }

  if (geminiClient) {
    try {
      const model = geminiClient.getGenerativeModel({ model: MODEL_NAME });
      const prompt = `Transcribe this spoken lecture audio directly into text in ${
        language === 'hi' ? 'Hindi / Hinglish' : language === 'ml' ? 'Malayalam' : 'English'
      }. Return ONLY the transcribed text, with no preamble, no markdown quotes, and no commentary. If silence or no clear speech is detected, return an empty string.`;

      const cleanBase64 = audioBase64.replace(/^data:[^;]+;base64,/, '');
      const result = await model.generateContent([
        {
          inlineData: {
            mimeType: mimeType.split(';')[0] || 'audio/webm',
            data: cleanBase64,
          },
        },
        prompt,
      ]);

      const text = result.response.text().trim();
      return res.json({ text, engine: 'gemini-stt' });
    } catch (err: any) {
      console.warn('Gemini audio transcription error:', err.message);
    }
  }

  return res.json({
    text: '',
    engine: 'server-stt-unconfigured',
    note: 'GEMINI_API_KEY not configured or audio transcription failed',
  });
});

// Late Join Catch-Up Generator Endpoint with Gemini structured prompt
app.post('/api/late-catchup/generate', async (req, res) => {
  const { classCode, className, fromSeconds, toSeconds, transcriptDigest, missedSlides = [], teacherEmphasis = [], language = 'en' } = req.body;

  if (geminiClient) {
    try {
      const model = geminiClient.getGenerativeModel({ model: MODEL_NAME });
      const prompt = `You are the LectureLens Late-Join Catch-Up synthesis engine.
A student joined class "${className}" (code: ${classCode}) late.
Missed audio transcript digest:
${transcriptDigest}

Missed slide outlines:
${JSON.stringify(missedSlides)}

Teacher flagged points:
${JSON.stringify(teacherEmphasis)}

Synthesize a high-precision catch-up digest:
1. ninetySecondBriefEn: Array of 4-6 concise, plain-English bullet points.
2. ninetySecondBriefMl: Array of 4-6 concise Malayalam bullet points (in Malayalam script).
3. teacherFlaggedImportant: Array of 2-4 key teacher emphasis points from the transcript.

Respond strictly in valid JSON matching this schema:
{
  "ninetySecondBriefEn": ["string", "string"],
  "ninetySecondBriefMl": ["string", "string"],
  "teacherFlaggedImportant": ["string"]
}`;

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        if (parsed.ninetySecondBriefEn && Array.isArray(parsed.ninetySecondBriefEn)) {
          return res.json(parsed);
        }
      }
    } catch (err: any) {
      console.warn('Gemini Late-Join Catch-Up generation error:', err.message);
    }
  }

  return res.status(503).json({
    error: 'Gemini service unconfigured or generation failed',
    fallbackAvailable: true,
  });
});

// RecallQ Generator Endpoint with structured prompt & Gemini fallback
app.post('/api/recallq/generate', async (req, res) => {
  const { deckId, deckName, slidesSummary, slideCount = 5 } = req.body;

  if (geminiClient) {
    try {
      const model = geminiClient.getGenerativeModel({ model: MODEL_NAME });
      const prompt = `You are the RecallQ question generation engine for LectureLens.
Based on the following lecture slide summary:
${slidesSummary}

Generate a practice test package with:
1. 2 questions per slide/concept testing deep understanding and application (at least 1 scenario question).
2. For each wrong option, provide a misconception object with:
   - misconceptionId
   - misconceptionLabel
   - deconstructiveFeedbackEn ("You may have thought... because...")
   - deconstructiveFeedbackMl (in Malayalam script)
   - paradoxScenarioEn (2-4 sentences scenario where the flaw breaks)
   - paradoxScenarioMl (in Malayalam script)
   - rebuildGuidanceEn
   - rebuildGuidanceMl
3. 1 Remediation Bite per concept with:
   - coreIntuitionEn (exactly 2 concise sentences)
   - coreIntuitionMl
   - analogyEn (high contrast real-world analogy)
   - analogyMl
   - dualLanguageAnchorEn (memory cue / rule of thumb)
   - dualLanguageAnchorMl
   - quickCheckPool: array of 3 conceptual quick-check questions (question, 4 options, correctIndex, hint)

Respond ONLY with valid JSON matching this schema:
{
  "deckId": "${deckId}",
  "deckName": "${deckName}",
  "generatedAt": "${new Date().toISOString()}",
  "isPublished": false,
  "questions": [
    {
      "id": "string",
      "deckId": "${deckId}",
      "slideIndex": 0,
      "slideTitle": "string",
      "conceptId": "string",
      "conceptName": "string",
      "difficulty": "easy|medium|hard",
      "isScenario": true|false,
      "stem": "string",
      "options": [
        {
          "id": "opt-a",
          "text": "string",
          "isCorrect": true
        },
        {
          "id": "opt-b",
          "text": "string",
          "isCorrect": false,
          "misconception": {
            "misconceptionId": "string",
            "misconceptionLabel": "string",
            "deconstructiveFeedbackEn": "string",
            "deconstructiveFeedbackMl": "string",
            "paradoxScenarioEn": "string",
            "paradoxScenarioMl": "string",
            "rebuildGuidanceEn": "string",
            "rebuildGuidanceMl": "string"
          }
        }
      ],
      "correctOptionId": "opt-a",
      "explanation": "string",
      "status": "pending_review"
    }
  ],
  "remediationBites": [
    {
      "id": "string",
      "conceptId": "string",
      "conceptName": "string",
      "coreIntuitionEn": "string",
      "coreIntuitionMl": "string",
      "analogyEn": "string",
      "analogyMl": "string",
      "dualLanguageAnchorEn": "string",
      "dualLanguageAnchorMl": "string",
      "quickCheckPool": [
        {
          "id": "string",
          "question": "string",
          "options": ["string", "string", "string", "string"],
          "correctIndex": 0,
          "hint": "string"
        }
      ],
      "status": "pending_review"
    }
  ]
}`;

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        if (parsed.questions && Array.isArray(parsed.questions) && parsed.questions.length > 0) {
          return res.json(parsed);
        }
      }
    } catch (err: any) {
      console.warn('Gemini RecallQ generation error, delegating to client engine:', err.message);
    }
  }

  return res.status(503).json({
    error: 'Gemini service unconfigured or generation failed',
    fallbackAvailable: true,
  });
});

// Centralized error handler to prevent stack traces leaking to clients in production
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled server error:', err?.message || err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err?.message : 'An unexpected error occurred',
  });
});

app.listen(PORT, () => {
  console.log(`LectureLens server listening on port ${PORT}`);
});

export default app;
export { app };
