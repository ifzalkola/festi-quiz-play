# How to Create Admin User in Firebase Console

## Step 1: Create Authentication User

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click **Authentication** in the left menu
4. Click **Users** tab
5. Click **Add user** button
6. Fill in:
   - **Email**: `admin@quiz.app`
   - **Password**: `admin123`
7. Click **Add user**
8. **IMPORTANT**: Copy the **UID** that appears in the user list (you'll need this in Step 2)

## Step 2: Create Database Entry

1. In the same Firebase Console, click **Realtime Database** in the left menu
2. You should see your database URL at the top
3. Click on the root node (database name)
4. Click the **"+"** icon to add a child node
5. Enter name: `users`
6. Click the **"+"** icon on the `users` node
7. Enter name: `ifzalkola`
8. Click the **"+"** icon on the `ifzalkola` node
9. Add these fields one by one (click "+" for each):

   | Field | Type | Value |
   |-------|------|-------|
   | uid | String | PASTE THE UID YOU COPIED FROM STEP 1 |
   | userId | String | ifzalkola |
   | email | String | admin@quiz.app |
   | role | String | admin |
   | createdAt | String | 2025-10-20T00:00:00.000Z |

10. For the `permissions` object, click "+" on the `ifzalkola` node:
    - Name: `permissions`
    - Then click "+" on `permissions` and add these boolean fields:
      - `canCreateRooms`: true
      - `canJoinRooms`: true
      - `canManageUsers`: true
      - `canDeleteRooms`: true

Your final structure should look like:
```
users/
  ifzalkola/
    uid: "abc123xyz..." (your actual UID)
    userId: "ifzalkola"
    email: "admin@quiz.app"
    role: "admin"
    permissions/
      canCreateRooms: true
      canJoinRooms: true
      canManageUsers: true
      canDeleteRooms: true
    createdAt: "2025-10-20T00:00:00.000Z"
```

## Step 3: Login

1. Go to your app URL
2. You'll be redirected to `/login`
3. Enter:
   - **User ID**: `ifzalkola`
   - **Password**: `admin123`
4. Click **Sign In**
5. You're now logged in as admin!

## Creating More Users

Once logged in as admin:

1. Go to Admin Dashboard (`/admin`)
2. Click "Create User"
3. Fill in:
   - User ID (e.g., john_doe)
   - Email (e.g., john@example.com) 
   - Password (minimum 6 characters)
4. Click "Create User"
5. Done! User is created automatically in both Firebase Auth and Database
6. The new user can now login immediately

## Important Notes

- ✅ Email is **required** for all users
- ✅ All users are created as **admin** with full permissions
- ✅ The default admin user `ifzalkola` cannot be deleted
- ✅ Users are **automatically created** in both Firebase Auth and Database - no manual steps needed!
- ✅ If email is already in use, you'll get an error message
