import { useState, useEffect } from 'react';
import { useAuth, AppUser, Permission, UserRole } from '@/contexts/AuthContext';
import { useQuiz, QuizRoom } from '@/contexts/QuizContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, UserPlus, Shield, Trash2, Edit, Users, Home, Eye, Play } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const { currentUser, isAdmin, getAllUsers, createUser, updateUserPermissions, deleteUser, signOut } = useAuth();
  const { getAllRooms, deleteRoom } = useQuiz();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [rooms, setRooms] = useState<QuizRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [roomsLoading, setRoomsLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const navigate = useNavigate();

  // Create user form state
  const [newUserId, setNewUserId] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('user');
  const [newPermissions, setNewPermissions] = useState<Permission>({
    canCreateRooms: true,
    canJoinRooms: true,
    canManageUsers: false,
    canDeleteRooms: false,
  });

  // Edit permissions state
  const [editPermissions, setEditPermissions] = useState<Permission>({
    canCreateRooms: true,
    canJoinRooms: true,
    canManageUsers: false,
    canDeleteRooms: false,
  });

  useEffect(() => {
    if (!isAdmin()) {
      navigate('/');
      return;
    }
    loadUsers();
    loadRooms();
  }, [isAdmin, navigate]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const allUsers = await getAllUsers();
      setUsers(allUsers);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const loadRooms = async () => {
    try {
      setRoomsLoading(true);
      const allRooms = await getAllRooms();
      setRooms(allRooms);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load rooms');
    } finally {
      setRoomsLoading(false);
    }
  };

  const handleDeleteRoom = async (roomId: string, roomName: string) => {
    if (!confirm(`Are you sure you want to delete "${roomName}"? This action cannot be undone.`)) {
      return;
    }
    
    try {
      await deleteRoom(roomId);
      toast.success('Room deleted successfully!');
      loadRooms();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete room');
    }
  };

  const getRoomStatusBadge = (room: QuizRoom) => {
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

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await createUser(newUserId, newEmail, newPassword, newRole, newPermissions);
      toast.success(`User ${newUserId} created successfully!`);
      toast.success(`User can now login with User ID: ${newUserId}`);
      
      // Reset form
      setNewUserId('');
      setNewEmail('');
      setNewPassword('');
      setNewRole('user');
      setNewPermissions({
        canCreateRooms: true,
        canJoinRooms: true,
        canManageUsers: false,
        canDeleteRooms: true,
      });
      setCreateDialogOpen(false);
      
      loadUsers();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create user');
    }
  };

  const handleUpdatePermissions = async () => {
    if (!editingUser) return;
    
    try {
      await updateUserPermissions(editingUser.userId, editPermissions);
      toast.success('Permissions updated successfully!');
      setEditingUser(null);
      loadUsers();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update permissions');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm(`Are you sure you want to delete user ${userId}?`)) {
      return;
    }
    
    try {
      await deleteUser(userId);
      toast.success('User deleted successfully!');
      loadUsers();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete user');
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error: any) {
      toast.error(error.message || 'Failed to sign out');
    }
  };

  if (!isAdmin()) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="h-8 w-8 text-blue-600" />
                <div>
                  <CardTitle className="text-2xl">{isAdmin() ? 'Admin Dashboard' : 'My Dashboard'}</CardTitle>
                  <CardDescription>
                    {isAdmin() 
                      ? 'Manage users, permissions, and quiz rooms' 
                      : 'Manage your quiz rooms and view your activity'
                    }
                  </CardDescription>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => navigate('/')}>
                  Back to Home
                </Button>
                <Button variant="outline" onClick={handleSignOut}>
                  Sign Out
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Current User Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Logged in as</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Badge variant="default">{currentUser?.role}</Badge>
              <span className="font-mono">{currentUser?.userId}</span>
              <span className="text-muted-foreground">{currentUser?.email}</span>
            </div>
          </CardContent>
        </Card>

        {/* Users List - Only for Admins */}
        {isAdmin() && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  <CardTitle>Users ({users.length})</CardTitle>
                </div>
                <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Create User
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Create New User</DialogTitle>
                      <DialogDescription>
                        Add a new user with admin privileges. User will be created in both Firebase Auth and Database.
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreateUser} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="userId">User ID *</Label>
                        <Input
                          id="userId"
                          value={newUserId}
                          onChange={(e) => setNewUserId(e.target.value)}
                          placeholder="e.g., john_doe"
                          required
                        />
                        <p className="text-xs text-muted-foreground">Unique identifier for login</p>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="email">Email *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={newEmail}
                          onChange={(e) => setNewEmail(e.target.value)}
                          placeholder="user@example.com"
                          required
                        />
                        <p className="text-xs text-muted-foreground">Must be a valid email address</p>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="password">Password *</Label>
                        <Input
                          id="password"
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Minimum 6 characters"
                          required
                          minLength={6}
                        />
                        <p className="text-xs text-muted-foreground">User will use this to login</p>
                      </div>
                      
                      <Button type="submit" className="w-full">Create User</Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                </div>
              ) : users.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No users found
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User ID</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Permissions</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Last Login</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.userId}>
                          <TableCell className="font-mono">{user.userId}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                              {user.role}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1 flex-wrap">
                              {user.permissions.canCreateRooms && <Badge variant="outline" className="text-xs">Create</Badge>}
                              {user.permissions.canJoinRooms && <Badge variant="outline" className="text-xs">Join</Badge>}
                              {user.permissions.canManageUsers && <Badge variant="outline" className="text-xs">Manage</Badge>}
                              {user.permissions.canDeleteRooms && <Badge variant="outline" className="text-xs">Delete</Badge>}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-2 justify-end">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setEditingUser(user);
                                  setEditPermissions(user.permissions);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              {user.role !== 'admin' && (
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleDeleteUser(user.userId)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Rooms Management */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Home className="h-5 w-5" />
                <CardTitle>
                  {isAdmin() ? `Quiz Rooms (${rooms.length})` : `My Quiz Rooms (${rooms.length})`}
                </CardTitle>
              </div>
              <Button onClick={() => navigate('/create')}>
                <UserPlus className="mr-2 h-4 w-4" />
                Create Room
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {roomsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : rooms.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {isAdmin() ? 'No rooms found' : 'You haven\'t created any rooms yet'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Room Name</TableHead>
                      <TableHead>Code</TableHead>
                      {isAdmin() && <TableHead>Owner</TableHead>}
                      <TableHead>Status</TableHead>
                      <TableHead>Questions</TableHead>
                      <TableHead>Max Players</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rooms.map((room) => (
                      <TableRow key={room.id}>
                        <TableCell className="font-medium">{room.name}</TableCell>
                        <TableCell className="font-mono">{room.code}</TableCell>
                        {isAdmin() && <TableCell>{room.ownerName}</TableCell>}
                        <TableCell>{getRoomStatusBadge(room)}</TableCell>
                        <TableCell>{room.questions ? room.questions.length : 0}</TableCell>
                        <TableCell>{room.maxPlayers}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {room.createdAt.toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => navigate(`/edit-room/${room.id}`)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => navigate(`/room/${room.id}`)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {room.questions && room.questions.length > 0 && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => navigate(`/room/${room.id}/control`)}
                                disabled={room.isStarted}
                              >
                                <Play className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteRoom(room.id, room.name)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Permissions Dialog */}
        <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Permissions</DialogTitle>
              <DialogDescription>
                Update permissions for {editingUser?.userId}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-3">
                <Label>Permissions</Label>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="edit-canCreateRooms" className="font-normal">Can Create Rooms</Label>
                    <Switch
                      id="edit-canCreateRooms"
                      checked={editPermissions.canCreateRooms}
                      onCheckedChange={(checked) => 
                        setEditPermissions({ ...editPermissions, canCreateRooms: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="edit-canJoinRooms" className="font-normal">Can Join Rooms</Label>
                    <Switch
                      id="edit-canJoinRooms"
                      checked={editPermissions.canJoinRooms}
                      onCheckedChange={(checked) => 
                        setEditPermissions({ ...editPermissions, canJoinRooms: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="edit-canManageUsers" className="font-normal">Can Manage Users</Label>
                    <Switch
                      id="edit-canManageUsers"
                      checked={editPermissions.canManageUsers}
                      onCheckedChange={(checked) => 
                        setEditPermissions({ ...editPermissions, canManageUsers: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="edit-canDeleteRooms" className="font-normal">Can Delete Rooms</Label>
                    <Switch
                      id="edit-canDeleteRooms"
                      checked={editPermissions.canDeleteRooms}
                      onCheckedChange={(checked) => 
                        setEditPermissions({ ...editPermissions, canDeleteRooms: checked })
                      }
                    />
                  </div>
                </div>
              </div>
              <Button onClick={handleUpdatePermissions} className="w-full">
                Update Permissions
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default AdminDashboard;
