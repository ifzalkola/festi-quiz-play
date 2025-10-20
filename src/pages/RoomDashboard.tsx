import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuiz, Question, QuestionType } from '@/contexts/QuizContext';
import { ArrowLeft, Copy, Users, Plus, Play, Settings } from 'lucide-react';
import { toast } from 'sonner';
import QuestionManager from '@/components/quiz/QuestionManager';
import PlayerList from '@/components/quiz/PlayerList';

const RoomDashboard = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { currentRoom, players, publishRoom, startQuiz } = useQuiz();

  const copyRoomCode = () => {
    if (currentRoom) {
      navigator.clipboard.writeText(currentRoom.code);
      toast.success('Room code copied to clipboard!');
    }
  };

  const handlePublishRoom = async () => {
    if (!roomId) return;
    try {
      await publishRoom(roomId);
      toast.success('Room published! Players can now join.');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to publish room';
      toast.error(errorMessage);
    }
  };

  const handleStartQuiz = async () => {
    if (!roomId) return;
    if (players.filter(p => p.isReady).length === 0) {
      toast.error('Wait for at least one player to be ready');
      return;
    }
    
    try {
      await startQuiz(roomId);
      toast.success('Quiz started!');
      navigate(`/room/${roomId}/control`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to start quiz';
      toast.error(errorMessage);
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
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={() => navigate('/')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          
          {currentRoom.isPublished && !currentRoom.isStarted && (
            <Button onClick={handleStartQuiz} size="lg">
              <Play className="w-4 h-4 mr-2" />
              Start Quiz
            </Button>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-3 mb-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-2xl">{currentRoom.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Room Code</p>
                  <p className="text-3xl font-mono font-bold tracking-wider">
                    {currentRoom.code}
                  </p>
                </div>
                <Button onClick={copyRoomCode} variant="outline">
                  <Copy className="w-4 h-4 mr-2" />
                  Copy
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Questions</p>
                  <p className="text-2xl font-bold">{currentRoom.questions.length}</p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Max Players</p>
                  <p className="text-2xl font-bold">{currentRoom.maxPlayers}</p>
                </div>
              </div>

              {!currentRoom.isPublished && (
                <Button 
                  onClick={handlePublishRoom} 
                  className="w-full"
                  disabled={currentRoom.questions.length === 0}
                >
                  Publish Room
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Players ({players.length}/{currentRoom.maxPlayers})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <PlayerList players={players} showReady={currentRoom.isPublished} />
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Manage Questions</CardTitle>
          </CardHeader>
          <CardContent>
            <QuestionManager 
              roomId={roomId!} 
              questions={currentRoom.questions}
              canEdit={!currentRoom.isStarted}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RoomDashboard;
