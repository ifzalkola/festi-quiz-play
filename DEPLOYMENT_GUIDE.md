# 🚀 Deployment Guide

## Prerequisites Checklist

Before deploying, ensure you have:

- ✅ Firebase project created
- ✅ Realtime Database enabled in Firebase
- ✅ Firebase configuration values ready
- ✅ GitHub repository set up
- ✅ All code committed to main/master branch

## Step-by-Step Deployment

### 1. Firebase Setup

1. **Create Firebase Project:**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Click "Add project"
   - Follow the setup wizard

2. **Enable Realtime Database:**
   - In Firebase Console, go to "Build" → "Realtime Database"
   - Click "Create Database"
   - Choose your preferred location
   - Start in **"Test Mode"** (you can update rules later)

3. **Get Configuration Values:**
   - Go to Project Settings (gear icon)
   - Scroll to "Your apps" section
   - Click the web icon `</>` to add a web app
   - Register your app
   - Copy the configuration object

### 2. Configure GitHub Secrets

1. **Navigate to Repository Settings:**
   ```
   https://github.com/ifzalkola/festi-quiz-play/settings/secrets/actions
   ```

2. **Add the following secrets** (click "New repository secret" for each):

   | Secret Name | Value Source |
   |------------|--------------|
   | `VITE_FIREBASE_API_KEY` | Firebase Config → apiKey |
   | `VITE_FIREBASE_AUTH_DOMAIN` | Firebase Config → authDomain |
   | `VITE_FIREBASE_DATABASE_URL` | Firebase Config → databaseURL |
   | `VITE_FIREBASE_PROJECT_ID` | Firebase Config → projectId |
   | `VITE_FIREBASE_STORAGE_BUCKET` | Firebase Config → storageBucket |
   | `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase Config → messagingSenderId |
   | `VITE_FIREBASE_APP_ID` | Firebase Config → appId |

   **Example Firebase Config:**
   ```javascript
   {
     apiKey: "AIzaSyDOCAbC123dEf456GhI789jKl012-MnO",
     authDomain: "myapp-12345.firebaseapp.com",
     databaseURL: "https://myapp-12345-default-rtdb.firebaseio.com",
     projectId: "myapp-12345",
     storageBucket: "myapp-12345.appspot.com",
     messagingSenderId: "123456789012",
     appId: "1:123456789012:web:abc123def456ghi789jkl"
   }
   ```

### 3. Enable GitHub Pages

1. **Go to Repository Settings:**
   ```
   https://github.com/ifzalkola/festi-quiz-play/settings/pages
   ```

2. **Configure Pages:**
   - Under "Source", select: **GitHub Actions**
   - Save

### 4. Deploy

1. **Trigger Deployment:**
   
   **Option A - Push to main:**
   ```bash
   git add .
   git commit -m "Deploy to GitHub Pages"
   git push origin main
   ```

   **Option B - Manual trigger:**
   - Go to "Actions" tab on GitHub
   - Select "Deploy to GitHub Pages" workflow
   - Click "Run workflow"

2. **Monitor Deployment:**
   - Go to the "Actions" tab
   - Click on the running workflow
   - Watch the build and deploy steps

3. **Access Your App:**
   - Once deployed, visit:
   ```
   https://ifzalkola.github.io/festi-quiz-play/
   ```

## Firebase Security Rules (Production)

Before going live, update your Firebase Realtime Database rules:

1. Go to Firebase Console → Realtime Database → Rules
2. Update with these rules:

```json
{
  "rules": {
    "rooms": {
      "$roomId": {
        ".read": true,
        ".write": "!data.exists() || data.child('ownerId').val() === auth.uid"
      }
    },
    "players": {
      "$playerId": {
        ".read": true,
        ".write": "!data.exists() || data.child('userId').val() === auth.uid"
      }
    },
    "currentQuestions": {
      "$roomId": {
        ".read": true,
        ".write": "root.child('rooms').child($roomId).child('ownerId').val() === auth.uid"
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

**Note:** For quick setup, you can use permissive test rules, but add proper authentication for production.

## Troubleshooting

### Deployment Fails

**Check GitHub Actions Logs:**
1. Go to Actions tab
2. Click on failed workflow
3. Expand failed steps to see errors

**Common Issues:**
- Missing or incorrect GitHub secrets
- Firebase configuration errors
- Build errors (check lint/TypeScript issues)

**Solutions:**
- Verify all 7 secrets are added correctly
- Double-check Firebase config values
- Run `npm run build` locally to test

### Site Not Loading

**Issue:** Blank page or errors after deployment

**Solutions:**
1. Check browser console for errors
2. Verify Firebase credentials are correct
3. Ensure Firebase Realtime Database is enabled
4. Check database rules allow reads/writes

### Firebase Connection Errors

**Issue:** "Firebase not initialized" or connection errors

**Solutions:**
1. Verify all environment variables are set in GitHub secrets
2. Check Firebase project is active
3. Ensure Realtime Database is created
4. Check database URL is correct (includes region)

## Local Development

For local testing with Firebase:

1. **Create `.env` file:**
   ```bash
   cp .env.example .env
   ```

2. **Fill in values from Firebase Console**

3. **Run development server:**
   ```bash
   npm run dev
   ```

4. **Test locally at:**
   ```
   http://localhost:8080
   ```

## Updating the App

1. **Make your changes**
2. **Test locally:**
   ```bash
   npm run dev
   ```
3. **Build to verify:**
   ```bash
   npm run build
   ```
4. **Commit and push:**
   ```bash
   git add .
   git commit -m "Your update message"
   git push origin main
   ```
5. **Automatic deployment** will trigger

## Custom Domain (Optional)

To use a custom domain:

1. **Add CNAME file** to `public/` folder:
   ```
   yourdomain.com
   ```

2. **Configure DNS** at your domain registrar:
   - Add CNAME record pointing to: `ifzalkola.github.io`
   - Or A records to GitHub Pages IPs

3. **Update GitHub Pages settings:**
   - Go to Settings → Pages
   - Enter your custom domain
   - Enable "Enforce HTTPS"

## Support

If you encounter issues:
1. Check the [README.md](./README.md) troubleshooting section
2. Review [GitHub Actions logs](https://github.com/ifzalkola/festi-quiz-play/actions)
3. Check [Firebase documentation](https://firebase.google.com/docs)

---

Happy deploying! 🎉
