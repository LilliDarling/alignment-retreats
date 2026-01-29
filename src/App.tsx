import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { AnalyticsProvider } from "@/components/AnalyticsProvider";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ScrollToTop } from "@/components/ScrollToTop";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import ComingSoon from "./pages/ComingSoon";
import Cooperative from "./pages/Cooperative";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import AttendeeSignup from "./pages/AttendeeSignup";
import ThankYou from "./pages/ThankYou";
import OnboardingWizard from "./pages/OnboardingWizard";
import Dashboard from "./pages/Dashboard";
import HostDashboard from "./pages/HostDashboard";
import CohostDashboard from "./pages/CohostDashboard";
import LandownerDashboard from "./pages/LandownerDashboard";
import StaffDashboard from "./pages/StaffDashboard";
import AttendeeDashboard from "./pages/AttendeeDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import CreateRetreat from "./pages/CreateRetreat";
import SubmitRetreat from "./pages/SubmitRetreat";
import BrowseRetreats from "./pages/BrowseRetreats";
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
              <Route path="/signup" element={<Signup />} />
              <Route path="/signup/attendee" element={<AttendeeSignup />} />
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
              <Route
                path="/dashboard/host"
                element={
                  <ProtectedRoute allowedRoles={['host']}>
                    <HostDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/cohost"
                element={
                  <ProtectedRoute allowedRoles={['cohost']}>
                    <CohostDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/landowner"
                element={
                  <ProtectedRoute allowedRoles={['landowner']}>
                    <LandownerDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/staff"
                element={
                  <ProtectedRoute allowedRoles={['staff']}>
                    <StaffDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/attendee"
                element={
                  <ProtectedRoute allowedRoles={['attendee']}>
                    <AttendeeDashboard />
                  </ProtectedRoute>
                }
              />
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
);

export default App;