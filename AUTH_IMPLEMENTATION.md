# Firebase Authentication Implementation

## Overview

This document describes the Firebase Authentication implementation for the Quiz Platform. The system uses Firebase Authentication combined with a custom user management system that supports role-based access control (RBAC) and granular permissions.

## Architecture

### Authentication Flow

1. **User Login**: Users log in with their User ID and password
2. **Credential Lookup**: System looks up the email associated with the User ID
3. **Firebase Auth**: Authenticates using Firebase Authentication
4. **User Data Fetch**: Fetches user profile and permissions from Realtime Database
5. **Session Management**: Maintains authenticated state throughout the application

### Components

#### 1. AuthContext (`src/contexts/AuthContext.tsx`)

The central authentication context that provides:
- Current user state
- Authentication methods (signIn, signOut)
- User management methods (createUser, updateUserPermissions, deleteUser)
- Permission checking utilities

**Key Features:**
- Automatic default admin initialization
- Real-time auth state synchronization
- Last login tracking
- Role-based permission system

#### 2. ProtectedRoute Component (`src/components/ProtectedRoute.tsx`)

A wrapper component that:
- Guards routes requiring authentication
- Supports admin-only routes
- Shows loading state during auth check
- Redirects unauthenticated users to login

#### 3. Login Page (`src/pages/Login.tsx`)

User-facing login interface with:
- User ID and password inputs
- Error handling and display
- Loading states
- Default admin credentials display

#### 4. Admin Dashboard (`src/pages/AdminDashboard.tsx`)

Comprehensive admin interface for:
- Viewing all users
- Creating new users
- Editing user permissions
- Deleting users (except default admin)
- Managing roles

## User Management

### User Roles

#### Admin
- Full access to all features
- Can manage other users
- Can create, edit, and delete quiz rooms
- Access to Admin Dashboard

#### User
- Access based on assigned permissions
- Cannot manage other users
- Limited administrative capabilities

### Permissions

| Permission | Description | Default Admin | Default User |
|------------|-------------|---------------|--------------|
| `canCreateRooms` | Create new quiz rooms | ✓ | ✓ |
| `canJoinRooms` | Join existing quiz rooms | ✓ | ✓ |
| `canManageUsers` | Create/edit/delete users | ✓ | ✗ |
| `canDeleteRooms` | Delete quiz rooms | ✓ | ✗ |

### Default Admin User

The system creates a default admin user on first initialization:

- **User ID**: `ifzalkola`
- **Email**: `admin@quiz.app`
- **Password**: `admin123` (should be changed immediately)
- **Role**: Admin
- **Permissions**: All permissions enabled

## Database Structure

### Users Node
```json
{
  "users": {
    "ifzalkola": {
      "uid": "firebase_auth_uid",
      "userId": "ifzalkola",
      "email": "admin@quiz.app",
      "role": "admin",
      "permissions": {
        "canCreateRooms": true,
        "canJoinRooms": true,
        "canManageUsers": true,
        "canDeleteRooms": true
      },
      "createdAt": "2025-10-20T...",
      "lastLogin": "2025-10-20T..."
    }
  }
}
```

## Integration with QuizContext

The `QuizContext` has been updated to use authenticated users:

### Changes Made:

1. **Removed Random ID Generation**: Eliminated the random user ID generation system
2. **Auth Integration**: Integrated with `AuthContext` to get current user
3. **Permission Checks**: Added permission checks before operations:
   - Creating rooms requires `canCreateRooms` permission
   - Joining rooms requires `canJoinRooms` permission
4. **User Tracking**: Players are now tracked by their authenticated user ID

### Example Usage:

```typescript
const { createRoom } = useQuiz();
const { currentUser, hasPermission } = useAuth();

if (hasPermission('canCreateRooms')) {
  await createRoom('My Quiz', currentUser.userId, 10);
}
```

## Security Considerations

### Firebase Security Rules

The Realtime Database security rules should be configured to:

1. Require authentication for all read/write operations
2. Restrict user management to admins only
3. Allow users to update their own data
4. Prevent deletion of the default admin user

Example rules:
```json
{
  "rules": {
    "users": {
      ".read": "auth != null",
      "$userId": {
        ".write": "auth != null && (root.child('users').child(auth.uid).child('role').val() === 'admin' || auth.uid === data.child('uid').val())"
      }
    },
    "rooms": {
      ".read": "auth != null",
      "$roomId": {
        ".write": "auth != null"
      }
    }
  }
}
```

### Best Practices Implemented

1. **Password Security**: Minimum 6 characters enforced by Firebase
2. **Protected Admin**: Default admin cannot be deleted
3. **Permission Validation**: All operations check permissions
4. **Session Management**: Automatic session persistence
5. **Error Handling**: Comprehensive error messages for auth failures

## Setup Instructions

### Quick Start

1. **Enable Firebase Authentication**
   ```bash
   # In Firebase Console
   - Go to Authentication > Sign-in method
   - Enable Email/Password
   ```

2. **Create Default Admin**
   ```bash
   # Option 1: Use the initialization script
   npm install firebase-admin
   node scripts/init-admin.js
   
   # Option 2: Manual setup via Firebase Console
   # Follow instructions in SETUP_AUTH.md
   ```

3. **Login**
   ```bash
   # Navigate to your app
   # Go to /login
   # Use credentials:
   User ID: ifzalkola
   Password: admin123
   ```

4. **Change Password** (Important!)
   - After first login, change the default password
   - Use Firebase Console or implement password reset

### Creating Additional Users

#### Via Admin Dashboard
1. Login as admin
2. Navigate to `/admin`
3. Click "Create User"
4. Fill in the form and set permissions
5. **Important**: Also create Firebase Auth user with same email

#### Via Script
```bash
node scripts/create-user.js john_doe john@example.com password123 user
```

## Testing

### Test Scenarios

1. **Login Flow**
   - ✓ Login with valid credentials
   - ✓ Login with invalid credentials
   - ✓ Login with non-existent user
   - ✓ Session persistence after refresh

2. **Permission Checks**
   - ✓ Admin can access admin dashboard
   - ✓ Regular user cannot access admin dashboard
   - ✓ User with canCreateRooms can create rooms
   - ✓ User without canCreateRooms cannot create rooms

3. **User Management**
   - ✓ Admin can create users
   - ✓ Admin can edit permissions
   - ✓ Admin can delete users
   - ✓ Cannot delete default admin
   - ✓ Regular user cannot manage users

## Troubleshooting

### Common Issues

**Issue**: "User not found" when logging in
- **Solution**: Ensure user exists in both Firebase Auth and Database
- Check that UIDs match between Auth and Database

**Issue**: "You do not have permission"
- **Solution**: Check user permissions in Admin Dashboard
- Verify role is set correctly

**Issue**: Cannot access Admin Dashboard
- **Solution**: Ensure user role is "admin"
- Check that authentication is successful

**Issue**: Firebase Auth user created but login fails
- **Solution**: Ensure database entry exists at `users/{userId}`
- Verify the UID in database matches Firebase Auth UID

## Future Enhancements

Potential improvements to consider:

1. **Password Reset**: Email-based password reset
2. **Email Verification**: Verify email addresses on signup
3. **Multi-Factor Auth**: Add 2FA for enhanced security
4. **Audit Logs**: Track user actions and changes
5. **Bulk User Import**: CSV/JSON import for multiple users
6. **Password Policies**: Enforce stronger password requirements
7. **Session Timeout**: Automatic logout after inactivity
8. **OAuth Integration**: Google/Facebook login options

## API Reference

### AuthContext Methods

```typescript
// Sign in with user ID and password
await signIn(userId: string, password: string): Promise<void>

// Sign out current user
await signOut(): Promise<void>

// Create a new user (admin only)
await createUser(
  userId: string,
  email: string,
  password: string,
  role: UserRole,
  permissions?: Partial<Permission>
): Promise<void>

// Update user permissions (admin only)
await updateUserPermissions(
  userId: string,
  permissions: Partial<Permission>
): Promise<void>

// Delete user (admin only)
await deleteUser(userId: string): Promise<void>

// Get all users (admin only)
await getAllUsers(): Promise<AppUser[]>

// Check if user has specific permission
hasPermission(permission: keyof Permission): boolean

// Check if user is admin
isAdmin(): boolean
```

## Migration Guide

If you have an existing application, follow these steps to migrate:

1. **Backup Data**: Export all existing data
2. **Update Code**: Pull the latest authentication changes
3. **Install Dependencies**: No new dependencies required
4. **Configure Firebase**: Enable Email/Password authentication
5. **Create Admin**: Run initialization script
6. **Migrate Users**: Create user accounts for existing users
7. **Update Security Rules**: Apply new security rules
8. **Test**: Thoroughly test all functionality
9. **Deploy**: Deploy to production

## Support

For issues or questions:
1. Check this documentation
2. Review SETUP_AUTH.md
3. Check Firebase Console for auth logs
4. Review browser console for errors
5. Check Firebase Realtime Database for data integrity
