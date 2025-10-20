/**
 * Script to initialize the default admin user
 * 
 * This script should be run ONCE when setting up the application.
 * It requires Firebase Admin SDK to be installed and configured.
 * 
 * Usage:
 *   1. Install firebase-admin: npm install firebase-admin
 *   2. Download your Firebase service account key JSON from Firebase Console
 *   3. Set the path in serviceAccountPath below
 *   4. Run: node scripts/init-admin.js
 */

const admin = require('firebase-admin');

// Path to your Firebase service account key
// Download from: Firebase Console > Project Settings > Service Accounts > Generate New Private Key
const serviceAccountPath = './firebase-service-account.json';

// Firebase configuration
// Get these values from your Firebase Console > Project Settings
const config = {
  databaseURL: process.env.VITE_FIREBASE_DATABASE_URL || 'https://your-project.firebaseio.com'
};

// Default admin user configuration
const defaultAdmin = {
  userId: 'ifzalkola',
  email: 'admin@quiz.app',
  password: 'admin123', // CHANGE THIS AFTER FIRST LOGIN!
  role: 'admin',
  permissions: {
    canCreateRooms: true,
    canJoinRooms: true,
    canManageUsers: true,
    canDeleteRooms: true
  }
};

async function initializeDefaultAdmin() {
  try {
    // Initialize Firebase Admin
    const serviceAccount = require(serviceAccountPath);
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: config.databaseURL
    });

    console.log('✓ Firebase Admin initialized');

    // Check if admin user already exists in Auth
    let authUser;
    try {
      authUser = await admin.auth().getUserByEmail(defaultAdmin.email);
      console.log('✓ Admin user already exists in Firebase Auth:', authUser.uid);
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        // Create new auth user
        authUser = await admin.auth().createUser({
          email: defaultAdmin.email,
          password: defaultAdmin.password,
          displayName: 'System Admin'
        });
        console.log('✓ Created admin user in Firebase Auth:', authUser.uid);
      } else {
        throw error;
      }
    }

    // Check if admin user exists in database
    const db = admin.database();
    const userRef = db.ref(`users/${defaultAdmin.userId}`);
    const snapshot = await userRef.once('value');

    if (snapshot.exists()) {
      // Update existing user
      await userRef.update({
        uid: authUser.uid,
        lastUpdated: new Date().toISOString()
      });
      console.log('✓ Updated admin user in database');
    } else {
      // Create new user in database
      await userRef.set({
        uid: authUser.uid,
        userId: defaultAdmin.userId,
        email: defaultAdmin.email,
        role: defaultAdmin.role,
        permissions: defaultAdmin.permissions,
        createdAt: new Date().toISOString()
      });
      console.log('✓ Created admin user in database');
    }

    console.log('\n========================================');
    console.log('🎉 Default admin user setup complete!');
    console.log('========================================');
    console.log('User ID:', defaultAdmin.userId);
    console.log('Email:', defaultAdmin.email);
    console.log('Password:', defaultAdmin.password);
    console.log('========================================');
    console.log('⚠️  IMPORTANT: Change the password after first login!');
    console.log('========================================\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error initializing admin user:', error);
    process.exit(1);
  }
}

// Run the initialization
initializeDefaultAdmin();
