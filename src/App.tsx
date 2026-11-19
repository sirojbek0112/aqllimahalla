import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LangProvider } from './context/LangContext';
import { PublicLayout } from './layouts/PublicLayout';

import { HomePage } from './pages/HomePage';
import { NewsPage } from './pages/NewsPage';
import { NewsDetailPage } from './pages/NewsDetailPage';
import { AnnouncementsPage } from './pages/AnnouncementsPage';
import { EventsPage } from './pages/EventsPage';
import { AppealsPage } from './pages/AppealsPage';
import { AppealDetailPage } from './pages/AppealDetailPage';
import { AboutPage } from './pages/AboutPage';
import { PollsPage } from './pages/PollsPage';
import { GalleryPage } from './pages/GalleryPage';
import { SearchPage } from './pages/SearchPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { CabinetPage } from './citizen/CabinetPage';
import { AuthPortal } from './components/AuthPortal';

import { AdminDashboardPage } from './admin/AdminDashboardPage';
import { AdminNewsPage } from './admin/AdminNewsPage';
import { AdminAnnouncementsPage } from './admin/AdminAnnouncementsPage';
import { AdminAppealsPage } from './admin/AdminAppealsPage';
import { AdminEventsPage } from './admin/AdminEventsPage';
import { AdminCitizensPage } from './admin/AdminCitizensPage';
import { AdminPollsPage } from './admin/AdminPollsPage';
import { AdminGalleryPage } from './admin/AdminGalleryPage';
import { AdminReportsPage } from './admin/AdminReportsPage';
import { AdminSettingsPage } from './admin/AdminSettingsPage';

function ProtectedCitizen({ children }: { children: React.ReactNode }) {
  const { user, loading, isStaff } = useAuth();
  if (loading) return <div className="p-12 text-center text-sm text-[#718096]">Yuklanmoqda...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (!isStaff && !user.profile_completed) return <Navigate to="/complete-profile" replace />;
  return <>{children}</>;
}

function ProtectedStaff({ children }: { children: React.ReactNode }) {
  const { user, loading, isStaff } = useAuth();
  if (loading) return <div className="p-12 text-center text-sm text-[#718096]">Yuklanmoqda...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (!isStaff) return <Navigate to="/cabinet" replace />;
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  return <PublicLayout>{children}</PublicLayout>;
}

export default function App() {
  return (
    <LangProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<PublicRoute><HomePage /></PublicRoute>} />
            <Route path="/news" element={<PublicRoute><NewsPage /></PublicRoute>} />
            <Route path="/news/:id" element={<PublicRoute><NewsDetailPage /></PublicRoute>} />
            <Route path="/announcements" element={<PublicRoute><AnnouncementsPage /></PublicRoute>} />
            <Route path="/events" element={<PublicRoute><EventsPage /></PublicRoute>} />
            <Route path="/appeals" element={<PublicRoute><AppealsPage /></PublicRoute>} />
            <Route
              path="/appeals/:id"
              element={
                <PublicRoute>
                  <ProtectedCitizen>
                    <AppealDetailPage />
                  </ProtectedCitizen>
                </PublicRoute>
              }
            />
            <Route path="/about" element={<PublicRoute><AboutPage /></PublicRoute>} />
            <Route path="/polls" element={<PublicRoute><PollsPage /></PublicRoute>} />
            <Route path="/gallery" element={<PublicRoute><GalleryPage /></PublicRoute>} />
            <Route path="/search" element={<PublicRoute><SearchPage /></PublicRoute>} />
            <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
            <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
            <Route path="/complete-profile" element={<PublicRoute><AuthPortal initialMode="register" /></PublicRoute>} />

            {/* Citizen Cabinet */}
            <Route
              path="/cabinet"
              element={
                <PublicRoute>
                  <ProtectedCitizen>
                    <CabinetPage />
                  </ProtectedCitizen>
                </PublicRoute>
              }
            />

            {/* Admin Panel Routes */}
            <Route path="/admin" element={<ProtectedStaff><AdminDashboardPage /></ProtectedStaff>} />
            <Route path="/admin/news" element={<ProtectedStaff><AdminNewsPage /></ProtectedStaff>} />
            <Route path="/admin/announcements" element={<ProtectedStaff><AdminAnnouncementsPage /></ProtectedStaff>} />
            <Route path="/admin/appeals" element={<ProtectedStaff><AdminAppealsPage /></ProtectedStaff>} />
            <Route path="/admin/events" element={<ProtectedStaff><AdminEventsPage /></ProtectedStaff>} />
            <Route path="/admin/citizens" element={<ProtectedStaff><AdminCitizensPage /></ProtectedStaff>} />
            <Route path="/admin/polls" element={<ProtectedStaff><AdminPollsPage /></ProtectedStaff>} />
            <Route path="/admin/gallery" element={<ProtectedStaff><AdminGalleryPage /></ProtectedStaff>} />
            <Route path="/admin/reports" element={<ProtectedStaff><AdminReportsPage /></ProtectedStaff>} />
            <Route path="/admin/settings" element={<ProtectedStaff><AdminSettingsPage /></ProtectedStaff>} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </LangProvider>
  );
}
