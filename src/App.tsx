import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { QuizProvider } from "@/contexts/QuizContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import Index from "./pages/Index";
import CreateRoom from "./pages/CreateRoom";
import EditRoom from "./pages/EditRoom";
import JoinRoom from "./pages/JoinRoom";
import RoomDashboard from "./pages/RoomDashboard";
import PlayerLobby from "./pages/PlayerLobby";
import QuizControl from "./pages/QuizControl";
import PlayQuiz from "./pages/PlayQuiz";
import Leaderboard from "./pages/Leaderboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
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
              <Route path="/create" element={
                <ProtectedRoute>
                  <CreateRoom />
                </ProtectedRoute>
              } />
              <Route path="/edit-room/:roomId" element={
                <ProtectedRoute>
                  <EditRoom />
                </ProtectedRoute>
              } />
              <Route path="/join" element={
                <ProtectedRoute>
                  <JoinRoom />
                </ProtectedRoute>
              } />
              <Route path="/room/:roomId" element={
                <ProtectedRoute>
                  <RoomDashboard />
                </ProtectedRoute>
              } />
              <Route path="/room/:roomId/control" element={
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
              <Route path="/leaderboard/:roomId" element={
                <ProtectedRoute>
                  <Leaderboard />
                </ProtectedRoute>
              } />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </QuizProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
