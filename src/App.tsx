import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { QuizProvider } from "@/contexts/QuizContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import LoadingSpinner from "@/components/LoadingSpinner";
import { lazy, Suspense } from "react";

// Lazy load all pages for code splitting
const Login = lazy(() => import("./pages/Login"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const Index = lazy(() => import("./pages/Index"));
const HowToPlay = lazy(() => import("./pages/HowToPlay"));
const CreateBattle = lazy(() => import("./pages/CreateBattle"));
const EditBattle = lazy(() => import("./pages/EditBattle"));
const JoinBattle = lazy(() => import("./pages/JoinBattle"));
const BattleDashboard = lazy(() => import("./pages/BattleDashboard"));
const PlayerLobby = lazy(() => import("./pages/PlayerLobby"));
const QuizControl = lazy(() => import("./pages/QuizControl"));
const PlayQuiz = lazy(() => import("./pages/PlayQuiz"));
const Leaderboard = lazy(() => import("./pages/Leaderboard"));
const Contest = lazy(() => import("./pages/Contest"));
const ContestJoin = lazy(() => import("./pages/ContestJoin"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Enhanced loading component with mobile optimization
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-background">
    <LoadingSpinner size="lg" text="Loading Festi Quiz..." />
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (renamed from cacheTime)
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <QuizProvider>
          <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter basename={import.meta.env.BASE_URL}>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/admin" element={
                  <ProtectedRoute requireAdmin>
                    <AdminDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/" element={
                  <ProtectedRoute>
                    <Index />
                  </ProtectedRoute>
                } />
                <Route path="/how-to-play" element={<HowToPlay />} />
                <Route path="/create" element={
                  <ProtectedRoute>
                    <CreateBattle />
                  </ProtectedRoute>
                } />
                <Route path="/edit-battle/:battleId" element={
                  <ProtectedRoute>
                    <EditBattle />
                  </ProtectedRoute>
                } />
                <Route path="/join" element={
                  <ProtectedRoute>
                    <JoinBattle />
                  </ProtectedRoute>
                } />
                <Route path="/battle/:battleId" element={
                  <ProtectedRoute>
                    <BattleDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/battle/:battleId/control" element={
                  <ProtectedRoute>
                    <QuizControl />
                  </ProtectedRoute>
                } />
                <Route path="/lobby" element={
                  <ProtectedRoute>
                    <PlayerLobby />
                  </ProtectedRoute>
                } />
                <Route path="/play" element={
                  <ProtectedRoute>
                    <PlayQuiz />
                  </ProtectedRoute>
                } />
                <Route path="/leaderboard/:battleId" element={
                  <ProtectedRoute>
                    <Leaderboard />
                  </ProtectedRoute>
                } />
                <Route path="/contest/:contestId" element={
                  <ProtectedRoute>
                    <Contest />
                  </ProtectedRoute>
                } />
                <Route path="/join-contest" element={
                  <ProtectedRoute>
                    <ContestJoin />
                  </ProtectedRoute>
                } />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
          </TooltipProvider>
        </QuizProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;