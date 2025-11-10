# Setup Guide

This guide will help you set up the Lighthouse Tracker application with Firebase.

## Prerequisites

- Node.js 18.17 or later installed
- A Google account for Firebase
- Git (for cloning the repository)

## Step-by-Step Setup

### 1. Clone and Install

```bash
git clone https://github.com/RuiRafael11/Lighthouse-Tracker.git
cd Lighthouse-Tracker
npm install
```

### 2. Create a Firebase Project

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or "Create a project"
3. Enter a project name (e.g., "lighthouse-tracker")
4. Follow the setup wizard (Google Analytics is optional)
5. Click "Create project"

### 3. Enable Authentication

1. In your Firebase project, click on "Authentication" in the left sidebar
2. Click "Get started"
3. Go to the "Sign-in method" tab
4. Click on "Google"
5. Toggle the "Enable" switch
6. Select a support email (your email)
7. Click "Save"

### 4. Create Firestore Database

1. In your Firebase project, click on "Firestore Database" in the left sidebar
2. Click "Create database"
3. Choose "Start in test mode" (for development)
   - Note: For production, you'll want to update the security rules
4. Select a location closest to your users
5. Click "Enable"

### 5. Get Firebase Configuration

1. In your Firebase project, click on the gear icon (⚙️) next to "Project Overview"
2. Click "Project settings"
3. Scroll down to "Your apps"
4. Click on the web icon (</>) to create a web app
5. Enter an app nickname (e.g., "lighthouse-tracker-web")
6. Click "Register app"
7. Copy the Firebase configuration object

### 6. Configure Environment Variables

1. In the project root, copy the example file:
   ```bash
   cp .env.local.example .env.local
   ```

2. Open `.env.local` and replace the placeholder values with your Firebase config:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=your_actual_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   ```

### 7. Run the Application

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 8. Test the Application

1. Click "Go to Dashboard" on the homepage
2. You'll be redirected to the login page
3. Click "Sign in with Google"
4. Authorize the application
5. You'll be redirected to the dashboard
6. Try adding a URL (e.g., https://example.com)
7. The URL should appear in the list below

## Troubleshooting

### "Firebase: Error (auth/invalid-api-key)"
- Make sure you've created a `.env.local` file with your actual Firebase credentials
- Restart the dev server after changing environment variables

### "Firebase: Error (auth/unauthorized-domain)"
- In Firebase Console, go to Authentication > Settings > Authorized domains
- Add `localhost` to the list

### Google Sign-in popup doesn't appear
- Check if pop-ups are blocked in your browser
- Try signing in using a different browser

### Firestore permission denied
- Make sure your Firestore is in test mode or update security rules
- Test mode rules allow read/write for 30 days

## Production Deployment

Before deploying to production:

1. Update Firestore security rules:
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /sites/{site} {
         allow read, write: if request.auth != null;
       }
     }
   }
   ```

2. Add your production domain to Firebase authorized domains
3. Set environment variables in your hosting platform
4. Build the application: `npm run build`
5. Deploy using your preferred platform (Vercel, Netlify, etc.)

## Support

If you encounter issues, please check:
- Firebase Console for any error messages
- Browser console for client-side errors
- Terminal for server-side errors
