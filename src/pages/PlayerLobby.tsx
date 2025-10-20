import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuiz } from '@/contexts/QuizContext';
import { Users, Loader2 } from 'lucide-react';
import PlayerList from '@/components/quiz/PlayerList';

const PlayerLobby = () => {
  const navigate = useNavigate();
  const { currentRoom, players } = useQuiz();
  const [localPlayerId] = useState(`player_${Date.now()}`); // In real app, get from auth/context
  const currentPlayer = players.find(p => p.id === localPlayerId);

  useEffect(() => {
    // Listen for quiz start
    if (currentRoom?.isStarted) {
      navigate('/play');
    }
  }, [currentRoom, navigate]);

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
              Players in Lobby ({players.length}/{currentRoom.maxPlayers})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PlayerList players={players} showReady />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 text-center space-y-4">
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin" />
              <p>Waiting for host to start the quiz...</p>
            </div>
            <p className="text-sm text-muted-foreground">
              Make sure you're ready! The quiz will start soon.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PlayerLobby;
