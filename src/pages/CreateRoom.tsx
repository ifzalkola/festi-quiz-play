import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuiz } from '@/contexts/QuizContext';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

const CreateRoom = () => {
  const navigate = useNavigate();
  const { createRoom, clearRoomState } = useQuiz();
  const [roomName, setRoomName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [maxPlayers, setMaxPlayers] = useState(10);
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!roomName.trim() || !ownerName.trim()) {
      toast.error('Please fill in all fields');
      return;
    }
    
    if (maxPlayers < 2 || maxPlayers > 100) {
      toast.error('Max players must be between 2 and 100');
      return;
    }

    setIsLoading(true);
    try {
      // Clear any existing room state to prevent redirects
      clearRoomState();
      
      const roomId = await createRoom(roomName, ownerName, maxPlayers);
      localStorage.setItem('current_room_id', roomId);
      toast.success('Room created successfully!');
      navigate(`/room/${roomId}`);
    } catch (error) {
      toast.error('Failed to create room');
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
              <Sparkles className="w-8 h-8 text-primary-foreground" />
            </div>
            <CardTitle className="text-3xl">Create Quiz Room</CardTitle>
            <CardDescription>
              Set up your quiz room and invite players to join
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleCreateRoom} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="roomName">Room Name</Label>
                <Input
                  id="roomName"
                  placeholder="Friday Night Quiz"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  maxLength={50}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ownerName">Your Name</Label>
                <Input
                  id="ownerName"
                  placeholder="Quiz Master"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  maxLength={30}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxPlayers">Maximum Players</Label>
                <Input
                  id="maxPlayers"
                  type="number"
                  min="2"
                  max="100"
                  value={maxPlayers}
                  onChange={(e) => setMaxPlayers(parseInt(e.target.value) || 10)}
                />
                <p className="text-sm text-muted-foreground">
                  Choose between 2 and 100 players
                </p>
              </div>

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={isLoading}
              >
                {isLoading ? 'Creating...' : 'Create Room'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreateRoom;
