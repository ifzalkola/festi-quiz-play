# 🎯 Festi Quiz Play

A real-time multiplayer quiz application with Firebase backend and GitHub Pages deployment.

[![Deploy to GitHub Pages](https://github.com/ifzalkola/festi-quiz-play/actions/workflows/deploy.yml/badge.svg)](https://github.com/ifzalkola/festi-quiz-play/actions/workflows/deploy.yml)

## ✨ Features

### Core Functionality
- 🔐 **Firebase Authentication** - Secure login with custom user management and role-based permissions
- 👤 **User Management** - Admin-managed users with granular permission controls
- 🎮 **Create & Join Rooms** - Host creates quiz rooms with unique 6-character codes, players join instantly
- 📝 **Multiple Question Types** - True/False, Multiple Choice, and Text Input questions
- 🏆 **Advanced Scoring** - Three modes: Time-based, Order-based, and First-only
- 👥 **Real-time Updates** - Live player tracking, instant score updates via Firebase Realtime Database
- 🔥 **Firebase Integration** - Fully integrated with real-time synchronization (no mock code)
- 📱 **Responsive Design** - Beautiful UI with Tailwind CSS and shadcn/ui components
- 🚀 **Auto Deployment** - GitHub Actions workflow for seamless GitHub Pages deployment

### Authentication & Authorization
- 🔑 **Email/Password Authentication** - Secure Firebase Authentication
- 👑 **Admin System** - Default admin user with full permissions
- 🎯 **Role-Based Access** - Admin and User roles with custom permissions
- ⚙️ **Granular Permissions** - Control who can create rooms, join rooms, manage users, and delete rooms
- 🛡️ **Protected Routes** - All pages require authentication
- 📊 **Admin Dashboard** - Comprehensive user management interface

### Complete Pages (11)
1. **Login** - Secure user authentication
2. **Admin Dashboard** - User management and permissions
3. **Home** - Landing page with features showcase
4. **Create Room** - Host creates quiz rooms
5. **Join Room** - Players join with codes
6. **Room Dashboard** - Host manages questions before quiz
7. **Player Lobby** - Players wait for quiz to start
8. **Quiz Control** - Host controls live quiz session
9. **Play Quiz** - Players answer questions in real-time
10. **Leaderboard** - Final results with confetti celebration
11. **404 Page** - Custom not found page

### Host Features
- ✅ Create quiz rooms with custom settings
- ✅ Add/edit/delete questions
- ✅ Publish rooms to allow joins
- ✅ Control live quiz flow
- ✅ Publish questions one by one
- ✅ Configure points, time limits, and scoring modes per question
- ✅ See live answers from all players
- ✅ Real-time statistics and leaderboard
- ✅ Manual quiz ending

### Player Features
- ✅ Join rooms with simple codes
- ✅ Wait in lobby with other players
- ✅ Auto-redirect when quiz starts
- ✅ Answer questions with timer
- ✅ Real-time feedback on submissions
- ✅ See final rankings and scores
- ✅ Share results

### Scoring Modes
1. **Time-based** - Faster answers earn more points
2. **Order-based** - 1st/2nd/3rd place get different point multipliers
3. **First-only** - Only the first correct answer earns points

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Firebase project ([Create one here](https://console.firebase.google.com/))
- GitHub account (for deployment)

### Local Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/ifzalkola/festi-quiz-play.git
   cd festi-quiz-play
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up Firebase:**
   
   Create a `.env` file in the root directory:
   ```bash
   cp .env.example .env
   ```
   
   Fill in your Firebase configuration (get from Firebase Console → Project Settings):
   ```env
   VITE_FIREBASE_API_KEY=your_api_key_here
   VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
   VITE_FIREBASE_DATABASE_URL=https://your_project_id-default-rtdb.firebaseio.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

4. **Enable Firebase Services:**
   
   **a) Enable Firebase Authentication:**
   - Go to Firebase Console → Build → Authentication
   - Click "Get Started"
   - Enable "Email/Password" sign-in method
   
   **b) Enable Firebase Realtime Database:**
   - Go to Firebase Console → Build → Realtime Database
   - Click "Create Database"
   - Choose a location
   - Start in "Test Mode" (update rules before production)
   
   **c) Set up Security Rules:**
   - Go to Firebase Console → Realtime Database → Rules
   - Copy the security rules from the "Firebase Security Rules" section below
   - Paste them in the rules editor
   - Click "Publish"

5. **Create Default Admin User:**
   
   **In Firebase Console (Authentication):**
   - Go to Firebase Console → Authentication → Users
   - Click "Add user"
   - Email: `admin@quiz.app`
   - Password: `admin123`
   - Click "Add user"
   
   **In Firebase Console (Realtime Database):**
   - Go to Realtime Database
   - Click on the root node
   - Click the "+" icon to add a child
   - Name: `users`
   - Click the "+" icon on `users` to add a child
   - Name: `ifzalkola`
   - Add the following structure:
   ```json
   {
     "uid": "PASTE_THE_UID_FROM_AUTH_HERE",
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
   ```
   - Replace `PASTE_THE_UID_FROM_AUTH_HERE` with the UID from the Authentication user you just created
   
   📖 **See `ADMIN_USER_SETUP.md` for detailed step-by-step instructions**
   
   ⚠️ **Note:** You only need to create the default admin user manually. All other users can be created directly from the Admin Dashboard in the app!

6. **Run the development server:**
   ```bash
   npm run dev
   ```
   
   Open [http://localhost:8080](http://localhost:8080)

7. **First Login:**
   - Navigate to the app (you'll be redirected to `/login`)
   - Use default admin credentials:
     - **User ID:** `ifzalkola`
     - **Password:** `admin123`
   - Click "Sign In"
   - ⚠️ **IMPORTANT:** Change the password after first login!
   - Go to Admin Dashboard (`/admin`) to create more users

## 🌐 GitHub Pages Deployment

### Automatic Deployment (via GitHub Actions)

The app auto-deploys to GitHub Pages on every push to main/master.

**Setup Steps:**

1. **Add Firebase secrets to GitHub:**
   - Go to your repository on GitHub
   - Settings → Secrets and variables → Actions → New repository secret
   - Add these secrets (from your `.env` file):
     - `VITE_FIREBASE_API_KEY`
     - `VITE_FIREBASE_AUTH_DOMAIN`
     - `VITE_FIREBASE_DATABASE_URL`
     - `VITE_FIREBASE_PROJECT_ID`
     - `VITE_FIREBASE_STORAGE_BUCKET`
     - `VITE_FIREBASE_MESSAGING_SENDER_ID`
     - `VITE_FIREBASE_APP_ID`

2. **Enable GitHub Pages:**
   - Go to Settings → Pages
   - Under "Source", select **GitHub Actions**

3. **Deploy:**
   - Push to main/master branch
   - The GitHub Actions workflow will automatically build and deploy
   - Visit: `https://ifzalkola.github.io/festi-quiz-play/`

### Manual Build

```bash
npm run build
```

Output will be in the `dist/` folder.

## 🎮 How to Use

### As an Admin:

1. Log in with admin credentials (User ID: `ifzalkola`)
2. Go to **Admin Dashboard** (`/admin`)
3. Create user accounts for hosts and players
4. Assign appropriate permissions:
   - Create Rooms: Allow user to host quizzes
   - Join Rooms: Allow user to participate
   - Manage Users: Admin permission
   - Delete Rooms: Permission to delete quiz rooms
5. Users can now log in and use the platform

### As a Quiz Host:

1. Log in with your credentials
2. Click **"Create Room"**
3. Enter room name, your name, and max players
4. Add questions using the question manager
5. Click **"Publish Room"** to allow players to join
6. Share the **room code** with players
7. Start the quiz when ready
8. Publish questions one by one
9. View live answers and scores

### As a Player:

1. Log in with your credentials
2. Click **"Join Room"**
3. Enter the **room code** from the host
4. Enter your name
5. Wait in the lobby for the quiz to start
6. Answer questions as they appear
7. View your score and ranking in real-time

## 📁 Project Structure

```
src/
├── components/
│   ├── quiz/              # Quiz-specific components
│   │   ├── PlayerList.tsx
│   │   └── QuestionManager.tsx
│   ├── ui/                # Reusable UI components (shadcn/ui)
│   └── ProtectedRoute.tsx # Authentication guard component
├── contexts/
│   ├── AuthContext.tsx    # Authentication & user management
│   └── QuizContext.tsx    # Firebase integration & state management
├── lib/
│   ├── firebase.ts        # Firebase initialization (Auth + Database)
│   └── utils.ts           # Utility functions
├── pages/
│   ├── Login.tsx          # Authentication page
│   ├── AdminDashboard.tsx # User management dashboard
│   ├── Index.tsx          # Home page
│   ├── CreateRoom.tsx     # Room creation
│   ├── JoinRoom.tsx       # Join room with code
│   ├── RoomDashboard.tsx  # Host dashboard
│   ├── PlayerLobby.tsx    # Player waiting room
│   ├── QuizControl.tsx    # Host quiz control
│   ├── PlayQuiz.tsx       # Player quiz interface
│   └── Leaderboard.tsx    # Results page
└── App.tsx                # Main app component with auth
```

## 🔐 Firebase Security Rules

For production, update your Realtime Database rules:

1. Go to Firebase Console → Realtime Database → Rules
2. Replace the existing rules with:

```json
{
  "rules": {
    "users": {
      ".read": "auth != null",
      "$userId": {
        ".write": "auth != null"
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

3. Click "Publish"

## 🛠️ Tech Stack

- **Frontend:** React 18, TypeScript, Vite
- **Styling:** Tailwind CSS, shadcn/ui
- **Authentication:** Firebase Authentication
- **Database:** Firebase Realtime Database
- **Routing:** React Router v6
- **State:** React Context API
- **Deployment:** GitHub Pages, GitHub Actions
- **Build:** Vite

## 📝 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run deploy` - Build and prepare for deployment

## 🐛 Troubleshooting

### Authentication Issues
- **"User not found"**: Ensure user exists in both Firebase Auth and Database with matching email
- **"Permission denied"**: All users are admin, check Firebase security rules
- **Cannot login**: Verify the user exists in Firebase Authentication
- **Database UID mismatch**: Make sure the `uid` in database matches the UID in Firebase Auth

### Firebase Connection Issues
- Verify all environment variables are set correctly
- Ensure both Authentication and Realtime Database are enabled
- Check that database rules are properly configured (see Firebase Security Rules section)
- Make sure the security rules require authentication

### Build Fails
- Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Check that all Firebase env vars are present
- Ensure TypeScript has no errors: `npm run lint`

### GitHub Pages Deployment Fails
- Verify GitHub secrets are added correctly
- Check GitHub Actions logs in the "Actions" tab
- Ensure GitHub Pages is enabled and source is set to "GitHub Actions"

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 📚 Creating Additional Users

After logging in as admin:

1. Go to Admin Dashboard (`/admin`)
2. Click "Create User"
3. Fill in:
   - User ID (e.g., john_doe)
   - Email (e.g., john@example.com)
   - Password (minimum 6 characters)
4. Click "Create User"
5. Done! User is automatically created in both Firebase Auth and Database
6. The new user can now login with their User ID and password

## 🔒 Default Admin Credentials

```
User ID: ifzalkola
Password: admin123
```

⚠️ **IMPORTANT:** Change this password immediately after first login!

## 🙏 Acknowledgments

- Built with [Vite](https://vitejs.dev/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Icons from [Lucide](https://lucide.dev/)
- Authentication & Database by [Firebase](https://firebase.google.com/)

---

Made with ❤️ for quiz enthusiasts everywhere!
