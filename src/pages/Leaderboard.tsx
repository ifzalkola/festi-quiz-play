import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuiz } from '@/contexts/QuizContext';
import { Trophy, Medal, Award, Crown, Home, Share2, Copy } from 'lucide-react';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';

const Leaderboard = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { currentRoom, players } = useQuiz();
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    if (!hasAnimated && players.length > 0) {
      // Trigger confetti for top 3
      setTimeout(() => {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      }, 500);
      setHasAnimated(true);
    }
  }, [players, hasAnimated]);

  if (!currentRoom) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="pt-6 text-center space-y-4">
            <p>Room not found</p>
            <Button onClick={() => navigate('/')}>
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const sortedPlayers = [...(players || [])]
    .filter(p => p?.isOnline)
    .sort((a, b) => (b?.score || 0) - (a?.score || 0));

  const winner = sortedPlayers?.[0];
  const topThree = sortedPlayers?.slice(0, 3) || [];
  const rest = sortedPlayers?.slice(3) || [];

  const shareResults = () => {
    if (!currentRoom || !winner) return;
    
    const text = `🎉 Quiz Results for "${currentRoom.name}"\n\n` +
      `🏆 Winner: ${winner?.name} (${winner?.score} points)\n\n` +
      `Top 3:\n` +
      topThree.map((p, i) => `${i + 1}. ${p?.name} - ${p?.score} points`).join('\n');
    
    if (navigator.share) {
      navigator.share({
        title: 'Quiz Results',
        text: text
      });
    } else {
      navigator.clipboard.writeText(text);
      toast.success('Results copied to clipboard!');
    }
  };

  const copyRoomCode = () => {
    navigator.clipboard.writeText(currentRoom.code);
    toast.success('Room code copied!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-muted/20 to-background p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4 animate-in fade-in slide-in-from-top duration-700">
          <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center animate-bounce">
            <Trophy className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold">
            Quiz Complete! 🎉
          </h1>
          <p className="text-xl text-muted-foreground">
            {currentRoom.name}
          </p>
          <div className="flex items-center justify-center gap-4">
            <Button onClick={shareResults} variant="outline">
              <Share2 className="w-4 h-4 mr-2" />
              Share Results
            </Button>
            <Button onClick={() => navigate('/')} variant="outline">
              <Home className="w-4 h-4 mr-2" />
              Home
            </Button>
          </div>
        </div>

        {/* Winner Spotlight */}
        {winner && (
          <Card className="border-2 border-yellow-500 bg-gradient-to-br from-yellow-500/10 via-background to-orange-500/10 animate-in zoom-in duration-700 delay-300">
            <CardContent className="pt-8 pb-8 text-center space-y-4">
              <Crown className="w-16 h-16 text-yellow-500 mx-auto animate-pulse" />
              <div className="space-y-2">
                <h2 className="text-3xl font-bold">🏆 Champion 🏆</h2>
                <p className="text-4xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                  {winner.name}
                </p>
                <p className="text-5xl font-black text-yellow-500">
                  {winner.score} <span className="text-2xl">points</span>
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Top 3 Podium */}
        {topThree.length >= 2 && (
          <div className="grid grid-cols-3 gap-4 items-end animate-in fade-in slide-in-from-bottom duration-700 delay-500">
            {/* 2nd Place */}
            {topThree[1] && (
              <Card className="border-gray-300 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
                <CardContent className="pt-6 pb-6 text-center space-y-3">
                  <div className="w-16 h-16 mx-auto rounded-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center">
                    <Medal className="w-8 h-8 text-gray-600 dark:text-gray-300" />
                  </div>
                  <div className="text-4xl font-bold">2nd</div>
                  <p className="font-semibold truncate">{topThree[1].name}</p>
                  <p className="text-2xl font-bold text-gray-600 dark:text-gray-300">
                    {topThree[1].score}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* 1st Place */}
            <Card className="border-2 border-yellow-400 bg-gradient-to-br from-yellow-100 to-yellow-200 dark:from-yellow-900 dark:to-orange-900 transform scale-110">
              <CardContent className="pt-8 pb-8 text-center space-y-3">
                <div className="w-20 h-20 mx-auto rounded-full bg-yellow-400 flex items-center justify-center">
                  <Crown className="w-10 h-10 text-yellow-900" />
                </div>
                <div className="text-5xl font-bold">1st</div>
                <p className="font-bold truncate text-lg">{topThree[0].name}</p>
                <p className="text-3xl font-black text-yellow-600 dark:text-yellow-400">
                  {topThree[0].score}
                </p>
              </CardContent>
            </Card>

            {/* 3rd Place */}
            {topThree[2] && (
              <Card className="border-orange-300 bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900 dark:to-orange-950">
                <CardContent className="pt-6 pb-6 text-center space-y-3">
                  <div className="w-16 h-16 mx-auto rounded-full bg-orange-300 dark:bg-orange-700 flex items-center justify-center">
                    <Award className="w-8 h-8 text-orange-600 dark:text-orange-300" />
                  </div>
                  <div className="text-4xl font-bold">3rd</div>
                  <p className="font-semibold truncate">{topThree[2].name}</p>
                  <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {topThree[2].score}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Full Leaderboard */}
        <Card className="animate-in fade-in slide-in-from-bottom duration-700 delay-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              Final Rankings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {sortedPlayers.map((player, index) => (
                <div
                  key={player.id}
                  className={`flex items-center justify-between p-4 rounded-lg transition-all ${
                    index === 0
                      ? 'bg-yellow-500/20 border-2 border-yellow-500'
                      : index === 1
                      ? 'bg-gray-300/20 border-2 border-gray-400'
                      : index === 2
                      ? 'bg-orange-500/20 border-2 border-orange-500'
                      : 'bg-muted/50 hover:bg-muted'
                  }`}
                  style={{
                    animationDelay: `${index * 100}ms`
                  }}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                      index === 0
                        ? 'bg-yellow-500 text-yellow-900'
                        : index === 1
                        ? 'bg-gray-400 text-gray-900'
                        : index === 2
                        ? 'bg-orange-500 text-orange-900'
                        : 'bg-muted-foreground/20 text-muted-foreground'
                    }`}>
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                    </div>
                    <div>
                      <p className="font-semibold">{player.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {index === 0 && '👑 Champion'}
                        {index === 1 && '🥈 Runner-up'}
                        {index === 2 && '🥉 Third Place'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary">{player.score}</p>
                    <p className="text-xs text-muted-foreground">points</p>
                  </div>
                </div>
              ))}

              {sortedPlayers.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  No players participated
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Stats Card */}
        <Card className="animate-in fade-in duration-700 delay-1000">
          <CardHeader>
            <CardTitle>Quiz Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-3xl font-bold text-primary">{sortedPlayers.length}</p>
                <p className="text-sm text-muted-foreground">Total Players</p>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-3xl font-bold text-primary">{currentRoom.questions?.length || 0}</p>
                <p className="text-sm text-muted-foreground">Questions</p>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-3xl font-bold text-primary">
                  {winner ? winner.score : 0}
                </p>
                <p className="text-sm text-muted-foreground">Highest Score</p>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-3xl font-bold text-primary">
                  {sortedPlayers && sortedPlayers.length > 0 
                    ? Math.round(sortedPlayers.reduce((acc, p) => acc + (p?.score || 0), 0) / sortedPlayers.length)
                    : 0}
                </p>
                <p className="text-sm text-muted-foreground">Average Score</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Play Again Section */}
        <Card className="border-primary/50 bg-primary/5 animate-in fade-in duration-700 delay-1200">
          <CardContent className="pt-6 pb-6 text-center space-y-4">
            <h3 className="text-xl font-bold">Want to Play Again?</h3>
            <p className="text-muted-foreground">
              Create a new quiz room or join another one with a code
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={() => navigate('/create')} size="lg">
                Create New Quiz
              </Button>
              <Button onClick={() => navigate('/join')} variant="outline" size="lg">
                Join Another Quiz
              </Button>
            </div>
            {currentRoom?.code && (
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-2">
                  Share this room code with others:
                </p>
                <Button onClick={copyRoomCode} variant="outline">
                  <Copy className="w-4 h-4 mr-2" />
                  {currentRoom.code}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Leaderboard;
