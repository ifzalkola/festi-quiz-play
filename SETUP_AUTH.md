# Firebase Authentication Setup Guide

## Overview
This application now uses Firebase Authentication with custom user management. Admin users can create and manage other users with specific permissions.

## Initial Setup Steps

### 1. Enable Firebase Authentication

1. Go to your Firebase Console
2. Navigate to Authentication > Sign-in method
3. Enable **Email/Password** authentication
4. Save changes

### 2. Create Default Admin User

The default admin user has the following credentials:
- **User ID**: `ifzalkola`
- **Email**: `admin@quiz.app`
- **Password**: `admin123` (change this after first login!)

#### Steps to create the admin user in Firebase:

1. Open Firebase Console > Authentication > Users
2. Click "Add user"
3. Enter:
   - Email: `admin@quiz.app`
   - Password: `admin123`
4. Click "Add user"
5. Copy the UID of the newly created user
6. Go to Firebase Console > Realtime Database
7. Navigate to the `users/ifzalkola` node
8. Update the `uid` field with the UID you copied in step 5

Alternatively, you can use the Firebase Admin SDK or run this in your Firebase Functions:

```javascript
const admin = require('firebase-admin');

// Initialize admin SDK
admin.initializeApp();

// Create default admin user
async function createDefaultAdmin() {
  try {
    const userRecord = await admin.auth().createUser({
      email: 'admin@quiz.app',
      password: 'admin123',
      uid: 'admin_default', // Optional: specify custom UID
      displayName: 'System Admin'
    });
    
    console.log('Successfully created admin user:', userRecord.uid);
    
    // Update the database entry
    await admin.database().ref('users/ifzalkola').update({
      uid: userRecord.uid
    });
    
    console.log('Admin user setup complete!');
  } catch (error) {
    console.error('Error creating admin user:', error);
  }
}

createDefaultAdmin();
```

### 3. Update Firebase Security Rules

Update your Realtime Database security rules to require authentication:

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
    },
    "players": {
      ".read": "auth != null",
      "$playerId": {
        ".write": "auth != null"
      }
    },
    "currentQuestions": {
      ".read": "auth != null",
      "$roomId": {
        ".write": "auth != null"
      }
    },
    "answers": {
      ".read": "auth != null",
      "$roomId": {
        ".write": "auth != null"
      }
    }
  }
}
```

## User Management

### Creating New Users

Only admin users can create new users through the Admin Dashboard:

1. Log in with admin credentials
2. Navigate to `/admin`
3. Click "Create User"
4. Fill in the form:
   - User ID (unique identifier)
   - Email
   - Password
   - Role (admin or user)
   - Permissions (checkboxes)
5. Click "Create User"
6. **IMPORTANT**: Also create the corresponding Firebase Auth user with the same email through Firebase Console

### User Roles

- **Admin**: Full access to all features including user management
- **User**: Limited access based on assigned permissions

### Permissions

- `canCreateRooms`: Allows user to create quiz rooms
- `canJoinRooms`: Allows user to join quiz rooms
- `canManageUsers`: Allows user to manage other users (admin only)
- `canDeleteRooms`: Allows user to delete quiz rooms

## Security Notes

1. **Change Default Password**: Immediately change the default admin password after first login
2. **Firebase Auth Required**: All users must have a corresponding Firebase Auth account
3. **Two-Step User Creation**: Currently requires creating users in both the database and Firebase Auth
4. **Protected Routes**: All application routes require authentication
5. **Permission Checks**: Operations check user permissions before execution

## Production Recommendations

1. Use Firebase Admin SDK to create users programmatically
2. Implement password reset functionality
3. Add email verification
4. Set up proper security rules based on your requirements
5. Enable multi-factor authentication for admin accounts
6. Regular security audits and user access reviews

## Troubleshooting

### "User not found" error when logging in
- Ensure the user exists in both Firebase Auth and the Realtime Database
- Verify the UIDs match between Auth and Database

### "You do not have permission" error
- Check user permissions in the Admin Dashboard
- Verify the user's role and permission settings

### Cannot access Admin Dashboard
- Ensure user role is set to "admin"
- Check that user is properly authenticated

## Environment Variables

Make sure these Firebase environment variables are set:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://your_project.firebaseio.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```
