import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuiz, Question, QuestionType } from '@/contexts/QuizContext';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, Copy, Users, Plus, Play, Settings } from 'lucide-react';
import { toast } from 'sonner';
import QuestionManager from '@/components/quiz/QuestionManager';
import PlayerList from '@/components/quiz/PlayerList';

const BattleDashboard = () => {
  const { battleId } = useParams();
  const navigate = useNavigate();
  const { currentBattle, players, publishBattle, startQuiz, loadBattle } = useQuiz();
  const { currentUser, hasPermission } = useAuth();

  // Load the battle when component mounts
  useEffect(() => {
    if (battleId) {
      loadBattle(battleId);
    }
  }, [battleId, loadBattle]);

  // Check if current user is the battle owner or admin
  const isBattleOwner = currentBattle?.ownerId === currentUser?.userId;
  const isAdmin = hasPermission('canManageUsers');
  const canManageBattle = isBattleOwner || isAdmin;

  const copyBattleCode = () => {
    if (currentBattle) {
      navigator.clipboard.writeText(currentBattle.code);
      toast.success('Battle code copied to clipboard!');
    }
  };

  const handlePublishBattle = async () => {
    if (!battleId) return;
    try {
      await publishBattle(battleId);
      toast.success('Battle published! Players can now join.');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to publish battle';
      toast.error(errorMessage);
    }
  };

  const handleStartQuiz = async () => {
    if (!battleId) return;
    if (players?.filter(p => p?.isReady)?.length === 0) {
      toast.error('Wait for at least one player to be ready');
      return;
    }
    
    try {
      await startQuiz(battleId);
      toast.success('Quiz started!');
      navigate(`/battle/${battleId}/control`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to start quiz';
      toast.error(errorMessage);
    }
  };

  // Redirect to leaderboard when quiz is completed
  useEffect(() => {
    if (currentBattle?.isCompleted) {
      navigate(`/leaderboard/${battleId}`);
    }
  }, [currentBattle, battleId, navigate]);

  if (!currentBattle) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="pt-6">
            <p>Battle not found</p>
            <Button onClick={() => navigate('/')} className="mt-4">
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Security check: Only battle owners and admins can manage the battle
  if (!canManageBattle) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="pt-6 text-center space-y-4">
            <p className="text-lg font-semibold">Access Denied</p>
            <p className="text-muted-foreground">
              You do not have permission to manage this battle. Only the battle owner can access battle controls.
            </p>
            <div className="flex gap-2 justify-center">
              <Button onClick={() => navigate('/')} variant="outline">
                Go Home
              </Button>
              <Button onClick={() => navigate('/join')}>
                Join a Battle
              </Button>
            </div>
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
          
          {currentBattle.isPublished && !currentBattle.isStarted && (
            <Button 
              onClick={handleStartQuiz} 
              size="lg"
              disabled={players?.filter(p => p?.isReady)?.length === 0}
            >
              <Play className="w-4 h-4 mr-2" />
              Start Quiz
              {players?.filter(p => p?.isReady)?.length === 0 && (
                <span className="ml-2 text-xs opacity-75">
                  (Need at least 1 ready player)
                </span>
              )}
            </Button>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-3 mb-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-2xl">{currentBattle.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Battle Code</p>
                  <p className="text-3xl font-mono font-bold tracking-wider">
                    {currentBattle.code}
                  </p>
                </div>
                <Button onClick={copyBattleCode} variant="outline">
                  <Copy className="w-4 h-4 mr-2" />
                  Copy
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Questions</p>
                  <p className="text-2xl font-bold">{currentBattle.questions?.length || 0}</p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Max Players</p>
                  <p className="text-2xl font-bold">{currentBattle.maxPlayers || 0}</p>
                </div>
              </div>

              {!currentBattle.isPublished && (
                <Button 
                  onClick={handlePublishBattle} 
                  className="w-full"
                  disabled={!currentBattle.questions || currentBattle.questions.length === 0}
                >
                  Publish Battle
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Players ({players?.length || 0}/{currentBattle.maxPlayers || 0})
                {currentBattle.isPublished && (
                  <span className="text-sm text-muted-foreground">
                    • {players?.filter(p => p?.isReady)?.length || 0} ready
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <PlayerList players={players} showReady={currentBattle.isPublished} />
              {currentBattle.isPublished && (
                <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Ready Players:</span>
                    <span className="font-medium">
                      {players?.filter(p => p?.isReady)?.length || 0} / {players?.length || 0}
                    </span>
                  </div>
                  {players?.filter(p => p?.isReady)?.length === 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Waiting for players to mark themselves ready...
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Manage Questions</CardTitle>
          </CardHeader>
          <CardContent>
            <QuestionManager 
              battleId={battleId!} 
              questions={currentBattle.questions || []}
              canEdit={!currentBattle.isStarted}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BattleDashboard;
