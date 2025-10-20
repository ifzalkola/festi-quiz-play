/**
 * Script to create a new user with Firebase Auth and Database entry
 * 
 * This is a helper script for creating users programmatically.
 * 
 * Usage:
 *   node scripts/create-user.js <userId> <email> <password> <role>
 * 
 * Example:
 *   node scripts/create-user.js john_doe john@example.com password123 user
 */

const admin = require('firebase-admin');

// Path to your Firebase service account key
const serviceAccountPath = './firebase-service-account.json';

// Firebase configuration
const config = {
  databaseURL: process.env.VITE_FIREBASE_DATABASE_URL || 'https://your-project.firebaseio.com'
};

// Parse command line arguments
const args = process.argv.slice(2);
if (args.length < 4) {
  console.error('Usage: node scripts/create-user.js <userId> <email> <password> <role>');
  console.error('Example: node scripts/create-user.js john_doe john@example.com password123 user');
  process.exit(1);
}

const [userId, email, password, role] = args;

// Validate role
if (!['admin', 'user'].includes(role)) {
  console.error('Error: Role must be either "admin" or "user"');
  process.exit(1);
}

// Default permissions based on role
const defaultPermissions = role === 'admin' ? {
  canCreateRooms: true,
  canJoinRooms: true,
  canManageUsers: true,
  canDeleteRooms: true
} : {
  canCreateRooms: true,
  canJoinRooms: true,
  canManageUsers: false,
  canDeleteRooms: false
};

async function createUser() {
  try {
    // Initialize Firebase Admin
    const serviceAccount = require(serviceAccountPath);
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: config.databaseURL
    });

    console.log('✓ Firebase Admin initialized');

    // Check if user ID already exists in database
    const db = admin.database();
    const userRef = db.ref(`users/${userId}`);
    const snapshot = await userRef.once('value');

    if (snapshot.exists()) {
      console.error('❌ Error: User ID already exists in database');
      process.exit(1);
    }

    // Create user in Firebase Auth
    let authUser;
    try {
      authUser = await admin.auth().createUser({
        email,
        password,
        displayName: userId
      });
      console.log('✓ Created user in Firebase Auth:', authUser.uid);
    } catch (error) {
      if (error.code === 'auth/email-already-exists') {
        console.error('❌ Error: Email already exists in Firebase Auth');
        process.exit(1);
      }
      throw error;
    }

    // Create user in database
    await userRef.set({
      uid: authUser.uid,
      userId,
      email,
      role,
      permissions: defaultPermissions,
      createdAt: new Date().toISOString()
    });
    console.log('✓ Created user in database');

    console.log('\n========================================');
    console.log('🎉 User created successfully!');
    console.log('========================================');
    console.log('User ID:', userId);
    console.log('Email:', email);
    console.log('Role:', role);
    console.log('Auth UID:', authUser.uid);
    console.log('========================================\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating user:', error);
    process.exit(1);
  }
}

// Run the creation
createUser();
