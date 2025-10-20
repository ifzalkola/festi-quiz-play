# Festi Quiz Play - Setup Guide

A real-time quiz application built with React, TypeScript, Firebase, and deployed to GitHub Pages.

## Features

- 🎮 Create and join quiz rooms with unique codes
- 📝 Multiple question types (True/False, Multiple Choice, Text Input)
- 🏆 Real-time scoring with multiple modes (Time-based, Order-based, First-only)
- 👥 Live player tracking and status updates
- 🔥 Firebase Realtime Database for instant synchronization
- 📱 Responsive design with Tailwind CSS and shadcn/ui

## Prerequisites

- Node.js 18+ and npm
- Firebase project with Realtime Database enabled
- GitHub account (for deployment)

## Firebase Setup

1. Create a new Firebase project at [Firebase Console](https://console.firebase.google.com/)

2. Enable Realtime Database:
   - Go to "Build" → "Realtime Database"
   - Click "Create Database"
   - Choose a location
   - Start in "Test Mode" (update security rules later)

3. Get your Firebase configuration:
   - Go to Project Settings → General
   - Scroll down to "Your apps" section
   - Click the web icon (</>) to add a web app
   - Copy the configuration values

4. Create a `.env` file in the root directory:
   ```bash
   cp .env.example .env
   ```

5. Fill in your Firebase configuration in `.env`:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key_here
   VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
   VITE_FIREBASE_DATABASE_URL=https://your_project_id-default-rtdb.firebaseio.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

## Local Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:8080](http://localhost:8080) in your browser

## GitHub Pages Deployment

### Automatic Deployment (Recommended)

The app automatically deploys to GitHub Pages when you push to the main/master branch.

1. **Configure GitHub Secrets:**
   - Go to your GitHub repository
   - Navigate to Settings → Secrets and variables → Actions
   - Add the following secrets (from your `.env` file):
     - `VITE_FIREBASE_API_KEY`
     - `VITE_FIREBASE_AUTH_DOMAIN`
     - `VITE_FIREBASE_DATABASE_URL`
     - `VITE_FIREBASE_PROJECT_ID`
     - `VITE_FIREBASE_STORAGE_BUCKET`
     - `VITE_FIREBASE_MESSAGING_SENDER_ID`
     - `VITE_FIREBASE_APP_ID`

2. **Enable GitHub Pages:**
   - Go to Settings → Pages
   - Under "Source", select "GitHub Actions"

3. **Deploy:**
   - Push to main/master branch or manually trigger the workflow
   - The workflow will build and deploy automatically
   - Your app will be available at: `https://[username].github.io/festi-quiz-play/`

### Manual Build

To build the project manually:

```bash
npm run build
```

The output will be in the `dist` folder.

## Firebase Security Rules

For production, update your Firebase Realtime Database rules:

```json
{
  "rules": {
    "rooms": {
      "$roomId": {
        ".read": true,
        ".write": "auth != null || !data.exists()"
      }
    },
    "players": {
      "$playerId": {
        ".read": true,
        ".write": "auth != null || !data.exists()"
      }
    },
    "currentQuestions": {
      "$roomId": {
        ".read": true,
        ".write": "auth != null"
      }
    },
    "answers": {
      "$roomId": {
        ".read": true,
        ".write": true
      }
    }
  }
}
```

## Project Structure

```
src/
├── components/
│   ├── quiz/           # Quiz-specific components
│   └── ui/             # Reusable UI components (shadcn/ui)
├── contexts/
│   └── QuizContext.tsx # Firebase integration & state management
├── lib/
│   ├── firebase.ts     # Firebase initialization
│   └── utils.ts        # Utility functions
├── pages/
│   ├── Index.tsx       # Home page
│   ├── CreateRoom.tsx  # Room creation
│   ├── JoinRoom.tsx    # Join room with code
│   ├── RoomDashboard.tsx # Host dashboard
│   └── PlayerLobby.tsx # Player waiting room
└── App.tsx             # Main app component
```

## How to Use

### As a Quiz Host:

1. Click "Create Room"
2. Enter room details and create
3. Add questions using the question manager
4. Click "Publish Room" to allow players to join
5. Share the room code with players
6. Start the quiz when ready

### As a Player:

1. Click "Join Room"
2. Enter the room code provided by the host
3. Enter your name
4. Wait in the lobby for the quiz to start
5. Answer questions as they appear
6. View your score and ranking

## Technologies Used

- **Frontend:** React 18, TypeScript, Vite
- **Styling:** Tailwind CSS, shadcn/ui
- **Database:** Firebase Realtime Database
- **Routing:** React Router v6
- **State Management:** React Context API
- **Deployment:** GitHub Pages, GitHub Actions

## Troubleshooting

### Build fails with Firebase errors
- Ensure all Firebase environment variables are set correctly
- Check that your Firebase project has Realtime Database enabled

### Players can't join room
- Verify Firebase security rules allow writes
- Check that the room is published
- Ensure Firebase is properly initialized

### GitHub Pages deployment fails
- Verify all secrets are added in GitHub repository settings
- Check that GitHub Pages is enabled in repository settings
- Review the Actions tab for error logs

## License

MIT License - feel free to use this project for your own quiz nights!
