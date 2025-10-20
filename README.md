# 🎯 Festi Quiz Play

A real-time multiplayer quiz application with Firebase backend and GitHub Pages deployment.

[![Deploy to GitHub Pages](https://github.com/ifzalkola/festi-quiz-play/actions/workflows/deploy.yml/badge.svg)](https://github.com/ifzalkola/festi-quiz-play/actions/workflows/deploy.yml)

## ✨ Features

- 🎮 **Create & Join Rooms** - Host creates quiz rooms with unique codes, players join instantly
- 📝 **Multiple Question Types** - Support for True/False, Multiple Choice, and Text Input
- 🏆 **Advanced Scoring** - Three scoring modes: Time-based, Order-based, and First-only
- 👥 **Real-time Updates** - Live player tracking, instant score updates via Firebase
- 🔥 **Firebase Integration** - Realtime Database for instant synchronization
- 📱 **Responsive Design** - Beautiful UI with Tailwind CSS and shadcn/ui components
- 🚀 **Auto Deployment** - GitHub Actions workflow for seamless GitHub Pages deployment

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

4. **Enable Firebase Realtime Database:**
   - Go to Firebase Console → Build → Realtime Database
   - Click "Create Database"
   - Choose a location
   - Start in "Test Mode" (update rules before production)

5. **Run the development server:**
   ```bash
   npm run dev
   ```
   
   Open [http://localhost:8080](http://localhost:8080)

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

### As a Quiz Host:

1. Click **"Create Room"**
2. Enter room name, your name, and max players
3. Add questions using the question manager
4. Click **"Publish Room"** to allow players to join
5. Share the **room code** with players
6. Start the quiz when ready
7. Publish questions one by one
8. View live answers and scores

### As a Player:

1. Click **"Join Room"**
2. Enter the **room code** from the host
3. Enter your name
4. Wait in the lobby for the quiz to start
5. Answer questions as they appear
6. View your score and ranking in real-time

## 📁 Project Structure

```
src/
├── components/
│   ├── quiz/              # Quiz-specific components
│   │   ├── PlayerList.tsx
│   │   └── QuestionManager.tsx
│   └── ui/                # Reusable UI components (shadcn/ui)
├── contexts/
│   └── QuizContext.tsx    # Firebase integration & state management
├── lib/
│   ├── firebase.ts        # Firebase initialization
│   └── utils.ts           # Utility functions
├── pages/
│   ├── Index.tsx          # Home page
│   ├── CreateRoom.tsx     # Room creation
│   ├── JoinRoom.tsx       # Join room with code
│   ├── RoomDashboard.tsx  # Host dashboard
│   └── PlayerLobby.tsx    # Player waiting room
└── App.tsx                # Main app component
```

## 🔐 Firebase Security Rules

For production, update your Realtime Database rules:

```json
{
  "rules": {
    "rooms": {
      "$roomId": {
        ".read": true,
        ".write": true
      }
    },
    "players": {
      "$playerId": {
        ".read": true,
        ".write": true
      }
    },
    "currentQuestions": {
      "$roomId": {
        ".read": true,
        ".write": true
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

**Note:** These are permissive rules for simplicity. In production, add proper authentication and authorization.

## 🛠️ Tech Stack

- **Frontend:** React 18, TypeScript, Vite
- **Styling:** Tailwind CSS, shadcn/ui
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

### Firebase Connection Issues
- Verify all environment variables are set correctly
- Ensure Realtime Database is enabled in Firebase Console
- Check that database rules allow reads/writes

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

## 🙏 Acknowledgments

- Built with [Vite](https://vitejs.dev/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Icons from [Lucide](https://lucide.dev/)
- Database by [Firebase](https://firebase.google.com/)

---

Made with ❤️ for quiz enthusiasts everywhere!
