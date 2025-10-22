import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuiz, ScoringMode } from '@/contexts/QuizContext';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, Users, Play, SkipForward, Trophy, CheckCircle, Timer, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';
import PlayerList from '@/components/quiz/PlayerList';
import { Progress } from '@/components/ui/progress';

const QuizControl = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { currentRoom, players, currentQuestion, answers, publishQuestion, nextQuestion, endQuiz, showLeaderboard, loadRoom } = useQuiz();
  const { currentUser, hasPermission } = useAuth();
  
  const [questionIndex, setQuestionIndex] = useState(0);
  const [basePoints, setBasePoints] = useState(100);
  const [scoringMode, setScoringMode] = useState<ScoringMode>('time-based');
  const [timeLimit, setTimeLimit] = useState(30);
  const [timeRemaining, setTimeRemaining] = useState(30);
  const [isQuestionActive, setIsQuestionActive] = useState(false);
  const [timerStarted, setTimerStarted] = useState<Date | null>(null);

  // Load the room when component mounts
  useEffect(() => {
    if (roomId) {
      loadRoom(roomId);
    }
  }, [roomId, loadRoom]);

  // Sync questionIndex with room's currentQuestionIndex
  useEffect(() => {
    if (currentRoom) {
      // currentQuestionIndex is 0-based, questionIndex should be 1-based for display
      // If currentQuestionIndex is -1, we're at the start, so show question 1
      // Ensure questionIndex is always at least 1
      setQuestionIndex(Math.max(1, currentRoom.currentQuestionIndex + 1));
    }
  }, [currentRoom]);

  // Check if current user is the room owner or admin
  const isRoomOwner = currentRoom?.ownerId === currentUser?.userId;
  const isAdmin = hasPermission('canManageUsers');
  const canControlQuiz = isRoomOwner || isAdmin;

  // Timer countdown - starts when question becomes active
  useEffect(() => {
    if (!isQuestionActive || !currentQuestion) {
      setTimerStarted(null);
      return;
    }

    // Start timer when question becomes active
    const startTime = new Date();
    setTimerStarted(startTime);
    setTimeRemaining(currentQuestion.timeLimit);

    const interval = setInterval(() => {
      const now = new Date();
      const elapsed = (now.getTime() - startTime.getTime()) / 1000;
      const remaining = Math.max(0, currentQuestion.timeLimit - elapsed);
      setTimeRemaining(Math.ceil(remaining));

      if (remaining <= 0) {
        setIsQuestionActive(false);
        toast.info('Time is up!');
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isQuestionActive, currentQuestion]);

  useEffect(() => {
    if (!currentRoom) return;
    
    // Check if we're at the end
    if (currentRoom.isCompleted) {
      navigate(`/leaderboard/${roomId}`);
    }
  }, [currentRoom, roomId, navigate]);

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

  // Security check: Only room owners and admins can access quiz control
  if (!canControlQuiz) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="pt-6 text-center space-y-4">
            <p className="text-lg font-semibold">Access Denied</p>
            <p className="text-muted-foreground">
              You do not have permission to control this quiz. Only the room owner can access quiz controls.
            </p>
            <div className="flex gap-2 justify-center">
              <Button onClick={() => navigate('/')} variant="outline">
                Go Home
              </Button>
              <Button onClick={() => navigate(`/room/${roomId}`)}>
                View Room
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalQuestions = currentRoom?.questions?.length || 0;
  const currentQ = totalQuestions > 0 && questionIndex > 0 ? currentRoom?.questions?.[questionIndex - 1] : null;
  
  // Progress should show how many questions have been completed
  // If currentQuestionIndex is -1, no questions completed yet (0%)
  // If currentQuestionIndex is 0, first question completed (100/3 = 33% for 3 questions)
  const completedQuestions = Math.max(0, (currentRoom?.currentQuestionIndex || -1) + 1);
  const progress = totalQuestions > 0 ? (completedQuestions / totalQuestions) * 100 : 0;


  const handlePublishQuestion = async () => {
    if (!roomId || !currentQ) return;
    
    try {
      await publishQuestion(roomId, questionIndex - 1, basePoints, scoringMode, timeLimit);
      setIsQuestionActive(true);
      setTimeRemaining(timeLimit);
      toast.success('Question published to all players!');
    } catch (error) {
      toast.error('Failed to publish question');
    }
  };

  const handleNextQuestion = async () => {
    if (!roomId) return;
    
    setIsQuestionActive(false);
    await nextQuestion(roomId);
    
    if (questionIndex < totalQuestions) {
      setQuestionIndex(questionIndex + 1);
      toast.success('Ready for next question');
    } else {
      toast.info('That was the last question!');
    }
  };

  const handleEndQuiz = async () => {
    if (!roomId) return;
    
    try {
      await endQuiz(roomId);
      toast.success('Quiz completed!');
      navigate(`/leaderboard/${roomId}`);
    } catch (error) {
      toast.error('Failed to end quiz');
    }
  };

  const handleShowLeaderboard = async () => {
    if (!roomId) return;
    
    try {
      await showLeaderboard(roomId);
      navigate(`/leaderboard/${roomId}`);
    } catch (error) {
      toast.error('Failed to show leaderboard to players');
    }
  };

  const answeredPlayers = answers?.length || 0;
  const totalPlayers = players?.filter(p => p?.isOnline)?.length || 0;
  const correctAnswers = answers?.filter(a => a?.isCorrect)?.length || 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate(`/room/${roomId}`)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <Button variant="destructive" onClick={handleEndQuiz}>
            <Trophy className="w-4 h-4 mr-2" />
            End Quiz
          </Button>
        </div>

        {/* Progress */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium">
                  Question {questionIndex} of {totalQuestions}
                </span>
                <span className="text-muted-foreground">
                  {Math.round(progress)}% Complete
                </span>
              </div>
              <Progress value={progress} />
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Control Panel */}
          <div className="lg:col-span-2 space-y-6">
            {/* Current Question */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Question {questionIndex}
                  {isQuestionActive && (
                    <span className="flex items-center gap-1 text-sm font-normal text-muted-foreground">
                      <Timer className="w-4 h-4" />
                      {timeRemaining}s
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {currentQ ? (
                  <>
                    <div className="space-y-4">
                      <div className="p-4 bg-muted rounded-lg">
                        <p className="text-lg font-medium">{currentQ.text}</p>
                      </div>

                      {/* Image Display */}
                      {currentQ.imageUrl && (
                        <div className="w-full flex justify-center">
                          <img 
                            src={currentQ.imageUrl} 
                            alt="Question" 
                            className="max-w-full h-auto max-h-64 sm:max-h-80 md:max-h-96 rounded-lg border-2 border-border shadow-lg"
                          />
                        </div>
                      )}

                      {currentQ.type !== 'text-input' && currentQ.options && currentQ.options.length > 0 && (
                        <div className="space-y-2">
                          <Label className="text-sm text-muted-foreground">Answer Options:</Label>
                          {currentQ.options.map((option, idx) => (
                            <div
                              key={idx}
                              className={`p-3 rounded-lg border-2 ${
                                option === currentQ.correctAnswer
                                  ? 'border-green-500 bg-green-500/10'
                                  : 'border-border bg-muted/50'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span>{option}</span>
                                {option === currentQ.correctAnswer && (
                                  <CheckCircle className="w-5 h-5 text-green-600" />
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {currentQ.type === 'text-input' && (
                        <div className="p-3 rounded-lg border-2 border-green-500 bg-green-500/10">
                          <Label className="text-sm text-muted-foreground">Correct Answer:</Label>
                          <p className="font-medium mt-1">{currentQ.correctAnswer}</p>
                        </div>
                      )}
                    </div>

                    {/* Question Settings */}
                    {!isQuestionActive && !currentQuestion && (
                      <div className="space-y-4 pt-4 border-t">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Points</Label>
                            <Input
                              type="number"
                              min="10"
                              max="1000"
                              value={basePoints}
                              onChange={(e) => setBasePoints(parseInt(e.target.value) || 100)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Time Limit (seconds)</Label>
                            <Input
                              type="number"
                              min="5"
                              max="300"
                              value={timeLimit}
                              onChange={(e) => setTimeLimit(parseInt(e.target.value) || 30)}
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>Scoring Mode</Label>
                          <Select value={scoringMode} onValueChange={(v) => setScoringMode(v as ScoringMode)}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="time-based">Time-Based (faster = more points)</SelectItem>
                              <SelectItem value="order-based">Order-Based (1st, 2nd, 3rd get different points)</SelectItem>
                              <SelectItem value="first-only">First Only (only first correct answer gets points)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <Button onClick={handlePublishQuestion} className="w-full" size="lg">
                          <Play className="w-4 h-4 mr-2" />
                          Publish Question
                        </Button>
                      </div>
                    )}

                    {/* Active Question Controls */}
                    {isQuestionActive && currentQuestion && (
                      <div className="space-y-4 pt-4 border-t">
                        <div className="grid grid-cols-3 gap-4">
                          <Card>
                            <CardContent className="pt-4 text-center">
                              <p className="text-2xl font-bold">{answeredPlayers}/{totalPlayers}</p>
                              <p className="text-sm text-muted-foreground">Answered</p>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardContent className="pt-4 text-center">
                              <p className="text-2xl font-bold text-green-600">{correctAnswers}</p>
                              <p className="text-sm text-muted-foreground">Correct</p>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardContent className="pt-4 text-center">
                              <p className="text-2xl font-bold">{timeRemaining}s</p>
                              <p className="text-sm text-muted-foreground">Remaining</p>
                            </CardContent>
                          </Card>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <Button 
                            onClick={handleNextQuestion} 
                            className="w-full" 
                            size="lg"
                            variant={questionIndex === totalQuestions ? "destructive" : "default"}
                          >
                            <SkipForward className="w-4 h-4 mr-2" />
                            {questionIndex === totalQuestions ? 'Finish Quiz' : 'Next Question'}
                          </Button>
                          <Button 
                            onClick={handleShowLeaderboard} 
                            className="w-full" 
                            size="lg"
                            variant="outline"
                          >
                            <BarChart3 className="w-4 h-4 mr-2" />
                            Show Leaderboard
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Waiting for next question */}
                    {!isQuestionActive && currentQuestion && (
                      <div className="pt-4 border-t">
                        <div className="grid grid-cols-2 gap-4">
                          <Button 
                            onClick={questionIndex === totalQuestions ? handleEndQuiz : handleNextQuestion} 
                            className="w-full" 
                            size="lg"
                            variant={questionIndex === totalQuestions ? "destructive" : "default"}
                          >
                            <SkipForward className="w-4 h-4 mr-2" />
                            {questionIndex === totalQuestions ? 'View Final Results' : 'Continue to Next Question'}
                          </Button>
                          <Button 
                            onClick={handleShowLeaderboard} 
                            className="w-full" 
                            size="lg"
                            variant="outline"
                          >
                            <BarChart3 className="w-4 h-4 mr-2" />
                            Show Current Leaderboard
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-2">
                      {totalQuestions === 0 ? 'No questions available' : 'Question not found'}
                    </p>
                    {totalQuestions === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        Add questions to this room to start the quiz
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Question {questionIndex} of {totalQuestions} not found
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Live Answers */}
            {isQuestionActive && answers && answers.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Live Answers</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {answers.map((answer, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-lg flex items-center justify-between ${
                          answer.isCorrect ? 'bg-green-500/10 border border-green-500/20' : 'bg-red-500/10 border border-red-500/20'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-medium">{answer.playerName}</span>
                          <span className="text-sm text-muted-foreground">{answer.timeTaken.toFixed(1)}s</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={answer.isCorrect ? 'text-green-600' : 'text-red-600'}>
                            {answer.answer}
                          </span>
                          <span className="font-bold text-primary">+{answer.pointsEarned}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Room Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{currentRoom.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Room Code:</span>
                  <span className="font-mono font-bold">{currentRoom.code}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Questions:</span>
                  <span className="font-medium">{totalQuestions}</span>
                </div>
              </CardContent>
            </Card>

            {/* Players */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Users className="w-5 h-5" />
                  Players ({players.filter(p => p.isOnline).length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <PlayerList players={players?.filter(p => p?.isOnline) || []} showScores />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizControl;
