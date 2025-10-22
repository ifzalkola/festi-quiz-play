import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useQuiz } from '@/contexts/QuizContext';
import { Clock, CheckCircle, XCircle, Loader2, Trophy } from 'lucide-react';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';

const PlayQuiz = () => {
  const navigate = useNavigate();
  const { currentRoom, currentQuestion, submitAnswer, currentUserId } = useQuiz();
  
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [textAnswer, setTextAnswer] = useState('');
  const [hasAnswered, setHasAnswered] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [timerStarted, setTimerStarted] = useState<Date | null>(null);

  useEffect(() => {
    const storedPlayerId = localStorage.getItem('current_player_id');
    setPlayerId(storedPlayerId);
  }, []);

  // Timer countdown - starts when question appears on screen
  useEffect(() => {
    if (!currentQuestion) {
      setTimerStarted(null);
      setTimeRemaining(0);
      return;
    }

    // Start timer when question appears
    const startTime = new Date();
    setTimerStarted(startTime);
    setTimeRemaining(currentQuestion.timeLimit);

    const interval = setInterval(() => {
      const now = new Date();
      const elapsed = (now.getTime() - startTime.getTime()) / 1000;
      const remaining = Math.max(0, currentQuestion.timeLimit - elapsed);
      setTimeRemaining(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [currentQuestion]);

  // Reset answer state when new question appears
  useEffect(() => {
    if (currentQuestion) {
      setHasAnswered(false);
      setSelectedAnswer('');
      setTextAnswer('');
    }
  }, [currentQuestion?.question.id]);

  // Redirect to leaderboard when quiz ends
  useEffect(() => {
    if (currentRoom?.isCompleted) {
      const roomId = localStorage.getItem('current_room_id');
      navigate(`/leaderboard/${roomId}`);
    }
  }, [currentRoom, navigate]);

  // Redirect to leaderboard when host shows it mid-quiz
  useEffect(() => {
    if (currentRoom?.showLeaderboard && currentRoom?.isStarted && !currentRoom?.isCompleted) {
      const roomId = localStorage.getItem('current_room_id');
      navigate(`/leaderboard/${roomId}`);
    }
  }, [currentRoom, navigate]);

  // Return to quiz when leaderboard is hidden
  useEffect(() => {
    if (!currentRoom?.showLeaderboard && currentRoom?.isStarted && !currentRoom?.isCompleted) {
      // Check if we're currently on the leaderboard page
      if (window.location.pathname.includes('/leaderboard/')) {
        navigate('/play');
      }
    }
  }, [currentRoom, navigate]);

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

  const handleSubmitAnswer = async () => {
    if (!playerId || !timerStarted) {
      toast.error('Player ID not found or timer not started');
      return;
    }

    const answer = currentQuestion?.question?.type === 'text-input' ? textAnswer : selectedAnswer;
    
    if (!answer.trim()) {
      toast.error('Please select or enter an answer');
      return;
    }

    // Calculate time taken since timer started
    const now = new Date();
    const timeTaken = (now.getTime() - timerStarted.getTime()) / 1000;

    try {
      await submitAnswer(playerId, answer, timeTaken);
      setHasAnswered(true);
      toast.success('Answer submitted!');
    } catch (error) {
      toast.error('Failed to submit answer');
    }
  };

  const timeProgress = currentQuestion 
    ? (timeRemaining / currentQuestion.timeLimit) * 100 
    : 0;

  const getTimeColor = () => {
    if (timeProgress > 50) return 'bg-green-500';
    if (timeProgress > 25) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">{currentRoom.name}</h1>
                <p className="text-sm text-muted-foreground">Room Code: {currentRoom.code}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Waiting for Question */}
        {!currentQuestion && (
          <Card className="border-dashed">
            <CardContent className="pt-12 pb-12 text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold">Waiting for Next Question</h2>
                <p className="text-muted-foreground">
                  The host will publish the next question shortly...
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Active Question */}
        {currentQuestion && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Timer */}
            <Card className="overflow-hidden">
              <div className="p-4 bg-muted/50">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-primary" />
                    <span className="font-medium">Time Remaining</span>
                  </div>
                  <span className="text-2xl font-bold tabular-nums">
                    {Math.ceil(timeRemaining)}s
                  </span>
                </div>
                <Progress value={timeProgress} className={getTimeColor()} />
              </div>
            </Card>

            {/* Question */}
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">
                  {currentQuestion.question.text}
                </CardTitle>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Trophy className="w-4 h-4" />
                    {currentQuestion.basePoints} points
                  </span>
                  <span>
                    Scoring: {currentQuestion.scoringMode.replace('-', ' ')}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* True/False */}
                {currentQuestion.question.type === 'true-false' && (
                  <div className="grid grid-cols-2 gap-4">
                    <Button
                      size="lg"
                      variant={selectedAnswer === 'true' ? 'default' : 'outline'}
                      onClick={() => !hasAnswered && setSelectedAnswer('true')}
                      disabled={hasAnswered || timeRemaining <= 0}
                      className="h-20 text-lg"
                    >
                      <CheckCircle className="w-6 h-6 mr-2" />
                      True
                    </Button>
                    <Button
                      size="lg"
                      variant={selectedAnswer === 'false' ? 'default' : 'outline'}
                      onClick={() => !hasAnswered && setSelectedAnswer('false')}
                      disabled={hasAnswered || timeRemaining <= 0}
                      className="h-20 text-lg"
                    >
                      <XCircle className="w-6 h-6 mr-2" />
                      False
                    </Button>
                  </div>
                )}

                {/* Multiple Choice */}
                {currentQuestion.question.type === 'multiple-choice' && currentQuestion.question.options && currentQuestion.question.options.length > 0 && (
                  <div className="space-y-3">
                    {currentQuestion.question.options.map((option, idx) => (
                      <Button
                        key={idx}
                        size="lg"
                        variant={selectedAnswer === option ? 'default' : 'outline'}
                        onClick={() => !hasAnswered && setSelectedAnswer(option)}
                        disabled={hasAnswered || timeRemaining <= 0}
                        className="w-full h-auto min-h-[60px] text-left justify-start whitespace-normal p-4"
                      >
                        <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mr-3 flex-shrink-0">
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <span className="flex-1">{option}</span>
                      </Button>
                    ))}
                  </div>
                )}

                {/* Text Input */}
                {currentQuestion.question.type === 'text-input' && (
                  <div className="space-y-3">
                    <Input
                      placeholder="Type your answer..."
                      value={textAnswer}
                      onChange={(e) => setTextAnswer(e.target.value)}
                      disabled={hasAnswered || timeRemaining <= 0}
                      className="text-lg h-14"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !hasAnswered && textAnswer.trim()) {
                          handleSubmitAnswer();
                        }
                      }}
                    />
                  </div>
                )}

                {/* Submit Button */}
                {!hasAnswered && timeRemaining > 0 && currentQuestion && (
                  <Button
                    onClick={handleSubmitAnswer}
                    disabled={
                      (currentQuestion?.question?.type === 'text-input' && !textAnswer.trim()) ||
                      (currentQuestion?.question?.type !== 'text-input' && !selectedAnswer)
                    }
                    size="lg"
                    className="w-full mt-4"
                  >
                    Submit Answer
                  </Button>
                )}

                {/* Answer Submitted State */}
                {hasAnswered && (
                  <Card className="bg-green-500/10 border-green-500/20">
                    <CardContent className="pt-6 text-center space-y-2">
                      <CheckCircle className="w-12 h-12 text-green-600 mx-auto" />
                      <h3 className="text-lg font-semibold text-green-600">
                        Answer Submitted!
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Waiting for other players and the next question...
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Time Up State */}
                {!hasAnswered && timeRemaining <= 0 && (
                  <Card className="bg-red-500/10 border-red-500/20">
                    <CardContent className="pt-6 text-center space-y-2">
                      <XCircle className="w-12 h-12 text-red-600 mx-auto" />
                      <h3 className="text-lg font-semibold text-red-600">
                        Time's Up!
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Waiting for the next question...
                      </p>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>

            {/* Scoring Info */}
            <Card>
              <CardContent className="pt-4">
                <div className="text-center text-sm text-muted-foreground">
                  <p>
                    {currentQuestion.scoringMode === 'time-based' && 
                      '⚡ Answer quickly to earn more points!'}
                    {currentQuestion.scoringMode === 'order-based' && 
                      '🏆 First 3 correct answers get bonus points!'}
                    {currentQuestion.scoringMode === 'first-only' && 
                      '🎯 Only the first correct answer earns points!'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlayQuiz;
