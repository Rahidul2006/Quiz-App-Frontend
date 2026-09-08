import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";

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

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Admin Dashboard */}
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/dashboard/events" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard/events/new" element={<NewEventPage />} />
          <Route path="/dashboard/events/:eventId" element={<EventManagementPage />} />

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
    </AuthProvider>
  );
};
