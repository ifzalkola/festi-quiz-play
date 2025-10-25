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
  const { currentBattle, currentQuestion, submitAnswer, currentUserId } = useQuiz();
  
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [textAnswer, setTextAnswer] = useState('');
  const [hasAnswered, setHasAnswered] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [timerStarted, setTimerStarted] = useState<Date | null>(null);
  const [randomizedOptions, setRandomizedOptions] = useState<string[]>([]);
  const [optionMapping, setOptionMapping] = useState<Map<string, string>>(new Map());

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

  // Reset answer state and randomize options when new question appears
  useEffect(() => {
    if (currentQuestion) {
      setHasAnswered(false);
      setIsSubmitting(false);
      setSelectedAnswer('');
      setTextAnswer('');
      
      // Randomize options for multiple choice questions
      if (currentQuestion.question.type === 'multiple-choice' && currentQuestion.question.options) {
        const options = [...currentQuestion.question.options];
        
        // Create a mapping from randomized position to original option
        const mapping = new Map<string, string>();
        
        // Shuffle the options array
        for (let i = options.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [options[i], options[j]] = [options[j], options[i]];
        }
        
        // Create mapping: randomized option -> original option
        options.forEach((randomizedOption, index) => {
          const originalOption = currentQuestion.question.options![index];
          mapping.set(randomizedOption, originalOption);
        });
        
        setRandomizedOptions(options);
        setOptionMapping(mapping);
      } else {
        setRandomizedOptions([]);
        setOptionMapping(new Map());
      }
    }
  }, [currentQuestion?.question.id]);

  // Redirect to leaderboard when quiz ends AND results are revealed
  useEffect(() => {
    if (currentBattle?.isCompleted && currentBattle?.showFinalResults) {
      const battleId = localStorage.getItem('current_battle_id');
      navigate(`/leaderboard/${battleId}`);
    }
  }, [currentBattle, navigate]);

  // Redirect to leaderboard when host shows it mid-quiz
  useEffect(() => {
    if (currentBattle?.showLeaderboard && currentBattle?.isStarted && !currentBattle?.isCompleted) {
      const battleId = localStorage.getItem('current_battle_id');
      navigate(`/leaderboard/${battleId}`);
    }
  }, [currentBattle, navigate]);

  // Return to quiz when leaderboard is hidden
  useEffect(() => {
    if (!currentBattle?.showLeaderboard && currentBattle?.isStarted && !currentBattle?.isCompleted) {
      // Check if we're currently on the leaderboard page
      if (window.location.pathname.includes('/leaderboard/')) {
        navigate('/play');
      }
    }
  }, [currentBattle, navigate]);

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

  // Show curiosity waiting screen when quiz is completed but results aren't revealed yet
  if (currentBattle.isCompleted && !currentBattle.showFinalResults) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center space-y-6">
            <div className="space-y-4">
              <div className="w-16 h-16 mx-auto bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <Trophy className="w-8 h-8 text-white animate-pulse" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Quiz Complete! 🎉
                </h2>
                <p className="text-muted-foreground">
                  Great job! The host is preparing the final results...
                </p>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
              <p className="text-xs text-muted-foreground">
                Results will be revealed soon!
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleSubmitAnswer = async () => {
    // Prevent multiple submissions
    if (isSubmitting || hasAnswered) {
      return;
    }

    if (!playerId || !timerStarted) {
      toast.error('Player ID not found or timer not started');
      return;
    }

    let answer = currentQuestion?.question?.type === 'text-input' ? textAnswer : selectedAnswer;
    
    // For multiple choice questions, map randomized answer back to original answer
    if (currentQuestion?.question?.type === 'multiple-choice' && answer) {
      const originalAnswer = optionMapping.get(answer);
      if (originalAnswer) {
        answer = originalAnswer;
      }
    }
    
    if (!answer.trim()) {
      toast.error('Please select or enter an answer');
      return;
    }

    // Calculate time taken since timer started
    const now = new Date();
    const timeTaken = (now.getTime() - timerStarted.getTime()) / 1000;

    // Set submitting state immediately to prevent double-clicks
    setIsSubmitting(true);

    try {
      await submitAnswer(playerId, answer, timeTaken);
      setHasAnswered(true);
      toast.success('Answer submitted!');
    } catch (error: any) {
      // Reset submitting state on error so user can try again if needed
      setIsSubmitting(false);
      
      // Show specific error message
      const errorMessage = error?.message || 'Failed to submit answer';
      toast.error(errorMessage);
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
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 p-2 sm:p-4 lg:p-6">
      <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <Card>
          <CardContent className="pt-4 pb-4 sm:pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold">{currentBattle.name}</h1>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Waiting for Question */}
        {!currentQuestion && (
          <Card className="border-dashed">
            <CardContent className="pt-8 pb-8 sm:pt-12 sm:pb-12 text-center space-y-4">
              <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 text-primary animate-spin" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl sm:text-2xl font-bold">Waiting for Next Question</h2>
                <p className="text-sm sm:text-base text-muted-foreground">
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
              <div className="p-3 sm:p-4 bg-muted/50">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                    <span className="text-sm sm:text-base font-medium">Time Remaining</span>
                  </div>
                  <span className="text-xl sm:text-2xl font-bold tabular-nums">
                    {Math.ceil(timeRemaining)}s
                  </span>
                </div>
                <Progress value={timeProgress} className={getTimeColor()} />
              </div>
            </Card>

            {/* Question */}
            <Card>
              <CardHeader className="pb-3 sm:pb-6">
                <CardTitle className="text-lg sm:text-xl lg:text-2xl whitespace-pre-line leading-tight">
                  {currentQuestion.question.text}
                </CardTitle>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground mt-2">
                  <span className="flex items-center gap-1">
                    <Trophy className="w-3 h-3 sm:w-4 sm:h-4" />
                    {currentQuestion.basePoints} points
                  </span>
                  <span>
                    Scoring: {currentQuestion.scoringMode.replace('-', ' ')}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="pt-0 space-y-3 sm:space-y-4">
                {/* Image Display */}
                {currentQuestion.question.imageUrl && (
                  <div className="w-full flex justify-center mb-4 sm:mb-6">
                    <img 
                      src={currentQuestion.question.imageUrl} 
                      alt="Question" 
                      className="max-w-full h-auto max-h-48 sm:max-h-64 md:max-h-80 lg:max-h-96 rounded-lg border-2 border-border shadow-lg"
                    />
                  </div>
                )}
                {/* True/False */}
                {currentQuestion.question.type === 'true-false' && (
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <Button
                      size="lg"
                      variant={selectedAnswer === 'true' ? 'default' : 'outline'}
                      onClick={() => !hasAnswered && !isSubmitting && setSelectedAnswer('true')}
                      disabled={hasAnswered || isSubmitting || timeRemaining <= 0}
                      className="h-16 sm:h-20 text-base sm:text-lg"
                    >
                      <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 mr-2" />
                      True
                    </Button>
                    <Button
                      size="lg"
                      variant={selectedAnswer === 'false' ? 'default' : 'outline'}
                      onClick={() => !hasAnswered && !isSubmitting && setSelectedAnswer('false')}
                      disabled={hasAnswered || isSubmitting || timeRemaining <= 0}
                      className="h-16 sm:h-20 text-base sm:text-lg"
                    >
                      <XCircle className="w-5 h-5 sm:w-6 sm:h-6 mr-2" />
                      False
                    </Button>
                  </div>
                )}

                {/* Multiple Choice */}
                {currentQuestion.question.type === 'multiple-choice' && randomizedOptions.length > 0 && (
                  <div className="space-y-2 sm:space-y-3">
                    {randomizedOptions.map((option, idx) => (
                      <Button
                        key={idx}
                        size="lg"
                        variant={selectedAnswer === option ? 'default' : 'outline'}
                        onClick={() => !hasAnswered && !isSubmitting && setSelectedAnswer(option)}
                        disabled={hasAnswered || isSubmitting || timeRemaining <= 0}
                        className="w-full h-auto min-h-[50px] sm:min-h-[60px] text-left justify-start whitespace-normal p-3 sm:p-4"
                      >
                        <span className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-primary/10 flex items-center justify-center mr-2 sm:mr-3 flex-shrink-0 text-xs sm:text-sm font-semibold">
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <span className="flex-1 text-sm sm:text-base">{option}</span>
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
                      disabled={hasAnswered || isSubmitting || timeRemaining <= 0}
                      className="text-base sm:text-lg h-12 sm:h-14"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !hasAnswered && !isSubmitting && textAnswer.trim()) {
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
                      isSubmitting ||
                      (currentQuestion?.question?.type === 'text-input' && !textAnswer.trim()) ||
                      (currentQuestion?.question?.type !== 'text-input' && !selectedAnswer)
                    }
                    size="lg"
                    className="w-full mt-3 sm:mt-4 h-12 sm:h-14 text-base sm:text-lg"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      'Submit Answer'
                    )}
                  </Button>
                )}

                {/* Answer Submitted State */}
                {hasAnswered && (
                  <Card className="bg-green-500/10 border-green-500/20">
                    <CardContent className="pt-4 pb-4 sm:pt-6 text-center space-y-2">
                      <CheckCircle className="w-10 h-10 sm:w-12 sm:h-12 text-green-600 mx-auto" />
                      <h3 className="text-base sm:text-lg font-semibold text-green-600">
                        Answer Submitted!
                      </h3>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        Waiting for other players and the next question...
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Time Up State */}
                {!hasAnswered && timeRemaining <= 0 && (
                  <Card className="bg-red-500/10 border-red-500/20">
                    <CardContent className="pt-4 pb-4 sm:pt-6 text-center space-y-2">
                      <XCircle className="w-10 h-10 sm:w-12 sm:h-12 text-red-600 mx-auto" />
                      <h3 className="text-base sm:text-lg font-semibold text-red-600">
                        Time's Up!
                      </h3>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        Waiting for the next question...
                      </p>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>

            {/* Scoring Info */}
            <Card>
              <CardContent className="pt-3 pb-3 sm:pt-4">
                <div className="text-center text-xs sm:text-sm text-muted-foreground">
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
