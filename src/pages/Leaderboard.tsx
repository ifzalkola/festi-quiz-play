import { useEffect, useState, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuiz } from '@/contexts/QuizContext';
import { useAuth } from '@/contexts/AuthContext';
import { Trophy, Medal, Award, Crown, Home, Share2, Copy, ArrowLeft, BarChart3 } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import RoundStatistics from '@/components/quiz/RoundStatistics';
import { ThemeToggle } from '@/components/ThemeToggle';

const Leaderboard = () => {
  const { battleId } = useParams();
  const navigate = useNavigate();
  const { currentBattle, players, roundStatistics, hideLeaderboard, loadBattle, updateRevealedRounds } = useQuiz();
  const { currentUser, hasPermission } = useAuth();
  const [hasAnimated, setHasAnimated] = useState(false);
  const [playerPositions, setPlayerPositions] = useState<Map<string, number>>(new Map());
  const [previousPositions, setPreviousPositions] = useState<Map<string, number>>(new Map());
  const playerRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Load the battle when component mounts
  useEffect(() => {
    if (battleId) {
      loadBattle(battleId);
    }
  }, [battleId, loadBattle]);

  // Handle smooth position animations
  useEffect(() => {
    if (previousPositions.size === 0) {
      // First render - just set previous positions
      setPreviousPositions(new Map(playerPositions));
      return;
    }

    // Animate players that have moved positions
    playerPositions.forEach((newPosition, playerId) => {
      const oldPosition = previousPositions.get(playerId);
      const playerElement = playerRefs.current.get(playerId);
      
      if (oldPosition !== undefined && oldPosition !== newPosition && playerElement) {
        // Calculate the distance to move
        const itemHeight = 88; // Height of each player item
        const moveDistance = (oldPosition - newPosition) * itemHeight;
        
        // Apply the movement using transform
        playerElement.style.transform = `translateY(${moveDistance}px)`;
        playerElement.style.transition = 'none';
        
        // Force reflow
        playerElement.offsetHeight;
        
        // Animate to final position
        requestAnimationFrame(() => {
          playerElement.style.transition = 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
          playerElement.style.transform = 'translateY(0)';
        });
      }
    });

    // Update previous positions for next comparison
    setPreviousPositions(new Map(playerPositions));
  }, [playerPositions]);

  // Check if this is a mid-quiz leaderboard or final leaderboard
  const isFinalLeaderboard = currentBattle?.isCompleted && currentBattle?.showFinalResults;
  const isMidQuiz = !isFinalLeaderboard && currentBattle?.isStarted;

  // Check if current user is the battle owner or admin
  const isBattleOwner = currentBattle?.ownerId === currentUser?.userId;
  const isAdmin = hasPermission('canManageUsers');
  const canControlQuiz = isBattleOwner || isAdmin;

  // Auto-redirect players when leaderboard is hidden (host goes back to control)
  useEffect(() => {
    // Only redirect players (not hosts) when leaderboard is hidden during mid-quiz
    if (!currentBattle?.showLeaderboard && currentBattle?.isStarted && !currentBattle?.isCompleted && !canControlQuiz) {
      // Determine where to redirect based on current player state
      const currentPlayerId = localStorage.getItem('current_player_id');
      const currentPlayer = players?.find(p => p?.id === currentPlayerId);
      
      if (currentPlayer?.isReady) {
        // Player is ready, go back to quiz
        navigate('/play');
      } else {
        // Player not ready, go back to lobby
        navigate('/lobby');
      }
    }
  }, [currentBattle, players, canControlQuiz, navigate]);

  useEffect(() => {
    if (!hasAnimated && players.length > 0 && isFinalLeaderboard) {
      // Trigger confetti for top 3 only on final leaderboard
      setTimeout(() => {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      }, 500);
      setHasAnimated(true);
    }
  }, [players, hasAnimated, isFinalLeaderboard]);

  // Special animation when all rounds are revealed
  useEffect(() => {
    if (isFinalLeaderboard && currentBattle?.revealedRounds === currentBattle?.questions.length && !hasAnimated) {
      // Trigger special confetti when all rounds are revealed
      setTimeout(() => {
        confetti({
          particleCount: 200,
          spread: 100,
          origin: { y: 0.6 },
          colors: ['#ffd700', '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57']
        });
      }, 300);
      setHasAnimated(true);
    }
  }, [isFinalLeaderboard, currentBattle?.revealedRounds, currentBattle?.questions.length, hasAnimated]);

  if (!currentBattle) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="pt-6 text-center space-y-4">
            <p>Battle not found</p>
            <Button onClick={() => navigate('/')}>
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate cumulative points based on revealed rounds
  const calculateCumulativePoints = (player: any) => {
    if (!isFinalLeaderboard || !currentBattle?.revealedRounds) {
      return player.score; // Show total score for mid-quiz leaderboards
    }
    
    const revealedRounds = currentBattle.revealedRounds;
    let cumulativeScore = 0;
    
    // Sum points from revealed rounds only
    for (let i = 0; i < revealedRounds && i < roundStatistics.length; i++) {
      const roundStat = roundStatistics[i];
      const playerAnswer = roundStat.answers.find((answer: any) => answer.playerId === player.id);
      if (playerAnswer) {
        cumulativeScore += playerAnswer.pointsEarned;
      }
    }
    
    return cumulativeScore;
  };

  const sortedPlayers = useMemo(() => {
    const playersWithScores = [...(players || [])]
      .filter(p => p?.isOnline)
      .map(player => ({
        ...player,
        cumulativeScore: calculateCumulativePoints(player)
      }))
      .sort((a, b) => b.cumulativeScore - a.cumulativeScore);

    // Update positions for animation
    const newPositions = new Map<string, number>();
    playersWithScores.forEach((player, index) => {
      newPositions.set(player.id, index);
    });
    setPlayerPositions(newPositions);

    return playersWithScores;
  }, [players, currentBattle?.revealedRounds, roundStatistics]);

  const winner = sortedPlayers?.[0];
  const topThree = sortedPlayers?.slice(0, 3) || [];
  const rest = sortedPlayers?.slice(3) || [];

  // Filter round statistics based on revealed rounds
  const visibleRoundStatistics = isFinalLeaderboard && currentBattle?.revealedRounds 
    ? roundStatistics.slice(0, currentBattle.revealedRounds)
    : roundStatistics;

  // Handle slider change
  const handleSliderChange = async (value: number[]) => {
    if (!battleId) return;
    const rounds = value[0];
    try {
      await updateRevealedRounds(battleId, rounds);
    } catch (error) {
      toast.error('Failed to update revealed rounds');
    }
  };

  const shareResults = () => {
    if (!currentBattle || !winner) return;
    
    const text = `🎉 Quiz Results for "${currentBattle.name}"\n\n` +
      `🏆 Winner: ${winner?.displayName} (${winner?.cumulativeScore} points)\n\n` +
      `Top 3:\n` +
      topThree.map((p, i) => `${i + 1}. ${p?.displayName} - ${p?.cumulativeScore} points`).join('\n');
    
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

  const copyBattleCode = () => {
    navigator.clipboard.writeText(currentBattle.code);
    toast.success('Battle code copied!');
  };

  const handleBackToQuiz = async () => {
    if (!battleId) return;
    
    // Security check: Only battle owners and admins can control the quiz
    if (!canControlQuiz) {
      toast.error('You do not have permission to control this quiz');
      return;
    }
    
    try {
      await hideLeaderboard(battleId);
      navigate(`/battle/${battleId}/control`);
    } catch (error) {
      toast.error('Failed to return to quiz');
      navigate(`/battle/${battleId}/control`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-muted/20 to-background dark:via-primary/5 p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4 animate-in fade-in slide-in-from-top duration-700">
          <div className={`w-20 h-20 mx-auto rounded-full bg-gradient-to-br flex items-center justify-center shadow-lg ${
            isFinalLeaderboard 
              ? 'from-yellow-400 to-orange-500 dark:from-yellow-500 dark:to-orange-600 animate-bounce dark:shadow-yellow-500/30' 
              : 'from-blue-400 to-purple-500 dark:from-blue-500 dark:to-purple-600 dark:shadow-blue-500/30'
          }`}>
            <Trophy className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold">
            {isFinalLeaderboard ? 'Quiz Complete! 🎉' : 'Current Rankings 📊'}
          </h1>
          <p className="text-xl text-muted-foreground">
            {currentBattle.name}
          </p>
          {/* Show cumulative round information */}
          <p className="text-lg font-semibold text-primary">
            {isFinalLeaderboard 
              ? currentBattle?.revealedRounds === currentBattle?.questions.length
                ? 'Final Leaderboard'
                : `Leaderboard After Round ${currentBattle?.revealedRounds || 1}`
              : `Leaderboard After Round ${currentBattle?.currentQuestionIndex || 0}`
            }
          </p>
          {/* Show message for players during mid-quiz */}
          {!isFinalLeaderboard && !canControlQuiz && (
            <p className="text-sm text-muted-foreground bg-muted/50 dark:bg-muted/80 dark:border dark:border-border/50 px-4 py-2 rounded-lg">
              Waiting for host to continue the quiz...
            </p>
          )}
          <div className="flex items-center justify-center gap-4">
            <ThemeToggle />
            {isFinalLeaderboard ? (
              <>
                <Button onClick={shareResults} variant="outline">
                  <Share2 className="w-4 h-4 mr-2" />
                  Share Results
                </Button>
                <Button onClick={() => navigate('/')} variant="outline">
                  <Home className="w-4 h-4 mr-2" />
                  Home
                </Button>
              </>
            ) : (
              <>
                {/* Only show "Back to Quiz Control" button to battle owners/admins */}
                {canControlQuiz && (
                  <Button onClick={handleBackToQuiz} variant="outline">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Quiz Control
                  </Button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Reveal Control Slider - Only for final leaderboard and hosts */}
        {isFinalLeaderboard && canControlQuiz && (
          <Card className="animate-in fade-in duration-700 delay-200">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="text-center">
                  <h3 className="text-lg font-semibold mb-2">🎭 Reveal Control</h3>
                  <p className="text-sm text-muted-foreground">
                    Control how many rounds players can see
                  </p>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Round 1</span>
                    <span className="font-medium">
                      Round {currentBattle?.revealedRounds || 1} of {currentBattle?.questions.length || 0}
                    </span>
                    <span>Final Results</span>
                  </div>
                  <Slider
                    value={[currentBattle?.revealedRounds || 1]}
                    onValueChange={handleSliderChange}
                    max={currentBattle?.questions.length || 1}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                  <div className="text-center text-xs text-muted-foreground">
                    {currentBattle?.revealedRounds === currentBattle?.questions.length 
                      ? "🎉 All rounds revealed!" 
                      : `Showing ${currentBattle?.revealedRounds || 1} round${(currentBattle?.revealedRounds || 1) > 1 ? 's' : ''}`}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Winner Spotlight - Only show when all rounds are revealed */}
        {winner && isFinalLeaderboard && currentBattle?.revealedRounds === currentBattle?.questions.length && (
          <Card className="border-2 border-yellow-500 bg-gradient-to-br from-yellow-500/20 via-background to-orange-500/20 dark:from-yellow-500/30 dark:via-background dark:to-orange-500/30 animate-in zoom-in duration-700 delay-300">
            <CardContent className="pt-8 pb-8 text-center space-y-4">
              <Crown className="w-16 h-16 text-yellow-500 mx-auto animate-pulse" />
              <div className="space-y-2">
                <h2 className="text-3xl font-bold">🏆 Champion 🏆</h2>
                <p className="text-4xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                  {winner.displayName}
                </p>
                <p className="text-5xl font-black text-yellow-500">
                  {winner.cumulativeScore} <span className="text-2xl">points</span>
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Top 3 Podium - Only show when all rounds are revealed */}
        {topThree.length >= 2 && isFinalLeaderboard && currentBattle?.revealedRounds === currentBattle?.questions.length && (
          <div className="grid grid-cols-3 gap-4 items-end animate-in fade-in slide-in-from-bottom duration-700 delay-500">
            {/* 2nd Place */}
            {topThree[1] && (
              <Card className="border-gray-300 bg-gradient-to-br from-gray-100 to-gray-200 dark:border-gray-600 dark:from-gray-800 dark:to-gray-900 dark:shadow-lg dark:shadow-gray-800/20">
                <CardContent className="pt-6 pb-6 text-center space-y-3">
                  <div className="w-16 h-16 mx-auto rounded-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center">
                    <Medal className="w-8 h-8 text-gray-600 dark:text-gray-300" />
                  </div>
                  <div className="text-4xl font-bold">2nd</div>
                  <p className="font-semibold truncate">{topThree[1].displayName}</p>
                  <p className="text-2xl font-bold text-gray-600 dark:text-gray-300">
                    {topThree[1].cumulativeScore}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* 1st Place */}
            <Card className="border-2 border-yellow-400 bg-gradient-to-br from-yellow-100 to-yellow-200 dark:border-yellow-500 dark:from-yellow-900/80 dark:to-orange-900/80 dark:shadow-lg dark:shadow-yellow-500/20 transform scale-110">
              <CardContent className="pt-8 pb-8 text-center space-y-3">
                <div className="w-20 h-20 mx-auto rounded-full bg-yellow-400 flex items-center justify-center">
                  <Crown className="w-10 h-10 text-yellow-900" />
                </div>
                <div className="text-5xl font-bold">1st</div>
                <p className="font-bold truncate text-lg">{topThree[0].displayName}</p>
                <p className="text-3xl font-black text-yellow-600 dark:text-yellow-400">
                  {topThree[0].cumulativeScore}
                </p>
              </CardContent>
            </Card>

            {/* 3rd Place */}
            {topThree[2] && (
              <Card className="border-orange-300 bg-gradient-to-br from-orange-100 to-orange-200 dark:border-orange-600 dark:from-orange-900/80 dark:to-orange-950/80 dark:shadow-lg dark:shadow-orange-500/20">
                <CardContent className="pt-6 pb-6 text-center space-y-3">
                  <div className="w-16 h-16 mx-auto rounded-full bg-orange-300 dark:bg-orange-700 flex items-center justify-center">
                    <Award className="w-8 h-8 text-orange-600 dark:text-orange-300" />
                  </div>
                  <div className="text-4xl font-bold">3rd</div>
                  <p className="font-semibold truncate">{topThree[2].displayName}</p>
                  <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {topThree[2].cumulativeScore}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Full Leaderboard */}
        <Card className="animate-in fade-in slide-in-from-bottom duration-700 delay-700 dark:border-border/50 dark:shadow-lg dark:shadow-background/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              {isFinalLeaderboard && currentBattle?.revealedRounds === currentBattle?.questions.length 
                ? 'Final Rankings' 
                : isFinalLeaderboard 
                  ? `Rankings After Round ${currentBattle?.revealedRounds || 1}`
                  : 'Current Rankings'
              }
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative" style={{ height: `${sortedPlayers.length * 88}px` }}>
              {sortedPlayers.map((player, index) => (
                <div
                  key={player.id}
                  ref={(el) => {
                    if (el) {
                      playerRefs.current.set(player.id, el);
                    }
                  }}
                  className={`absolute left-0 right-0 flex items-center justify-between p-4 rounded-lg hover:scale-[1.02] ${
                    index === 0
                      ? 'bg-yellow-500/20 border-2 border-yellow-500'
                      : index === 1
                      ? 'bg-gray-300/20 border-2 border-gray-400'
                      : index === 2
                      ? 'bg-orange-500/20 border-2 border-orange-500'
                      : 'bg-muted/50 hover:bg-muted'
                  }`}
                  style={{
                    top: `${index * 88}px`,
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
                      <p className="font-semibold">{player.displayName}</p>
                      <p className="text-xs text-muted-foreground">
                        {index === 0 && '👑 Champion'}
                        {index === 1 && '🥈 Runner-up'}
                        {index === 2 && '🥉 Third Place'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary">{player.cumulativeScore}</p>
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
        <Card className="animate-in fade-in duration-700 delay-1000 dark:border-border/50 dark:shadow-lg dark:shadow-background/10">
          <CardHeader>
            <CardTitle>Quiz Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-muted rounded-lg dark:bg-muted/80 dark:border dark:border-border/50">
                <p className="text-3xl font-bold text-primary">{sortedPlayers.length}</p>
                <p className="text-sm text-muted-foreground">Total Players</p>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg dark:bg-muted/80 dark:border dark:border-border/50">
                <p className="text-3xl font-bold text-primary">{currentBattle.questions?.length || 0}</p>
                <p className="text-sm text-muted-foreground">Questions</p>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg dark:bg-muted/80 dark:border dark:border-border/50">
                <p className="text-3xl font-bold text-primary">
                  {winner ? winner.cumulativeScore : 0}
                </p>
                <p className="text-sm text-muted-foreground">Highest Score</p>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg dark:bg-muted/80 dark:border dark:border-border/50">
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

        {/* Round Statistics */}
        <RoundStatistics 
          roundStats={visibleRoundStatistics} 
          isFinalLeaderboard={isFinalLeaderboard}
        />

        {/* Play Again Section - Only for final leaderboard */}
        {isFinalLeaderboard && (
          <Card className="border-primary/50 bg-primary/5 dark:border-primary/30 dark:bg-primary/10 animate-in fade-in duration-700 delay-1200">
            <CardContent className="pt-6 pb-6 text-center space-y-4">
              <h3 className="text-xl font-bold">Want to Play Again?</h3>
              <p className="text-muted-foreground">
                Create a new quiz battle or join another one with a code
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button onClick={() => navigate('/create')} size="lg">
                  Create New Quiz
                </Button>
                <Button onClick={() => navigate('/join')} variant="outline" size="lg">
                  Join Another Quiz
                </Button>
              </div>
              {currentBattle?.code && (
                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground mb-2">
                    Share this battle code with others:
                  </p>
                  <Button onClick={copyBattleCode} variant="outline">
                    <Copy className="w-4 h-4 mr-2" />
                    {currentBattle.code}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;
