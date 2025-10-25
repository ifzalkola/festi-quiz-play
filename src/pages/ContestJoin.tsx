import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useQuiz } from '@/contexts/QuizContext';
import { useAuth } from '@/contexts/AuthContext';
import { Hash, ArrowLeft, Trophy, Users, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { ThemeToggle } from '@/components/ThemeToggle';

const ContestJoin = () => {
  const navigate = useNavigate();
  const { getContestByCode, canAccessContest } = useQuiz();
  const { hasPermission } = useAuth();
  const [contestCode, setContestCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleJoinContest = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!contestCode.trim()) {
      setError('Please enter a contest code');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Find contest by code
      const contest = await getContestByCode(contestCode.trim().toUpperCase());
      
      if (!contest) {
        setError('Contest not found. Please check the code and try again.');
        return;
      }

      // Check if user can access this contest
      const canAccess = await canAccessContest(contest.id);
      
      if (!canAccess) {
        setError('You do not have access to this contest. You need to be a player in one of the contest battles.');
        return;
      }

      // Navigate to contest page
      navigate(`/contest/${contest.id}`);
      
    } catch (error: any) {
      setError(error.message || 'Failed to join contest');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-blue-400 to-purple-500 dark:from-blue-500 dark:to-purple-600 flex items-center justify-center shadow-lg">
            <Trophy className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Join Contest</h1>
            <p className="text-muted-foreground">
              Enter the contest code to view the leaderboard
            </p>
          </div>
          <div className="flex items-center justify-center gap-2">
            <ThemeToggle />
            <Button variant="outline" onClick={() => navigate('/')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </div>
        </div>

        {/* Join Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Hash className="w-5 h-5" />
              Contest Code
            </CardTitle>
            <CardDescription>
              Enter the contest code provided by the contest organizer
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleJoinContest} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="contestCode">Contest Code</Label>
                <Input
                  id="contestCode"
                  value={contestCode}
                  onChange={(e) => setContestCode(e.target.value.toUpperCase())}
                  placeholder="Enter contest code"
                  className="text-center font-mono text-lg tracking-wider"
                  maxLength={6}
                  required
                />
                <p className="text-xs text-muted-foreground text-center">
                  Contest codes are 6 characters long
                </p>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Joining Contest...
                  </>
                ) : (
                  <>
                    <Trophy className="w-4 h-4 mr-2" />
                    View Contest
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/50">
          <CardContent className="pt-6">
            <div className="space-y-3">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                How to join a contest:
              </h3>
              <div className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
                <div className="flex items-start gap-2">
                  <span className="font-semibold">1.</span>
                  <span>Get the contest code from the contest organizer</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-semibold">2.</span>
                  <span>Make sure you're a player in at least one of the contest battles</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-semibold">3.</span>
                  <span>Enter the code above to view the contest leaderboard</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Admin Note */}
        {hasPermission('canManageUsers') && (
          <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950/50">
            <CardContent className="pt-6">
              <div className="space-y-2">
                <h3 className="font-semibold text-yellow-900 dark:text-yellow-100">
                  Admin Access
                </h3>
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  As an admin, you can access any contest. You can also create new contests from the admin dashboard.
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => navigate('/admin')}
                  className="mt-2"
                >
                  Go to Admin Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ContestJoin;
