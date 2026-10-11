import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { ClassProvider } from './context/ClassContext';
import { useApp } from './context/AppContext';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { AppLayout } from './components/AppLayout';
import { DashboardPage } from './pages/DashboardPage';
import { LiveLectureStudioPage } from './pages/LiveLectureStudioPage';
import { KnowledgeGraphPage } from './pages/KnowledgeGraphPage';
import { PracticeArenaPage } from './pages/PracticeArenaPage';
import { ReviewQueuePage } from './pages/ReviewQueuePage';
import { SyllabusIngestionPage } from './pages/SyllabusIngestionPage';
import { DoubtsPortalPage } from './pages/DoubtsPortalPage';
import { ClassCodePage } from './pages/ClassCodePage';
import { JoinClassPage } from './pages/JoinClassPage';
import { RecallQPage } from './pages/RecallQPage';

/**
 * ClassProviderWrapper reads currentUser from AppContext (already mounted)
 * and passes it down to ClassProvider so ClassContext knows who the user is.
 */
const ClassProviderWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useApp();
  return (
    <ClassProvider
      currentUserId={currentUser.id ?? 'unknown'}
      currentUserName={currentUser.name}
      currentUserRole={currentUser.role}
    >
      {children}
    </ClassProvider>
  );
};

export const App: React.FC = () => {
  return (
    <AppProvider>
      <BrowserRouter>
        <ClassProviderWrapper>
          <Routes>
            {/* Public Landing & Auth Pages */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />

            {/* Standalone join page — outside AppLayout so students can land here */}
            <Route path="/join" element={<JoinClassPage />} />

            {/* Authenticated Application Views */}
            <Route path="/app" element={<AppLayout />}>
              <Route index element={<Navigate to="/app/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="live-session" element={<LiveLectureStudioPage />} />
              <Route path="graph" element={<KnowledgeGraphPage />} />
              <Route path="practice" element={<PracticeArenaPage />} />
              <Route path="review-queue" element={<ReviewQueuePage />} />
              <Route path="catchup" element={<Navigate to="/app/dashboard" replace />} />
              <Route path="doubts" element={<DoubtsPortalPage />} />
              <Route path="syllabus" element={<SyllabusIngestionPage />} />
              <Route path="analytics" element={<Navigate to="/app/dashboard" replace />} />
              {/* New: Class Code pages */}
              <Route path="class-code" element={<ClassCodePage />} />
              <Route path="join-class" element={<JoinClassPage />} />
              {/* New: RecallQ page */}
              <Route path="recallq" element={<RecallQPage />} />
            </Route>

            {/* Catch-all redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ClassProviderWrapper>
      </BrowserRouter>
    </AppProvider>
  );
};

export default App;
