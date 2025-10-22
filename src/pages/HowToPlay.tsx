import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { 
  ArrowLeft, 
  Trophy, 
  Clock, 
  Target, 
  Users, 
  Zap, 
  Medal, 
  CheckCircle2,
  XCircle,
  Timer,
  BarChart3,
  BookOpen,
  PlayCircle,
  Hash,
  LogIn
} from 'lucide-react';

const HowToPlay = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-indigo-950 dark:to-purple-950">
      <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate(currentUser ? '/' : '/login')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {currentUser ? 'Back to Home' : 'Back to Login'}
          </Button>
          
          <div className="text-center space-y-4 animate-in fade-in slide-in-from-top duration-700">
            <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
              <BookOpen className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              How to Play
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to know to become a quiz champion!
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Getting Started */}
          <Card className="border-l-4 border-l-blue-500 animate-in fade-in slide-in-from-left duration-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <PlayCircle className="w-6 h-6 text-blue-500" />
                Getting Started
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 rounded-lg">
                  <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-600" />
                    Joining a Quiz
                  </h3>
                  <ol className="space-y-2 text-sm text-muted-foreground">
                    <li>1. Log in to your account</li>
                    <li>2. Click "Join Room"</li>
                    <li>3. Enter the 6-character room code</li>
                    <li>4. Enter your display name</li>
                    <li>5. Wait in the lobby for the host to start</li>
                  </ol>
                </div>
                
                <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 rounded-lg">
                  <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                    <Hash className="w-5 h-5 text-purple-600" />
                    Room Codes
                  </h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    Room codes are unique 6-character identifiers shared by the quiz host.
                  </p>
                  <div className="p-2 bg-white dark:bg-gray-800 rounded border-2 border-dashed border-purple-300 text-center">
                    <span className="text-2xl font-mono font-bold text-purple-600">ABC123</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Question Types */}
          <Card className="border-l-4 border-l-green-500 animate-in fade-in slide-in-from-left duration-500 delay-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Target className="w-6 h-6 text-green-500" />
                Question Types
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-4 border-2 border-green-200 dark:border-green-800 rounded-lg hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold">True or False</h3>
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Choose between True or False. Simple but challenging!
                  </p>
                  <div className="space-y-2">
                    <Button variant="outline" size="sm" className="w-full justify-start" disabled>
                      <CheckCircle2 className="w-4 h-4 mr-2" /> True
                    </Button>
                    <Button variant="outline" size="sm" className="w-full justify-start" disabled>
                      <XCircle className="w-4 h-4 mr-2" /> False
                    </Button>
                  </div>
                </div>

                <div className="p-4 border-2 border-blue-200 dark:border-blue-800 rounded-lg hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold">Multiple Choice</h3>
                    <Hash className="w-5 h-5 text-blue-600" />
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Select the correct answer from multiple options.
                  </p>
                  <div className="space-y-2">
                    <Button variant="outline" size="sm" className="w-full justify-start text-xs" disabled>
                      A. Option 1
                    </Button>
                    <Button variant="outline" size="sm" className="w-full justify-start text-xs" disabled>
                      B. Option 2
                    </Button>
                    <Button variant="outline" size="sm" className="w-full justify-start text-xs" disabled>
                      C. Option 3
                                      </Button>
                    <Button variant="outline" size="sm" className="w-full justify-start text-xs" disabled>
                      D. Option 4
                    </Button>
                  </div>
                </div>

                <div className="p-4 border-2 border-purple-200 dark:border-purple-800 rounded-lg hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold">Text Input</h3>
                    <BookOpen className="w-5 h-5 text-purple-600" />
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Type your answer. Case-insensitive matching!
                  </p>
                  <div className="p-2 bg-muted rounded border">
                    <input 
                      type="text" 
                      placeholder="Type your answer..." 
                      className="w-full bg-transparent text-sm outline-none"
                      disabled
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Scoring Modes */}
          <Card className="border-l-4 border-l-yellow-500 animate-in fade-in slide-in-from-left duration-500 delay-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Trophy className="w-6 h-6 text-yellow-500" />
                Scoring Modes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-5 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950 rounded-lg border-2 border-blue-200 dark:border-blue-800">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="p-2 bg-blue-500 rounded-lg">
                      <Zap className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg mb-1">Time-Based Scoring</h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        Answer faster to earn more points! The time remaining when you answer determines your score.
                      </p>
                      <div className="p-3 bg-white dark:bg-gray-800 rounded mb-3">
                        <p className="text-xs font-semibold mb-2">Example: 30s timer, 20 points</p>
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Answer in 0-3s:</span>
                            <span className="font-bold text-green-600">20 pts (100%)</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Answer in 3-6s:</span>
                            <span className="font-bold text-green-600">18 pts (90%)</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Answer in 6-9s:</span>
                            <span className="font-bold text-yellow-600">16 pts (80%)</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Answer in 27-30s:</span>
                            <span className="font-bold text-orange-600">2 pts (10%)</span>
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground italic">
                        💡 The time limit is divided into 10 intervals. The earlier you answer, the more intervals remain, earning you more points!
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-5 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 rounded-lg border-2 border-purple-200 dark:border-purple-800">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="p-2 bg-purple-500 rounded-lg">
                      <Medal className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg mb-1">Order-Based Scoring</h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        First three correct answers get bonus points. Race to be in the top 3!
                      </p>
                      <div className="flex gap-2">
                        <Badge className="bg-yellow-500 text-white">1st: 100%</Badge>
                        <Badge className="bg-gray-400 text-white">2nd: 70%</Badge>
                        <Badge className="bg-orange-500 text-white">3rd: 40%</Badge>
                        <Badge variant="outline">4th+: 0%</Badge>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-5 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950 dark:to-orange-950 rounded-lg border-2 border-red-200 dark:border-red-800">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-red-500 rounded-lg">
                      <Target className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg mb-1">First-Only Scoring</h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        Winner takes all! Only the first correct answer earns points.
                      </p>
                      <div className="p-3 bg-white dark:bg-gray-800 rounded border-l-4 border-red-500">
                        <p className="text-sm font-semibold">⚡ Be lightning fast!</p>
                        <p className="text-xs text-muted-foreground">Second place gets nothing in this mode.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Timing */}
          <Card className="border-l-4 border-l-orange-500 animate-in fade-in slide-in-from-left duration-500 delay-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Clock className="w-6 h-6 text-orange-500" />
                Time Limits
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950 dark:to-red-950 rounded-lg">
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <Timer className="w-5 h-5 text-orange-600" />
                    Question Timer
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Each question has a time limit set by the host (usually 5-60 seconds). Answer before time runs out!
                  </p>
                  <div className="p-3 bg-white dark:bg-gray-800 rounded">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Time Remaining</span>
                      <span className="text-2xl font-bold text-orange-600">15s</span>
                    </div>
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-full bg-orange-500 w-1/2 transition-all"></div>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-950 dark:to-amber-950 rounded-lg">
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-yellow-600" />
                    Speed Matters
                  </h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Your response time is recorded for each answer</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Faster answers earn more points (in time-based mode)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Missing the timer means no points for that question</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Leaderboards */}
          <Card className="border-l-4 border-l-indigo-500 animate-in fade-in slide-in-from-left duration-500 delay-400">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <BarChart3 className="w-6 h-6 text-indigo-500" />
                Leaderboards & Statistics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-5 bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-950 dark:to-blue-950 rounded-lg border-2 border-indigo-200 dark:border-indigo-800">
                <h3 className="font-bold text-lg mb-3">Real-Time Rankings</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 bg-yellow-100 dark:bg-yellow-900 rounded-lg border-2 border-yellow-500">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🥇</span>
                      <div>
                        <p className="font-semibold">Player Name</p>
                        <p className="text-xs text-muted-foreground">Champion</p>
                      </div>
                    </div>
                    <span className="text-xl font-bold text-yellow-600">300 pts</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-800 rounded-lg border-2 border-gray-400">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🥈</span>
                      <div>
                        <p className="font-semibold">Player Name</p>
                        <p className="text-xs text-muted-foreground">Runner-up</p>
                      </div>
                    </div>
                    <span className="text-xl font-bold text-gray-600">250 pts</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-orange-100 dark:bg-orange-900 rounded-lg border-2 border-orange-500">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🥉</span>
                      <div>
                        <p className="font-semibold">Player Name</p>
                        <p className="text-xs text-muted-foreground">Third Place</p>
                      </div>
                    </div>
                    <span className="text-xl font-bold text-orange-600">200 pts</span>
                  </div>
                </div>
              </div>

              <div className="p-5 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950 dark:to-indigo-950 rounded-lg">
                <h3 className="font-bold text-lg mb-3">Round Statistics</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  After each round, you can view detailed statistics showing:
                </p>
                <div className="grid md:grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <span>Who answered correctly</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <span>Response times for each player</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <span>Points earned per question</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <span>Correct answer revealed</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pro Tips */}
          <Card className="border-l-4 border-l-pink-500 animate-in fade-in slide-in-from-left duration-500 delay-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Trophy className="w-6 h-6 text-pink-500" />
                Pro Tips
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-950 dark:to-rose-950 rounded-lg">
                  <h3 className="font-semibold mb-2 text-pink-700 dark:text-pink-400">💡 Speed vs Accuracy</h3>
                  <p className="text-sm text-muted-foreground">
                    Don't rush too much! A wrong answer earns zero points, even if you're first. Balance speed with accuracy.
                  </p>
                </div>
                <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 rounded-lg">
                  <h3 className="font-semibold mb-2 text-blue-700 dark:text-blue-400">🎯 Know the Mode</h3>
                  <p className="text-sm text-muted-foreground">
                    Check the scoring mode for each question. Adjust your strategy accordingly!
                  </p>
                </div>
                <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 rounded-lg">
                  <h3 className="font-semibold mb-2 text-green-700 dark:text-green-400">⚡ Stay Ready</h3>
                  <p className="text-sm text-muted-foreground">
                    Questions appear one at a time. Stay focused and ready for the next question!
                  </p>
                </div>
                <div className="p-4 bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950 dark:to-violet-950 rounded-lg">
                  <h3 className="font-semibold mb-2 text-purple-700 dark:text-purple-400">📊 Learn from Stats</h3>
                  <p className="text-sm text-muted-foreground">
                    Review round statistics to see where you can improve for next time!
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Separator className="my-8" />

          {/* Call to Action */}
          <div className="text-center space-y-4 pb-8 animate-in fade-in duration-700 delay-700">
            <h2 className="text-2xl font-bold">Ready to Play?</h2>
            <p className="text-muted-foreground">
              {currentUser 
                ? 'Join a quiz room and put your knowledge to the test!' 
                : 'Log in to join a quiz room and put your knowledge to the test!'}
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              {currentUser ? (
                <>
                  <Button 
                    onClick={() => navigate('/join')} 
                    size="lg"
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Join a Quiz
                  </Button>
                  <Button 
                    onClick={() => navigate('/')} 
                    variant="outline"
                    size="lg"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Home
                  </Button>
                </>
              ) : (
                <>
                  <Button 
                    onClick={() => navigate('/login')} 
                    size="lg"
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                  >
                    <LogIn className="w-4 h-4 mr-2" />
                    Log In to Play
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HowToPlay;

