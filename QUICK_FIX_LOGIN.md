# Quick Fix: Permission Denied Login Error

If you're getting "Permission denied" when trying to login, follow these steps:

## Immediate Solution

### Step 1: Update Firebase Security Rules

1. **Open Firebase Console**
   - Go to https://console.firebase.google.com
   - Select your project

2. **Navigate to Realtime Database Rules**
   - Click "Realtime Database" in the left menu
   - Click the "Rules" tab

3. **Replace the current rules**
   
   **Option A: Quick Test Rules (Fastest)**
   ```json
   {
     "rules": {
       ".read": "auth != null",
       ".write": "auth != null"
     }
   }
   ```

   **Option B: Production Rules (Recommended)**
   
   Copy the entire contents of `database.rules.json` from this repository and paste it into the rules editor.

4. **Click "Publish"**

### Step 2: Verify Your User Data

Make sure your user exists in **both** places:

#### Firebase Authentication
1. Go to Firebase Console → Authentication → Users
2. Verify you have a user with:
   - Email: `admin@quiz.app` (or your email)
   - UID: Copy this UID, you'll need it!

#### Realtime Database
1. Go to Firebase Console → Realtime Database → Data
2. Navigate to `/users/ifzalkola` (or your userId)
3. Verify the structure looks like this:

```json
{
  "users": {
    "ifzalkola": {
      "uid": "PASTE_YOUR_UID_FROM_AUTH_HERE",
      "userId": "ifzalkola",
      "email": "admin@quiz.app",
      "role": "admin",
      "permissions": {
        "canCreateRooms": true,
        "canJoinRooms": true,
        "canManageUsers": true,
        "canDeleteRooms": true
      },
      "createdAt": "2025-10-20T00:00:00.000Z"
    }
  }
}
```

⚠️ **CRITICAL**: The `uid` in the database MUST match the UID from Firebase Authentication!

### Step 3: Try Logging In Again

1. Open your app
2. Login with:
   - **User ID**: `ifzalkola` (or your custom userId)
   - **Password**: `admin123` (or your password)

## Common Issues

### Issue: Still getting "Permission denied"

**Check:**
- Did you click "Publish" in the Rules tab?
- Wait 10-30 seconds after publishing rules
- Hard refresh your app (Ctrl+Shift+R or Cmd+Shift+R)

### Issue: "User not found"

**Check:**
- User exists in Firebase Authentication
- User exists in Realtime Database at `/users/{userId}`
- The `userId` in database matches the path

### Issue: "Invalid credentials"

**Check:**
- Password is correct (default is `admin123`)
- Email in database matches email in Authentication
- UID in database matches UID in Authentication

## Quick Verification

Run these checks in Firebase Console:

1. **Rules Tab**: Should show your new rules
2. **Authentication Tab**: User should exist
3. **Database Tab**: `/users/ifzalkola` should exist with correct UID

## Need More Help?

1. Check the browser console (F12) for detailed error messages
2. Look at Firebase Console → Realtime Database → Usage tab for denied requests
3. See `FIREBASE_SECURITY_RULES.md` for detailed documentation
4. See `ADMIN_USER_SETUP.md` for step-by-step user creation guide

---

**Quick Summary:**
1. ✅ Update Firebase rules (use `database.rules.simple.json` for testing)
2. ✅ Verify user exists in Authentication
3. ✅ Verify user data exists in Database with matching UID
4. ✅ Try logging in again
