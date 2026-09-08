import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { JudgeAuthProvider } from "./context/JudgeAuthContext";

import { ProtectedRoute } from "./components/ProtectedRoute";
import { JudgeProtectedRoute } from "./components/JudgeProtectedRoute";

import { LandingPage } from "./pages/LandingPage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { DashboardPage } from "./pages/DashboardPage";
import { NewEventPage } from "./pages/NewEventPage";
import { EventManagementPage } from "./pages/EventManagementPage";
import { PresentationPage } from "./pages/PresentationPage";
import { JoinIndexPage } from "./pages/JoinIndexPage";
import { JoinEventPage } from "./pages/JoinEventPage";
import { ParticipantEventPage } from "./pages/ParticipantEventPage";

// Judging Module Pages
import { JudgingAdminPage } from "./pages/judging/JudgingAdminPage";
import { JudgeLoginPage } from "./pages/judge/JudgeLoginPage";
import { JudgeDashboardPage } from "./pages/judge/JudgeDashboardPage";
import { JudgeEvaluationPage } from "./pages/judge/JudgeEvaluationPage";

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <JudgeAuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Protected Admin Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route path="/dashboard/events" element={<Navigate to="/dashboard" replace />} />
            <Route
              path="/dashboard/events/new"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <NewEventPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/events/:eventId"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <EventManagementPage />
                </ProtectedRoute>
              }
            />

            {/* Admin Judging & Evaluation Module */}
            <Route
              path="/dashboard/judging"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <JudgingAdminPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/judging"
              element={<Navigate to="/dashboard/judging" replace />}
            />

            {/* Judge Portal Routes */}
            <Route path="/judge/login" element={<JudgeLoginPage />} />
            <Route
              path="/judge/dashboard"
              element={
                <JudgeProtectedRoute>
                  <JudgeDashboardPage />
                </JudgeProtectedRoute>
              }
            />
            <Route
              path="/judge/evaluate/:teamId"
              element={
                <JudgeProtectedRoute>
                  <JudgeEvaluationPage />
                </JudgeProtectedRoute>
              }
            />
            <Route path="/judge" element={<Navigate to="/judge/dashboard" replace />} />

            {/* 16:9 Presentation Mode */}
            <Route path="/events/:eventId/present" element={<PresentationPage />} />

            {/* Participant Join Flow */}
            <Route path="/join" element={<JoinIndexPage />} />
            <Route path="/join/:code" element={<JoinEventPage />} />

            {/* Participant Interface */}
            <Route path="/event/:eventId" element={<ParticipantEventPage />} />
            <Route path="/event/:eventId/poll/:activityId" element={<ParticipantEventPage />} />
            <Route path="/event/:eventId/quiz/:activityId" element={<ParticipantEventPage />} />

            {/* Catch all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </JudgeAuthProvider>
    </AuthProvider>
  );
};
