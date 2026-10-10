import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { LandingPage } from './pages/LandingPage';
import { AppLayout } from './components/AppLayout';
import { DashboardPage } from './pages/DashboardPage';
import { KnowledgeGraphPage } from './pages/KnowledgeGraphPage';
import { PracticeArenaPage } from './pages/PracticeArenaPage';
import { ReviewQueuePage } from './pages/ReviewQueuePage';
import { CatchUpNotesPage } from './pages/CatchUpNotesPage';
import { SyllabusIngestionPage } from './pages/SyllabusIngestionPage';
import { CohortAnalyticsPage } from './pages/CohortAnalyticsPage';

export const App: React.FC = () => {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Landing Page */}
          <Route path="/" element={<LandingPage />} />

          {/* Authenticated Application Views */}
          <Route path="/app" element={<AppLayout />}>
            <Route index element={<Navigate to="/app/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="graph" element={<KnowledgeGraphPage />} />
            <Route path="practice" element={<PracticeArenaPage />} />
            <Route path="review-queue" element={<ReviewQueuePage />} />
            <Route path="catchup" element={<CatchUpNotesPage />} />
            <Route path="syllabus" element={<SyllabusIngestionPage />} />
            <Route path="analytics" element={<CohortAnalyticsPage />} />
          </Route>

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
};

export default App;
