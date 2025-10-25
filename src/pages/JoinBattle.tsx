import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useQuiz } from '@/contexts/QuizContext';
import { ArrowLeft, Users, RefreshCw, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

const JoinBattle = () => {
  const navigate = useNavigate();
  const { joinBattle, canRejoinBattle } = useQuiz();
  const [battleCode, setBattleCode] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [rejoinInfo, setRejoinInfo] = useState<{ canRejoin: boolean; playerName?: string; message?: string } | null>(null);
  const [isCheckingRejoin, setIsCheckingRejoin] = useState(false);

  const handleCheckRejoin = async () => {
    if (!battleCode.trim()) {
      toast.error('Please enter a battle code');
      return;
    }

    setIsCheckingRejoin(true);
    try {
      const result = await canRejoinBattle(battleCode.toUpperCase());
      setRejoinInfo(result);
      if (result.canRejoin && result.playerName) {
        setPlayerName(result.playerName);
      }
    } catch (error) {
      toast.error('Failed to check rejoin status');
      console.error(error);
    } finally {
      setIsCheckingRejoin(false);
    }
  };

  const handleJoinBattle = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!battleCode.trim() || !playerName.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      await joinBattle(battleCode.toUpperCase(), playerName);
      if (rejoinInfo?.canRejoin) {
        toast.success('Rejoined battle successfully! Your progress has been restored.');
      } else {
        toast.success('Joined battle successfully!');
      }
      navigate(`/lobby`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to join battle';
      toast.error(errorMessage);
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 p-4 sm:p-6 lg:p-8">
      <div className="max-w-2xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Button>

        <Card className="border-border/50">
          <CardHeader className="text-center space-y-2">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center mb-4">
              <Users className="w-8 h-8 text-primary-foreground" />
            </div>
            <CardTitle className="text-3xl">Join Quiz Battle</CardTitle>
            <CardDescription>
              Enter the battle code shared by your quiz host
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleJoinBattle} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="battleCode">Battle Code</Label>
                <div className="flex gap-2">
                  <Input
                    id="battleCode"
                    placeholder="ABC123"
                    value={battleCode}
                    onChange={(e) => {
                      setBattleCode(e.target.value.toUpperCase());
                      setRejoinInfo(null); // Clear rejoin info when battle code changes
                    }}
                    maxLength={6}
                    className="text-center text-2xl tracking-widest font-mono flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCheckRejoin}
                    disabled={isCheckingRejoin || !battleCode.trim()}
                    className="px-4"
                  >
                    {isCheckingRejoin ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Rejoin Status */}
              {rejoinInfo && (
                <Alert className={rejoinInfo.canRejoin ? 'border-green-500 bg-green-50' : 'border-blue-500 bg-blue-50'}>
                  <AlertDescription className="flex items-center gap-2">
                    {rejoinInfo.canRejoin ? (
                      <>
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-green-800">
                          Welcome back! You can rejoin as <strong>{rejoinInfo.playerName}</strong>. 
                          Your progress will be restored.
                        </span>
                      </>
                    ) : (
                      <>
                        <Users className="w-4 h-4 text-blue-600" />
                        <span className="text-blue-800">{rejoinInfo.message}</span>
                      </>
                    )}
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="playerName">Your Name</Label>
                <Input
                  id="playerName"
                  placeholder="Enter your name"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  maxLength={30}
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={isLoading}
                variant={rejoinInfo?.canRejoin ? 'default' : 'default'}
              >
                {isLoading 
                  ? (rejoinInfo?.canRejoin ? 'Rejoining...' : 'Joining...') 
                  : (rejoinInfo?.canRejoin ? 'Rejoin Battle' : 'Join Battle')
                }
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default JoinBattle;
