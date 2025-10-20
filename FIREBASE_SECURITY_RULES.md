# Firebase Security Rules Documentation

This document explains the Firebase Realtime Database security rules for the Festi Quiz Play application.

## Table of Contents

1. [Overview](#overview)
2. [Rule Structure](#rule-structure)
3. [Authentication Requirements](#authentication-requirements)
4. [Permission System](#permission-system)
5. [Data Validation](#data-validation)
6. [Security Best Practices](#security-best-practices)

## Overview

The security rules in `database.rules.json` provide comprehensive protection for the application's data by:

- **Requiring authentication** for all operations
- **Enforcing permission-based access control**
- **Validating data structure and types**
- **Protecting ownership and authorization**
- **Preventing unauthorized modifications**

## Rule Structure

The database has five main collections:

```
root/
├── users/           # User accounts with roles and permissions
├── rooms/           # Quiz rooms
├── players/         # Players in quiz rooms
├── currentQuestions/# Active questions per room
└── answers/         # Submitted answers per room
```

---

## Authentication Requirements

### All Collections

**Basic Requirement**: All read and write operations require authentication.

```json
".read": "auth != null"
".write": "auth != null && [additional conditions]"
```

- `auth != null` - User must be logged in with Firebase Authentication
- `auth.uid` - The authenticated user's Firebase UID

---

## Permission System

### Users Collection

**Path**: `/users/{userId}`

**Read Access**: Any authenticated user can read all users

**Write Access**: 
- Users can update their own profile (matching `uid`)
- Admins can create/update any user account

**Rules**:
```json
".write": "auth != null && (
  root.child('users').child($userId).child('uid').val() === auth.uid ||
  root.child('users').child(data.child('userId').val()).child('role').val() === 'admin'
)"
```

**Required Fields**:
- `uid` (string) - Firebase Authentication UID
- `userId` (string) - Custom user ID (must match path)
- `email` (string) - User email
- `role` (string) - Either "admin" or "user"
- `permissions` (object) - Permission flags
  - `canCreateRooms` (boolean)
  - `canJoinRooms` (boolean)
  - `canManageUsers` (boolean)
  - `canDeleteRooms` (boolean)
- `createdAt` (string) - ISO timestamp
- `lastLogin` (string, optional) - ISO timestamp

**Example**:
```json
{
  "users": {
    "john_doe": {
      "uid": "firebase_auth_uid_here",
      "userId": "john_doe",
      "email": "john@example.com",
      "role": "admin",
      "permissions": {
        "canCreateRooms": true,
        "canJoinRooms": true,
        "canManageUsers": true,
        "canDeleteRooms": true
      },
      "createdAt": "2025-10-20T10:00:00.000Z",
      "lastLogin": "2025-10-20T12:00:00.000Z"
    }
  }
}
```

---

### Rooms Collection

**Path**: `/rooms/{roomId}`

**Read Access**: Any authenticated user

**Write Access**:
- New rooms: User must have `canCreateRooms` permission
- Existing rooms: Only the room owner can modify
- Deletion: User must have `canDeleteRooms` permission

**Rules**:
```json
".write": "auth != null && (
  !data.exists() && root.child('users').child(newData.child('ownerId').val()).child('permissions').child('canCreateRooms').val() === true ||
  data.child('ownerId').val() === newData.child('ownerId').val() ||
  root.child('users').child(data.child('ownerId').val()).child('permissions').child('canDeleteRooms').val() === true
)"
```

**Required Fields**:
- `id` (string) - Room ID (must match path)
- `name` (string, 1-100 chars) - Room name
- `code` (string) - 6-character alphanumeric code (uppercase)
- `ownerId` (string, immutable) - User ID of room creator
- `ownerName` (string) - Display name of owner
- `maxPlayers` (number, 1-100) - Maximum players allowed
- `questions` (array or null) - Quiz questions
- `isPublished` (boolean) - Whether room accepts players
- `isStarted` (boolean) - Whether quiz has started
- `isCompleted` (boolean) - Whether quiz has ended
- `currentQuestionIndex` (number, >= -1) - Current question
- `createdAt` (string, immutable) - ISO timestamp

**Validation Examples**:
```json
// Valid room code
"code": "ABC123"  ✓
"code": "abcdef"  ✗ (must be uppercase)
"code": "AB12"    ✗ (must be 6 characters)

// Valid max players
"maxPlayers": 50  ✓
"maxPlayers": 0   ✗ (must be >= 1)
"maxPlayers": 200 ✗ (must be <= 100)
```

---

### Players Collection

**Path**: `/players/{playerId}`

**Read Access**: Any authenticated user

**Write Access**:
- New players: User must have `canJoinRooms` permission
- Existing players: Only the player themselves or room owner
- Updates: Player can update their own data

**Rules**:
```json
".write": "auth != null && (
  !data.exists() && root.child('users').child(newData.child('userId').val()).child('permissions').child('canJoinRooms').val() === true ||
  data.child('userId').val() === newData.child('userId').val() ||
  root.child('rooms').child(data.child('roomId').val()).child('ownerId').val() === newData.child('userId').val()
)"
```

**Required Fields**:
- `id` (string) - Player ID (must match path)
- `name` (string, 1-50 chars) - Display name
- `roomId` (string) - Room ID (must exist in /rooms)
- `score` (number, >= 0) - Current score
- `isReady` (boolean) - Ready status
- `isOnline` (boolean) - Online status
- `joinedAt` (string, immutable) - ISO timestamp
- `userId` (string, immutable) - User ID who joined

**Example**:
```json
{
  "players": {
    "player_abc123": {
      "id": "player_abc123",
      "name": "John Player",
      "roomId": "room_xyz789",
      "score": 150,
      "isReady": true,
      "isOnline": true,
      "joinedAt": "2025-10-20T14:00:00.000Z",
      "userId": "john_doe"
    }
  }
}
```

---

### Current Questions Collection

**Path**: `/currentQuestions/{roomId}`

**Read Access**: Any authenticated user

**Write Access**: Only room owner

**Rules**:
```json
".write": "auth != null && root.child('rooms').child($roomId).child('ownerId').val() === root.child('users').child(auth.uid).child('userId').val()"
```

**Required Fields**:
- `question` (object) - Question data
  - `id` (string) - Question ID
  - `text` (string) - Question text
  - `type` (string) - Question type
  - `correctAnswer` (string/array) - Correct answer(s)
- `basePoints` (number, 1-10000) - Points for correct answer
- `scoringMode` (string) - "time-based", "order-based", or "first-only"
- `timeLimit` (number, 1-300) - Time limit in seconds
- `startedAt` (string) - ISO timestamp when question started

**Scoring Modes**:
- **time-based**: Points decrease with time taken
- **order-based**: 1st place gets full points, 2nd/3rd get reduced
- **first-only**: Only first correct answer gets points

---

### Answers Collection

**Path**: `/answers/{roomId}/{answerId}`

**Read Access**: Any authenticated user

**Write Access**:
- New answers: Any authenticated player in the room
- Existing answers: Only room owner (for deletion/clearing)

**Rules**:
```json
".write": "auth != null && (
  !data.exists() ||
  root.child('rooms').child($roomId).child('ownerId').val() === root.child('users').child(auth.uid).child('userId').val()
)"
```

**Required Fields**:
- `playerId` (string) - Player ID (must exist in /players)
- `playerName` (string) - Display name
- `answer` (string) - Submitted answer
- `timeTaken` (number, >= 0) - Time taken in seconds
- `isCorrect` (boolean) - Whether answer was correct
- `pointsEarned` (number, >= 0) - Points awarded

---

## Data Validation

### Type Validation

All fields have strict type checking:

```json
"field": {
  ".validate": "newData.isString()"    // Must be string
  ".validate": "newData.isNumber()"    // Must be number
  ".validate": "newData.isBoolean()"   // Must be boolean
}
```

### Range Validation

Numeric fields enforce minimum/maximum values:

```json
"maxPlayers": {
  ".validate": "newData.isNumber() && newData.val() >= 1 && newData.val() <= 100"
}
```

### Pattern Validation

String fields can require specific patterns:

```json
"code": {
  ".validate": "newData.isString() && newData.val().matches(/^[A-Z0-9]{6}$/)"
}
```

### Immutable Fields

Certain fields cannot be changed after creation:

```json
"ownerId": {
  ".validate": "newData.isString() && (!data.exists() || newData.val() === data.val())"
}
```

### No Additional Fields

The `$other` rule prevents unknown fields:

```json
"$other": {
  ".validate": false  // Reject any fields not explicitly defined
}
```

---

## Security Best Practices

### ✅ DO

1. **Always authenticate users** before any operation
2. **Check permissions** before allowing actions
3. **Validate all input data** on the server side
4. **Use immutable fields** for critical data (IDs, timestamps, ownership)
5. **Limit data ranges** (string lengths, numeric ranges)
6. **Reject unknown fields** to prevent data pollution

### ❌ DON'T

1. **Never trust client-side data** - Always validate on server
2. **Don't use test mode rules** in production
3. **Don't allow unrestricted writes** to any collection
4. **Don't skip authentication checks**
5. **Don't allow users to modify their own permissions**

### Production Checklist

Before deploying to production:

- [ ] Replace test mode rules with production rules
- [ ] Verify all authentication checks are in place
- [ ] Test permission enforcement for all user roles
- [ ] Validate data structure requirements
- [ ] Test immutable field protection
- [ ] Verify ownership checks for rooms
- [ ] Test that unauthorized fields are rejected
- [ ] Review and test all edge cases

---

## Testing Security Rules

### Firebase Console Testing

1. Go to Firebase Console → Realtime Database → Rules
2. Click on the "Simulator" tab
3. Test read/write operations with different auth states

### Example Tests

**Test 1: Unauthenticated Read (Should Fail)**
```
Location: /users
Read: false
Auth: null
```
Expected: Permission denied

**Test 2: Authenticated Read (Should Pass)**
```
Location: /users
Read: true
Auth: { uid: "test_user_uid" }
```
Expected: Allow

**Test 3: Create Room Without Permission (Should Fail)**
```
Location: /rooms/new_room
Write:
{
  "id": "new_room",
  "ownerId": "user_without_permission"
}
Auth: { uid: "user_uid" }
```
Expected: Permission denied (user lacks canCreateRooms)

**Test 4: User Modifying Own Data (Should Pass)**
```
Location: /users/john_doe
Write:
{
  "lastLogin": "2025-10-20T15:00:00.000Z"
}
Auth: { uid: "johns_firebase_uid" }
```
Expected: Allow (user owns the data)

---

## Troubleshooting

### Common Issues

**Permission Denied Errors**

1. Check if user is authenticated (`auth != null`)
2. Verify user has required permissions in `/users/{userId}/permissions`
3. For room operations, check if user is the owner
4. Ensure all required fields are present

**Validation Failed Errors**

1. Check that all required fields are included
2. Verify data types match the rules
3. Check value ranges (strings, numbers)
4. Remove any extra fields not in the schema

**Update Rejected**

1. Check if field is immutable (can't be changed after creation)
2. Verify you're the owner for ownership-protected data
3. Ensure data structure matches validation rules

---

## Support

For issues or questions:
1. Check the Firebase Console logs
2. Use the Rules Simulator to test specific operations
3. Review the error messages for specific validation failures
4. Refer to [Firebase Security Rules Documentation](https://firebase.google.com/docs/database/security)

---

**Last Updated**: 2025-10-20
