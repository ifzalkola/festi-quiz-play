import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuiz, type Contest, type ContestPlayerScore } from '@/contexts/QuizContext';
import { useAuth } from '@/contexts/AuthContext';
import { Trophy, Medal, Award, Crown, Home, Share2, Copy, ArrowLeft, Users, Calendar, Hash } from 'lucide-react';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import { ThemeToggle } from '@/components/ThemeToggle';

const Contest = () => {
  const { contestId } = useParams();
  const navigate = useNavigate();
  const { getContest, getContestLeaderboard, canAccessContest, getAllBattles } = useQuiz();
  const { currentUser, hasPermission } = useAuth();
  const [contest, setContest] = useState<Contest | null>(null);
  const [leaderboard, setLeaderboard] = useState<ContestPlayerScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [leaderboardLoading, setLeaderboardLoading] = useState(true);
  const [hasAnimated, setHasAnimated] = useState(false);
  const [battles, setBattles] = useState<any[]>([]);
  const [expandedPlayers, setExpandedPlayers] = useState<Set<string>>(new Set());

  // Check if current user is admin
  const isAdmin = hasPermission('canManageUsers');

  useEffect(() => {
    if (!contestId) {
      navigate('/');
      return;
    }

    loadContestData();
  }, [contestId, navigate]);

  const loadContestData = async () => {
    try {
      setLoading(true);
      
      // Check if user can access this contest
      const canAccess = await canAccessContest(contestId!);
      if (!canAccess) {
        toast.error('You do not have access to this contest');
        navigate('/');
        return;
      }

      // Load contest data
      const contestData = await getContest(contestId!);
      if (!contestData) {
        toast.error('Contest not found');
        navigate('/');
        return;
      }

      setContest(contestData);

      // Load leaderboard
      await loadLeaderboard();

      // Load battle details for display
      await loadBattleDetails(contestData.battleIds);

    } catch (error: any) {
      toast.error(error.message || 'Failed to load contest');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const loadLeaderboard = async () => {
    try {
      setLeaderboardLoading(true);
      const leaderboardData = await getContestLeaderboard(contestId!);
      setLeaderboard(leaderboardData);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load leaderboard');
    } finally {
      setLeaderboardLoading(false);
    }
  };

  const loadBattleDetails = async (battleIds: string[]) => {
    try {
      const allBattles = await getAllBattles();
      const contestBattles = allBattles.filter(battle => battleIds.includes(battle.id));
      setBattles(contestBattles);
    } catch (error: any) {
      console.error('Failed to load battle details:', error);
    }
  };

  // Trigger confetti for top 3 players
  useEffect(() => {
    if (!hasAnimated && leaderboard.length > 0) {
      setTimeout(() => {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      }, 500);
      setHasAnimated(true);
    }
  }, [leaderboard, hasAnimated]);

  const winner = leaderboard[0];
  const topThree = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);

  const shareContest = () => {
    if (!contest || !winner) return;
    
    const text = `🏆 Contest Results for "${contest.name}"\n\n` +
      `🥇 Winner: ${winner.displayName} (${winner.totalScore} points)\n\n` +
      `Top 3:\n` +
      topThree.map((p, i) => `${i + 1}. ${p.displayName} - ${p.totalScore} points`).join('\n') +
      `\n\nContest Code: ${contest.code}`;
    
    if (navigator.share) {
      navigator.share({
        title: 'Contest Results',
        text: text
      });
    } else {
      navigator.clipboard.writeText(text);
      toast.success('Results copied to clipboard!');
    }
  };

  const copyContestCode = () => {
    if (!contest) return;
    navigator.clipboard.writeText(contest.code);
    toast.success('Contest code copied!');
  };

  const togglePlayerExpansion = (playerId: string) => {
    const newExpanded = new Set(expandedPlayers);
    if (newExpanded.has(playerId)) {
      newExpanded.delete(playerId);
    } else {
      newExpanded.add(playerId);
    }
    setExpandedPlayers(newExpanded);
  };

  const getBattleName = (battleId: string) => {
    const battle = battles.find(r => r.id === battleId);
    return battle ? battle.name : `Battle ${battleId.substring(0, 8)}...`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="pt-6 text-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p>Loading contest...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!contest) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="pt-6 text-center space-y-4">
            <p>Contest not found</p>
            <Button onClick={() => navigate('/')}>
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-muted/20 to-background dark:via-primary/5 p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4 animate-in fade-in slide-in-from-top duration-700">
          <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 dark:from-yellow-500 dark:to-orange-600 flex items-center justify-center shadow-lg animate-bounce dark:shadow-yellow-500/30">
            <Trophy className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold">
            Contest Leaderboard 🏆
          </h1>
          <p className="text-xl text-muted-foreground">
            {contest.name}
          </p>
          <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Hash className="w-4 h-4" />
              <span className="font-mono">{contest.code}</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span>{battles.length} Battles</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>{contest.createdAt.toLocaleDateString()}</span>
            </div>
          </div>
          <div className="flex items-center justify-center gap-4">
            <ThemeToggle />
            <Button onClick={shareContest} variant="outline">
              <Share2 className="w-4 h-4 mr-2" />
              Share Results
            </Button>
            <Button onClick={() => navigate('/')} variant="outline">
              <Home className="w-4 h-4 mr-2" />
              Home
            </Button>
          </div>
        </div>

        {/* Contest Battles */}
        <Card className="animate-in fade-in duration-700 delay-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Contest Battles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {battles.map((battle) => (
                <Card key={battle.id} className="border-border/50">
                  <CardContent className="pt-4">
                    <div className="space-y-2">
                      <h3 className="font-semibold">{battle.name}</h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="font-mono">{battle.code}</span>
                        <Badge variant={battle.isCompleted ? "secondary" : battle.isStarted ? "destructive" : "default"}>
                          {battle.isCompleted ? "Completed" : battle.isStarted ? "In Progress" : "Published"}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {battle.questions?.length || 0} questions • Max {battle.maxPlayers} players
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Winner Spotlight */}
        {winner && (
          <Card className="border-2 border-yellow-500 bg-gradient-to-br from-yellow-500/20 via-background to-orange-500/20 dark:from-yellow-500/30 dark:via-background dark:to-orange-500/30 animate-in zoom-in duration-700 delay-300">
            <CardContent className="pt-8 pb-8 text-center space-y-4">
              <Crown className="w-16 h-16 text-yellow-500 mx-auto animate-pulse" />
              <div className="space-y-2">
                <h2 className="text-3xl font-bold">🏆 Contest Champion 🏆</h2>
                <p className="text-4xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                  {winner.displayName}
                </p>
                <p className="text-5xl font-black text-yellow-500">
                  {winner.totalScore} <span className="text-2xl">points</span>
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
              <Card className="border-gray-300 bg-gradient-to-br from-gray-100 to-gray-200 dark:border-gray-600 dark:from-gray-800 dark:to-gray-900 dark:shadow-lg dark:shadow-gray-800/20">
                <CardContent className="pt-6 pb-6 text-center space-y-3">
                  <div className="w-16 h-16 mx-auto rounded-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center">
                    <Medal className="w-8 h-8 text-gray-600 dark:text-gray-300" />
                  </div>
                  <div className="text-4xl font-bold">2nd</div>
                  <p className="font-semibold truncate">{topThree[1].displayName}</p>
                  <p className="text-2xl font-bold text-gray-600 dark:text-gray-300">
                    {topThree[1].totalScore}
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
                  {topThree[0].totalScore}
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
                    {topThree[2].totalScore}
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
              Contest Rankings
            </CardTitle>
          </CardHeader>
          <CardContent>
            {leaderboardLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : leaderboard.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No players participated in this contest
              </p>
            ) : (
              <div className="space-y-2">
                {leaderboard.map((player, index) => (
                  <div key={player.playerId}>
                    {/* Main Player Card */}
                    <div
                      className={`flex items-center justify-between p-4 rounded-lg hover:scale-[1.02] transition-all cursor-pointer ${
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
                      onClick={() => togglePlayerExpansion(player.playerId)}
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
                            {index > 2 && `${Object.keys(player.battleScores).length} battles`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <p className="text-2xl font-bold text-primary">{player.totalScore}</p>
                          <p className="text-xs text-muted-foreground">total points</p>
                        </div>
                        <div className={`transition-transform duration-200 ${
                          expandedPlayers.has(player.playerId) ? 'rotate-180' : ''
                        }`}>
                          <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* Expanded Battle Scores */}
                    {expandedPlayers.has(player.playerId) && (
                      <div className="mt-2 ml-4 p-4 bg-muted/30 rounded-lg border-l-4 border-primary/50 animate-in slide-in-from-top-2 duration-200">
                        <h4 className="font-semibold text-sm mb-3 text-primary">Battle Performance Breakdown</h4>
                        <div className="space-y-2">
                          {Object.entries(player.battleScores).map(([battleId, score]) => (
                            <div key={battleId} className="flex items-center justify-between py-2 px-3 bg-background/50 rounded">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-primary rounded-full"></div>
                                <span className="text-sm font-medium">{getBattleName(battleId)}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-mono text-muted-foreground">
                                  {battles.find(r => r.id === battleId)?.code || 'N/A'}
                                </span>
                                <span className="font-semibold text-primary">{score} pts</span>
                              </div>
                            </div>
                          ))}
                          {Object.keys(player.battleScores).length === 0 && (
                            <p className="text-sm text-muted-foreground text-center py-2">
                              No battle scores available
                            </p>
                          )}
                        </div>
                        <div className="mt-3 pt-2 border-t border-border/50">
                          <div className="flex justify-between items-center text-sm">
                            <span className="font-medium">Total Score:</span>
                            <span className="font-bold text-primary">{player.totalScore} points</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Contest Stats */}
        <Card className="animate-in fade-in duration-700 delay-1000 dark:border-border/50 dark:shadow-lg dark:shadow-background/10">
          <CardHeader>
            <CardTitle>Contest Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-muted rounded-lg dark:bg-muted/80 dark:border dark:border-border/50">
                <p className="text-3xl font-bold text-primary">{leaderboard.length}</p>
                <p className="text-sm text-muted-foreground">Total Players</p>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg dark:bg-muted/80 dark:border dark:border-border/50">
                <p className="text-3xl font-bold text-primary">{battles.length}</p>
                <p className="text-sm text-muted-foreground">Quiz Battles</p>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg dark:bg-muted/80 dark:border dark:border-border/50">
                <p className="text-3xl font-bold text-primary">
                  {winner ? winner.totalScore : 0}
                </p>
                <p className="text-sm text-muted-foreground">Highest Score</p>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg dark:bg-muted/80 dark:border dark:border-border/50">
                <p className="text-3xl font-bold text-primary">
                  {leaderboard.length > 0 
                    ? Math.round(leaderboard.reduce((acc, p) => acc + p.totalScore, 0) / leaderboard.length)
                    : 0}
                </p>
                <p className="text-sm text-muted-foreground">Average Score</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contest Code Section */}
        <Card className="border-primary/50 bg-primary/5 dark:border-primary/30 dark:bg-primary/10 animate-in fade-in duration-700 delay-1200">
          <CardContent className="pt-6 pb-6 text-center space-y-4">
            <h3 className="text-xl font-bold">Contest Code</h3>
            <p className="text-muted-foreground">
              Share this code with others to let them view the contest results
            </p>
            <Button onClick={copyContestCode} variant="outline" size="lg">
              <Copy className="w-4 h-4 mr-2" />
              {contest.code}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Contest;
