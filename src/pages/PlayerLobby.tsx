import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuiz } from '@/contexts/QuizContext';
import { Users, Loader2, CheckCircle2, Circle } from 'lucide-react';
import { toast } from 'sonner';
import PlayerList from '@/components/quiz/PlayerList';

const PlayerLobby = () => {
  const navigate = useNavigate();
  const { currentRoom, players, setPlayerReady } = useQuiz();
  const [currentPlayerId, setCurrentPlayerId] = useState<string | null>(null);
  const [isTogglingReady, setIsTogglingReady] = useState(false);

  // Get current player ID from localStorage
  useEffect(() => {
    const storedPlayerId = localStorage.getItem('current_player_id');
    setCurrentPlayerId(storedPlayerId);
  }, []);

  const currentPlayer = players?.find(p => p?.id === currentPlayerId);

  useEffect(() => {
    // Listen for quiz start
    if (currentRoom?.isStarted) {
      navigate('/play');
    }
    
    // Listen for quiz completion
    if (currentRoom?.isCompleted) {
      const roomId = localStorage.getItem('current_room_id');
      if (roomId) {
        navigate(`/leaderboard/${roomId}`);
      } else {
        navigate('/');
      }
    }
    
    // Listen for mid-quiz leaderboard display
    if (currentRoom?.showLeaderboard && currentRoom?.isStarted && !currentRoom?.isCompleted) {
      const roomId = localStorage.getItem('current_room_id');
      if (roomId) {
        navigate(`/leaderboard/${roomId}`);
      }
    }
    
    // Listen for leaderboard being hidden (return to lobby)
    if (!currentRoom?.showLeaderboard && currentRoom?.isStarted && !currentRoom?.isCompleted) {
      // Check if we're currently on the leaderboard page
      if (window.location.pathname.includes('/leaderboard/')) {
        navigate('/lobby');
      }
    }
  }, [currentRoom, navigate]);

  const handleToggleReady = async () => {
    if (!currentPlayerId || !currentPlayer) {
      toast.error('Player not found');
      return;
    }

    setIsTogglingReady(true);
    try {
      await setPlayerReady(currentPlayerId, !currentPlayer.isReady);
      toast.success(currentPlayer.isReady ? 'Marked as not ready' : 'Marked as ready!');
    } catch (error) {
      toast.error('Failed to update ready status');
      console.error(error);
    } finally {
      setIsTogglingReady(false);
    }
  };

  if (!currentRoom) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="pt-6">
            <p>Room not found</p>
            <Button onClick={() => navigate('/')} className="mt-4">
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 p-4 sm:p-6 lg:p-8">
      <div className="max-w-3xl mx-auto">
        <Card className="mb-6">
          <CardHeader className="text-center">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center mb-4">
              <Users className="w-8 h-8 text-primary-foreground" />
            </div>
            <CardTitle className="text-3xl">{currentRoom.name}</CardTitle>
            <div className="flex items-center justify-center gap-2 mt-4">
              <p className="text-sm text-muted-foreground">Room Code:</p>
              <p className="text-2xl font-mono font-bold tracking-wider">{currentRoom.code}</p>
            </div>
          </CardHeader>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Players in Lobby ({players?.length || 0}/{currentRoom.maxPlayers || 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PlayerList players={players} showReady />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 text-center space-y-4">
            {currentPlayer ? (
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-2">
                  <div className="flex items-center gap-2">
                    {currentPlayer.isReady ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    ) : (
                      <Circle className="w-5 h-5 text-muted-foreground" />
                    )}
                    <p className="text-sm font-medium">
                      {currentPlayer.isReady ? 'You are ready!' : 'You are not ready'}
                    </p>
                  </div>
                </div>
                
                <Button
                  onClick={handleToggleReady}
                  disabled={isTogglingReady}
                  variant={currentPlayer.isReady ? "outline" : "default"}
                  className="w-full max-w-xs"
                >
                  {isTogglingReady ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : currentPlayer.isReady ? (
                    <>
                      <Circle className="w-4 h-4 mr-2" />
                      Mark as Not Ready
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Mark as Ready
                    </>
                  )}
                </Button>
                
                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <p>Waiting for host to start the quiz...</p>
                </div>
                <p className="text-sm text-muted-foreground">
                  Make sure you're ready! The quiz will start soon.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <p>Loading player information...</p>
                </div>
                <p className="text-sm text-muted-foreground">
                  Make sure you're ready! The quiz will start soon.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PlayerLobby;
