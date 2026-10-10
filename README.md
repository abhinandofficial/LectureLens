# LectureLens — AI Classroom Accessibility & Learning Recovery

LectureLens is an AI-powered classroom accessibility and cognitive learning-recovery web platform designed to help students bridge foundational prerequisite gaps when they miss, misunderstand, or forget part of a lecture. 

It ingests syllabus outlines, slides, and spoken speech audio, maps concepts onto a cycle-free DAG, diagnoses misconception traps via the **Mental Mirror** engine, delivers 60-second remediation bites, schedules **Ebbinghaus decay-aware** revision, and generates personalized catch-up notes with **jsPDF** export. Teachers receive aggregated insight into class-wide bottlenecks and curriculum delivery gaps.

---

## 🚀 Live Demo & Development Setup

### Prerequisites
- **Node.js**: v18+ (tested on Node v24.19.0)
- **npm**: v9+ (tested on npm 11.17.0)

### 1. Environment Configuration
Copy the example environment file:
```bash
cp .env.example server/.env
```

Edit `server/.env`:
```env
PORT=5000
NODE_ENV=development

# Optional: Add your Google Gemini API key from https://aistudio.google.com/
# If left empty, LectureLens automatically runs in deterministic offline AI mode!
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.5-flash
```

### 2. Install Dependencies
```bash
# In client/
cd client
npm install

# In server/
cd ../server
npm install
```

### 3. Run the Servers
Open two terminal windows:

**Terminal 1 (Backend API):**
```bash
cd server
npm run dev
# Server runs on http://localhost:5000
```

**Terminal 2 (Frontend Client):**
```bash
cd client
npm run dev
# Client runs on http://localhost:5173
```

---

## 🎨 Visual Design System

LectureLens follows a modern design system matching the clean aesthetic reference:
- **Typography:** Inter (tight-tracking headlines, clean geometric sans).
- **Color Palette:** Pure white background (`#ffffff`), near-black (`#0a0a0a` / `#09090b`) primary buttons and dark CTA panels, slate/zinc (`#71717a`) secondary text, and ONE emerald highlight (`#10b981`).
- **Semantic Status Colors:**
  - 🟢 **Mastered:** Emerald (`#10b981`)
  - 🟡 **Developing:** Amber (`#f59e0b`)
  - 🟠 **At-Risk:** Orange (`#f97316`)
  - 🔴 **Bottleneck:** Red (`#ef4444`)
- **Components:**
  - Pill badges (`rounded-full`, 1px border, subtle ambient shadow).
  - Rounded cards (`rounded-2xl` and `rounded-3xl` with 1px border).
  - Browser-window preview mockup with red/amber/green window controls, URL pill, and live indicator.
  - Custom SVG Circular Mastery Rings with percentage metrics.

---

## 🧠 Core Features & Architecture

### 1. Teacher AI Syllabus Ingestion + Kahn's Cycle Prevention
- Upload or paste syllabus outlines / chapters.
- Gemini API returns structured JSON: atomic concepts and prerequisite dependency edges.
- **Kahn's Topological Sort algorithm** runs on the server before saving:
  - Computes node in-degrees and queue progression.
  - If a cycle exists (e.g., $A \to B \to C \to A$), rejects the graph, isolates the offending cycle nodes, and re-prompts Gemini with explicit topological constraints (up to 2 retries).
- Draft concepts are tagged **"AI-generated, pending review"** so instructors can review, toggle bottlenecks, and edit before publishing to the live graph.

### 2. Interactive DAG Knowledge Graph (`@xyflow/react`)
- Depth-ranked tiered layout algorithm (Tier 0 Foundations to Tier 3 Advanced Structures).
- Interactive pan/zoom, node selection drawer, and minimap.
- **Student Mode:** Personal mastery score, stability $S$, prerequisite breadcrumb navigation, and **"Revisit weak foundations"** warning prompts.
- **Teacher Mode:** Cohort-aggregated mastery heatmap and class bottleneck highlights.

### 3. "Mental Mirror" Misconception Engine
- Diagnostic MCQs crafted around cognitive distractor traps.
- On an incorrect submission, Mental Mirror analyzes the specific flawed rule behind that chosen option.
- Presents a concrete **Counterexample & Paradox Scenario** demonstrating where the mental model breaks down.
- **Bilingual Support:** Instant live toggle between **English** and **हिन्दी / Hinglish**.
- **Cognitive Caching:** Explanations cached by `(questionId, optionId, language)` to reduce repeat model calls and latency.

### 4. 60-Second Remediation Bites
- Triggered immediately when a bottleneck concept is diagnosed.
- Includes:
  - 2-Sentence punchy core intuition.
  - High-contrast real-world analogy (e.g. Russian Matryoshka dolls for recursion).
  - Dual-language memory cue / mnemonic in English and Hinglish.
  - Randomized conceptual quick-check that must be verified before returning.

### 5. Ebbinghaus Decay-Aware Review Queue
- Memory retention calculated as:
  $$R = e^{-t / S}$$
  where $t$ is days elapsed and $S$ is memory stability.
- Concepts with $R < 0.70$ appear in the prioritized review queue.
- Correct retrieval attempts multiply stability by $1.85\times$; misconceptions reduce stability to schedule an earlier review.
- Serves **forward-dependent application questions** (e.g., applying FIFO Queues inside Breadth-First Search shortest-path traversals).
- Configurable decay constants and explicit pedagogical calibration disclaimer in the UI.

### 6. Personalized Lecture Catch-Up Notes & PDF Export
- Ingests slide deck content (PDF.js extraction) and live lecture speech (Web Speech API).
- Synthesizes personalized recovery notes tailored to the student's prerequisite knowledge gaps.
- Strict visual distinction:
  - 🟢 **Source-Backed Lecture Content** (Direct from slides/speech)
  - 🔵 **AI-Generated Clarification** (Analogies, memory cues, prerequisite refreshers)
- Exportable as a clean, publication-ready PDF using **jsPDF**.

### 7. Teacher Cohort Analytics
- Class-level view across all 48 enrolled students.
- Class bottleneck rankings and at-risk student counts.
- Cognitive trap frequency leaderboard.
- **Syllabus Delivery Gap:** Planned topics vs live lecture transcript coverage.

---

## 👥 Demo Personas

Switch between personas with one click in the top navigation bar:
- **Student Persona:** *Aarav Sharma* (`CS2026-042`) — Personal mastery tracking, Mental Mirror practice, decay review queue, catch-up notes.
- **Teacher Persona:** *Prof. Meera Sen* — Cohort analytics, syllabus ingestion, Kahn's cycle validator, class bottleneck heatmap.

---

## ⚖️ Pedagogical Notice
> **Disclaimer:** The Ebbinghaus retention model and stability calculations implemented in LectureLens are algorithmic approximations for spaced retrieval practice. Learning speed and memory decay vary by individual student; no specific retention rates or examination score outcomes are guaranteed.
