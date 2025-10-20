# Debug: Permission Denied Login Issue

If you're getting "Permission denied" even with open rules, follow these steps:

## Step 1: Check Browser Console

1. Open your browser's Developer Tools (Press F12)
2. Go to the "Console" tab
3. Try to login
4. Look for the exact error message
5. Take a screenshot and share the full error

**What to look for:**
- Does it say "PERMISSION_DENIED"?
- Is there a Firebase error code?
- What's the exact error path?

## Step 2: Verify Firebase Realtime Database is Created

**This is the most common issue!**

1. Go to Firebase Console: https://console.firebase.google.com
2. Select your project
3. Click **"Realtime Database"** in the left menu

**Do you see:**
- ❌ A button saying "Create Database"? → **YOU NEED TO CREATE IT!**
- ✅ A database with data/rules tabs? → Good, it exists

### If you need to create the database:

1. Click **"Create Database"**
2. Choose a location (e.g., us-central1)
3. Select **"Start in test mode"**
4. Click **"Enable"**

## Step 3: Verify Database URL

1. Check your `.env` file
2. Look at `VITE_FIREBASE_DATABASE_URL`

**It should look like:**
```
VITE_FIREBASE_DATABASE_URL=https://YOUR-PROJECT-ID-default-rtdb.firebaseio.com
```

**Common mistakes:**
- ❌ Missing the URL entirely
- ❌ Wrong region (firebaseio.com vs asia-southeast1.firebasedatabase.app)
- ❌ Wrong project ID

### How to get the correct URL:

1. Firebase Console → Project Settings (gear icon)
2. Scroll down to "Your apps"
3. Look for "databaseURL" in the config

## Step 4: Check Current Security Rules

1. Go to Firebase Console → Realtime Database → Rules
2. What do the current rules show?

**Try setting them to the most open possible (TEMPORARILY):**

```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

Click **"Publish"** and wait 30 seconds.

⚠️ **Warning:** These rules are NOT secure. Only use for testing!

## Step 5: Verify User Data Exists in Database

1. Go to Firebase Console → Realtime Database → **Data** tab
2. Do you see any data at all?

**You should see:**
```
└── users
    └── ifzalkola
        ├── uid: "..."
        ├── userId: "ifzalkola"
        ├── email: "admin@quiz.app"
        ├── role: "admin"
        ├── permissions: {...}
        └── createdAt: "..."
```

### If the data doesn't exist:

**Manually add it:**

1. Click the **"+"** icon at the root level
2. Name: `users` → Click "+"
3. Name: `ifzalkola` → Add children:
   - `uid` = (copy from Authentication)
   - `userId` = `ifzalkola`
   - `email` = `admin@quiz.app`
   - `role` = `admin`
   - `createdAt` = `2025-10-20T00:00:00.000Z`
4. Add a child `permissions` with:
   - `canCreateRooms` = `true` (boolean)
   - `canJoinRooms` = `true` (boolean)
   - `canManageUsers` = `true` (boolean)
   - `canDeleteRooms` = `true` (boolean)

## Step 6: Test Database Connection Directly

Let's create a simple test to verify the database works.

Add this temporarily to your `src/pages/Login.tsx`:

```typescript
import { ref, get } from 'firebase/database';
import { database } from '@/lib/firebase';

// Add this function
const testDatabaseConnection = async () => {
  try {
    console.log('Testing database connection...');
    const testRef = ref(database, '/');
    const snapshot = await get(testRef);
    console.log('✅ Database connected successfully!');
    console.log('Data exists:', snapshot.exists());
    console.log('Data:', snapshot.val());
  } catch (error) {
    console.error('❌ Database connection failed:', error);
  }
};

// Call it when the component loads
useEffect(() => {
  testDatabaseConnection();
}, []);
```

Check the console for the results.

## Step 7: Verify Firebase Configuration

Check your `.env` file has ALL required variables:

```bash
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_DATABASE_URL=...     ← ESPECIALLY THIS ONE!
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

**After changing .env:**
1. Stop the dev server (Ctrl+C)
2. Restart it: `npm run dev`

## Step 8: Check Firebase Project

Are you looking at the CORRECT Firebase project?

1. In Firebase Console, check the project name at the top
2. In your code, check `VITE_FIREBASE_PROJECT_ID` in `.env`
3. **Do they match?**

## Common Issues & Solutions

### Issue: "Database not enabled"

**Solution:**
- Go to Firebase Console → Realtime Database
- Click "Create Database"

### Issue: "CORS error" or "Network error"

**Solution:**
- Check your internet connection
- Verify the database URL is correct
- Check if Firebase services are down: https://status.firebase.google.com

### Issue: "User not found" error

**Solution:**
- The user doesn't exist in the database
- Follow Step 5 above to add it manually

### Issue: Rules show "null" or error

**Solution:**
- Database might not be initialized
- Create the database first (Step 2)

## Quick Checklist

Run through this checklist:

- [ ] Realtime Database is created in Firebase Console
- [ ] Database URL in `.env` is correct
- [ ] All environment variables are set
- [ ] Dev server was restarted after changing `.env`
- [ ] Security rules are published (even if open)
- [ ] User data exists at `/users/ifzalkola` in database
- [ ] User exists in Firebase Authentication
- [ ] UIDs match between Auth and Database
- [ ] Browser console shows the actual error

## Next Steps

After going through these steps, if you still have issues:

1. Share the **exact error message** from browser console
2. Share a screenshot of your Firebase Realtime Database Data tab
3. Share a screenshot of your Firebase Realtime Database Rules tab
4. Confirm your database URL format

---

**Most Common Solution:**
90% of the time, the issue is that the Realtime Database hasn't been created yet. Go to Firebase Console → Realtime Database and click "Create Database"!
