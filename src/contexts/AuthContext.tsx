import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { auth, database, secondaryAuth } from '@/lib/firebase';
import { 
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
  createUserWithEmailAndPassword
} from 'firebase/auth';
import { ref, get, set, update } from 'firebase/database';

// User roles and permissions
export type UserRole = 'admin' | 'user';

export interface Permission {
  canCreateBattles: boolean;
  canJoinBattles: boolean;
  canManageUsers: boolean;
  canDeleteBattles: boolean;
}

export interface AppUser {
  uid: string;
  userId: string; 
  email: string;
  role: UserRole;
  permissions: Permission;
  createdAt: string;
  lastLogin?: string;
}

interface AuthContextType {
  currentUser: AppUser | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  signIn: (userId: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  createUser: (userId: string, email: string, password: string, role: UserRole, permissions?: Partial<Permission>) => Promise<void>;
  updateUserPermissions: (userId: string, permissions: Partial<Permission>) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  getAllUsers: () => Promise<AppUser[]>;
  hasPermission: (permission: keyof Permission) => boolean;
  isAdmin: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

// All users are admin with full permissions
const defaultPermissions: Permission = {
  canCreateBattles: true,
  canJoinBattles: true,
  canManageUsers: true,
  canDeleteBattles: true,
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setFirebaseUser(firebaseUser);
      
      if (firebaseUser) {
        try {
          // Fetch user data from database
          const usersRef = ref(database, 'users');
          const snapshot = await get(usersRef);
          
          if (snapshot.exists()) {
            const users = snapshot.val() as Record<string, AppUser>;
            const userData = Object.values(users).find(u => u.uid === firebaseUser.uid);
            
            if (userData) {
              // Update last login
              const userRef = ref(database, `users/${userData.userId}`);
              await update(userRef, { lastLogin: new Date().toISOString() });
              
              setCurrentUser(userData);
            } else {
              console.error('User data not found in database');
              setCurrentUser(null);
            }
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          setCurrentUser(null);
        }
      } else {
        setCurrentUser(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async (userId: string, password: string) => {
    try {
      // First, get the email associated with this userId
      const userRef = ref(database, `users/${userId}`);
      const snapshot = await get(userRef);
      
      if (!snapshot.exists()) {
        throw new Error('User not found');
      }
      
      const userData = snapshot.val() as AppUser;
      
      // Sign in with email and password
      const userCredential = await signInWithEmailAndPassword(auth, userData.email, password);
      
      // Wait for user data to be loaded by fetching it directly
      // This ensures currentUser is set before navigation happens
      const usersRef = ref(database, 'users');
      const usersSnapshot = await get(usersRef);
      
      if (usersSnapshot.exists()) {
        const users = usersSnapshot.val() as Record<string, AppUser>;
        const currentUserData = Object.values(users).find(u => u.uid === userCredential.user.uid);
        
        if (currentUserData) {
          // Update last login
          await update(userRef, { lastLogin: new Date().toISOString() });
          setCurrentUser(currentUserData);
        }
      }
    } catch (error: any) {
      console.error('Sign in error:', error);
      throw new Error(error.message || 'Failed to sign in');
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setCurrentUser(null);
    } catch (error: any) {
      console.error('Sign out error:', error);
      throw new Error(error.message || 'Failed to sign out');
    }
  };

  const createUser = async (
    userId: string,
    email: string,
    password: string,
    role: UserRole = 'admin',
    permissions?: Partial<Permission>
  ) => {
    if (!currentUser || currentUser.role !== 'admin') {
      throw new Error('Only admins can create users');
    }

    try {
      // Check if userId already exists
      const userRef = ref(database, `users/${userId}`);
      const snapshot = await get(userRef);
      
      if (snapshot.exists()) {
        throw new Error('User ID already exists');
      }

      // Create user in Firebase Auth using secondary auth instance
      // This won't affect the current admin's session
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
      const authUser = userCredential.user;

      // Sign out from secondary auth immediately
      await firebaseSignOut(secondaryAuth);

      // All users get admin role with full permissions
      const fullPermissions: Permission = {
        ...defaultPermissions,
        ...permissions,
      };

      const newUser: AppUser = {
        uid: authUser.uid,
        userId,
        email,
        role: 'admin', // All users are admin
        permissions: fullPermissions,
        createdAt: new Date().toISOString(),
      };

      await set(userRef, newUser);
      
      console.log(`User created successfully: ${userId}`);
    } catch (error: any) {
      console.error('Create user error:', error);
      
      // Provide more specific error messages
      if (error.code === 'auth/email-already-in-use') {
        throw new Error('Email is already registered');
      } else if (error.code === 'auth/invalid-email') {
        throw new Error('Invalid email address');
      } else if (error.code === 'auth/weak-password') {
        throw new Error('Password should be at least 6 characters');
      }
      
      throw new Error(error.message || 'Failed to create user');
    }
  };

  const updateUserPermissions = async (userId: string, permissions: Partial<Permission>) => {
    if (!currentUser || currentUser.role !== 'admin') {
      throw new Error('Only admins can update permissions');
    }

    try {
      const userRef = ref(database, `users/${userId}`);
      const snapshot = await get(userRef);
      
      if (!snapshot.exists()) {
        throw new Error('User not found');
      }

      const userData = snapshot.val() as AppUser;
      const updatedPermissions = { ...userData.permissions, ...permissions };

      await update(userRef, { permissions: updatedPermissions });
    } catch (error: any) {
      console.error('Update permissions error:', error);
      throw new Error(error.message || 'Failed to update permissions');
    }
  };

  const deleteUser = async (userId: string) => {
    if (!currentUser || currentUser.role !== 'admin') {
      throw new Error('Only admins can delete users');
    }

    try {
      const userRef = ref(database, `users/${userId}`);
      await set(userRef, null); // Remove user from database
      
      // Note: In production, should also delete from Firebase Auth using Admin SDK
      console.log(`User ${userId} deleted from database. Please also remove from Firebase Auth.`);
    } catch (error: any) {
      console.error('Delete user error:', error);
      throw new Error(error.message || 'Failed to delete user');
    }
  };

  const getAllUsers = async (): Promise<AppUser[]> => {
    if (!currentUser || currentUser.role !== 'admin') {
      throw new Error('Only admins can view all users');
    }

    try {
      const usersRef = ref(database, 'users');
      const snapshot = await get(usersRef);
      
      if (!snapshot.exists()) {
        return [];
      }

      return Object.values(snapshot.val() as Record<string, AppUser>);
    } catch (error: any) {
      console.error('Get users error:', error);
      throw new Error(error.message || 'Failed to fetch users');
    }
  };

  const hasPermission = (permission: keyof Permission): boolean => {
    if (!currentUser) return false;
    return currentUser.permissions[permission] === true;
  };

  const isAdmin = (): boolean => {
    return currentUser?.role === 'admin';
  };

  const value: AuthContextType = {
    currentUser,
    firebaseUser,
    loading,
    signIn,
    signOut,
    createUser,
    updateUserPermissions,
    deleteUser,
    getAllUsers,
    hasPermission,
    isAdmin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
