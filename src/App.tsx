import { lazy, Suspense } from "react";
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

const Landing = lazy(() => import("./pages/Landing"));
const Cooperative = lazy(() => import("./pages/Cooperative"));
const Login = lazy(() => import("./pages/Login"));
const ThankYou = lazy(() => import("./pages/ThankYou"));
const OnboardingWizard = lazy(() => import("./pages/OnboardingWizard"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const CreateRetreat = lazy(() => import("./pages/CreateRetreat"));
const SubmitRetreat = lazy(() => import("./pages/SubmitRetreat"));
const BrowseRetreats = lazy(() => import("./pages/BrowseRetreats"));
const BrowseOpportunities = lazy(() => import("./pages/BrowseOpportunities"));
const RetreatDetail = lazy(() => import("./pages/RetreatDetail"));
const SubmitVenue = lazy(() => import("./pages/SubmitVenue"));
const BrowseVenues = lazy(() => import("./pages/BrowseVenues"));
const VenueDetail = lazy(() => import("./pages/VenueDetail"));
const Profile = lazy(() => import("./pages/Profile"));
const EditProfile = lazy(() => import("./pages/EditProfile"));
const ProfileCompletePage = lazy(() => import("./pages/ProfileCompletePage"));
const Directory = lazy(() => import("./pages/Directory"));
const Messages = lazy(() => import("./pages/Messages"));
const BuildRetreat = lazy(() => import("./pages/BuildRetreat"));
const GetStarted = lazy(() => import("./pages/GetStarted"));
const Donate = lazy(() => import("./pages/Donate"));
const AuthCallback = lazy(() => import("./pages/AuthCallback"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

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
              <Suspense fallback={<div className="min-h-screen bg-background" />}>
              <Routes>
          <Route path="/" element={<Landing />} />
              <Route path="/cooperative" element={<Cooperative />} />
              <Route path="/login" element={<Login />} />
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
              <Route path="/venues/browse" element={<BrowseVenues />} />
              <Route path="/venue/:id" element={<VenueDetail />} />
              <Route
                path="/venues/submit"
                element={
                  <ProtectedRoute>
                    <SubmitVenue />
                  </ProtectedRoute>
                }
              />
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
                path="/donate"
                element={
                  <ProtectedRoute>
                    <Donate />
                  </ProtectedRoute>
                }
              />
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
                path="/profile/complete"
                element={
                  <ProtectedRoute>
                    <ProfileCompletePage />
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
              </Suspense>
            </AnalyticsProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ErrorBoundary>
  </QueryClientProvider>
  </HelmetProvider>
);

export default App;