import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { RoundStatistics as RoundStatsType, Answer } from '@/contexts/QuizContext';
import { ChevronDown, ChevronRight, Clock, Target, Trophy, Users } from 'lucide-react';

interface RoundStatisticsProps {
  roundStats: RoundStatsType[];
  isFinalLeaderboard?: boolean;
}

const RoundStatistics = ({ roundStats, isFinalLeaderboard = false }: RoundStatisticsProps) => {
  const [expandedRounds, setExpandedRounds] = useState<Set<number>>(new Set());

  const toggleRound = (roundIndex: number) => {
    const newExpanded = new Set(expandedRounds);
    if (newExpanded.has(roundIndex)) {
      newExpanded.delete(roundIndex);
    } else {
      newExpanded.add(roundIndex);
    }
    setExpandedRounds(newExpanded);
  };

  const getScoringModeLabel = (mode: string) => {
    switch (mode) {
      case 'time-based': return 'Time-Based';
      case 'order-based': return 'Order-Based';
      case 'first-only': return 'First Only';
      default: return mode;
    }
  };

  const getScoringModeColor = (mode: string) => {
    switch (mode) {
      case 'time-based': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'order-based': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'first-only': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const sortAnswersByPerformance = (answers: Answer[]) => {
    return [...answers].sort((a, b) => {
      // First by correctness, then by points, then by time
      if (a.isCorrect !== b.isCorrect) {
        return b.isCorrect ? 1 : -1;
      }
      if (a.pointsEarned !== b.pointsEarned) {
        return b.pointsEarned - a.pointsEarned;
      }
      return a.timeTaken - b.timeTaken;
    });
  };

  if (roundStats.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center text-muted-foreground">
          No round statistics available yet.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="w-5 h-5" />
          {isFinalLeaderboard ? 'Complete Round Statistics' : 'Previous Round Details'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {roundStats.map((round, index) => {
          const isExpanded = expandedRounds.has(index);
          const sortedAnswers = sortAnswersByPerformance(round.answers);
          const correctAnswers = round.answers.filter(a => a.isCorrect);
          const totalPoints = round.answers.reduce((sum, a) => sum + a.pointsEarned, 0);
          const averageTime = round.answers.length > 0 
            ? round.answers.reduce((sum, a) => sum + a.timeTaken, 0) / round.answers.length 
            : 0;

          return (
            <Collapsible key={index} open={isExpanded} onOpenChange={() => toggleRound(index)}>
              <CollapsibleTrigger asChild>
                <Button 
                  variant="outline" 
                  className="w-full justify-between p-4 h-auto"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                      <span className="font-semibold">Round {round.questionIndex + 1}</span>
                    </div>
                    <Badge variant="outline" className={getScoringModeColor(round.scoringMode)}>
                      {getScoringModeLabel(round.scoringMode)}
                    </Badge>
                    <Badge variant="secondary">
                      {round.basePoints} pts
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {round.answers.length} players
                    </div>
                    <div className="flex items-center gap-1">
                      <Target className="w-4 h-4" />
                      {correctAnswers.length} correct
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {averageTime.toFixed(1)}s avg
                    </div>
                  </div>
                </Button>
              </CollapsibleTrigger>
              
              <CollapsibleContent className="mt-2">
                <Card className="border-l-4 border-l-primary/20">
                  <CardContent className="pt-4">
                    {/* Question Details */}
                    <div className="mb-4 p-3 bg-muted/50 rounded-lg">
                      <h4 className="font-semibold mb-2">Question:</h4>
                      <p className="text-sm">{round.questionText}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Correct Answer:</span>
                        <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          {Array.isArray(round.correctAnswer) ? round.correctAnswer.join(', ') : round.correctAnswer}
                        </Badge>
                      </div>
                    </div>

                    {/* Player Performance */}
                    <div className="space-y-2">
                      <h4 className="font-semibold mb-2">Player Performance:</h4>
                      {sortedAnswers.map((answer, answerIndex) => (
                        <div
                          key={answerIndex}
                          className={`p-3 rounded-lg border flex items-center justify-between ${
                            answer.isCorrect 
                              ? 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800' 
                              : 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                              answer.isCorrect 
                                ? 'bg-green-500 text-white' 
                                : 'bg-red-500 text-white'
                            }`}>
                              {answerIndex + 1}
                            </div>
                            <div>
                              <p className="font-medium">{answer.playerName}</p>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <span>Answer: {answer.answer}</span>
                                <span>•</span>
                                <span>{answer.timeTaken.toFixed(1)}s</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`font-bold ${
                              answer.isCorrect ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {answer.isCorrect ? '+' : ''}{answer.pointsEarned} pts
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {answer.isCorrect ? 'Correct' : 'Incorrect'}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Round Summary */}
                    <div className="mt-4 p-3 bg-muted/30 rounded-lg">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                        <div>
                          <p className="text-2xl font-bold text-primary">{totalPoints}</p>
                          <p className="text-xs text-muted-foreground">Total Points</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-green-600">{correctAnswers.length}</p>
                          <p className="text-xs text-muted-foreground">Correct</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-red-600">{round.answers.length - correctAnswers.length}</p>
                          <p className="text-xs text-muted-foreground">Incorrect</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-blue-600">{averageTime.toFixed(1)}s</p>
                          <p className="text-xs text-muted-foreground">Avg Time</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default RoundStatistics;
