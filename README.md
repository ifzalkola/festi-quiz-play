# 🎯 Festi Quiz Play

A real-time multiplayer quiz application built with React, TypeScript, and Firebase.

[![Deploy to GitHub Pages](https://github.com/ifzalkola/festi-quiz-play/actions/workflows/deploy.yml/badge.svg)](https://github.com/ifzalkola/festi-quiz-play/actions/workflows/deploy.yml)

## ✨ Features

- 🔐 **Firebase Authentication** - Secure login with role-based permissions
- 🎮 **Real-time Multiplayer** - Host creates battles, players join with codes
- 📝 **Multiple Question Types** - True/False, Multiple Choice, Text Input
- 🏆 **Advanced Scoring** - Time-based, Order-based, and First-only modes
- 👥 **Live Updates** - Real-time player tracking and score updates
- 📱 **Responsive Design** - Beautiful UI with Tailwind CSS and shadcn/ui
- 🚀 **Auto Deployment** - GitHub Actions workflow for GitHub Pages

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Firebase project ([Create one here](https://console.firebase.google.com/))

### Installation

1. **Clone and install:**
   ```bash
   git clone https://github.com/ifzalkola/festi-quiz-play.git
   cd festi-quiz-play
   npm install
   ```

2. **Configure Firebase:**
   
   Create a `.env` file in the root directory:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key_here
   VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
   VITE_FIREBASE_DATABASE_URL=https://your_project_id-default-rtdb.firebaseio.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

3. **Enable Firebase Services:**
   
   In Firebase Console:
   - Enable **Email/Password** authentication
   - Create a **Realtime Database**
   - Set database rules to require authentication (see Security Rules section below)

4. **Create Admin User:**
   
   **In Firebase Authentication:**
   - Add user with email: `admin@quiz.app`, password: `admin123`
   - Copy the generated UID
   
   **In Realtime Database:**
   - Create a `users/{userId}` node with:
   ```json
   {
     "uid": "YOUR_COPIED_UID_HERE",
     "userId": "userId",
     "email": "admin@quiz.app",
     "role": "admin",
     "permissions": {
       "canCreateBattles": true,
       "canJoinBattles": true,
       "canManageUsers": true,
       "canDeleteBattles": true
     },
     "createdAt": "2025-10-20T00:00:00.000Z"
   }
   ```

5. **Run the app:**
   ```bash
   npm run dev
   ```
   
   Open [http://localhost:8080](http://localhost:8080)


## 🎮 How to Use

### For Quiz Hosts:
1. Login → Create Battle → Add Questions → Publish Battle
2. Share battle code with players
3. Start quiz and publish questions one by one
4. View live answers and scores

### For Players:
1. Login → Join Battle → Enter Battle code
2. Wait in lobby for quiz to start
3. Answer questions as they appear
4. View final results and rankings

## 🔐 Firebase Security Rules

For production, update your Realtime Database rules:

```json
{
  "rules": {
    "users": {
      ".read": "auth != null",
      "$userId": {
        ".write": "auth != null"
      }
    },
    "battles": {
      ".read": "auth != null",
      "$battleId": {
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
      "$battleId": {
        ".write": "auth != null"
      }
    },
    "answers": {
      ".read": "auth != null",
      "$battleId": {
        ".write": "auth != null"
      }
    },
    "roundStatistics": {
      ".read": "auth != null",
      "$battleId": {
        ".write": "auth != null"
      }
    }
  }
}
```

## 🌐 GitHub Pages Deployment

### Setup:

1. **Add Firebase secrets to GitHub:**
   - Go to Repository → Settings → Secrets and variables → Actions
   - Add all `VITE_FIREBASE_*` variables from your `.env` file

2. **Enable GitHub Pages:**
   - Settings → Pages → Source: **GitHub Actions**

3. **Deploy:**
   - Push to main branch
   - Auto-deploys to: `https://yourusername.github.io/festi-quiz-play/`

## 🛠️ Tech Stack

- **Frontend:** React 18, TypeScript, Vite
- **Styling:** Tailwind CSS, shadcn/ui
- **Backend:** Firebase Authentication + Realtime Database
- **Routing:** React Router v6
- **Deployment:** GitHub Pages + GitHub Actions

## 📝 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🐛 Troubleshooting

### Authentication Issues
- Ensure user exists in both Firebase Auth and Database
- Verify UID matches between Auth and Database
- Check Firebase security rules require authentication

### Firebase Connection
- Verify all environment variables are correct
- Ensure Authentication and Realtime Database are enabled
- Check database rules are properly configured

### Deployment Issues
- Verify GitHub secrets are added correctly
- Check GitHub Actions logs
- Ensure GitHub Pages source is set to "GitHub Actions"

## 📚 Creating Additional Users

After logging in as admin:
1. Go to Admin Dashboard (`/admin`)
2. Click "Create User"
3. Fill in User ID, Email, and Password
4. Assign appropriate permissions
5. New user can now login

## 📄 License

MIT License - See [LICENSE](LICENSE) for details

---

Made with ❤️ for quiz enthusiasts
