import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { QuizProvider } from "@/contexts/QuizContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import Index from "./pages/Index";
import HowToPlay from "./pages/HowToPlay";
import CreateBattle from "./pages/CreateBattle";
import EditBattle from "./pages/EditBattle";
import JoinBattle from "./pages/JoinBattle";
import BattleDashboard from "./pages/BattleDashboard";
import PlayerLobby from "./pages/PlayerLobby";
import QuizControl from "./pages/QuizControl";
import PlayQuiz from "./pages/PlayQuiz";
import Leaderboard from "./pages/Leaderboard";
import Contest from "./pages/Contest";
import ContestJoin from "./pages/ContestJoin";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <QuizProvider>
          <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter basename={import.meta.env.BASE_URL}>
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
          </BrowserRouter>
          </TooltipProvider>
        </QuizProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
