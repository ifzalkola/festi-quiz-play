# Admin Scripts

This directory contains scripts for managing users in the Firebase Authentication system.

## Prerequisites

1. Install Firebase Admin SDK:
```bash
npm install firebase-admin
```

2. Download your Firebase service account key:
   - Go to Firebase Console
   - Navigate to Project Settings > Service Accounts
   - Click "Generate New Private Key"
   - Save the JSON file as `firebase-service-account.json` in the project root
   - **IMPORTANT**: Add this file to `.gitignore` to keep it secure

3. Set your database URL in the scripts or as an environment variable:
```bash
export VITE_FIREBASE_DATABASE_URL="https://your-project.firebaseio.com"
```

## Scripts

### init-admin.js

Initializes the default admin user (`ifzalkola`) with full permissions.

**Usage:**
```bash
node scripts/init-admin.js
```

**What it does:**
- Creates Firebase Auth user with email `admin@quiz.app`
- Creates database entry with user ID `ifzalkola`
- Sets up admin permissions
- Links Auth UID with database entry

**Default credentials:**
- User ID: `ifzalkola`
- Email: `admin@quiz.app`
- Password: `admin123`

⚠️ **IMPORTANT**: Change the password after first login!

### create-user.js

Creates a new user with both Firebase Auth and Database entries.

**Usage:**
```bash
node scripts/create-user.js <userId> <email> <password> <role>
```

**Example:**
```bash
node scripts/create-user.js john_doe john@example.com password123 user
```

**Parameters:**
- `userId`: Unique identifier for the user (e.g., "john_doe")
- `email`: User's email address
- `password`: User's password (minimum 6 characters)
- `role`: Either "admin" or "user"

**What it does:**
- Creates Firebase Auth user
- Creates database entry with appropriate permissions
- Links Auth UID with database entry

## Security Notes

1. **Never commit** the `firebase-service-account.json` file
2. Use strong passwords for all users
3. Change default admin password immediately
4. Run these scripts only in secure environments
5. Keep the service account key secure

## Troubleshooting

### "Cannot find module './firebase-service-account.json'"
- Make sure you've downloaded the service account key
- Place it in the project root directory
- Update the path in the script if you placed it elsewhere

### "Permission denied" errors
- Verify your service account has the correct permissions
- Check that your database URL is correct
- Ensure Firebase Admin SDK is properly initialized

### "Email already exists"
- The email is already registered in Firebase Auth
- Use a different email or delete the existing user first

### "User ID already exists"
- The user ID is already taken in the database
- Choose a different user ID
