# LectureLens

> Real-time AI cognitive learning platform that synchronizes live lectures with student comprehension, diagnosing misconceptions and delivering bite-sized remediation before knowledge decays.

---

## 📖 Overview

LectureLens is an assistive classroom and cognitive recovery platform that bridges the gap between live instruction and individual student memory. It captures live spoken audio and synchronized lecture slides, filters acoustic fillers in real time, diagnoses root misconceptions using the **Mental Mirror** engine, delivers **60-Second Remediation Bites**, tracks forgetting using **Ebbinghaus decay modeling**, and auto-generates personalized **Late Join Catch-Up** summaries and **RecallQ** diagnostic assessments.

---

## ⚡ Key Features

- **Live Lecture Studio & Real-Time Sync**: Real-time microphone capture via Web Speech API with automatic filler word removal ("um", "uh", "like"), synchronized to active presentation slides and broadcast across client sessions.
- **Late Join Catch-Up Panel**: Automatically detects late-joining or rejoining students, synthesizing an instant 90-second brief, covered slides, teacher-flagged takeaways, and quick-check diagnostic questions for the missed window with bilingual audio and PDF export.
- **Mental Mirror Diagnostic Engine**: Diagnostic MCQs engineered around cognitive distractor traps. Incorrect answers surface concrete counterexamples and paradox scenarios exposing flawed mental models.
- **60-Second Remediation Bites**: Automated micro-lessons triggered upon bottleneck detection, featuring core intuitions, high-contrast real-world analogies, and dual-language anchors (English, Hindi, Malayalam).
- **Ebbinghaus Decay Review Queue**: Tracks student memory stability ($R = e^{-t/S}$) for each encountered topic, automatically scheduling prioritized spaced reviews when retention drops below 70%.
- **Interactive Knowledge DAG (`@xyflow/react`)**: Topological prerequisite concept graph with student mastery navigation and teacher cohort heatmap views.
- **RecallQ Question Studio**: Automatic generation of deck-aligned practice questions from lecture slides using structured AI schemas with misconception-mapped distractors and teacher approval workflows.
- **Syllabus Ingestion & Kahn's Algorithm**: Automated syllabus parsing with cycle detection using Kahn's topological sort algorithm to validate prerequisite structures before delivery.
- **Doubts Portal**: Student question submissions with bilingual peer-and-instructor answer moderation.
- **Multilingual Support**: First-class support for English, Hindi (हिन्दी), and Malayalam (മലയാളം), including script rendering and bilingual PDF exports.

---

## 🛠️ Tech Stack

### Frontend (`client/`)
- **Core Framework**: React 19 (`react`, `react-dom`) with TypeScript 5.7
- **Build Tool**: Vite 6 (`vite`, `@vitejs/plugin-react`)
- **Routing**: React Router v7 (`react-router-dom`)
- **Styling**: Tailwind CSS v3 (`tailwindcss`, `autoprefixer`, `postcss`, `clsx`, `tailwind-merge`)
- **Interactive Graph**: `@xyflow/react` v12 (React Flow)
- **Icons**: Lucide React (`lucide-react`)
- **Document & Media Processing**:
  - `jspdf` (v2.5.2) & `html2canvas` for client-side multi-page PDF generation
  - `pdfjs-dist` & `jszip` for slide and document extraction
  - `qrcode.react` for classroom join codes
- **Speech & Real-time**: Web Speech API (`SpeechRecognition`, `SpeechSynthesis`), `BroadcastChannel` API, `localStorage`
- **Authentication**: Optional Supabase Auth (`@supabase/supabase-js`) with preloaded offline personas

### Backend (`server/`)
- **Runtime**: Node.js with TypeScript 5.7 (`tsx` dev runner)
- **Web Server**: Express v4 (`express`, `cors`)
- **AI Integration**: Google Generative AI SDK (`@google/generative-ai` v0.24, Gemini 2.5 Flash)
- **Schema Validation**: Zod v3 (`zod`)
- **Environment**: Dotenv v16 (`dotenv`)

---

## 📋 Prerequisites

- **Node.js**: v18.0.0 or higher (v20+ or v22+ recommended)
- **npm**: v9.0.0 or higher
- **Supported Browsers**: Google Chrome or Microsoft Edge (required for the Web Speech Recognition API)

---

## 🚀 Setup & Installation

### 1. Clone the repository
```bash
git clone https://github.com/<username>/LectureLens.git
cd LectureLens
```

### 2. Configure Environment Variables
Copy the example environment configuration:
```bash
# In the project root:
cp .env.example server/.env
```

Edit `server/.env` to configure your keys:
```env
PORT=5000
NODE_ENV=development

# Optional: Add your Gemini API key from https://aistudio.google.com/
# If left blank, LectureLens automatically uses rich deterministic offline generators!
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash
```

> **Security Note:** The Gemini key in a `VITE_` variable is exposed to the browser. For public deployment, keep all AI API calls routed through the backend server or serverless functions.

### 3. Install Dependencies

Install root, client, and server dependencies:
```bash
# Install client dependencies
cd client
npm install

# Install server dependencies
cd ../server
npm install

# Return to root
cd ..
```

### 4. Run the Development Environment

Open two terminal windows:

**Terminal 1 — Backend API Server:**
```bash
cd server
npm run dev
# Server running at http://localhost:5000
```

**Terminal 2 — Frontend Application:**
```bash
cd client
npm run dev
# Client running at http://localhost:5173
```

Alternatively, run from root via npm scripts:
```bash
npm run dev:server
npm run dev:client
```

---

## 🎮 Running a Live Classroom Demo

1. Open **`http://localhost:5173`** in Google Chrome or Edge.
2. In the top navigation bar, toggle the persona to **Teacher** (*Prof. Meera Sen*).
3. Navigate to **Class Code & Roster** (`/app/class-code`) to view or generate the active 6-character class code (e.g., `A8XTEA`).
4. Navigate to **Live Studio & PPT Filter** (`/app/live-session`):
   - Click **Start Recording** and allow microphone access.
   - Speak a few sentences (try saying keywords like *"this is important"* or *"remember for the exam"*).
   - Advance slides to see live alignment.
5. In a **second browser tab or window** (same browser profile), navigate to `http://localhost:5173` and toggle the persona to **Student** (*Aarav Sharma*).
6. Go to **Join Class** (`/app/join-class`), enter the class code, and click **Join Class**.
7. Navigate to **Live Stream & Catch-Up** (`/app/live-session`):
   - Notice the amber **Late Join Catch-Up** panel appears automatically, highlighting the missed time window, an AI brief, teacher-flagged takeaways, and quick-check questions.
   - Continue speaking in the Teacher tab to watch the student live transcript update in real time without refreshing.

---

## 🌐 Browser & Environment Notes

- **Microphone Access**: The Web Speech API requires a secure context (`https://` or `http://localhost`). Ensure microphone permissions are granted.
- **Browser Compatibility**: Speech-to-text recording relies on the browser's native `webkitSpeechRecognition` engine, which is fully supported in **Google Chrome**, **Microsoft Edge**, and Chromium-based browsers.
- **Demo Mode Synchronization**: In local demo mode, cross-tab real-time sync between Teacher and Student uses the browser's `BroadcastChannel` API and `localStorage`. This enables instant multi-role testing across tabs on the same machine without requiring external WebSocket infrastructure.

---

## ⚠️ Known Limitations

- **Cross-Browser Demo Sync**: Because local demo synchronization relies on `BroadcastChannel`, real-time live events sync between tabs within the same browser instance, not across different machines or browsers without a centralized WebSocket / Supabase backend connected.
- **Speech Recognition Engine**: Web Speech API is dependent on the host operating system's and browser's speech recognition engine; audio quality and background noise can impact raw transcript fidelity before phonetic filtering.
- **Offline Mode**: When running without a `GEMINI_API_KEY`, all extraction, question generation, and remediation features gracefully fall back to deterministic, domain-specific rule-based engines.

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
