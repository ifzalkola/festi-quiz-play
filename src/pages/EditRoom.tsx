import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useQuiz, QuizRoom } from '@/contexts/QuizContext';
import { ArrowLeft, Sparkles, Save, Trash2, Eye, Play } from 'lucide-react';
import { toast } from 'sonner';

const EditRoom = () => {
  const navigate = useNavigate();
  const { roomId } = useParams<{ roomId: string }>();
  const { getAllRooms, updateRoom, deleteRoom } = useQuiz();
  
  const [room, setRoom] = useState<QuizRoom | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  // Form state
  const [roomName, setRoomName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [maxPlayers, setMaxPlayers] = useState(10);

  useEffect(() => {
    if (!roomId) {
      navigate('/admin');
      return;
    }
    
    loadRoom();
  }, [roomId, navigate]);

  const loadRoom = async () => {
    try {
      setLoading(true);
      const rooms = await getAllRooms();
      const foundRoom = rooms.find(r => r.id === roomId);
      
      if (!foundRoom) {
        toast.error('Room not found');
        navigate('/admin');
        return;
      }
      
      setRoom(foundRoom);
      setRoomName(foundRoom.name);
      setOwnerName(foundRoom.ownerName);
      setMaxPlayers(foundRoom.maxPlayers);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load room');
      navigate('/admin');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!room || !roomId) return;
    
    if (!roomName.trim() || !ownerName.trim()) {
      toast.error('Please fill in all fields');
      return;
    }
    
    if (maxPlayers < 2 || maxPlayers > 100) {
      toast.error('Max players must be between 2 and 100');
      return;
    }

    setSaving(true);
    try {
      await updateRoom(roomId, {
        name: roomName,
        ownerName: ownerName,
        maxPlayers: maxPlayers
      });
      
      toast.success('Room updated successfully!');
      navigate('/admin');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update room');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!room || !roomId) return;
    
    if (!confirm(`Are you sure you want to delete "${room.name}"? This action cannot be undone.`)) {
      return;
    }
    
    setDeleting(true);
    try {
      await deleteRoom(roomId);
      toast.success('Room deleted successfully!');
      navigate('/admin');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete room');
    } finally {
      setDeleting(false);
    }
  };

  const getStatusBadge = () => {
    if (!room) return null;
    
    if (room.isCompleted) {
      return <Badge variant="secondary">Completed</Badge>;
    } else if (room.isStarted) {
      return <Badge variant="destructive">In Progress</Badge>;
    } else if (room.isPublished) {
      return <Badge variant="default">Published</Badge>;
    } else {
      return <Badge variant="outline">Draft</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 p-4 sm:p-6 lg:p-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading room...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 p-4 sm:p-6 lg:p-8">
        <div className="max-w-2xl mx-auto">
          <Alert variant="destructive">
            <AlertDescription>Room not found</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 p-4 sm:p-6 lg:p-8">
      <div className="max-w-2xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate('/admin')}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Admin Dashboard
        </Button>

        <Card className="border-border/50">
          <CardHeader className="text-center space-y-2">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center mb-4">
              <Sparkles className="w-8 h-8 text-primary-foreground" />
            </div>
            <CardTitle className="text-3xl">Edit Quiz Room</CardTitle>
            <CardDescription>
              Update room settings and manage the quiz
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Room Status */}
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div>
                <p className="font-medium">Room Status</p>
                <p className="text-sm text-muted-foreground">Current state of the room</p>
              </div>
              {getStatusBadge()}
            </div>

            {/* Room Info */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
              <div>
                <p className="text-sm font-medium">Room Code</p>
                <p className="text-lg font-mono">{room.code}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Questions</p>
                <p className="text-lg">{room.questions ? room.questions.length : 0}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Created</p>
                <p className="text-sm">{room.createdAt.toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Owner</p>
                <p className="text-sm">{room.ownerName}</p>
              </div>
            </div>

            {/* Edit Form */}
            <form onSubmit={handleSave} className="space-y-6">
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
                <Label htmlFor="ownerName">Owner Name</Label>
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

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  type="submit"
                  className="flex-1"
                  size="lg"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(`/room/${roomId}`)}
                  disabled={saving || deleting}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  View Room
                </Button>
                
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={saving || deleting}
                >
                  {deleting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </>
                  )}
                </Button>
              </div>
            </form>

            {/* Quick Actions */}
            {room.questions && room.questions.length > 0 && (
              <div className="pt-4 border-t">
                <p className="text-sm font-medium mb-3">Quick Actions</p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/room/${roomId}/control`)}
                    disabled={room.isStarted}
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Manage Quiz
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/leaderboard/${roomId}`)}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View Leaderboard
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EditRoom;
