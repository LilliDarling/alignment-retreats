import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { HelmetProvider } from "react-helmet-async";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { AnalyticsProvider } from "@/components/AnalyticsProvider";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ScrollToTop } from "@/components/ScrollToTop";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Cooperative from "./pages/Cooperative";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import ThankYou from "./pages/ThankYou";
import OnboardingWizard from "./pages/OnboardingWizard";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/AdminDashboard";
import CreateRetreat from "./pages/CreateRetreat";
import SubmitRetreat from "./pages/SubmitRetreat";
import BrowseRetreats from "./pages/BrowseRetreats";
import BrowseOpportunities from "./pages/BrowseOpportunities";
import RetreatDetail from "./pages/RetreatDetail";
import Profile from "./pages/Profile";
import EditProfile from "./pages/EditProfile";
import Directory from "./pages/Directory";
import Messages from "./pages/Messages";
import BuildRetreat from "./pages/BuildRetreat";
import GetStarted from "./pages/GetStarted";
import AuthCallback from "./pages/AuthCallback";

import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
  <QueryClientProvider client={queryClient}>
    <ErrorBoundary>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          <AuthProvider>
            <AnalyticsProvider>
              <Routes>
          <Route path="/" element={<Landing />} />
              <Route path="/cooperative" element={<Cooperative />} />
              <Route path="/login" element={<Login />} />
              {/* All signup paths redirect to unified get-started flow */}
              <Route path="/signup" element={<Navigate to="/get-started" replace />} />
              <Route path="/signup/attendee" element={<Navigate to="/get-started" replace />} />
              <Route path="/thank-you" element={<ThankYou />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route
                path="/onboarding"
                element={
                  <ProtectedRoute>
                    <OnboardingWizard />
                  </ProtectedRoute>
                }
              />
              <Route path="/retreats/browse" element={<BrowseRetreats />} />
              <Route
                path="/opportunities"
                element={
                  <ProtectedRoute>
                    <BrowseOpportunities />
                  </ProtectedRoute>
                }
              />
              <Route path="/build-retreat" element={<BuildRetreat />} />
              <Route path="/get-started" element={<GetStarted />} />
              <Route 
                path="/directory" 
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <Directory />
                  </ProtectedRoute>
                } 
              />
              <Route path="/retreat/:id" element={<RetreatDetail />} />
              <Route path="/profile/:userId" element={<Profile />} />
              <Route
                path="/profile/edit"
                element={
                  <ProtectedRoute>
                    <EditProfile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/messages"
                element={
                  <ProtectedRoute>
                    <Messages />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              {/* Legacy role-specific dashboard URLs redirect to unified dashboard */}
              <Route path="/dashboard/host" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard/cohost" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard/landowner" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard/staff" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard/attendee" element={<Navigate to="/dashboard" replace />} />
              <Route
                path="/retreats/create"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <CreateRetreat />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/retreats/submit"
                element={
                  <ProtectedRoute>
                    <SubmitRetreat />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
            </AnalyticsProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ErrorBoundary>
  </QueryClientProvider>
  </HelmetProvider>
);

export default App;